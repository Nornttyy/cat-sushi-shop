const MAX_SLICES = 12;
const MAX_RICE = 8;
const MAX_SUSHI = 8;
const MAX_DRINKS = 6;
const MAX_WAITING_CUSTOMERS = 2;
const SLICE_COLUMNS = 4;
const SLICE_ROWS = 3;
const KITCHEN_ASSET_PATH = 'assets/restaurant/kitchen-layers/optimized/';
const CUSTOMER_ASSET_PATH = 'assets/restaurant/customers/';
const CUT_LINES = [0.3, 0.5, 0.7];
const CUT_START_TOLERANCE = 0.18;
const CUT_SWIPE_DISTANCE = 0.12;
const CUT_SLICE_ORIGINS = [[0.15], [0.4], [0.6, 0.85]];
const CUSTOMER_WAIT_MS = 75000;
const CUSTOMER_ARRIVAL_DELAY_MS = 3600;
const CUSTOMER_EXIT_MS = 1100;
const COMPLETED_FLIGHT_MS = 820;
const DRINK_FILL_MS = 760;
const SUSHI_TYPES = {
  salmon: {
    id: 'salmon',
    name: '三文鱼',
    pickerName: '三文鱼刺身',
    boardName: '大三文鱼',
    loin: 'salmon-loin.png',
    slice: 'salmon-slice.png',
    nigiri: 'salmon-nigiri.png',
    price: 18,
  },
  tuna: {
    id: 'tuna',
    name: '金枪鱼',
    pickerName: '金枪鱼刺身',
    boardName: '大金枪鱼块',
    loin: 'tuna-loin.png',
    slice: 'tuna-slice.png',
    nigiri: 'tuna-nigiri.png',
    price: 22,
  },
  shrimp: {
    id: 'shrimp',
    name: '甜虾',
    pickerName: '甜虾',
    boardName: '甜虾食材',
    loin: 'shrimp-loin.png',
    slice: 'shrimp-slice.png',
    nigiri: 'shrimp-nigiri.png',
    price: 20,
  },
  tamago: {
    id: 'tamago',
    name: '玉子烧',
    pickerName: '玉子烧',
    boardName: '玉子烧块',
    loin: 'tamago-loin.png',
    slice: 'tamago-slice.png',
    nigiri: 'tamago-nigiri.png',
    price: 16,
  },
};
const SUSHI_TYPE_LIST = Object.values(SUSHI_TYPES);
const CUSTOMER_CATALOG = [
  { name: '夏海', avatar: 'customer-summer.png' },
  { name: '阿渔', avatar: 'customer-fisher.png' },
];

function sushiTypeFor(id) {
  return SUSHI_TYPES[id] ?? SUSHI_TYPES.salmon;
}

function sushiAsset(id, asset) {
  return `${KITCHEN_ASSET_PATH}${sushiTypeFor(id)[asset]}`;
}

function sushiName(id) {
  return sushiTypeFor(id).name;
}

const state = {
  salmonOnBoard: false,
  boardIngredientId: null,
  cutLines: [false, false, false],
  activeCut: null,
  cutStartY: 0,
  slicesReady: 0,
  incomingSlices: 0,
  sliceTypes: [],
  flightVersion: 0,
  riceStored: 0,
  incomingRice: 0,
  sushiStored: 0,
  incomingSushi: 0,
  sushiTypes: [],
  cupOnMachine: false,
  drinkPouring: false,
  drinksStored: 0,
  incomingDrinks: 0,
  drinkVersion: 0,
  sashimiPickerOpen: false,
  shopOpen: true,
  cash: 0,
  customers: [],
  customerSerial: 0,
};

