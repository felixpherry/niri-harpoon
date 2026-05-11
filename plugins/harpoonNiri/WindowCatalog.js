function catalogWindows(adapter) {
    return adapter && adapter.windows ? (adapter.windows() || []) : [];
}

function catalogWorkspaces(adapter) {
    return adapter && adapter.workspaces ? (adapter.workspaces() || {}) : {};
}

function windowExists(windows, windowId) {
    windows = windows || [];
    return windows.some(window => window && window.id == windowId);
}

function findFocusedWindow(windows, workspaces) {
    windows = windows || [];
    workspaces = workspaces || {};
    const focused = windows.find(window => window && window.is_focused === true);
    if (focused)
        return focused;

    const workspaceList = Array.isArray(workspaces) ? workspaces : Object.values(workspaces);
    const focusedWorkspace = workspaceList.find(workspace => workspace && workspace.is_focused === true);
    if (!focusedWorkspace || focusedWorkspace.active_window_id === undefined || focusedWorkspace.active_window_id === null)
        return null;

    return windows.find(window => window && window.id == focusedWorkspace.active_window_id) || null;
}

if (typeof module !== "undefined") {
    module.exports = { catalogWindows, catalogWorkspaces, windowExists, findFocusedWindow };
}
