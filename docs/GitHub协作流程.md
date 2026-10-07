# GitHub 协作流程（两人结对版）

> 分工：**102401529 是主仓库所有者**（建仓 + 合并 PR），**102401521 是协作者**（fork + 提交 PR）。
> 本流程对应作业要求："一位同学新建仓库；另一位同学 fork 该项目，有进展时 pull request。"

## 第 1 步：102401529 在 GitHub 建仓库

1. 打开 https://github.com/new
2. Repository name 填：`102401529-102401521`（作业要求"第一个学号-第二个学号"）
3. 选 **Public**，**不要**勾选 Add a README（本地已有一份，避免冲突），其余默认，点 Create repository
4. 创建后页面会显示仓库地址：`https://github.com/Aranya12138/102401529-102401521.git`

## 第 2 步：102401529 推送本地代码

在项目目录 `campus-lost-found/` 打开终端（Git Bash），依次执行：

```bash
# 关联远程仓库
git remote add origin https://github.com/Aranya12138/102401529-102401521.git

# 首次推送并建立跟踪
git push -u origin main
```

- 首次 push 会要求登录：用户名填 GitHub 用户名，密码处填 **Personal Access Token**（GitHub 已禁用账号密码推送）。获取方式：GitHub 右上角头像 → Settings → Developer settings → Personal access tokens → Generate new token（勾选 repo 权限）→ 复制保存
- 成功后浏览器打开仓库页面应能看到全部代码

## 第 3 步：102401521 fork 仓库

1. 打开 `https://github.com/Aranya12138/102401529-102401521`，点右上角 **Fork** → Create fork
2. 自己的账号下会出现同名仓库（fork 来的）

## 第 4 步：102401521 开发并提交 PR

```bash
# 克隆自己的 fork
git clone https://github.com/102401521的用户名/102401529-102401521.git
cd 102401529-102401521

# 开发：修改代码 → 每完成一个功能就提交一次
git add 修改的文件
git commit -m "feat: 功能说明（一句话）"
git push

# 发起 Pull Request
```

在网页上：进入自己的 fork 仓库 → 出现 "Contribute" 提示时点 **Open pull request**（或 Pull requests 标签 → New pull request）→ 确认 base 是主仓库的 main、compare 是自己 fork 的 main → Create pull request，说明里写清楚这次改了什么。

## 第 5 步：102401529 审查并合并 PR

主仓库的 Pull requests 页 → 打开 PR → 查看 Files changed 检查改动 → **Merge pull request**。合并后本地执行 `git pull` 同步最新代码。

## Commit 规范（本次作业采用的约定）

- 每做完一个功能、确认能运行后至少 commit 一次，**不要攒到最后一口气提交**（助教会查签入记录）
- 格式：`类型: 一句话说明`
  - `feat:` 新功能（如 `feat: 首页列表与搜索筛选`）
  - `docs:` 文档（如 `docs: README目录说明与使用说明`）
  - `chore:` 工程杂项（如 `chore: 初始化项目结构与.gitignore`）
  - `fix:` 修复 bug
- 按作业要求，单元测试不随代码上传（test/ 已在 .gitignore 中），测试代码在博客中展示

## 常见问题

| 问题 | 处理 |
| --- | --- |
| push 报 403 / 认证失败 | 确认用 Token 而不是密码；Token 过期就重新生成 |
| push 报 non-fast-forward | 远端有新提交：先 `git pull --rebase` 再 push |
| PR 有冲突（conflict） | 在自己的 fork 里 `git pull 主仓库地址 main` 合并最新代码，解决冲突后重新 push，PR 会自动更新 |
| 忘记在哪个目录 | `git status` 报 "not a git repository" 说明不在项目目录内 |