const stage = document.querySelector('#kitchen-stage');
const message = document.querySelector('#kitchen-message');
const sceneBackground = document.querySelector('#scene-background');
const stageName = document.querySelector('#stage-name');
const customerQueue = document.querySelector('#customer-queue');
const cashValue = document.querySelector('#cash-value');
const freezerButton = document.querySelector('#freezer-button');
const sashimiPicker = document.querySelector('#sashimi-picker');
const sashimiChoices = Array.from(document.querySelectorAll('.sashimi-choice'));
const riceBin = document.querySelector('#rice-bin');
const boardStation = document.querySelector('.board-station');
const assemblyStation = document.querySelector('.assembly-station');
const boardSalmon = document.querySelector('#board-salmon');
const boardIngredientImage = document.querySelector('#board-ingredient-image');
const sliceRack = document.querySelector('#slice-rack');
const riceRack = document.querySelector('#rice-rack');
const sushiRack = document.querySelector('#sushi-rack');
const openShopButton = document.querySelector('#open-shop-button');
const pauseShopButton = document.querySelector('#pause-shop-button');
const shopStatus = document.querySelector('#shop-status');
const shopStatusDetail = document.querySelector('#shop-status-detail');
const drinkMachine = document.querySelector('#drink-machine');
const cupStation = document.querySelector('#cup-station');
const machineCup = document.querySelector('#machine-cup');
const drinkRack = document.querySelector('#drink-rack');
let ingredientDrag = null;
let customerSpawnTimer = null;
const customerLeaveTimers = new Map();
const customerExitTimers = new Map();
const stationMotionTimers = new WeakMap();

stage.addEventListener('dragstart', (event) => event.preventDefault());

function show(element, visible) {
  element.classList.toggle('is-hidden', !visible);
}

function setMessage(text) {
  message.textContent = text;
}

function playStationMotion(element, className, duration) {
  const previousTimer = stationMotionTimers.get(element);
  if (previousTimer) window.clearTimeout(previousTimer);
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  stationMotionTimers.set(element, window.setTimeout(() => {
    element.classList.remove(className);
    stationMotionTimers.delete(element);
  }, duration));
}

function clearCustomerTimers() {
  if (customerSpawnTimer) window.clearTimeout(customerSpawnTimer);
  customerSpawnTimer = null;
  customerLeaveTimers.forEach((timer) => window.clearTimeout(timer));
  customerLeaveTimers.clear();
  customerExitTimers.forEach((timer) => window.clearTimeout(timer));
  customerExitTimers.clear();
}

function customerCardFor(customerId) {
  return Array.from(customerQueue.children).find((card) => card.dataset.customerId === customerId);
}

function getActiveCustomer() {
  return state.customers.find((customer) => !customer.served && !customer.leaving);
}

function activeCustomerAvatar() {
  const customer = getActiveCustomer();
  return customer ? customerCardFor(customer.id)?.querySelector('.customer-avatar') : null;
}

function getPatience(customer) {
  return Math.max(0, Math.min(100, ((CUSTOMER_WAIT_MS - (performance.now() - customer.arrivedAt)) / CUSTOMER_WAIT_MS) * 100));
}

function createCustomerCard(customer) {
  const card = document.createElement('article');
  const avatar = document.createElement('img');
  const order = document.createElement('div');
  const wait = document.createElement('div');
  const fill = document.createElement('i');
  const receivedSushi = document.createElement('img');

  card.className = 'customer is-entering';
  card.dataset.customerId = customer.id;
  avatar.className = 'customer-avatar';
  avatar.draggable = false;
  order.className = 'customer-order';
  wait.className = 'customer-wait';
  wait.append(fill);
  receivedSushi.className = 'customer-received-sushi is-hidden';
  receivedSushi.alt = '顾客拿到的寿司';
  receivedSushi.draggable = false;
  card.append(avatar, order, wait, receivedSushi);
  card.addEventListener('animationend', (event) => {
    if (event.animationName === 'customer-enter') card.classList.remove('is-entering');
  });
  return card;
}

function updateCustomerCard(card, customer) {
  const avatar = card.querySelector('.customer-avatar');
  const order = card.querySelector('.customer-order');
  const wait = card.querySelector('.customer-wait');
  const fill = wait.querySelector('i');
  const receivedSushi = card.querySelector('.customer-received-sushi');
  const orderedSushi = sushiTypeFor(customer.orderId);

  const avatarSrc = `${CUSTOMER_ASSET_PATH}${customer.avatar}`;
  if (avatar.getAttribute('src') !== avatarSrc) avatar.src = avatarSrc;
  avatar.alt = '正在等待点寿司的顾客';
  card.classList.toggle('is-serving', Boolean(customer.served));
  card.classList.toggle('is-leaving', Boolean(customer.leaving));
  receivedSushi.classList.toggle('is-hidden', !customer.served);
  receivedSushi.src = sushiAsset(customer.orderId, 'nigiri');
  receivedSushi.alt = `顾客拿到的${orderedSushi.name}寿司`;
  order.replaceChildren();

  if (customer.served) {
    order.append('谢谢！');
  } else if (customer.leaving) {
    order.append('下次见');
  } else {
    const sushi = document.createElement('img');
    sushi.src = sushiAsset(customer.orderId, 'nigiri');
    sushi.alt = '';
    sushi.draggable = false;
    order.append(`${orderedSushi.name}寿司`, sushi);
  }

  const patienceValue = getPatience(customer);
  const isWaiting = !customer.served && !customer.leaving;
  wait.classList.toggle('is-hidden', !isWaiting);
  fill.style.transform = `scaleX(${patienceValue / 100})`;
}

