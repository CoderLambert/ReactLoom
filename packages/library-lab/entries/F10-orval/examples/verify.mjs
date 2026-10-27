import {fileURLToPath} from 'node:url';
import {inspectProject} from './output-policy.mjs';

// Read actual generated source, never infer CLI success from a file existing.
const root = fileURLToPath(new URL('./generated/', import.meta.url));
export async function verifyProject(project) {
  return (await inspectProject(root, project)).count;
}
