if (typeof require !== "undefined") {
    var WindowCatalogModule = require("./WindowCatalog.js");
    var WindowLabelModule = require("./WindowLabel.js");
}

function createHarpoonState(options) {
    const now = options && options.now ? options.now : () => Date.now();
    const makeLabel = typeof labelFor === "function" ? labelFor : WindowLabelModule.labelFor;
    const exists = typeof windowExists === "function" ? windowExists : WindowCatalogModule.windowExists;
    let slots = [null, null, null, null, null];

    function status() {
        return {
            slots: slots.map((mark, index) => ({
                slot: index + 1,
                mark: mark
            }))
        };
    }

    function mark(window) {
        const timestamp = now();
        let slotIndex = slots.findIndex(slot => slot && slot.windowId === window.id);
        if (slotIndex >= 0) {
            const existing = slots[slotIndex];
            slots[slotIndex] = Object.assign({}, existing, {
                label: makeLabel(window),
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
            label: makeLabel(window),
            customDisplayName: "",
            markedAt: timestamp,
            usedAt: timestamp
        };
        return {
            code: code,
            slot: slotIndex + 1
        };
    }

    function validSlotNumber(slot) {
        const slotNumber = Number(slot);
        if (!isFinite(slotNumber) || Math.floor(slotNumber) !== slotNumber || slotNumber < 1 || slotNumber > 5)
            return null;
        return slotNumber;
    }

    function normalizeDisplayName(displayName) {
        return String(displayName === undefined || displayName === null ? "" : displayName)
            .trim()
            .replace(/[ \t\r\n]*[\t\r\n][ \t\r\n]*/g, " ");
    }

    function rename(slot, displayName) {
        const slotNumber = validSlotNumber(slot);
        if (slotNumber === null) {
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
                slot: slotNumber
            };
        }

        const normalized = normalizeDisplayName(displayName);
        if (normalized.length > 80) {
            return {
                code: "DISPLAY_NAME_TOO_LONG",
                slot: slotNumber
            };
        }

        slots[slotIndex] = Object.assign({}, mark, {
            customDisplayName: normalized,
            usedAt: now()
        });
        return {
            code: normalized.length > 0 ? "RENAMED_SLOT" : "CLEARED_NAME_SLOT",
            slot: slotNumber
        };
    }

    function swap(sourceSlot, targetSlot) {
        const sourceSlotNumber = validSlotNumber(sourceSlot);
        const targetSlotNumber = validSlotNumber(targetSlot);
        if (sourceSlotNumber === null || targetSlotNumber === null) {
            return {
                code: "INVALID_SLOT",
                sourceSlot: sourceSlot,
                targetSlot: targetSlot
            };
        }

        if (sourceSlotNumber === targetSlotNumber) {
            return {
                code: "SWAP_NOOP_SLOT",
                slot: sourceSlotNumber
            };
        }

        const sourceIndex = sourceSlotNumber - 1;
        const targetIndex = targetSlotNumber - 1;
        const sourceMark = slots[sourceIndex];
        const targetMark = slots[targetIndex];
        slots[targetIndex] = sourceMark ? Object.assign({}, sourceMark, { usedAt: now() }) : null;
        slots[sourceIndex] = targetMark;

        return {
            code: "SWAPPED_SLOTS",
            sourceSlot: sourceSlotNumber,
            targetSlot: targetSlotNumber
        };
    }

    function jump(slot, windows) {
        const slotNumber = validSlotNumber(slot);
        if (slotNumber === null) {
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

        if (!exists(windows, mark.windowId)) {
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

    function clear(slot) {
        const slotNumber = validSlotNumber(slot);
        if (slotNumber === null) {
            return {
                code: "INVALID_SLOT",
                slot: slot
            };
        }

        const slotIndex = slotNumber - 1;
        if (!slots[slotIndex]) {
            return {
                code: "EMPTY_SLOT",
                slot: slotNumber
            };
        }

        slots[slotIndex] = null;
        return {
            code: "CLEARED_SLOT",
            slot: slotNumber
        };
    }

    function clearAll() {
        const clearedSlots = [];
        slots = slots.map((mark, index) => {
            if (mark)
                clearedSlots.push(index + 1);
            return null;
        });

        return {
            code: clearedSlots.length > 0 ? "CLEARED_ALL" : "NO_MARKS",
            clearedSlots: clearedSlots
        };
    }

    function syncWindowCatalog(windows) {
        const clearedSlots = [];
        slots = slots.map((mark, index) => {
            if (mark && !exists(windows, mark.windowId)) {
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
        clear,
        clearAll,
        rename,
        swap,
        syncWindowCatalog
    };
}

if (typeof module !== "undefined") {
    module.exports = { createHarpoonState };
}
