const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { spawn, execFile } = require('child_process');
const readline = require('readline');
const { SessionMonitor, isSimulator } = require('./session-monitor');
const { AppController } = require('./app-controller');
const { normalizeConfig, validateConfigChange } = require('./config');

const defaults = { language: 'auto', monitorEnabled: true, stopWhenIracingCloses: true, apps: [] };
const monitor = new SessionMonitor();
const controller = new AppController({ terminateProcess: (process) => new Promise((resolve, reject) => {
  execFile(probePath, ['--stop', String(process.pid), process.startedAt], { windowsHide: true, timeout: 6000 },
    (error) => error ? reject(error) : resolve());
}) });
const assets = app.isPackaged ? path.join(process.resourcesPath, 'build-assets') : path.join(__dirname, '..', 'build-assets');
const probePath = path.join(assets, 'SessionProbe.exe');
let config = { ...defaults, apps: [] };
let configPath, mainWindow, tray, probe, watchdog, restartTimer;
let quitting = false;
let lastProbeAt = 0;
let latestSnapshot = null;
const events = [];

// Keep existing installations' data in the same directory across display-name changes.
app.setPath('userData', process.env.LAUNCHER_DATA_DIR || path.join(app.getPath('appData'), 'iracing-session-launcher'));

function record(level, message) {
  const event = { id: randomUUID(), at: Date.now(), level, message };
  events.unshift(event);
  if (events.length > 150) events.pop();
  if (configPath) {
    try {
      const file = path.join(path.dirname(configPath), 'activity.log');
      if (fs.existsSync(file) && fs.statSync(file).size > 2 * 1024 * 1024) fs.renameSync(file, file + '.old');
      fs.appendFileSync(file, JSON.stringify(event) + '\n');
    } catch { /* Activity remains available in memory if disk logging fails. */ }
  }
  pushState();
}

function loadConfig() {
  configPath = path.join(app.getPath('userData'), 'apps.json');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  if (fs.existsSync(configPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = normalizeConfig(parsed);
    } catch (error) {
      fs.copyFileSync(configPath, configPath + '.backup-' + Date.now());
      record('error', 'Não foi possível ler a configuração. / Could not read configuration: ' + error.message);
    }
  }
  monitor.setEnabled(config.monitorEnabled);
}

function saveConfig() {
  const temporary = configPath + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(config, null, 2));
  fs.renameSync(temporary, configPath);
}

function currentState() {
  return {
    config, monitor: monitor.state, events,
    apps: config.apps.map((item) => ({ id: item.id, ...controller.status(item) })),
    version: app.getVersion(), configPath,
  };
}

function pushState() {
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isLoading()) {
    mainWindow.webContents.send('state', currentState());
  }
  if (tray && !tray.isDestroyed()) tray.setToolTip('iRacing Session Launcher: ' + (config.monitorEnabled ? 'monitorando' : 'pausado') + ' | ' + config.apps.filter((item) => controller.status(item).managed).length + ' apps');
}

function startProbe() {
  if (quitting) return;
  lastProbeAt = Date.now();
  const probeArgs = [String(process.pid)];
  if (!app.isPackaged && process.env.LAUNCHER_TEST_MAP) probeArgs.push(process.env.LAUNCHER_TEST_MAP);
  probe = spawn(probePath, probeArgs, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const child = probe;
  const lines = readline.createInterface({ input: child.stdout });
  lines.on('line', (line) => {
    try {
      const snapshot = JSON.parse(line.replace(/^\uFEFF/, ''));
      if (!Array.isArray(snapshot.processes)) throw new Error('Resposta inválida do monitor. / Invalid monitor response.');
      if (!app.isPackaged && process.env.LAUNCHER_TEST_MAP) snapshot.processes = snapshot.processes.filter((process) => !isSimulator(process));
      lastProbeAt = Date.now();
      latestSnapshot = snapshot;
      controller.updateProcesses(snapshot.processes);
      monitor.update(snapshot);
    } catch (error) { monitor.fail(error.message); }
  });
  child.stderr.on('data', (data) => record('error', 'Monitor: ' + data.toString().trim()));
  child.once('error', (error) => {
    monitor.fail(error.message);
    record('error', 'Falha ao iniciar o monitor. / Failed to start monitor: ' + error.message);
  });
  child.once('close', () => {
    lines.close();
    if (quitting) return;
    monitor.fail('Monitor desconectado; reconectando. / Monitor disconnected; reconnecting.');
    restartTimer = setTimeout(startProbe, 3000);
  });
}

async function appInfoFromPath(filePath) {
  if (typeof filePath !== 'string' || filePath.length > 32767 || !path.win32.isAbsolute(filePath) || path.extname(filePath).toLowerCase() !== '.exe' || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw new Error('Selecione um executável .exe existente. / Select an existing .exe file.');
  let name = path.basename(filePath, path.extname(filePath));
  try {
    const metadata = await new Promise((resolve, reject) => execFile(probePath, ['--metadata', filePath], { windowsHide: true, timeout: 5000 },
      (error, output) => {
        if (error) return reject(error);
        try { resolve(JSON.parse(output.replace(/^\uFEFF/, ''))); } catch (parseError) { reject(parseError); }
      }));
    if (metadata.name?.trim()) name = metadata.name.trim();
  } catch { }
  let icon = '';
  try { icon = (await app.getFileIcon(filePath, { size: 'large' })).toDataURL(); } catch { }
  return { name, path: filePath, icon };
}

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 820, height: 580, minWidth: 720, minHeight: 520,
    show: false, backgroundColor: '#f3f3f3', titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#f3f3f3', symbolColor: '#242424', height: 40 },
    icon: path.join(assets, 'app.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.webContents.on('will-attach-webview', (event) => event.preventDefault());
  mainWindow.webContents.session.setPermissionCheckHandler(() => false);
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  tray = new Tray(path.join(assets, 'app.ico'));
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir / Open Session Launcher', click: showWindow },
    { type: 'separator' },
    { label: 'Iniciar todos / Start all', click: () => { try { void startConfiguredApps(config.apps); } catch (error) { record('error', error.message); } } },
    { label: 'Parar iniciados / Stop started', click: () => controller.stopMany(config.apps) },
    { type: 'separator' },
    { label: 'Sair / Exit', click: () => app.quit() },
  ]));
  tray.on('double-click', showWindow);
  tray.on('click', showWindow);
}

