const MAX_SLICES = 12;
const MAX_RICE = 8;
const MAX_SUSHI = 8;
const SLICE_COLUMNS = 6;
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
  riceStored: 0,
  sushiStored: 0,
};

const stage = document.querySelector('#kitchen-stage');
const message = document.querySelector('#kitchen-message');
const displaySalmon = document.querySelector('#display-salmon');
const riceBin = document.querySelector('#rice-bin');
const boardStation = document.querySelector('.board-station');
const assemblyStation = document.querySelector('.assembly-station');
const boardSalmon = document.querySelector('#board-salmon');
const sliceRack = document.querySelector('#slice-rack');
const riceRack = document.querySelector('#rice-rack');
const sushiRack = document.querySelector('#sushi-rack');
const serveButton = document.querySelector('#serve-button');
let ingredientDrag = null;

stage.addEventListener('dragstart', (event) => event.preventDefault());

function show(element, visible) {
  element.classList.toggle('is-hidden', !visible);
}

function setMessage(text) {
  message.textContent = text;
}

function makeSushi() {
  if (state.incomingSlices) {
    setMessage('等鱼片滑到旁边再制作寿司。');
    return;
  }
  if (!state.riceStored) {
    setMessage('先拖一团米饭到米饭架。');
    return;
  }
  if (state.sushiStored >= MAX_SUSHI) {
    setMessage('寿司架满了，先出餐再继续制作。');
    return;
  }
  state.slicesReady -= 1;
  state.riceStored -= 1;
  state.sushiStored += 1;
  setMessage('三文鱼握寿司做好了，已放进寿司架。');
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
    slice.addEventListener('click', makeSushi);
    sliceRack.append(slice);
  }
}

function renderStockRack(rack, count, className, src, alt) {
  rack.replaceChildren();
  for (let index = 0; index < count; index += 1) {
    const item = document.createElement('img');
    item.className = className;
    item.src = src;
    item.alt = alt;
    item.draggable = false;
    rack.append(item);
  }
}

function render() {
  show(displaySalmon, true);
  show(boardSalmon, state.salmonOnBoard);
  boardSalmon.classList.toggle('is-cutting', state.activeCut !== null);
  const completedCuts = state.cutLines.filter(Boolean).length;
  const croppedLeft = completedCuts ? CUT_LINES[completedCuts - 1] : 0;
  boardSalmon.style.clipPath = state.salmonOnBoard ? `inset(0 0 0 ${croppedLeft * 100}%)` : '';
  boardSalmon.querySelectorAll('.cut-guide').forEach((guide, index) => {
    guide.classList.toggle('is-cut', state.cutLines[index]);
    guide.classList.toggle('is-active', state.activeCut === index);
  });
  serveButton.disabled = !state.sushiStored;
  renderSlices();
  renderStockRack(riceRack, state.riceStored, 'stored-rice', 'assets/restaurant/kitchen-layers/rice-portion.png', '一团米饭');
  renderStockRack(sushiRack, state.sushiStored, 'stored-sushi', 'assets/restaurant/kitchen-layers/salmon-nigiri.png', '三文鱼握寿司');
}

function pointIsInside(event, element) {
  const bounds = element.getBoundingClientRect();
  return event.clientX >= bounds.left && event.clientX <= bounds.right
    && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
}

function moveDragPreview(event) {
  if (!ingredientDrag) return;
  const bounds = stage.getBoundingClientRect();
  ingredientDrag.preview.style.left = `${event.clientX - bounds.left}px`;
  ingredientDrag.preview.style.top = `${event.clientY - bounds.top}px`;
}

function clearIngredientDrag() {
  if (!ingredientDrag) return;
  ingredientDrag.preview.remove();
  boardStation.classList.remove('is-drop-target');
  assemblyStation.classList.remove('is-drop-target');
  ingredientDrag = null;
}

