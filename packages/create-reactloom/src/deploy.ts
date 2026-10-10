import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { TemplateId } from './templates.js'

export const deployTargets = ['none', 'self-hosted'] as const

export type DeployTarget = (typeof deployTargets)[number]

const reservedTargets = ['vercel', 'docker']

export function parseDeployTarget(value: string | undefined): DeployTarget {
  if (value === undefined || value === 'none') return 'none'
  if (value === 'self-hosted') return 'self-hosted'
  if (reservedTargets.includes(value)) {
    throw new Error(
      `--deploy ${value} is reserved and is not generated yet. Use none or self-hosted.`,
    )
  }
  throw new Error(`Unknown --deploy "${value}". Choose none or self-hosted.`)
}

export function renderDeployWorkflow(template: TemplateId): string {
  const buildNote =
    template === 'mobile'
      ? '# Expo exports the web bundle. Native binaries stay on EAS, which this workflow does not call.\n'
      : template === 'ssr'
        ? '# Next.js standalone output is rsynced, then pm2 reloads server.js.\n'
        : '# The Vite dist/ directory is published as a static release.\n'

  return `name: Deploy

# Self-hosted deploy over SSH and rsync.
# ${buildNote.trim()}
# Secrets (repository settings, never committed):
#   DEPLOY_HOST, DEPLOY_USER, DEPLOY_PORT (optional, default 22),
#   DEPLOY_PATH, DEPLOY_SSH_KEY (private key text), DEPLOY_KNOWN_HOSTS.
# Optional variable: DEPLOY_KEEP (how many releases to retain, default 5).

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: pnpm/action-setup@v6
        with:
          version: 10.33.3
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: pnpm
      - name: Install
        run: pnpm install --frozen-lockfile
      - name: Build
        run: pnpm exec turbo run build
      - name: Install the deploy key
        env:
          DEPLOY_SSH_KEY: \${{ secrets.DEPLOY_SSH_KEY }}
          DEPLOY_KNOWN_HOSTS: \${{ secrets.DEPLOY_KNOWN_HOSTS }}
        run: bash scripts/ci-prepare-ssh.sh
      - name: Rsync the release
        env:
          DEPLOY_HOST: \${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: \${{ secrets.DEPLOY_USER }}
          DEPLOY_PORT: \${{ secrets.DEPLOY_PORT }}
          DEPLOY_PATH: \${{ secrets.DEPLOY_PATH }}
          DEPLOY_KEEP: \${{ vars.DEPLOY_KEEP }}
        run: bash scripts/deploy.sh
`
}

export function renderPrepareSsh(): string {
  return `#!/usr/bin/env bash
# Writes the GitHub Actions deploy key. Local deploys use DEPLOY_SSH_KEY_PATH instead.
set -euo pipefail

if [ -z "\${DEPLOY_SSH_KEY:-}" ]; then
  echo "DEPLOY_SSH_KEY is empty. Add the private key as a GitHub secret." >&2
  exit 1
fi
if [ -z "\${DEPLOY_KNOWN_HOSTS:-}" ]; then
  echo "DEPLOY_KNOWN_HOSTS is empty. Pin the server host key. Do not disable StrictHostKeyChecking." >&2
  exit 1
fi

install -m 700 -d "\${HOME}/.ssh"
printf '%s\\n' "\${DEPLOY_SSH_KEY}" > "\${HOME}/.ssh/deploy_key"
chmod 600 "\${HOME}/.ssh/deploy_key"
printf '%s\\n' "\${DEPLOY_KNOWN_HOSTS}" > "\${HOME}/.ssh/known_hosts"
chmod 644 "\${HOME}/.ssh/known_hosts"

if [ -n "\${GITHUB_ENV:-}" ]; then
  echo "DEPLOY_SSH_KEY_PATH=\${HOME}/.ssh/deploy_key" >> "\${GITHUB_ENV}"
  echo "DEPLOY_KNOWN_HOSTS_FILE=\${HOME}/.ssh/known_hosts" >> "\${GITHUB_ENV}"
fi
`
}

