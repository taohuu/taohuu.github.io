/**
 * build.js — 静态博客构建器
 *
 * 将 src/posts/*.md 文章 + src/templates/*.html 模板
 * 构建为 docs/ 目录下的完整静态网站
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

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

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('zh-CN', options);
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
  const htmlBody = marked.parse(markdownBody);

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
  console.log('✅ CSS/JS 已复制');

  console.log(`\n🎉 构建完成！输出目录: ${DOCS}`);
  console.log('   用浏览器打开 docs/index.html 即可预览');
}

build();
