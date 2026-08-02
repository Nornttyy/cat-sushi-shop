const MAX_SLICES = 12;
const MAX_RICE = 8;
const MAX_SUSHI = 8;
const MAX_DRINKS = 6;
const SLICE_COLUMNS = 4;
const SLICE_ROWS = 3;
const KITCHEN_ASSET_PATH = 'assets/restaurant/kitchen-layers/optimized/';
const CUT_LINES = [0.3, 0.5, 0.7];
const CUT_START_TOLERANCE = 0.18;
const CUT_SWIPE_DISTANCE = 0.12;
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
  incomingRice: 0,
  sushiStored: 0,
  incomingSushi: 0,
  cupOnMachine: false,
  drinkPouring: false,
  drinksStored: 0,
  incomingDrinks: 0,
  drinkVersion: 0,
  sashimiPickerOpen: false,
  salmonSelected: false,
  shopOpen: true,
};

const stage = document.querySelector('#kitchen-stage');
const message = document.querySelector('#kitchen-message');
const sceneBackground = document.querySelector('#scene-background');
const stageName = document.querySelector('#stage-name');
const freezerButton = document.querySelector('#freezer-button');
const displaySalmon = document.querySelector('#display-salmon');
const sashimiPicker = document.querySelector('#sashimi-picker');
const selectSalmon = document.querySelector('#select-salmon');
const riceBin = document.querySelector('#rice-bin');
const boardStation = document.querySelector('.board-station');
const assemblyStation = document.querySelector('.assembly-station');
const boardSalmon = document.querySelector('#board-salmon');
const sliceRack = document.querySelector('#slice-rack');
const riceRack = document.querySelector('#rice-rack');
const sushiRack = document.querySelector('#sushi-rack');
const serveButton = document.querySelector('#serve-button');
const openShopButton = document.querySelector('#open-shop-button');
const shopStatus = document.querySelector('#shop-status');
const shopStatusDetail = document.querySelector('#shop-status-detail');
const drinkMachine = document.querySelector('#drink-machine');
const cupStation = document.querySelector('#cup-station');
const machineCup = document.querySelector('#machine-cup');
const drinkRack = document.querySelector('#drink-rack');
let ingredientDrag = null;

stage.addEventListener('dragstart', (event) => event.preventDefault());

function show(element, visible) {
  element.classList.toggle('is-hidden', !visible);
}

function setMessage(text) {
  message.textContent = text;
}

function makeSushi(sourceElement) {
  if (state.incomingSlices) {
    setMessage('等鱼片滑到旁边再制作寿司。');
    return;
  }
  if (state.incomingRice) {
    setMessage('等米饭滑进米饭架再制作寿司。');
    return;
  }
  if (!state.riceStored) {
    setMessage('先点击饭盒拿一团米饭。');
    return;
  }
  if (state.sushiStored >= MAX_SUSHI) {
    setMessage('寿司架满了，先出餐再继续制作。');
    return;
  }
  state.slicesReady -= 1;
  state.riceStored -= 1;
  state.sushiStored += 1;
  state.incomingSushi += 1;
  const sourceRect = sourceElement?.getBoundingClientRect() ?? assemblyStation.getBoundingClientRect();
  const targetRect = sushiRack.getBoundingClientRect();
  const targetIndex = state.sushiStored - 1;
  setMessage('三文鱼握寿司做好了，已放进寿司架。');
  render();
  flyCompletedItem({
    className: 'sushi',
    src: `${KITCHEN_ASSET_PATH}salmon-nigiri.png`,
    sourceRect,
    targetRect,
    targetIndex,
    columns: 2,
    rows: 4,
    gap: 0.04,
    displayScale: 1.12,
    onFinish: () => {
      state.incomingSushi = Math.max(0, state.incomingSushi - 1);
      render();
    },
  });
}