export function renderDeployScript(template: TemplateId): string {
  const sync =
    template === 'ssr'
      ? `rsync_release "\${ROOT}/.next/standalone/" "\${remote}/"
rsync_release "\${ROOT}/.next/static/" "\${remote}/.next/static/"
rsync_release "\${ROOT}/public/" "\${remote}/public/"
rsync_release "\${ROOT}/ecosystem.config.cjs" "\${remote}/ecosystem.config.cjs"
rsync_release "\${ROOT}/deploy/nginx.conf.sample" "\${remote}/nginx.conf.sample"
`
      : `rsync_release "\${ROOT}/dist/" "\${remote}/"
rsync_release "\${ROOT}/deploy/nginx.conf.sample" "\${remote}/nginx.conf.sample"
`

  const activate =
    template === 'ssr'
      ? `pm2 reload "\${release}/ecosystem.config.cjs" --update-env
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:3000/" >/dev/null; then
    exit 0
  fi
  sleep 1
done
echo "SSR health check failed on http://127.0.0.1:3000/" >&2
exit 1
`
      : `nginx -t
systemctl reload nginx
`

  return `#!/usr/bin/env bash
# Publishes one release over SSH and rsync, then points current/ at it.
# Reads DEPLOY_* from the environment or from .env.deploy. Never commit that file.
set -euo pipefail

ROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"
cd "\${ROOT}"

if [ -z "\${DEPLOY_HOST:-}" ] && [ -f .env.deploy ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.deploy
  set +a
fi

: "\${DEPLOY_HOST:?Set DEPLOY_HOST}"
: "\${DEPLOY_USER:?Set DEPLOY_USER}"
: "\${DEPLOY_PATH:?Set DEPLOY_PATH}"
DEPLOY_PORT="\${DEPLOY_PORT:-22}"
DEPLOY_KEEP="\${DEPLOY_KEEP:-5}"
DEPLOY_SSH_KEY_PATH="\${DEPLOY_SSH_KEY_PATH:?Set DEPLOY_SSH_KEY_PATH to a private key file}"
DEPLOY_KNOWN_HOSTS_FILE="\${DEPLOY_KNOWN_HOSTS_FILE:-\${HOME}/.ssh/known_hosts}"

SSH=(ssh -i "\${DEPLOY_SSH_KEY_PATH}" -p "\${DEPLOY_PORT}" -o UserKnownHostsFile="\${DEPLOY_KNOWN_HOSTS_FILE}" -o StrictHostKeyChecking=yes)
RSYNC_RSH="ssh -i \${DEPLOY_SSH_KEY_PATH} -p \${DEPLOY_PORT} -o UserKnownHostsFile=\${DEPLOY_KNOWN_HOSTS_FILE} -o StrictHostKeyChecking=yes"
DEST="\${DEPLOY_USER}@\${DEPLOY_HOST}"
STAMP="$(date -u +%Y%m%d%H%M%S)"
release="\${DEPLOY_PATH}/releases/\${STAMP}"

"\${SSH[@]}" "\${DEST}" "mkdir -p '\${release}'"

rsync_release() {
  rsync -az --delete -e "\${RSYNC_RSH}" "$1" "\${DEST}:$2"
}

${sync}
"\${SSH[@]}" "\${DEST}" "bash -s" -- "\${release}" "\${DEPLOY_PATH}" "\${DEPLOY_KEEP}" <<'REMOTE'
set -euo pipefail
release="$1"
base="$2"
keep="$3"
ln -sfn "\${release}" "\${base}/current.next"
mv -Tf "\${base}/current.next" "\${base}/current"
current="$(readlink -f "\${base}/current")"
mapfile -t old < <(ls -1dt "\${base}/releases"/*)
if [ "\${#old[@]}" -gt "\${keep}" ]; then
  for dir in "\${old[@]:\${keep}}"; do
    if [ "$(readlink -f "\${dir}")" != "\${current}" ]; then
      rm -rf "\${dir}"
    fi
  done
fi
${activate}
REMOTE
`
}

export function renderEnvExample(): string {
  return `# Copy to .env.deploy. That file is gitignored. Do not commit a private key.
DEPLOY_HOST=
DEPLOY_USER=
DEPLOY_PORT=22
DEPLOY_PATH=/var/www/reactloom
DEPLOY_SSH_KEY_PATH=~/.ssh/id_ed25519
DEPLOY_KNOWN_HOSTS_FILE=~/.ssh/known_hosts
DEPLOY_KEEP=5
`
}

export function renderEcosystem(): string {
  return `// pm2 process file for the Next.js standalone server.
// deploy.sh copies this into the release directory. cwd follows the current symlink.
const path = require('node:path')

const appDir = __dirname

module.exports = {
  apps: [
    {
      name: 'reactloom',
      cwd: appDir,
      script: path.join(appDir, 'server.js'),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: '3000',
      },
    },
  ],
}
`
}

export function renderNginx(template: TemplateId): string {
  if (template === 'ssr') {
    return `# Sample reverse proxy. Install it on the server yourself; deploy only reloads the app.
# Point root at the current symlink's parent, then proxy to the pm2 port.
server {
  listen 80;
  server_name example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
`
  }
  return `# Sample static site. root is the atomic current symlink.
# The deploy user must be allowed to run: nginx -t && systemctl reload nginx
server {
  listen 80;
  server_name example.com;
  root /var/www/reactloom/current;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
`
}

export async function writeDeployFiles(directory: string, template: TemplateId): Promise<void> {
  await mkdir(path.join(directory, '.github', 'workflows'), { recursive: true })
  await mkdir(path.join(directory, 'scripts'), { recursive: true })
  await mkdir(path.join(directory, 'deploy'), { recursive: true })
  await writeFile(
    path.join(directory, '.github', 'workflows', 'deploy.yml'),
    renderDeployWorkflow(template),
  )
  await writeFile(path.join(directory, 'scripts', 'deploy.sh'), renderDeployScript(template))
  await writeFile(path.join(directory, 'scripts', 'ci-prepare-ssh.sh'), renderPrepareSsh())
  await writeFile(path.join(directory, '.env.deploy.example'), renderEnvExample())
  await writeFile(path.join(directory, 'deploy', 'nginx.conf.sample'), renderNginx(template))
  if (template === 'ssr') {
    await writeFile(path.join(directory, 'ecosystem.config.cjs'), renderEcosystem())
  }
}
