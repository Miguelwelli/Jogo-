const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
fs.mkdirSync('assets/licenses', { recursive: true });
execFileSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'), '-i', 'scripts/tailwind.css', '-o', 'assets/styles.css', '--content', 'index.html', '--minify'], { stdio: 'inherit' });
for (const [source, destination] of [
  ['node_modules/three/build/three.min.js', 'assets/three.min.js'],
  ['node_modules/peerjs/dist/peerjs.min.js', 'assets/peerjs.min.js'],
  ['node_modules/three/LICENSE', 'assets/licenses/three.txt'],
  ['node_modules/peerjs/LICENSE', 'assets/licenses/peerjs.txt'],
  ['node_modules/tailwindcss/LICENSE', 'assets/licenses/tailwindcss.txt'],
]) fs.copyFileSync(source, destination);
