const MAX_SLICES = 4;
const CUT_LINES = [0.3, 0.5, 0.7];
const CUT_START_TOLERANCE = 0.18;
const CUT_SWIPE_DISTANCE = 0.12;
const SLICE_CROP_POSITIONS = ['12% 48%', '37% 51%', '61% 46%', '84% 50%'];
const CUT_SLICE_ORIGINS = [[0.15], [0.4], [0.6, 0.85]];

const state = {
  salmonOnBoard: false,
  cutLines: [false, false, false],
  activeCut: null,
  cutStartY: 0,
  slicesReady: 0,
  incomingSlices: 0,
  flightVersion: 0,
  riceOnBoard: false,
  finished: false,
};

const stage = document.querySelector('#kitchen-stage');
const message = document.querySelector('#kitchen-message');
const displaySalmon = document.querySelector('#display-salmon');
const riceBin = document.querySelector('#rice-bin');
const boardSalmon = document.querySelector('#board-salmon');
const ricePortion = document.querySelector('#rice-portion');
const sliceRack = document.querySelector('#slice-rack');
const finishedSushi = document.querySelector('#finished-sushi');
const serveButton = document.querySelector('#serve-button');

stage.addEventListener('dragstart', (event) => event.preventDefault());

function show(element, visible) {
  element.classList.toggle('is-hidden', !visible);
}

function setMessage(text) {
  message.textContent = text;
}

function finishSushi() {
  if (state.incomingSlices) {
    setMessage('等鱼片滑到旁边再制作寿司。');
    return;
  }
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
  const displayedSlices = state.slicesReady - state.incomingSlices;
  for (let index = 0; index < displayedSlices; index += 1) {
    const slice = document.createElement('button');
    slice.type = 'button';
    slice.className = 'salmon-slice-crop';
    slice.style.backgroundPosition = SLICE_CROP_POSITIONS[index % SLICE_CROP_POSITIONS.length];
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
  const completedCuts = state.cutLines.filter(Boolean).length;
  const croppedLeft = completedCuts ? CUT_LINES[completedCuts - 1] : 0;
  boardSalmon.style.clipPath = state.salmonOnBoard ? `inset(0 0 0 ${croppedLeft * 100}%)` : '';
  boardSalmon.querySelectorAll('.cut-guide').forEach((guide, index) => {
    guide.classList.toggle('is-cut', state.cutLines[index]);
    guide.classList.toggle('is-active', state.activeCut === index);
  });
  serveButton.disabled = !state.finished;
  renderSlices();
}

displaySalmon.addEventListener('click', () => {
  if (state.incomingSlices) {
    setMessage('等切好的鱼片放好后，再拿新的大三文鱼。');
    return;
  }
  if (state.salmonOnBoard) {
    setMessage('切菜板上还有大三文鱼，先把它切完再拿新的。');
    return;
  }
  state.salmonOnBoard = true;
  state.cutLines = [false, false, false];
  state.activeCut = null;
  setMessage('大三文鱼已放到切菜板。在虚线附近按住，轻轻向下滑动即可切片。');
  render();
});

function pointerPosition(event) {
  const bounds = boardSalmon.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) / bounds.width,
    y: (event.clientY - bounds.top) / bounds.height,
  };
}

function findCutLine(x, tolerance = 0.09) {
  const nextCut = state.cutLines.findIndex((cut) => !cut);
  return nextCut !== -1 && Math.abs(x - CUT_LINES[nextCut]) < tolerance ? nextCut : -1;
}

function hasRoomForCut(index) {
  return MAX_SLICES - state.slicesReady >= CUT_SLICE_ORIGINS[index].length;
}

