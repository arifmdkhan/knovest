const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, ...globals });
  return exports;
}

test('loading a room cannot apply automatic camera or microphone capture defaults', async () => {
  const { loadRoomCall } = load('src/lib/load-room-call.ts');
  const preferences = {};
  let captures = 0;
  const response = { call: { id: 'room' } };
  const result = await loadRoomCall({
    camera: { disable: async () => { preferences.video = false; } },
    microphone: { disable: async () => { preferences.audio = false; } },
    get: async () => {
      // Model the SDK's behaviour: an unset preference allows its capture defaults.
      if (preferences.video === undefined) captures++;
      if (preferences.audio === undefined) captures++;
      return response;
    },
  });
  assert.equal(captures, 0);
  assert.equal(result, response);
});

test('a failed device preference stops room loading before SDK defaults run', async () => {
  const { loadRoomCall } = load('src/lib/load-room-call.ts');
  let loaded = false;
  await assert.rejects(loadRoomCall({
    camera: { disable: async () => { throw new Error('device failed'); } },
    microphone: { disable: async () => {} },
    get: async () => { loaded = true; },
  }), /device failed/);
  assert.equal(loaded, false);
});

test('room launches request a new tab without popup features and detach the opener', () => {
  const tab = { opener: {} };
  let args;
  const { openRoomTab } = load('src/lib/open-room-tab.ts', { window: { open: (...values) => { args = values; return tab; } } });
  assert.equal(openRoomTab('/trade-room/room'), tab);
  assert.deepEqual(Array.from(args), ['/trade-room/room', '_blank']);
  assert.equal(tab.opener, null);
});

test('blocked tab launches can be handled without navigating the original page', () => {
  const { openRoomTab } = load('src/lib/open-room-tab.ts', { window: { open: () => null } });
  assert.equal(openRoomTab('/trade-room/room'), null);
});
