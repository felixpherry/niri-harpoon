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

function createHarpoonState(options) {
    const now = options && options.now ? options.now : () => Date.now();
    let slots = [null, null, null, null, null];

    function status() {
        return {
            slots: slots.map((mark, index) => ({
                slot: index + 1,
                mark: mark
            }))
        };
    }

    function labelFor(window) {
        return {
            appId: window.app_id || "unknown",
            title: window.title || ""
        };
    }

    function mark(window) {
        const timestamp = now();
        let slotIndex = slots.findIndex(slot => slot && slot.windowId === window.id);
        if (slotIndex >= 0) {
            const existing = slots[slotIndex];
            slots[slotIndex] = Object.assign({}, existing, {
                usedAt: timestamp
            });
            return {
                code: "MARK_REFRESHED",
                slot: slotIndex + 1
            };
        }

        slotIndex = slots.findIndex(slot => slot === null);
        let code = "MARK_ASSIGNED";
        if (slotIndex < 0) {
            slotIndex = 0;
            for (let index = 1; index < slots.length; index++) {
                if (slots[index].usedAt < slots[slotIndex].usedAt)
                    slotIndex = index;
            }
            code = "MARK_REPLACED";
        }
        slots[slotIndex] = {
            windowId: window.id,
            label: labelFor(window),
            markedAt: timestamp,
            usedAt: timestamp
        };
        return {
            code: code,
            slot: slotIndex + 1
        };
    }

    function windowExists(windows, windowId) {
        windows = windows || [];
        return windows.some(window => window && window.id == windowId);
    }

    function jump(slot, windows) {
        const slotNumber = Number(slot);
        if (!isFinite(slotNumber) || Math.floor(slotNumber) !== slotNumber || slotNumber < 1 || slotNumber > 5) {
            return {
                code: "INVALID_SLOT",
                slot: slot
            };
        }

        const slotIndex = slotNumber - 1;
        const mark = slots[slotIndex];
        if (!mark) {
            return {
                code: "EMPTY_SLOT",
                slot: slotIndex + 1
            };
        }

        if (!windowExists(windows, mark.windowId)) {
            slots[slotIndex] = null;
            return {
                code: "STALE_MARK",
                slot: slotIndex + 1,
                windowId: mark.windowId
            };
        }

        const timestamp = now();
        slots[slotIndex] = Object.assign({}, mark, {
            usedAt: timestamp
        });
        return {
            code: "JUMP_FOCUSED",
            slot: slotIndex + 1,
            focusWindowId: mark.windowId
        };
    }

    function syncWindowCatalog(windows) {
        const clearedSlots = [];
        slots = slots.map((mark, index) => {
            if (mark && !windowExists(windows, mark.windowId)) {
                clearedSlots.push(index + 1);
                return null;
            }
            return mark;
        });
        return { clearedSlots: clearedSlots };
    }

    return {
        status,
        mark,
        jump,
        syncWindowCatalog
    };
}

if (typeof module !== "undefined") {
    module.exports = { createHarpoonState, findFocusedWindow };
}