function startIngredientDrag(event, type) {
  const source = event.currentTarget;
  event.preventDefault();
  if (ingredientDrag) return;

  const preview = document.createElement('img');
  preview.className = `ingredient-drag-preview ${type}`;
  preview.src = type === 'salmon'
    ? 'assets/restaurant/kitchen-layers/salmon-loin.png'
    : 'assets/restaurant/kitchen-layers/rice-portion.png';
  preview.alt = '';
  preview.draggable = false;
  stage.append(preview);
  ingredientDrag = { type, source, pointerId: event.pointerId, preview };
  source.setPointerCapture(event.pointerId);
  (type === 'salmon' ? boardStation : assemblyStation).classList.add('is-drop-target');
  moveDragPreview(event);
  setMessage(type === 'salmon' ? '把大三文鱼拖到切菜板。' : '把米饭拖到寿司制作区。');
}

function prepareSalmonDrag(event) {
  if (state.incomingSlices) {
    setMessage('等切好的鱼片放好后，再拿新的大三文鱼。');
    return;
  }
  if (state.salmonOnBoard) {
    setMessage('切菜板上还有大三文鱼，先把它切完再拿新的。');
    return;
  }
  startIngredientDrag(event, 'salmon');
}

function prepareRiceDrag(event) {
  if (state.riceStored >= MAX_RICE) {
    setMessage('米饭架已经存满 8 团。');
    return;
  }
  startIngredientDrag(event, 'rice');
}

displaySalmon.addEventListener('pointerdown', prepareSalmonDrag);
riceBin.addEventListener('pointerdown', prepareRiceDrag);

window.addEventListener('pointermove', (event) => moveDragPreview(event));
window.addEventListener('pointercancel', () => clearIngredientDrag());
window.addEventListener('pointerup', (event) => {
  if (!ingredientDrag || event.pointerId !== ingredientDrag.pointerId) return;
  const { type, source } = ingredientDrag;
  const destination = type === 'salmon' ? boardStation : assemblyStation;
  const accepted = pointIsInside(event, destination);
  if (source.hasPointerCapture(event.pointerId)) source.releasePointerCapture(event.pointerId);
  clearIngredientDrag();

  if (!accepted) {
    setMessage(type === 'salmon' ? '把大三文鱼拖到切菜板里。' : '把米饭拖到寿司制作区里。');
    return;
  }

  if (type === 'salmon') {
    state.salmonOnBoard = true;
    state.cutLines = [false, false, false];
    state.activeCut = null;
    setMessage('大三文鱼已放到切菜板。在虚线附近按住，轻轻向下滑动即可切片。');
  } else {
    state.riceStored += 1;
    setMessage('米饭已放进米饭架。点击一片三文鱼制作寿司。');
  }
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
  const column = sliceIndex % SLICE_COLUMNS;
  const row = Math.floor(sliceIndex / SLICE_COLUMNS);
  const toX = rackRect.left + (rackRect.width * ((column + 0.5) / SLICE_COLUMNS)) - stageRect.left;
  const toY = rackRect.top + (rackRect.height * ((row + 0.5) / 2)) - stageRect.top;

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

document.querySelector('#drink-machine').addEventListener('click', () => {
  setMessage('饮品机之后会用于制作饮料。');
});

document.querySelector('#cup-station').addEventListener('click', () => {
  setMessage('杯子区之后会用于出饮料。');
});

document.querySelector('#reset-button').addEventListener('click', () => {
  state.flightVersion += 1;
  document.querySelectorAll('.flying-salmon-slice').forEach((slice) => slice.remove());
  Object.assign(state, { salmonOnBoard: false, cutLines: [false, false, false], activeCut: null, cutStartY: 0, slicesReady: 0, incomingSlices: 0, riceStored: 0, sushiStored: 0 });
  setMessage('重新开始：点击鱼柜第一格的大三文鱼。');
  render();
});

serveButton.addEventListener('click', () => {
  state.sushiStored -= 1;
  setMessage(state.sushiStored ? '已出餐一份寿司。' : '已出餐，寿司架空了。');
  render();
});

render();
