const path = require('path');
const { randomUUID } = require('crypto');

function normalizeConfig(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.apps)) throw new Error('Configuração inválida: lista de aplicativos ausente. / Invalid configuration: application list is missing.');
  if (input.apps.length > 200) throw new Error('Limite de 200 aplicativos excedido. / The 200-application limit was exceeded.');
  const ids = new Set();
  const paths = new Set();
  const apps = input.apps.map((item) => {
    if (!item || typeof item.path !== 'string' || !path.win32.isAbsolute(item.path) || path.win32.extname(item.path).toLowerCase() !== '.exe' || item.path.includes('\0')) {
      throw new Error('Cada aplicativo precisa de um caminho absoluto para um arquivo .exe. / Each application requires an absolute path to an .exe file.');
    }
    const file = path.win32.normalize(item.path.trim());
    if (paths.has(file.toLowerCase())) throw new Error('O mesmo executável aparece mais de uma vez. / The same executable appears more than once.');
    paths.add(file.toLowerCase());
    const id = typeof item.id === 'string' && item.id && item.id.length <= 128 ? item.id : randomUUID();
    if (ids.has(id)) throw new Error('Identificador duplicado. / Duplicate application identifier.');
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
  const language = ['auto', 'pt-BR', 'en'].includes(input.language) ? input.language : 'auto';
  return { language, monitorEnabled: input.monitorEnabled !== false, stopWhenIracingCloses: input.stopWhenIracingCloses !== false, apps };
}

function validateConfigChange(previous, next, controller) {
  for (const old of previous.apps) {
    const replacement = next.apps.find((item) => item.id === old.id);
    if (controller.status(old).managed && (!replacement || replacement.path.toLowerCase() !== old.path.toLowerCase())) {
      throw new Error(`Pare ${old.name} antes de remover ou trocar o executável. / Stop ${old.name} before removing it or changing its executable.`);
    }
  }
}

module.exports = { normalizeConfig, validateConfigChange };
