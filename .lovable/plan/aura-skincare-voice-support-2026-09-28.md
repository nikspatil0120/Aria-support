# Aura Skincare Voice Support

## Goal
Build a polished, frontend-only customer support application where customers can speak with Aria, follow visual call states, review a supporting transcript, inspect order references, and see a post-call summary.

## Experience
- Create a warm premium skincare visual system with ivory surfaces, botanical green accents, charcoal typography, gentle borders, and restrained motion.
- Build a responsive desktop-first workspace that remains easy to use on tablet and mobile without horizontal scrolling.
- Add a branded header and a prominent Aria voice area with idle, connecting, listening, thinking, speaking, disconnected, and error states.
- Add accessible call, mute, and retry controls with clear microphone status and live announcements.
- Build the conversation panel, order reference cards with details, and quick-help actions.
- Transition to a structured call summary after ending the demonstration flow, including the full transcript.

## Interaction
- Use a clearly labelled demonstration sequence so the interface visibly cycles through connecting, listening, thinking, and speaking without presenting fabricated responses as a live service.
- Define `VoiceSessionState` and a `VoiceSession` contract exposing state, connection status, mute status, transcript, error, and start/end/mute/unmute methods; keep all demonstration behavior behind `useVoiceSession` so a future provider can replace it without UI restructuring.
- Keep transcript rendering independent from the voice implementation and announce connecting, listening, thinking, speaking, and error changes through an accessible live region.
- Keep order lookup and call-summary access behind typed frontend interfaces with no network calls, credentials, storage, server work, authentication, or external providers.

## Structure
- Define strict TypeScript models for voice state, microphone state, `TranscriptMessage`, exact `CallSummary` fields, orders, and summaries.
- Keep the three exact supplied orders in one typed mock module, with conversation and summary content in separate mock-data modules.
- Build focused components for Aria's identity, controls, conversation, order details, help actions, errors, and summary.
- Use established transcript/message primitives where appropriate, customized to the Aura Skincare design.
- Add a typed `api.ts` boundary that reads demonstration data without making network requests, ensuring UI components do not import mock order or summary data directly.

## Quality checks
- Verify required branding, exact order copy, all voice and error states, transcript and summary rendering, focus behavior, reduced-motion behavior, and metadata.
- Check the finished screen at desktop and mobile sizes; exercise start, mute, unmute, end, retry, keyboard navigation, and order-detail flows; confirm successful build, type safety, and clean browser console.
- Search the entire project for every prohibited external-brand and hiring-related term and remove all occurrences, including existing documentation, comments, metadata, and placeholders.
- Do not add login, accounts, payments, checkout, dashboards, administrative tools, or any server-side functionality.
