/**
 * build.js — 静态博客构建器
 *
 * 将 src/posts/*.md 文章 + src/templates/*.html 模板
 * 构建为 docs/ 目录下的完整静态网站
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const katex = require('katex');

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: false,
});

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DOCS = path.join(ROOT, 'docs');

/* ========================================
   工具函数
   ======================================== */

function readFile(...parts) {
  return fs.readFileSync(path.join(...parts), 'utf-8');
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

function copyFile(src, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

/** 递归复制目录 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else copyFile(srcPath, destPath);
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('zh-CN', options);
}

/** 在 Markdown 解析前保护数学公式，防止 marked 破坏 LaTeX 语法 */
function protectMath(md) {
  const blocks = [];
  const inlines = [];
  // 先保护 $$...$$ 块级公式
  md = md.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    blocks.push(match);
    return `\x00MBLK${blocks.length - 1}\x00`;
  });
  // 再保护 $...$ 行内公式
  md = md.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (match) => {
    inlines.push(match);
    return `\x00MINL${inlines.length - 1}\x00`;
  });
  return { protectedMd: md, blocks, inlines };
}

/** 将保护过的公式占位符还原 */
function restoreMath(html, blocks, inlines) {
  blocks.forEach((math, i) => {
    html = html.split(`\x00MBLK${i}\x00`).join(math);
  });
  inlines.forEach((math, i) => {
    html = html.split(`\x00MINL${i}\x00`).join(math);
  });
  return html;
}

/** 将 HTML 中的 LaTeX 公式渲染为 KaTeX HTML */
function renderMath(html) {
  // 先处理 $$...$$ 块级公式
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  // 再处理 $...$ 行内公式（不匹配 $$）
  html = html.replace(/(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  return html;
}

/** 将中文标题转换为 URL 友好的 slug */
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

/* ========================================
   解析 Markdown 文章
   ======================================== */

function parsePost(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');

  // 解析 frontmatter
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!fmMatch) {
    console.warn(`警告: ${filePath} 缺少 frontmatter，跳过`);
    return null;
  }

  const frontmatter = {};
  fmMatch[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // 解析 tags 数组: [tag1, tag2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim());
    }
    // 去掉字符串引号
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (typeof value === 'string' && value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  });

  const markdownBody = fmMatch[2].trim();
  const { protectedMd, blocks, inlines } = protectMath(markdownBody);
  const rawHtml = marked.parse(protectedMd);
  const restoredHtml = restoreMath(rawHtml, blocks, inlines);
  const htmlBody = renderMath(restoredHtml);

  // 从文件名提取 slug（去掉日期前缀）
  const fileName = path.basename(filePath, '.md');
  const slugMatch = fileName.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  const slug = slugMatch ? slugMatch[1] : titleToSlug(frontmatter.title || fileName);

  return {
    title: frontmatter.title || 'Untitled',
    date: frontmatter.date || '2026-01-01',
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    excerpt: frontmatter.excerpt || '',
    slug,
    markdownBody,
    htmlBody,
  };
}

/* ========================================
   模板渲染
   ======================================== */