function renderSlices() {
  sliceRack.replaceChildren();
  const displayedSlices = state.slicesReady - state.incomingSlices;
  for (let index = 0; index < displayedSlices; index += 1) {
    const slice = document.createElement('button');
    const sliceImage = document.createElement('img');
    slice.type = 'button';
    slice.className = 'salmon-slice-crop';
    slice.setAttribute('aria-label', `第 ${index + 1} 片三文鱼，拖到米饭上制作寿司`);
    sliceImage.src = `${KITCHEN_ASSET_PATH}salmon-slice.png`;
    sliceImage.alt = '';
    sliceImage.draggable = false;
    slice.addEventListener('pointerdown', prepareSliceDrag);
    slice.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      makeSushi(slice);
    });
    slice.append(sliceImage);
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

function renderDrinks() {
  drinkRack.replaceChildren();
  const displayedDrinks = state.drinksStored - state.incomingDrinks;
  for (let index = 0; index < displayedDrinks; index += 1) {
    const drink = document.createElement('img');
    drink.className = 'stored-drink';
    drink.src = `${KITCHEN_ASSET_PATH}tea-cup-ready.png`;
    drink.alt = '一杯橙味饮料';
    drink.draggable = false;
    drinkRack.append(drink);
  }
}

function render() {
  sceneBackground.src = `${KITCHEN_ASSET_PATH}kitchen-background.jpg`;
  sceneBackground.alt = '海边寿司店后台';
  stageName.textContent = state.shopOpen ? '营业制作台' : '寿司制作台';
  show(displaySalmon, true);
  displaySalmon.classList.toggle('is-ready', state.salmonSelected);
  freezerButton.classList.toggle('is-active', state.sashimiPickerOpen);
  show(sashimiPicker, state.sashimiPickerOpen);
  show(boardSalmon, state.salmonOnBoard);
  boardSalmon.classList.toggle('is-cutting', state.activeCut !== null);
  const completedCuts = state.cutLines.filter(Boolean).length;
  const croppedLeft = completedCuts ? CUT_LINES[completedCuts - 1] : 0;
  boardSalmon.style.clipPath = state.salmonOnBoard ? `inset(0 0 0 ${croppedLeft * 100}%)` : '';
  boardSalmon.querySelectorAll('.cut-guide').forEach((guide, index) => {
    guide.classList.toggle('is-cut', state.cutLines[index]);
    guide.classList.toggle('is-active', state.activeCut === index);
  });
  serveButton.disabled = !state.shopOpen || !state.sushiStored || state.incomingSushi > 0;
  show(openShopButton, !state.shopOpen);
  shopStatus.textContent = state.shopOpen ? '营业中' : '开门前';
  shopStatusDetail.textContent = state.shopOpen ? '三文鱼握寿司' : '自由备料';
  show(machineCup, state.cupOnMachine);
  machineCup.src = state.drinkPouring
    ? `${KITCHEN_ASSET_PATH}tea-cup-ready.png`
    : `${KITCHEN_ASSET_PATH}tea-cup-empty.png`;
  machineCup.classList.toggle('is-filling', state.drinkPouring);
  renderSlices();
  renderStockRack(riceRack, state.riceStored - state.incomingRice, 'stored-rice', `${KITCHEN_ASSET_PATH}rice-portion.png`, '一团米饭');
  renderStockRack(sushiRack, state.sushiStored - state.incomingSushi, 'stored-sushi', `${KITCHEN_ASSET_PATH}salmon-nigiri.png`, '三文鱼握寿司');
  renderDrinks();
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
  ingredientDrag.source.classList.remove('is-dragging');
  ingredientDrag.preview.remove();
  boardStation.classList.remove('is-drop-target');
  assemblyStation.classList.remove('is-drop-target');
  drinkMachine.classList.remove('is-drop-target');
  riceRack.classList.remove('is-drop-target');
  ingredientDrag = null;
}

