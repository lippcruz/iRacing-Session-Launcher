const path = require('path');
const { randomUUID } = require('crypto');

function normalizeConfig(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.apps)) throw new Error('Configuracao invalida: lista de aplicativos ausente.');
  if (input.apps.length > 200) throw new Error('Configuracao invalida: limite de 200 aplicativos excedido.');
  const ids = new Set();
  const paths = new Set();
  const apps = input.apps.map((item) => {
    if (!item || typeof item.path !== 'string' || !path.win32.isAbsolute(item.path) || path.win32.extname(item.path).toLowerCase() !== '.exe' || item.path.includes('\0')) {
      throw new Error('Cada aplicativo precisa de um caminho absoluto para um arquivo .exe.');
    }
    const file = path.win32.normalize(item.path.trim());
    if (paths.has(file.toLowerCase())) throw new Error('O mesmo executavel aparece mais de uma vez na lista.');
    paths.add(file.toLowerCase());
    const id = typeof item.id === 'string' && item.id && item.id.length <= 128 ? item.id : randomUUID();
    if (ids.has(id)) throw new Error('Identificador de aplicativo duplicado.');
    ids.add(id);
    return {
      id, name: typeof item.name === 'string' && item.name.trim() ? item.name.trim().slice(0, 200) : path.win32.basename(file, path.win32.extname(file)),
      path: file,
      icon: typeof item.icon === 'string' && item.icon.length < 1024 * 1024 && /^data:image\/(?:png|jpeg|x-icon);base64,[a-z0-9+/=]+$/i.test(item.icon) ? item.icon : '',
      arguments: typeof item.arguments === 'string' ? item.arguments.replaceAll('\0', '').slice(0, 8192) : '',
      enabled: item.enabled !== false, startHidden: item.startHidden === true,
      startWithIracing: item.startWithIracing !== false, stopWithIracing: item.stopWithIracing !== false,
      delayStartSeconds: Math.min(3600, Math.max(0, Number.parseInt(item.delayStartSeconds, 10) || 0)),
    };
  });
  return { monitorEnabled: input.monitorEnabled !== false, stopWhenIracingCloses: input.stopWhenIracingCloses !== false, apps };
}

function validateConfigChange(previous, next, controller) {
  for (const old of previous.apps) {
    const replacement = next.apps.find((item) => item.id === old.id);
    if (controller.status(old).managed && (!replacement || replacement.path.toLowerCase() !== old.path.toLowerCase())) {
      throw new Error(`Pare ${old.name} antes de remover o aplicativo ou trocar seu executavel.`);
    }
  }
}

module.exports = { normalizeConfig, validateConfigChange };