function animateCustomerReflow(beforeRects) {
  window.requestAnimationFrame(() => {
    state.customers.forEach((customer) => {
      const card = customerCardFor(customer.id);
      const previousRect = beforeRects.get(customer.id);
      if (!card || !previousRect || card.classList.contains('is-entering') || card.classList.contains('is-leaving')) return;

      const nextRect = card.getBoundingClientRect();
      const offsetX = previousRect.left - nextRect.left;
      const offsetY = previousRect.top - nextRect.top;
      if (Math.abs(offsetX) < 1 && Math.abs(offsetY) < 1) return;

      card.animate([
        { transform: `translate3d(${offsetX}px, ${offsetY}px, 0)` },
        { transform: 'translate3d(0, 0, 0)' },
      ], {
        duration: 620,
        easing: 'cubic-bezier(.22, .8, .24, 1)',
      });
    });
  });
}

function renderCustomers() {
  const beforeRects = new Map(Array.from(customerQueue.children).map((card) => [card.dataset.customerId, card.getBoundingClientRect()]));
  const desiredIds = new Set(state.customers.map((customer) => customer.id));
  Array.from(customerQueue.children).forEach((card) => {
    if (!desiredIds.has(card.dataset.customerId)) card.remove();
  });
  state.customers.forEach((customer, index) => {
    const card = customerCardFor(customer.id) ?? createCustomerCard(customer);
    updateCustomerCard(card, customer);
    if (customerQueue.children[index] !== card) customerQueue.append(card);
  });
  animateCustomerReflow(beforeRects);
}

function refreshCustomerPatience() {
  state.customers.forEach((customer) => {
    if (customer.served || customer.leaving) return;
    const card = customerCardFor(customer.id);
    if (!card) return;
    const wait = card.querySelector('.customer-wait');
    const fill = wait.querySelector('i');
    const patienceValue = getPatience(customer);
    fill.style.transform = `scaleX(${patienceValue / 100})`;
  });
}

function fadeOutCustomer(customer, { holdMs = 0, scheduleNext = true } = {}) {
  if (customer.leaving || customerExitTimers.has(customer.id)) return;
  const startFade = () => {
    customer.leaving = true;
    renderCustomers();
    customerExitTimers.set(customer.id, window.setTimeout(() => {
      customerExitTimers.delete(customer.id);
      const index = state.customers.findIndex((waitingCustomer) => waitingCustomer.id === customer.id);
      if (index !== -1) state.customers.splice(index, 1);
      render();
      if (scheduleNext) scheduleCustomer(950);
    }, CUSTOMER_EXIT_MS));
  };
  customerExitTimers.set(customer.id, window.setTimeout(startFade, holdMs));
}

function scheduleCustomer(delay = CUSTOMER_ARRIVAL_DELAY_MS) {
  if (customerSpawnTimer) window.clearTimeout(customerSpawnTimer);
  customerSpawnTimer = null;
  if (!state.shopOpen || state.customers.length >= MAX_WAITING_CUSTOMERS) return;
  customerSpawnTimer = window.setTimeout(() => {
    customerSpawnTimer = null;
    if (!state.shopOpen || state.customers.length >= MAX_WAITING_CUSTOMERS) return;
    const template = CUSTOMER_CATALOG[state.customerSerial % CUSTOMER_CATALOG.length];
    const orderedSushi = SUSHI_TYPE_LIST[Math.floor(Math.random() * SUSHI_TYPE_LIST.length)];
    const customer = {
      ...template,
      id: `${state.customerSerial}-${Date.now()}`,
      orderId: orderedSushi.id,
      price: orderedSushi.price,
      arrivedAt: performance.now(),
      served: false,
      leaving: false,
    };
    state.customerSerial += 1;
    state.customers.push(customer);
    customerLeaveTimers.set(customer.id, window.setTimeout(() => customerLeaves(customer.id), CUSTOMER_WAIT_MS));
    setMessage(`${customer.name}来了，想要一份${orderedSushi.name}寿司。`);
    render();
    scheduleCustomer();
  }, delay);
}

