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
```

## Niri keybinding snippet

```kdl
binds {
    Mod+A { spawn "dms" "ipc" "call" "harpoonNiri" "mark"; }
    Mod+Alt+1 { spawn "dms" "ipc" "call" "harpoonNiri" "jump" "1"; }
    Mod+Alt+2 { spawn "dms" "ipc" "call" "harpoonNiri" "jump" "2"; }
    Mod+Alt+3 { spawn "dms" "ipc" "call" "harpoonNiri" "jump" "3"; }
    Mod+Alt+4 { spawn "dms" "ipc" "call" "harpoonNiri" "jump" "4"; }
    Mod+Alt+5 { spawn "dms" "ipc" "call" "harpoonNiri" "jump" "5"; }
}
```

`status()` returns JSON containing all five **Mark Slots**. `mark()` assigns focused **Niri Window** to lowest empty **Mark Slot**, refreshes existing slot and **Window Label** for already marked window, or replaces the **Least Recently Used Window Mark** when full. `jump(slot)` focuses a valid **Window Mark** and refreshes recency; successful jumps are silent. Automatic cleanup of **Stale Window Marks** notifies cleared slots.
