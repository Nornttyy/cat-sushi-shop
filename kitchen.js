const MAX_SLICES = 4;
const CUT_LINES = [0.3, 0.5, 0.7];
const CUT_START_ZONE = 0.2;
const CUT_DISTANCE_REQUIRED = 0.45;

const state = {
  salmonOnBoard: false,
  cutLines: [false, false, false],
  activeCut: null,
  cutStartY: 0,
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
  boardSalmon.classList.toggle('is-cutting', state.activeCut !== null);
  boardSalmon.querySelectorAll('.cut-guide').forEach((guide, index) => {
    guide.classList.toggle('is-cut', state.cutLines[index]);
    guide.classList.toggle('is-active', state.activeCut === index);
  });
  serveButton.disabled = !state.finished;
  renderSlices();
}

displaySalmon.addEventListener('click', () => {
  if (state.salmonOnBoard) {
    setMessage('切菜板上还有大三文鱼，先把它切完再拿新的。');
    return;
  }
  state.salmonOnBoard = true;
  state.cutLines = [false, false, false];
  state.activeCut = null;
  setMessage('大三文鱼已放到切菜板。按住一条虚线，从上往下划过去。');
  render();
});

function pointerPosition(event) {
  const bounds = boardSalmon.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) / bounds.width,
    y: (event.clientY - bounds.top) / bounds.height,
  };
}

function findCutLine(x) {
  let closest = -1;
  let closestDistance = 0.09;
  CUT_LINES.forEach((line, index) => {
    const distance = Math.abs(x - line);
    if (!state.cutLines[index] && distance < closestDistance) {
      closest = index;
      closestDistance = distance;
    }
  });
  return closest;
}

function finishCutLine(index) {
  state.cutLines[index] = true;
  state.activeCut = null;
  const completed = state.cutLines.filter(Boolean).length;
  if (completed < CUT_LINES.length) {
    setMessage(`切好一刀，还剩 ${CUT_LINES.length - completed} 条虚线。`);
    render();
    return;
  }
  state.slicesReady = Math.min(MAX_SLICES, state.slicesReady + MAX_SLICES);
  state.salmonOnBoard = false;
  setMessage('切好了！一大片三文鱼已经变成 4 片。');
  render();
}

boardSalmon.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  const point = pointerPosition(event);
  const cutLine = findCutLine(point.x);
  if (cutLine === -1 || point.y > CUT_START_ZONE) {
    setMessage('从虚线顶端按住，再往下划动。');
    return;
  }
  state.activeCut = cutLine;
  state.cutStartY = point.y;
  boardSalmon.setPointerCapture(event.pointerId);
  render();
});

boardSalmon.addEventListener('pointermove', (event) => {
  if (state.activeCut === null) return;
  const point = pointerPosition(event);
  const isNearLine = Math.abs(point.x - CUT_LINES[state.activeCut]) < 0.14;
  if (isNearLine && point.y - state.cutStartY >= CUT_DISTANCE_REQUIRED) {
    finishCutLine(state.activeCut);
  }
});

function cancelCut(event) {
  if (state.activeCut === null) return;
  state.activeCut = null;
  if (boardSalmon.hasPointerCapture(event.pointerId)) boardSalmon.releasePointerCapture(event.pointerId);
  render();
}

boardSalmon.addEventListener('pointerup', cancelCut);
boardSalmon.addEventListener('pointercancel', cancelCut);

boardSalmon.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  const cutLine = state.cutLines.findIndex((cut) => !cut);
  if (cutLine !== -1) finishCutLine(cutLine);
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
  Object.assign(state, { salmonOnBoard: false, cutLines: [false, false, false], activeCut: null, cutStartY: 0, slicesReady: 0, riceOnBoard: false, finished: false });
  setMessage('重新开始：点击鱼柜第一格的大三文鱼。');
  render();
});

serveButton.addEventListener('click', () => {
  state.finished = false;
  setMessage(state.salmonOnBoard ? '寿司已放到出餐台。大三文鱼还能继续切。' : '寿司已放到出餐台。');
  render();
});

render();
