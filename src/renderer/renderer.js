let state = null;
let selected = new Set();
let editingId = null;
let view = 'apps';
let listSignature = '';
let eventSignature = '';
let toastTimer;
let metadataRequest = 0;
let configWrites = Promise.resolve();
const $ = (id) => document.getElementById(id);
const icons = () => lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const text = (id, value) => { $(id).textContent = value; };
const time = (at) => at ? new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Aguardando';
const iconMarkup = (item) => /^data:image\/(?:png|jpeg|x-icon);base64,/.test(item.icon || '')
  ? '<img src="' + escapeHtml(item.icon) + '" alt="" />' : '<i data-lucide="app-window"></i>';

function showError(error) {
  text('toast', error.message || String(error));
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 7000);
}

async function run(action) {
  try { return await action(); } catch (error) { showError(error); return null; }
}

function setView(next) {
  view = next;
  document.querySelectorAll('[data-view]').forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  ['apps', 'activity', 'settings'].forEach((name) => { $(name + 'View').hidden = name !== view; });
  text('viewTitle', { apps: 'Aplicativos', activity: 'Atividade', settings: 'Configura\u00e7\u00f5es' }[view]);
  $('addApp').hidden = view !== 'apps';
  if (state) render(state);
}

function render(nextState) {
  state = nextState;
  const { config, monitor, apps } = state;
  selected = new Set([...selected].filter((id) => config.apps.some((item) => item.id === id)));
  const openCount = apps.filter((item) => ['running', 'external'].includes(item.status)).length;
  const subtitles = {
    apps: config.apps.length + ' aplicativos \u00b7 ' + openCount + ' em execu\u00e7\u00e3o',
    activity: 'Conex\u00f5es, aberturas e encerramentos',
    settings: 'Prefer\u00eancias do Session Launcher',
  };
  text('pageSubtitle', subtitles[view]);
  const phases = {
    checking: ['Verificando iRacing', 'Conectando ao monitor'],
    waiting: ['Aguardando sess\u00e3o', 'iRacing ainda n\u00e3o est\u00e1 aberto'],
    loading: ['iRacing abrindo', 'Aguardando conex\u00e3o com a sess\u00e3o'],
    connected: ['Sess\u00e3o conectada', 'iRacing conectado pelo SDK'],
    process: ['Simulador aberto', 'Detectado por processo \u00b7 SDK indispon\u00edvel'],
    error: ['Falha no monitoramento', monitor.error || 'Reconectando ao monitor'],
  };
  const [title, detail] = phases[monitor.phase] || phases.checking;
  text('iracingStatus', title);
  text('connectionDetail', detail);
  $('connectionDetail').title = monitor.error || detail;
  $('connectionIcon').classList.toggle('live', ['connected', 'process'].includes(monitor.phase));
  $('connectionIcon').classList.toggle('error', monitor.phase === 'error');
  $('monitorEnabled').checked = config.monitorEnabled;
  $('stopWhenIracingCloses').checked = config.stopWhenIracingCloses;
  text('monitorStatus', !config.monitorEnabled ? 'Abertura autom\u00e1tica pausada' : monitor.phase === 'error' ? 'Monitor indispon\u00edvel' : monitor.checkedAt ? 'Monitor ativo \u00b7 ' + time(monitor.checkedAt) : 'Iniciando monitor');
  $('monitorDot').className = 'dot' + (monitor.phase === 'error' ? ' error' : config.monitorEnabled && monitor.checkedAt ? ' live' : '');
  text('diagnosticSource', monitor.phase === 'error' ? monitor.error : monitor.source === 'SDK' ? 'SDK conectado' : monitor.source === 'process' ? 'Processo do simulador' : 'Aguardando iRacing');
  text('diagnosticTime', time(monitor.checkedAt));
  text('diagnosticProcess', monitor.simulator || 'N\u00e3o encontrado');
  text('version', state.version);
  $('errorBadge').hidden = !state.events.some((event) => event.level === 'error');
  $('startAll').disabled = !config.apps.some((item) => item.enabled);
  $('stopStarted').disabled = !apps.some((item) => item.managed || item.status === 'pending');
  renderList();
  renderEvents();
}

