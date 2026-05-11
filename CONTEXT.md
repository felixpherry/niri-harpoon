# Harpoon Niri

Harpoon Niri provides fast return-to-window navigation for niri by letting users mark windows and jump back to those marks through keybindings.

User-facing name is **Harpoon Niri**; DMS plugin id and IPC target are `harpoonNiri`.

## Language

**Window Mark**:
One of five session-only automatically assigned slots that points at one currently known niri window.
_Avoid_: bookmark, pin, favorite

**Mark Slot**:
A numbered position from 1 through 5 that may hold one **Window Mark**.
_Avoid_: register, index, bookmark

**Mark Action**:
The user command that assigns the focused **Niri Window** to a **Mark Slot** without choosing the slot explicitly.
_Avoid_: pin action, bookmark action

**Least Recently Used Window Mark**:
The **Window Mark** with the oldest mark-or-jump interaction among occupied **Mark Slots**.
_Avoid_: oldest mark

**Window Label**:
The stored app id and title used to describe a **Window Mark** in user feedback.
_Avoid_: display name, caption

**Niri Window**:
A window reported by niri through DMS `NiriService.windows` and identified by niri window id.
_Avoid_: app, client

**Window Catalog**:
The live set of niri windows maintained from niri event-stream updates.
_Avoid_: polling result, cache

**Stale Window Mark**:
A **Window Mark** whose target is no longer present in the **Window Catalog**.
_Avoid_: dead bookmark, broken pin

**Clear Mark Action**:
The user command that removes one or all **Window Marks** from **Mark Slots** while leaving the **Mark Slots** empty and available.
_Avoid_: delete slot, remove slot

**Mark Overview**:
An overlay that shows all five **Mark Slots** and lets the user jump to or clear **Window Marks**.
_Avoid_: launcher, widget, slot editor

## Relationships

