Status: ready-for-human

# Jump and LRU replacement behavior

## Parent

.scratch/harpoon-niri/PRD.md

## What to build

Extend **Harpoon Niri** so users can jump to **Window Marks** by **Mark Slot** and so full mark sets replace the **Least Recently Used Window Mark**. `jump(slot)` should accept slots 1 through 5, validate the target against the **Window Catalog**, focus valid targets through `NiriService.focusWindow(windowId)`, and refresh used-at time. Successful jumps should be silent because focus change is feedback. Empty-slot jumps should notify the user and avoid focusing anything.

When all five **Mark Slots** are occupied, marking a sixth distinct **Niri Window** should replace the **Least Recently Used Window Mark**. Mark and jump interactions both count as recent use. Replacement should preserve all other **Mark Slots** and notify the user which slot was replaced.

## Acceptance criteria

- [ ] `jump(slot)` focuses a valid **Window Mark** through `NiriService.focusWindow(windowId)`.
- [ ] Successful jumps refresh used-at time for the jumped **Window Mark**.
- [ ] Successful jumps do not show toast notifications.
- [ ] Jumping to an empty **Mark Slot** notifies the user and does not call focus.
- [ ] Invalid slot input is rejected without focusing anything.
- [ ] Marking a sixth distinct **Niri Window** replaces the **Least Recently Used Window Mark** when all five slots are full.
- [ ] Replacement updates only the replaced **Mark Slot** and does not shift other **Window Marks**.
- [ ] Successful replacement notifies the user which **Mark Slot** was replaced.
- [ ] When niri is unavailable, `jump(slot)` returns `NIRI_NOT_AVAILABLE` and notifies the user.

## Blocked by

- .scratch/harpoon-niri/issues/01-core-daemon-mark-action.md

## Comments

Implemented jump and LRU replacement in `plugins/harpoonNiri/`:

- `jump(slot)` IPC on target `harpoonNiri`.
- Valid jump checks Window Catalog, calls `NiriService.focusWindow(windowId)`, refreshes `usedAt`, and shows no success toast.
- Empty slot notifies and does not focus.
- Invalid slot returns `INVALID_SLOT` and does not focus.
- Niri-unavailable jump returns `NIRI_NOT_AVAILABLE` and notifies.
- Full Mark Slots now replace the Least Recently Used Window Mark using mark/jump recency.
- Replacement updates only replaced slot and notifies `Replaced Mark Slot N`.
- README updated with `jump` smoke test and `Mod+Alt+1..5` snippet.

Verification run:

```sh
node tests/harpoon-state.test.js
node - <<'EOF'
const fs = require('fs');
const qml = fs.readFileSync('plugins/harpoonNiri/HarpoonNiri.qml', 'utf8');
for (const text of ['function jump(slot: string): string', 'NiriService.focusWindow(result.focusWindowId)', 'result.code === "MARK_REPLACED"']) {
  if (!qml.includes(text)) throw new Error(`missing ${text}`);
}
console.log('ok - daemon jump IPC wiring present');
EOF
```
