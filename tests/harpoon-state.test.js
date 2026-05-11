const { createHarpoonState, findFocusedWindow } = require('../plugins/harpoonNiri/Harpoon.js');

test('status starts with five empty Mark Slots', () => {
  const state = createHarpoonState({ now: () => 1000 });
  expect(state.status()).toEqual({
    slots: [
      { slot: 1, mark: null },
      { slot: 2, mark: null },
      { slot: 3, mark: null },
      { slot: 4, mark: null },
      { slot: 5, mark: null },
    ],
  });
});

test('Mark Action stores focused Niri Window in slot 1 when empty', () => {
  const state = createHarpoonState({ now: () => 1000 });
  const result = state.mark({ id: 7, app_id: 'Alacritty', title: 'shell' });

  expect(result.code).toBe('MARK_ASSIGNED');
  expect(result.slot).toBe(1);
  expect(state.status().slots[0]).toEqual({
    slot: 1,
    mark: {
      windowId: 7,
      label: { appId: 'Alacritty', title: 'shell' },
      customDisplayName: '',
      markedAt: 1000,
      usedAt: 1000,
    },
  });
});

test('Mark Action fills lowest empty Mark Slot without shifting existing marks', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });

  state.mark({ id: 1, app_id: 'a', title: 'one' });
  clock = 2000;
  const result = state.mark({ id: 2, app_id: 'b', title: 'two' });

  expect(result.code).toBe('MARK_ASSIGNED');
  expect(result.slot).toBe(2);
  expect(state.status().slots[0].mark.windowId).toBe(1);
  expect(state.status().slots[1].mark.windowId).toBe(2);
  expect(state.status().slots[2].mark).toBe(null);
});

test('Mark Action on already marked Niri Window keeps slot and refreshes used-at plus Window Label', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });

  state.mark({ id: 1, app_id: 'a', title: 'one' });
  state.mark({ id: 2, app_id: 'b', title: 'two' });
  clock = 3000;
  const result = state.mark({ id: 1, app_id: 'a', title: 'one renamed' });

  expect(result.code).toBe('MARK_REFRESHED');
  expect(result.slot).toBe(1);
  expect(state.status().slots[0].mark).toEqual({
    windowId: 1,
    label: { appId: 'a', title: 'one renamed' },
    customDisplayName: '',
    markedAt: 1000,
    usedAt: 3000,
  });
  expect(state.status().slots[1].mark.windowId).toBe(2);
});

test('focused Niri Window lookup prefers is_focused', () => {
  const focused = findFocusedWindow([
    { id: 1, workspace_id: 10 },
    { id: 2, workspace_id: 20, is_focused: true },
  ], { 10: { id: 10, active_window_id: 1, is_focused: true } });

  expect(focused.id).toBe(2);
});

test('focused Niri Window lookup falls back to focused workspace active window', () => {
  const focused = findFocusedWindow([
    { id: 1, workspace_id: 10 },
    { id: 2, workspace_id: 20 },
  ], {
    10: { id: 10, active_window_id: 1, is_focused: true },
    20: { id: 20, active_window_id: 2 },
  });

  expect(focused.id).toBe(1);
});

test('jumping to valid Window Mark requests focus and refreshes used-at', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });
  state.mark({ id: 7, app_id: 'Alacritty', title: 'shell' });

  clock = 2000;
  const result = state.jump(1, [{ id: 7 }]);

  expect(result).toEqual({ code: 'JUMP_FOCUSED', slot: 1, focusWindowId: 7 });
  expect(state.status().slots[0].mark.usedAt).toBe(2000);
});

test('jumping to empty Mark Slot rejects without focus request', () => {
  const state = createHarpoonState({ now: () => 1000 });
  const result = state.jump(1, [{ id: 7 }]);

  expect(result).toEqual({ code: 'EMPTY_SLOT', slot: 1 });
});

test('jumping to Stale Window Mark clears Mark Slot without focus request', () => {
  const state = createHarpoonState({ now: () => 1000 });
  state.mark({ id: 7, app_id: 'Alacritty', title: 'shell' });

  expect(state.jump(1, [{ id: 8 }])).toEqual({ code: 'STALE_MARK', slot: 1, windowId: 7 });
  expect(state.status().slots[0].mark).toBe(null);
});

test('jumping with invalid slot input rejects without focus request', () => {
  const state = createHarpoonState({ now: () => 1000 });
  state.mark({ id: 7, app_id: 'Alacritty', title: 'shell' });

  expect(state.jump(0, [{ id: 7 }])).toEqual({ code: 'INVALID_SLOT', slot: 0 });
  expect(state.jump(6, [{ id: 7 }])).toEqual({ code: 'INVALID_SLOT', slot: 6 });
  expect(state.jump('wat', [{ id: 7 }])).toEqual({ code: 'INVALID_SLOT', slot: 'wat' });
});