function flySlice(sourceRect, rackRect, sourceFraction, sliceIndex, flightVersion) {
  const stageRect = stage.getBoundingClientRect();
  const flyingSlice = document.createElement('div');
  const fromX = sourceRect.left + (sourceRect.width * sourceFraction) - stageRect.left;
  const fromY = sourceRect.top + (sourceRect.height * 0.54) - stageRect.top;
  const toX = rackRect.left + (rackRect.width * (0.125 + (sliceIndex * 0.25))) - stageRect.left;
  const toY = rackRect.top + (rackRect.height * 0.52) - stageRect.top;

  flyingSlice.className = 'flying-salmon-slice';
  flyingSlice.style.left = `${fromX}px`;
  flyingSlice.style.top = `${fromY}px`;
  flyingSlice.style.width = `${sourceRect.width * 0.2}px`;
  flyingSlice.style.height = `${sourceRect.height * 0.62}px`;
  flyingSlice.style.backgroundPosition = SLICE_CROP_POSITIONS[sliceIndex % SLICE_CROP_POSITIONS.length];
  stage.append(flyingSlice);

  requestAnimationFrame(() => {
    flyingSlice.style.left = `${toX}px`;
    flyingSlice.style.top = `${toY}px`;
    flyingSlice.classList.add('is-flying');
  });

  window.setTimeout(() => {
    flyingSlice.remove();
    if (flightVersion !== state.flightVersion) return;
    state.incomingSlices = Math.max(0, state.incomingSlices - 1);
    render();
  }, 650 + (sliceIndex * 75));
}

function finishCutLine(index) {
  const sourceRect = boardSalmon.getBoundingClientRect();
  const rackRect = sliceRack.getBoundingClientRect();
  const sliceOrigins = CUT_SLICE_ORIGINS[index];
  const firstSliceIndex = state.slicesReady;
  const flightVersion = state.flightVersion;

  state.cutLines[index] = true;
  state.slicesReady = Math.min(MAX_SLICES, state.slicesReady + sliceOrigins.length);
  state.incomingSlices += sliceOrigins.length;
  const completed = state.cutLines.filter(Boolean).length;
  state.salmonOnBoard = completed < CUT_LINES.length;
  setMessage(completed < CUT_LINES.length ? '切好一片，继续切下一条虚线。' : '最后两片切好了！');
  render();
  sliceOrigins.forEach((origin, offset) => {
    flySlice(sourceRect, rackRect, origin, firstSliceIndex + offset, flightVersion);
  });
}

boardSalmon.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  const point = pointerPosition(event);
  const cutLine = findCutLine(point.x, CUT_START_TOLERANCE);
  if (cutLine === -1) {
    setMessage('在下一条虚线附近按住，再向下滑动一点。');
    return;
  }
  if (!hasRoomForCut(cutLine)) {
    setMessage('鱼片架空间不够，先做几份寿司再继续切。');
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
  const followsGuide = Math.abs(point.x - CUT_LINES[state.activeCut]) < 0.28;
  if (followsGuide && point.y - state.cutStartY >= CUT_SWIPE_DISTANCE) {
    const cutLine = state.activeCut;
    state.activeCut = null;
    if (boardSalmon.hasPointerCapture(event.pointerId)) boardSalmon.releasePointerCapture(event.pointerId);
    finishCutLine(cutLine);
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
  if (cutLine !== -1 && hasRoomForCut(cutLine)) finishCutLine(cutLine);
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
  if (state.incomingSlices) {
    setMessage('等鱼片滑到旁边再取米饭。');
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
  state.flightVersion += 1;
  document.querySelectorAll('.flying-salmon-slice').forEach((slice) => slice.remove());
  Object.assign(state, { salmonOnBoard: false, cutLines: [false, false, false], activeCut: null, cutStartY: 0, slicesReady: 0, incomingSlices: 0, riceOnBoard: false, finished: false });
  setMessage('重新开始：点击鱼柜第一格的大三文鱼。');
  render();
});

serveButton.addEventListener('click', () => {
  state.finished = false;
  setMessage(state.salmonOnBoard ? '寿司已放到出餐台。大三文鱼还能继续切。' : '寿司已放到出餐台。');
  render();
});

render();