- A **Mark Slot** holds zero or one **Window Mark**.
- A **Mark Action** assigns the focused **Niri Window** automatically rather than asking the user for a **Mark Slot**.
- The focused **Niri Window** is found from `is_focused`, with focused workspace active-window data as fallback.
- A **Mark Action** does not shift existing **Window Marks** between **Mark Slots**.
- A **Mark Action** fills the lowest empty **Mark Slot**; when all **Mark Slots** are full, it replaces the **Least Recently Used Window Mark**.
- Jumping to a **Window Mark** refreshes its recent-use status.
- Marking an already marked **Niri Window** keeps its **Mark Slot** and refreshes its recent-use status and **Window Label**.
- A **Clear Mark Action** clears one **Window Mark** or all **Window Marks** without deleting, shifting, or renumbering **Mark Slots**.
- The **Mark Overview** shows exactly five **Mark Slots**.
- Activating an occupied **Mark Slot** in the **Mark Overview** jumps to that **Window Mark** and closes the **Mark Overview**.
- While the **Mark Overview** is open, pressing `1` through `5` jumps to the corresponding occupied **Mark Slot** without requiring modifier keys.
- While the **Mark Overview** is open, pressing `Enter` jumps to the selected occupied **Mark Slot**.
- Opening the **Mark Overview** selects **Mark Slot** 1 by default.
- While the **Mark Overview** is open, `Ctrl+J` and `Ctrl+K` move selection through **Mark Slots** with wraparound.
- While the **Mark Overview** is open, arrow keys also move selection through **Mark Slots** with wraparound.
- While the **Mark Overview** is open, `Delete` opens a confirmation modal for clearing the selected occupied **Mark Slot**.
- Clear-one confirmation title follows "Clear Mark Slot n?" and explains the slot will become empty.
- In the clear confirmation modal, `Enter` or `Y` confirms and `Escape` or `N` cancels.
- Confirming or cancelling the clear confirmation modal closes the modal and leaves the **Mark Overview** open.
- `Escape` in the clear confirmation modal cancels the modal rather than closing the **Mark Overview**.
- While the clear confirmation modal is open, other **Mark Overview** actions are blocked until the modal is confirmed or cancelled.
- Pressing `Delete` again in the clear confirmation modal does not confirm clearing.
- Empty **Mark Slots** in the **Mark Overview** are visible but inactive and do not notify when clicked or selected by number key.
- Each occupied **Mark Slot** in the **Mark Overview** shows its slot number, app icon when available, and **Window Label** with app id above title.
- If an occupied **Mark Slot** has no window title, the **Mark Overview** shows a muted "No title" placeholder.
- Each empty **Mark Slot** in the **Mark Overview** shows its slot number and empty state.
- The **Mark Overview** does not show mark or use timestamps; timestamps are debug state only.
- The **Mark Overview** allows clearing one occupied **Mark Slot** or clearing all **Window Marks** without closing.
- Clearing all **Window Marks** from the **Mark Overview** requires a confirmation modal and has no keyboard shortcut.
- Clear-all confirmation title follows "Clear All Harpoon Marks?" and explains all five **Mark Slots** will become empty.
- In the **Mark Overview**, clicking an occupied **Mark Slot** row jumps to that **Window Mark**.
- In the **Mark Overview**, per-slot clear controls appear only for occupied **Mark Slots** at the right edge of their rows.
- In the **Mark Overview**, the clear-all control remains visible in the header and is disabled when all **Mark Slots** are empty.
- The **Mark Overview** footer shows keyboard hints for `1-5` jump, `Ctrl+J/K` move, `Del` clear, and `Esc` close.
- Clearing **Window Marks** from the **Mark Overview** does not notify; the updated **Mark Overview** is the feedback.
- Successful `clear(slot)` IPC calls return `CLEARED_SLOT_n` and do not notify.
- `clear(slot)` on an empty **Mark Slot** returns `EMPTY_SLOT_n` and does not notify.
- Successful `clearAll` IPC calls return `CLEARED_ALL` and do not notify.
- `clearAll` when no **Window Marks** exist returns `NO_MARKS` and does not notify.
- `clear(slot)` with an invalid slot returns `INVALID_SLOT` and does not notify.
- There is no explicit unmark command in the MVP; **Window Marks** are cleared by stale-window cleanup or LRU replacement.
- Harpoon Niri remains a daemon plugin even when it owns the **Mark Overview** overlay.
- The daemon exposes `mark`, `jump`, `clear`, `clearAll`, `status`, and `toggleOverview` IPC commands under DMS target `harpoonNiri`.
- `status` IPC output is debug-oriented mark state and does not include **Mark Overview** UI state.
- When niri is unavailable, mark and jump commands return `NIRI_NOT_AVAILABLE` and notify the user.
- Niri keybindings are installed manually by the user from a documented config snippet; the plugin does not modify compositor config.
- `Mod+H` toggles the **Mark Overview** through the `toggleOverview` IPC command.
- Pressing `Escape` while the **Mark Overview** is open closes it.
- Pressing `Mod+H` while the **Mark Overview** is open closes it.
- Clicking outside the **Mark Overview** closes it.
- Opening the **Mark Overview** validates **Window Marks** against the **Window Catalog** and silently clears stale marks before showing slots.
- The **Mark Overview** appears as a centered overlay on the active monitor.
- The **Mark Overview** follows the visual style of the existing clipboard history overlay with height adjusted to fit five **Mark Slot** rows.
- **Mark Overview** rows use clipboard-overlay-like row height and spacing.
- The **Mark Overview** title is "Harpoon Marks".
- The **Mark Overview** omits search because exactly five **Mark Slots** are always visible.
- Plugin source lives in the repo under `plugins/harpoonNiri/` with a flat plugin file layout and is installed for development by symlinking that directory into the DMS plugins directory.
- The **Mark Overview** uses DMS modal primitives such as `DankModal` and `ConfirmModal` rather than registering as a launcher plugin.
- A **Niri Window** may be pointed at by at most one **Window Mark**.
- Assigning a marked **Niri Window** to a different **Mark Slot** moves the **Window Mark**.
- Assigning a **Window Mark** to an occupied **Mark Slot** replaces the previous **Window Mark**.
- A **Window Mark** stores niri window id, **Window Label**, marked-at time, and used-at time.
- A **Window Mark** points at zero or one **Niri Window** after stale-window cleanup.
- A **Stale Window Mark** is cleared automatically when its **Niri Window** disappears from the **Window Catalog**, and automatic cleanup notifies the user.
- The **Window Catalog** contains zero or more **Niri Windows**.
- **Window Marks** are validated against the **Window Catalog** before navigation.
- Jumping validates the target exists, then focuses it through DMS `NiriService.focusWindow(windowId)`.
- Successful **Mark Actions** notify the user which **Mark Slot** was assigned or replaced.
- Successful jumps do not notify the user because focus change is feedback.
- Jumping to an empty **Mark Slot** notifies the user instead of failing silently.
- Jumping to a **Stale Window Mark** clears it and notifies the user.
- **Window Marks** do not persist across DMS restart, niri restart, logout, or reboot.

## Example dialogue

> **Dev:** "When user jumps to a **Window Mark**, do we query niri directly?"
> **Domain expert:** "No — use the **Window Catalog** from DMS `NiriService.windows`, same as niri-windows."

## Testing notes

- Automated tests should cover clearing an occupied **Mark Slot** without shifting other **Mark Slots**.
- Automated tests should cover clearing an empty **Mark Slot**, invalid clear slots, clearing all occupied **Mark Slots**, and clearing all when no **Window Marks** exist.
- **Mark Overview** behavior is verified with manual DMS/niri smoke tests because it depends on live QML modal and compositor focus behavior.

## Flagged ambiguities

- "niri/DMS plugin" resolved as DMS-integrated behavior that reuses DMS `NiriService` event-stream window tracking rather than polling `niri msg -j windows`.
- "delete slots" resolved as **Clear Mark Action**: clear a **Window Mark**, never remove or reorder a **Mark Slot**.
