/**
 * serve.js — 博客 Web 编辑器
 *
 * 启动本地服务器，在浏览器中提供:
 * - Markdown 编辑器 + 实时预览
 * - 一键保存、构建、发布
 *
 * 用法: npm run serve
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'src', 'posts');
const PORT = 3000;

/* ========================================
   工具函数
   ======================================== */

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
    .replace(/[^a-zA-Z0-9一-鿿-]/g, '')
    .slice(0, 40)
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function parsePostFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!fmMatch) {
    return { title: path.basename(filePath, '.md'), date: '', tags: [], excerpt: '', body: raw, slug: path.basename(filePath, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, ''), fileName: path.basename(filePath) };
  }

  const frontmatter = {};
  fmMatch[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim());
    }
    if (typeof value === 'string') {
      value = value.replace(/^["']|["']$/g, '');
    }
    frontmatter[key] = value;
  });

  const fileName = path.basename(filePath);
  const baseName = path.basename(filePath, '.md');
  const slugMatch = baseName.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);

  return {
    title: frontmatter.title || 'Untitled',
    date: frontmatter.date || '',
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    excerpt: frontmatter.excerpt || '',
    body: fmMatch[2].trim(),
    slug: slugMatch ? slugMatch[1] : titleToSlug(frontmatter.title || baseName),
    fileName,
  };
}

/* ========================================
   API 处理
   ======================================== */

function listPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse()
    .map(f => {
      const post = parsePostFile(path.join(POSTS_DIR, f));
      return { title: post.title, date: post.date, tags: post.tags, slug: post.slug, fileName: post.fileName };
    });
}

function getPost(fileName) {
  const filePath = path.join(POSTS_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  return parsePostFile(filePath);
}

function savePost({ title, date, tags, excerpt, body, originalFileName }) {
  const slug = titleToSlug(title);
  const useDate = date || getToday();
  const tagsStr = tags.length > 0 ? `[${tags.join(', ')}]` : '[]';

  let content = [
    '---',
    `title: "${title}"`,
    `date: ${useDate}`,
    `tags: ${tagsStr}`,
    `excerpt: "${excerpt || ''}"`,
    '---',
    '',
    body || '在这里写正文...',
  ].join('\n');

  let fileName;

  // 如果是编辑已有文章，删除旧文件
  if (originalFileName) {
    const oldPath = path.join(POSTS_DIR, originalFileName);
    if (fs.existsSync(oldPath) && originalFileName !== `${useDate}-${slug}.md`) {
      fs.unlinkSync(oldPath);
    }
    fileName = `${useDate}-${slug}.md`;
  } else {
    fileName = `${useDate}-${slug}.md`;
    // 如果同名文件已存在，追加序号
    if (fs.existsSync(path.join(POSTS_DIR, fileName))) {
      let counter = 1;
      while (fs.existsSync(path.join(POSTS_DIR, `${useDate}-${slug}-${counter}.md`))) {
        counter++;
      }
      fileName = `${useDate}-${slug}-${counter}.md`;
    }
  }

  const filePath = path.join(POSTS_DIR, fileName);
  fs.writeFileSync(filePath, content, 'utf-8');
  return { fileName, slug, filePath };
}

/* ========================================
   HTTP 服务器
   ======================================== */

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveFile(res, filePath, contentType) {
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}

function readBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

/** 简单 multipart/form-data 解析器 */
function parseMultipart(buffer, boundary) {
  const parts = [];
  const str = buffer.toString('binary');
  const delim = '--' + boundary;
  const chunks = str.split(delim);
  for (const chunk of chunks) {
    if (chunk.startsWith('--') || chunk.trim() === '') continue;
    const headerEnd = chunk.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = chunk.substring(0, headerEnd);
    let body = chunk.substring(headerEnd + 4);
    // 去掉尾部 \r\n
    if (body.endsWith('\r\n')) body = body.substring(0, body.length - 2);
    const fnMatch = headers.match(/filename="([^"]*)"/);
    if (fnMatch) {
      parts.push({ filename: fnMatch[1], data: Buffer.from(body, 'binary') });
    }
  }
  return parts;
}