function customerLeaves(customerId) {
  const customer = state.customers.find((waitingCustomer) => waitingCustomer.id === customerId);
  customerLeaveTimers.delete(customerId);
  if (!customer || customer.served || customer.leaving) return;
  setMessage(`${customer.name}等太久离开了。`);
  fadeOutCustomer(customer);
}

function pauseShop() {
  if (!state.shopOpen) return;
  state.shopOpen = false;
  clearCustomerTimers();
  state.customers.forEach((customer) => fadeOutCustomer(customer, { scheduleNext: false }));
  setMessage('已暂停营业，客人不会再进入。现在可以去捕鱼或补货。');
  render();
}

function resumeShop() {
  if (state.shopOpen) return;
  state.shopOpen = true;
  setMessage('继续营业，第一位客人马上就到。');
  render();
  scheduleCustomer(550);
}

function playSushiMakingAnimation(ingredientId) {
  const stageRect = stage.getBoundingClientRect();
  const stationRect = assemblyStation.getBoundingClientRect();
  const width = Math.max(38, stationRect.width * 0.38);
  const height = Math.max(34, stationRect.height * 0.43);
  const centerX = stationRect.left - stageRect.left + (stationRect.width * 0.56);
  const centerY = stationRect.top - stageRect.top + (stationRect.height * 0.48);
  const maker = document.createElement('div');
  const rice = document.createElement('img');
  const topping = document.createElement('img');

  maker.className = 'sushi-making-animation';
  maker.setAttribute('aria-hidden', 'true');
  maker.style.left = `${centerX}px`;
  maker.style.top = `${centerY}px`;
  maker.style.width = `${width}px`;
  maker.style.height = `${height}px`;

  rice.className = 'sushi-making-rice';
  rice.src = `${KITCHEN_ASSET_PATH}rice-portion.png`;
  rice.alt = '';
  topping.className = 'sushi-making-topping';
  topping.src = sushiAsset(ingredientId, 'slice');
  topping.alt = '';
  maker.append(rice, topping);
  stage.append(maker);
  requestAnimationFrame(() => maker.classList.add('is-making'));

  return {
    maker,
    sourceRect: {
      left: stageRect.left + centerX - (width / 2),
      top: stageRect.top + centerY - (height / 2),
      width,
      height,
    },
  };
}

function makeSushi(ingredientId = 'salmon') {
  const sushiType = sushiTypeFor(ingredientId);
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
  const sliceIndex = state.sliceTypes.indexOf(sushiType.id);
  if (sliceIndex === -1) {
    setMessage(`找不到可用的${sushiType.name}片。`);
    return;
  }
  state.sliceTypes.splice(sliceIndex, 1);
  state.slicesReady -= 1;
  state.riceStored -= 1;
  state.sushiStored += 1;
  state.incomingSushi += 1;
  state.sushiTypes.push(sushiType.id);
  const targetRect = sushiRack.getBoundingClientRect();
  const targetIndex = state.sushiStored - 1;
  const animationVersion = state.flightVersion;
  const makingSushi = playSushiMakingAnimation(sushiType.id);
  setMessage(`正在捏制${sushiType.name}寿司。`);
  render();
  window.setTimeout(() => {
    makingSushi.maker.remove();
    if (animationVersion !== state.flightVersion) return;
    flyCompletedItem({
      className: 'sushi',
      src: sushiAsset(sushiType.id, 'nigiri'),
      sourceRect: makingSushi.sourceRect,
      targetRect,
      targetIndex,
      columns: 2,
      rows: 4,
      gap: 0.04,
      displayScale: 1.12,
      onFinish: () => {
        state.incomingSushi = Math.max(0, state.incomingSushi - 1);
        setMessage(`${sushiType.name}寿司做好了，已放进寿司架。`);
        render();
      },
    });
  }, 420);
}

