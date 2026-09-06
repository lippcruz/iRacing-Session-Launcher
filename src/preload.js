const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('launcher', {
  getState: () => ipcRenderer.invoke('get-state'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  chooseExe: () => ipcRenderer.invoke('choose-exe'),
  appInfoFromPath: (filePath) => ipcRenderer.invoke('app-info-from-path', filePath),
  startAll: () => ipcRenderer.invoke('start-all'),
  startSelected: (ids) => ipcRenderer.invoke('start-selected', ids),
  stopStarted: () => ipcRenderer.invoke('stop-started'),
  stopSelected: (ids) => ipcRenderer.invoke('stop-selected', ids),
  openConfigFolder: () => ipcRenderer.invoke('open-config-folder'),
  hideToTray: () => ipcRenderer.invoke('hide-to-tray'),
  onState: (callback) => ipcRenderer.on('state', (_event, state) => callback(state)),
});
