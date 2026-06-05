# 📝 Simple Blog

极简个人博客系统——**网页编辑器写作，一键发布到 GitHub Pages**。

纯 HTML/CSS/JS 前端 + Node.js 构建工具链，零框架依赖，仅需两个 npm 包。

## ✨ 特性

- **💻 Web 编辑器** — 在浏览器里写文章，Markdown 实时预览，所见即所得
- **🔢 LaTeX 数学公式** — 行内 `$...$` 和块级 `$$...$$` 公式完美渲染（KaTeX）
- **📷 文件上传** — 一键上传图片、视频、附件到编辑器
- **🎨 主题切换** — 亮色/暗色模式，自动识别系统偏好
- **🏷️ 标签筛选** — 文章分类标签，首页一键过滤
- **⚡ 一键发布** — `npm run publish` 构建 + Git 推送，自动部署
- **📱 响应式** — 桌面/平板/手机完美适配

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/taohuu/taohuu.github.io.git
cd taohuu.github.io

# 2. 安装依赖
npm install

# 3. 启动编辑器
npm run serve
```

浏览器打开 `http://localhost:3000`，开始写作。

## 📖 完整工作流

```
npm run serve   →   打开编辑器 http://localhost:3000
       │
       ├── ✍️ 写文章（Markdown + 实时预览 + 公式渲染）
       ├── 📷 上传图片/视频/附件
       ├── 💾 保存（Ctrl+S）
       ├── 🔨 构建
       └── 🚀 发布 → 推送到 GitHub → Pages 自动部署
```

### 四个命令

| 命令 | 功能 |
|------|------|
| `npm run serve` | 启动 Web 编辑器（http://localhost:3000） |
| `npm run new` | 命令行交互式创建新文章 |
| `npm run build` | 构建站点 → `docs/` 目录 |
| `npm run publish` | 一键三连：构建 + Git 提交 + 推送 |

## 🖊️ 编辑器功能

启动 `npm run serve` 后，在浏览器中获得完整的写作环境：

### 写作区

- **左侧**：文章列表，点击加载或编辑已有文章
- **中间**：Markdown 编辑器，等宽字体，支持格式化工具栏
- **右侧**：实时预览，Markdown 即时渲染 + 数学公式

### 工具栏

| 按钮 | 功能 | 快捷键 |
|------|------|--------|
| **B** | 粗体 `**text**` | - |
| **I** | 斜体 `*text*` | - |
| H2/H3 | 标题 | - |
| `</>` | 行内代码 | - |
| `{}` | 代码块 | - |
| 📷 | 上传图片 → 插入 `![name](path)` | - |
| 📹 | 上传视频 → 插入 `<video>` | - |
| 📎 | 上传附件 → 插入 `[name](path)` | - |
| 💾 | 保存文章 | `Ctrl+S` |
| 🗑️ | 删除当前文章 | - |
| 🔨 | 构建站点 | - |
| 🚀 | 发布到 GitHub | - |

### 数学公式

```markdown
行内公式：$E = mc^2$

块级公式：
$$
\begin{cases}
\displaystyle L = \frac{\mu}{2\pi}\ln\frac{b}{a} \quad (\mathrm{H/m}) \\[6pt]
\displaystyle C = \frac{2\pi\varepsilon}{\ln\frac{b}{a}} \quad (\mathrm{F/m})
\end{cases}
$$
```

## 📁 目录结构

```
blog/
├── site.config.json         # 博客名、作者、社交链接
├── package.json
├── README.md
├── src/
│   ├── posts/               # ✍️ Markdown 文章源文件
│   │   └── 2026-06-04-my-post.md
│   ├── assets/               # 📷 上传的图片/视频/附件
│   │   ├── images/
│   │   ├── videos/
│   │   └── files/
│   ├── templates/            # HTML 模板
│   │   ├── base.html         # 基础布局（header + footer）
│   │   ├── home.html         # 首页
│   │   └── post.html         # 文章详情页
│   ├── css/
│   │   └── style.css         # 完整样式
│   ├── js/
│   │   └── main.js           # 客户端 JS（主题切换 + 标签筛选）
│   └── editor.html           # Web 编辑器页面
├── scripts/
│   ├── build.js              # 静态站点构建器
│   ├── new.js                # 命令行新文章向导
│   └── serve.js              # Web 编辑器服务器
└── docs/                     # 构建产物 → GitHub Pages 源
    ├── index.html
    ├── posts/<slug>/
    ├── assets/
    ├── css/
    └── js/
```

## ⚙️ 自定义

编辑 `site.config.json`：

```json
{
  "siteName": "我的博客",
  "author": "张三",
  "authorBio": "热爱技术与写作的全栈开发者。",
  "avatarInitials": "ZS",
  "social": {
    "github": "https://github.com/yourname",
    "twitter": "https://twitter.com/yourname",
    "email": "mailto:you@example.com"
  }
}
```

保存后重新构建生效。

## 📝 文章格式

在 `src/posts/` 下创建 `YYYY-MM-DD-slug.md` 文件，使用 YAML frontmatter：

```markdown
---
title: "如何用 CSS Grid 构建现代网页布局"
date: 2026-05-28
tags: [技术, CSS]
excerpt: "文章摘要，显示在首页卡片上"
---

正文内容，支持标准 Markdown 语法：

## 二级标题

### 三级标题

**粗体** *斜体* `行内代码`

```javascript
// 代码块
console.log('Hello');
```

> 引用文字

- 列表项
- 列表项

[链接文字](https://example.com)

$$E = mc^2$$
```

### frontmatter 字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | ✅ | 文章标题 |
| `date` | ✅ | 发布日期，格式 `YYYY-MM-DD` |
| `tags` | ✅ | 标签数组，如 `[技术, CSS]` |
| `excerpt` | 否 | 文章摘要，显示在首页卡片上 |

## 🌐 GitHub Pages 部署

### 首次设置

1. 在 GitHub 创建仓库（如 `yourname.github.io`）
2. 将代码推送到仓库
3. 进入仓库 **Settings → Pages**
4. **Source** 选择 **Deploy from a branch**
5. **Branch** 选择你的分支（如 `html`），**Folder** 选择 `/docs`
6. 点击 **Save**

### 日常发布

```bash
npm run publish
```

或在编辑器里点击「🚀 发布」按钮。

## 🔧 技术栈

- **前端**：原生 HTML + CSS + JavaScript，零框架
- **构建**：Node.js + `marked`（Markdown 解析）+ `katex`（数学公式渲染）
- **编辑器**：Node.js 内置 HTTP 模块，单文件服务器
- **部署**：GitHub Pages（静态托管）

## 📄 许可

MIT License
