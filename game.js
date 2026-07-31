const buttons = {
  left: document.querySelector('#move-left'),
  right: document.querySelector('#move-right'),
};
const sushi = [...document.querySelectorAll('.sushi')];
const message = document.querySelector('#belt-message');

const positions = [27, 50, 73];
let order = [0, 1, 2];

function renderBelt() {
  order.forEach((sushiIndex, slot) => {
    sushi[sushiIndex].style.left = `${positions[slot]}%`;
  });
}

function moveBelt(direction) {
  if (direction === 'left') {
    order.push(order.shift());
    message.textContent = '传送带往左转了一格！';
  } else {
    order.unshift(order.pop());
    message.textContent = '传送带往右转了一格！';
  }
  renderBelt();
}

buttons.left.addEventListener('click', () => moveBelt('left'));
buttons.right.addEventListener('click', () => moveBelt('right'));

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') moveBelt('left');
  if (event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') moveBelt('right');
});

renderBelt();
