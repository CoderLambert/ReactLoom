import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parseDeployTarget, renderDeployScript, renderDeployWorkflow } from './deploy.js'
import { scaffold } from './scaffold.js'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

describe('deploy target', () => {
  it('defaults to none and reserves unimplemented targets', () => {
    expect(parseDeployTarget(undefined)).toBe('none')
    expect(parseDeployTarget('self-hosted')).toBe('self-hosted')
    expect(() => parseDeployTarget('vercel')).toThrow(/reserved/)
    expect(() => parseDeployTarget('docker')).toThrow(/reserved/)
    expect(() => parseDeployTarget('ftp')).toThrow(/Unknown --deploy/)
  })

  it('renders a different release step per template', () => {
    const spa = renderDeployScript('spa')
    const ssr = renderDeployScript('ssr')
    const mobile = renderDeployScript('mobile')
    expect(spa).toContain('dist/')
    expect(spa).toContain(['"$', '{release}/"'].join(''))
    expect(spa).not.toContain(['$', '{remote}'].join(''))
    expect(spa).toContain('nginx -t')
    expect(spa).not.toContain('StrictHostKeyChecking=no')
    expect(ssr).toContain('.next/standalone/')
    expect(ssr).toContain('pm2 reload')
    expect(ssr).toContain('pm2 start')
    expect(ssr).toContain('http://127.0.0.1:3000/')
    expect(spa).toContain('nginx -s reload')
    expect(mobile).toContain('dist/')
    expect(mobile).toContain('nginx -t')
    expect(renderDeployWorkflow('mobile')).toContain('EAS')
    expect(renderDeployWorkflow('spa')).toContain('secrets.DEPLOY_SSH_KEY')
    expect(renderDeployWorkflow('ssr')).toContain('secrets.DEPLOY_KNOWN_HOSTS')
    expect(renderDeployWorkflow('spa')).not.toContain('concurrency:')
  })

  it('writes deploy files only when self-hosted is selected', async () => {
    const parent = await mkdtemp(path.join(tmpdir(), 'reactloom-deploy-'))
    directories.push(parent)
    const plain = path.join(parent, 'plain')
    await scaffold({ name: 'plain', template: 'spa', directory: plain })
    await expect(
      readFile(path.join(plain, '.github/workflows/deploy.yml'), 'utf8'),
    ).rejects.toThrow()

    const hosted = path.join(parent, 'hosted')
    await scaffold({ name: 'hosted', template: 'ssr', directory: hosted, deploy: 'self-hosted' })
    const workflow = await readFile(path.join(hosted, '.github/workflows/deploy.yml'), 'utf8')
    const script = await readFile(path.join(hosted, 'scripts/deploy.sh'), 'utf8')
    const example = await readFile(path.join(hosted, '.env.deploy.example'), 'utf8')
    expect(workflow).toContain('DEPLOY_HOST')
    expect(workflow).not.toContain('StrictHostKeyChecking=no')
    expect(script).toContain('pm2 reload')
    expect(example).toContain('DEPLOY_SSH_KEY_PATH')
    expect(example).not.toContain('BEGIN OPENSSH')
    await expect(readFile(path.join(hosted, 'ecosystem.config.cjs'), 'utf8')).resolves.toContain(
      'server.js',
    )
  })

  it('writes the self-hosted files for each template and skips them for none', async () => {
    const parent = await mkdtemp(path.join(tmpdir(), 'reactloom-deploy-matrix-'))
    directories.push(parent)
    for (const template of ['spa', 'ssr', 'mobile'] as const) {
      const skipped = path.join(parent, `${template}-none`)
      await scaffold({ name: `${template}-none`, template, directory: skipped, deploy: 'none' })
      await expect(
        readFile(path.join(skipped, '.github/workflows/deploy.yml'), 'utf8'),
      ).rejects.toThrow()

      const directory = path.join(parent, template)
      await scaffold({ name: template, template, directory, deploy: 'self-hosted' })
      const workflow = await readFile(path.join(directory, '.github/workflows/deploy.yml'), 'utf8')
      const script = await readFile(path.join(directory, 'scripts/deploy.sh'), 'utf8')
      const nginx = await readFile(path.join(directory, 'deploy/nginx.conf.sample'), 'utf8')
      const ignore = await readFile(path.join(directory, '.gitignore'), 'utf8')
      expect(workflow).toContain('branches: [main]')
      expect(workflow).toContain('workflow_dispatch:')
      expect(workflow).toContain('secrets.DEPLOY_SSH_KEY')
      expect(workflow).toContain('secrets.DEPLOY_KNOWN_HOSTS')
      expect(workflow).not.toContain('StrictHostKeyChecking=no')
      expect(script).toContain('StrictHostKeyChecking=yes')
      expect(script).toContain('mv -Tf')
      expect(ignore).toContain('.env.deploy')
      expect(ignore).toContain('!.env.deploy.example')
      await expect(
        readFile(path.join(directory, 'scripts/ci-prepare-ssh.sh'), 'utf8'),
      ).resolves.toContain('DEPLOY_SSH_KEY')
      if (template === 'ssr') {
        expect(script).toContain('.next/standalone/')
        expect(script).toContain('.next/static/')
        expect(nginx).toContain('proxy_pass http://127.0.0.1:3000')
        await expect(
          readFile(path.join(directory, 'ecosystem.config.cjs'), 'utf8'),
        ).resolves.toContain('server.js')
      } else {
        expect(script).toContain('dist/')
        expect(nginx).toContain('try_files')
        await expect(
          readFile(path.join(directory, 'ecosystem.config.cjs'), 'utf8'),
        ).rejects.toThrow()
      }
      if (template === 'mobile') {
        expect(workflow).toContain('expo export --platform web')
        expect(workflow).toContain('EAS')
      }
    }
  })
})
