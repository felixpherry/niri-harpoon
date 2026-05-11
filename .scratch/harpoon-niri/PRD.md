Status: ready-for-agent

# PRD: Harpoon Niri

## Problem Statement

User wants fast, muscle-memory navigation back to important niri windows without using the launcher, overview, or workspace search. Current DMS niri-windows plugin can list and focus open windows, but it requires opening a launcher and searching/selecting a result. User wants Harpoon-like keybinding flow: mark important windows during work, then jump back to them by slot.

## Solution

Build **Harpoon Niri** as a daemon-only DMS plugin. It exposes IPC commands for a **Mark Action**, slot jumps, and status inspection. It reuses DMS `NiriService.windows` as the **Window Catalog**, validates **Window Marks** against that catalog, and focuses windows through `NiriService.focusWindow(windowId)`.

The MVP has five **Mark Slots**. Pressing the mark key assigns the focused **Niri Window** automatically. Existing **Window Marks** never shift between slots. A **Mark Action** fills the lowest empty **Mark Slot**; when all five are full, it replaces the **Least Recently Used Window Mark**. Jumping to a mark refreshes its recent-use status. Marking an already marked window keeps its slot and refreshes recent-use status.

The plugin is session-only and daemon-only. It provides no widget, launcher, popout, persistence, or automatic niri config mutation. Users install keybindings manually from a documented snippet.

## User Stories

1. As a niri user, I want to mark my focused window with one keybinding, so that I can return to it later without searching.
2. As a niri user, I want exactly five **Mark Slots**, so that the feature matches Harpoon-style navigation.
3. As a niri user, I want **Mark Slots** to stay stable after assignment, so that adding a new mark does not move Discord or Firefox to a different jump key.
4. As a niri user, I want the **Mark Action** to use the lowest empty slot, so that early marks are predictable.
5. As a niri user, I want the **Mark Action** to replace the **Least Recently Used Window Mark** when all slots are full, so that the system stays automatic without asking me to choose a slot.
6. As a niri user, I want jumping to a mark to refresh its recent-use status, so that frequently used marks are protected from replacement.
7. As a niri user, I want marking an already marked window to keep the same slot, so that my slot muscle memory remains stable.
8. As a niri user, I want marking an already marked window to refresh recent-use status, so that I can keep an important mark from being replaced.
9. As a niri user, I want `Mod+A` to mark the focused window, so that marking is fast.
10. As a niri user, I want `Mod+Alt+1` through `Mod+Alt+5` to jump to marks, so that jump keys do not conflict with my existing workspace movement bindings.
11. As a niri user, I want successful mark actions to show which slot was assigned, so that I know where the window went without needing UI.
12. As a niri user, I want successful replacement marks to show which slot was replaced, so that I understand when a full set changed.
13. As a niri user, I want successful jumps to be silent, so that focus change is the feedback and toasts do not become noisy.
14. As a niri user, I want empty-slot jumps to notify me, so that failed key presses do not feel broken.
15. As a niri user, I want stale-slot jumps to clear the stale mark and notify me, so that closed windows do not leave confusing state.
16. As a niri user, I want closed marked windows to be cleared automatically, so that **Window Marks** only point at currently known windows.
17. As a niri user, I want marks to be session-only, so that the feature tracks live window instances rather than app identities.
18. As a niri user, I want no mark persistence across DMS restart, niri restart, logout, or reboot, so that stale window ids are not reused incorrectly.
19. As a niri user, I want the plugin to use DMS `NiriService.windows`, so that it follows the same live event-stream paradigm as niri-windows.
20. As a niri user, I want the plugin to focus through `NiriService.focusWindow(windowId)`, so that it uses existing DMS niri integration.
21. As a niri user, I want mark and jump commands to report `NIRI_NOT_AVAILABLE` and notify me when not running on niri, so that failures are explicit.
22. As a developer, I want a `status` IPC command, so that daemon state can be inspected without adding UI.
23. As a developer, I want plugin source in the repo and symlinked into DMS plugins during development, so that the source is versioned while DMS can load it.
24. As a developer, I want a flat plugin layout, so that DMS plugin structure is easy to inspect and install.
25. As a developer, I want no automatic edits to niri config, so that installing the plugin has no surprising compositor side effects.
26. As a developer, I want documented keybinding snippets, so that users can opt in explicitly.
27. As a developer, I want the focused window lookup to use `is_focused` with focused-workspace active-window fallback, so that marking works across event timing edge cases.
28. As a developer, I want **Window Marks** to store window id, **Window Label**, marked-at time, and used-at time, so that focusing, feedback, stale handling, and LRU replacement are all supported.

## Implementation Decisions

- Build a DMS daemon plugin named **Harpoon Niri**.
- Use DMS plugin id and IPC target `harpoonNiri`.
- Use a flat plugin structure with one manifest, one QML daemon component, and one README.
- Keep source under the repo plugin directory and install for development by symlinking that directory into the DMS plugins directory.
- Implement the core behavior in QML because DMS plugins are dynamically loaded QML components and `IpcHandler`, `NiriService`, and `ToastService` are QML-side APIs.
- Reuse DMS `NiriService.windows` as the **Window Catalog**; do not poll `niri msg -j windows` for normal operation.
- Reuse `NiriService.focusWindow(windowId)` to perform jumps.
- Expose IPC commands under `harpoonNiri`:
  - `mark()` marks the focused **Niri Window**.
  - `jump(slot)` jumps to **Mark Slot** 1 through 5.
  - `status()` returns current mark state for debugging and verification.
