const fullscreenBtn = document.querySelector('.fullscreen-btn');
const shareBtn = document.querySelector('.share-btn');

fullscreenBtn.addEventListener('click', () => {
  const videoIframe = document.querySelector('.video-iframe');
  videoIframe.requestFullscreen();
});

shareBtn.addEventListener('click', () => {
  const url = window.location.href;
  navigator.clipboard.writeText(url)
    .then(() => {
      const shareBtn = document.querySelector('.share-btn');
      shareBtn.insertAdjacentHTML('afterend', '<div class="copy-msg">复制成功</div>');
      setTimeout(() => {
        const copyMsg = document.querySelector('.copy-msg');
        copyMsg.remove();
      }, 2000);
    })
    .catch((err) => {
      console.log('复制失败', err);
    });
});