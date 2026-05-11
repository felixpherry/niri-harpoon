Status: ready-for-agent

# PRD: Harpoon Custom Display Names and Reorder

## Problem Statement

Harpoon Niri users can mark and jump to **Niri Windows**, but the displayed **Window Label** is limited to app id and current title. Some titles are noisy, transient, duplicated, or not meaningful, so users cannot quickly distinguish important **Window Marks** in the **Mark Overview**. Users also cannot arrange **Window Marks** into their preferred **Mark Slots** after marking; they must clear, replace, or remember whatever automatic slot assignment produced.

## Solution

Add **Custom Display Names** for occupied **Mark Slots** and add **Move Mark Action** behavior for reordering **Window Marks**. Users can rename a mark from the **Mark Overview** with `R` or a per-row rename control. The custom name replaces only the title portion of user-facing mark text; app id and icon remain based on the underlying **Niri Window**. Users can reorder marks by keyboard with `Ctrl+Shift+J/K` adjacent swaps or by dragging from a row drag handle and dropping onto another **Mark Slot** row for direct swap.

Expose scriptable IPC for the same model: `rename(slot, displayName)` and `swap(sourceSlot, targetSlot)`. All state remains session-only; **Window Marks**, order, and **Custom Display Names** still disappear on DMS restart, niri restart, logout, or reboot.

## User Stories

