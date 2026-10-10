# Git 工作流

提交说明、编辑器模板和 Lefthook 都在仓库里。生成项目会带上同一套文件。

## 提交模板

`.gitmessage` 是约定式提交的草稿：

```text
type(scope): subject

What changed:

Why:

Impact scope:
```

以 `#` 开头的行是说明，`git commit` 默认会剥掉。留下的第一行必须改成真正的标题。`feat` 和 `fix` 的正文至少 40 个字符，并且要出现 Why（或「为什么」）和 Impact（或「影响」）。有破坏性变更时保留 `BREAKING CHANGE:` 那一行，没有就删掉。

允许的 scope：`spa`、`ssr`、`mobile`、`api-client`、`cli`、`docs`、`ci`。可以加功能后缀，例如 `spa-auth`、`api-client/retry`。标题要指出在改什么，至少 12 个字符，祈使句，小写，不加句号。

禁止的标题包括 `update files`、`fix stuff`、`wip`、`changes`。完整名单在 `commitlint.config.mjs`。一次提交只做一件事。

好的例子：

```text
feat(spa-auth): restore the session before the router guard

What changed: beforeLoad reads the Zustand snapshot synchronously.
Why: a hydration effect redirected users who were already logged in.
Impact scope: SPA login and authenticated routes.
```

坏的例子：`feat: update files`、`fix stuff`、`wip`。

规则在四处，内容一致：

| 文件 | 谁读 |
| --- | --- |
| `AGENTS.md` | 仓库里的编码代理，这是源头 |
| `.cursor/rules/commits.mdc` | Cursor |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.vscode/settings.json` 的 `github.copilot.chat.commitMessageGeneration.instructions` | Copilot 生成提交说明 |

VS Code 和 Cursor 没有单独的 `git.commitTemplate` 设置。源代码管理输入框用的是 Git 自己的 `commit.template`。

## 编辑器和命令行怎么带上模板

根 `package.json` 的 `prepare` 跑 `node scripts/setup-git.mjs`。模板里的 `prepare` 在文件存在时跑 `scripts/setup-git.mjs`，否则跑 monorepo 的 `../../scripts/setup-git.mjs`。生成后的项目会带上前一份，所以同一条脚本两边都能跑。`pnpm install` 会执行它。脚本只在当前仓库执行：

```bash
git config --local commit.template .gitmessage
```

不写 `--global`。不在 Git 仓库里（例如还没 `git init`）就直接退出 0。先 `git init` 再安装，或者安装之后补一次 `node scripts/setup-git.mjs`。

检查：

```bash
git config --local --show-origin --get commit.template
```

应指向本仓库的 `.gitmessage`。然后 `git commit`（不加 `-m`）会用这份草稿。VS Code 和 Cursor 的提交框走同一条 Git 配置。`git commit -m` 不会打开模板，但 commit-msg 钩子仍会检查那条说明。

## Lefthook

钩子运行器是 Lefthook 2.2.1，配置在 `lefthook.yml`。pnpm 10 的 `onlyBuiltDependencies` 里有 `lefthook`，安装时会注册钩子。没有 Husky，也没有 lint-staged。

| 钩子 | 做什么 |
| --- | --- |
| `pre-commit` | 先用 Biome 改暂存的文件并 `stage_fixed`，再 `pnpm exec turbo run typecheck test --affected`。`--affected` 相对 `main`，包含未提交的改动。非零退出就挡提交 |
| `commit-msg` | `pnpm exec commitlint --edit`。规则在 `commitlint.config.mjs` |
| `pre-push` | `node scripts/check-ai-rules-sync.mjs`。Storybook 主版本或 addon-mcp 次版本和 frontmatter 不一致就挡住推送 |

没有别的钩子。模板包里的 `typecheck:affected` 仍是 `pnpm --filter "...[HEAD]"`，那是另一条更窄的命令，钩子不用它。

紧急跳过一次：`LEFTHOOK=0 git commit` 或 `git commit --no-verify`。推送是 `LEFTHOOK=0 git push`。这只该用在钩子本身坏了的时候，CI 仍会跑同样的检查。

加一个钩子：在 `lefthook.yml` 里加一段，例如 `pre-push` 下再加一个 `commands` 项，命令非零就失败。然后 `pnpm exec lefthook install`。

钩子没跑时：确认 `pnpm install` 成功、`lefthook` 在 `onlyBuiltDependencies` 里、`.git/hooks` 里能看到 lefthook 的包装。本地改了 `lefthook.yml` 之后再执行一次 `pnpm exec lefthook install`。

## 为什么是 Lefthook，不是 Husky + lint-staged

Husky 要把钩子脚本再提交一份，lint-staged 只解决「只检查暂存文件」。Lefthook 一份 YAML 就包含暂存文件的 Biome、受影响包的 typecheck/test，以及 commitlint。`{staged_files}` 已经把范围限制在暂存内容上，不需要第二套工具。
