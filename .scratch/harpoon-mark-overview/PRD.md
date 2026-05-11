Status: needs-triage

# PRD: Harpoon Mark Overview

## Problem Statement

Harpoon Niri currently gives fast keybinding-based **Window Mark** creation and jumping, but users have no visual way to inspect all five **Mark Slots**. When users forget which **Niri Window** lives in which **Mark Slot**, they must rely on memory or debug `status` output. Users also have no explicit way to clear a mistaken or obsolete **Window Mark** without waiting for stale-window cleanup or LRU replacement.

## Solution

Add a keyboard-driven **Mark Overview** opened with `Mod+H` through a manual niri keybinding. The **Mark Overview** shows exactly five **Mark Slots**, displays each occupied slot's **Window Label**, allows jumping to occupied slots, and supports safe **Clear Mark Actions** for one slot or all slots.

The overview remains part of the Harpoon Niri daemon plugin. It uses DMS modal primitives and follows the existing clipboard history overlay style: centered on the active monitor, clipboard-like row height and spacing, title `Harpoon Marks`, no search field, five visible rows, clear controls, confirmation modals for destructive actions, and keyboard hints.

## User Stories

1. As a niri user, I want to press `Mod+H` to open Harpoon Marks, so that I can inspect my **Mark Slots** without using debug IPC.
2. As a niri user, I want `Mod+H` to close Harpoon Marks when it is already open, so that the same muscle-memory key toggles the overlay.
3. As a niri user, I want Harpoon Marks to show all five **Mark Slots**, so that I can see the complete mark set at once.
4. As a niri user, I want occupied **Mark Slots** to show slot number, app icon, app id, and window title, so that I can identify each marked **Niri Window** quickly.
5. As a niri user, I want occupied **Mark Slots** with no title to show `No title`, so that empty title data does not make the row look broken.
6. As a niri user, I want empty **Mark Slots** to show their slot number and empty state, so that I know which jump keys are unused.
7. As a niri user, I want empty **Mark Slots** to be visible but inactive, so that I can understand slot availability without triggering noisy failure feedback.
8. As a niri user, I want clicking an occupied **Mark Slot** row to jump to that **Window Mark**, so that the overlay can act as a visual jump menu.
9. As a niri user, I want jumping from Harpoon Marks to close the overlay, so that focus returns to the target **Niri Window** immediately.
10. As a keyboard-focused user, I want pressing `1` through `5` inside Harpoon Marks to jump to the matching occupied **Mark Slot**, so that I do not need modifier keys while the overlay is open.
11. As a keyboard-focused user, I want pressing `Enter` inside Harpoon Marks to jump to the selected occupied **Mark Slot**, so that selection-based navigation is possible.
12. As a keyboard-focused user, I want Harpoon Marks to select **Mark Slot** 1 by default when opened, so that selection behavior is predictable.
13. As a keyboard-focused user, I want `Ctrl+J` and `Ctrl+K` to move selection through **Mark Slots**, so that navigation matches my preferred workflow.
14. As a keyboard-focused user, I want `Ctrl+J` from slot 5 to wrap to slot 1 and `Ctrl+K` from slot 1 to wrap to slot 5, so that navigation never dead-ends.
15. As a keyboard-focused user, I want arrow keys to also move selection through **Mark Slots**, so that conventional navigation still works.
16. As a keyboard-focused user, I want `Escape` to close Harpoon Marks, so that I can dismiss it without mouse interaction.
17. As a mouse user, I want clicking outside Harpoon Marks to close it, so that it behaves like existing DMS modals.
18. As a niri user, I want a clear button on each occupied **Mark Slot**, so that I can remove mistaken or obsolete **Window Marks**.
19. As a niri user, I want per-slot clear buttons only on occupied **Mark Slots**, so that empty rows stay visually simple.
20. As a keyboard-focused user, I want pressing `Delete` on a selected occupied **Mark Slot** to start clearing that slot, so that I can clean up marks without a mouse.
21. As a cautious user, I want clearing one **Window Mark** to require a confirmation modal, so that accidental `Delete` presses do not destroy state.
22. As a cautious user, I want pressing `Delete` again in the clear confirmation modal to do nothing, so that double-tapping delete cannot confirm a destructive action.
23. As a keyboard-focused user, I want `Enter` or `Y` to confirm clear-one, so that confirming is quick once I have read the modal.
24. As a keyboard-focused user, I want `Escape` or `N` to cancel clear-one, so that cancelling is quick and explicit.
25. As a niri user, I want cancelling clear-one to keep Harpoon Marks open, so that I can continue reviewing slots.
26. As a niri user, I want confirming clear-one to keep Harpoon Marks open, so that I can immediately see the slot become empty.
27. As a niri user, I want clearing one **Window Mark** to leave all **Mark Slots** in place, so that slot numbers never shift.
28. As a niri user, I want clearing one **Window Mark** to avoid notifications, so that the visible overlay state is the feedback.
29. As a niri user, I want a clear-all control in the header, so that I can reset Harpoon Marks quickly.
30. As a niri user, I want clear-all to be visible but disabled when all **Mark Slots** are empty, so that the action remains discoverable without being misleading.
31. As a cautious user, I want clear-all to require a confirmation modal, so that I do not wipe all **Window Marks** accidentally.
32. As a cautious user, I want clear-all to have no keyboard shortcut, so that only an intentional header action can start the all-clear flow.
33. As a niri user, I want confirming clear-all to keep Harpoon Marks open, so that I can see all five **Mark Slots** become empty.
34. As a niri user, I want cancelling clear-all to keep Harpoon Marks open, so that I can continue using the overview.
35. As a niri user, I want the confirmation modal to block other Harpoon Marks actions until confirmed or cancelled, so that destructive state is unambiguous.
36. As a niri user, I want `Escape` inside a confirmation modal to cancel the modal rather than close Harpoon Marks, so that the destructive decision is resolved first.
37. As a niri user, I want opening Harpoon Marks to silently validate **Window Marks** against the **Window Catalog**, so that stale marks do not appear in the overlay.
38. As a niri user, I want silent stale cleanup on overview open, so that opening the visual overview does not create surprise toast noise.
39. As a niri user, I want Harpoon Marks to be centered on the active monitor, so that it appears where I am working.
40. As a niri user, I want Harpoon Marks to follow clipboard history overlay styling, so that it feels native to DMS.
41. As a niri user, I want Harpoon Marks to omit search, so that the UI stays focused on exactly five visible **Mark Slots**.
42. As a niri user, I want a footer showing `1-5`, `Ctrl+J/K`, `Del`, and `Esc` hints, so that keyboard controls are discoverable.
43. As a developer, I want `clear(slot)` IPC, so that **Clear Mark Actions** can be tested and used outside the overlay.
44. As a developer, I want `clear(slot)` on an occupied **Mark Slot** to return `CLEARED_SLOT_n`, so that command results are easy to verify.
45. As a developer, I want `clear(slot)` on an empty **Mark Slot** to return `EMPTY_SLOT_n`, so that no-op clears are explicit.
46. As a developer, I want `clear(slot)` on an invalid slot to return `INVALID_SLOT`, so that bad inputs are handled predictably.
47. As a developer, I want `clearAll` IPC, so that all **Window Marks** can be reset through command behavior.
48. As a developer, I want `clearAll` with occupied **Mark Slots** to return `CLEARED_ALL`, so that reset success is easy to verify.
49. As a developer, I want `clearAll` when no **Window Marks** exist to return `NO_MARKS`, so that no-op reset behavior is explicit.
50. As a developer, I want clear IPC success and no-op paths to avoid notifications, so that clear behavior stays quiet unless represented by UI state.
51. As a developer, I want `toggleOverview` IPC, so that manual niri keybindings can open and close Harpoon Marks.
52. As a developer, I want `status` to remain debug-oriented mark state only, so that overlay UI state does not become part of the debug API.
53. As a developer, I want Harpoon Niri to remain a daemon plugin, so that mark state, IPC, and overlay ownership stay in one plugin.
54. As a developer, I want Harpoon Marks to use DMS modal primitives, so that focus, active-monitor positioning, background click handling, and confirmation modals follow DMS conventions.
55. As a developer, I want manual README snippets for `Mod+H`, so that users can opt in without Harpoon Niri editing compositor config.

