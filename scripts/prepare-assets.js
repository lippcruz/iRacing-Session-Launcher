const fs = require('fs');
const path = require('path');
const destination = path.join(__dirname, '..', 'src', 'renderer', 'vendor');
fs.mkdirSync(destination, { recursive: true });
fs.copyFileSync(require.resolve('lucide/dist/umd/lucide.min.js'), path.join(destination, 'lucide.min.js'));
fs.copyFileSync(path.join(__dirname, '..', 'node_modules', 'lucide', 'LICENSE'), path.join(destination, 'lucide-LICENSE'));
