import workboxBuild from 'workbox-build';
import {matchPublicRssRequest} from './cache-policy.mjs';
import {mkdtemp, mkdir, writeFile, readFile, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const {generateSW, getManifest} = workboxBuild;
export const ISOLATED_SCOPE = '/__library_lab_workbox__/';
const LEVELS = new Set(['basic', 'business', 'advanced']);

export function workboxOptions(site, level) {
  if (!LEVELS.has(level)) throw new Error('Invalid workshop level');
  const options = {
    globDirectory: site,
    globPatterns: ['**/*.{html,js,css}'],
    globIgnores: ['**/private/**', '**/sw.js', '**/workbox-*.js'],
    globFollow: false,
    maximumFileSizeToCacheInBytes: 512 * 1024,
    swDest: path.join(site, 'sw.js'),
    cacheId: 'reactloom-library-workbox-isolated',
    cleanupOutdatedCaches: true,
    skipWaiting: false,
    clientsClaim: false,
    sourcemap: false,
    mode: 'production',
  };
  if (level !== 'basic') {
    options.runtimeCaching = [{
      // Only a public GET resource under the dedicated origin and scope.
      urlPattern: matchPublicRssRequest,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'rl-workbox-public-rss-v1',
        networkTimeoutSeconds: 2,
        cacheableResponse: {statuses: [200]},
        expiration: {maxEntries: 12, maxAgeSeconds: 3600},
      },
    }];
  }
  if (level === 'advanced') options.navigateFallback = 'offline.html';
  return options;
}

export async function runWorkshop(level, {keepOutput = false} = {}) {
  if (!LEVELS.has(level)) throw new Error('Invalid workshop level');
  const scratch = await mkdtemp(path.join(tmpdir(), 'reactloom-workbox-'));
  const site = path.join(scratch, ISOLATED_SCOPE.slice(1));
  try {
    await mkdir(path.join(site, 'private'), {recursive: true});
    await writeFile(path.join(site, 'index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Isolated Workbox Workshop</title><main><h1>Public offline document</h1></main></html>');
    await writeFile(path.join(site, 'app.js'), 'document.documentElement.dataset.workshop = "workbox";');
    await writeFile(path.join(site, 'offline.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Offline</title><main>Offline fallback</main></html>');
    await writeFile(path.join(site, 'private', 'tokens.js'), 'throw new Error("never precache private fixtures");');
    const options = workboxOptions(site, level);
    const manifest = await getManifest({
      globDirectory: options.globDirectory,
      globPatterns: options.globPatterns,
      globIgnores: options.globIgnores,
      globFollow: options.globFollow,
      maximumFileSizeToCacheInBytes: options.maximumFileSizeToCacheInBytes,
    });
    if (manifest.warnings.length) throw new Error('Workbox manifest warnings: ' + manifest.warnings.join('; '));
    const urls = manifest.manifestEntries.map(entry => entry.url);
    if (!urls.includes('index.html') || !urls.includes('app.js') || urls.some(url => url.includes('private/'))) {
      throw new Error('Unsafe or incomplete precache manifest: ' + urls.join(', '));
    }
    const generated = await generateSW(options);
    if (generated.warnings.length) throw new Error('Workbox build warnings: ' + generated.warnings.join('; '));
    if (generated.count !== urls.length) throw new Error('Manifest and built precache count disagree');
    const worker = await readFile(options.swDest, 'utf8');
    const swBytes = (await stat(options.swDest)).size;
    if (!worker.trim() || !swBytes) throw new Error('Generated Service Worker is empty');
    const result = {
      level, scope: ISOLATED_SCOPE, registrationExecuted: false,
      precacheUrls: urls, precacheCount: generated.count,
      precacheBytes: generated.size, swBytes,
      runtimeStrategy: level === 'basic' ? 'precache-only' : 'NetworkFirst-public-GET-only',
      fallback: level === 'advanced' ? 'offline.html' : null,
      generatedFiles: generated.filePaths.map(file => path.basename(file)),
      outputDirectory: keepOutput ? site : null,
    };
    return result;
  } finally {
    if (!keepOutput) await rm(scratch, {recursive: true, force: true});
  }
}
