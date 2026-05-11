Status: ready-for-human

# Create core Harpoon Niri daemon and Mark Action

## Parent

.scratch/harpoon-niri/PRD.md

## What to build

Create the daemon-only DMS plugin for **Harpoon Niri** with IPC target `harpoonNiri`. The plugin should load from the flat plugin layout, expose `status()`, and implement the **Mark Action** for the focused **Niri Window**. It should maintain exactly five stable **Mark Slots**, use DMS `NiriService.windows` as the **Window Catalog**, find the focused **Niri Window** using `is_focused` with focused-workspace active-window fallback, and store each **Window Mark** with window id, **Window Label**, marked-at time, and used-at time.

A **Mark Action** should keep an already marked **Niri Window** in its current **Mark Slot** and refresh used-at time. A new **Window Mark** should fill the lowest empty **Mark Slot** without shifting existing marks. Successful marks should notify the user which slot was assigned. If niri is unavailable, `mark()` should return `NIRI_NOT_AVAILABLE` and notify the user.

## Acceptance criteria

- [ ] DMS loads the plugin with id/IPC target `harpoonNiri` from a flat plugin layout.
- [ ] `status()` returns all five **Mark Slots** and shows them empty before any marks exist.
- [ ] `mark()` stores the focused **Niri Window** in slot 1 when all **Mark Slots** are empty.
- [ ] Marking additional different focused windows fills the lowest empty **Mark Slot** without shifting existing marks.
- [ ] Marking an already marked **Niri Window** keeps its existing **Mark Slot** and refreshes used-at time.
- [ ] Each **Window Mark** includes window id, **Window Label**, marked-at time, and used-at time in inspectable status output.
- [ ] Successful **Mark Actions** notify the user which **Mark Slot** was assigned or refreshed.
- [ ] When niri is unavailable, `mark()` returns `NIRI_NOT_AVAILABLE` and notifies the user.

## Blocked by

None - can start immediately

## Comments

Implemented core daemon Mark Action in `plugins/harpoonNiri/`:

- Flat DMS daemon plugin manifest with id/IPC target `harpoonNiri`.
- `status()` IPC returns five Mark Slots as JSON.
- `mark()` handles niri-unavailable, focused-window lookup, assignment, duplicate refresh, and success toasts.
- Pure mark-state module covered by Node tests for empty status, slot 1 assignment, lowest-empty/no-shift assignment, duplicate refresh, and focused-window fallback.

Verification run:

```sh
node tests/harpoon-state.test.js
node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('plugins/harpoonNiri/plugin.json','utf8')); if(m.id!=='harpoonNiri'||m.type!=='daemon'||m.component!=='./HarpoonNiri.qml') throw new Error('bad manifest'); console.log('ok - daemon manifest exposes harpoonNiri flat plugin');"
```
