Status: ready-for-agent

# Move Mark Action end-to-end

## Parent

.scratch/harpoon-custom-names-reorder/PRD.md

## What to build

Add **Move Mark Action** support for reordering **Window Marks** end-to-end. A user should be able to swap **Mark Slots** through IPC, move the selected **Window Mark** with keyboard shortcuts in the **Mark Overview**, and drag from a per-row handle to directly swap with another row. Reordering preserves fixed **Mark Slot** numbers, allows empty slots, avoids compaction/insert-shift behavior, and remains session-only.

This slice includes state behavior, command behavior, keyboard move UI, drag-handle direct swap UI, automated tests, and README/manual smoke documentation.

## Acceptance criteria

- [ ] `swap(sourceSlot, targetSlot)` swaps the contents of two valid **Mark Slots** without validating targets against the **Window Catalog**.
- [ ] `swap(sourceSlot, targetSlot)` allows empty **Mark Slots** as source or target.
- [ ] `swap(sourceSlot, targetSlot)` returns `INVALID_SLOT` when either slot is invalid and does not notify.
- [ ] `swap(sourceSlot, targetSlot)` with identical slots returns `SWAP_NOOP_SLOT_n` and does not notify.
- [ ] Successful `swap(sourceSlot, targetSlot)` returns `SWAPPED_SLOTS_a_b` and does not notify.
- [ ] Successful swap refreshes recent-use status for the moved source **Window Mark** when one exists, but not for the displaced target **Window Mark**.
- [ ] Reordering does not compact occupied **Mark Slots**, skip empty **Mark Slots**, create/delete **Mark Slots**, or renumber **Mark Slots**.
- [ ] Pressing `Ctrl+Shift+J` in the **Mark Overview** swaps the selected occupied **Mark Slot** with the next **Mark Slot**.
- [ ] Pressing `Ctrl+Shift+K` in the **Mark Overview** swaps the selected occupied **Mark Slot** with the previous **Mark Slot**.
- [ ] Keyboard move swaps with adjacent empty slots as well as occupied slots.
- [ ] Keyboard move at slot 1 upward or slot 5 downward is a no-op and does not wrap.
- [ ] After keyboard move, selection follows the moved **Window Mark** to its new **Mark Slot**.
- [ ] Keyboard move on no selection or no occupied selected row is a no-op.
- [ ] A per-row drag handle appears only for occupied **Mark Slots**.
- [ ] Dragging to reorder starts from the drag handle, not the whole row.
- [ ] Row click continues to jump to an occupied **Window Mark** rather than starting drag.
- [ ] Every **Mark Slot** row is a drop target during drag, including empty rows.
- [ ] Drop target row highlights while hovered during drag.
- [ ] Dropping a dragged **Window Mark** onto an occupied row directly swaps those two **Mark Slots**.
- [ ] Dropping a dragged **Window Mark** onto an empty row directly swaps with the empty **Mark Slot**.
- [ ] Dropping outside **Mark Slot** rows cancels reorder without changing state.
- [ ] Reorder actions do not notify; the updated **Mark Overview** is the feedback.
- [ ] Footer hints include `Ctrl+Shift+J/K` move while preserving `Ctrl+J/K` selection movement.
- [ ] Automated tests cover swapping two occupied slots, occupied-to-empty swap, empty source/target swap, same-slot no-op, invalid swap, LRU refresh for moved source mark only, and LRU replacement after move interaction.
- [ ] Command tests cover `SWAPPED_SLOTS_a_b`, `SWAP_NOOP_SLOT_n`, and `INVALID_SLOT`, with no notifications.
- [ ] Manual smoke docs cover `swap` IPC, `Ctrl+Shift+J/K` adjacent swaps, boundary no-op, selection following moved mark, drag-handle direct swap onto occupied and empty rows, hover highlight, outside-drop cancel, row click still jumping, and no notification noise.

## Blocked by

None - can start immediately
