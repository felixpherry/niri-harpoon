Status: ready-for-human

# Stale mark cleanup and manual install docs

## Parent

.scratch/harpoon-niri/PRD.md

## What to build

Finish **Harpoon Niri** MVP by clearing **Stale Window Marks** and documenting manual installation. The daemon should keep **Window Marks** session-only, validate marks against the live **Window Catalog**, and clear marks when their **Niri Window** disappears. If a stale mark survives until jump time, the jump should clear that **Mark Slot**, notify the user, and avoid focusing anything.

Add README documentation for development installation by symlinking the repo plugin directory into the DMS plugins directory, reloading DMS, smoke-testing IPC commands, and manually adding niri keybindings. The documented bindings should use `Mod+A` for `mark()` and `Mod+Alt+1` through `Mod+Alt+5` for `jump(1)` through `jump(5)` using the existing `dms ipc call harpoonNiri ...` pattern. Documentation should state that the plugin does not persist marks and does not modify niri config automatically.

## Acceptance criteria

- [ ] **Window Marks** are cleared automatically when their **Niri Window** disappears from the **Window Catalog**.
- [ ] Jumping to a **Stale Window Mark** clears the stale **Mark Slot**, notifies the user, and does not call focus.
- [ ] **Window Marks** are not persisted across DMS restart, niri restart, logout, or reboot.
- [ ] README documents symlink-based development install from the repo plugin directory to the DMS plugins directory.
- [ ] README documents plugin reload and IPC smoke tests for `status`, `mark`, and `jump`.
- [ ] README documents manual niri keybinding snippets for `Mod+A` and `Mod+Alt+1` through `Mod+Alt+5`.
- [ ] README states that Harpoon Niri does not automatically edit niri config.

## Blocked by

- .scratch/harpoon-niri/issues/02-jump-lru-replacement.md

## Comments

Implemented stale cleanup and finalized manual install docs:

- `state.syncWindowCatalog(windows)` clears Window Marks whose Niri Window disappeared.
- Daemon listens to `NiriService.windows` changes and syncs stale cleanup automatically.
- Jumping a stale Window Mark now clears the Mark Slot, notifies, and does not focus.
- Window Marks remain in-memory only; no persistence added.
- README documents symlink install, plugin reload, IPC smoke tests, manual niri keybindings, session-only behavior, and no automatic niri config edits.

Verification run:

```sh
node tests/harpoon-state.test.js
node - <<'EOF'
const fs = require('fs');
const qml = fs.readFileSync('plugins/harpoonNiri/HarpoonNiri.qml', 'utf8');
for (const text of ['function onWindowsChanged()', 'state.syncWindowCatalog(NiriService.windows || [])']) {
  if (!qml.includes(text)) throw new Error(`missing ${text}`);
}
const readme = fs.readFileSync('plugins/harpoonNiri/README.md', 'utf8');
for (const text of ['ln -sfn "$PWD/plugins/harpoonNiri"', 'dms ipc call harpoonNiri status', 'Mod+Alt+5', 'does not persist marks', 'does not edit niri config automatically']) {
  if (!readme.includes(text)) throw new Error(`missing README ${text}`);
}
console.log('ok - stale cleanup wiring and docs present');
EOF
```
