const message = document.querySelector('#restaurant-message');

document.querySelector('#orders-button').addEventListener('click', () => {
  message.textContent = '今天的客人已经在等寿司了。';
});

document.querySelector('#menu-button').addEventListener('click', () => {
  message.textContent = '菜单和后台制作会在下一步加入。';
});
