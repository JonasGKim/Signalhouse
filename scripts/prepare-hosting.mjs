if (process.env.DEPLOY_TARGET !== 'cloudflare') {
  console.log('Vercel output prepared by the Astro adapter.');
  process.exit(0);
}
import { readdir, writeFile, rm, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
// Cloudflare's build copies local .dev.vars for preview. Never package that file.
async function stripLocalFiles(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.name.startsWith('.env') || item.name.startsWith('.dev.vars'))
      await rm(file, { force: true });
    else if (item.isDirectory()) await stripLocalFiles(file);
  }
}
await stripLocalFiles('dist');
await writeFile(
  'dist/server/index.js',
  "export { default } from './entry.mjs';\n",
);
await mkdir('dist/.openai', { recursive: true });
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
console.log('Prepared Worker output; excluded local credential files.');
