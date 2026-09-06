const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeConfig, validateConfigChange } = require('../src/config');
const app = { id: 'one', path: 'C:\\Apps\\Overlay.exe' };
test('normalizes old configuration, retaining choices and removing obsolete fields', () => {
  const config = normalizeConfig({ pollSeconds: 2, monitorEnabled: false, stopWhenIracingCloses: false, apps: [{ ...app, stopWithIracing: false, delayStartSeconds: -3 }] });
  assert.equal(config.monitorEnabled, false);
  assert.equal(config.stopWhenIracingCloses, false);
  assert.equal(config.apps[0].stopWithIracing, false);
  assert.equal(config.apps[0].delayStartSeconds, 0);
  assert.equal('pollSeconds' in config, false);
  assert.equal(config.apps[0].name, 'Overlay');
});
test('new apps retain automatic start and stop defaults and stable IDs', () => {
  const first = normalizeConfig({ apps: [{ path: app.path }] });
  assert.equal(first.apps[0].stopWithIracing, true);
  assert.equal(first.apps[0].startWithIracing, true);
  assert.equal(normalizeConfig(first).apps[0].id, first.apps[0].id);
});
test('rejects malformed entries, duplicate executable paths and duplicate IDs', () => {
  for (const input of [null, {}, { apps: [null] }, { apps: [{ path: 'relative.exe' }] }, { apps: [{ path: 'C:\\folder' }] }, { apps: [app, { ...app, id: 'two', path: app.path.toUpperCase() }] }, { apps: [app, { ...app, path: 'C:\\Other.exe' }] }]) {
    assert.throws(() => normalizeConfig(input));
  }
});
test('only accepts embedded bitmap icons', () => {
  assert.equal(normalizeConfig({ apps: [{ ...app, icon: 'https://tracking.invalid/icon.png' }] }).apps[0].icon, '');
});
test('bounds user-controlled configuration values', () => {
  const config = normalizeConfig({ apps: [{ ...app, id: 'x'.repeat(129), name: 'N'.repeat(250), arguments: 'a'.repeat(9000) }] });
  assert.notEqual(config.apps[0].id, 'x'.repeat(129));
  assert.equal(config.apps[0].name.length, 200);
  assert.equal(config.apps[0].arguments.length, 8192);
  assert.throws(() => normalizeConfig({ apps: Array.from({ length: 201 }, (_, index) => ({ path: `C:\\Apps\\${index}.exe` })) }));
});
test('running apps cannot become unmanaged by deleting or changing their path', () => {
  const previous = normalizeConfig({ apps: [app] });
  const controller = { status: () => ({ managed: true }) };
  assert.throws(() => validateConfigChange(previous, { apps: [] }, controller));
  assert.throws(() => validateConfigChange(previous, { apps: [{ ...app, path: 'C:\\Another.exe' }] }, controller));
  assert.doesNotThrow(() => validateConfigChange(previous, previous, controller));
});
