# My Blog

极简个人博客 — Markdown 写作，一键发布到 GitHub Pages。

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 创建新文章
npm run new

# 3. 构建站点
npm run build

# 4. 本地预览
# 用浏览器打开 docs/index.html

# 5. 发布到 GitHub Pages
npm run publish
```

## 📁 目录结构

```
├── site.config.json    # 站点配置（博客名、作者、社交链接）
├── src/
│   ├── posts/          # ✍️ Markdown 文章（在这里写文章）
│   ├── templates/      # HTML 模板
│   ├── css/            # 样式文件
│   └── js/             # 客户端脚本
├── scripts/
│   ├── build.js        # 构建脚本
│   └── new.js          # 新文章向导
├── docs/               # 构建产物（GitHub Pages 从这里部署）
└── package.json
```

## ✍️ 写文章

### 方式一：命令行工具

```bash
npm run new
```

交互式创建：输入标题、标签，自动生成 Markdown 文件。

### 方式二：命令行模式

```bash
npm run new -- "我的新文章" "技术, 生活"
```

### 方式三：手动创建

在 `src/posts/` 下创建 `YYYY-MM-DD-slug.md` 文件：

```markdown
---
title: "文章标题"
date: 2026-06-03
tags: [技术, JavaScript]
excerpt: "文章摘要显示在首页卡片上"
---

正文内容，支持 Markdown 语法...
```

## 🔨 构建 & 发布

```bash
# 构建（生成 docs/ 目录）
npm run build

# 一键发布（构建 + git 提交 + 推送）
npm run publish
```

## 🌐 GitHub Pages 部署

1. 在 GitHub 创建仓库
2. 将代码推送到仓库
3. 进入 Settings → Pages
4. Source 选择 "Deploy from a branch"
5. Branch 选择 `main`，Folder 选择 `/docs`
6. 保存后自动部署

之后每次运行 `npm run publish` 即可自动更新网站。

## ⚙️ 自定义

编辑 `site.config.json`：

```json
{
  "siteName": "我的博客",
  "author": "张三",
  "authorBio": "你的个人简介...",
  "avatarInitials": "ZS",
  "social": {
    "github": "https://github.com/yourname",
    "twitter": "https://twitter.com/yourname",
    "email": "mailto:you@example.com"
  }
}
```

## 📝 文章格式

支持标准 Markdown 语法：

- **标题**: `##` 和 `###`
- **代码块**: 三个反引号包裹
- **引用**: `>` 开头
- **加粗**: `**文字**`
- **列表**: `-` 和 `1.`
- **链接**: `[文字](URL)`