function renderSlices() {
  sliceRack.replaceChildren();
  const displayedTypes = state.sliceTypes.slice(0, Math.max(0, state.sliceTypes.length - state.incomingSlices));
  displayedTypes.forEach((ingredientId, index) => {
    const sushiType = sushiTypeFor(ingredientId);
    const slice = document.createElement('button');
    const sliceImage = document.createElement('img');
    slice.type = 'button';
    slice.className = 'sushi-slice-crop';
    slice.dataset.ingredientId = sushiType.id;
    slice.setAttribute('aria-label', `第 ${index + 1} 片${sushiType.name}，拖到米饭上制作寿司`);
    sliceImage.src = sushiAsset(sushiType.id, 'slice');
    sliceImage.alt = '';
    sliceImage.draggable = false;
    slice.addEventListener('pointerdown', prepareSliceDrag);
    slice.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      makeSushi(sushiType.id);
    });
    slice.append(sliceImage);
    sliceRack.append(slice);
  });
}

function renderSushiRack() {
  const displayedTypes = state.sushiTypes.slice(0, Math.max(0, state.sushiTypes.length - state.incomingSushi));
  const existingItems = Array.from(sushiRack.children);
  existingItems.slice(displayedTypes.length).forEach((item) => item.remove());

  displayedTypes.forEach((ingredientId, index) => {
    const sushiType = sushiTypeFor(ingredientId);
    let item = existingItems[index];
    if (!item) {
      item = document.createElement('button');
      item.type = 'button';
      item.className = 'stored-sushi stored-sushi-button stock-item-arriving';
      item.addEventListener('animationend', () => item.classList.remove('stock-item-arriving'), { once: true });
      item.addEventListener('pointerdown', prepareSushiServeDrag);
      item.append(document.createElement('img'));
      sushiRack.append(item);
    }
    const image = item.querySelector('img');
    item.dataset.ingredientId = sushiType.id;
    item.setAttribute('aria-label', `第 ${index + 1} 份${sushiType.name}寿司，拖给顾客`);
    image.src = sushiAsset(sushiType.id, 'nigiri');
    image.alt = `${sushiType.name}寿司`;
    image.draggable = false;
  });
}

function renderStockRack(rack, count, className, src, alt, onPointerDown = null) {
  const visibleCount = Math.max(0, count);
  const existingItems = Array.from(rack.children);
  existingItems.slice(visibleCount).forEach((item) => item.remove());

  for (let index = 0; index < visibleCount; index += 1) {
    if (existingItems[index]) continue;
    const item = document.createElement(onPointerDown ? 'button' : 'img');
    item.className = onPointerDown ? `${className} stored-sushi-button` : className;
    item.classList.add('stock-item-arriving');
    item.addEventListener('animationend', () => item.classList.remove('stock-item-arriving'), { once: true });
    if (onPointerDown) {
      const image = document.createElement('img');
      item.type = 'button';
      item.setAttribute('aria-label', `第 ${index + 1} 份${alt}，拖给顾客`);
      image.src = src;
      image.alt = alt;
      image.draggable = false;
      item.addEventListener('pointerdown', onPointerDown);
      item.append(image);
    } else {
      item.src = src;
      item.alt = alt;
      item.draggable = false;
    }
    rack.append(item);
  }
}

function renderDrinks() {
  const displayedDrinks = Math.max(0, state.drinksStored - state.incomingDrinks);
  const existingDrinks = Array.from(drinkRack.children);
  existingDrinks.slice(displayedDrinks).forEach((drink) => drink.remove());
  for (let index = 0; index < displayedDrinks; index += 1) {
    if (existingDrinks[index]) continue;
    const drink = document.createElement('img');
    drink.className = 'stored-drink stock-item-arriving';
    drink.addEventListener('animationend', () => drink.classList.remove('stock-item-arriving'), { once: true });
    drink.src = `${KITCHEN_ASSET_PATH}tea-cup-ready.png`;
    drink.alt = '一杯橙味饮料';
    drink.draggable = false;
    drinkRack.append(drink);
  }
}

