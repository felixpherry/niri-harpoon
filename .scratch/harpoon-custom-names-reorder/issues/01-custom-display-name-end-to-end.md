Status: ready-for-agent

# Custom Display Name end-to-end

## Parent

.scratch/harpoon-custom-names-reorder/PRD.md

## What to build

Add **Custom Display Name** support for occupied **Mark Slots** end-to-end. A user should be able to set, clear, inspect, and use a custom name for a **Window Mark** through IPC and the **Mark Overview**. The custom name replaces only the title portion of user-facing mark text; app id and icon remain based on the underlying **Niri Window**. Custom names are session-only and are stored on the **Window Mark**, not the **Mark Slot**.

This slice includes state behavior, command behavior, overview rename UI, debug status output, label formatting, automated tests, and README/manual smoke documentation.

## Acceptance criteria

- [ ] Each occupied **Window Mark** exposes a `customDisplayName` value in debug status; absence is represented as `""` rather than `null` or omission.
- [ ] Mark display falls back to the **Niri Window** title when `customDisplayName` is empty.
- [ ] Non-empty **Custom Display Name** replaces only the displayed title text; app id and icon lookup remain based on the **Niri Window**.
- [ ] `rename(slot, displayName)` sets or clears the **Custom Display Name** for one occupied **Mark Slot** without validating the target against the **Window Catalog**.
- [ ] `rename(slot, displayName)` trims leading/trailing whitespace, normalizes internal newlines and tabs to single spaces, allows Unicode, and rejects names longer than 80 characters after normalization.
- [ ] `rename(slot, displayName)` returns `INVALID_SLOT` for invalid slots and does not notify.
- [ ] `rename(slot, displayName)` returns `EMPTY_SLOT_n` for empty **Mark Slots** and does not notify.
- [ ] Successful non-empty rename returns `RENAMED_SLOT_n` and does not notify.
- [ ] Successful empty or whitespace-only rename clears the name, returns `CLEARED_NAME_SLOT_n`, and does not notify.
- [ ] Too-long rename returns `DISPLAY_NAME_TOO_LONG` and does not notify.
- [ ] Setting or clearing a **Custom Display Name** refreshes recent-use status for that **Window Mark**.
- [ ] Re-marking an already marked **Niri Window** refreshes raw **Window Label** data and recent-use status while preserving **Custom Display Name**.
- [ ] LRU replacement discards the replaced mark's **Custom Display Name** and creates the new mark with an empty name.
- [ ] Mark/jump/refresh notifications that include mark text use app id plus **Custom Display Name** when one exists.
- [ ] The **Mark Overview** opens with the first occupied **Mark Slot** selected; if no marks exist, no slot is selected.
- [ ] Pressing `R` on an occupied row opens a rename modal.
- [ ] Empty **Mark Slots** cannot be renamed.
- [ ] A per-row rename control appears only for occupied **Mark Slots**.
- [ ] Rename modal is prefilled with existing **Custom Display Name** when present, otherwise current window title.
- [ ] Pressing `Enter` in the rename modal saves and returns to the **Mark Overview**.
- [ ] Pressing `Escape` in the rename modal cancels without changing state and returns to the **Mark Overview**.
- [ ] Saving empty or whitespace-only text clears the **Custom Display Name** and restores title fallback.
- [ ] **Mark Overview** rows display **Custom Display Name** in the title line when present.
- [ ] Footer hints include `R` rename while preserving existing jump/select/clear/close hints.
- [ ] Automated tests cover rename success, clear-name behavior, normalization, Unicode, overlong rejection, invalid slot, empty slot, status shape, re-mark preservation, LRU replacement clearing, and LRU refresh after rename.
- [ ] Command tests cover `RENAMED_SLOT_n`, `CLEARED_NAME_SLOT_n`, `EMPTY_SLOT_n`, `INVALID_SLOT`, and `DISPLAY_NAME_TOO_LONG`, with no notifications.
- [ ] README/manual smoke docs cover `rename` IPC, `R` rename modal, row rename control, prefill, save/cancel, blank clear, overlong rejection, and no notification noise.

## Blocked by

None - can start immediately
