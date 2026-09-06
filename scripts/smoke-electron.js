const { _electron: electron } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { spawn, execFileSync } = require('child_process');
const readline = require('readline');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'verification');
const temporary = fs.mkdtempSync(path.join(require('os').tmpdir(), 'session-launcher-smoke-'));
const data = path.join(temporary, 'profile');
const fixturePath = path.join(temporary, 'LauncherTestCompanion.exe');
const mapFixturePath = path.join(temporary, 'SessionMapFixture.exe');
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(data, { recursive: true });
execFileSync(path.join(process.env.WINDIR, 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'),
  ['/nologo', '/target:exe', '/out:' + fixturePath, path.join(root, 'tests/ProbeFixture.cs')], { windowsHide: true });
fs.copyFileSync(fixturePath, mapFixturePath);
const editableFixture = path.join(temporary, 'ConfiguredCompanion.exe');
fs.copyFileSync(fixturePath, editableFixture);
const sourceApps = [{ id: 'fixture', name: 'Aplicativo de teste', path: fixturePath }];
fs.writeFileSync(path.join(data, 'apps.json'), JSON.stringify({ language: 'pt-BR', monitorEnabled: false, stopWhenIracingCloses: true, apps: sourceApps }));
const mapName = 'Local\\SessionLauncherTest-' + process.pid;
const fixture = spawn(mapFixturePath, [mapName], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
let app;
let page;
const errors = [];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(check, label, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { if (await check()) return; await delay(150); }
  throw new Error('Timeout: ' + label);
}

(async () => {
  const lines = readline.createInterface({ input: fixture.stdout });
  await new Promise((resolve) => lines.once('line', resolve));
  const env = { ...process.env, LAUNCHER_DATA_DIR: data, LAUNCHER_TEST_MAP: mapName };
  delete env.ELECTRON_RUN_AS_NODE;
  app = await electron.launch({ executablePath: require('electron'), args: [root], env });
  page = await app.firstWindow();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.waitForFunction(() => window.launcher && document.querySelector('#monitorStatus').textContent.includes('pausada'));
  await waitFor(async () => (await page.evaluate(() => window.launcher.getState())).monitor.checkedAt, 'probe ready');
  await delay(1000);
  await page.screenshot({ path: path.join(output, 'apps-desktop.png') });
  const assertLayout = async () => {
    const overflow = await page.evaluate(() => [...document.querySelectorAll('main, .toolbar, .selection-bar, .app-row, .connection, .dialog-content footer')]
      .filter((element) => element.getBoundingClientRect().width && element.scrollWidth > element.clientWidth + 2).map((element) => element.className));
    assert.deepEqual(overflow, []);
  };
  await assertLayout();
  if (sourceApps.length) {
    await page.locator('.app-row input').first().check();
    await page.waitForFunction(() => !document.querySelector('#startSelected').disabled);
    await page.screenshot({ path: path.join(output, 'apps-selected.png') });
  }
  await page.locator('#addApp').click();
  assert.equal(await page.locator('#appStopWithIracing').isChecked(), true);
  assert.equal(await page.locator('#appStartWithIracing').isChecked(), true);
  await page.locator('#appPath').fill(editableFixture);
  await page.locator('#appName').click();
  await page.waitForFunction(() => document.querySelector('#appName').value.length > 0);
  await page.screenshot({ path: path.join(output, 'dialog-desktop.png') });
  await assertLayout();
  await page.locator('#saveApp').click();
  await page.waitForFunction(() => !document.querySelector('#appDialog').open);
  assert.equal(await page.locator('.app-row').count(), 2);
  await page.locator('.app-row').last().locator('[data-action="edit"]').click();
  await page.locator('#appName').fill('Aplicativo revisado');
  await page.locator('#saveApp').click();
  await page.waitForFunction(() => !document.querySelector('#appDialog').open);
  assert.ok((await page.locator('#appList').innerText()).includes('Aplicativo revisado'));
  await page.locator('.app-row').last().locator('[data-action="edit"]').click();
  await page.locator('#deleteApp').click();
  await page.waitForFunction(() => !document.querySelector('#appDialog').open);
  assert.equal(await page.locator('.app-row').count(), 1);
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(720, 520));
  await delay(300);
  await page.screenshot({ path: path.join(output, 'apps-compact.png') });
  await assertLayout();
  await page.locator('#addApp').click();
  await page.screenshot({ path: path.join(output, 'dialog-compact.png') });
  assert.equal(await page.locator('#saveApp').isVisible(), true);
  await page.locator('#cancelDialog').click();
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(850, 610));
  const makeItem = (id, file, overrides = {}) => ({ id, name: id, path: file, enabled: true, startWithIracing: true, stopWithIracing: true, ...overrides });
  await page.evaluate((apps) => window.launcher.saveConfig({ monitorEnabled: true, stopWhenIracingCloses: true, apps }), [
    makeItem('Missing executable', path.join(output, 'missing.exe')),
    makeItem('Test companion', fixturePath),
    makeItem('Manual app', path.join(output, 'manual.exe'), { startWithIracing: false }),
  ]);
  fixture.stdin.write('connect\n');
  await waitFor(async () => {
    const current = await page.evaluate(() => window.launcher.getState());
    return current.apps.some((item) => item.id === 'Test companion' && item.managed);
  }, 'SDK connection starts companion');
  let current = await page.evaluate(() => window.launcher.getState());
  assert.equal(current.apps.find((item) => item.id === 'Missing executable').status, 'error');
  assert.equal(current.apps.find((item) => item.id === 'Manual app').status, 'stopped');
  const companionPid = current.apps.find((item) => item.id === 'Test companion').pid;
  assert.ok(companionPid);
  await delay(1500);
  current = await page.evaluate(() => window.launcher.getState());
  assert.equal(current.events.filter((event) => event.message.includes('Test companion: iniciado')).length, 1);
  assert.equal(current.apps.find((item) => item.id === 'Test companion').status, 'running');
  assert.equal(current.monitor.source, 'SDK');
  await page.getByRole('button', { name: 'Atividade', exact: true }).click();
  await page.screenshot({ path: path.join(output, 'activity.png') });
  fixture.stdin.write('disconnect\n');
  await waitFor(async () => !(await page.evaluate(() => window.launcher.getState())).apps.some((item) => item.managed), 'SDK disconnect stops companion');
  current = await page.evaluate(() => window.launcher.getState());
  assert.ok(current.events.some((event) => event.message.includes('iRacing session ended')));
  await waitFor(async () => (await page.evaluate(() => window.launcher.getState())).events.some((event) => event.message.includes('Test companion: encerramento solicitado')), 'stop completion logged');
  assert.equal(current.apps.find((item) => item.id === 'Test companion').status, 'stopped');
  assert.throws(() => process.kill(companionPid, 0));
  await page.getByRole('button', { name: 'Configurações', exact: true }).click();
  await page.screenshot({ path: path.join(output, 'settings.png') });
  await page.locator('#language').selectOption('en');
  await page.waitForFunction(() => document.documentElement.lang === 'en' && document.querySelector('#viewTitle').textContent === 'Settings');
  assert.equal(await page.locator('#startAll').textContent(), 'Start all');
  await page.screenshot({ path: path.join(output, 'settings-en.png') });
  await assertLayout();
  const probePid = await app.evaluate(() => process.pid);
  await app.close();
  app = null;
  await delay(1600);
  const probeList = JSON.parse(execFileSync(path.join(root, 'build-assets/SessionProbe.exe'), ['--once'], { windowsHide: true, encoding: 'utf8' }));
  assert.equal(probeList.processes.some((process) => process.name === 'SessionProbe.exe' && process.parentPid === probePid), false);
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, 'smoke-result.json'), JSON.stringify({ passed: true, screenshots: 8, checks: ['real Electron UI', 'Portuguese and English UI', 'compact layout', 'default auto-stop', 'executable metadata', 'SDK shared-memory trigger', 'failure isolation', 'single launch', 'manual-only skipped', 'stop owned process', 'probe shutdown'], rendererErrors: errors }, null, 2));
  console.log('Electron smoke passed: SDK signal -> app launch, no duplicate, stop, layouts, clean exit.');
})().catch(async (error) => {
  if (page && !page.isClosed()) {
    await page.screenshot({ path: path.join(output, 'failure.png') });
    console.error(await page.locator('body').innerText());
    console.error(await page.evaluate(() => ({ bridge: !!window.launcher, icons: typeof lucide })));
  }
  console.error(error); process.exitCode = 1;
}).finally(async () => {
  if (app) {
    try { if (page && !page.isClosed()) await page.evaluate(() => window.launcher.stopStarted()); } catch {}
    try { await app.close(); } catch {}
  }
  fixture.stdin.end();
  fixture.kill();
  await delay(1000);
  // Only generated test data is removed; the real application profile is never read.
  if (path.dirname(temporary) !== path.resolve(require('os').tmpdir()) || !path.basename(temporary).startsWith('session-launcher-smoke-')) throw new Error('Unexpected test directory.');
  fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