function render() {
  sceneBackground.src = `${KITCHEN_ASSET_PATH}kitchen-background.jpg`;
  sceneBackground.alt = '海边寿司店后台';
  const firstCustomer = getActiveCustomer();
  const boardSushiType = sushiTypeFor(state.boardIngredientId);
  stageName.textContent = state.shopOpen ? '营业制作台' : '暂停营业';
  cashValue.textContent = `¥${state.cash}`;
  freezerButton.classList.toggle('is-active', state.sashimiPickerOpen);
  sashimiPicker.classList.remove('is-picked');
  show(sashimiPicker, state.sashimiPickerOpen);
  show(boardSalmon, state.salmonOnBoard);
  boardIngredientImage.src = sushiAsset(boardSushiType.id, 'loin');
  boardIngredientImage.alt = `待切${boardSushiType.name}`;
  boardSalmon.setAttribute('aria-label', `${boardSushiType.boardName}，在虚线附近按住并向下滑动切片`);
  boardSalmon.classList.toggle('is-cutting', state.activeCut !== null);
  const completedCuts = state.cutLines.filter(Boolean).length;
  const croppedLeft = completedCuts ? CUT_LINES[completedCuts - 1] : 0;
  boardSalmon.style.clipPath = state.salmonOnBoard ? `inset(0 0 0 ${croppedLeft * 100}%)` : '';
  boardSalmon.querySelectorAll('.cut-guide').forEach((guide, index) => {
    guide.classList.toggle('is-cut', state.cutLines[index]);
    guide.classList.toggle('is-active', state.activeCut === index);
  });
  show(pauseShopButton, state.shopOpen);
  show(openShopButton, !state.shopOpen);
  shopStatus.textContent = state.shopOpen ? '营业中' : '暂停营业';
  shopStatusDetail.textContent = state.shopOpen
    ? firstCustomer ? `${firstCustomer.name}：${sushiName(firstCustomer.orderId)}寿司` : '等待第一位客人'
    : '可捕鱼或补货';
  show(machineCup, state.cupOnMachine);
  machineCup.src = state.drinkPouring
    ? `${KITCHEN_ASSET_PATH}tea-cup-ready.png`
    : `${KITCHEN_ASSET_PATH}tea-cup-empty.png`;
  machineCup.classList.toggle('is-filling', state.drinkPouring);
  drinkMachine.classList.toggle('is-pouring', state.drinkPouring);
  renderSlices();
  renderStockRack(riceRack, state.riceStored - state.incomingRice, 'stored-rice', `${KITCHEN_ASSET_PATH}rice-portion.png`, '一团米饭');
  renderSushiRack();
  renderDrinks();
  renderCustomers();
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
  customerQueue.querySelector('.customer.is-drop-target')?.classList.remove('is-drop-target');
  ingredientDrag = null;
}

function startIngredientDrag(event, type, requestedIngredientId = null) {
  const source = event.currentTarget;
  event.preventDefault();
  if (ingredientDrag) return;
  const ingredientId = requestedIngredientId ?? source.dataset.ingredientId ?? 'salmon';
  const sushiType = sushiTypeFor(ingredientId);

  const preview = document.createElement('img');
  preview.className = `ingredient-drag-preview ${type}`;
  preview.src = type === 'ingredient'
    ? sushiAsset(sushiType.id, 'loin')
    : type === 'slice'
      ? sushiAsset(sushiType.id, 'slice')
      : type === 'cup'
        ? `${KITCHEN_ASSET_PATH}tea-cup-empty.png`
        : sushiAsset(sushiType.id, 'nigiri');
  preview.alt = '';
  preview.draggable = false;
  stage.append(preview);
  const targetCustomer = type === 'serve' ? getActiveCustomer() : null;
  const target = targetCustomer ? customerCardFor(targetCustomer.id)?.querySelector('.customer-avatar') : null;
  ingredientDrag = { type, source, pointerId: event.pointerId, preview, target, targetCustomerId: targetCustomer?.id ?? null, ingredientId: sushiType.id };
  if (type === 'slice' || type === 'ingredient' || type === 'serve') source.classList.add('is-dragging');
  source.setPointerCapture(event.pointerId);
  const dropTarget = type === 'ingredient' ? boardStation : type === 'cup' ? drinkMachine : type === 'serve' ? target?.closest('.customer') : riceRack;
  dropTarget?.classList.add('is-drop-target');
  moveDragPreview(event);
  setMessage(type === 'ingredient' ? `把${sushiType.boardName}拖到切菜板。` : type === 'cup' ? '把空杯拖到饮品机。' : type === 'serve' ? '把寿司直接拖给顾客。' : `把${sushiType.name}片拖到米饭架。`);
}

function canSelectSashimi() {
  if (state.incomingSlices) {
    setMessage('等切好的配料放好后，再拿新的食材。');
    return false;
  }
  if (state.salmonOnBoard) {
    setMessage(`切菜板上还有${sushiTypeFor(state.boardIngredientId).boardName}，先把它切完再拿新的。`);
    return false;
  }
  return true;
}