1. As a niri user, I want to give a **Window Mark** a short **Custom Display Name**, so that I can recognize important windows faster than by title alone.
2. As a niri user, I want custom names to replace only the title line, so that app id and app icon still identify the underlying application.
3. As a niri user, I want the default display to keep using the **Niri Window** title when no custom name exists, so that existing marks continue to behave normally.
4. As a niri user, I want to press `R` on an occupied row in the **Mark Overview**, so that I can rename without using the mouse.
5. As a mouse user, I want a per-row rename control on occupied rows, so that I can rename visually.
6. As a niri user, I want empty **Mark Slots** to reject rename actions, so that I do not create names for non-existent **Window Marks**.
7. As a niri user, I want the rename modal prefilled with the current custom name when present, so that I can edit it quickly.
8. As a niri user, I want the rename modal prefilled with the current window title when no custom name exists, so that creating a useful shorter name is easy.
9. As a keyboard-focused user, I want `Enter` in the rename modal to save, so that rename can be completed without a mouse.
10. As a keyboard-focused user, I want `Escape` in the rename modal to cancel, so that I can back out without changing state.
11. As a niri user, I want whitespace around custom names trimmed, so that accidental spaces do not become part of the label.
12. As a niri user, I want saving an empty or whitespace-only name to clear the **Custom Display Name**, so that I can restore title fallback.
13. As a niri user, I want internal tabs and newlines normalized to spaces, so that names remain single-line and display cleanly.
14. As a niri user, I want Unicode custom names, so that I can use my preferred language or symbols.
15. As a niri user, I want custom names capped at 80 characters, so that the overview and debug status stay readable.
16. As a niri user, I want too-long custom names rejected rather than silently truncated, so that I know when input was not accepted.
17. As a niri user, I want title changes on the underlying **Niri Window** not to overwrite an existing custom name, so that my label stays stable.
18. As a niri user, I want clearing the custom name to reveal the stored title fallback again, so that I can return to automatic labeling.
19. As a niri user, I want re-marking the same **Niri Window** to preserve its custom name, so that refreshing a mark does not erase my label.
20. As a niri user, I want replacing an LRU **Window Mark** to discard the replaced mark's custom name, so that names belong to marks rather than slots.
21. As a niri user, I want rename actions to count as mark interaction, so that recently edited marks are less likely to be replaced by LRU assignment.
22. As a niri user, I want notifications for renamed marks to use app id plus custom name, so that feedback matches what I see in the overview.
23. As a developer, I want `status` to include each mark's custom display name, so that debug state shows all user-visible mark state.
24. As a developer, I want empty custom names represented as `""` in `status`, so that absence is explicit and stable.
25. As a keyboard-focused user, I want to press `Ctrl+Shift+J` to move a selected **Window Mark** down one **Mark Slot**, so that I can reorder without a mouse.
26. As a keyboard-focused user, I want to press `Ctrl+Shift+K` to move a selected **Window Mark** up one **Mark Slot**, so that I can reorder without a mouse.
27. As a niri user, I want keyboard move to swap with the adjacent **Mark Slot**, so that no hidden compaction or shifting occurs.
28. As a niri user, I want keyboard move to swap with empty adjacent slots too, so that I can intentionally create gaps.
29. As a niri user, I want moving up from slot 1 or down from slot 5 to be a no-op, so that reorder does not wrap unexpectedly.
30. As a keyboard-focused user, I want selection to follow the moved **Window Mark**, so that repeated `Ctrl+Shift+J/K` continues moving the same mark.
31. As a niri user, I want move actions to count as mark interaction, so that deliberately moved marks are less likely to be LRU-replaced.
32. As a mouse user, I want each occupied row to have a drag handle, so that drag reorder is discoverable and intentional.
33. As a mouse user, I want row clicks to keep jumping instead of starting drag, so that existing overview behavior remains safe.
34. As a mouse user, I want every **Mark Slot** row to be a drop target, so that I can drop onto occupied or empty rows.
35. As a mouse user, I want rows to highlight during drag hover, so that I know which row will receive the drop.
36. As a mouse user, I want dropping outside rows to cancel reorder, so that accidental drags do not alter state.
37. As a mouse user, I want dragging a mark onto another row to directly swap those two **Mark Slots**, so that drag behavior matches keyboard swap semantics.
38. As a mouse user, I want dragging onto an empty slot to swap with that empty slot, so that I can move a mark into a gap.
39. As a niri user, I want reordering to preserve fixed **Mark Slot** numbers, so that jump keys still map to visible slots.
40. As a niri user, I want reordering to avoid notifications, so that the updated **Mark Overview** is the feedback.
41. As a keyboard-focused user, I want the footer hints to include `Ctrl+Shift+J/K` and `R`, so that rename and move controls are discoverable.
42. As a keyboard-focused user, I want `Ctrl+J/K` to remain selection movement, so that existing overview navigation remains intact.
43. As a niri user, I want the overview to select the first occupied **Mark Slot** when opened, so that rename and move actions start on a useful row.
44. As a niri user, I want no selection when there are no marks, so that occupied-only actions are naturally disabled.
45. As a developer, I want `rename(slot, displayName)` IPC, so that custom names are scriptable and testable without QML.
46. As a developer, I want `rename` on invalid slots to return `INVALID_SLOT`, so that bad input is predictable.
47. As a developer, I want `rename` on empty slots to return `EMPTY_SLOT_n`, so that no mark state is invented.
48. As a developer, I want successful non-empty rename to return `RENAMED_SLOT_n`, so that command results are precise.
49. As a developer, I want successful clear-name rename to return `CLEARED_NAME_SLOT_n`, so that clearing is distinct from setting.
50. As a developer, I want too-long rename to return `DISPLAY_NAME_TOO_LONG`, so that validation failures are explicit.
51. As a developer, I want `swap(sourceSlot, targetSlot)` IPC, so that reorder is scriptable and testable without QML.
52. As a developer, I want swap to allow empty source or target slots, so that IPC matches fixed-slot state semantics.
53. As a developer, I want invalid swap inputs to return `INVALID_SLOT`, so that bad input is predictable.
54. As a developer, I want same-slot swaps to return `SWAP_NOOP_SLOT_n`, so that no-op behavior is explicit.
55. As a developer, I want successful swaps to return `SWAPPED_SLOTS_a_b`, so that command results show both affected slots.
56. As a developer, I want `rename` and `swap` to avoid **Window Catalog** validation, so that these state-only commands do not depend on niri availability.
57. As a niri user, I want stale cleanup to remain separate from rename and swap, so that reordering does not unexpectedly clear marks.
58. As a niri user, I want custom names and order to remain session-only, so that the feature stays consistent with existing **Window Mark** lifecycle.

## Implementation Decisions

