/**
 * LiveKit service for managing voice connections.
 * 
 * This service handles:
 * - Room connection/disconnection
 * - Microphone publishing
 * - Remote participant audio
 * - Connection state management
 */

import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  LocalParticipant,
  ConnectionState,
  RoomConnectOptions,
  DataPacket_Kind,
} from 'livekit-client';

export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'disconnecting';

export interface LiveKitConfig {
  serverUrl: string;
  token: string;
  roomName: string;
}

/** Messages the agent sends over the data channel. */
export type AgentVoiceState = 'listening' | 'thinking' | 'speaking' | 'idle';

export interface VoiceStateMessage {
  type: 'voice_state';
  state: AgentVoiceState;
}

export interface TranscriptMessage {
  type: 'transcript';
  speaker: 'customer' | 'agent' | 'system';
  text: string;
  final: boolean;
}

export interface OrderUpdatedMessage {
  type: 'order_updated';
  order_id: string;
  new_status: string;
}

export interface TranscriptStreamMessage {
  type: 'transcript_stream';
  speaker: 'agent';
  text: string;
  final: boolean;
}

export interface TranscriptFinalizeMessage {
  type: 'transcript_finalize';
  speaker: 'agent';
  text: string;
}

export type AgentDataMessage = VoiceStateMessage | TranscriptMessage | OrderUpdatedMessage | TranscriptStreamMessage | TranscriptFinalizeMessage;

export class LiveKitService {
  private room: Room | null = null;
  private onConnectionStateChange?: (state: ConnectionStatus) => void;
  private onParticipantConnected?: () => void;
  private onTrackSubscribed?: (track: RemoteTrack) => void;
  private onAgentMessage?: (msg: AgentDataMessage) => void;
  private onOrderUpdatedCallback?: (orderId: string, newStatus: string) => void;

  constructor() {
    this.room = null;
  }

