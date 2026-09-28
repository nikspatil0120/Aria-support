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
- Use a transparent demonstration sequence so the interface visibly cycles through connection and conversation states without presenting it as a real voice service.
- Keep all voice behavior behind a dedicated hook so a real service can replace it later.
- Keep order lookup and call-summary access behind typed frontend interfaces with no network calls, credentials, storage, or server work.

## Structure
- Define strict TypeScript models for voice state, microphone state, messages, orders, and summaries.
- Keep orders, conversation content, and summary content in separate mock-data modules.
- Build focused components for Aria's identity, controls, conversation, order details, help actions, errors, and summary.
- Use established transcript/message primitives where appropriate, customized to the Aura Skincare design.

## Quality checks
- Verify required branding, copy, order data, states, focus behavior, reduced-motion behavior, and metadata.
- Check the finished screen at desktop and mobile sizes, exercise start/mute/end/order-details flows, and confirm the project remains error-free.
