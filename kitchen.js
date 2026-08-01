const MAX_SLICES = 4;
const CUT_TAPS_REQUIRED = 10;

const state = {
  salmonOnBoard: false,
  cutsMade: 0,
  cutTaps: 0,
  slicesReady: 0,
  riceOnBoard: false,
  finished: false,
};

const message = document.querySelector('#kitchen-message');
const displaySalmon = document.querySelector('#display-salmon');
const riceBin = document.querySelector('#rice-bin');
const boardSalmon = document.querySelector('#board-salmon');
const ricePortion = document.querySelector('#rice-portion');
const sliceRack = document.querySelector('#slice-rack');
const finishedSushi = document.querySelector('#finished-sushi');
const serveButton = document.querySelector('#serve-button');
const cutProgress = document.querySelector('#cut-progress');

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
  state.slicesReady -= 1;
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
  show(displaySalmon, true);
  show(boardSalmon, state.salmonOnBoard);
  show(ricePortion, state.riceOnBoard && !state.finished);
  show(finishedSushi, state.finished);
  boardSalmon.dataset.taps = String(state.cutTaps);
  show(cutProgress, state.salmonOnBoard);
  cutProgress.style.setProperty('--cut-progress', `${(state.cutTaps / CUT_TAPS_REQUIRED) * 100}%`);
  cutProgress.setAttribute('aria-valuenow', String(state.cutTaps));
  serveButton.disabled = !state.finished;
  renderSlices();
}

displaySalmon.addEventListener('click', () => {
  if (state.salmonOnBoard) {
    setMessage('切菜板上还有大三文鱼，先把它切完再拿新的。');
    return;
  }
  state.salmonOnBoard = true;
  state.cutsMade = 0;
  state.cutTaps = 0;
  setMessage('大三文鱼已放到切菜板。连续点击它 10 下即可切好 4 片。');
  render();
});

function cutSalmon() {
  state.cutTaps += 1;
  if (state.cutTaps < CUT_TAPS_REQUIRED) {
    setMessage(`继续点击三文鱼：${state.cutTaps} / ${CUT_TAPS_REQUIRED}。`);
    render();
    return;
  }
  state.cutsMade = MAX_SLICES;
  state.slicesReady = Math.min(MAX_SLICES, state.slicesReady + MAX_SLICES);
  state.salmonOnBoard = false;
  setMessage('切好了！一大片三文鱼已经变成 4 片。');
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
    setMessage('先点击大三文鱼，把它切成鱼片。');
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

document.querySelector('#drink-machine').addEventListener('click', () => {
  setMessage('饮品机之后会用于制作饮料。');
});

document.querySelector('#cup-station').addEventListener('click', () => {
  setMessage('杯子区之后会用于出饮料。');
});

document.querySelector('#reset-button').addEventListener('click', () => {
  Object.assign(state, { salmonOnBoard: false, cutsMade: 0, cutTaps: 0, slicesReady: 0, riceOnBoard: false, finished: false });
  setMessage('重新开始：点击鱼柜第一格的大三文鱼。');
  render();
});

serveButton.addEventListener('click', () => {
  state.finished = false;
  setMessage(state.salmonOnBoard ? '寿司已放到出餐台。大三文鱼还能继续切。' : '寿司已放到出餐台。');
  render();
});

render();