## Implementation Decisions

- Add **Clear Mark Action** behavior to the deep mark-state module. It should expose simple operations for clearing one **Mark Slot** and clearing all **Window Marks**, returning stable result codes without knowing about QML, niri, notifications, or UI state.
- Extend the command adapter module with `clear(slot)` and `clearAll` command methods. These methods should translate mark-state result codes into IPC strings and notifications, matching the agreed quiet behavior.
- Keep `status` output focused on debug-oriented mark state. It should not include **Mark Overview** visibility, selected slot, modal state, or other UI-only details.
- Add `toggleOverview` to the Harpoon Niri IPC target. The manual niri binding for `Mod+H` should call this command.
- Keep Harpoon Niri as a daemon plugin. The **Mark Overview** overlay lives inside the daemon plugin rather than becoming a launcher plugin.
- Build the **Mark Overview** with DMS modal primitives, including DMS-style centered modal behavior and confirmation modal behavior.
- Follow the existing clipboard history overlay's visual language: dark rounded panel, clipboard-like row height and spacing, index badges, right-edge action buttons, centered active-monitor presentation, outside-click close, and modal focus handling.
- Adjust modal height to fit five clipboard-like rows rather than using the full clipboard history height unchanged.
- Use title `Harpoon Marks`.
- Omit search because all five **Mark Slots** are always visible.
- Show exactly five rows at all times.
- For occupied rows, show slot badge, app icon when available, app id on the first line, and title on the second line.
- For occupied rows without a title, show a muted `No title` placeholder.
- For empty rows, show slot badge and empty state.
- Clicking an occupied row jumps to that **Window Mark** and closes Harpoon Marks.
- Clicking or number-selecting an empty row is a no-op and does not notify.
- Opening Harpoon Marks selects **Mark Slot** 1.
- While Harpoon Marks is open, `1` through `5` jump to matching occupied **Mark Slots** without modifiers.
- While Harpoon Marks is open, `Enter` jumps to the selected occupied **Mark Slot**.
- While Harpoon Marks is open, `Ctrl+J` and `Ctrl+K` move selection with wraparound.
- While Harpoon Marks is open, arrow keys also move selection with wraparound.
- While Harpoon Marks is open, `Escape` closes it.
- Pressing `Mod+H` while Harpoon Marks is open closes it via `toggleOverview`.
- Clicking outside Harpoon Marks closes it.
- Per-slot clear controls appear only on occupied **Mark Slots** and sit at the right edge of their rows.
- Pressing `Delete` on a selected occupied **Mark Slot** opens a clear-one confirmation modal.
- Clear-one confirmation title follows `Clear Mark Slot n?` and explains that the slot will become empty.
- In confirmation modal context, `Enter` or `Y` confirms; `Escape` or `N` cancels.
- Pressing `Delete` again inside the confirmation modal does not confirm clearing.
- Confirming or cancelling any clear confirmation closes the confirmation modal and leaves Harpoon Marks open.
- `Escape` inside a confirmation modal cancels that modal rather than closing Harpoon Marks.
- While a clear confirmation modal is open, other Harpoon Marks actions are blocked.
- Clear-all control remains visible in the header and is disabled when all **Mark Slots** are empty.
- Clear-all requires a confirmation modal and has no keyboard shortcut.
- Clear-all confirmation title follows `Clear All Harpoon Marks?` and explains all five **Mark Slots** will become empty.
- Opening Harpoon Marks validates **Window Marks** against the **Window Catalog** before display and silently clears stale marks found during that open path.
- Existing automatic stale cleanup outside overview opening can keep its existing notification behavior.
- README should document the `Mod+H` manual niri keybinding snippet and IPC smoke tests for clear and overview behavior.

