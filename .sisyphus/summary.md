# Call Feature Summary

## Goal
- Make Matrix-based calls work end-to-end with incoming call UI and call history in chat (like Google Chat).

## Constraints & Preferences
- "caller and reciever can't be on same device" — same-device testing is acceptable for signaling; WebRTC media may have device contention but the UI should still appear.
- "if it is like google chat where you get notification and later if call is pending you can join the call from the chat"
- No explicit UI framework or style constraints beyond existing codebase patterns.

## Progress

### Done
- Typing indicator fixed, confirmed working.
- 429 on ICE candidates — batched sending (collect candidates over 200ms, flush as single event).
- Device ID requirement — added `deviceId` to `createClient()` in both `CallContext.tsx` and `useChat.ts` (random per-instance).
- CallEventHandler race condition — `callEventHandler.stop()` after `startClient()` was too late; replaced with monkey-patch `callEventHandler.start = () => {}` BEFORE `startClient()` in both files. This prevents the SDK handler from ever registering listeners.
- Event listener registration moved to BEFORE `startClient()` — initial sync events were lost because our listener was registered after.
- Own-invite filter — skip `m.call.invite` when `sender === creds.matrix_user_id` to prevent caller from seeing incoming call UI for their own invite.
- Call events in chat timeline — `extractMessages` now includes `m.call.invite` and `m.call.hangup` events, tagged as `eventType: "call" | "missed_call"`.
- Call event cards in ChatPage — centered card with icon, "Missed call"/"Call" label, who-called-whom, and a call-back button.
- Room list preview shows "📞 Missed call" or "📞 Call" for call events.
- Duplicate missed-call entries fixed — filter now skips `m.call.hangup` when an `m.call.invite` already exists for that `call_id`.
- Navigation persistence — `handleSelectRoom` now calls `setSearchParams({ room: roomId }, { replace: true })` so refresh restores the active chat.
- `initialSyncLimit` increased from 5/20 to 100 in both `CallContext.tsx` and `useChat.ts` so call events aren't lost on refresh.
- **NEW**: Live call-event re-extraction — per-room clients now register an `"Event"` listener for `m.call.invite/hangup/answer` that triggers `reExtractRoom()`, so call events that arrive via live sync (not just initial sync) appear in the chat timeline immediately.

### In Progress
- *(none)*

### Blocked
- Incoming call overlay still not appearing on receiver side — needs user to test with latest code.

## Key Decisions
- Monkey-patch `callEventHandler.start` instead of calling `.stop()` after `startClient()` — eliminates the fundamental race where the SDK handler processes events during the initial sync.
- Register custom Event listener before `await startClient()` — ensures no events from the initial sync are missed.
- Show call events as centered cards in chat (not message bubbles) — matches Google Chat UX pattern of call history being distinct from text messages.
- Use `inviteCallIds` set to deduplicate missed-call entries — hangup events that have a matching invite are dropped.
- Use `reExtractRoom` helper to re-run `extractMessages()` on a room when call events arrive live — simpler than trying to maintain a separate event processing path.

## Next Steps
1. **User to hard refresh (Ctrl+Shift+R) both Chrome profiles** to pick up all changes.
2. **Test call flow again**: Alex calls Casey, verify Casey sees incoming call overlay.
3. **Test refresh**: reload the chat page and verify call logs persist and the active room is restored.
4. Check for console errors if either step fails.
5. Consider `useCall.ts` — it's a second, redundant call implementation that may conflict with `CallContext.tsx`. Remove or reconcile if it's no longer used.

## Critical Context
- Two separate call implementations exist: `CallContext.tsx` (context-based, used by `CallOverlay`) and `useCall.ts` (hook-based, appears unused upstream).
- The `useCall.ts` hook is NOT used by `ChatPage.tsx` — `ChatPage.tsx` uses `useCallContext()` from `CallContext.tsx` exclusively.
- `m.call.invite` events sent by a user bounce back in their own sync — hence the `sender === creds.matrix_user_id` filter.
- `initialSyncLimit` controls how many timeline events are loaded per room on initial connect. Events outside this window are not in `room.getLiveTimeline().getEvents()` and won't appear until paginated.
- WebRTC media may not work when both users are on the same physical device (single camera/mic), but call signaling (invite/answer/hangup) should work.

## Relevant Files
- `src/contexts/CallContext.tsx` — main call provider, Matrix client init, Event listener for m.call.*, renders CallOverlay.
- `src/hooks/useChat.ts` — per-room Matrix clients, `extractMessages` (including call events), typing indicators, **NEW** live call-event re-extraction via `reExtractRoom`.
- `src/pages/ChatPage.tsx` — chat UI, call buttons, message list with call event cards, room persistence via URL params.
- `src/components/CallOverlay.tsx` — full-screen overlay for incoming/active calls (incoming ringing UI, calling/connected states).
- `src/hooks/useCall.ts` — second call implementation (appears unused by main UI, potential cleanup candidate).
- `src/App.tsx` — `CallProvider` wraps `RouterProvider`, making call context and overlay available app-wide.
