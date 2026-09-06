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
const messages = {
  pt: {
    apps: 'Aplicativos', activity: 'Atividade', settings: 'Configurações', hideTray: 'Recolher para a bandeja', addApp: 'Adicionar app', automatic: 'Automático', startAll: 'Iniciar todos', stopAll: 'Parar todos', search: 'Buscar aplicativo', application: 'APLICATIVO', status: 'STATUS', startSelected: 'Iniciar selecionados', stopSelected: 'Parar selecionados', recentActivity: 'Atividade recente', errorsOnly: 'Somente erros', behavior: 'Comportamento', language: 'Idioma', languageDetail: 'Usar o idioma do Windows ou escolher manualmente.', closeApps: 'Fechar apps ao sair do iRacing', closeAppsDetail: 'Somente os iniciados aqui e marcados para fechar.', closeWindow: 'Ao fechar a janela', closeWindowDetail: 'Encerrar o launcher e o monitoramento.', monitoring: 'Monitoramento', openConfig: 'Abrir pasta de configuração', viewActivity: 'Ver atividade', connection: 'Conexão', lastCheck: 'Última verificação', simulator: 'Simulador', version: 'Versão',
    appSubtitle: (total, open) => `${total} aplicativos · ${open} em execução`, activitySubtitle: 'Conexões, aberturas e encerramentos', settingsSubtitle: 'Preferências do Session Launcher', checking: ['Verificando iRacing', 'Conectando ao monitor'], waiting: ['Aguardando sessão', 'iRacing ainda não está aberto'], loading: ['iRacing abrindo', 'Aguardando conexão com a sessão'], connected: ['Sessão conectada', 'iRacing conectado pelo SDK'], process: ['Simulador aberto', 'Detectado por processo · SDK indisponível'], monitorError: 'Falha no monitoramento', reconnecting: 'Reconectando ao monitor', paused: 'Abertura automática pausada', unavailable: 'Monitor indisponível', active: 'Monitor ativo', starting: 'Iniciando monitor', sdkConnected: 'SDK conectado', simProcess: 'Processo do simulador', awaiting: 'Aguardando iRacing', notFound: 'Não encontrado', noneSelected: 'Nenhum selecionado', selectedOne: 'selecionado', selectedMany: 'selecionados', noResult: 'Nenhum resultado', noApps: 'Nenhum aplicativo adicionado', addApplication: 'Adicionar aplicativo', running: 'Em execução', external: 'Já aberto', pending: 'Agendado', stopped: 'Parado', failed: 'Falha ao abrir', disabled: 'Desativado', onConnect: 'Ao conectar', manual: 'Início manual', closeOnExit: 'Fechar ao sair', delay: 's de atraso', openedOutside: 'Aberto fora deste launcher', stop: 'Parar ', start: 'Iniciar ', select: 'Selecionar ', edit: 'Editar ', noErrors: 'Nenhum erro registrado', noActivity: 'Nenhuma atividade registrada', editApp: 'Editar aplicativo', duplicate: 'Este executável já está na lista.', waitingTime: 'Aguardando', executable: 'Executável', choose: 'Procurar', appName: 'Nome do aplicativo', arguments: 'Argumentos (opcional)', delaySeconds: 'Atraso (segundos)', appActive: 'App ativo', startHidden: 'Iniciar oculto', openWith: 'Abrir com iRacing', closeWith: 'Fechar com iRacing', cancel: 'Cancelar', save: 'Salvar', remove: 'Remover aplicativo', selectExe: 'Selecione um arquivo .exe', argsExample: 'Ex.: --minimized'
  },
  en: {
    apps: 'Applications', activity: 'Activity', settings: 'Settings', hideTray: 'Minimize to system tray', addApp: 'Add app', automatic: 'Automatic', startAll: 'Start all', stopAll: 'Stop all', search: 'Search applications', application: 'APPLICATION', status: 'STATUS', startSelected: 'Start selected', stopSelected: 'Stop selected', recentActivity: 'Recent activity', errorsOnly: 'Errors only', behavior: 'Behavior', language: 'Language', languageDetail: 'Use the Windows language or choose manually.', closeApps: 'Close apps when iRacing exits', closeAppsDetail: 'Only apps started here and marked to close.', closeWindow: 'When closing the window', closeWindowDetail: 'Exit the launcher and monitoring process.', monitoring: 'Monitoring', openConfig: 'Open configuration folder', viewActivity: 'View activity', connection: 'Connection', lastCheck: 'Last check', simulator: 'Simulator', version: 'Version',
    appSubtitle: (total, open) => `${total} applications · ${open} running`, activitySubtitle: 'Connections, launches, and exits', settingsSubtitle: 'Session Launcher preferences', checking: ['Checking iRacing', 'Connecting to monitor'], waiting: ['Waiting for session', 'iRacing is not open yet'], loading: ['iRacing is opening', 'Waiting for session connection'], connected: ['Session connected', 'iRacing connected through SDK'], process: ['Simulator open', 'Detected by process · SDK unavailable'], monitorError: 'Monitoring failure', reconnecting: 'Reconnecting to monitor', paused: 'Automatic launch paused', unavailable: 'Monitor unavailable', active: 'Monitor active', starting: 'Starting monitor', sdkConnected: 'SDK connected', simProcess: 'Simulator process', awaiting: 'Waiting for iRacing', notFound: 'Not found', noneSelected: 'None selected', selectedOne: 'selected', selectedMany: 'selected', noResult: 'No results', noApps: 'No applications added', addApplication: 'Add application', running: 'Running', external: 'Already open', pending: 'Scheduled', stopped: 'Stopped', failed: 'Failed to launch', disabled: 'Disabled', onConnect: 'On connect', manual: 'Manual start', closeOnExit: 'Close on exit', delay: 's delay', openedOutside: 'Opened outside this launcher', stop: 'Stop ', start: 'Start ', select: 'Select ', edit: 'Edit ', noErrors: 'No errors recorded', noActivity: 'No activity recorded', editApp: 'Edit application', duplicate: 'This executable is already in the list.', waitingTime: 'Waiting', executable: 'Executable', choose: 'Browse', appName: 'Application name', arguments: 'Arguments (optional)', delaySeconds: 'Delay (seconds)', appActive: 'App enabled', startHidden: 'Start hidden', openWith: 'Open with iRacing', closeWith: 'Close with iRacing', cancel: 'Cancel', save: 'Save', remove: 'Remove application', selectExe: 'Select an .exe file', argsExample: 'Example: --minimized'
  }
};
let language = 'pt';
const t = (key, ...args) => typeof messages[language][key] === 'function' ? messages[language][key](...args) : messages[language][key];
function setDirectText(id, value) {
  const element = $(id);
  const node = [...element.childNodes].find((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
  if (node) node.textContent = value; else element.append(document.createTextNode(value));
}
function applyLanguage() {
  const requested = state?.config?.language || 'auto';
  language = requested === 'pt-BR' || (requested === 'auto' && navigator.language.toLowerCase().startsWith('pt')) ? 'pt' : 'en';
  document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
  document.title = 'iRacing Session Launcher';
  text('viewTitle', { apps: t('apps'), activity: t('activity'), settings: t('settings') }[view]);
  [['addApp','addApp'],['startAll','startAll'],['stopStarted','stopAll'],['startSelected','startSelected'],['stopSelected','stopSelected'],['openConfig','openConfig'],['viewActivity','viewActivity']].forEach(([id,key]) => setDirectText(id, t(key)));
  document.querySelector('[data-view="apps"]').title = t('apps'); document.querySelector('[data-view="apps"]').ariaLabel = t('apps');
  document.querySelector('[data-view="activity"]').title = t('activity'); document.querySelector('[data-view="activity"]').ariaLabel = t('activity');
  document.querySelector('[data-view="settings"]').title = t('settings'); document.querySelector('[data-view="settings"]').ariaLabel = t('settings');
  $('hideToTray').title = t('hideTray'); $('hideToTray').ariaLabel = t('hideTray');
  $('searchApps').placeholder = t('search'); $('searchApps').ariaLabel = t('search');
  document.querySelector('.connection .toggle > span:first-child').textContent = t('automatic');
  document.querySelector('.select-all span').textContent = t('application'); document.querySelector('.status-heading').textContent = t('status');
  document.querySelector('.section-heading h2').textContent = t('recentActivity'); document.querySelector('.error-filter').lastChild.textContent = t('errorsOnly');
  const headings = document.querySelectorAll('.settings-view h2'); headings[0].textContent = t('behavior'); headings[1].textContent = t('monitoring');
  text('languageTitle', t('language')); text('languageDescription', t('languageDetail'));
  const rows = document.querySelectorAll('.settings-view .setting-row'); rows[1].querySelector('strong').textContent = t('closeApps'); rows[1].querySelector('p').textContent = t('closeAppsDetail'); rows[2].querySelector('strong').textContent = t('closeWindow'); rows[2].querySelector('p').textContent = t('closeWindowDetail');
  document.querySelectorAll('.diagnostics dt').forEach((node, index) => { node.textContent = [t('connection'), t('lastCheck'), t('simulator'), t('version')][index]; });
  const fields = document.querySelectorAll('.dialog-body .field > span'); [t('executable'), t('appName'), t('arguments'), t('delaySeconds')].forEach((value, index) => { fields[index].textContent = value; });
  setDirectText('browseExe', t('choose')); setDirectText('cancelDialog', t('cancel')); setDirectText('saveApp', t('save'));
  const options = document.querySelectorAll('.dialog-options .toggle > span:first-child'); [t('appActive'), t('startHidden'), t('openWith'), t('closeWith')].forEach((value, index) => { options[index].textContent = value; });
  $('deleteApp').title = t('remove'); $('deleteApp').ariaLabel = t('remove');
  $('appPath').placeholder = t('selectExe'); $('appArguments').placeholder = t('argsExample');
  listSignature = ''; eventSignature = '';
}
const icons = () => lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const text = (id, value) => { $(id).textContent = value; };
const time = (at) => at ? new Date(at).toLocaleTimeString(language === 'pt' ? 'pt-BR' : 'en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : t('waitingTime');
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
  text('viewTitle', { apps: t('apps'), activity: t('activity'), settings: t('settings') }[view]);
  $('addApp').hidden = view !== 'apps';
  if (state) render(state);
}

function render(nextState) {
  state = nextState;
  applyLanguage();
  const { config, monitor, apps } = state;
  selected = new Set([...selected].filter((id) => config.apps.some((item) => item.id === id)));
  const openCount = apps.filter((item) => ['running', 'external'].includes(item.status)).length;
  const subtitles = {
    apps: t('appSubtitle', config.apps.length, openCount), activity: t('activitySubtitle'), settings: t('settingsSubtitle'),
  };
  text('pageSubtitle', subtitles[view]);
  const phases = {
    checking: t('checking'), waiting: t('waiting'), loading: t('loading'), connected: t('connected'), process: t('process'), error: [t('monitorError'), monitor.error || t('reconnecting')],
  };
  const [title, detail] = phases[monitor.phase] || phases.checking;
  text('iracingStatus', title);
  text('connectionDetail', detail);
  $('connectionDetail').title = monitor.error || detail;
  $('connectionIcon').classList.toggle('live', ['connected', 'process'].includes(monitor.phase));
  $('connectionIcon').classList.toggle('error', monitor.phase === 'error');
  $('monitorEnabled').checked = config.monitorEnabled;
  $('stopWhenIracingCloses').checked = config.stopWhenIracingCloses;
  text('monitorStatus', !config.monitorEnabled ? t('paused') : monitor.phase === 'error' ? t('unavailable') : monitor.checkedAt ? t('active') + ' · ' + time(monitor.checkedAt) : t('starting'));
  $('monitorDot').className = 'dot' + (monitor.phase === 'error' ? ' error' : config.monitorEnabled && monitor.checkedAt ? ' live' : '');
  text('diagnosticSource', monitor.phase === 'error' ? monitor.error : monitor.source === 'SDK' ? t('sdkConnected') : monitor.source === 'process' ? t('simProcess') : t('awaiting'));
  text('diagnosticTime', time(monitor.checkedAt));
  text('diagnosticProcess', monitor.simulator || t('notFound'));
  $('language').value = config.language || 'auto';
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
  text('selectionCount', selected.size ? selected.size + ' ' + (selected.size === 1 ? t('selectedOne') : t('selectedMany')) : t('noneSelected'));
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
      ? '<div class="empty"><i data-lucide="search-x"></i><strong>' + t('noResult') + '</strong></div>'
      : '<div class="empty"><i data-lucide="panels-top-left"></i><strong>' + t('noApps') + '</strong><button class="button" data-action="add"><i data-lucide="plus"></i>' + t('addApplication') + '</button></div>';
    icons();
    return;
  }
  list.innerHTML = items.map((item) => {
    const runtime = state.apps.find((entry) => entry.id === item.id) || { status: 'stopped' };
    const labels = { running: t('running'), external: t('external'), pending: t('pending'), stopped: t('stopped'), error: t('failed') };
    const tone = ['running', 'external'].includes(runtime.status) ? 'live' : runtime.status === 'error' ? 'error' : runtime.status === 'pending' ? 'pending' : '';
    const notes = !item.enabled ? [t('disabled')] : [item.startWithIracing ? t('onConnect') : t('manual'), item.stopWithIracing ? t('closeOnExit') : null, item.delayStartSeconds ? item.delayStartSeconds + t('delay') : null].filter(Boolean);
    const stoppable = runtime.managed || runtime.status === 'pending';
    const command = stoppable ? 'stop' : 'start';
    const commandTitle = stoppable ? t('stop') : t('start');
    return '<div class="app-row' + (selected.has(item.id) ? ' selected' : '') + '" data-id="' + escapeHtml(item.id) + '">' +
      '<input type="checkbox" data-action="select" aria-label="' + t('select') + escapeHtml(item.name) + '"' + (selected.has(item.id) ? ' checked' : '') + ' />' +
      '<div class="app-icon">' + iconMarkup(item) + '</div>' +
      '<div class="app-main" title="' + escapeHtml(item.path) + '"><strong>' + escapeHtml(item.name) + '</strong><small>' + notes.join(' \u00b7 ') + '</small></div>' +
      '<div class="app-status ' + tone + '" title="' + escapeHtml(runtime.error || (runtime.status === 'external' ? t('openedOutside') : labels[runtime.status])) + '"><span class="dot"></span>' + labels[runtime.status] + '</div>' +
      '<div class="row-actions"><button class="icon-button" data-action="' + command + '" title="' + commandTitle + escapeHtml(item.name) + '" aria-label="' + commandTitle + escapeHtml(item.name) + '"' + (!stoppable && (!item.enabled || runtime.status === 'external') ? ' disabled' : '') + '><i data-lucide="' + (stoppable ? 'square' : 'play') + '"></i></button>' +
      '<button class="icon-button" data-action="edit" title="' + t('edit') + escapeHtml(item.name) + '" aria-label="' + t('edit') + escapeHtml(item.name) + '"><i data-lucide="pencil"></i></button></div></div>';
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
  ).join('') : '<div class="empty"><i data-lucide="check-check"></i><strong>' + ($('errorsOnly').checked ? t('noErrors') : t('noActivity')) + '</strong></div>';
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
  text('dialogTitle', id ? t('editApp') : t('addApplication'));
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
  if (duplicate) { text('dialogError', t('duplicate')); $('dialogError').hidden = false; return; }
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
$('language').addEventListener('change', () => run(() => saveConfig({ language: $('language').value })));
icons();
window.launcher.onState(render);
run(async () => render(await window.launcher.getState()));
