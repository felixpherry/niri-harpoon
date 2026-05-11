if (typeof require !== "undefined") {
    var HarpoonStateModule = require("./HarpoonState.js");
    var WindowCatalogModule = require("./WindowCatalog.js");
    var WindowLabelModule = require("./WindowLabel.js");
}

function createHarpoonCommands(options) {
    options = options || {};
    const adapter = options.adapter;
    const stateFactory = typeof createHarpoonState === "function" ? createHarpoonState : HarpoonStateModule.createHarpoonState;
    const findFocused = typeof findFocusedWindow === "function" ? findFocusedWindow : WindowCatalogModule.findFocusedWindow;
    const labels = typeof labelText === "function" ? { labelText: labelText } : WindowLabelModule;
    const state = options.state || stateFactory({ now: options.now });

    function result(ipc, notifications) {
        return {
            ipc: ipc,
            notifications: notifications || []
        };
    }

    function isNiriAvailable() {
        return adapter && adapter.isNiriAvailable && adapter.isNiriAvailable();
    }

    function windows() {
        return adapter && adapter.windows ? (adapter.windows() || []) : [];
    }

    function workspaces() {
        return adapter && adapter.workspaces ? (adapter.workspaces() || {}) : {};
    }

    function status() {
        return state.status();
    }

    function markFocused() {
        if (!isNiriAvailable())
            return result("NIRI_NOT_AVAILABLE", ["Niri is not available"]);

        const focused = findFocused(windows(), workspaces());
        if (!focused)
            return result("NO_FOCUSED_WINDOW", ["No focused Niri Window found"]);

        const markResult = state.mark(focused);
        const slot = markResult.slot;
        const mark = state.status().slots[slot - 1].mark;
        const label = labels.labelText(mark.label);

        if (markResult.code === "MARK_REFRESHED")
            return result(`MARK_REFRESHED_SLOT_${slot}`, [`Refreshed Mark Slot ${slot}: ${label}`]);

        if (markResult.code === "MARK_REPLACED")
            return result(`MARK_REPLACED_SLOT_${slot}`, [`Replaced Mark Slot ${slot}: ${label}`]);

        return result(`MARK_ASSIGNED_SLOT_${slot}`, [`Marked Slot ${slot}: ${label}`]);
    }

    function jumpSlot(slot) {
        if (!isNiriAvailable())
            return result("NIRI_NOT_AVAILABLE", ["Niri is not available"]);

        const jumpResult = state.jump(slot, windows());
        if (jumpResult.code === "JUMP_FOCUSED") {
            const success = adapter && adapter.focusWindow && adapter.focusWindow(jumpResult.focusWindowId);
            return result(success ? `JUMP_FOCUSED_SLOT_${jumpResult.slot}` : `JUMP_FAILED_SLOT_${jumpResult.slot}`);
        }

        if (jumpResult.code === "EMPTY_SLOT")
            return result(`EMPTY_SLOT_${jumpResult.slot}`, [`Mark Slot ${jumpResult.slot} is empty`]);

        if (jumpResult.code === "INVALID_SLOT")
            return result("INVALID_SLOT");

        if (jumpResult.code === "STALE_MARK")
            return result(`STALE_MARK_SLOT_${jumpResult.slot}`, [`Mark Slot ${jumpResult.slot} window is no longer available`]);

        return result("JUMP_FAILED");
    }

    function syncWindowCatalog() {
        if (!isNiriAvailable())
            return { clearedSlots: [], notifications: [] };

        const syncResult = state.syncWindowCatalog(windows());
        const notifications = syncResult.clearedSlots.map(slot => `Mark Slot ${slot} window is no longer available`);
        return {
            clearedSlots: syncResult.clearedSlots,
            notifications: notifications
        };
    }

    return { status, markFocused, jumpSlot, syncWindowCatalog };
}

if (typeof module !== "undefined") {
    module.exports = { createHarpoonCommands };
}