function visibleApps() {
  if (!state) return [];
  const query = $('searchApps').value.toLowerCase().trim();
  return state.config.apps.filter((item) => (item.name + ' ' + item.path).toLowerCase().includes(query));
}

function renderList() {
  const items = visibleApps();
  const signature = JSON.stringify([items, state.apps, [...selected]]);
  const visibleSelected = items.filter((item) => selected.has(item.id)).length;
  $('selectAll').checked = items.length > 0 && visibleSelected === items.length;
  $('selectAll').indeterminate = visibleSelected > 0 && visibleSelected < items.length;
  $('selectAll').disabled = !items.length;
  text('selectionCount', selected.size ? selected.size + (selected.size === 1 ? ' selecionado' : ' selecionados') : 'Nenhum selecionado');
  document.querySelector('.selection-bar').classList.toggle('has-selection', selected.size > 0);
  $('startSelected').disabled = !state.config.apps.some((item) => selected.has(item.id) && item.enabled);
  $('stopSelected').disabled = !state.apps.some((item) => selected.has(item.id) && (item.managed || item.status === 'pending'));
  if (signature === listSignature) return;
  listSignature = signature;
  const focused = document.activeElement?.dataset.action;
  const focusedId = document.activeElement?.closest('[data-id]')?.dataset.id;
  const list = $('appList');
  if (!items.length) {
    list.innerHTML = state.config.apps.length
      ? '<div class="empty"><i data-lucide="search-x"></i><strong>Nenhum resultado</strong></div>'
      : '<div class="empty"><i data-lucide="panels-top-left"></i><strong>Nenhum aplicativo adicionado</strong><button class="button" data-action="add"><i data-lucide="plus"></i>Adicionar aplicativo</button></div>';
    icons();
    return;
  }
  list.innerHTML = items.map((item) => {
    const runtime = state.apps.find((entry) => entry.id === item.id) || { status: 'stopped' };
    const labels = { running: 'Em execu\u00e7\u00e3o', external: 'J\u00e1 aberto', pending: 'Agendado', stopped: 'Parado', error: 'Falha ao abrir' };
    const tone = ['running', 'external'].includes(runtime.status) ? 'live' : runtime.status === 'error' ? 'error' : runtime.status === 'pending' ? 'pending' : '';
    const notes = !item.enabled ? ['Desativado'] : [item.startWithIracing ? 'Ao conectar' : 'In\u00edcio manual', item.stopWithIracing ? 'Fechar ao sair' : null, item.delayStartSeconds ? item.delayStartSeconds + 's de atraso' : null].filter(Boolean);
    const stoppable = runtime.managed || runtime.status === 'pending';
    const command = stoppable ? 'stop' : 'start';
    const commandTitle = stoppable ? 'Parar ' : 'Iniciar ';
    return '<div class="app-row' + (selected.has(item.id) ? ' selected' : '') + '" data-id="' + escapeHtml(item.id) + '">' +
      '<input type="checkbox" data-action="select" aria-label="Selecionar ' + escapeHtml(item.name) + '"' + (selected.has(item.id) ? ' checked' : '') + ' />' +
      '<div class="app-icon">' + iconMarkup(item) + '</div>' +
      '<div class="app-main" title="' + escapeHtml(item.path) + '"><strong>' + escapeHtml(item.name) + '</strong><small>' + notes.join(' \u00b7 ') + '</small></div>' +
      '<div class="app-status ' + tone + '" title="' + escapeHtml(runtime.error || (runtime.status === 'external' ? 'Aberto fora deste launcher' : labels[runtime.status])) + '"><span class="dot"></span>' + labels[runtime.status] + '</div>' +
      '<div class="row-actions"><button class="icon-button" data-action="' + command + '" title="' + commandTitle + escapeHtml(item.name) + '" aria-label="' + commandTitle + escapeHtml(item.name) + '"' + (!stoppable && (!item.enabled || runtime.status === 'external') ? ' disabled' : '') + '><i data-lucide="' + (stoppable ? 'square' : 'play') + '"></i></button>' +
      '<button class="icon-button" data-action="edit" title="Editar ' + escapeHtml(item.name) + '" aria-label="Editar ' + escapeHtml(item.name) + '"><i data-lucide="pencil"></i></button></div></div>';
  }).join('');
  icons();
  if (focused && focusedId) {
    [...list.querySelectorAll('[data-action]')].find((element) => element.dataset.action === focused && element.closest('[data-id]').dataset.id === focusedId)?.focus();
  }
}