function openSashimiPicker() {
  if (!canSelectSashimi()) return;
  state.sashimiPickerOpen = !state.sashimiPickerOpen;
  setMessage(state.sashimiPickerOpen ? '选择一种食材。' : '已收起食材选择。');
  render();
}

function dragSashimiFromPicker(event) {
  if (!canSelectSashimi()) return;
  const ingredientId = event.currentTarget.dataset.ingredientId;
  const sushiType = sushiTypeFor(ingredientId);
  state.sashimiPickerOpen = false;
  sashimiPicker.classList.add('is-picked');
  startIngredientDrag(event, 'ingredient', sushiType.id);
  setMessage(`拖动${sushiType.pickerName}到切菜板。`);
}

function takeRice() {
  if (state.riceStored >= MAX_RICE) {
    setMessage('米饭架已经存满 8 团。');
    return;
  }
  playStationMotion(riceBin, 'is-dispensing', 420);
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
      setMessage('米饭已放进米饭架。拖一片配料到米饭架制作寿司。');
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
  startIngredientDrag(event, 'slice', event.currentTarget.dataset.ingredientId);
}

function prepareSushiServeDrag(event) {
  if (!state.shopOpen) {
    setMessage('营业暂停中，先继续营业再出餐。');
    return;
  }
  const customer = getActiveCustomer();
  if (!customer) {
    setMessage('还没有正在等待的顾客。');
    return;
  }
  if (state.incomingSushi) {
    setMessage('等寿司滑进寿司架再出餐。');
    return;
  }
  startIngredientDrag(event, 'serve');
}

function deliverSushiToCustomer(ingredientId, customerId) {
  const customer = state.customers.find((waitingCustomer) => waitingCustomer.id === customerId && !waitingCustomer.served && !waitingCustomer.leaving);
  if (!customer || !state.sushiStored) return;
  const sushiType = sushiTypeFor(ingredientId);
  const expectedSushi = sushiTypeFor(customer.orderId);
  if (customer.orderId !== sushiType.id) {
    setMessage(`${customer.name}想要${expectedSushi.name}寿司，这份${sushiType.name}寿司不能交给他。`);
    render();
    return;
  }
  const storedIndex = state.sushiTypes.indexOf(sushiType.id);
  if (storedIndex === -1) {
    setMessage('这份寿司已经不在寿司架里了。');
    render();
    return;
  }
  const leaveTimer = customerLeaveTimers.get(customer.id);
  if (leaveTimer) window.clearTimeout(leaveTimer);
  customerLeaveTimers.delete(customer.id);

  customer.served = true;
  state.sushiTypes.splice(storedIndex, 1);
  state.sushiStored = state.sushiTypes.length;
  state.cash += customer.price;
  setMessage(`寿司已交给${customer.name}，获得 ¥${customer.price}。`);
  render();
  fadeOutCustomer(customer, { holdMs: 420 });
}

freezerButton.addEventListener('click', openSashimiPicker);
sashimiChoices.forEach((choice) => choice.addEventListener('pointerdown', dragSashimiFromPicker));
riceBin.addEventListener('click', takeRice);
cupStation.addEventListener('pointerdown', prepareCupDrag);

