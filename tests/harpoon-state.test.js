const assert = require('node:assert/strict');
const { createHarpoonState, findFocusedWindow } = require('../plugins/harpoonNiri/HarpoonState.js');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('status starts with five empty Mark Slots', () => {
  const state = createHarpoonState({ now: () => 1000 });
  assert.deepEqual(state.status(), {
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

  assert.equal(result.code, 'MARK_ASSIGNED');
  assert.equal(result.slot, 1);
  assert.deepEqual(state.status().slots[0], {
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

  assert.equal(result.code, 'MARK_ASSIGNED');
  assert.equal(result.slot, 2);
  assert.equal(state.status().slots[0].mark.windowId, 1);
  assert.equal(state.status().slots[1].mark.windowId, 2);
  assert.equal(state.status().slots[2].mark, null);
});

test('Mark Action on already marked Niri Window keeps slot and refreshes used-at', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });

  state.mark({ id: 1, app_id: 'a', title: 'one' });
  state.mark({ id: 2, app_id: 'b', title: 'two' });
  clock = 3000;
  const result = state.mark({ id: 1, app_id: 'a', title: 'one renamed' });

  assert.equal(result.code, 'MARK_REFRESHED');
  assert.equal(result.slot, 1);
  assert.deepEqual(state.status().slots[0].mark, {
    windowId: 1,
    label: { appId: 'a', title: 'one' },
    markedAt: 1000,
    usedAt: 3000,
  });
  assert.equal(state.status().slots[1].mark.windowId, 2);
});

test('focused Niri Window lookup prefers is_focused', () => {
  const focused = findFocusedWindow([
    { id: 1, workspace_id: 10 },
    { id: 2, workspace_id: 20, is_focused: true },
  ], { 10: { id: 10, active_window_id: 1, is_focused: true } });

  assert.equal(focused.id, 2);
});

test('focused Niri Window lookup falls back to focused workspace active window', () => {
  const focused = findFocusedWindow([
    { id: 1, workspace_id: 10 },
    { id: 2, workspace_id: 20 },
  ], {
    10: { id: 10, active_window_id: 1, is_focused: true },
    20: { id: 20, active_window_id: 2 },
  });

  assert.equal(focused.id, 1);
});

test('jumping to valid Window Mark requests focus and refreshes used-at', () => {
  let clock = 1000;
  const state = createHarpoonState({ now: () => clock });
  state.mark({ id: 7, app_id: 'Alacritty', title: 'shell' });

  clock = 2000;
  const result = state.jump(1, [{ id: 7 }]);

  assert.deepEqual(result, { code: 'JUMP_FOCUSED', slot: 1, focusWindowId: 7 });
  assert.equal(state.status().slots[0].mark.usedAt, 2000);
});

test('jumping to empty Mark Slot rejects without focus request', () => {
  const state = createHarpoonState({ now: () => 1000 });
  const result = state.jump(1, [{ id: 7 }]);

  assert.deepEqual(result, { code: 'EMPTY_SLOT', slot: 1 });
});

test('jumping to mark missing from Window Catalog rejects without focus request', () => {
  const state = createHarpoonState({ now: () => 1000 });
  state.mark({ id: 7, app_id: 'Alacritty', title: 'shell' });

  assert.deepEqual(state.jump(1, [{ id: 8 }]), { code: 'STALE_MARK', slot: 1, windowId: 7 });
  assert.equal(state.status().slots[0].mark.usedAt, 1000);
});

test('jumping with invalid slot input rejects without focus request', () => {
  const state = createHarpoonState({ now: () => 1000 });
  state.mark({ id: 7, app_id: 'Alacritty', title: 'shell' });

  assert.deepEqual(state.jump(0, [{ id: 7 }]), { code: 'INVALID_SLOT', slot: 0 });
  assert.deepEqual(state.jump(6, [{ id: 7 }]), { code: 'INVALID_SLOT', slot: 6 });
  assert.deepEqual(state.jump('wat', [{ id: 7 }]), { code: 'INVALID_SLOT', slot: 'wat' });
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

  assert.equal(result.code, 'MARK_REPLACED');
  assert.equal(result.slot, 2);
  assert.deepEqual(state.status().slots.map(slot => slot.mark.windowId), [1, 6, 3, 4, 5]);
});
