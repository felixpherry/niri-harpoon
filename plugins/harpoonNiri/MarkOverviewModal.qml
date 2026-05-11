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
    property string renameText: ""
    property string renameError: ""
    property bool renameVisible: false
    property int dragSourceSlot: 0
    property int dragHoverSlot: 0
    property bool dragActive: false
    property real dragStartY: 0
    property real dragCurrentY: 0

    readonly property int rowHeight: 72
    readonly property bool hasMarks: slots.some(slot => slot.mark !== null)

    onRenameVisibleChanged: {
        if (!renameVisible)
            return;
        shouldHaveFocus = true;
        Qt.callLater(function () {
            modalFocusScope.forceActiveFocus();
            const input = contentLoader.item && contentLoader.item.renameInput;
            if (!input)
                return;
            input.forceActiveFocus();
            input.selectAll();
            Qt.callLater(function () {
                input.forceActiveFocus();
                input.selectAll();
            });
        });
    }

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

    function moveSelected(direction) {
        if (selectedIndex < 0)
            return;
        const source = slotAt(selectedIndex);
        if (!source || !source.mark)
            return;
        const targetIndex = selectedIndex + direction;
        if (targetIndex < 0 || targetIndex >= 5)
            return;
        if (backend && backend.swapOverviewSlots)
            backend.swapOverviewSlots(selectedIndex + 1, targetIndex + 1);
        selectedIndex = targetIndex;
        keyboardNavigationActive = true;
        refreshSlots();
    }

    function beginDraggedSlot(slot, y) {
        dragSourceSlot = slot;
        dragActive = true;
        dragStartY = y;
        dragCurrentY = y;
        dragHoverSlot = targetSlotFromRowsY(y);
    }

    function updateDraggedSlot(y) {
        if (!dragActive)
            return;
        dragCurrentY = y;
        dragHoverSlot = targetSlotFromRowsY(y);
    }

    function cancelDraggedSlot() {
        dragActive = false;
        dragSourceSlot = 0;
        dragHoverSlot = 0;
        dragStartY = 0;
        dragCurrentY = 0;
    }

    function dropDraggedSlot(targetSlot) {
        if (dragSourceSlot <= 0 || targetSlot < 1 || targetSlot > 5) {
            cancelDraggedSlot();
            return;
        }
        const sourceSlot = dragSourceSlot;
        dragActive = false;
        if (backend && backend.swapOverviewSlots)
            backend.swapOverviewSlots(sourceSlot, targetSlot);
        selectedIndex = targetSlot - 1;
        keyboardNavigationActive = true;
        dragSourceSlot = 0;
        dragHoverSlot = 0;
        dragStartY = 0;
        dragCurrentY = 0;
        refreshSlots();
    }

    function targetSlotFromRowsY(y) {
        const stride = rowHeight + Theme.spacingXS;
        const targetIndex = Math.floor(y / stride);
        const rowOffset = y - targetIndex * stride;
        if (targetIndex < 0 || targetIndex >= 5 || rowOffset < 0 || rowOffset > rowHeight)
            return 0;
        return targetIndex + 1;
    }

    function activateSlot(slotNumber) {
        const slot = slotAt(slotNumber - 1);
        if (!slot || !slot.mark)
            return;
        if (backend && backend.activateOverviewSlot)
            backend.activateOverviewSlot(slotNumber);
        hide();
    }

    function displayTitle(mark) {
        if (!mark || !mark.label)
            return "No title";
        return mark.customDisplayName && mark.customDisplayName.length > 0 ? mark.customDisplayName : (mark.label.title || "No title");
    }

    function hasDisplayTitle(mark) {
        return !!mark && !!mark.label && ((mark.customDisplayName && mark.customDisplayName.length > 0) || (mark.label.title && mark.label.title.length > 0));
    }

    function requestRenameSlot(slotNumber) {
        const slot = slotAt(slotNumber - 1);
        if (!slot || !slot.mark)
            return;
        pendingAction = "rename";
        pendingSlot = slotNumber;
        renameText = slot.mark.customDisplayName && slot.mark.customDisplayName.length > 0 ? slot.mark.customDisplayName : (slot.mark.label.title || "");
        renameError = "";
        renameVisible = true;
        root.shouldHaveFocus = true;
    }

    function finishRename(save) {
        if (save && backend && backend.renameOverviewSlot) {
            const result = backend.renameOverviewSlot(pendingSlot, renameText);
            if (result === "DISPLAY_NAME_TOO_LONG") {
                renameError = "Custom Display Name must be 80 characters or less.";
                const input = contentLoader.item && contentLoader.item.renameInput;
                if (input)
                    input.forceActiveFocus();
                return;
            }
            refreshSlots();
        }
        renameVisible = false;
        pendingAction = "";
        pendingSlot = 0;
        renameError = "";
        root.shouldHaveFocus = true;
        Qt.callLater(function () { modalFocusScope.forceActiveFocus(); });
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
        renameVisible = false;
        renameText = "";
        renameError = "";
        cancelDraggedSlot();
    }

    modalFocusScope.Keys.onPressed: function (event) {
        if (clearConfirmDialog.shouldBeVisible) {
            event.accepted = true;
            return;
        }

        if (renameVisible)
            return;

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
        case Qt.Key_R:
            if (selectedIndex >= 0)
                requestRenameSlot(selectedIndex + 1);
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
            const shiftHeld = event.modifiers & Qt.ShiftModifier;
            switch (event.key) {
            case Qt.Key_J:
                if (shiftHeld)
                    moveSelected(1);
                else
                    selectNext();
                event.accepted = true;
                return;
            case Qt.Key_K:
                if (shiftHeld)
                    moveSelected(-1);
                else
                    selectPrevious();
                event.accepted = true;
                return;
            }
        }

        event.accepted = true;
    }

    content: Component {
        Item {
            property alias renameInput: renameInput

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
                    id: slotsColumn
                    width: parent.width
                    spacing: Theme.spacingXS

                    Repeater {
                        model: root.slots

                        delegate: Rectangle {
                            id: row
                            required property int index
                            required property var modelData
                            property int slotNumber: modelData.slot

                            width: parent.width
                            height: root.rowHeight
                            radius: Theme.cornerRadius
                            color: {
                                if (root.dragHoverSlot === modelData.slot)
                                    return Theme.primaryHoverLight;
                                if (modelData.mark && root.keyboardNavigationActive && root.selectedIndex === index)
                                    return Theme.primaryPressed;
                                return rowMouse.containsMouse && modelData.mark ? Theme.primaryHoverLight : Theme.withAlpha(Theme.surfaceContainerHigh, Theme.popupTransparency);
                            }
                            opacity: modelData.mark ? 1.0 : 0.74
                            z: root.dragSourceSlot === modelData.slot ? 10 : 0
                            transform: Translate {
                                y: root.dragSourceSlot === modelData.slot ? root.dragCurrentY - root.dragStartY : 0
                                Behavior on y {
                                    enabled: !root.dragActive
                                    NumberAnimation { duration: 140; easing.type: Easing.OutCubic }
                                }
                            }

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
                                anchors.right: dragHandle.left
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
                                    text: modelData.mark ? root.displayTitle(modelData.mark) : "No Window Mark"
                                    font.pixelSize: Theme.fontSizeMedium
                                    color: root.hasDisplayTitle(modelData.mark) ? Theme.surfaceText : Theme.surfaceVariantText
                                    width: parent.width
                                    elide: Text.ElideRight
                                    textFormat: Text.PlainText
                                }
                            }

                            Rectangle {
                                id: dragHandle
                                anchors.right: renameButton.left
                                anchors.rightMargin: Theme.spacingXS
                                anchors.verticalCenter: parent.verticalCenter
                                width: 32
                                height: 32
                                radius: Theme.cornerRadius / 2
                                color: dragHandleMouse.containsMouse ? Theme.surfaceVariantAlpha : "transparent"
                                visible: modelData.mark !== null
                                z: 2

                                DankIcon {
                                    anchors.centerIn: parent
                                    name: "drag_indicator"
                                    size: Theme.iconSize - 6
                                    color: Theme.surfaceText
                                }

                                MouseArea {
                                    id: dragHandleMouse
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    preventStealing: true
                                    cursorShape: pressed ? Qt.ClosedHandCursor : Qt.OpenHandCursor
                                    onPressed: function (mouse) {
                                        const point = mapToItem(slotsColumn, mouse.x, mouse.y);
                                        root.beginDraggedSlot(modelData.slot, point.y);
                                        mouse.accepted = true;
                                    }
                                    onPositionChanged: function (mouse) {
                                        if (!pressed)
                                            return;
                                        const point = mapToItem(slotsColumn, mouse.x, mouse.y);
                                        root.updateDraggedSlot(point.y);
                                        mouse.accepted = true;
                                    }
                                    onReleased: function (mouse) {
                                        const point = mapToItem(slotsColumn, mouse.x, mouse.y);
                                        const targetSlot = root.targetSlotFromRowsY(point.y);
                                        if (targetSlot > 0)
                                            root.dropDraggedSlot(targetSlot);
                                        else
                                            root.cancelDraggedSlot();
                                        mouse.accepted = true;
                                    }
                                    onCanceled: root.cancelDraggedSlot()
                                }
                            }

                            DankActionButton {
                                id: renameButton
                                anchors.right: clearButton.left
                                anchors.rightMargin: Theme.spacingXS
                                anchors.verticalCenter: parent.verticalCenter
                                iconName: "edit"
                                iconSize: Theme.iconSize - 6
                                iconColor: Theme.surfaceText
                                tooltipText: "Rename Mark Slot " + modelData.slot
                                visible: modelData.mark !== null
                                z: 2
                                onClicked: root.requestRenameSlot(modelData.slot)
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
                                z: 2
                                onClicked: root.requestClearSlot(modelData.slot)
                            }

                            MouseArea {
                                id: rowMouse
                                anchors.fill: parent
                                anchors.rightMargin: modelData.mark ? 136 : 0
                                hoverEnabled: true
                                cursorShape: modelData.mark ? Qt.PointingHandCursor : Qt.ArrowCursor
                                z: 0
                                onClicked: root.activateSlot(modelData.slot)
                            }
                        }
                    }
                }

                Row {
                    width: parent.width
                    height: 26
                    spacing: Theme.spacingS

                    Repeater {
                        model: [
                            { key: "1–5", label: "Jump" },
                            { key: "Ctrl J/K", label: "Select" },
                            { key: "Ctrl+Shift+J/K", label: "Move" },
                            { key: "R", label: "Rename" },
                            { key: "Del", label: "Clear" },
                            { key: "Esc", label: "Close" }
                        ]

                        delegate: Row {
                            required property var modelData

                            anchors.verticalCenter: parent.verticalCenter
                            spacing: 4

                            Rectangle {
                                anchors.verticalCenter: parent.verticalCenter
                                height: 20
                                width: keyText.implicitWidth + Theme.spacingS
                                radius: 6
                                color: Theme.surfaceVariantAlpha

                                StyledText {
                                    id: keyText
                                    anchors.centerIn: parent
                                    text: modelData.key
                                    font.pixelSize: Theme.fontSizeSmall - 1
                                    font.weight: Font.Medium
                                    color: Theme.surfaceText
                                }
                            }

                            StyledText {
                                anchors.verticalCenter: parent.verticalCenter
                                text: modelData.label
                                font.pixelSize: Theme.fontSizeSmall - 1
                                color: Theme.surfaceVariantText
                            }
                        }
                    }
                }
            }

            Rectangle {
                visible: root.renameVisible
                anchors.fill: parent
                color: Theme.withAlpha(Theme.surfaceContainer, 0.72)
                radius: Theme.cornerRadius

                MouseArea {
                    anchors.fill: parent
                }

                Rectangle {
                    width: Math.min(parent.width - Theme.spacingL * 2, 460)
                    height: renameErrorText.visible ? 178 : 150
                    anchors.centerIn: parent
                    radius: Theme.cornerRadius
                    color: Theme.surfaceContainerHigh
                    border.color: Theme.outlineMedium
                    border.width: 1

                    Column {
                        anchors.fill: parent
                        anchors.margins: Theme.spacingM
                        spacing: Theme.spacingM

                        StyledText {
                            text: "Rename Mark Slot " + root.pendingSlot
                            font.pixelSize: Theme.fontSizeLarge
                            font.weight: Font.Medium
                            color: Theme.surfaceText
                        }

                        DankTextField {
                            id: renameInput
                            width: parent.width
                            text: root.renameText
                            placeholderText: "Custom Display Name"
                            leftIconName: "edit"
                            showClearButton: true
                            focus: root.renameVisible
                            ignoreTabKeys: true
                            keyForwardTargets: [root.modalFocusScope]
                            onTextChanged: root.renameText = text
                            Keys.onPressed: function (event) {
                                if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) {
                                    root.finishRename(true);
                                    event.accepted = true;
                                    return;
                                }
                                if (event.key === Qt.Key_Escape) {
                                    root.finishRename(false);
                                    event.accepted = true;
                                    return;
                                }
                            }
                        }

                        StyledText {
                            id: renameErrorText
                            text: root.renameError
                            visible: root.renameError.length > 0
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.primary
                        }

                        Row {
                            anchors.right: parent.right
                            spacing: Theme.spacingS

                            DankActionButton {
                                iconName: "close"
                                tooltipText: "Cancel"
                                onClicked: root.finishRename(false)
                            }

                            DankActionButton {
                                iconName: "check"
                                tooltipText: "Save"
                                onClicked: root.finishRename(true)
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
            event.accepted = true;
        }
    }
}
