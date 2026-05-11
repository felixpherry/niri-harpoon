import QtQuick
import Quickshell.Io
import qs.Services
import qs.Modules.Plugins
import "Harpoon.js" as Harpoon

PluginComponent {
    id: root

    property var pluginService: null
    property var commands: null

    Connections {
        target: NiriService
        function onWindowsChanged() {
            root.syncWindowCatalog();
        }
    }

    property var ipcHandler: IpcHandler {
        target: "harpoonNiri"

        function status(): string {
            return JSON.stringify(root.ensureCommands().status(), null, 2);
        }

        function mark(): string {
            const result = root.ensureCommands().markFocused();
            root.notifyAll(result.notifications);
            return result.ipc;
        }

        function jump(slot: string): string {
            const result = root.ensureCommands().jumpSlot(slot);
            root.notifyAll(result.notifications);
            return result.ipc;
        }
    }

    function ensureCommands() {
        if (commands)
            return commands;

        commands = Harpoon.createHarpoonCommands({
            adapter: {
                isNiriAvailable: root.isNiriAvailable,
                windows: function() { return NiriService.windows || []; },
                workspaces: function() { return NiriService.workspaces || {}; },
                focusWindow: function(windowId) { return NiriService.focusWindow(windowId); },
                notify: root.notify
            }
        });
        return commands;
    }

    function syncWindowCatalog() {
        const result = root.ensureCommands().syncWindowCatalog();
        root.notifyAll(result.notifications);
    }

    Component.onCompleted: syncWindowCatalog()

    function isNiriAvailable(): bool {
        return typeof CompositorService !== "undefined"
            && CompositorService.isNiri
            && typeof NiriService !== "undefined"
            && NiriService.windows !== undefined;
    }

    function notifyAll(messages) {
        for (let index = 0; messages && index < messages.length; index++)
            notify(messages[index]);
    }

    function notify(message) {
        if (typeof ToastService !== "undefined")
            ToastService.showInfo(message, "", "", "harpoonNiri");
    }
}
