let bannerIndex = 0;
let bannerImgs = document.querySelectorAll('.banner img');
let slides = document.querySelectorAll('.banner .banner-title');
let currentSlide = 0;

function showSlide(n) {
  slides[currentSlide].classList.remove('active');
  slides[n].classList.add('active');
  currentSlide = n;
}

setInterval(() => {
  let nextSlide = (currentSlide + 1) % slides.length;
  showSlide(nextSlide);
}, 3000);

setInterval(() => {
  bannerImgs[bannerIndex].classList.remove('active');
  bannerIndex = (bannerIndex + 1) % bannerImgs.length;
  bannerImgs[bannerIndex].classList.add('active');
}, 3000);

// 影片海报鼠标事件
let moviePosters = document.querySelectorAll('.movie-poster');

moviePosters.forEach((poster) => {
  let movieInfo = poster.querySelector('.movie-info');
  poster.addEventListener('mouseenter', () => {
    movieInfo.style.bottom = '0';
  });
  poster.addEventListener('mouseleave', () => {
    movieInfo.style.bottom = '-100%';
  });
});

// 回到首页按钮
let backToTop = document.querySelector('.back-to-top');

window.addEventListener('scroll', () => {
  if (window.pageYOffset > document.documentElement.clientHeight * 0.5) {
    backToTop.classList.add('active');
    backToTop.style.zIndex = '1';
  } else {
    backToTop.classList.remove('active');
    backToTop.style.zIndex = '-1';
  }
});

backToTop.addEventListener('click', () => {
  window.scrollTo(0, 0);
});