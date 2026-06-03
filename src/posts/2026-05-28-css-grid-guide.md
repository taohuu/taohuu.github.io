---
title: 如何用 CSS Grid 构建现代网页布局
date: 2026-05-28
tags: [技术, CSS]
excerpt: CSS Grid 已经成为现代网页布局的基石。本文深入探讨 Grid 的核心概念、实战技巧，以及与传统布局方案的对比，帮你彻底掌握这一强大工具。
---

CSS Grid 已经成为现代网页布局的基石。相比 Flexbox 的一维布局，Grid 提供了真正的二维布局能力，让我们可以同时控制行和列。

## 为什么选择 Grid？

在 Grid 出现之前，我们使用浮动、定位、inline-block 甚至表格来布局。Flexbox 解决了一维布局问题，但复杂的页面布局仍然需要嵌套多层 flex 容器。

Grid 的优势在于：

- **二维控制**：同时定义行和列，不再需要嵌套
- **间距管理**：`gap` 属性统一管理行列间距
- **区域命名**：通过 `grid-template-areas` 给网格区域命名
- **响应式友好**：配合 `auto-fit`/`auto-fill` 轻松实现自适应

## 核心概念

### 网格容器与网格项

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 24px;
}
```

设置 `display: grid` 后，直接子元素自动成为网格项。

### fr 单位的妙用

`fr` 是 Grid 独有的弹性单位，代表"一份可用空间"。例如 `1fr 2fr 1fr` 表示三列宽度比例为 1:2:1。

```css
.grid {
  grid-template-columns: 200px 1fr 1fr;
  /* 第一列固定 200px，剩余空间由后两列平分 */
}
```

### 自动填充的神奇之处

最实用的 Grid 技巧之一——无需媒体查询即可实现响应式卡片布局：

```css
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}
```

当容器宽度变化时，列数自动调整，卡片最小宽度 320px，多余空间均分。

## 实战：博客首页布局

用 Grid 实现一个典型的博客布局只需要几行代码：

```css
.blog-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "main   sidebar"
    "footer footer";
  gap: 24px;
  min-height: 100vh;
}
```

> Grid 的强大之处在于：复杂的布局不需要复杂的代码。只要思路清晰，Grid 就能帮你干净地实现。

## Grid vs Flexbox：何时使用哪个？

| 场景 | 推荐方案 |
|------|----------|
| 整体页面布局 | Grid |
| 组件内部布局（导航栏、按钮组） | Flexbox |
| 二维复杂布局 | Grid |
| 一维列表排列 | Flexbox |

**最佳实践：两者结合使用。** 页面骨架用 Grid，组件内部用 Flexbox。

## 小结

Grid 不是要取代 Flexbox，两者各有所长。掌握 Grid 后，你会发现之前需要各种 hack 的布局变得轻松优雅。如果你还在用浮动布局，是时候拥抱 Grid 了。
