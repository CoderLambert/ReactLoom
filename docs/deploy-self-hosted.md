# 自建服务器部署

`create-reactloom --deploy self-hosted` 会生成 GitHub Actions 工作流和一份本地脚本。默认是 `--deploy none`，不生成这些文件。`vercel` 和 `docker` 这两个名字先留着，现在不会生成。SSR 模板本身仍带 Dockerfile，那是另一条路径，不由这个参数打开。

## 生成了什么

| 文件 | 作用 |
| --- | --- |
| `.github/workflows/deploy.yml` | `main` 上的 push，以及 `workflow_dispatch`。构建后走 SSH 和 rsync |
| `scripts/deploy.sh` | 同一套步骤，本地也能跑 |
| `scripts/ci-prepare-ssh.sh` | 只在 Actions 里把密钥和主机公钥写进 `~/.ssh` |
| `.env.deploy.example` | 本地变量样例。复制成 `.env.deploy`，该文件被 gitignore |
| `deploy/nginx.conf.sample` | nginx 样例，脚本不会自动安装它 |
| `ecosystem.config.cjs` | 只有 SSR。pm2 启动 standalone 的 `server.js` |

三种模板的差异：

| | 构建产物 | 切换方式 |
| --- | --- | --- |
| SPA | `dist/` | rsync 到 `releases/<时间戳>`，原子替换 `current` 符号链接，然后 `nginx -t`。能用 systemd 就 `systemctl reload nginx`，否则 `nginx -s reload` |
| SSR | `.next/standalone`，外加 `.next/static` 和 `public` | 同样的符号链接。进程已在跑就 `pm2 reload ecosystem.config.cjs`，第一次则 `pm2 start`。然后请求 `http://127.0.0.1:3000/` |
| Expo | `expo export --platform web`（`-p web`）写出的 `dist/` | 和 SPA 一样的静态目录。原生包走 EAS，这个工作流不调用 `eas build` |

健康检查或 nginx 重载成功之后，才删掉多出来的旧目录。保留最近 `DEPLOY_KEEP` 个，默认 5。正在被 `current` 指着的目录不会删。

## 服务器要先有什么

- 一个只能登录、不能用密码写仓库的部署用户，以及 `authorized_keys` 里的公钥。
- 目录可写：`DEPLOY_PATH/releases` 和 `DEPLOY_PATH/current`。
- SPA 和 Expo Web：已安装 nginx。部署用户要能执行 `nginx -t`，以及 `systemctl reload nginx` 或 `nginx -s reload`。不能执行就用 sudoers 只放开需要的那条。样例配置放在 `deploy/nginx.conf.sample`，`root` 指到 `current`。
- SSR：Node 和 pm2。standalone 监听 `127.0.0.1:3000`。nginx 样例把 80 反代到这个端口。先在服务器上装好站点配置，工作流只 reload 进程，不覆盖 nginx 配置。
- 主机公钥。不要在 SSH 里关 `StrictHostKeyChecking`。

## 配置项

全部来自 GitHub Actions 的 secrets 或变量，或本地的 `.env.deploy`。不要把私钥提交进仓库。

| 名字 | 哪里 | 必填 | 含义 |
| --- | --- | --- | --- |
| `DEPLOY_HOST` | secret | 是 | 服务器主机名或 IP |
| `DEPLOY_USER` | secret | 是 | SSH 用户 |
| `DEPLOY_PORT` | secret | 否 | 端口，空着就是 22 |
| `DEPLOY_PATH` | secret | 是 | 发布根目录，例如 `/var/www/reactloom` |
| `DEPLOY_SSH_KEY` | secret | CI 必填 | 私钥的全文。CI 写成 `~/.ssh/deploy_key` |
| `DEPLOY_KNOWN_HOSTS` | secret | CI 必填 | `ssh-keyscan` 得到的主机公钥行 |
| `DEPLOY_KEEP` | variable | 否 | 保留几个发布目录，默认 5 |
| `DEPLOY_SSH_KEY_PATH` | 仅本地 `.env.deploy` | 本地必填 | 私钥文件路径，例如 `~/.ssh/id_ed25519` |
| `DEPLOY_KNOWN_HOSTS_FILE` | 仅本地 | 否 | 默认 `~/.ssh/known_hosts` |

CI 不读 `DEPLOY_SSH_KEY_PATH`。本地脚本不读私钥内容，只读文件路径。

## 目录

```text
$DEPLOY_PATH/
  releases/
    20261010212600/
  current -> releases/20261010212600
```

时间戳是 UTC 的 `YYYYMMDDHHMMSS`。`current.next` 是替换过程中的临时链接，`mv -Tf` 把它换成 `current`。

回滚是把 `current` 指回一个还在的 `releases/` 目录。SPA 和 Expo 再执行 `nginx -t`，然后 `systemctl reload nginx` 或 `nginx -s reload`。SSR 再执行 `pm2 reload <那个目录>/ecosystem.config.cjs`。健康检查失败时旧目录还在，因为清理发生在切换成功之后。

## 本地手动部署

```bash
cp .env.deploy.example .env.deploy
# 填好主机、用户、路径和密钥文件
bash scripts/deploy.sh
```

先在本机跑过和 CI 相同的构建（`pnpm exec turbo run build`），再执行脚本。

## 排错

| 现象 | 处理 |
| --- | --- |
| `DEPLOY_KNOWN_HOSTS is empty` 或主机密钥确认失败 | 在你信任的网络上 `ssh-keyscan -p 22 主机`，把输出放进 secret。不要改成 `StrictHostKeyChecking=no` |
| `Permission denied (publickey)` | 私钥和服务器 `authorized_keys` 不是一对。看密钥是不是被折行弄坏了 |
| `nginx -t` 失败 | 服务器上的站点文件还是样例里的 `example.com`，或 `root` 不是 `current` |
| SSR 健康检查失败 | pm2 没在 3000 端口起来。在服务器上看 `pm2 logs reactloom`。`ecosystem.config.cjs` 的 `cwd` 是发布目录 |
| rsync 没有 `dist/` | 构建没跑，或 Expo 的 Web 导出失败。工作流里的构建步骤要先是绿的 |
| 回滚后仍是新版本 | 符号链接换了，但 nginx 或 pm2 没有 reload |