window.addEventListener('pointermove', (event) => moveDragPreview(event));
window.addEventListener('pointercancel', () => clearIngredientDrag());
window.addEventListener('pointerup', (event) => {
  if (!ingredientDrag || event.pointerId !== ingredientDrag.pointerId) return;
  const { type, source, target, targetCustomerId, ingredientId } = ingredientDrag;
  const sushiType = sushiTypeFor(ingredientId);
  const destination = type === 'ingredient' ? boardStation : type === 'cup' ? drinkMachine : type === 'serve' ? target : riceRack;
  const accepted = Boolean(destination && pointIsInside(event, destination));
  if (source.hasPointerCapture(event.pointerId)) source.releasePointerCapture(event.pointerId);
  clearIngredientDrag();

  if (!accepted) {
    setMessage(type === 'ingredient' ? `把${sushiType.boardName}拖到切菜板里。` : type === 'cup' ? '把空杯拖到饮品机里。' : type === 'serve' ? '把寿司直接拖到顾客身上。' : `把${sushiType.name}片拖到米饭架里。`);
    render();
    return;
  }

  if (type === 'serve') {
    deliverSushiToCustomer(sushiType.id, targetCustomerId);
    return;
  }

  if (type === 'ingredient') {
    state.salmonOnBoard = true;
    state.boardIngredientId = sushiType.id;
    state.cutLines = [false, false, false];
    state.activeCut = null;
    setMessage(`${sushiType.boardName}已放到切菜板。在虚线附近按住，轻轻向下滑动即可切片。`);
  } else if (type === 'cup') {
    state.cupOnMachine = true;
    setMessage('空杯放好了，点击饮品机接饮料。');
  } else {
    makeSushi(sushiType.id);
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

function flySlice(sourceRect, rackRect, sourceFraction, sliceIndex, flightVersion, ingredientId) {
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

  flyingSlice.className = 'flying-sushi-slice';
  flyingSlice.src = sushiAsset(ingredientId, 'slice');
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
  }, COMPLETED_FLIGHT_MS);
}

function finishCutLine(index) {
  const sourceRect = boardSalmon.getBoundingClientRect();
  const rackRect = sliceRack.getBoundingClientRect();
  const sliceOrigins = CUT_SLICE_ORIGINS[index];
  const firstSliceIndex = state.slicesReady;
  const flightVersion = state.flightVersion;
  const ingredientId = sushiTypeFor(state.boardIngredientId).id;
  const sushiType = sushiTypeFor(ingredientId);

  state.cutLines[index] = true;
  state.slicesReady = Math.min(MAX_SLICES, state.slicesReady + sliceOrigins.length);
  state.sliceTypes.push(...Array(sliceOrigins.length).fill(ingredientId));
  state.incomingSlices += sliceOrigins.length;
  const completed = state.cutLines.filter(Boolean).length;
  state.salmonOnBoard = completed < CUT_LINES.length;
  if (!state.salmonOnBoard) state.boardIngredientId = null;
  setMessage(completed < CUT_LINES.length ? `切好一片${sushiType.name}，继续切下一条虚线。` : `最后两片${sushiType.name}切好了！`);
  render();
  sliceOrigins.forEach((origin, offset) => {
    flySlice(sourceRect, rackRect, origin, firstSliceIndex + offset, flightVersion, ingredientId);
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
    setMessage('配料架空间不够，先做几份寿司再继续切。');
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
  }, DRINK_FILL_MS);
});

document.querySelector('#reset-button').addEventListener('click', () => {
  state.flightVersion += 1;
  state.drinkVersion += 1;
  clearCustomerTimers();
  document.querySelectorAll('.flying-sushi-slice').forEach((slice) => slice.remove());
  document.querySelectorAll('.flying-completed-item').forEach((item) => item.remove());
  document.querySelectorAll('.sushi-making-animation').forEach((item) => item.remove());
  Object.assign(state, { salmonOnBoard: false, boardIngredientId: null, cutLines: [false, false, false], activeCut: null, cutStartY: 0, slicesReady: 0, incomingSlices: 0, sliceTypes: [], riceStored: 0, incomingRice: 0, sushiStored: 0, incomingSushi: 0, sushiTypes: [], cupOnMachine: false, drinkPouring: false, drinksStored: 0, incomingDrinks: 0, sashimiPickerOpen: false, shopOpen: true, cash: 0, customers: [], customerSerial: 0 });
  setMessage('制作台已整理，第一位客人马上就到。');
  render();
  scheduleCustomer(500);
});

pauseShopButton.addEventListener('click', pauseShop);
openShopButton.addEventListener('click', resumeShop);

setMessage('营业中：第一位客人马上就到。');
render();
scheduleCustomer(700);
window.setInterval(refreshCustomerPatience, 120);

function preloadInteractionAssets() {
  const assetNames = new Set(['rice-portion.png', 'tea-cup-ready.png']);
  SUSHI_TYPE_LIST.forEach((sushiType) => {
    assetNames.add(sushiType.loin);
    assetNames.add(sushiType.slice);
    assetNames.add(sushiType.nigiri);
  });
  assetNames.forEach((name) => {
    const image = new Image();
    image.src = `${KITCHEN_ASSET_PATH}${name}`;
  });
}

if ('requestIdleCallback' in window) {
  window.requestIdleCallback(preloadInteractionAssets, { timeout: 1200 });
} else {
  window.setTimeout(preloadInteractionAssets, 600);
}
