const { createHarpoonCommands } = require('../plugins/harpoonNiri/Harpoon.js');

function fakeAdapter(overrides = {}) {
  const calls = { focused: [] };
  return {
    calls,
    adapter: Object.assign({
      isNiriAvailable: () => true,
      windows: () => [],
      workspaces: () => ({}),
      focusWindow: id => { calls.focused.push(id); return true; },
    }, overrides),
  };
}

test('Mark Action reports niri unavailable with notification result', () => {
  const { adapter } = fakeAdapter({ isNiriAvailable: () => false });
  const commands = createHarpoonCommands({ adapter, now: () => 1000 });

  expect(commands.markFocused()).toEqual({
    ipc: 'NIRI_NOT_AVAILABLE',
    notifications: ['Niri is not available'],
  });
});

test('Mark Action marks focused Niri Window and returns user-facing slot result', () => {
  const { adapter } = fakeAdapter({
    windows: () => [{ id: 7, app_id: 'Alacritty', title: 'shell', is_focused: true }],
  });
  const commands = createHarpoonCommands({ adapter, now: () => 1000 });

  expect(commands.markFocused()).toEqual({
    ipc: 'MARK_ASSIGNED_SLOT_1',
    notifications: ['Marked Slot 1: Alacritty — shell'],
  });
  expect(commands.status().slots[0].mark.windowId).toBe(7);
});

test('Mark Action reports no focused Niri Window with notification result', () => {
  const { adapter } = fakeAdapter({
    windows: () => [{ id: 7, app_id: 'Alacritty', title: 'shell' }],
  });
  const commands = createHarpoonCommands({ adapter, now: () => 1000 });

  expect(commands.markFocused()).toEqual({
    ipc: 'NO_FOCUSED_WINDOW',
    notifications: ['No focused Niri Window found'],
  });
});

test('Mark Action refreshes Window Label for already marked Niri Window', () => {
  let windows = [{ id: 7, app_id: 'Alacritty', title: 'shell', is_focused: true }];
  const { adapter } = fakeAdapter({ windows: () => windows });
  const commands = createHarpoonCommands({ adapter, now: () => 1000 });
  commands.markFocused();

  windows = [{ id: 7, app_id: 'Alacritty', title: 'renamed', is_focused: true }];
  expect(commands.markFocused()).toEqual({
    ipc: 'MARK_REFRESHED_SLOT_1',
    notifications: ['Refreshed Mark Slot 1: Alacritty — renamed'],
  });
});

test('Mark Action reports replacement of Least Recently Used Window Mark', () => {
  let focusedId = 1;
  let clock = 1000;
  const { adapter } = fakeAdapter({
    windows: () => Array.from({ length: 6 }, (_, index) => ({
      id: index + 1,
      app_id: `app-${index + 1}`,
      title: `window-${index + 1}`,
      is_focused: index + 1 === focusedId,
    })),
  });
  const commands = createHarpoonCommands({ adapter, now: () => clock });
  for (focusedId = 1; focusedId <= 5; focusedId++) {
    commands.markFocused();
    clock += 1000;
  }

  focusedId = 6;
  expect(commands.markFocused()).toEqual({
    ipc: 'MARK_REPLACED_SLOT_1',
    notifications: ['Replaced Mark Slot 1: app-6 — window-6'],
  });
});

test('jump to valid Window Mark focuses Niri Window and returns silent result', () => {
  const { adapter, calls } = fakeAdapter({
    windows: () => [{ id: 7, app_id: 'Alacritty', title: 'shell', is_focused: true }],
  });
  const commands = createHarpoonCommands({ adapter, now: () => 1000 });
  commands.markFocused();

  expect(commands.jumpSlot(1)).toEqual({
    ipc: 'JUMP_FOCUSED_SLOT_1',
    notifications: [],
  });
  expect(calls.focused).toEqual([7]);
});

test('jump to empty Mark Slot returns notification result without focus request', () => {
  const { adapter, calls } = fakeAdapter();
  const commands = createHarpoonCommands({ adapter, now: () => 1000 });

  expect(commands.jumpSlot(1)).toEqual({
    ipc: 'EMPTY_SLOT_1',
    notifications: ['Mark Slot 1 is empty'],
  });
  expect(calls.focused).toEqual([]);
});

test('jump focus failure reports failed slot and stays silent', () => {
  const { adapter, calls } = fakeAdapter({
    windows: () => [{ id: 7, app_id: 'Alacritty', title: 'shell', is_focused: true }],
    focusWindow: id => { calls.focused.push(id); return false; },
  });
  const commands = createHarpoonCommands({ adapter, now: () => 1000 });
  commands.markFocused();

  expect(commands.jumpSlot(1)).toEqual({
    ipc: 'JUMP_FAILED_SLOT_1',
    notifications: [],
  });
  expect(calls.focused).toEqual([7]);
});

test('jump to Stale Window Mark clears slot and returns notification result', () => {
  let windows = [{ id: 7, app_id: 'Alacritty', title: 'shell', is_focused: true }];
  const { adapter } = fakeAdapter({ windows: () => windows });
  const commands = createHarpoonCommands({ adapter, now: () => 1000 });
  commands.markFocused();

  windows = [{ id: 8 }];
  expect(commands.jumpSlot(1)).toEqual({
    ipc: 'STALE_MARK_SLOT_1',
    notifications: ['Mark Slot 1 window is no longer available'],
  });
  expect(commands.status().slots[0].mark).toBe(null);
});

test('Window Catalog sync reports cleared Stale Window Marks and notifications', () => {
  let windows = [{ id: 7, app_id: 'Alacritty', title: 'shell', is_focused: true }];
  const { adapter } = fakeAdapter({ windows: () => windows });
  const commands = createHarpoonCommands({ adapter, now: () => 1000 });
  commands.markFocused();

  windows = [];
  expect(commands.syncWindowCatalog()).toEqual({
    clearedSlots: [1],
    notifications: ['Mark Slot 1 window is no longer available'],
  });
});