  /**
   * Connect to a LiveKit room.
   */
  async connect(config: LiveKitConfig): Promise<Room> {
    // Unlock browser audio during the user-gesture call chain (button click).
    // Without this, Safari and Chrome block the <audio> element autoplay.
    try {
      const ctx = new AudioContext();
      await ctx.resume();
      await ctx.close();
    } catch {
      // non-fatal — best effort
    }

    if (this.room) {
      await this.disconnect();
    }

    this.room = new Room({
      adaptiveStream: true,
      dynacast: false,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Set up event listeners
    this.setupEventListeners();

    // Connection options
    const connectOptions: RoomConnectOptions = {
      autoSubscribe: true,
    };

    try {
      // Connect to the room
      await this.room.connect(config.serverUrl, config.token, connectOptions);

      // Enable microphone
      await this.room.localParticipant.setMicrophoneEnabled(true);

      // Handle the case where the agent was already in the room when we
      // connected — TrackSubscribed only fires for *newly* published tracks,
      // so we must attach any tracks that already exist.
      this.room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track && publication.track.kind === Track.Kind.Audio) {
            this.attachAgentAudio(publication.track as RemoteTrack, participant);
          }
        });
      });

      return this.room;
    } catch (error) {
      console.error('Failed to connect to LiveKit room:', error);
      this.room = null;
      throw error;
    }
  }

  /**
   * Disconnect from the current room.
   */
  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }
  }

  /**
   * Mute the microphone.
   */
  async mute(): Promise<void> {
    if (this.room?.localParticipant) {
      await this.room.localParticipant.setMicrophoneEnabled(false);
    }
  }

  /**
   * Unmute the microphone.
   */
  async unmute(): Promise<void> {
    if (this.room?.localParticipant) {
      await this.room.localParticipant.setMicrophoneEnabled(true);
    }
  }

  /**
   * Get current microphone state.
   */
  isMicrophoneEnabled(): boolean {
    return this.room?.localParticipant.isMicrophoneEnabled ?? false;
  }

  /**
   * Get the current room.
   */
  getRoom(): Room | null {
    return this.room;
  }

  /**
   * Check if currently connected.
   */
  isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected;
  }

  /**
   * Send a text message to the agent via data channel.
   */
  async sendTextMessage(text: string): Promise<void> {
    if (!this.room || !this.isConnected()) {
      throw new Error('Not connected to room');
    }

    const message = {
      type: 'text_input',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));

    await this.room.localParticipant.publishData(data, {
      reliable: true,
      destinationIdentities: [],
    });

    console.log('Text message sent:', text);
  }

  /**
   * Notify the agent that the user muted/unmuted their mic.
   * This lets the agent pause its STT pipeline to prevent hallucinations.
   */
  async sendMicState(muted: boolean): Promise<void> {
    if (!this.room || !this.isConnected()) return;
    const data = new TextEncoder().encode(
      JSON.stringify({ type: 'mic_state', muted }),
    );
    await this.room.localParticipant.publishData(data, { reliable: true });
  }

  /**
   * Attach a remote audio track to a DOM audio element and begin playback.
   * Called both from the TrackSubscribed event and the post-connect scan for
   * participants that were already in the room when we joined.
   */
  private attachAgentAudio(track: RemoteTrack, participant: RemoteParticipant): void {
    const elementId = `aria-audio-${participant.identity}`;
    document.getElementById(elementId)?.remove();

    const element = track.attach();
    element.id = elementId;
    element.setAttribute('autoplay', 'true');
    element.setAttribute('playsinline', 'true');
    // Volume must be explicitly set — some browsers default to 0 for programmatic audio
    element.volume = 1.0;
    document.body.appendChild(element);

    const tryPlay = () => {
      element.play().catch(() => {
        // Autoplay blocked — retry on next user interaction
        const resume = () => {
          void element.play();
          document.removeEventListener('click', resume);
          document.removeEventListener('touchend', resume);
        };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('touchend', resume, { once: true });
      });
    };

    // Small delay to let WebRTC finish setting up the MediaStreamTrack
    setTimeout(tryPlay, 100);

    this.onTrackSubscribed?.(track);
  }

  /**
   * Set up room event listeners.
   */
  private setupEventListeners(): void {
    if (!this.room) return;

    // Connection state changes
    this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      console.log('Room connection state:', state);
      
      const status: ConnectionStatus = (() => {
        switch (state) {
          case ConnectionState.Connected:
            return 'connected';
          case ConnectionState.Connecting:
            return 'connecting';
          case ConnectionState.Reconnecting:
            return 'reconnecting';
          case ConnectionState.Disconnected:
            return 'disconnected';
          default:
            return 'disconnected';
        }
      })();
      
      this.onConnectionStateChange?.(status);
    });

    // Remote participant connected (the Aria agent)
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('Participant connected:', participant.identity);
      this.onParticipantConnected?.();
    });

    // Track subscribed (agent audio)
    this.room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log('Track subscribed:', track.kind, 'from', participant.identity);
        
        if (track.kind === Track.Kind.Audio) {
          this.attachAgentAudio(track, participant);
        }
      }
    );

    // Track unsubscribed
    this.room.on(
      RoomEvent.TrackUnsubscribed,
      (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log('Track unsubscribed:', track.kind);
        const elements = track.detach();
        elements.forEach((el) => el.remove());
      }
    );

    // Data channel — agent state and transcript messages
    this.room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload)) as AgentDataMessage;
        if (
          msg.type === 'voice_state' ||
          msg.type === 'transcript' ||
          msg.type === 'transcript_stream' ||
          msg.type === 'transcript_finalize' ||
          msg.type === 'order_updated'
        ) {
          this.onAgentMessage?.(msg);
          if (msg.type === 'order_updated') {
            this.onOrderUpdatedCallback?.(msg.order_id, msg.new_status);
          }
        }
      } catch {
        // ignore malformed packets
      }
    });

    // Disconnected
    this.room.on(RoomEvent.Disconnected, (reason?: any) => {
      console.log('Disconnected from room:', reason);
      this.onConnectionStateChange?.('disconnected');
    });
  }

  /**
   * Register callback for connection state changes.
   */
  onStateChange(callback: (state: ConnectionStatus) => void): void {
    this.onConnectionStateChange = callback;
  }

  /**
   * Register callback for participant connection.
   */
  onAgentConnected(callback: () => void): void {
    this.onParticipantConnected = callback;
  }

  /**
   * Register callback for track subscription.
   */
  onAudioTrack(callback: (track: RemoteTrack) => void): void {
    this.onTrackSubscribed = callback;
  }

  /**
   * Register callback for agent data-channel messages (voice state + transcript).
   */
  onData(callback: (msg: AgentDataMessage) => void): void {
    this.onAgentMessage = callback;
  }

  /**
   * Register callback for order updates (e.g. cancellation confirmed).
   */
  onOrderUpdated(callback: (orderId: string, newStatus: string) => void): void {
    this.onOrderUpdatedCallback = callback;
  }
}

// Singleton instance
export const livekitService = new LiveKitService();
