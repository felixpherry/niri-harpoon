Status: ready-for-human

# Harpoon Mark Overview

## Parent

.scratch/harpoon-mark-overview/PRD.md

## What to build

Build the full **Mark Overview** feature for Harpoon Niri. The feature adds quiet **Clear Mark Actions** through IPC, a `Mod+H`-driven DMS modal overlay titled `Harpoon Marks`, five visible **Mark Slot** rows, click and keyboard jumping, clear-one and clear-all confirmation flows, silent stale cleanup on overview open, and updated manual keybinding/smoke-test documentation.

## Acceptance criteria

- [ ] `clear(slot)` IPC clears an occupied **Mark Slot**, returns `CLEARED_SLOT_n`, does not shift other **Mark Slots**, and does not notify.
- [ ] `clear(slot)` IPC returns `EMPTY_SLOT_n` for empty **Mark Slots**, `INVALID_SLOT` for invalid slots, and does not notify.
- [ ] `clearAll` IPC clears all occupied **Mark Slots**, returns `CLEARED_ALL`, returns `NO_MARKS` when no **Window Marks** exist, and does not notify.
- [ ] Automated tests cover clear-one, clear-empty, invalid clear, clear-all occupied, clear-all empty, no-shift behavior, and quiet command notifications.
- [ ] `toggleOverview` IPC opens and closes the **Mark Overview**.
- [ ] README documents the manual `Mod+H` niri binding and clear/overview smoke tests.
- [ ] Opening the **Mark Overview** silently validates **Window Marks** against the **Window Catalog** and clears stale marks before display.
- [ ] The **Mark Overview** is centered on the active monitor, follows clipboard overlay styling, uses clipboard-like row height/spacing, and has height adjusted for five rows.
- [ ] The **Mark Overview** title is `Harpoon Marks` and no search field is shown.
- [ ] The **Mark Overview** always shows exactly five **Mark Slots**.
- [ ] Occupied **Mark Slots** show slot number, app icon when available, app id, and window title, with muted `No title` when title is absent.
- [ ] Empty **Mark Slots** show slot number and empty state, are inactive, and do not notify when clicked or selected by number key.
- [ ] Clicking an occupied **Mark Slot** row jumps to that **Window Mark** and closes the **Mark Overview**.
- [ ] Pressing `1` through `5` inside the **Mark Overview** jumps to the matching occupied **Mark Slot** without modifier keys and closes the overview.
- [ ] Opening the **Mark Overview** selects **Mark Slot** 1 by default.
- [ ] Pressing `Enter` jumps to the selected occupied **Mark Slot** and closes the overview.
- [ ] `Ctrl+J`, `Ctrl+K`, and arrow keys move selection through **Mark Slots** with wraparound.
- [ ] `Escape`, `Mod+H`, and outside click close the **Mark Overview**.
- [ ] Per-slot clear controls appear only on occupied **Mark Slots** at the right edge of rows.
- [ ] Pressing `Delete` on a selected occupied **Mark Slot** opens a clear-one confirmation modal.
- [ ] Clear-one confirmation title follows `Clear Mark Slot n?`, explains the slot will become empty, and uses `Enter`/`Y` to confirm and `Escape`/`N` to cancel.
- [ ] Pressing `Delete` again in the clear confirmation modal does not confirm clearing.
- [ ] Confirming or cancelling clear-one closes the confirmation modal and leaves the **Mark Overview** open.
- [ ] `Escape` inside a clear confirmation modal cancels the modal rather than closing the **Mark Overview**.
- [ ] While a clear confirmation modal is open, other **Mark Overview** actions are blocked.
- [ ] Header clear-all control remains visible and is disabled when all **Mark Slots** are empty.
- [ ] Clear-all requires a confirmation modal, has no keyboard shortcut, uses title `Clear All Harpoon Marks?`, and explains all five **Mark Slots** will become empty.
- [ ] Confirming or cancelling clear-all closes the confirmation modal and leaves the **Mark Overview** open.
- [ ] Clearing from the **Mark Overview** does not notify; updated overlay state is the feedback.
- [ ] Footer hints show `1-5` jump, `Ctrl+J/K` move, `Del` clear, and `Esc` close.
- [ ] `status` remains debug-oriented mark state and does not include **Mark Overview** UI state.

## Blocked by

None - can start immediately

## Comments

- Implemented automated clear-state and command adapter behavior with tests.
- Added `clear`, `clearAll`, and `toggleOverview` IPC wiring.
- Added DMS `MarkOverviewModal` for five rows, keyboard navigation, jump activation, clear-one/clear-all confirmations, quiet clears, silent stale cleanup on open, and footer hints.
- Updated README with `Mod+H`, IPC smoke tests, and manual overview smoke checks.
- Automated verification: `npm test` passes (32 tests). Manual DMS/niri smoke verification still needed.
