const MAX_SLICES = 4;

const state = {
  salmonOnBoard: false,
  knifeHeld: false,
  cutsMade: 0,
  slicesReady: 0,
  riceOnBoard: false,
  finished: false,
};

const stage = document.querySelector('#kitchen-stage');
const message = document.querySelector('#kitchen-message');
const displaySalmon = document.querySelector('#display-salmon');
const knife = document.querySelector('#knife');
const heldKnife = document.querySelector('#held-knife');
const riceBin = document.querySelector('#rice-bin');
const boardSalmon = document.querySelector('#board-salmon');
const ricePortion = document.querySelector('#rice-portion');
const sliceRack = document.querySelector('#slice-rack');
const finishedSushi = document.querySelector('#finished-sushi');
const serveButton = document.querySelector('#serve-button');

function show(element, visible) {
  element.classList.toggle('is-hidden', !visible);
}

function setMessage(text) {
  message.textContent = text;
}

function finishSushi() {
  if (!state.riceOnBoard) {
    setMessage('先从饭盒取一团米饭。');
    return;
  }
  state.riceOnBoard = false;
  state.finished = true;
  setMessage('三文鱼握寿司完成了！这是一张单独绘制的成品图。');
  render();
}

function renderSlices() {
  sliceRack.replaceChildren();
  const cropPositions = ['12% 48%', '37% 51%', '61% 46%', '84% 50%'];
  for (let index = 0; index < state.slicesReady; index += 1) {
    const slice = document.createElement('button');
    slice.type = 'button';
    slice.className = 'salmon-slice-crop';
    slice.style.backgroundPosition = cropPositions[index % cropPositions.length];
    slice.setAttribute('aria-label', `第 ${index + 1} 片三文鱼，点击放到米饭上`);
    slice.addEventListener('click', finishSushi);
    sliceRack.append(slice);
  }
}

function render() {
  const salmonStillInDisplay = !state.salmonOnBoard && state.cutsMade === 0;
  show(displaySalmon, salmonStillInDisplay);
  show(boardSalmon, state.salmonOnBoard);
  show(ricePortion, state.riceOnBoard && !state.finished);
  show(finishedSushi, state.finished);
  show(heldKnife, state.knifeHeld);
  knife.classList.toggle('is-held', state.knifeHeld);
  stage.classList.toggle('has-knife', state.knifeHeld);
  boardSalmon.dataset.cuts = String(state.cutsMade);
  serveButton.disabled = !state.finished;
  renderSlices();
}

displaySalmon.addEventListener('click', () => {
  if (state.salmonOnBoard || state.cutsMade > 0) return;
  state.salmonOnBoard = true;
  setMessage('大三文鱼已放到切菜板。点击刀，把它拿起来。');
  render();
});

function moveHeldKnife(clientX, clientY) {
  const bounds = stage.getBoundingClientRect();
  heldKnife.style.left = `${((clientX - bounds.left) / bounds.width) * 100}%`;
  heldKnife.style.top = `${((clientY - bounds.top) / bounds.height) * 100}%`;
}

knife.addEventListener('click', (event) => {
  state.knifeHeld = !state.knifeHeld;
  if (state.knifeHeld) moveHeldKnife(event.clientX, event.clientY);
  setMessage(state.knifeHeld ? '刀已拿起，移动到大三文鱼上再点击切下第一片。' : '刀已放下。');
  render();
});

function cutSalmon() {
  if (!state.knifeHeld) {
    setMessage('先点击刀，把它拿起来。');
    return;
  }
  if (state.cutsMade >= MAX_SLICES) return;
  state.cutsMade += 1;
  state.slicesReady += 1;
  state.knifeHeld = false;
  if (state.cutsMade === MAX_SLICES) state.salmonOnBoard = false;
  setMessage(`切好了第 ${state.cutsMade} / ${MAX_SLICES} 片。${state.cutsMade < MAX_SLICES ? '这块大三文鱼还能继续切。' : '这块大三文鱼已经切完了。'}`);
  render();
}

boardSalmon.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  cutSalmon();
});

boardSalmon.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  cutSalmon();
});

riceBin.addEventListener('click', () => {
  if (state.finished) {
    setMessage('先完成出餐，再做下一份。');
    return;
  }
  if (!state.slicesReady) {
    setMessage('先用刀从大三文鱼切下一片。');
    return;
  }
  if (state.riceOnBoard) {
    setMessage('米饭已经在切菜板上了，点击一片三文鱼。');
    return;
  }
  state.riceOnBoard = true;
  setMessage('米饭放好了。点击裁自大三文鱼的鱼片，完成寿司。');
  render();
});

stage.addEventListener('pointermove', (event) => {
  if (!state.knifeHeld) return;
  moveHeldKnife(event.clientX, event.clientY);
});

document.querySelector('#juicer').addEventListener('click', () => {
  setMessage('果汁机之后会用于制作饮料。');
});

document.querySelector('#cup-station').addEventListener('click', () => {
  setMessage('杯子区之后会用于出饮料。');
});

document.querySelector('#reset-button').addEventListener('click', () => {
  Object.assign(state, { salmonOnBoard: false, knifeHeld: false, cutsMade: 0, slicesReady: 0, riceOnBoard: false, finished: false });
  setMessage('重新开始：点击鱼柜第一格的大三文鱼。');
  render();
});

serveButton.addEventListener('click', () => {
  state.finished = false;
  setMessage(state.cutsMade < MAX_SLICES ? '寿司已放到出餐台。这块三文鱼还能继续切。' : '寿司已放到出餐台。');
  render();
});

render();
