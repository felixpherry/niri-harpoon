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

`status()` returns JSON containing all five **Mark Slots**. `mark()` assigns focused **Niri Window** to lowest empty **Mark Slot**, refreshes existing slot and **Window Label** for already marked window, or replaces the **Least Recently Used Window Mark** when full. `jump(slot)` focuses a valid **Window Mark** and refreshes recency; successful jumps are silent. `clear(slot)` returns `CLEARED_SLOT_n`, `EMPTY_SLOT_n`, or `INVALID_SLOT` and stays quiet. `clearAll()` returns `CLEARED_ALL` or `NO_MARKS` and stays quiet. `toggleOverview()` opens or closes **Harpoon Marks**; opening it silently clears stale marks before display. Automatic cleanup of **Stale Window Marks** outside overview opening notifies cleared slots.

## Mark Overview smoke tests

1. Reload plugin, mark several windows, then run `dms ipc call harpoonNiri toggleOverview`; panel should center on active monitor with title `Harpoon Marks`, five rows, no search field, and footer hints for `1-5`, `Ctrl+J/K`, `Del`, and `Esc`.
2. Press `1`-`5` or `Enter` on occupied rows; focused **Niri Window** should change and overview should close. Empty rows should do nothing and stay quiet.
3. Reopen overview; selection starts on **Mark Slot** 1. `Ctrl+J`, `Ctrl+K`, Up, and Down wrap through five rows.
4. Press `Delete` on occupied row; confirmation `Clear Mark Slot n?` appears. `Enter`/`Y` confirms, `Escape`/`N` cancels, repeat `Delete` does nothing. Overview stays open and no toast appears.
5. Use header clear-all button; confirmation `Clear All Harpoon Marks?` appears. Confirm leaves overview open with all five rows empty; button becomes disabled.
6. Close marked **Niri Window**, open overview, and verify stale mark is gone without toast.
7. Verify `Escape`, outside click, and `Mod+H` close overview.
