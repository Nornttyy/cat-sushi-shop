const message = document.querySelector('#restaurant-message');

document.querySelector('#backstage-button').addEventListener('click', () => {
  window.location.href = 'kitchen.html';
});

document.querySelector('#close-button').addEventListener('click', () => {
  message.textContent = '今天先不打烊，去后台准备寿司吧。';
});
