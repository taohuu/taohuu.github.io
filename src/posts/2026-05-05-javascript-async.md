---
title: JavaScript 异步编程的进化史
date: 2026-05-05
tags: [技术, JavaScript]
excerpt: 从回调地狱到 Promise，再到 async/await——JavaScript 异步编程范式经历了深刻演变。本文梳理这一进化历程，并给出最佳实践建议。
---

JavaScript 的异步编程经历了从"回调地狱"到优雅的 `async/await` 的漫长进化。理解这段历史有助于我们写出更好的异步代码。

## 第一代：回调函数

最早的异步处理方式——在操作完成后调用一个函数。

```javascript
fs.readFile('/data.json', (err, data) => {
  if (err) {
    console.error('读取失败', err);
    return;
  }
  console.log(JSON.parse(data));
});
```

看起来还行——直到你需要串联多个异步操作：

```javascript
// 回调地狱
fs.readFile('/user.json', (err, user) => {
  fs.readFile(`/posts/${user.id}.json`, (err, posts) => {
    fs.readFile(`/comments/${posts[0].id}.json`, (err, comments) => {
      // 已经三层缩进了，再来几层就没法看了
      console.log(comments);
    });
  });
});
```

问题很明显：**嵌套深、错误处理繁琐、逻辑难以测试。**

## 第二代：Promise

Promise 用一个对象包装异步操作，通过 `.then()` 串联，通过 `.catch()` 处理错误。

```javascript
fetch('/api/user')
  .then(res => res.json())
  .then(user => fetch(`/api/posts?userId=${user.id}`))
  .then(res => res.json())
  .then(posts => console.log(posts))
  .catch(err => console.error('请求失败', err));
```

Promise 带来了三个重要改进：

1. **链式调用**：解决嵌套问题
2. **统一错误处理**：一个 `.catch()` 捕获链上任意位置的错误
3. **可组合性**：`Promise.all`、`Promise.race` 等组合方法

## 第三代：async/await

`async/await` 是 Promise 的语法糖，但极大地提升了代码可读性。

```javascript
async function getUserPosts(userId) {
  try {
    const userRes = await fetch(`/api/users/${userId}`);
    const user = await userRes.json();
    
    const postsRes = await fetch(`/api/posts?userId=${user.id}`);
    const posts = await postsRes.json();
    
    return posts;
  } catch (err) {
    console.error('获取失败', err);
    return [];
  }
}
```

异步代码看起来像同步代码一样直观。

## 最佳实践

### 1. 不要在循环中使用 await（除非需要顺序执行）

```javascript
// 差：串行执行，慢
for (const id of ids) {
  const data = await fetchData(id);
}

// 好：并行执行，快
const results = await Promise.all(ids.map(id => fetchData(id)));
```

### 2. 不要混用 then 和 await

选择一种风格并保持一致。

### 3. 始终处理错误

```javascript
// 优雅的错误处理
const [err, data] = await fetchData().then(
  data => [null, data],
  err => [err, null]
);
```

## 未来：Observables 和 Streams？

对于多次触发的异步事件（如 WebSocket 消息），Promise 的一次性特性不够用。RxJS 的 Observable 和 Web Streams API 正在填补这个空白。

但对大多数场景来说，**`async/await` 已经是完美的解决方案。**