controller.on('change', pushState);
controller.on('log', ({ level, message }) => record(level, message));
monitor.on('state', pushState);
monitor.on('session-start', (state) => {
  record('success', state.source === 'SDK' ? 'Sessão conectada; iniciando aplicativos. / Session connected; starting applications.' : 'Simulador detectado; iniciando aplicativos. / Simulator detected; starting applications.');
  void controller.startMany(config.apps, true);
});
monitor.on('session-stop', () => {
  record('info', 'Sessão do iRacing encerrada. / iRacing session ended.');
  controller.cancelPending(true);
  if (config.stopWhenIracingCloses) controller.stopMany(config.apps.filter((item) => item.stopWithIracing));
});

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', showWindow);
  app.whenReady().then(async () => {
    loadConfig();
    createWindow();
    record('info', 'Monitor iniciado; aguardando iRacing. / Monitor started; waiting for iRacing.');
    startProbe();
    watchdog = setInterval(() => {
      if (Date.now() - lastProbeAt > 10000 && probe && !probe.killed) {
        monitor.fail('Monitor sem resposta; reconectando. / Monitor unresponsive; reconnecting.');
        record('error', 'Monitor sem resposta; reiniciando. / Monitor unresponsive; restarting.');
        probe.kill();
      }
    }, 5000);
    for (const item of config.apps.filter((item) => !item.icon && fs.existsSync(item.path))) {
      try {
        const info = await appInfoFromPath(item.path);
        item.icon = info.icon;
      } catch (error) { record('error', item.name + ': ' + error.message); }
    }
    saveConfig();
    pushState();
  }).catch((error) => { dialog.showErrorBox('Erro ao abrir Session Launcher', error.message); app.quit(); });
}

app.on('before-quit', () => {
  quitting = true;
  clearInterval(watchdog);
  clearTimeout(restartTimer);
  controller.dispose();
  if (probe && !probe.killed) probe.kill();
  if (tray) tray.destroy();
});
app.on('window-all-closed', () => app.quit());

function handleTrusted(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame) {
      throw new Error('Origem IPC não autorizada. / Unauthorized IPC source.');
    }
    return handler(...args);
  });
}

function selectedApps(ids) {
  if (!Array.isArray(ids) || ids.length > config.apps.length || ids.some((id) => typeof id !== 'string')) {
    throw new Error('Seleção de aplicativos inválida. / Invalid application selection.');
  }
  const selected = new Set(ids);
  return config.apps.filter((item) => selected.has(item.id));
}

handleTrusted('get-state', currentState);
handleTrusted('save-config', (nextConfig) => {
  const previous = config;
  const next = normalizeConfig(nextConfig);
  validateConfigChange(previous, next, controller);
  config = next;
  try { saveConfig(); } catch (error) { config = previous; throw error; }
  for (const old of previous.apps) {
    const replacement = config.apps.find((item) => item.id === old.id);
    if (!replacement || JSON.stringify(replacement) !== JSON.stringify(old)) controller.cancelApp(old);
  }
  monitor.setEnabled(config.monitorEnabled);
  if (!config.monitorEnabled) controller.cancelPending(true);
  if (latestSnapshot && Date.now() - lastProbeAt < 5000) monitor.update(latestSnapshot);
  pushState();
  return currentState();
});
handleTrusted('choose-exe', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { title: 'Selecionar aplicativo / Select application', filters: [{ name: 'Aplicativos Windows / Windows applications', extensions: ['exe'] }], properties: ['openFile'] });
  return result.canceled || !result.filePaths.length ? null : appInfoFromPath(result.filePaths[0]);
});
handleTrusted('app-info-from-path', (filePath) => appInfoFromPath(filePath));
function startConfiguredApps(items) {
  if (!latestSnapshot || Date.now() - lastProbeAt > 5000) throw new Error('Aguarde o monitor atualizar antes de iniciar os apps. / Wait for the monitor to refresh before starting apps.');
  return controller.startMany(items);
}
handleTrusted('start-all', () => startConfiguredApps(config.apps));
handleTrusted('start-selected', (ids) => startConfiguredApps(selectedApps(ids)));
handleTrusted('stop-started', () => controller.stopMany(config.apps));
handleTrusted('stop-selected', (ids) => controller.stopMany(selectedApps(ids)));
handleTrusted('open-config-folder', () => shell.openPath(path.dirname(configPath)));
handleTrusted('hide-to-tray', () => { if (tray && !tray.isDestroyed()) mainWindow.hide(); });
