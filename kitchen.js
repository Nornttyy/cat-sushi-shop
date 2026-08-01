const state = {
  tool: null,
  salmonOnBoard: false,
  salmonCut: false,
  riceTaken: false,
  finished: false,
};

const message = document.querySelector('#kitchen-message');
const fishWell = document.querySelector('#fish-well');
const displaySalmon = document.querySelector('.display-salmon');
const knife = document.querySelector('#knife');
const riceBin = document.querySelector('#rice-bin');
const boardSalmon = document.querySelector('#board-salmon');
const salmonSlice = document.querySelector('#salmon-slice');
const riceBall = document.querySelector('#rice-ball');
const finishedSushi = document.querySelector('#finished-sushi');
const serveButton = document.querySelector('#serve-button');

function show(element, visible) {
  element.classList.toggle('is-hidden', !visible);
}

function render() {
  show(displaySalmon, !state.salmonOnBoard && !state.salmonCut && !state.finished);
  show(boardSalmon, state.salmonOnBoard);
  show(salmonSlice, state.salmonCut && !state.finished);
  show(riceBall, state.riceTaken && !state.finished);
  show(finishedSushi, state.finished);
  knife.classList.toggle('is-selected', state.tool === 'knife');
  serveButton.disabled = !state.finished;
}

function setMessage(text) {
  message.textContent = text;
}

fishWell.addEventListener('click', () => {
  if (state.salmonOnBoard || state.salmonCut || state.finished) {
    setMessage('三文鱼已经在切菜板上了。');
    return;
  }
  state.salmonOnBoard = true;
  setMessage('把刀拿起来，再点击切菜板上的三文鱼切片。');
  render();
});

knife.addEventListener('click', () => {
  state.tool = state.tool === 'knife' ? null : 'knife';
  setMessage(state.tool ? '刀已拿起：点击切菜板上的三文鱼。' : '刀已放下。');
  render();
});

boardSalmon.addEventListener('click', () => {
  if (state.tool !== 'knife') {
    setMessage('先点击刀，再切三文鱼。');
    return;
  }
  state.salmonOnBoard = false;
  state.salmonCut = true;
  state.tool = null;
  setMessage('三文鱼切好了。现在从饭盒取一团米饭。');
  render();
});

riceBin.addEventListener('click', () => {
  if (!state.salmonCut) {
    setMessage('先把三文鱼切成片。');
    return;
  }
  if (state.riceTaken) {
    setMessage('米饭已经放到切菜板上了。');
    return;
  }
  state.riceTaken = true;
  setMessage('把切好的三文鱼放到米饭上。');
  render();
});

salmonSlice.addEventListener('click', () => {
  if (!state.riceTaken) {
    setMessage('先从饭盒取米饭。');
    return;
  }
  state.finished = true;
  setMessage('三文鱼握寿司完成了！');
  render();
});

document.querySelector('#juicer').addEventListener('click', () => {
  setMessage('果汁机之后会用于制作饮料。');
});

document.querySelector('#cup-station').addEventListener('click', () => {
  setMessage('杯子区之后会用于出饮料。');
});

document.querySelector('#reset-button').addEventListener('click', () => {
  Object.assign(state, { tool: null, salmonOnBoard: false, salmonCut: false, riceTaken: false, finished: false });
  setMessage('重新开始：先从玻璃鱼柜取三文鱼。');
  render();
});

serveButton.addEventListener('click', () => {
  setMessage('寿司已放到出餐台。下一步再加入订单与顾客。');
  serveButton.disabled = true;
});

render();
