import QtQuick
import Quickshell
import qs.Common
import qs.Modals.Common
import qs.Widgets

DankModal {
    id: root

    property var backend: null
    property var slots: []
    property int selectedIndex: 0
    property bool keyboardNavigationActive: true
    property string pendingAction: ""
    property int pendingSlot: 0

    readonly property int rowHeight: 72
    readonly property bool hasMarks: slots.some(slot => slot.mark !== null)

    function show() {
        if (backend && backend.onOverviewOpening)
            backend.onOverviewOpening();
        refreshSlots();
        selectedIndex = firstOccupiedIndex();
        keyboardNavigationActive = selectedIndex >= 0;
        open();
        Qt.callLater(function () {
            modalFocusScope.forceActiveFocus();
            shouldHaveFocus = true;
        });
    }

    function hide() {
        close();
    }

    function toggle() {
        shouldBeVisible ? hide() : show();
    }

    function refreshSlots() {
        slots = backend && backend.overviewSlots ? backend.overviewSlots() : [];
        if (selectedIndex >= 0 && (!slotAt(selectedIndex) || !slotAt(selectedIndex).mark))
            selectedIndex = firstOccupiedIndex();
        keyboardNavigationActive = selectedIndex >= 0;
    }

    function firstOccupiedIndex() {
        for (let index = 0; index < 5; index++) {
            const slot = slotAt(index);
            if (slot && slot.mark)
                return index;
        }
        return -1;
    }

    function nextOccupiedIndex(direction) {
        if (!hasMarks)
            return -1;

        let index = selectedIndex >= 0 ? selectedIndex : (direction > 0 ? -1 : 5);
        for (let step = 0; step < 5; step++) {
            index = (index + direction + 5) % 5;
            const slot = slotAt(index);
            if (slot && slot.mark)
                return index;
        }
        return -1;
    }

    function slotAt(index) {
        if (!slots || index < 0 || index >= slots.length)
            return null;
        return slots[index];
    }

    function selectNext() {
        selectedIndex = nextOccupiedIndex(1);
        keyboardNavigationActive = selectedIndex >= 0;
    }

    function selectPrevious() {
        selectedIndex = nextOccupiedIndex(-1);
        keyboardNavigationActive = selectedIndex >= 0;
    }

    function activateSlot(slotNumber) {
        const slot = slotAt(slotNumber - 1);
        if (!slot || !slot.mark)
            return;
        if (backend && backend.activateOverviewSlot)
            backend.activateOverviewSlot(slotNumber);
        hide();
    }

    function requestClearSlot(slotNumber) {
        const slot = slotAt(slotNumber - 1);
        if (!slot || !slot.mark)
            return;
        pendingAction = "slot";
        pendingSlot = slotNumber;
        clearConfirmDialog.showWithOptions({
            title: `Clear Mark Slot ${slotNumber}?`,
            message: "This Window Mark will be cleared and the Mark Slot will become empty.",
            confirmText: "Clear",
            cancelText: "Cancel",
            confirmColor: Theme.primary,
            onConfirm: function () {
                if (backend && backend.clearOverviewSlot)
                    backend.clearOverviewSlot(pendingSlot);
                refreshSlots();
                pendingAction = "";
                pendingSlot = 0;
            },
            onCancel: function () {
                pendingAction = "";
                pendingSlot = 0;
            }
        });
    }

    function requestClearAll() {
        if (!hasMarks)
            return;
        pendingAction = "all";
        pendingSlot = 0;
        clearConfirmDialog.showWithOptions({
            title: "Clear All Harpoon Marks?",
            message: "All five Mark Slots will become empty.",
            confirmText: "Clear All",
            cancelText: "Cancel",
            confirmColor: Theme.primary,
            onConfirm: function () {
                if (backend && backend.clearOverviewAll)
                    backend.clearOverviewAll();
                refreshSlots();
                pendingAction = "";
            },
            onCancel: function () {
                pendingAction = "";
            }
        });
    }

    function iconFor(mark) {
        if (!mark || !mark.label)
            return "material:window";
        const appId = mark.label.appId || "";
        const desktopEntry = DesktopEntries.heuristicLookup(appId);
        if (desktopEntry && desktopEntry.icon)
            return desktopEntry.icon;
        return appId || "material:window";
    }

    layerNamespace: "dms:harpoon-marks"
    visible: false
    modalWidth: 650
    modalHeight: 500
    backgroundColor: Theme.withAlpha(Theme.surfaceContainer, Theme.popupTransparency)
    cornerRadius: Theme.cornerRadius
    borderColor: Theme.outlineMedium
    borderWidth: 1
    enableShadow: true
    onBackgroundClicked: hide()
    onOpened: refreshSlots()
    onDialogClosed: {
        pendingAction = "";
        pendingSlot = 0;
    }

    modalFocusScope.Keys.onPressed: function (event) {
        if (clearConfirmDialog.shouldBeVisible) {
            event.accepted = true;
            return;
        }

        switch (event.key) {
        case Qt.Key_Escape:
            hide();
            event.accepted = true;
            return;
        case Qt.Key_Down:
            selectNext();
            event.accepted = true;
            return;
        case Qt.Key_Up:
            selectPrevious();
            event.accepted = true;
            return;
        case Qt.Key_Return:
        case Qt.Key_Enter:
            if (selectedIndex >= 0)
                activateSlot(selectedIndex + 1);
            event.accepted = true;
            return;
        case Qt.Key_Delete:
            if (selectedIndex >= 0)
                requestClearSlot(selectedIndex + 1);
            event.accepted = true;
            return;
        case Qt.Key_1:
        case Qt.Key_2:
        case Qt.Key_3:
        case Qt.Key_4:
        case Qt.Key_5:
            activateSlot(event.key - Qt.Key_0);
            event.accepted = true;
            return;
        }

        if (event.modifiers & Qt.ControlModifier) {
            switch (event.key) {
            case Qt.Key_J:
                selectNext();
                event.accepted = true;
                return;
            case Qt.Key_K:
                selectPrevious();
                event.accepted = true;
                return;
            }
        }
    }

    content: Component {
        Item {
            anchors.fill: parent

            Column {
                anchors.fill: parent
                anchors.margins: Theme.spacingM
                spacing: Theme.spacingM

                Row {
                    width: parent.width
                    height: 36
                    spacing: Theme.spacingM

                    DankIcon {
                        name: "flag"
                        size: Theme.iconSize
                        color: Theme.primary
                        anchors.verticalCenter: parent.verticalCenter
                    }

                    StyledText {
                        text: "Harpoon Marks"
                        font.pixelSize: Theme.fontSizeLarge
                        font.weight: Font.Medium
                        color: Theme.surfaceText
                        anchors.verticalCenter: parent.verticalCenter
                        width: parent.width - Theme.iconSize - clearAllButton.width - closeButton.width - Theme.spacingM * 3
                        elide: Text.ElideRight
                    }

                    DankActionButton {
                        id: clearAllButton
                        iconName: "delete_sweep"
                        iconSize: Theme.iconSize - 4
                        iconColor: enabled ? Theme.surfaceText : Theme.surfaceVariantText
                        backgroundColor: enabled ? "transparent" : Theme.surfaceVariantAlpha
                        tooltipText: "Clear all Harpoon Marks"
                        enabled: root.hasMarks
                        anchors.verticalCenter: parent.verticalCenter
                        onClicked: root.requestClearAll()
                    }

                    DankActionButton {
                        id: closeButton
                        iconName: "close"
                        iconSize: Theme.iconSize - 4
                        tooltipText: "Close"
                        anchors.verticalCenter: parent.verticalCenter
                        onClicked: root.hide()
                    }
                }

                Column {
                    width: parent.width
                    spacing: Theme.spacingXS

                    Repeater {
                        model: root.slots

                        delegate: Rectangle {
                            id: row
                            required property int index
                            required property var modelData

                            width: parent.width
                            height: root.rowHeight
                            radius: Theme.cornerRadius
                            color: {
                                if (modelData.mark && root.keyboardNavigationActive && root.selectedIndex === index)
                                    return Theme.primaryPressed;
                                return rowMouse.containsMouse && modelData.mark ? Theme.primaryHoverLight : Theme.withAlpha(Theme.surfaceContainerHigh, Theme.popupTransparency);
                            }
                            opacity: modelData.mark ? 1.0 : 0.74

                            Rectangle {
                                id: slotBadge
                                anchors.left: parent.left
                                anchors.leftMargin: Theme.spacingM
                                anchors.verticalCenter: parent.verticalCenter
                                width: 24
                                height: 24
                                radius: 12
                                color: modelData.mark ? Theme.primarySelected : Theme.surfaceVariantAlpha

                                StyledText {
                                    anchors.centerIn: parent
                                    text: modelData.slot.toString()
                                    font.pixelSize: Theme.fontSizeSmall
                                    font.weight: Font.Bold
                                    color: modelData.mark ? Theme.primary : Theme.surfaceVariantText
                                }
                            }

                            AppIconRenderer {
                                id: appIcon
                                anchors.left: slotBadge.right
                                anchors.leftMargin: Theme.spacingM
                                anchors.verticalCenter: parent.verticalCenter
                                width: 36
                                height: 36
                                iconSize: 36
                                iconValue: modelData.mark ? root.iconFor(modelData.mark) : "material:tab_unselected"
                                fallbackText: modelData.mark && modelData.mark.label && modelData.mark.label.appId ? modelData.mark.label.appId.charAt(0).toUpperCase() : "-"
                                fallbackTextScale: 0.46
                                materialIconSizeAdjustment: Theme.spacingS
                                opacity: modelData.mark ? 1 : 0.7
                            }

                            Column {
                                anchors.left: appIcon.right
                                anchors.leftMargin: Theme.spacingM
                                anchors.right: clearButton.left
                                anchors.rightMargin: Theme.spacingM
                                anchors.verticalCenter: parent.verticalCenter
                                spacing: Theme.spacingXS

                                StyledText {
                                    text: modelData.mark ? (modelData.mark.label.appId || "Unknown app") : "Empty Mark Slot"
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: modelData.mark ? Theme.primary : Theme.surfaceVariantText
                                    font.weight: Font.Medium
                                    width: parent.width
                                    elide: Text.ElideRight
                                    textFormat: Text.PlainText
                                }

                                StyledText {
                                    text: modelData.mark ? (modelData.mark.label.title || "No title") : "No Window Mark"
                                    font.pixelSize: Theme.fontSizeMedium
                                    color: modelData.mark && modelData.mark.label.title ? Theme.surfaceText : Theme.surfaceVariantText
                                    width: parent.width
                                    elide: Text.ElideRight
                                    textFormat: Text.PlainText
                                }
                            }

                            DankActionButton {
                                id: clearButton
                                anchors.right: parent.right
                                anchors.rightMargin: Theme.spacingS
                                anchors.verticalCenter: parent.verticalCenter
                                iconName: "close"
                                iconSize: Theme.iconSize - 6
                                iconColor: Theme.surfaceText
                                tooltipText: "Clear Mark Slot " + modelData.slot
                                visible: modelData.mark !== null
                                onClicked: root.requestClearSlot(modelData.slot)
                            }

                            MouseArea {
                                id: rowMouse
                                anchors.fill: parent
                                anchors.rightMargin: modelData.mark ? 48 : 0
                                hoverEnabled: true
                                cursorShape: modelData.mark ? Qt.PointingHandCursor : Qt.ArrowCursor
                                onClicked: root.activateSlot(modelData.slot)
                            }
                        }
                    }
                }

                Row {
                    width: parent.width
                    height: 34
                    spacing: Theme.spacingM

                    Repeater {
                        model: [
                            { key: "1–5", label: "Jump" },
                            { key: "Ctrl J/K", label: "Move" },
                            { key: "Del", label: "Clear" },
                            { key: "Esc", label: "Close" }
                        ]

                        delegate: Row {
                            required property var modelData

                            anchors.verticalCenter: parent.verticalCenter
                            spacing: Theme.spacingXS

                            Rectangle {
                                anchors.verticalCenter: parent.verticalCenter
                                height: 24
                                width: keyText.implicitWidth + Theme.spacingM
                                radius: Theme.cornerRadius / 2
                                color: Theme.surfaceVariantAlpha
                                border.color: Theme.outlineMedium
                                border.width: 1

                                StyledText {
                                    id: keyText
                                    anchors.centerIn: parent
                                    text: modelData.key
                                    font.pixelSize: Theme.fontSizeSmall
                                    font.weight: Font.Medium
                                    color: Theme.surfaceText
                                }
                            }

                            StyledText {
                                anchors.verticalCenter: parent.verticalCenter
                                text: modelData.label
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.surfaceVariantText
                            }
                        }
                    }
                }
            }
        }
    }

    ConfirmModal {
        id: clearConfirmDialog
        confirmButtonText: pendingAction === "all" ? "Clear All" : "Clear"
        confirmButtonColor: Theme.primary
        onShouldBeVisibleChanged: {
            if (shouldBeVisible) {
                root.shouldHaveFocus = false;
                return;
            }
            Qt.callLater(function () {
                if (!root.shouldBeVisible)
                    return;
                root.shouldHaveFocus = true;
                root.modalFocusScope.forceActiveFocus();
            });
        }
        modalFocusScope.Keys.onPressed: function (event) {
            switch (event.key) {
            case Qt.Key_Y:
            case Qt.Key_Return:
            case Qt.Key_Enter:
                selectedButton = 1;
                selectButton();
                event.accepted = true;
                return;
            case Qt.Key_N:
            case Qt.Key_Escape:
                close();
                if (onCancel)
                    onCancel();
                event.accepted = true;
                return;
            case Qt.Key_Delete:
                event.accepted = true;
                return;
            }
        }
    }
}