### Proposed modules

- **Mark-state module**: deep module that owns **Mark Slot** state and implements clear-one/clear-all semantics in isolation. This module should be the primary automated-test target because it contains edge cases and has no DMS runtime dependency.
- **Harpoon command module**: adapter that maps mark-state behavior to IPC result codes and user notifications. This module should be tested for externally visible command outcomes.
- **Harpoon daemon module**: QML integration layer that owns IPC registration, niri service adaptation, stale sync, notification dispatch, and **Mark Overview** modal orchestration.
- **Mark Overview modal module**: QML UI for rendering five **Mark Slots**, keyboard navigation, row activation, clear controls, and confirmation flows using DMS modal conventions.
- **Manual documentation module**: README updates for `Mod+H`, clear IPC, clear-all IPC, and smoke tests.

## Testing Decisions

- Automated tests should focus on external behavior: commands in, mark state out, IPC result codes out, and focus/notification attempts where applicable. Avoid testing private implementation details or internal helper structure.
- The mark-state module should be tested because it is the deepest module and can be exercised without DMS, QML, niri, or compositor focus.
- Mark-state tests should cover clearing an occupied **Mark Slot** without shifting other **Mark Slots**.
- Mark-state tests should cover clearing an empty **Mark Slot**.
- Mark-state tests should cover invalid clear slots.
- Mark-state tests should cover clearing all occupied **Mark Slots**.
- Mark-state tests should cover clearing all when no **Window Marks** exist.
- Command adapter tests should cover `clear(slot)` result codes: `CLEARED_SLOT_n`, `EMPTY_SLOT_n`, and `INVALID_SLOT`.
- Command adapter tests should cover `clearAll` result codes: `CLEARED_ALL` and `NO_MARKS`.
- Command adapter tests should verify clear success and no-op paths do not emit notifications.
- Existing tests for mark, jump, LRU replacement, duplicate mark handling, empty jumps, stale jumps, and stale cleanup are prior art for testing the new clear operations.
- **Mark Overview** behavior should be verified with manual DMS/niri smoke tests because it depends on live QML modal behavior, keyboard focus, compositor focus, and DMS modal primitives.
- Manual verification should cover opening and closing with `Mod+H`, closing with `Escape`, closing by outside click, selecting slot 1 by default, `1` through `5` jumps, `Enter` jump, `Ctrl+J/K` wraparound, arrow-key wraparound, per-slot clear confirmation, clear-all confirmation, modal cancellation, and no notification noise for clear actions.
- Manual verification should cover opening Harpoon Marks after a marked **Niri Window** closes, ensuring stale marks are silently removed before display.
- Manual verification should cover visual parity with the clipboard history overlay: centered active-monitor modal, row spacing, badges, right-edge controls, and footer hints.

