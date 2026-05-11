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

## Relationships

- A **Mark Slot** holds zero or one **Window Mark**.
- A **Mark Action** assigns the focused **Niri Window** automatically rather than asking the user for a **Mark Slot**.
- The focused **Niri Window** is found from `is_focused`, with focused workspace active-window data as fallback.
- A **Mark Action** does not shift existing **Window Marks** between **Mark Slots**.
- A **Mark Action** fills the lowest empty **Mark Slot**; when all **Mark Slots** are full, it replaces the **Least Recently Used Window Mark**.
- Jumping to a **Window Mark** refreshes its recent-use status.
- Marking an already marked **Niri Window** keeps its **Mark Slot** and refreshes its recent-use status and **Window Label**.
- There is no explicit unmark command in the MVP; **Window Marks** are cleared by stale-window cleanup or LRU replacement.
- MVP is daemon-only: IPC/keybindings provide behavior without a widget, launcher, or popout UI.
- The daemon exposes `mark`, `jump`, and `status` IPC commands under DMS target `harpoonNiri`.
- When niri is unavailable, mark and jump commands return `NIRI_NOT_AVAILABLE` and notify the user.
- Niri keybindings are installed manually by the user from a documented config snippet; the plugin does not modify compositor config.
- Plugin source lives in the repo under `plugins/harpoonNiri/` with a flat plugin file layout and is installed for development by symlinking that directory into the DMS plugins directory.
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

## Flagged ambiguities

- "niri/DMS plugin" resolved as DMS-integrated behavior that reuses DMS `NiriService` event-stream window tracking rather than polling `niri msg -j windows`.