- Extend the mark-state deep module with custom naming and slot swapping. This module should own validation, result codes, LRU refresh rules, and fixed-slot mutation without depending on QML, DMS, niri, notifications, or IPC formatting.
- Extend the **Window Mark** state shape with a `customDisplayName` string. Empty name is represented as `""`, not `null` or absence.
- Extend **Window Label** semantics to include app id, title, and optional custom display name. Custom display name affects user-facing title text only; app id and icon lookup continue to use the **Niri Window** label data.
- Add a small normalization rule for custom names: trim leading/trailing whitespace, normalize internal newlines and tabs to single spaces, allow Unicode, reject names longer than 80 characters after normalization.
- Re-marking an already marked **Niri Window** refreshes raw label data and recent-use status while preserving `customDisplayName`.
- Assigning a new **Window Mark** into an occupied slot through replacement creates fresh mark state with empty `customDisplayName`.
- `rename(slot, displayName)` sets or clears `customDisplayName` for an occupied **Mark Slot**, refreshes recent-use status on success, and does not validate the target against the **Window Catalog**.
- `swap(sourceSlot, targetSlot)` swaps two fixed **Mark Slots**, permits empty slots, refreshes recent-use status for the moved source **Window Mark** when present, and does not validate targets against the **Window Catalog**.
- Keyboard move is a UI-level adjacent `swap`: `Ctrl+Shift+J` swaps selected slot with the next slot; `Ctrl+Shift+K` swaps selected slot with the previous slot.
- Keyboard move at slot boundaries is a no-op and does not wrap.
- After keyboard move, selection follows the moved **Window Mark** to its new **Mark Slot**.
- Drag reorder starts only from a per-row drag handle on occupied rows. Whole-row click continues to jump.
- Drag drop target is the entire **Mark Slot** row. Occupied and empty rows are valid drop targets. Dropping outside rows cancels.
- Drag reorder performs direct `swap(sourceSlot, targetSlot)`, not insert/shift behavior.
- Extend the command adapter with `rename` and `swap` command methods that translate mark-state result codes into IPC strings and no notifications.
- Extend the daemon IPC target to expose `rename` and `swap` alongside existing `mark`, `jump`, `clear`, `clearAll`, `status`, and `toggleOverview`.
- Extend status output to include custom display name state for each occupied **Window Mark** while keeping overview UI state out of status.
- Extend the **Mark Overview** modal with rename modal behavior, per-row rename control, per-row drag handle, drag hover highlighting, keyboard move handling, and updated footer hints.
- Keep the **Mark Overview** as a DMS modal inside the daemon plugin, not a launcher plugin.
- Opening the **Mark Overview** selects the first occupied **Mark Slot**; if there are no **Window Marks**, no slot is selected.
- Existing stale cleanup behavior remains unchanged: opening the overview syncs with the **Window Catalog** first, while rename/swap themselves do not perform stale validation.
- README and smoke-test documentation should mention `rename`, `swap`, updated footer hints, and manual verification paths.

### Proposed modules

- **Mark-state module**: deep testable module for **Window Mark** state, fixed **Mark Slot** mutation, custom name validation, rename result codes, swap result codes, and LRU refresh rules.
- **Window label module**: focused formatter/normalizer surface for user-facing label text with optional **Custom Display Name** fallback to title.
- **Harpoon command module**: adapter that maps mark-state rename/swap behavior into stable IPC result strings and no-notification command results.
- **Harpoon daemon module**: DMS integration layer that registers new IPC commands and wires modal callbacks to command/state behavior.
- **Mark Overview modal module**: QML UI for rename modal, keyboard move, drag-handle direct swap, row drop targets, and updated hints.
- **Manual documentation module**: README updates for IPC examples and DMS/niri smoke-test flows.

## Testing Decisions

