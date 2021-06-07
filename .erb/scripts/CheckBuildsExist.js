// Check if the renderer and main bundles are built
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

const mainPath = path.join(__dirname, '../../src/main.prod.js');
const appRendererPath = getRendererPath('app');
const hiddenRendererPath = getRendererPath('hidden');

if (!fs.existsSync(mainPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold(
      'The main process is not built yet. Build it by running "yarn build:main"'
    )
  );
}

if (!fs.existsSync(appRendererPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold(
      'The app renderer process is not built yet. Build it by running "yarn build:renderer"'
    )
  );
}

if (!fs.existsSync(hiddenRendererPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold(
      'The hidden renderer process is not built yet. Build it by running "yarn build:renderer"'
    )
  );
}

function getRendererPath(name: string) {
  return path.join(
    __dirname,
    '..',
    '..',
    'src',
    'dist',
    `${name}.renderer.prod.js`
  );
}
