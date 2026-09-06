const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SessionMonitor } = require('../src/session-monitor');
const sim = { name: 'iRacingSim64DX11.exe' };
const sample = (connected, processes = []) => ({ connected, processes });

test('SDK connection starts once, including launcher opened during a session', () => {
  const monitor = new SessionMonitor();
  let starts = 0;
  monitor.on('session-start', () => starts++);
  monitor.update(sample(true, [sim]), 0);
  monitor.update(sample(true, [sim]), 1000);
  assert.equal(starts, 1);
  assert.equal(monitor.state.source, 'SDK');
});

test('process fallback ignores UI and service and tolerates casing', () => {
  const monitor = new SessionMonitor();
  let starts = 0;
  monitor.on('session-start', () => starts++);
  monitor.update(sample(false, [{ name: 'iRacingUI.exe' }, { name: 'iRacingService64.exe' }]), 0);
  monitor.update(sample(false, [{ name: 'IRACINGSIM64DX11.EXE' }]), 1000);
  monitor.update(sample(false, [{ name: 'IRACINGSIM64DX11.EXE' }]), 8999);
  assert.equal(starts, 0);
  monitor.update(sample(false, [{ name: 'IRACINGSIM64DX11.EXE' }]), 9000);
  assert.equal(starts, 1);
});

test('disconnect is debounced, probe errors are not disconnects, reconnect starts again', () => {
  const monitor = new SessionMonitor();
  let starts = 0, stops = 0;
  monitor.on('session-start', () => starts++);
  monitor.on('session-stop', () => stops++);
  monitor.update(sample(true, [sim]), 0);
  monitor.fail('Access denied');
  assert.equal(stops, 0);
  monitor.update(sample(false, [sim]), 10000);
  assert.equal(stops, 0);
  monitor.update(sample(false), 11000);
  monitor.update(sample(false), 13000);
  assert.equal(stops, 0);
  monitor.update(sample(false), 14000);
  assert.equal(stops, 1);
  monitor.update(sample(true, [sim]), 15000);
  assert.equal(starts, 2);
});

test('enabling automation during an already open session triggers apps', () => {
  const monitor = new SessionMonitor();
  let starts = 0;
  monitor.on('session-start', () => starts++);
  monitor.setEnabled(false);
  monitor.update(sample(true, [sim]), 0);
  assert.equal(starts, 0);
  monitor.setEnabled(true);
  monitor.update(sample(true, [sim]), 1000);
  assert.equal(starts, 1);
});

test('SDK read error is unknown rather than a session disconnect', () => {
  const monitor = new SessionMonitor();
  let stops = 0;
  monitor.on('session-stop', () => stops++);
  monitor.update(sample(true), 0);
  monitor.update({ connected: false, sdkError: 'Access denied', processes: [] }, 5000);
  monitor.update({ connected: false, sdkError: 'Access denied', processes: [] }, 10000);
  assert.equal(stops, 0);
  assert.equal(monitor.state.phase, 'error');
});
