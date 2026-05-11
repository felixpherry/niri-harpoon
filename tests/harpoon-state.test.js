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
