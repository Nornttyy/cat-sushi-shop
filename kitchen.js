const message = document.querySelector('#kitchen-message');

document.querySelector('#return-button').addEventListener('click', () => {
  window.location.href = 'index.html';
});

document.querySelector('#make-button').addEventListener('click', () => {
  message.textContent = '下一步会把食材盘做成可点击的制作玩法。';
});
