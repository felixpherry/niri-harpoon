# Harpoon Niri

Daemon-only DMS plugin for five session-only **Window Marks** on niri.

Harpoon Niri does not persist marks across DMS restart, niri restart, logout, or reboot. It does not edit niri config automatically; keybindings are manual opt-in.

## Install for development

From this repository root, symlink the flat plugin directory into the DMS plugins directory and reload it:

```sh
mkdir -p ~/.config/DankMaterialShell/plugins
ln -sfn "$PWD/plugins/harpoonNiri" ~/.config/DankMaterialShell/plugins/harpoonNiri
dms ipc call plugins reload harpoonNiri
```

## IPC smoke tests

```sh
dms ipc call plugins status harpoonNiri
dms ipc call harpoonNiri status
dms ipc call harpoonNiri mark
dms ipc call harpoonNiri jump 1
dms ipc call harpoonNiri clear 1
dms ipc call harpoonNiri rename 1 "terminal"
dms ipc call harpoonNiri swap 1 3
dms ipc call harpoonNiri clearAll
dms ipc call harpoonNiri toggleOverview
```

## Niri keybinding snippet

```kdl
binds {
    Mod+A { spawn "dms" "ipc" "call" "harpoonNiri" "mark"; }
    Mod+H { spawn "dms" "ipc" "call" "harpoonNiri" "toggleOverview"; }
    Mod+Alt+1 { spawn "dms" "ipc" "call" "harpoonNiri" "jump" "1"; }
    Mod+Alt+2 { spawn "dms" "ipc" "call" "harpoonNiri" "jump" "2"; }
    Mod+Alt+3 { spawn "dms" "ipc" "call" "harpoonNiri" "jump" "3"; }
    Mod+Alt+4 { spawn "dms" "ipc" "call" "harpoonNiri" "jump" "4"; }
    Mod+Alt+5 { spawn "dms" "ipc" "call" "harpoonNiri" "jump" "5"; }
}
```

`status()` returns JSON containing all five **Mark Slots** and each occupied mark's `customDisplayName` (`""` when absent). `mark()` assigns focused **Niri Window** to lowest empty **Mark Slot**, refreshes existing slot and **Window Label** for already marked window while preserving **Custom Display Name**, or replaces the **Least Recently Used Window Mark** when full. `jump(slot)` focuses a valid **Window Mark** and refreshes recency; successful jumps are silent. `clear(slot)` returns `CLEARED_SLOT_n`, `EMPTY_SLOT_n`, or `INVALID_SLOT` and stays quiet. `rename(slot, displayName)` sets or clears a **Custom Display Name**, trims surrounding whitespace, normalizes tabs/newlines to spaces, rejects names over 80 characters with `DISPLAY_NAME_TOO_LONG`, and returns `RENAMED_SLOT_n`, `CLEARED_NAME_SLOT_n`, `EMPTY_SLOT_n`, or `INVALID_SLOT` without notifications. `swap(sourceSlot, targetSlot)` directly swaps fixed **Mark Slots**, allows empty slots, returns `SWAPPED_SLOTS_a_b`, `SWAP_NOOP_SLOT_n`, or `INVALID_SLOT`, refreshes recency for the moved source mark, and stays quiet. `clearAll()` returns `CLEARED_ALL` or `NO_MARKS` and stays quiet. `toggleOverview()` opens or closes **Harpoon Marks**; opening it silently clears stale marks before display. Automatic cleanup of **Stale Window Marks** outside overview opening notifies cleared slots.

## Mark Overview smoke tests

1. Reload plugin, mark several windows, then run `dms ipc call harpoonNiri toggleOverview`; panel should center on active monitor with title `Harpoon Marks`, five rows, no search field, and footer hints for `1-5`, `Ctrl+J/K`, `Ctrl+Shift+J/K`, `R`, `Del`, and `Esc`.
2. Press `1`-`5` or `Enter` on occupied rows; focused **Niri Window** should change and overview should close. Empty rows should do nothing and stay quiet.
3. Reopen overview; selection starts on **Mark Slot** 1. `Ctrl+J`, `Ctrl+K`, Up, and Down wrap through five rows.
4. Press `Delete` on occupied row; confirmation `Clear Mark Slot n?` appears. `Enter`/`Y` confirms, `Escape`/`N` cancels, repeat `Delete` does nothing. Overview stays open and no toast appears.
5. Use header clear-all button; confirmation `Clear All Harpoon Marks?` appears. Confirm leaves overview open with all five rows empty; button becomes disabled.
6. Close marked **Niri Window**, open overview, and verify stale mark is gone without toast.
7. Press `R` on an occupied row; rename modal should prefill existing **Custom Display Name** or current title. `Enter` saves, `Escape` cancels, blank save clears and restores title fallback, overlong input is rejected without toast, and row title updates without changing app id or icon.
8. Click per-row rename control on an occupied row and verify same rename behavior. Empty rows should have no rename control.
9. Press `Ctrl+Shift+J/K` on an occupied selected row; mark should swap with adjacent occupied or empty row, stop at slot 1/5 boundaries without wrap, keep selection on moved mark, and show no toast.
10. Drag from per-row drag handle onto occupied and empty rows; rows should highlight on hover, drop should directly swap fixed slots, outside drop should cancel, and row click should still jump rather than drag.
11. Verify `Escape`, outside click, and `Mod+H` close overview.