test('Clear Mark Action clears occupied Mark Slot without shifting other Mark Slots', () => {
  const state = createHarpoonState({ now: () => 1000 });
  state.mark({ id: 1, app_id: 'a', title: 'one' });
  state.mark({ id: 2, app_id: 'b', title: 'two' });
  state.mark({ id: 3, app_id: 'c', title: 'three' });

  expect(state.clear(2)).toEqual({ code: 'CLEARED_SLOT', slot: 2 });
  expect(state.status().slots.map(slot => slot.mark && slot.mark.windowId)).toEqual([1, null, 3, null, null]);
});

test('Clear Mark Action reports empty Mark Slot', () => {
  const state = createHarpoonState({ now: () => 1000 });

  expect(state.clear(4)).toEqual({ code: 'EMPTY_SLOT', slot: 4 });
});

test('Clear Mark Action reports invalid slots', () => {
  const state = createHarpoonState({ now: () => 1000 });

  expect(state.clear(0)).toEqual({ code: 'INVALID_SLOT', slot: 0 });
  expect(state.clear(6)).toEqual({ code: 'INVALID_SLOT', slot: 6 });
  expect(state.clear('wat')).toEqual({ code: 'INVALID_SLOT', slot: 'wat' });
});

test('Clear Mark Action clears all occupied Mark Slots', () => {
  const state = createHarpoonState({ now: () => 1000 });
  state.mark({ id: 1, app_id: 'a', title: 'one' });
  state.mark({ id: 2, app_id: 'b', title: 'two' });

  expect(state.clearAll()).toEqual({ code: 'CLEARED_ALL', clearedSlots: [1, 2] });
  expect(state.status().slots.map(slot => slot.mark)).toEqual([null, null, null, null, null]);
});

test('Clear Mark Action reports no marks when all Mark Slots are empty', () => {
  const state = createHarpoonState({ now: () => 1000 });

  expect(state.clearAll()).toEqual({ code: 'NO_MARKS', clearedSlots: [] });
});

test('Window Marks are cleared automatically when Niri Window disappears from Window Catalog', () => {
  const state = createHarpoonState({ now: () => 1000 });
  state.mark({ id: 1, app_id: 'a', title: 'one' });
  state.mark({ id: 2, app_id: 'b', title: 'two' });

  const result = state.syncWindowCatalog([{ id: 2 }]);

  expect(result).toEqual({ clearedSlots: [1] });
  expect(state.status().slots[0].mark).toBe(null);
  expect(state.status().slots[1].mark.windowId).toBe(2);
});

test('Mark Action replaces Least Recently Used Window Mark when all slots are full', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });
  for (let id = 1; id <= 5; id++) {
    state.mark({ id, app_id: `app-${id}`, title: `window-${id}` });
    clock += 1000;
  }

  state.jump(1, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
  clock = 7000;
  const result = state.mark({ id: 6, app_id: 'app-6', title: 'window-6' });

  expect(result.code).toBe('MARK_REPLACED');
  expect(result.slot).toBe(2);
  expect(state.status().slots.map(slot => slot.mark.windowId)).toEqual([1, 6, 3, 4, 5]);
});

test('Custom Display Name can be set, inspected, normalized, cleared, and uses status empty string', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });
  state.mark({ id: 7, app_id: 'Alacritty', title: 'shell' });

  clock = 2000;
  expect(state.rename(1, '  build\nログ\tmain  ')).toEqual({ code: 'RENAMED_SLOT', slot: 1 });
  expect(state.status().slots[0].mark.customDisplayName).toBe('build ログ main');
  expect(state.status().slots[0].mark.usedAt).toBe(2000);

  clock = 3000;
  expect(state.rename(1, '   ')).toEqual({ code: 'CLEARED_NAME_SLOT', slot: 1 });
  expect(state.status().slots[0].mark.customDisplayName).toBe('');
  expect(state.status().slots[0].mark.usedAt).toBe(3000);
});

test('Custom Display Name rejects invalid, empty, and too-long rename inputs without changing state', () => {
  const state = createHarpoonState({ now: () => 1000 });
  state.mark({ id: 7, app_id: 'Alacritty', title: 'shell' });

  expect(state.rename(0, 'name')).toEqual({ code: 'INVALID_SLOT', slot: 0 });
  expect(state.rename(2, 'name')).toEqual({ code: 'EMPTY_SLOT', slot: 2 });
  expect(state.rename(1, 'x'.repeat(81))).toEqual({ code: 'DISPLAY_NAME_TOO_LONG', slot: 1 });
  expect(state.status().slots[0].mark.customDisplayName).toBe('');
});

