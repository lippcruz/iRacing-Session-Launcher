const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const asar = require('@electron/asar');
const { version } = require('../package.json');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'release', version);
const installerName = `iRacing Session Launcher Setup ${version}.exe`;
const installer = path.join(output, installerName);
if (!fs.existsSync(installer)) throw new Error('Gere o instalador com npm run dist antes de montar o pacote.');
const verification = JSON.parse(fs.readFileSync(path.join(root, 'verification/release-result.json'), 'utf8'));
if (!verification.passed || verification.version !== version) throw new Error('A versao empacotada ainda nao foi validada.');
const artifactHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(output, 'win-unpacked/resources/app.asar'))).digest('hex');
if (verification.artifactSha256 !== artifactHash) throw new Error('O aplicativo foi alterado depois da verificacao.');
const contents = asar.listPackage(path.join(output, 'win-unpacked/resources/app.asar'));
const forbidden = contents.filter((file) => /(?:node_modules|tests|verification|\.py$|\.cs$|\.map$|\.ps1$)/i.test(file));
if (forbidden.length) throw new Error('Arquivos de desenvolvimento no aplicativo: ' + forbidden.join(', '));
const allowed = new Set([
  '/LICENSE', '/LICENSE.pt-BR', '/THIRD_PARTY_NOTICES.txt', '/package.json',
  '/src', '/src/main.js', '/src/preload.js', '/src/config.js', '/src/app-controller.js', '/src/session-monitor.js',
  '/src/renderer',
  '/src/renderer/index.html', '/src/renderer/styles.css', '/src/renderer/renderer.js',
  '/src/renderer/vendor',
  '/src/renderer/vendor/lucide.min.js', '/src/renderer/vendor/lucide-LICENSE',
]);
const unexpected = contents.filter((file) => !allowed.has(file.replaceAll('\\', '/')));
if (unexpected.length) throw new Error('Arquivos inesperados no aplicativo: ' + unexpected.join(', '));
const bundle = path.join(output, 'community');
fs.mkdirSync(bundle, { recursive: true });
const files = [
  [installer, installerName],
  [path.join(root, 'docs/LEIA-ME.txt'), 'LEIA-ME.txt'],
  [path.join(root, 'docs/README.en.txt'), 'README.en.txt'],
  [path.join(root, 'LICENSE'), 'LICENSE.txt'],
  [path.join(root, 'LICENSE.pt-BR'), 'LICENSE.pt-BR.txt'],
  [path.join(root, 'CHANGELOG.md'), 'CHANGELOG.md'],
  [path.join(root, 'THIRD_PARTY_NOTICES.txt'), 'THIRD_PARTY_NOTICES.txt'],
  [path.join(root, 'src/renderer/vendor/lucide-LICENSE'), 'lucide-LICENSE.txt'],
];
for (const [source, name] of files) fs.copyFileSync(source, path.join(bundle, name));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.writeFileSync(path.join(bundle, 'SHA256SUMS.txt'), files.map(([, name]) => hash(path.join(bundle, name)) + '  ' + name).join('\n') + '\n');
const zip = path.join(output, `iRacing-Session-Launcher-${version}-Windows-x64.zip`);
// Archive only the allowlisted public files, never the workspace or test profiles.
if (fs.existsSync(zip)) fs.unlinkSync(zip);
execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'archive-release.ps1'), '-Source', bundle, '-Destination', zip, '-Installer', installerName], { windowsHide: true, stdio: 'pipe' });
fs.writeFileSync(zip + '.sha256', hash(zip) + '  ' + path.basename(zip) + '\n');
for (const [, name] of files) fs.unlinkSync(path.join(bundle, name));
fs.unlinkSync(path.join(bundle, 'SHA256SUMS.txt'));
fs.rmdirSync(bundle);
console.log(JSON.stringify({ installer, zip, bytes: fs.statSync(zip).size, sha256: hash(zip), packagedFiles: contents.length }));