function renderEvents() {
  const events = state.events.filter((event) => !$('errorsOnly').checked || event.level === 'error');
  const signature = JSON.stringify(events);
  if (signature === eventSignature) return;
  eventSignature = signature;
  $('eventList').innerHTML = events.length ? events.map((event) =>
    '<div class="event ' + event.level + '"><i data-lucide="' + (event.level === 'error' ? 'circle-alert' : event.level === 'success' ? 'circle-check' : 'circle-dot') + '"></i><span>' + escapeHtml(event.message) + '</span><time>' + time(event.at) + '</time></div>'
  ).join('') : '<div class="empty"><i data-lucide="check-check"></i><strong>' + ($('errorsOnly').checked ? 'Nenhum erro registrado' : 'Nenhuma atividade registrada') + '</strong></div>';
  icons();
}

function saveConfig(patch) {
  configWrites = configWrites.catch(() => {}).then(async () => {
    const result = await window.launcher.saveConfig({ ...state.config, ...patch });
    render(result);
  });
  return configWrites;
}

function setDialogIcon(item) {
  $('dialogIcon').dataset.icon = item.icon || '';
  $('dialogIcon').innerHTML = iconMarkup(item);
  icons();
}

function openDialog(id = null) {
  if (!state) return;
  editingId = id;
  metadataRequest++;
  const item = id ? state.config.apps.find((entry) => entry.id === id) : { enabled: true, startWithIracing: true, stopWithIracing: true };
  if (!item) return;
  text('dialogTitle', id ? 'Editar aplicativo' : 'Adicionar aplicativo');
  $('deleteApp').hidden = !id;
  $('appPath').value = item.path || '';
  $('appName').value = item.name || '';
  $('appArguments').value = item.arguments || '';
  $('appDelay').value = item.delayStartSeconds || 0;
  $('appEnabled').checked = item.enabled !== false;
  $('appStartWithIracing').checked = item.startWithIracing !== false;
  $('appStopWithIracing').checked = item.stopWithIracing !== false;
  $('appStartHidden').checked = item.startHidden === true;
  $('dialogError').hidden = true;
  setDialogIcon(item);
  $('appDialog').showModal();
}