test('Custom Display Name survives re-mark and is discarded on LRU replacement', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });
  state.mark({ id: 1, app_id: 'app-1', title: 'one' });
  state.rename(1, 'primary');

  clock = 2000;
  state.mark({ id: 1, app_id: 'app-1', title: 'one changed' });
  expect(state.status().slots[0].mark.label.title).toBe('one changed');
  expect(state.status().slots[0].mark.customDisplayName).toBe('primary');

  for (let id = 2; id <= 5; id++) {
    clock += 1000;
    state.mark({ id, app_id: `app-${id}`, title: `window-${id}` });
  }
  clock = 7000;
  state.mark({ id: 6, app_id: 'app-6', title: 'window-6' });

  expect(state.status().slots[0].mark.windowId).toBe(6);
  expect(state.status().slots[0].mark.customDisplayName).toBe('');
});

test('Rename refreshes recent-use status so LRU replacement keeps renamed Window Mark', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });
  for (let id = 1; id <= 5; id++) {
    state.mark({ id, app_id: `app-${id}`, title: `window-${id}` });
    clock += 1000;
  }

  clock = 7000;
  state.rename(1, 'keep');
  clock = 8000;
  const result = state.mark({ id: 6, app_id: 'app-6', title: 'window-6' });

  expect(result.slot).toBe(2);
  expect(state.status().slots.map(slot => slot.mark.windowId)).toEqual([1, 6, 3, 4, 5]);
});

test('Move Mark Action swaps occupied Mark Slots and refreshes source mark only', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });
  state.mark({ id: 1, app_id: 'a', title: 'one' });
  clock = 2000;
  state.mark({ id: 2, app_id: 'b', title: 'two' });

  clock = 3000;
  expect(state.swap(1, 2)).toEqual({ code: 'SWAPPED_SLOTS', sourceSlot: 1, targetSlot: 2 });

  expect(state.status().slots.map(slot => slot.mark && slot.mark.windowId)).toEqual([2, 1, null, null, null]);
  expect(state.status().slots[1].mark.usedAt).toBe(3000);
  expect(state.status().slots[0].mark.usedAt).toBe(2000);
});

test('Move Mark Action swaps occupied and empty Mark Slots without compaction', () => {
  const state = createHarpoonState({ now: () => 1000 });
  state.mark({ id: 1, app_id: 'a', title: 'one' });
  state.mark({ id: 2, app_id: 'b', title: 'two' });

  expect(state.swap(1, 4)).toEqual({ code: 'SWAPPED_SLOTS', sourceSlot: 1, targetSlot: 4 });
  expect(state.status().slots.map(slot => slot.mark && slot.mark.windowId)).toEqual([null, 2, null, 1, null]);

  expect(state.swap(3, 5)).toEqual({ code: 'SWAPPED_SLOTS', sourceSlot: 3, targetSlot: 5 });
  expect(state.status().slots.map(slot => slot.mark && slot.mark.windowId)).toEqual([null, 2, null, 1, null]);

  expect(state.swap(1, 2)).toEqual({ code: 'SWAPPED_SLOTS', sourceSlot: 1, targetSlot: 2 });
  expect(state.status().slots.map(slot => slot.mark && slot.mark.windowId)).toEqual([2, null, null, 1, null]);
});

test('Move Mark Action reports same-slot no-op and invalid slots', () => {
  const state = createHarpoonState({ now: () => 1000 });
  state.mark({ id: 1, app_id: 'a', title: 'one' });

  expect(state.swap(1, 1)).toEqual({ code: 'SWAP_NOOP_SLOT', slot: 1 });
  expect(state.swap(0, 1)).toEqual({ code: 'INVALID_SLOT', sourceSlot: 0, targetSlot: 1 });
  expect(state.swap(1, 6)).toEqual({ code: 'INVALID_SLOT', sourceSlot: 1, targetSlot: 6 });
});

test('Move Mark Action refreshes recency so LRU replacement keeps moved source mark', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });
  for (let id = 1; id <= 5; id++) {
    state.mark({ id, app_id: `app-${id}`, title: `window-${id}` });
    clock += 1000;
  }

  clock = 7000;
  state.swap(1, 5);
  clock = 8000;
  const result = state.mark({ id: 6, app_id: 'app-6', title: 'window-6' });

  expect(result.slot).toBe(2);
  expect(state.status().slots.map(slot => slot.mark.windowId)).toEqual([5, 6, 3, 4, 1]);
});