function startIngredientDrag(event, type) {
  const source = event.currentTarget;
  event.preventDefault();
  if (ingredientDrag) return;

  const preview = document.createElement('img');
  preview.className = `ingredient-drag-preview ${type}`;
  preview.src = type === 'salmon'
    ? `${KITCHEN_ASSET_PATH}salmon-loin.png`
    : type === 'slice'
      ? `${KITCHEN_ASSET_PATH}salmon-slice.png`
      : `${KITCHEN_ASSET_PATH}tea-cup-empty.png`;
  preview.alt = '';
  preview.draggable = false;
  stage.append(preview);
  ingredientDrag = { type, source, pointerId: event.pointerId, preview };
  if (type === 'slice' || type === 'salmon') source.classList.add('is-dragging');
  source.setPointerCapture(event.pointerId);
  (type === 'salmon' ? boardStation : type === 'cup' ? drinkMachine : riceRack).classList.add('is-drop-target');
  moveDragPreview(event);
  setMessage(type === 'salmon' ? '把大三文鱼拖到切菜板。' : type === 'cup' ? '把空杯拖到饮品机。' : '把三文鱼片拖到米饭架。');
}

function canSelectSashimi() {
  if (state.incomingSlices) {
    setMessage('等切好的鱼片放好后，再拿新的大三文鱼。');
    return false;
  }
  if (state.salmonOnBoard) {
    setMessage('切菜板上还有大三文鱼，先把它切完再拿新的。');
    return false;
  }
  return true;
}

function openSashimiPicker() {
  if (!canSelectSashimi()) return;
  state.sashimiPickerOpen = !state.sashimiPickerOpen;
  setMessage(state.sashimiPickerOpen ? '选择一种刺身。' : '已收起刺身选择。');
  render();
}

function chooseSalmon() {
  if (!canSelectSashimi()) return;
  state.sashimiPickerOpen = false;
  state.salmonSelected = true;
  setMessage('已选择三文鱼刺身，拖动它到切菜板。');
  render();
}

function prepareSalmonDrag(event) {
  if (!state.salmonSelected || !canSelectSashimi()) return;
  startIngredientDrag(event, 'salmon');
}

function takeRice() {
  if (state.riceStored >= MAX_RICE) {
    setMessage('米饭架已经存满 8 团。');
    return;
  }
  state.riceStored += 1;
  state.incomingRice += 1;
  const sourceRect = riceBin.getBoundingClientRect();
  const targetRect = riceRack.getBoundingClientRect();
  const targetIndex = state.riceStored - 1;
  setMessage('米饭正在滑进米饭架。');
  render();
  flyCompletedItem({
    className: 'rice',
    src: `${KITCHEN_ASSET_PATH}rice-portion.png`,
    sourceRect,
    targetRect,
    targetIndex,
    columns: 2,
    rows: 4,
    gap: 0.04,
    displayScale: 1.12,
    onFinish: () => {
      state.incomingRice = Math.max(0, state.incomingRice - 1);
      setMessage('米饭已放进米饭架。拖一片三文鱼到米饭架制作寿司。');
      render();
    },
  });
}

function prepareCupDrag(event) {
  if (state.cupOnMachine || state.drinkPouring) {
    setMessage('饮品机里已经有一只杯子。');
    return;
  }
  if (state.drinksStored >= MAX_DRINKS) {
    setMessage('饮料架满了，先等待出餐。');
    return;
  }
  startIngredientDrag(event, 'cup');
}

function prepareSliceDrag(event) {
  if (state.incomingSlices) {
    setMessage('等鱼片滑到架子里再制作寿司。');
    return;
  }
  if (state.incomingRice) {
    setMessage('等米饭滑进米饭架再制作寿司。');
    return;
  }
  if (!state.riceStored) {
    setMessage('先点击饭盒拿一团米饭。');
    return;
  }
  if (state.sushiStored >= MAX_SUSHI) {
    setMessage('寿司架满了，先出餐再继续制作。');
    return;
  }
  startIngredientDrag(event, 'slice');
}

