import {createHash} from 'node:crypto';
import {lstat, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const relativeWorkerPath = 'public/lab-runners/msw/mockServiceWorker.js';
export const MAX_SCOPED_MSW_WORKER_BYTES = 512 * 1024;

/** This is an asset boundary check, not an MSW SDK or browser registration test. */
export function inspectScopedMswWorker(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 ||
      bytes.byteLength > MAX_SCOPED_MSW_WORKER_BYTES) {
    throw new Error('MSW scoped worker asset is empty or exceeds 512 KiB');
  }
  const source = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
  if (/^\s*</u.test(source) || !/\baddEventListener\s*\(/u.test(source)) {
    throw new Error('MSW scoped worker asset is not a JavaScript Service Worker');
  }
  return Object.freeze({
    path: '/lab-runners/msw/mockServiceWorker.js',
    bytes: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    assurance: 'generated-asset-only',
  });
}

export async function verifyScopedMswWorker(root = packageRoot) {
  const workerPath = path.join(root, relativeWorkerPath);
  const stat = await lstat(workerPath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size === 0 ||
      stat.size > MAX_SCOPED_MSW_WORKER_BYTES) {
    throw new Error('MSW scoped worker is missing, not a regular file, or too large');
  }
  const result = inspectScopedMswWorker(await readFile(workerPath));
  if (result.bytes !== stat.size) throw new Error('MSW scoped worker changed while being verified');
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await verifyScopedMswWorker()));
}