/** 接收原始请求体 */
function readRawBody(req) {
  return new Promise(resolve => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  // 路由
  try {
    // GET / → 编辑器页面
    if (method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(EDITOR_HTML);
      return;
    }

    // GET /marked.js → 从 node_modules 加载
    if (method === 'GET' && url.pathname === '/marked.js') {
      serveFile(res, path.join(ROOT, 'node_modules', 'marked', 'lib', 'marked.umd.js'), 'application/javascript');
      return;
    }

    // GET /katex.min.css
    if (method === 'GET' && url.pathname === '/katex.min.css') {
      serveFile(res, path.join(ROOT, 'node_modules', 'katex', 'dist', 'katex.min.css'), 'text/css');
      return;
    }

    // GET /katex.min.js
    if (method === 'GET' && url.pathname === '/katex.min.js') {
      serveFile(res, path.join(ROOT, 'node_modules', 'katex', 'dist', 'katex.min.js'), 'application/javascript');
      return;
    }

    // GET /fonts/* → KaTeX 字体
    if (method === 'GET' && url.pathname.startsWith('/fonts/')) {
      const fontFile = url.pathname.replace('/fonts/', '');
      serveFile(res, path.join(ROOT, 'node_modules', 'katex', 'dist', 'fonts', fontFile), 'application/octet-stream');
      return;
    }

    // GET /assets/* → 上传的静态资源
    if (method === 'GET' && url.pathname.startsWith('/assets/')) {
      const assetPath = decodeURIComponent(url.pathname.replace('/assets/', ''));
      const ext = path.extname(assetPath).toLowerCase();
      const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf' };
      const mime = mimeMap[ext] || 'application/octet-stream';
      serveFile(res, path.join(ROOT, 'src', 'assets', assetPath), mime);
      return;
    }

    // GET /api/posts → 列出所有文章
    if (method === 'GET' && url.pathname === '/api/posts') {
      json(res, listPosts());
      return;
    }

    // GET /api/posts/:fileName → 获取单篇文章
    if (method === 'GET' && url.pathname.startsWith('/api/posts/')) {
      const fileName = decodeURIComponent(url.pathname.replace('/api/posts/', ''));
      const post = getPost(fileName);
      if (!post) { json(res, { error: '文章不存在' }, 404); return; }
      json(res, post);
      return;
    }

    // DELETE /api/posts/:fileName → 删除文章
    if (method === 'DELETE' && url.pathname.startsWith('/api/posts/')) {
      const fileName = decodeURIComponent(url.pathname.replace('/api/posts/', ''));
      const filePath = path.join(POSTS_DIR, fileName);
      if (!fs.existsSync(filePath)) { json(res, { error: '文章不存在' }, 404); return; }
      const post = getPost(fileName);
      fs.unlinkSync(filePath);
      // 同步删除构建产物
      if (post && post.slug) {
        const builtDir = path.join(ROOT, 'docs', 'posts', post.slug);
        if (fs.existsSync(builtDir)) fs.rmSync(builtDir, { recursive: true });
      }
      json(res, { ok: true, fileName });
      return;
    }

    // POST /api/upload → 上传文件
    if (method === 'POST' && url.pathname === '/api/upload') {
      const data = await readBody(req);
      if (!data.name || !data.data) { json(res, { error: '缺少文件信息' }, 400); return; }
      // base64 解码
      const base64 = data.data.replace(/^data:[^;]+;base64,/, '');
      const buf = Buffer.from(base64, 'base64');
      // 按类型分目录
      const mime = data.type || '';
      let subdir = 'files';
      if (mime.startsWith('image/')) subdir = 'images';
      else if (mime.startsWith('video/')) subdir = 'videos';
      // 加时间戳防重名
      const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const safeName = ts + '-' + data.name.replace(/[^a-zA-Z0-9._\-一-鿿]/g, '_');
      const assetsDir = path.join(ROOT, 'src', 'assets', subdir);
      if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(path.join(assetsDir, safeName), buf);
      const publicPath = 'assets/' + subdir + '/' + safeName;
      json(res, { ok: true, path: publicPath, name: data.name, type: subdir });
      return;
    }

    // POST /api/save → 保存文章
    if (method === 'POST' && url.pathname === '/api/save') {
      const data = await readBody(req);
      if (!data.title) { json(res, { error: '标题不能为空' }, 400); return; }
      const result = savePost(data);
      json(res, { ok: true, ...result });
      return;
    }

    // POST /api/build → 构建站点
    if (method === 'POST' && url.pathname === '/api/build') {
      try {
        const output = execSync('npm run build', { cwd: ROOT, encoding: 'utf-8', timeout: 30000 });
        json(res, { ok: true, output });
      } catch (err) {
        json(res, { ok: false, output: err.stdout || err.message }, 500);
      }
      return;
    }

    // POST /api/publish → 发布
    if (method === 'POST' && url.pathname === '/api/publish') {
      try {
        execSync('npm run build', { cwd: ROOT, encoding: 'utf-8', timeout: 30000 });
        execSync('git add docs/', { cwd: ROOT, encoding: 'utf-8' });
        // 如果有变更才 commit
        let commitMsg = '';
        try {
          execSync('git diff --cached --quiet', { cwd: ROOT, encoding: 'utf-8' });
          commitMsg = '(无变更，跳过 commit)';
        } catch {
          execSync('git commit -m "📝 Publish blog"', { cwd: ROOT, encoding: 'utf-8' });
          commitMsg = '已提交';
        }
        const pushOut = execSync('git push', { cwd: ROOT, encoding: 'utf-8', timeout: 60000 });
        json(res, { ok: true, output: '构建 & 发布成功！\n' + commitMsg + '\n' + pushOut });
      } catch (err) {
        const stderr = typeof err.stderr === 'string' ? err.stderr : (err.stderr ? Buffer.from(err.stderr).toString('utf-8') : '');
        const stdout = typeof err.stdout === 'string' ? err.stdout : (err.stdout ? Buffer.from(err.stdout).toString('utf-8') : '');
        const detail = (stdout + '\n' + stderr + '\n' + (err.message || '')).trim();
        json(res, { ok: false, output: detail }, 500);
      }
      return;
    }

    // 404
    res.writeHead(404);
    res.end('Not Found');
  } catch (err) {
    json(res, { error: err.message }, 500);
  }
});

/* ========================================
   编辑器 HTML（内嵌）
   ======================================== */

const EDITOR_HTML = fs.readFileSync(path.join(ROOT, 'src', 'editor.html'), 'utf-8')
  .replaceAll('{{TODAY}}', getToday());
/* ========================================
   启动
   ======================================== */

server.listen(PORT, () => {
  console.log('');
  console.log('  📝 博客编辑器已启动！');
  console.log('  → 在浏览器打开: http://localhost:' + PORT);
  console.log('');
  console.log('  Ctrl+C 停止服务');
  console.log('');
});
