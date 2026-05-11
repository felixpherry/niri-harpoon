import QtQuick
import Quickshell.Io
import qs.Services
import "HarpoonState.js" as HarpoonState

QtObject {
    id: root

    property var pluginService: null
    property var state: HarpoonState.createHarpoonState()

    IpcHandler {
        target: "harpoonNiri"

        function status(): string {
            return JSON.stringify(root.state.status(), null, 2);
        }

        function mark(): string {
            return root.markFocusedWindow();
        }

        function jump(slot: string): string {
            return root.jumpToSlot(slot);
        }
    }

    function markFocusedWindow(): string {
        if (!isNiriAvailable()) {
            notify("Niri is not available");
            return "NIRI_NOT_AVAILABLE";
        }

        const focused = HarpoonState.findFocusedWindow(NiriService.windows || [], NiriService.workspaces || {});
        if (!focused) {
            notify("No focused Niri Window found");
            return "NO_FOCUSED_WINDOW";
        }

        const result = state.mark(focused);
        const slot = result.slot;
        const label = labelText(state.status().slots[slot - 1].mark.label);

        if (result.code === "MARK_REFRESHED") {
            notify(`Refreshed Mark Slot ${slot}: ${label}`);
            return `MARK_REFRESHED_SLOT_${slot}`;
        }

        if (result.code === "MARK_REPLACED") {
            notify(`Replaced Mark Slot ${slot}: ${label}`);
            return `MARK_REPLACED_SLOT_${slot}`;
        }

        notify(`Marked Slot ${slot}: ${label}`);
        return `MARK_ASSIGNED_SLOT_${slot}`;
    }

    function jumpToSlot(slot): string {
        if (!isNiriAvailable()) {
            notify("Niri is not available");
            return "NIRI_NOT_AVAILABLE";
        }

        const result = state.jump(slot, NiriService.windows || []);
        if (result.code === "JUMP_FOCUSED") {
            const success = NiriService.focusWindow(result.focusWindowId);
            return success ? `JUMP_FOCUSED_SLOT_${result.slot}` : `JUMP_FAILED_SLOT_${result.slot}`;
        }

        if (result.code === "EMPTY_SLOT") {
            notify(`Mark Slot ${result.slot} is empty`);
            return `EMPTY_SLOT_${result.slot}`;
        }

        if (result.code === "INVALID_SLOT") {
            return "INVALID_SLOT";
        }

        if (result.code === "STALE_MARK") {
            notify(`Mark Slot ${result.slot} window is no longer available`);
            return `STALE_MARK_SLOT_${result.slot}`;
        }

        return "JUMP_FAILED";
    }

    function isNiriAvailable(): bool {
        return typeof CompositorService !== "undefined"
            && CompositorService.isNiri
            && typeof NiriService !== "undefined"
            && NiriService.windows !== undefined;
    }

    function labelText(label): string {
        if (!label)
            return "unknown";
        if (label.title && label.title.length > 0)
            return `${label.appId} — ${label.title}`;
        return label.appId || "unknown";
    }

    function notify(message): void {
        if (typeof ToastService !== "undefined")
            ToastService.showInfo(message, "", "", "harpoonNiri");
    }
}
