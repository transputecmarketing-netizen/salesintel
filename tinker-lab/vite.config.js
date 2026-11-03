import { defineConfig } from 'vite';
import { resolve, relative } from 'node:path';
import { readdirSync, statSync } from 'node:fs';

// Every index.html under the project (except dev/, node_modules/ and dist/) is a page.
const root = import.meta.dirname;
const skip = new Set(['node_modules', 'dist', 'dev', 'tests', 'scripts', 'docs', 'public', 'src']);
function pages(dir, out = {}) {
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) {
      if (!skip.has(name) && !name.startsWith('.')) pages(p, out);
    } else if (name === 'index.html') {
      out[relative(root, dir) || 'landing'] = p;
    }
  }
  return out;
}

const input = pages(root);
input['404'] = resolve(root, '404.html');

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: { input },
  },
});