- Automated tests should exercise external behavior only: state operations in, resulting public status/result codes out; command calls in, IPC strings and notifications out. Avoid tests that depend on private helper names, internal arrays beyond public status, or QML implementation details.
- The mark-state module should be the primary automated-test target because it is the deepest module and can cover most edge cases without DMS, QML, niri, or compositor focus.
- Mark-state tests should cover renaming an occupied **Mark Slot**.
- Mark-state tests should cover clearing a **Custom Display Name** by saving empty or whitespace-only input.
- Mark-state tests should cover trimming and newline/tab normalization.
- Mark-state tests should cover Unicode custom names.
- Mark-state tests should cover rejecting display names longer than 80 characters after normalization.
- Mark-state tests should cover invalid rename slots.
- Mark-state tests should cover rename on empty **Mark Slots**.
- Mark-state tests should cover `status` including `customDisplayName` as `""` when empty.
- Mark-state tests should cover preserving **Custom Display Name** when re-marking the same **Niri Window**.
- Mark-state tests should cover discarding **Custom Display Name** when a **Window Mark** is replaced by LRU assignment.
- Mark-state tests should cover rename refreshing recent-use status.
- Mark-state tests should cover swapping two occupied **Mark Slots**.
- Mark-state tests should cover swapping occupied and empty **Mark Slots**.
- Mark-state tests should cover allowing empty source and empty target for swap.
- Mark-state tests should cover same-slot swap no-op behavior.
- Mark-state tests should cover invalid swap slots.
- Mark-state tests should cover swap refreshing recent-use status for the moved source **Window Mark** but not the displaced mark.
- Mark-state tests should cover LRU replacement after rename and move interactions.
- Command adapter tests should cover `rename` IPC strings: `RENAMED_SLOT_n`, `CLEARED_NAME_SLOT_n`, `EMPTY_SLOT_n`, `INVALID_SLOT`, and `DISPLAY_NAME_TOO_LONG`.
- Command adapter tests should cover `swap` IPC strings: `SWAPPED_SLOTS_a_b`, `SWAP_NOOP_SLOT_n`, and `INVALID_SLOT`.
- Command adapter tests should verify rename and swap do not emit notifications.
- Existing tests for mark, duplicate mark refresh, LRU replacement, jump, clear, clearAll, and stale cleanup are prior art for the new state and command tests.
- **Mark Overview** behavior should be verified with manual DMS/niri smoke tests because it depends on live QML modal behavior, keyboard focus, drag-and-drop, compositor focus, and DMS modal primitives.
- Manual smoke tests should cover opening with marks and verifying first occupied selection.
- Manual smoke tests should cover `R` rename modal prefill, save with `Enter`, cancel with `Escape`, blank save clearing custom name, and overlong input rejection.
- Manual smoke tests should cover per-row rename control.
- Manual smoke tests should cover `Ctrl+Shift+J/K` adjacent swaps, no wrap at boundaries, and selection following the moved mark.
- Manual smoke tests should cover drag-handle direct swap onto occupied and empty rows, row hover highlighting, and dropping outside rows to cancel.
- Manual smoke tests should cover row click still jumping rather than dragging.
- Manual smoke tests should cover updated footer hints.
- Manual smoke tests should cover no notification noise for rename and reorder actions.

## Out of Scope

- Persisting **Window Marks**, **Custom Display Names**, or custom order across DMS restart, niri restart, logout, or reboot.
- Renaming the actual application, process, desktop entry, niri `app_id`, or window title.
- Changing app icon lookup.
- Adding more than five **Mark Slots**.
- Deleting, creating, or renumbering **Mark Slots**.
- Insert-and-shift drag reorder behavior.
- Sorting or compacting occupied **Mark Slots**.
- Wrapping move actions at slot boundaries.
- User-selected mark assignment during the existing **Mark Action**.
- Persistent profiles, saved layouts, or per-app naming rules.
- Search/filter behavior in the **Mark Overview**.
- Changing stale-window cleanup policy beyond ensuring rename/swap do not perform validation.
- Adding notifications for successful or no-op rename/swap actions.
- Automatically editing niri configuration.

## Further Notes

- This PRD updates a prior out-of-scope item from the Mark Overview PRD: named marks are now in scope as **Custom Display Names**.
- No ADR is required. Decisions are reversible UI/state behavior, captured in the domain context rather than architectural trade-offs.
- The domain glossary intentionally avoids “rename app” and “reorder app”; canonical terms are **Custom Display Name** and **Move Mark Action**.
- Existing fixed-slot behavior remains central: **Mark Slots** do not shift unless an explicit swap occurs, and slot numbers remain stable for jump keys.
