/**
 * new.js — 交互式新文章创建向导
 *
 * 用法:
 *   npm run new                          # 交互模式
 *   npm run new -- "文章标题" "标签1,标签2"  # 命令行模式
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'src', 'posts');

function getToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function titleToSlug(title) {
  return title
    .replace(/《|》|：|，|。/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9一-龥-]/g, '')
    .slice(0, 40)
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * 使用非交互模式创建文章
 */
async function createNonInteractive(title, tagsStr) {
  const slug = titleToSlug(title);
  const date = getToday();
  const tags = tagsStr
    ? tagsStr.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const frontmatter = `---
title: "${title}"
date: ${date}
tags: [${tags.join(', ')}]
excerpt: ""
---

在这里写正文...
`;

  const fileName = `${date}-${slug}.md`;
  const filePath = path.join(POSTS_DIR, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`❌ 文件已存在: ${fileName}`);
    return;
  }

  fs.writeFileSync(filePath, frontmatter, 'utf-8');
  console.log(`✅ 文章已创建: src/posts/${fileName}`);
  console.log(`   用编辑器打开即可开始写作 ✍️`);
}

/**
 * 交互式创建文章
 */
async function createInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  console.log('📝 创建新文章\n');

  const title = await question('文章标题: ');
  if (!title.trim()) {
    console.log('❌ 标题不能为空');
    rl.close();
    return;
  }

  const tagsInput = await question('标签 (逗号分隔，如: 技术, JavaScript): ');
  const excerpt = await question('摘要 (可选，直接回车跳过): ');

  const slug = titleToSlug(title.trim());
  const date = getToday();
  const tags = tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const frontmatter = `---
title: "${title.trim()}"
date: ${date}
tags: [${tags.join(', ')}]
excerpt: "${excerpt.trim()}"
---

在这里写正文...
`;

  const fileName = `${date}-${slug}.md`;
  const filePath = path.join(POSTS_DIR, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`❌ 文件已存在: ${fileName}`);
    rl.close();
    return;
  }

  fs.writeFileSync(filePath, frontmatter, 'utf-8');

  console.log(`\n✅ 文章已创建: src/posts/${fileName}`);
  console.log('  用编辑器打开即可开始写作 ✍️');
  console.log('  写完后运行 npm run build 构建，npm run publish 发布\n');

  rl.close();
}

// 主入口
const args = process.argv.slice(2);

// 确保目录存在
if (!fs.existsSync(POSTS_DIR)) {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
}

if (args.length >= 1) {
  createNonInteractive(args[0], args[1]);
} else {
  createInteractive();
}
