const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('events');
const { AppController } = require('../src/app-controller');
const app = (name, overrides = {}) => ({ name, path: 'C:\\Apps\\' + name + '.exe', enabled: true, startWithIracing: true, delayStartSeconds: 0, ...overrides });

function setup(exists = () => true) {
  const spawned = [];
  const controller = new AppController({ exists, spawnProcess: (path, args, options) => {
    const child = new EventEmitter();
    Object.assign(child, { pid: spawned.length + 10, killed: false, unref() {}, kill() { this.killed = true; return true; } });
    spawned.push({ path, args, options, child });
    queueMicrotask(() => child.emit(path.includes('denied') ? 'error' : 'spawn', new Error('EACCES')));
    return child;
  } });
  return { controller, spawned };
}

test('missing or denied executable does not prevent other apps from opening', async () => {
  const { controller, spawned } = setup((path) => !path.includes('missing'));
  await controller.startMany([app('missing'), app('denied'), app('overlay')], true);
  assert.equal(spawned.length, 2);
  assert.equal(controller.status(app('missing')).status, 'error');
  assert.equal(controller.status(app('denied')).status, 'error');
  assert.equal(controller.status(app('overlay')).status, 'running');
});

test('simultaneous manual and automatic requests do not duplicate the same executable', async () => {
  const { controller, spawned } = setup();
  await Promise.all([controller.start(app('overlay')), controller.start(app('overlay'), true)]);
  assert.equal(spawned.length, 1);
});

test('cancel pending automatic launch after session ends', async () => {
  const { controller, spawned } = setup();
  const start = controller.start(app('overlay', { delayStartSeconds: 30 }), true);
  controller.cancelPending(true);
  await start;
  assert.equal(spawned.length, 0);
  assert.equal(controller.pending.size, 0);
});

test('editing or deleting an app cancels its pending manual launch too', async () => {
  const { controller, spawned } = setup();
  const item = app('overlay', { delayStartSeconds: 30 });
  const pending = controller.start(item);
  controller.cancelApp(item);
  await pending;
  assert.equal(spawned.length, 0);
});

test('each app delay is independent, Windows arguments are passed verbatim', async () => {
  const { controller, spawned } = setup();
  const start = controller.startMany([app('slow', { delayStartSeconds: 30 }), app('fast', { arguments: '--name="my overlay"' })]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(spawned.length, 1);
  assert.equal(spawned[0].path, app('fast').path);
  assert.deepEqual(spawned[0].args, ['--name="my overlay"']);
  assert.equal(spawned[0].options.windowsVerbatimArguments, true);
  assert.equal(spawned[0].options.argv0, '"' + app('fast').path + '"');
  controller.cancelPending();
  await start;
});

test('same name in a different folder is not mistaken for the configured app', async () => {
  const { controller, spawned } = setup();
  controller.updateProcesses([{ pid: 99, name: 'overlay.exe', path: 'D:\\Different\\overlay.exe' }]);
  await controller.start(app('overlay'));
  assert.equal(spawned.length, 1);
});

test('external processes are neither duplicated nor stopped; owned processes can be stopped', async () => {
  const { controller, spawned } = setup();
  controller.updateProcesses([{ pid: 99, name: 'overlay.exe', path: app('overlay').path }]);
  await controller.startMany([app('overlay'), app('owned')]);
  assert.equal(controller.status(app('overlay')).status, 'external');
  assert.equal(spawned.length, 1);
  controller.stopMany([app('overlay'), app('owned')]);
  assert.equal(spawned[0].child.killed, true);
});

test('manual-only and disabled apps are skipped by automation', async () => {
  const { controller, spawned } = setup();
  await controller.startMany([app('disabled', { enabled: false }), app('manual', { startWithIracing: false }), app('auto')], true);
  assert.equal(spawned.length, 1);
  assert.equal(spawned[0].path, app('auto').path);
});

test('Squirrel app version is recognized as the same application', async () => {
  const { controller, spawned } = setup();
  controller.updateProcesses([{ pid: 88, name: 'overlay.exe', path: 'C:\\Apps\\app-8.2.0\\overlay.exe' }]);
  await controller.start(app('overlay'));
  assert.equal(spawned.length, 0);
  assert.equal(controller.status(app('overlay')).status, 'external');
});

test('launcher handoff retains ownership of a matching descendant, not an unrelated app', async () => {
  const { controller, spawned } = setup();
  await controller.start(app('overlay'));
  spawned[0].child.emit('exit', 0);
  controller.updateProcesses([
    { pid: 90, parentPid: 88, startedAt: '1236', name: 'overlay.exe', path: 'C:\\Apps\\app-8.2.0\\overlay.exe' },
    { pid: 88, parentPid: 10, startedAt: '1234', name: 'overlay.exe', path: 'C:\\Apps\\app-8.2.0\\overlay.exe' },
    { pid: 89, parentPid: 10, startedAt: '1235', name: 'other.exe', path: 'C:\\Apps\\other.exe' },
  ]);
  assert.equal(controller.status(app('overlay')).managed, true);
  assert.equal(controller.status(app('overlay')).pid, 88);
  let stopped;
  controller.terminateProcess = async (process) => { stopped = process; };
  await controller.stop(app('overlay'));
  assert.equal(stopped.pid, 88);
  assert.equal(stopped.startedAt, '1234');
  controller.updateProcesses([]);
  assert.notEqual(controller.status(app('overlay')).status, 'running');
});

test('a reused launcher PID does not transfer ownership to an unrelated app', async () => {
  const { controller, spawned } = setup();
  await controller.start(app('overlay'));
  spawned[0].child.emit('exit', 0);
  controller.updateProcesses([
    { pid: 10, parentPid: 5, startedAt: '9999', name: 'other.exe', path: 'D:\\other.exe' },
    { pid: 88, parentPid: 10, startedAt: '99999', name: 'overlay.exe', path: app('overlay').path },
  ]);
  assert.equal(controller.status(app('overlay')).managed, false);
});