## Out of Scope

- Persisting **Window Marks** across DMS restart, niri restart, logout, or reboot.
- Adding more than five **Mark Slots**.
- Reordering, deleting, or renumbering **Mark Slots**.
- User-selected assignment of the focused **Niri Window** to a chosen **Mark Slot**.
- Changing **Mark Action** LRU replacement rules.
- Adding search to Harpoon Marks.
- Showing mark timestamps or use timestamps in Harpoon Marks.
- Adding named marks or user-edited labels.
- Adding non-niri compositor support.
- Automatically editing niri configuration.
- Turning Harpoon Niri into a launcher plugin.
- Adding a persistent widget, bar module, or popout beyond the requested modal **Mark Overview**.
- Adding a keyboard shortcut for clear-all.
- Showing notifications for successful or no-op clear actions.

## Further Notes

- Existing DMS clipboard history modal is the visual and interaction reference for Harpoon Marks.
- Existing DMS `DankModal` and `ConfirmModal` provide active-monitor centering, outside-click close, focus handling, and confirmation-modal behavior matching the desired interaction model.
- Existing niri-windows code demonstrates using app id to find a desktop entry icon for a **Niri Window**.
- Harpoon Niri should continue to rely on DMS `NiriService.windows` as the **Window Catalog** and `NiriService.focusWindow(windowId)` for jumping.
- Manual keybinding remains opt-in. Recommended snippet adds `Mod+H` spawning `dms ipc call harpoonNiri toggleOverview`.