async function updateMetadata(filePath) {
  if (!filePath) return;
  const request = ++metadataRequest;
  try {
    const info = await window.launcher.appInfoFromPath(filePath);
    if (request !== metadataRequest || !$('appDialog').open) return;
    $('appName').value = info.name;
    setDialogIcon(info);
    $('dialogError').hidden = true;
  } catch (error) {
    if (request !== metadataRequest) return;
    text('dialogError', error.message);
    $('dialogError').hidden = false;
  }
}

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
$('viewActivity').addEventListener('click', () => setView('activity'));
$('searchApps').addEventListener('input', renderList);
$('errorsOnly').addEventListener('change', renderEvents);
$('startAll').addEventListener('click', () => run(() => window.launcher.startAll()));
$('stopStarted').addEventListener('click', () => run(() => window.launcher.stopStarted()));
$('startSelected').addEventListener('click', () => run(() => window.launcher.startSelected([...selected])));
$('stopSelected').addEventListener('click', () => run(() => window.launcher.stopSelected([...selected])));
$('addApp').addEventListener('click', () => openDialog());
$('openConfig').addEventListener('click', () => run(() => window.launcher.openConfigFolder()));
$('hideToTray').addEventListener('click', () => run(() => window.launcher.hideToTray()));
$('selectAll').addEventListener('change', () => {
  visibleApps().forEach((item) => $('selectAll').checked ? selected.add(item.id) : selected.delete(item.id));
  renderList();
});
$('appList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (button?.dataset.action === 'add') return openDialog();
  const row = event.target.closest('[data-id]');
  if (!row) return;
  const id = row.dataset.id;
  const action = button?.dataset.action;
  if (action === 'edit') return openDialog(id);
  if (action === 'start') return run(() => window.launcher.startSelected([id]));
  if (action === 'stop') return run(() => window.launcher.stopSelected([id]));
  selected.has(id) ? selected.delete(id) : selected.add(id);
  renderList();
});
$('appList').addEventListener('dblclick', (event) => {
  if (event.target.closest('button, input')) return;
  const row = event.target.closest('[data-id]');
  if (row) openDialog(row.dataset.id);
});
['closeDialog', 'cancelDialog'].forEach((id) => $(id).addEventListener('click', () => $('appDialog').close()));
$('appDialog').addEventListener('close', () => { metadataRequest++; });
$('browseExe').addEventListener('click', () => run(async () => {
  const result = await window.launcher.chooseExe();
  if (!result) return;
  metadataRequest++;
  $('appPath').value = result.path;
  $('appName').value = result.name;
  setDialogIcon(result);
  $('dialogError').hidden = true;
}));
$('appPath').addEventListener('change', () => updateMetadata($('appPath').value.trim()));
$('appPath').addEventListener('input', () => {
  metadataRequest++;
  setDialogIcon({});
});
$('appForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const item = {
    id: editingId || undefined, path: $('appPath').value.trim(), name: $('appName').value.trim(),
    icon: $('dialogIcon').dataset.icon || '', arguments: $('appArguments').value.trim(),
    delayStartSeconds: Number($('appDelay').value || 0), enabled: $('appEnabled').checked,
    startWithIracing: $('appStartWithIracing').checked, stopWithIracing: $('appStopWithIracing').checked,
    startHidden: $('appStartHidden').checked,
  };
  const duplicate = state.config.apps.find((entry) => entry.id !== editingId && entry.path.toLowerCase() === item.path.toLowerCase());
  if (duplicate) { text('dialogError', 'Este execut\u00e1vel j\u00e1 est\u00e1 na lista.'); $('dialogError').hidden = false; return; }
  $('saveApp').disabled = true;
  try {
    const detected = await window.launcher.appInfoFromPath(item.path);
    item.icon = detected.icon;
    const apps = editingId ? state.config.apps.map((entry) => entry.id === editingId ? item : entry) : [...state.config.apps, item];
    await saveConfig({ apps });
    $('appDialog').close();
  } catch (error) {
    text('dialogError', error.message);
    $('dialogError').hidden = false;
  } finally { $('saveApp').disabled = false; }
});
$('deleteApp').addEventListener('click', () => run(async () => {
  await saveConfig({ apps: state.config.apps.filter((item) => item.id !== editingId) });
  $('appDialog').close();
}));
$('monitorEnabled').addEventListener('change', () => run(() => saveConfig({ monitorEnabled: $('monitorEnabled').checked })));
$('stopWhenIracingCloses').addEventListener('change', () => run(() => saveConfig({ stopWhenIracingCloses: $('stopWhenIracingCloses').checked })));
icons();
window.launcher.onState(render);
run(async () => render(await window.launcher.getState()));