function render(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

/* ========================================
   主构建流程
   ======================================== */

function build() {
  console.log('🔨 开始构建博客...\n');

  // 清理旧的构建产物（避免已删除文章残留）
  const docsPosts = path.join(DOCS, 'posts');
  if (fs.existsSync(docsPosts)) {
    fs.rmSync(docsPosts, { recursive: true });
  }

  // 1. 读取站点配置
  const config = JSON.parse(readFile(ROOT, 'site.config.json'));

  // 2. 读取模板
  const baseTpl = readFile(SRC, 'templates', 'base.html');
  const homeTpl = readFile(SRC, 'templates', 'home.html');
  const postTpl = readFile(SRC, 'templates', 'post.html');

  // 3. 扫描并解析所有文章
  const postsDir = path.join(SRC, 'posts');
  const files = fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse(); // 日期降序

  const posts = files
    .map(f => parsePost(path.join(postsDir, f)))
    .filter(Boolean);

  console.log(`📄 找到 ${posts.length} 篇文章`);

  // 4. 收集标签
  const tagSet = new Set();
  posts.forEach(post => post.tags.forEach(tag => tagSet.add(tag)));
  const sortedTags = Array.from(tagSet).sort();

  // 5. 生成首页内容
  const filterChipsHtml = ['全部', ...sortedTags]
    .map(tag => `<button class="chip${tag === '全部' ? ' active' : ''}" data-tag="${tag}">${tag}</button>`)
    .join('\n          ');

  const postCardsHtml = posts
    .map((post, i) => {
      const coverClass = `cover-${(i % 9) + 1}`;
      const url = `./posts/${post.slug}/`;
      return `
        <a href="${url}" class="post-card">
          <div class="post-card-cover ${coverClass}"></div>
          <div class="post-card-body">
            <div class="post-card-tags">
              ${post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('\n              ')}
            </div>
            <h2 class="post-card-title">${post.title}</h2>
            <time class="post-card-date" datetime="${post.date}">${formatDate(post.date)}</time>
            <p class="post-card-excerpt">${post.excerpt}</p>
          </div>
        </a>`;
    })
    .join('\n      ');

  // 构建供客户端 JS 使用的元数据
  const postsMetadata = posts.map((post, i) => ({
    title: post.title,
    date: post.date,
    tags: post.tags,
    excerpt: post.excerpt,
    url: `./posts/${post.slug}/`,
    coverClass: `cover-${(i % 9) + 1}`,
  }));

  // 6. 渲染首页
  const homeContent = render(homeTpl, {
    AVATAR: config.avatarInitials,
    AUTHOR: config.author,
    BIO: config.authorBio,
    SOCIAL_GITHUB: config.social.github,
    SOCIAL_TWITTER: config.social.twitter,
    SOCIAL_EMAIL: config.social.email,
    FILTER_CHIPS: filterChipsHtml,
    POST_CARDS: postCardsHtml,
    POSTS_JSON: JSON.stringify(postsMetadata),
  });

  const homeHtml = render(baseTpl, {
    TITLE: config.siteName,
    CSS_PATH: './css/style.css',
    KATEX_CSS: './css/katex.min.css',
    JS_PATH: './js/main.js',
    HOME_URL: './',
    HOME_ACTIVE: ' active',
    SITE_NAME: config.siteName,
    SOCIAL_GITHUB: config.social.github,
    SOCIAL_TWITTER: config.social.twitter,
    CONTENT: homeContent,
  });

  writeFile(path.join(DOCS, 'index.html'), homeHtml);
  console.log('✅ 首页已生成');

  // 7. 生成文章详情页
  posts.forEach((post, i) => {
    const coverClass = `cover-${(i % 9) + 1}`;
    const tagsHtml = post.tags
      .map(tag => `<span class="post-tag">${tag}</span>`)
      .join('\n          ');

    const postContent = render(postTpl, {
      HOME_URL: '../../',
      POST_TITLE: post.title,
      POST_DATE: post.date,
      POST_DATE_FORMATTED: formatDate(post.date),
      AUTHOR: config.author,
      POST_TAGS: tagsHtml,
      COVER_CLASS: coverClass,
      POST_CONTENT: post.htmlBody,
    });

    const postHtml = render(baseTpl, {
      TITLE: `${post.title} — ${config.siteName}`,
      CSS_PATH: '../../css/style.css',
      KATEX_CSS: '../../css/katex.min.css',
      JS_PATH: '../../js/main.js',
      HOME_URL: '../../',
      HOME_ACTIVE: '',
      SITE_NAME: config.siteName,
      SOCIAL_GITHUB: config.social.github,
      SOCIAL_TWITTER: config.social.twitter,
      CONTENT: postContent,
    });

    writeFile(path.join(DOCS, 'posts', post.slug, 'index.html'), postHtml);
  });

  console.log(`✅ ${posts.length} 篇文章详情页已生成`);

  // 8. 复制静态资源
  copyFile(
    path.join(SRC, 'css', 'style.css'),
    path.join(DOCS, 'css', 'style.css')
  );
  copyFile(
    path.join(SRC, 'js', 'main.js'),
    path.join(DOCS, 'js', 'main.js')
  );

  // 复制 KaTeX CSS
  copyFile(
    path.join(ROOT, 'node_modules', 'katex', 'dist', 'katex.min.css'),
    path.join(DOCS, 'css', 'katex.min.css')
  );

  // 复制 KaTeX 字体
  const katexFontsSrc = path.join(ROOT, 'node_modules', 'katex', 'dist', 'fonts');
  const katexFontsDest = path.join(DOCS, 'css', 'fonts');
  if (!fs.existsSync(katexFontsDest)) {
    fs.mkdirSync(katexFontsDest, { recursive: true });
  }
  fs.readdirSync(katexFontsSrc).forEach(f => {
    copyFile(path.join(katexFontsSrc, f), path.join(katexFontsDest, f));
  });

  // 复制 assets（图片/视频/附件）
  const assetsSrc = path.join(SRC, 'assets');
  const assetsDest = path.join(DOCS, 'assets');
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, assetsDest);
    console.log('✅ assets 已复制');
  }

  console.log('✅ CSS/JS/KaTeX 已复制');

  console.log(`\n🎉 构建完成！输出目录: ${DOCS}`);
  console.log('   用浏览器打开 docs/index.html 即可预览');
}

build();