- Find the focused **Niri Window** using `is_focused`; fallback to focused workspace active-window data if needed.
- Store each **Window Mark** with niri window id, **Window Label** data, marked-at time, and used-at time.
- Maintain exactly five **Mark Slots**.
- On **Mark Action**, if the focused **Niri Window** is already marked, keep the current **Mark Slot** and refresh used-at time.
- On **Mark Action**, if focused window is not marked and an empty slot exists, assign the lowest-numbered empty slot.
- On **Mark Action**, if focused window is not marked and all slots are full, replace the **Least Recently Used Window Mark**.
- Existing **Window Marks** must not shift between **Mark Slots** as a side effect of marking another window.
- Jumping to a valid **Window Mark** refreshes used-at time.
- Jumping to an empty **Mark Slot** notifies user and does not focus anything.
- Jumping to a **Stale Window Mark** clears that slot, notifies user, and does not focus anything.
- Successful marks notify user with assigned/replaced slot information.
- Successful jumps are silent.
- When niri is unavailable, mark and jump return `NIRI_NOT_AVAILABLE` and notify user.
- **Window Marks** are session-only and are not persisted across DMS restart, niri restart, logout, or reboot.
- No explicit unmark command in MVP.
- No widget, launcher integration, popout, or visible mark list in MVP.
- The plugin does not modify niri config automatically.
- README documents manual niri keybinding snippets using the existing DMS IPC pattern: `dms ipc call harpoonNiri ...`.
- Recommended keybindings:
  - mark focused window: `Mod+A`
  - jump slots: `Mod+Alt+1` through `Mod+Alt+5`

### Proposed modules

- **Plugin manifest module**: declares daemon plugin metadata and DMS component entrypoint.
- **Harpoon daemon module**: owns **Mark Slot** state, IPC methods, niri availability checks, focused-window lookup, stale cleanup, LRU replacement, and toast feedback.
- **Manual installation documentation module**: explains symlink install, plugin reload, IPC smoke tests, and niri keybinding snippet.

The deepest module should be the mark-state logic: a small interface that receives current windows and commands, then returns updated slots plus user-facing outcomes. If practical within QML constraints, keep this logic separated from direct `NiriService` and `ToastService` calls so it can be reasoned about and tested independently.

## Testing Decisions

- Test external behavior rather than implementation details: commands in, visible state/status/toasts/focus attempts out.
- Prior art for manual IPC testing exists in DMS itself: plugin/backend functionality is exercised via `dms ipc call <target> <function> ...`.
- Minimum manual verification:
  - Plugin appears in `dms ipc` target list after reload.
  - `dms ipc call harpoonNiri status` works before marks exist.
  - `dms ipc call harpoonNiri mark` marks focused window into slot 1 and returns success text.
  - Re-running mark on same focused window keeps slot 1 and refreshes recency.
  - Marking multiple different windows fills slots 1 through 5 without shifting existing slots.
  - Marking a sixth window replaces the **Least Recently Used Window Mark**.
  - Jumping slot 1 focuses the marked window and refreshes its recency.
  - Jumping empty slot returns/notifies empty-slot failure.
  - Closing a marked window clears or stales the mark; jump clears and notifies if cleanup has not already happened.
  - Running on non-niri or with unavailable niri service returns `NIRI_NOT_AVAILABLE` and notifies user.
- If automated tests are added, prioritize pure mark-state logic because it is the deepest module and contains the most edge cases.
- Automated tests should cover slot assignment, duplicate mark handling, no-shift guarantee, LRU replacement, jump recency refresh, empty jump behavior, and stale cleanup.
- QML/DMS integration can be tested with IPC smoke tests because it depends on a live shell, niri session, and DMS services.

## Out of Scope

- Persistent marks across DMS restart, niri restart, logout, or reboot.
- App-intent restoration by app id, title, or workspace after a window closes.
- Widget, popout, launcher, or visible mark-list UI.
- Explicit unmark/clear command.
- User-selected slot assignment.
- Automatic modification of niri config.
- Polling niri via `niri msg -j windows` for routine window tracking.
- Supporting non-niri compositors.
- Packaging for plugin registry/marketplace.
- Named marks or labels chosen by the user.
- More than five **Mark Slots**.

## Further Notes

- Existing `niri-windows` plugin already demonstrates that DMS can read `NiriService.windows`, inspect `app_id`, `title`, `workspace_id`, and focus by `NiriService.focusWindow(windowId)`.
- Existing user niri config already uses `Mod+1..5` for workspace focus and `Mod+Shift+1..5` for moving columns to workspaces, so jump bindings use `Mod+Alt+1..5` instead.
- Existing DMS keybinding convention uses `spawn "dms" "ipc" "call" ...`; Harpoon Niri should document that same style.