freezerButton.addEventListener('click', openSashimiPicker);
selectSalmon.addEventListener('click', chooseSalmon);
displaySalmon.addEventListener('pointerdown', prepareSalmonDrag);
riceBin.addEventListener('click', takeRice);
cupStation.addEventListener('pointerdown', prepareCupDrag);

window.addEventListener('pointermove', (event) => moveDragPreview(event));
window.addEventListener('pointercancel', () => clearIngredientDrag());
window.addEventListener('pointerup', (event) => {
  if (!ingredientDrag || event.pointerId !== ingredientDrag.pointerId) return;
  const { type, source } = ingredientDrag;
  const destination = type === 'salmon' ? boardStation : type === 'cup' ? drinkMachine : riceRack;
  const accepted = pointIsInside(event, destination);
  if (source.hasPointerCapture(event.pointerId)) source.releasePointerCapture(event.pointerId);
  clearIngredientDrag();

  if (!accepted) {
    setMessage(type === 'salmon' ? '把大三文鱼拖到切菜板里。' : type === 'cup' ? '把空杯拖到饮品机里。' : '把三文鱼片拖到米饭架里。');
    return;
  }

  if (type === 'salmon') {
    state.salmonOnBoard = true;
    state.salmonSelected = false;
    state.cutLines = [false, false, false];
    state.activeCut = null;
    setMessage('大三文鱼已放到切菜板。在虚线附近按住，轻轻向下滑动即可切片。');
  } else if (type === 'cup') {
    state.cupOnMachine = true;
    setMessage('空杯放好了，点击饮品机接饮料。');
  } else {
    makeSushi(riceRack);
    return;
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
  const flyingSlice = document.createElement('img');
  const fromX = sourceRect.left + (sourceRect.width * sourceFraction) - stageRect.left;
  const fromY = sourceRect.top + (sourceRect.height * 0.54) - stageRect.top;
  const column = sliceIndex % SLICE_COLUMNS;
  const row = Math.floor(sliceIndex / SLICE_COLUMNS);
  const columnGap = rackRect.width * 0.02;
  const rowGap = rackRect.height * 0.07;
  const targetWidth = (rackRect.width - (columnGap * (SLICE_COLUMNS - 1))) / SLICE_COLUMNS;
  const targetHeight = (rackRect.height - (rowGap * (SLICE_ROWS - 1))) / SLICE_ROWS;
  const toX = rackRect.left + (column * (targetWidth + columnGap)) + (targetWidth / 2) - stageRect.left;
  const toY = rackRect.top + (row * (targetHeight + rowGap)) + (targetHeight / 2) - stageRect.top;

  flyingSlice.className = 'flying-salmon-slice';
  flyingSlice.src = `${KITCHEN_ASSET_PATH}salmon-slice.png`;
  flyingSlice.alt = '';
  flyingSlice.draggable = false;
  flyingSlice.style.left = `${fromX}px`;
  flyingSlice.style.top = `${fromY}px`;
  flyingSlice.style.width = `${targetWidth}px`;
  flyingSlice.style.height = `${targetHeight}px`;
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

function flyCompletedItem({ className, src, sourceRect, targetRect, targetIndex, columns, rows, gap, displayScale = 1, onFinish }) {
  const flightVersion = state.flightVersion;
  const stageRect = stage.getBoundingClientRect();
  const column = targetIndex % columns;
  const row = Math.floor(targetIndex / columns);
  const columnGap = targetRect.width * gap;
  const rowGap = targetRect.height * gap;
  const targetWidth = (targetRect.width - (columnGap * (columns - 1))) / columns;
  const targetHeight = (targetRect.height - (rowGap * (rows - 1))) / rows;
  const fromX = sourceRect.left + (sourceRect.width / 2) - stageRect.left;
  const fromY = sourceRect.top + (sourceRect.height / 2) - stageRect.top;
  const toX = targetRect.left + (column * (targetWidth + columnGap)) + (targetWidth / 2) - stageRect.left;
  const toY = targetRect.top + (row * (targetHeight + rowGap)) + (targetHeight / 2) - stageRect.top;
  const item = document.createElement('img');

  item.className = `flying-completed-item ${className}`;
  item.src = src;
  item.alt = '';
  item.draggable = false;
  item.style.left = `${fromX}px`;
  item.style.top = `${fromY}px`;
  item.style.width = `${targetWidth * displayScale}px`;
  item.style.height = `${targetHeight * displayScale}px`;
  stage.append(item);

  requestAnimationFrame(() => {
    item.style.left = `${toX}px`;
    item.style.top = `${toY}px`;
    item.classList.add('is-flying');
  });

  window.setTimeout(() => {
    item.remove();
    if (flightVersion === state.flightVersion) onFinish();
  }, 620);
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

drinkMachine.addEventListener('click', () => {
  if (!state.cupOnMachine) {
    setMessage('先从杯子区拖一个空杯到饮品机。');
    return;
  }
  if (state.drinkPouring) return;
  state.drinkPouring = true;
  const version = state.drinkVersion;
  setMessage('正在接橙味饮料。');
  render();
  window.setTimeout(() => {
    if (version !== state.drinkVersion) return;
    const sourceRect = machineCup.getBoundingClientRect();
    const targetRect = drinkRack.getBoundingClientRect();
    const targetIndex = state.drinksStored;
    state.cupOnMachine = false;
    state.drinkPouring = false;
    state.drinksStored += 1;
    state.incomingDrinks += 1;
    setMessage('饮料做好了，已放进饮料架。');
    render();
    flyCompletedItem({
      className: 'drink',
      src: `${KITCHEN_ASSET_PATH}tea-cup-ready.png`,
      sourceRect,
      targetRect,
      targetIndex,
      columns: 2,
      rows: 3,
      gap: 0.1,
      onFinish: () => {
        state.incomingDrinks = Math.max(0, state.incomingDrinks - 1);
        render();
      },
    });
  }, 650);
});

document.querySelector('#reset-button').addEventListener('click', () => {
  state.flightVersion += 1;
  state.drinkVersion += 1;
  document.querySelectorAll('.flying-salmon-slice').forEach((slice) => slice.remove());
  document.querySelectorAll('.flying-completed-item').forEach((item) => item.remove());
  Object.assign(state, { salmonOnBoard: false, cutLines: [false, false, false], activeCut: null, cutStartY: 0, slicesReady: 0, incomingSlices: 0, riceStored: 0, incomingRice: 0, sushiStored: 0, incomingSushi: 0, cupOnMachine: false, drinkPouring: false, drinksStored: 0, incomingDrinks: 0, sashimiPickerOpen: false, salmonSelected: false, shopOpen: true });
  setMessage('营业中：准备寿司后即可出餐。');
  render();
});

openShopButton.addEventListener('click', () => {
  state.shopOpen = true;
  setMessage('店门已打开，开始接待客人。');
  render();
});

serveButton.addEventListener('click', () => {
  state.sushiStored -= 1;
  setMessage(state.sushiStored ? '已出餐一份寿司。' : '已出餐，寿司架空了。');
  render();
});

setMessage('营业中：准备寿司后即可出餐。');
render();

function preloadInteractionAssets() {
  ['salmon-slice.png', 'rice-portion.png', 'salmon-nigiri.png', 'tea-cup-ready.png'].forEach((name) => {
    const image = new Image();
    image.src = `${KITCHEN_ASSET_PATH}${name}`;
  });
}

if ('requestIdleCallback' in window) {
  window.requestIdleCallback(preloadInteractionAssets, { timeout: 1200 });
} else {
  window.setTimeout(preloadInteractionAssets, 600);
}
