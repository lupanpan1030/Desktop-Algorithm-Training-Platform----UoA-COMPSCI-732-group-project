# Delightful Dogs

<p align="center">
  一个基于 Electron 的本地算法练习平台，包含题目管理、判题运行、提交记录和桌面 AI 助手。
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center">
  <img src="./docs/assets/delightful-dogs.png" alt="Delightful Dogs banner" width="720" />
</p>

## 项目简介

这个仓库最初是奥克兰大学 CS732 课程的小组项目 `Delightful Dogs`。

现在它已经被整理成一个个人持续维护的二次开发分支，当前维护者是：

- 陈璐 / `lupanpan` - `clu396@aucklanduni.ac.nz`

这个版本的核心目标是把项目从课程作业原型，推进成一个真正可长期本地使用的桌面练习工具：

- 浏览和管理题库
- 编写、运行、提交代码
- 查看提交历史和结果
- 管理语言运行配置
- 在桌面端使用页面感知的 AI 助手

## 当前状态

这个仓库现在已经不是“仅供参考的旧作业”，而是一个已经能用的个人维护版本。

当前状态已经验证过：

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run package`
- macOS arm64 打包产物 smoke test

当前机器上实际生成的打包产物为：

```text
out/algo-platform-darwin-arm64/algo-platform.app
```

## 这一版相对原项目有哪些变化

和最初课程项目相比，这条分支现在更强调稳定性、可维护性和本地长期使用体验：

- 修复并稳定了桌面端运行时和数据库初始化流程
- 完整打通了 run / submit / submission history 的核心判题链路
- Monaco 编辑器支持按语言保存本地草稿，并支持恢复 starter code
- `Problem Admin` 已能查看和管理导入元数据、标签、starter code、testcase
- 增加了全局悬浮式 AI Assistant
- 修复了当前平台的生产打包流程，并完成了实际启动验证

当前路线图见 [docs/ROADMAP.md](./docs/ROADMAP.md)。

## 主要功能

- 基于 Electron 的本地桌面运行
- 题目列表、题目详情、提交历史
- Monaco 编辑器和本地草稿恢复
- 题目 CRUD 与测试用例 CRUD
- 中英文题面切换
- 本地 judge 语言配置管理
- LeetCode CN 本地导入能力
- 页面感知的全局 AI Assistant

## 技术栈

- 桌面端：Electron、Electron Forge
- 前端：React、MUI、Monaco Editor、Webpack
- 后端：Express、TSOA、Prisma、SQLite
- 测试：Vitest、Testing Library、Supertest

## 快速开始

### 环境要求

- 推荐 Node `22.x` LTS
- `npm`
- 可选使用 conda；仓库已提供 [`environment.yml`](./environment.yml)

### 开发环境初始化

```bash
cp .env.example .env
npm install
```

如果你使用仓库提供的 conda 环境：

```bash
conda env create -f environment.yml
conda activate delightful-dogs-dev
```

### 启动应用

普通开发启动：

```bash
npm start
```

如果 `conda activate` 后你的 shell 仍然优先使用 Homebrew 的 Node：

```bash
source scripts/use-dev-node.sh
npm start
```

也可以直接使用仓库里的 Node 22 启动脚本：

```bash
npm run start:node22
```

### 可选 AI 配置

如果要启用真实的 OpenAI 提供器：

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="your_key_here"
AI_MODEL="gpt-5-mini"
```

如果 `AI_PROVIDER` 仍然是 `mock`，AI 助手也能工作，只是走本地预览模式。

## 常用命令

只启动后端 API：

```bash
npm run dev
```

运行标准检查：

```bash
npm run lint
npm run typecheck
npm run test
```

分别运行前后端测试：

```bash
npm run test:front
npm run test:back
```

重新生成 TSOA 路由与 OpenAPI：

```bash
npx tsoa spec-and-routes
```

初始化开发数据库：

```bash
npm run db:init
```

重置并重新 seed 开发数据库：

```bash
npm run db:reset
```

准备生产打包使用的 seed 数据库：

```bash
npm run db:prepare-package-db
```

从本地 `leetcode-problemset` 导入 LeetCode CN 数据：

```bash
npm run import:leetcode-cn -- --source /path/to/leetcode-problemset/leetcode-cn/originData --limit 20 --dry-run --verbose
npm run import:leetcode-cn -- --source /path/to/leetcode-problemset/leetcode-cn/originData --limit 20
```

打包当前平台：

```bash
npm run package
```

## 打包说明

- 打包是按平台分别进行的，不是一个包同时适用于所有系统
- 当前仓库状态已经在 macOS arm64 上完成了实际打包与启动验证
- `npm run package` 现在会自动准备 seed 数据库、生成 Prisma Client、执行 `npm run typecheck`，然后再调用 Electron Forge
- Windows 打包配置已经存在，但仍需要在 Windows 机器上单独验证

## 文档索引

- 文档总览：[docs/README.md](./docs/README.md)
- 架构概览：[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- 当前验证状态与支持范围：[docs/STATUS.md](./docs/STATUS.md)
- 迭代路线图：[docs/ROADMAP.md](./docs/ROADMAP.md)
- 开发说明：[docs/development.md](./docs/development.md)
- 规划文档集合：[docs/plans/](./docs/plans)

## 仓库结构

```text
.
├── src/                 # Electron 主进程、后端、前端、共享逻辑与测试
├── scripts/             # 本地辅助脚本，例如 Node 22 启动脚本
├── docs/                # 路线图、开发文档、规划文档与静态文档资源
├── build-resources/     # 打包阶段生成的资源，例如 seed.db
├── backups/             # 本地备份文件
├── package.json         # npm 脚本与依赖声明
├── forge.config.js      # Electron Forge 打包配置
└── README.md            # 英文说明
```

## 为什么有些文件应该继续放在根目录

不是所有文件都适合搬进 `docs/`。

下面这些文件本来就应该放在根目录，因为构建工具、包管理器和运行时默认会从根目录找它们：

- `package.json`, `package-lock.json`
- `forge.config.js`
- `tsconfig.json`
- `tsoa.json`
- `vitest.config.ts`
- `webpack.*.js`
- `.gitignore`, `.env.example`
- `environment.yml`

简单来说：

- 说明文档、规划文档、图片资源适合放到 `docs/`
- 构建配置、运行配置、包管理入口文件应该继续留在根目录

## 原始团队成员

- Manling Chen - `mche600@aucklanduni.ac.nz`
- Xinyang Guo - `xguo339@aucklanduni.ac.nz`
- Yimei Zhang - `byhz331@aucklanduni.ac.nz`
- Zhuyu Liu - `zliu770@aucklanduni.ac.nz`
- Junxiao Liao - `jila469@aucklanduni.ac.nz`
- Chen Lu - `clu396@aucklanduni.ac.nz`
