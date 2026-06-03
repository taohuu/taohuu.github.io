/* ========================================
   从构建时注入的数据读取文章列表
   数据由 build.js 在生成首页时嵌入 window.__POSTS__
   ======================================== */

const posts = window.__POSTS__ || [];

/* ========================================
   工具函数
   ======================================== */

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('zh-CN', options);
}

/* ========================================
   标签筛选栏渲染
   ======================================== */

function getAllTags() {
  const tagSet = new Set();
  posts.forEach(post => post.tags.forEach(tag => tagSet.add(tag)));
  return ['全部', ...Array.from(tagSet).sort()];
}

function renderFilterChips(activeTag) {
  const chipsContainer = document.getElementById('filterChips');
  if (!chipsContainer) return;

  const tags = getAllTags();

  chipsContainer.innerHTML = tags
    .map(
      tag =>
        `<button class="chip${tag === activeTag ? ' active' : ''}" data-tag="${tag}">${tag}</button>`
    )
    .join('');

  chipsContainer.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag;
      renderFilterChips(tag);
      renderPosts(tag);
    });
  });
}

/* ========================================
   文章卡片渲染
   ======================================== */

function renderPosts(activeTag) {
  const grid = document.getElementById('postsGrid');
  const noResults = document.getElementById('noResults');
  if (!grid) return;

  const filteredPosts =
    activeTag === '全部'
      ? posts
      : posts.filter(post => post.tags.includes(activeTag));

  if (filteredPosts.length === 0) {
    grid.innerHTML = '';
    if (noResults) noResults.hidden = false;
    return;
  }

  if (noResults) noResults.hidden = true;

  grid.innerHTML = filteredPosts
    .map(
      post => `
      <a href="${post.url}" class="post-card">
        <div class="post-card-cover ${post.coverClass}"></div>
        <div class="post-card-body">
          <div class="post-card-tags">
            ${post.tags
              .map(tag => `<span class="post-tag">${tag}</span>`)
              .join('')}
          </div>
          <h2 class="post-card-title">${post.title}</h2>
          <time class="post-card-date" datetime="${post.date}">${formatDate(post.date)}</time>
          <p class="post-card-excerpt">${post.excerpt}</p>
        </div>
      </a>
    `
    )
    .join('');
}

/* ========================================
   主题切换
   ======================================== */

function initTheme() {
  const savedTheme = localStorage.getItem('blog-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.body.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('blog-theme', newTheme);
}

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
});

/* ========================================
   导航栏滚动阴影
   ======================================== */

function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* ========================================
   初始化
   ======================================== */

function init() {
  initTheme();
  initHeaderScroll();
  renderFilterChips('全部');
  renderPosts('全部');
}

init();
