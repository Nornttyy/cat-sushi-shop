const MAX_RICE = 8;
const MAX_WAITING_CUSTOMERS = 2;
const KITCHEN_ASSET_PATH = 'assets/restaurant/kitchen-layers/optimized/';
const CUSTOMER_ASSET_PATH = 'assets/restaurant/customers/';
const CUT_LINES = [0.3, 0.5, 0.7];
const CUT_START_TOLERANCE = 0.18;
const CUT_SWIPE_DISTANCE = 0.12;
const CUT_SLICE_ORIGINS = [[0.15], [0.4], [0.6, 0.85]];
const CUSTOMER_WAIT_MS = 75000;
const CUSTOMER_ARRIVAL_DELAY_MS = 3600;
const CUSTOMER_EXIT_MS = 820;
const SLICE_FLIGHT_STAGGER_MS = 70;
const DRINK_FILL_MS = 760;
const TEA_PRICE = 3;
const FIRST_DAY_SERVICE_MS = 90 * 1000;
const STANDARD_DAY_SERVICE_MS = 150 * 1000;
const DAY_CLOCK_SAVE_INTERVAL_MS = 5 * 1000;
const TUTORIAL_STEP = Object.freeze({
  WELCOME: 0,
  FREEZER: 1,
  PLACE_TAMAGO: 2,
  CUT_TAMAGO: 3,
  TAKE_RICE: 4,
  MAKE_SUSHI: 5,
  SERVE_CUSTOMER: 6,
});
const TUTORIAL_STEP_COUNT = 6;
const SHRIMP_BATCH_SIZE = 4;
const SHRIMP_HEAD_CUT_X = 0.5;
const RAW_FISH_IDS = ['salmon', 'tuna', 'shrimp'];
const MAX_RAW_FISH = Number.MAX_SAFE_INTEGER;
const SAVE_KEY = 'seaside-sushi-shop.save.v1';
const SAVE_VERSION = 1;
const SETTINGS_KEY = 'seaside-sushi-shop.settings.v1';
const INITIAL_UNLOCKED_INGREDIENTS = ['tamago'];
const SHOP_ITEMS = [
  { id: 'tea', name: '茶饮配方', asset: 'tea-cup-ready.png', price: 120 },
  { id: 'salmon', price: 180 },
  { id: 'shrimp', price: 260 },
  { id: 'tuna', price: 350 },
];
const STORAGE_UPGRADES = [
  {
    id: 'slices',
    name: '鱼片架扩容',
    asset: 'salmon-slice.png',
    prices: [180, 360, 650],
    capacities: [12, 16, 20, 24],
    grids: [
      { columns: 4, rows: 3 },
      { columns: 4, rows: 4 },
      { columns: 5, rows: 4 },
      { columns: 6, rows: 4 },
    ],
  },
  {
    id: 'sushi',
    name: '寿司架扩容',
    asset: 'tamago-nigiri.png',
    prices: [220, 450, 800],
    capacities: [8, 12, 16, 20],
    grids: [
      { columns: 2, rows: 4 },
      { columns: 3, rows: 4 },
      { columns: 4, rows: 4 },
      { columns: 4, rows: 5 },
    ],
  },
  {
    id: 'drinks',
    name: '茶水架扩容',
    asset: 'tea-cup-ready.png',
    prices: [140, 300, 550],
    requiresTea: true,
    capacities: [8, 10, 12, 14],
    grids: [
      { columns: 2, rows: 4 },
      { columns: 2, rows: 5 },
      { columns: 3, rows: 4 },
      { columns: 3, rows: 5 },
    ],
  },
];
const SUSHI_TYPES = {
  salmon: {
    id: 'salmon',
    name: '三文鱼',
    pickerName: '三文鱼刺身',
    boardName: '大三文鱼',
    loin: 'salmon-loin.png',
    slice: 'salmon-slice.png',
    nigiri: 'salmon-nigiri.png',
    price: 4,
  },
  tuna: {
    id: 'tuna',
    name: '金枪鱼',
    pickerName: '金枪鱼刺身',
    boardName: '大金枪鱼块',
    loin: 'tuna-loin.png',
    slice: 'tuna-slice.png',
    nigiri: 'tuna-nigiri.png',
    price: 6,
  },
  shrimp: {
    id: 'shrimp',
    name: '甜虾',
    pickerName: '甜虾',
    boardName: '甜虾食材',
    loin: 'shrimp-loin.png',
    whole: 'shrimp-whole.png',
    head: 'shrimp-head.png',
    slice: 'shrimp-slice.png',
    nigiri: 'shrimp-nigiri.png',
    price: 5,
  },
  tamago: {
    id: 'tamago',
    name: '玉子烧',
    pickerName: '玉子烧',
    boardName: '玉子烧块',
    loin: 'tamago-loin.png',
    slice: 'tamago-slice.png',
    nigiri: 'tamago-nigiri.png',
    price: 3,
  },
};
const SUSHI_TYPE_LIST = Object.values(SUSHI_TYPES);
const TEA_ORDER_ITEM = {
  type: 'tea',
  id: 'tea',
  name: '茶',
  price: TEA_PRICE,
  asset: 'tea-cup-ready.png',
};
const CUSTOMER_CATALOG = Object.freeze([
  Object.freeze({ avatar: 'customer-summer.png', customerType: 'standard', minimumDay: 1, patienceMultiplier: 1 }),
  Object.freeze({ avatar: 'customer-beggar.png', customerType: 'beggar', minimumDay: 7, patienceMultiplier: 0.86 }),
  Object.freeze({ avatar: 'customer-fisher.png', customerType: 'regular', minimumDay: 12, favoriteSushiId: 'salmon', patienceMultiplier: 1.16 }),
  Object.freeze({ avatar: 'customer-rush.png', customerType: 'impatient', minimumDay: 12, patienceMultiplier: 0.58 }),
  Object.freeze({ avatar: 'customer-feast.png', customerType: 'large-order', minimumDay: 12, patienceMultiplier: 1.18 }),
  Object.freeze({ avatar: 'customer-regular.png', customerType: 'regular', minimumDay: 12, favoriteSushiId: 'tuna', patienceMultiplier: 1.2 }),
]);

function sushiTypeFor(id) {
  return SUSHI_TYPES[id] ?? SUSHI_TYPES.salmon;
}

function sushiAsset(id, asset) {
  return `${KITCHEN_ASSET_PATH}${sushiTypeFor(id)[asset]}`;
}

function sushiName(id) {
  return sushiTypeFor(id).name;
}

function orderItemName(item) {
  return item.type === 'tea' ? TEA_ORDER_ITEM.name : `${sushiName(item.id)}寿司`;
}

function orderItemAsset(item) {
  return item.type === 'tea'
    ? `${KITCHEN_ASSET_PATH}${TEA_ORDER_ITEM.asset}`
    : sushiAsset(item.id, 'nigiri');
}

function pendingOrderItems(customer) {
  return (customer.orderItems ?? []).filter((item) => !item.fulfilled);
}

function orderSummary(items) {
  const counts = new Map();
  items.forEach((item) => {
    const name = orderItemName(item);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  return Array.from(counts, ([name, count]) => count > 1 ? `${name}×${count}` : name).join('、');
}

function createCustomerOrder(template = CUSTOMER_CATALOG[0]) {
  const remainingServings = new Map(orderableSushiTypes().map(({ sushiType, servings }) => [sushiType.id, servings]));
  const orderItems = [];

  // 逃单客只会要一份基础寿司，确保第 7 天起无论玩家买了什么都能应对。
  if (template.customerType === 'beggar') {
    const tamago = SUSHI_TYPES.tamago;
    return [{ type: 'sushi', id: tamago.id, price: tamago.price, fulfilled: false }];
  }

  if (template.customerType === 'regular') {
    const favorite = SUSHI_TYPES[template.favoriteSushiId];
    if (!favorite || (remainingServings.get(favorite.id) ?? 0) <= 0) {
      return createCustomerOrder({ customerType: 'standard' });
    }
    orderItems.push({ type: 'sushi', id: favorite.id, price: favorite.price, fulfilled: false });
    return orderItems;
  }

  const sushiCount = template.customerType === 'large-order'
    ? 3
    : template.customerType === 'impatient'
      ? 1
      : 1 + (Math.random() < 0.58 ? 1 : 0) + (remainingServings.size > 1 && Math.random() < 0.18 ? 1 : 0);

  for (let index = 0; index < sushiCount; index += 1) {
    const orderPool = unlockedSushiTypes().filter((sushiType) => (remainingServings.get(sushiType.id) ?? 0) > 0);
    const sushi = orderPool[Math.floor(Math.random() * orderPool.length)] ?? SUSHI_TYPES.tamago;
    orderItems.push({ type: 'sushi', id: sushi.id, price: sushi.price, fulfilled: false });
    if (Number.isFinite(remainingServings.get(sushi.id))) {
      remainingServings.set(sushi.id, Math.max(0, remainingServings.get(sushi.id) - 1));
    }
  }

  const teaChance = template.customerType === 'large-order'
    ? 0.46
    : template.customerType === 'impatient'
      ? 0.18
      : 0.62;
  if (orderItems.length < 4 && isTeaUnlocked() && Math.random() < teaChance) {
    orderItems.push({ ...TEA_ORDER_ITEM, fulfilled: false });
  }

  return orderItems;
}

function isIngredientUnlocked(id) {
  return state.unlockedIngredients.includes(id);
}

function isTeaUnlocked() {
  return state.teaUnlocked;
}

function unlockedSushiTypes() {
  return SUSHI_TYPE_LIST.filter((sushiType) => isIngredientUnlocked(sushiType.id));
}

function needsFishing(id) {
  return RAW_FISH_IDS.includes(id);
}

function rawFishYield(id) {
  return id === 'shrimp' ? SHRIMP_BATCH_SIZE : CUT_SLICE_ORIGINS.flat().length;
}

function rawFishCount(id) {
  return needsFishing(id) ? state.rawFish[id] ?? 0 : Number.POSITIVE_INFINITY;
}

function hasRawFish(id) {
  return !needsFishing(id) || rawFishCount(id) > 0;
}

function consumeRawFish(id) {
  if (!needsFishing(id)) return true;
  if (!hasRawFish(id)) return false;
  state.rawFish[id] -= 1;
  return true;
}

function boardServingCapacity(id) {
  if (id === 'shrimp') return state.shrimpBatch.filter((shrimp) => !shrimp.cut).length;
  if (!state.salmonOnBoard || state.boardIngredientId !== id) return 0;
  return state.cutLines.reduce((remaining, cut, index) => remaining + (cut ? 0 : CUT_SLICE_ORIGINS[index].length), 0);
}

function availableSushiServings(id) {
  if (!needsFishing(id)) return Number.POSITIVE_INFINITY;
  const finishedSlices = state.sliceTypes.filter((sliceId) => sliceId === id).length;
  const finishedSushi = state.sushiTypes.filter((sushiId) => sushiId === id).length;
  const pendingOrders = state.customers.reduce((total, customer) => {
    if (customer.served || customer.leaving) return total;
    return total + pendingOrderItems(customer).filter((item) => item.type === 'sushi' && item.id === id).length;
  }, 0);
  const total = (rawFishCount(id) * rawFishYield(id)) + boardServingCapacity(id) + finishedSlices + finishedSushi;
  return Math.max(0, total - pendingOrders);
}

function orderableSushiTypes() {
  return unlockedSushiTypes()
    .map((sushiType) => ({ sushiType, servings: availableSushiServings(sushiType.id) }))
    .filter((entry) => entry.servings > 0);
}

function customerTemplateCanOrder(template) {
  const minimumDay = Math.max(1, Math.floor(Number(template?.minimumDay) || 1));
  if (!template || state.day < minimumDay) return false;
  if (!template || template.customerType !== 'regular') return true;
  const favoriteId = template.favoriteSushiId;
  return Boolean(favoriteId && isIngredientUnlocked(favoriteId) && availableSushiServings(favoriteId) > 0);
}

function nextCustomerTemplate() {
  const eligible = CUSTOMER_CATALOG.filter(customerTemplateCanOrder);
  return eligible[state.customerSerial % eligible.length] ?? CUSTOMER_CATALOG[0];
}

function shopItemFor(id) {
  return SHOP_ITEMS.find((item) => item.id === id) ?? null;
}

function isShopItemUnlocked(shopItem) {
  return shopItem.id === 'tea' ? isTeaUnlocked() : isIngredientUnlocked(shopItem.id);
}

function shopItemName(shopItem) {
  return shopItem.name ?? sushiName(shopItem.id);
}

function storageUpgradeFor(id) {
  return STORAGE_UPGRADES.find((upgrade) => upgrade.id === id) ?? null;
}

function normalizeStorageLevels(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(STORAGE_UPGRADES.map((upgrade) => [
    upgrade.id,
    asStoredCount(source[upgrade.id], upgrade.capacities.length - 1),
  ]));
}

function storageLevelFor(id, levels = state.storageLevels) {
  const upgrade = storageUpgradeFor(id);
  if (!upgrade) return 0;
  return asStoredCount(levels?.[id], upgrade.capacities.length - 1);
}

function storageCapacityFor(id, levels = state.storageLevels) {
  const upgrade = storageUpgradeFor(id);
  if (!upgrade) return 0;
  return upgrade.capacities[storageLevelFor(id, levels)] ?? upgrade.capacities[0];
}

function storageGridFor(id, levels = state.storageLevels) {
  const upgrade = storageUpgradeFor(id);
  if (!upgrade) return { columns: 1, rows: 1 };
  return upgrade.grids[storageLevelFor(id, levels)] ?? upgrade.grids[0];
}

function storageUpgradeIsMaxed(upgrade) {
  return storageLevelFor(upgrade.id) >= upgrade.capacities.length - 1;
}

const state = {
  salmonOnBoard: false,
  shrimpOnBoard: false,
  shrimpBatch: [],
  shrimpBatchSerial: 0,
  boardIngredientId: null,
  cutLines: [false, false, false],
  activeCut: null,
  cutStartY: 0,
  activeShrimpCut: null,
  shrimpCutStartY: 0,
  shrimpHeads: [],
  shrimpHeadDiscarding: false,
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
  shopPanelOpen: false,
  unlockedIngredients: [...INITIAL_UNLOCKED_INGREDIENTS],
  rawFish: { salmon: 0, tuna: 0, shrimp: 0 },
  storageLevels: { slices: 0, sushi: 0, drinks: 0 },
  teaUnlocked: false,
  tutorialCompleted: false,
  tutorialStarted: false,
  tutorialStep: TUTORIAL_STEP.WELCOME,
  tutorialCustomerId: null,
  day: 1,
  dayPhase: 'service',
  dayCustomersFinished: 0,
  dayCustomersServed: 0,
  dayIncome: 0,
  dayTimeRemainingMs: FIRST_DAY_SERVICE_MS,
  dayTimerStarted: false,
  dayTimerStartedAt: 0,
  dayEndedEarly: false,
  daySummaryOpen: false,
  shopOpen: true,
  gamePaused: false,
  pauseSettingsOpen: false,
  cash: 0,
  lifetimeRevenue: 0,
  customers: [],
  customerSerial: 0,
};

let lastSavedSnapshot = '';
let saveTimer = null;
let gameSettings = { reducedMotion: false };
let accumulatedPausedTime = 0;
let pauseStartedAt = 0;
const gameplayTimeouts = new Set();

function gameplayNow() {
  const now = performance.now();
  const activePauseDuration = state.gamePaused ? now - pauseStartedAt : 0;
  return now - accumulatedPausedTime - activePauseDuration;
}

function armGameplayTimeout(timer) {
  if (timer.cleared || state.gamePaused || timer.handle !== null) return;
  timer.startedAt = performance.now();
  timer.handle = window.setTimeout(() => {
    timer.handle = null;
    gameplayTimeouts.delete(timer);
    if (!timer.cleared) timer.callback();
  }, timer.remaining);
}

function setGameplayTimeout(callback, delay) {
  const timer = {
    callback,
    remaining: Math.max(0, delay),
    startedAt: 0,
    handle: null,
    cleared: false,
  };
  gameplayTimeouts.add(timer);
  armGameplayTimeout(timer);
  return timer;
}

function clearGameplayTimeout(timer) {
  if (!timer || timer.cleared) return;
  timer.cleared = true;
  if (timer.handle !== null) window.clearTimeout(timer.handle);
  timer.handle = null;
  gameplayTimeouts.delete(timer);
}

function pauseGameplayTimeouts() {
  const now = performance.now();
  gameplayTimeouts.forEach((timer) => {
    if (timer.cleared || timer.handle === null) return;
    window.clearTimeout(timer.handle);
    timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    timer.handle = null;
  });
}

function resumeGameplayTimeouts() {
  [...gameplayTimeouts].forEach((timer) => armGameplayTimeout(timer));
}

function restoreGameSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY));
    if (saved && typeof saved === 'object') gameSettings.reducedMotion = Boolean(saved.reducedMotion);
  } catch {
    gameSettings = { reducedMotion: false };
  }
}

function saveGameSettings() {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(gameSettings));
  } catch {
    // Settings are optional; private browsing can refuse storage without affecting play.
  }
}

function asStoredCount(value, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(max, Math.max(0, Math.floor(parsed)));
}

function normalizeRawFish(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(RAW_FISH_IDS.map((id) => [id, asStoredCount(source[id], MAX_RAW_FISH)]));
}

function isKnownSushiId(id) {
  return typeof id === 'string' && Boolean(SUSHI_TYPES[id]);
}

function savedSushiTypes(value, unlockedIngredients, max) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((id) => isKnownSushiId(id) && unlockedIngredients.includes(id))
    .slice(0, max);
}

function hasUnsettledSaveState() {
  const hasPartialOrder = state.customers.some((customer) => !customer.served && !customer.leaving
    && (customer.orderItems ?? []).some((item) => item.fulfilled));
  return Boolean(
    state.incomingSlices
    || state.incomingRice
    || state.incomingSushi
    || state.incomingDrinks
    || state.drinkPouring
    || state.salmonOnBoard
    || state.shrimpOnBoard
    || state.shrimpHeads.length
    || state.shrimpHeadDiscarding
    || hasPartialOrder,
  );
}

function buildSaveSnapshot() {
  const stableSliceCount = Math.max(0, state.sliceTypes.length - state.incomingSlices);
  const stableSushiCount = Math.max(0, state.sushiTypes.length - state.incomingSushi);
  return {
    version: SAVE_VERSION,
    cash: asStoredCount(state.cash, 9_999_999),
    lifetimeRevenue: asStoredCount(state.lifetimeRevenue, 9_999_999),
    unlockedIngredients: [...new Set(state.unlockedIngredients.filter(isKnownSushiId))],
    storageLevels: normalizeStorageLevels(state.storageLevels),
    teaUnlocked: Boolean(state.teaUnlocked),
    tutorialCompleted: Boolean(state.tutorialCompleted),
    day: Math.max(1, Math.floor(state.day)),
    dayPhase: state.dayPhase,
    dayCustomersFinished: Math.max(0, Math.floor(state.dayCustomersFinished)),
    dayCustomersServed: Math.max(0, Math.floor(state.dayCustomersServed)),
    dayIncome: Math.max(0, Math.floor(state.dayIncome)),
    dayTimeRemainingMs: Math.ceil(dayTimeRemaining()),
    dayEndedEarly: Boolean(state.dayEndedEarly),
    shopOpen: Boolean(state.shopOpen),
    inventory: {
      rawFish: normalizeRawFish(state.rawFish),
      sliceTypes: state.sliceTypes.slice(0, stableSliceCount),
      rice: Math.max(0, state.riceStored - state.incomingRice),
      sushiTypes: state.sushiTypes.slice(0, stableSushiCount),
      tea: Math.max(0, state.drinksStored - state.incomingDrinks),
    },
  };
}

function saveGame() {
  if (hasUnsettledSaveState()) return false;
  const snapshot = JSON.stringify(buildSaveSnapshot());
  if (snapshot === lastSavedSnapshot) return true;
  try {
    window.localStorage.setItem(SAVE_KEY, snapshot);
    lastSavedSnapshot = snapshot;
    return true;
  } catch {
    return false;
  }
}

function scheduleSave(delay = 180) {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    if (hasUnsettledSaveState()) {
      scheduleSave(240);
      return;
    }
    saveGame();
  }, delay);
}

function restoreGame() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || saved.version !== SAVE_VERSION) return false;

    const savedUnlocks = Array.isArray(saved.unlockedIngredients)
      ? saved.unlockedIngredients.filter(isKnownSushiId)
      : [];
    const unlockedIngredients = [...new Set([...INITIAL_UNLOCKED_INGREDIENTS, ...savedUnlocks])];
    const inventory = saved.inventory && typeof saved.inventory === 'object' ? saved.inventory : {};
    const storageLevels = normalizeStorageLevels(saved.storageLevels);
    const rawFish = normalizeRawFish(inventory.rawFish);
    const sliceTypes = savedSushiTypes(inventory.sliceTypes, unlockedIngredients, storageCapacityFor('slices', storageLevels));
    const sushiTypes = savedSushiTypes(inventory.sushiTypes, unlockedIngredients, storageCapacityFor('sushi', storageLevels));
    const teaUnlocked = Boolean(saved.teaUnlocked);
    // Old saves predate the tutorial. Keep their owners in the game instead of
    // putting an established shop back through a first-day lesson.
    const tutorialCompleted = typeof saved.tutorialCompleted === 'boolean' ? saved.tutorialCompleted : true;
    const hasSavedDay = Number.isFinite(Number(saved.day)) && Number(saved.day) >= 1;
    const day = hasSavedDay
      ? asStoredCount(saved.day, 9_999) || 1
      : tutorialCompleted ? 2 : 1;
    const legacySettlement = !hasSavedDay && typeof saved.shopOpen === 'boolean' && !saved.shopOpen;
    let dayPhase = saved.dayPhase === 'settlement' || legacySettlement ? 'settlement' : 'service';
    const dayCustomersFinished = asStoredCount(saved.dayCustomersFinished, 9_999_999);
    const dayCustomersServed = Math.min(dayCustomersFinished, asStoredCount(saved.dayCustomersServed, 9_999_999));
    const dayIncome = asStoredCount(saved.dayIncome, 9_999_999);
    const lifetimeRevenue = asStoredCount(saved.lifetimeRevenue ?? saved.cash, 9_999_999);
    const dayDuration = dayDurationForDay(day);
    const savedDayTime = Number(saved.dayTimeRemainingMs);
    const dayTimeRemainingMs = Number.isFinite(savedDayTime)
      ? Math.min(dayDuration, Math.max(0, Math.floor(savedDayTime)))
      : dayDuration;
    if (dayPhase === 'service' && tutorialCompleted && dayTimeRemainingMs <= 0) dayPhase = 'settlement';
    const shopOpen = dayPhase === 'service';

    Object.assign(state, {
      salmonOnBoard: false,
      shrimpOnBoard: false,
      shrimpBatch: [],
      shrimpBatchSerial: 0,
      boardIngredientId: null,
      cutLines: [false, false, false],
      activeCut: null,
      cutStartY: 0,
      activeShrimpCut: null,
      shrimpCutStartY: 0,
      shrimpHeads: [],
      shrimpHeadDiscarding: false,
      slicesReady: sliceTypes.length,
      incomingSlices: 0,
      sliceTypes,
      flightVersion: 0,
      riceStored: asStoredCount(inventory.rice, MAX_RICE),
      incomingRice: 0,
      sushiStored: sushiTypes.length,
      incomingSushi: 0,
      sushiTypes,
      cupOnMachine: false,
      drinkPouring: false,
      drinksStored: teaUnlocked ? asStoredCount(inventory.tea, storageCapacityFor('drinks', storageLevels)) : 0,
      incomingDrinks: 0,
      drinkVersion: 0,
      sashimiPickerOpen: false,
      shopPanelOpen: false,
      unlockedIngredients,
      rawFish,
      storageLevels,
      teaUnlocked,
      tutorialCompleted,
      tutorialStarted: false,
      tutorialStep: TUTORIAL_STEP.WELCOME,
      tutorialCustomerId: null,
      day,
      dayPhase,
      dayCustomersFinished,
      dayCustomersServed,
      dayIncome,
      dayTimeRemainingMs,
      dayTimerStarted: false,
      dayTimerStartedAt: 0,
      dayEndedEarly: dayPhase === 'settlement' && Boolean(saved.dayEndedEarly),
      daySummaryOpen: false,
      shopOpen,
      gamePaused: false,
      pauseSettingsOpen: false,
      cash: asStoredCount(saved.cash, 9_999_999),
      lifetimeRevenue,
      customers: [],
      customerSerial: 0,
    });
    return true;
  } catch {
    return false;
  }
}

const stage = document.querySelector('#kitchen-stage');
const message = document.querySelector('#kitchen-message');
const sceneBackground = document.querySelector('#scene-background');
const stageName = document.querySelector('#stage-name');
const customerQueue = document.querySelector('#customer-queue');
const cashValue = document.querySelector('#cash-value');
const dayLabel = document.querySelector('#day-label');
const dayStatus = document.querySelector('#day-status');
const daySummaryOverlay = document.querySelector('#day-summary-overlay');
const daySummaryTitle = document.querySelector('#day-summary-title');
const daySummaryDismissButton = document.querySelector('#day-summary-dismiss');
const freezerButton = document.querySelector('#freezer-button');
const sashimiPicker = document.querySelector('#sashimi-picker');
const sashimiChoices = Array.from(document.querySelectorAll('.sashimi-choice'));
const ingredientShopToggle = document.querySelector('#ingredient-shop-toggle');
const ingredientShopPanel = document.querySelector('#ingredient-shop-panel');
const ingredientShopClose = document.querySelector('#ingredient-shop-close');
const ingredientShopCash = document.querySelector('#ingredient-shop-cash');
const ingredientShopItems = document.querySelector('#ingredient-shop-items');
const storageUpgradeItems = document.querySelector('#storage-upgrade-items');
const riceBin = document.querySelector('#rice-bin');
const boardStation = document.querySelector('.board-station');
const assemblyStation = document.querySelector('.assembly-station');
const boardSalmon = document.querySelector('#board-salmon');
const boardIngredientImage = document.querySelector('#board-ingredient-image');
const shrimpBatch = document.querySelector('#shrimp-batch');
const shrimpHeadRack = document.querySelector('#shrimp-head-rack');
const trashBin = document.querySelector('#trash-bin');
const sliceRack = document.querySelector('#slice-rack');
const riceRack = document.querySelector('#rice-rack');
const sushiRack = document.querySelector('#sushi-rack');
const gamePauseButton = document.querySelector('#game-pause-button');
const gamePauseOverlay = document.querySelector('#game-pause-overlay');
const gamePauseMenu = document.querySelector('#game-pause-menu');
const gameSettingsPanel = document.querySelector('#game-settings-panel');
const resumeGameButton = document.querySelector('#resume-game-button');
const openGameSettingsButton = document.querySelector('#open-game-settings-button');
const closeGameSettingsButton = document.querySelector('#close-game-settings-button');
const motionSettingButton = document.querySelector('#motion-setting-button');
const exitGameButton = document.querySelector('#exit-game-button');
const exitLoadingOverlay = document.querySelector('#exit-loading-overlay');
const openShopButton = document.querySelector('#open-shop-button');
const goFishingButton = document.querySelector('#go-fishing-button');
const settlementActions = document.querySelector('#settlement-actions');
const drinkMachine = document.querySelector('#drink-machine');
const cupStation = document.querySelector('#cup-station');
const machineCup = document.querySelector('#machine-cup');
const drinkRack = document.querySelector('#drink-rack');
const tutorialGuide = document.querySelector('#tutorial-guide');
const tutorialStepLabel = document.querySelector('#tutorial-step-label');
const tutorialTitle = document.querySelector('#tutorial-title');
const tutorialDescription = document.querySelector('#tutorial-description');
const tutorialStartButton = document.querySelector('#tutorial-start-button');
const tutorialSkipButton = document.querySelector('#tutorial-skip-button');
const selectTamago = document.querySelector('#select-tamago');
let ingredientDrag = null;
let customerPatienceFrame = null;
let shopRenderSignature = '';
let customerSpawnTimer = null;
const customerLeaveTimers = new Map();
const customerExitTimers = new Map();
const stationMotionTimers = new WeakMap();
const stationMotionFrames = new WeakMap();
let dayEndTimer = null;
let dayClockFrame = null;
let dayClockLastSecond = null;
let dayClockLastSavedAt = 0;
const modalCloseTimers = new WeakMap();
let daySummaryTransitioning = false;
let shopPanelClosing = false;
let pauseOverlayClosing = false;
let tutorialWelcomeClosing = false;

stage.addEventListener('dragstart', (event) => event.preventDefault());

function show(element, visible) {
  element.classList.toggle('is-hidden', !visible);
}

function setMessage(text) {
  message.textContent = text;
}

function tutorialNeedsCompletion() {
  return !state.tutorialCompleted;
}

function tutorialIsRunning() {
  return tutorialNeedsCompletion() && state.tutorialStarted;
}

function tutorialCustomer() {
  return state.tutorialCustomerId
    ? state.customers.find((customer) => customer.id === state.tutorialCustomerId) ?? null
    : null;
}

function tutorialStepFromProgress() {
  const hasReadyTamagoSushi = state.sushiTypes.includes('tamago') && !state.incomingSushi;
  if (hasReadyTamagoSushi) return TUTORIAL_STEP.SERVE_CUSTOMER;

  const hasReadyTamagoSlice = state.sliceTypes.includes('tamago') && !state.incomingSlices;
  if (hasReadyTamagoSlice) {
    return state.riceStored && !state.incomingRice ? TUTORIAL_STEP.MAKE_SUSHI : TUTORIAL_STEP.TAKE_RICE;
  }

  if (state.salmonOnBoard && state.boardIngredientId === 'tamago') return TUTORIAL_STEP.CUT_TAMAGO;
  return TUTORIAL_STEP.FREEZER;
}

function spawnTutorialCustomer() {
  if (!tutorialIsRunning() || state.tutorialStep !== TUTORIAL_STEP.SERVE_CUSTOMER || tutorialCustomer()) return;
  const tutorialSushi = SUSHI_TYPES.tamago;
  const customer = {
    avatar: CUSTOMER_CATALOG[0].avatar,
    id: `tutorial-${Date.now()}`,
    orderItems: [{ type: 'sushi', id: tutorialSushi.id, price: tutorialSushi.price, fulfilled: false }],
    price: tutorialSushi.price,
    arrivedAt: gameplayNow(),
    served: false,
    leaving: false,
    day: state.day,
    dayResolved: false,
    tutorial: true,
  };
  state.tutorialCustomerId = customer.id;
  state.customers.push(customer);
  setMessage('第一位客人来了，只想要一份玉子烧寿司。');
}

function tutorialStepIsReady() {
  switch (state.tutorialStep) {
    case TUTORIAL_STEP.FREEZER:
      return state.sashimiPickerOpen;
    case TUTORIAL_STEP.PLACE_TAMAGO:
      return state.salmonOnBoard && state.boardIngredientId === 'tamago';
    case TUTORIAL_STEP.CUT_TAMAGO:
      return state.cutLines.every(Boolean) && state.sliceTypes.filter((id) => id === 'tamago').length >= 4 && !state.incomingSlices;
    case TUTORIAL_STEP.TAKE_RICE:
      return state.riceStored > 0 && !state.incomingRice;
    case TUTORIAL_STEP.MAKE_SUSHI:
      return state.sushiTypes.includes('tamago') && !state.incomingSushi;
    case TUTORIAL_STEP.SERVE_CUSTOMER:
      return Boolean(tutorialCustomer()?.served);
    default:
      return false;
  }
}

function finishTutorial({ skipped = false } = {}) {
  if (state.tutorialCompleted) return;
  const customer = tutorialCustomer();
  if (skipped && customer && !customer.served && !customer.leaving) {
    customer.tutorial = false;
    customerLeaveTimers.set(customer.id, setGameplayTimeout(() => customerLeaves(customer.id), CUSTOMER_WAIT_MS));
  }
  if (customer) customer.tutorial = false;
  state.tutorialCompleted = true;
  state.tutorialStarted = false;
  state.tutorialStep = TUTORIAL_STEP.WELCOME;
  state.tutorialCustomerId = null;
  setMessage(skipped
    ? '已跳过新手教程，可以按自己的节奏经营。'
    : '第一单完成！教程结束，接下来自己完成第一天的订单吧。');
  startDayClock();
  if (!hasUnsettledSaveState()) saveGame();
  else scheduleSave();
  if (skipped) scheduleCustomer(650);
}

function syncTutorialProgress() {
  if (!tutorialIsRunning()) return;
  let safety = 0;
  while (tutorialStepIsReady() && safety < TUTORIAL_STEP_COUNT) {
    if (state.tutorialStep === TUTORIAL_STEP.SERVE_CUSTOMER) {
      finishTutorial();
      return;
    }
    state.tutorialStep += 1;
    if (state.tutorialStep === TUTORIAL_STEP.SERVE_CUSTOMER) spawnTutorialCustomer();
    safety += 1;
  }
}

function tutorialView() {
  const cutProgress = state.cutLines.filter(Boolean).length;
  const customerCard = tutorialCustomer() ? customerCardFor(state.tutorialCustomerId) : null;
  switch (state.tutorialStep) {
    case TUTORIAL_STEP.FREEZER:
      return {
        label: `第 1/${TUTORIAL_STEP_COUNT} 步`,
        title: '先选玉子烧',
        description: '点击左边的冰柜，打开食材选择。',
        targets: [freezerButton],
      };
    case TUTORIAL_STEP.PLACE_TAMAGO:
      return {
        label: `第 2/${TUTORIAL_STEP_COUNT} 步`,
        title: '把玉子烧放上菜板',
        description: '按住玉子烧，拖到旁边的切菜板。',
        targets: [selectTamago, boardStation],
      };
    case TUTORIAL_STEP.CUT_TAMAGO:
      return {
        label: `第 3/${TUTORIAL_STEP_COUNT} 步`,
        title: '沿虚线切片',
        description: `在虚线附近按住后向下滑动，切出玉子烧片（${cutProgress}/3）。`,
        targets: [boardSalmon],
      };
    case TUTORIAL_STEP.TAKE_RICE:
      return {
        label: `第 4/${TUTORIAL_STEP_COUNT} 步`,
        title: '取一团米饭',
        description: '点击饭盒，米饭会飞进制作区。',
        targets: [riceBin],
      };
    case TUTORIAL_STEP.MAKE_SUSHI:
      return {
        label: `第 5/${TUTORIAL_STEP_COUNT} 步`,
        title: '组合成寿司',
        description: '把一片玉子烧拖到米饭架，做出第一份寿司。',
        targets: [sliceRack, riceRack],
      };
    case TUTORIAL_STEP.SERVE_CUSTOMER:
      return {
        label: `第 6/${TUTORIAL_STEP_COUNT} 步`,
        title: '交给第一位客人',
        description: '把寿司架里的玉子烧寿司拖到客人身上。',
        targets: [sushiRack, customerCard],
      };
    default:
      return {
        label: '新手教程',
        title: '欢迎来到海边寿司店',
        description: '跟着做出第一份玉子烧寿司，再交给第一位客人吧。',
        targets: [],
      };
  }
}

function renderTutorial() {
  stage.querySelectorAll('.is-tutorial-target').forEach((element) => element.classList.remove('is-tutorial-target'));
  const visible = tutorialNeedsCompletion();
  show(tutorialGuide, visible);
  if (!visible) {
    tutorialGuide.classList.remove('is-closing');
    return;
  }

  const welcome = !state.tutorialStarted;
  const view = tutorialView();
  tutorialGuide.classList.toggle('is-welcome', welcome);
  tutorialStepLabel.textContent = view.label;
  tutorialTitle.textContent = view.title;
  tutorialDescription.textContent = view.description;
  show(tutorialStartButton, welcome);
  tutorialSkipButton.textContent = welcome ? '先自己试试' : '跳过教程';
  view.targets.filter(Boolean).forEach((element) => element.classList.add('is-tutorial-target'));
  if (welcome && document.activeElement !== tutorialStartButton && document.activeElement !== tutorialSkipButton) {
    window.requestAnimationFrame(() => {
      if (tutorialNeedsCompletion() && !state.tutorialStarted) tutorialStartButton.focus();
    });
  }
}

function leaveTutorialWelcome(onFinished) {
  if (tutorialWelcomeClosing) return;
  tutorialWelcomeClosing = true;
  tutorialGuide.classList.add('is-closing');
  window.setTimeout(() => {
    tutorialWelcomeClosing = false;
    tutorialGuide.classList.remove('is-closing');
    onFinished();
  }, motionDuration(220));
}

function startTutorial() {
  if (!tutorialNeedsCompletion() || tutorialWelcomeClosing) return;
  leaveTutorialWelcome(() => {
    state.tutorialStarted = true;
    state.tutorialStep = tutorialStepFromProgress();
    if (state.tutorialStep === TUTORIAL_STEP.SERVE_CUSTOMER) spawnTutorialCustomer();
    setMessage('新手教程开始：跟着高亮提示完成第一单。');
    render();
  });
}

function skipTutorial() {
  if (!tutorialNeedsCompletion() || tutorialWelcomeClosing) return;
  leaveTutorialWelcome(() => {
    finishTutorial({ skipped: true });
    render();
  });
}

function motionDuration(duration) {
  return gameSettings.reducedMotion ? 1 : duration;
}

function openModal(element) {
  const closeTimer = modalCloseTimers.get(element);
  if (closeTimer !== undefined) {
    window.clearTimeout(closeTimer);
    modalCloseTimers.delete(element);
  }
  element.classList.remove('is-hidden', 'is-closing');
}

function closeModal(element, duration = 220, onClosed) {
  if (element.classList.contains('is-hidden')) {
    onClosed?.();
    return;
  }
  if (element.classList.contains('is-closing')) return;

  element.classList.add('is-closing');
  const closeTimer = window.setTimeout(() => {
    if (modalCloseTimers.get(element) !== closeTimer) return;
    modalCloseTimers.delete(element);
    element.classList.remove('is-closing');
    element.classList.add('is-hidden');
    onClosed?.();
  }, motionDuration(duration));
  modalCloseTimers.set(element, closeTimer);
}

function setModalVisibility(element, visible, duration = 220) {
  if (visible) openModal(element);
  else closeModal(element, duration);
}

function finishFlightOnAnimationEnd(element, animationName, onFinish) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    element.removeEventListener('animationend', handleAnimationEnd);
    element.remove();
    onFinish?.();
  };
  const handleAnimationEnd = (event) => {
    if (event.target !== element || event.animationName !== animationName) return;
    finish();
  };

  element.addEventListener('animationend', handleAnimationEnd);
  window.requestAnimationFrame(() => {
    if (element.isConnected) element.classList.add('is-flying');
  });
}

function playStationMotion(element, className, duration) {
  const previousTimer = stationMotionTimers.get(element);
  const previousFrame = stationMotionFrames.get(element);
  if (previousTimer) clearGameplayTimeout(previousTimer);
  if (previousFrame) window.cancelAnimationFrame(previousFrame);
  element.classList.remove(className);
  const frame = window.requestAnimationFrame(() => {
    stationMotionFrames.delete(element);
    if (!element.isConnected) return;
    element.classList.add(className);
    stationMotionTimers.set(element, setGameplayTimeout(() => {
      element.classList.remove(className);
      stationMotionTimers.delete(element);
    }, duration));
  });
  stationMotionFrames.set(element, frame);
}

function clearCustomerTimers({ keepExitTimers = false } = {}) {
  if (customerSpawnTimer) clearGameplayTimeout(customerSpawnTimer);
  customerSpawnTimer = null;
  customerLeaveTimers.forEach((timer) => clearGameplayTimeout(timer));
  customerLeaveTimers.clear();
  if (keepExitTimers) return;
  customerExitTimers.forEach((timer) => clearGameplayTimeout(timer));
  customerExitTimers.clear();
}

function isServingDay() {
  return state.dayPhase === 'service' && state.shopOpen;
}

function dayDurationForDay(day = state.day) {
  return Math.max(1, Math.floor(Number(day) || 1)) === 1
    ? FIRST_DAY_SERVICE_MS
    : STANDARD_DAY_SERVICE_MS;
}

function dayTimeRemaining() {
  const storedRemaining = Math.max(0, Number(state.dayTimeRemainingMs) || 0);
  if (!state.dayTimerStarted) return storedRemaining;
  return Math.max(0, storedRemaining - (gameplayNow() - state.dayTimerStartedAt));
}

function formatDayTime(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function stopDayClockLoop() {
  if (dayClockFrame !== null) window.cancelAnimationFrame(dayClockFrame);
  dayClockFrame = null;
  dayClockLastSecond = null;
}

function clearDayEndTimer() {
  if (!dayEndTimer) return;
  clearGameplayTimeout(dayEndTimer);
  dayEndTimer = null;
}

function stopDayClock() {
  if (state.dayTimerStarted) state.dayTimeRemainingMs = dayTimeRemaining();
  state.dayTimerStarted = false;
  state.dayTimerStartedAt = 0;
  clearDayEndTimer();
  stopDayClockLoop();
}

function refreshDayClock() {
  dayClockFrame = null;
  if (!isServingDay() || state.gamePaused || !state.dayTimerStarted) return;

  const remaining = dayTimeRemaining();
  if (remaining <= 0) {
    state.dayTimeRemainingMs = 0;
    state.dayTimerStarted = false;
    finishDay();
    return;
  }

  const remainingSecond = Math.ceil(remaining / 1000);
  if (remainingSecond !== dayClockLastSecond) {
    dayClockLastSecond = remainingSecond;
    dayStatus.textContent = `剩余 ${formatDayTime(remaining)}`;
  }

  const now = gameplayNow();
  if (now - dayClockLastSavedAt >= DAY_CLOCK_SAVE_INTERVAL_MS && !hasUnsettledSaveState()) {
    dayClockLastSavedAt = now;
    saveGame();
  }
  dayClockFrame = window.requestAnimationFrame(refreshDayClock);
}

function ensureDayClockLoop() {
  if (!isServingDay() || state.gamePaused || !state.dayTimerStarted || dayClockFrame !== null) return;
  dayClockFrame = window.requestAnimationFrame(refreshDayClock);
}

function startDayClock() {
  if (!isServingDay() || tutorialNeedsCompletion() || state.dayTimerStarted) return;
  const remaining = dayTimeRemaining();
  if (remaining <= 0) {
    finishDay();
    return;
  }

  state.dayTimeRemainingMs = remaining;
  state.dayTimerStarted = true;
  state.dayTimerStartedAt = gameplayNow();
  dayClockLastSavedAt = state.dayTimerStartedAt;
  clearDayEndTimer();
  dayEndTimer = setGameplayTimeout(() => {
    dayEndTimer = null;
    state.dayTimeRemainingMs = 0;
    state.dayTimerStarted = false;
    finishDay();
  }, remaining);
  ensureDayClockLoop();
}

function resolveDayCustomer(customer, { served = false } = {}) {
  if (!customer || customer.day !== state.day || customer.dayResolved || state.dayPhase !== 'service') return false;
  customer.dayResolved = true;
  state.dayCustomersFinished += 1;
  if (served) state.dayCustomersServed += 1;
  return true;
}

function clearInProgressKitchenWork() {
  // Completed ingredients already exist in their storage arrays before their
  // flight animation ends. Keep those items, but cancel their visual callback
  // so an ended day cannot modify the counter behind the settlement screen.
  state.flightVersion += 1;
  state.drinkVersion += 1;
  state.incomingSlices = 0;
  state.incomingRice = 0;
  state.incomingSushi = 0;
  state.incomingDrinks = 0;
  state.slicesReady = state.sliceTypes.length;
  state.sushiStored = state.sushiTypes.length;
  state.cupOnMachine = false;
  state.drinkPouring = false;
  state.salmonOnBoard = false;
  state.boardIngredientId = null;
  state.cutLines = [false, false, false];
  state.activeCut = null;
  state.shrimpOnBoard = false;
  state.shrimpBatch = [];
  state.activeShrimpCut = null;
  state.shrimpHeads = [];
  state.shrimpHeadDiscarding = false;
  stage.querySelectorAll('.flying-sushi-slice, .flying-completed-item, .flying-shrimp-head, .sushi-making-animation, .customer-delivery-flight').forEach((element) => element.remove());
}

function finishDay({ early = false, reason = 'time' } = {}) {
  if (state.dayPhase !== 'service') return false;
  stopDayClock();
  clearCustomerTimers();
  stopCustomerPatienceLoop();
  clearIngredientDrag();
  clearInProgressKitchenWork();
  state.customers = [];
  state.sashimiPickerOpen = false;
  state.shopOpen = false;
  state.dayPhase = 'settlement';
  state.dayEndedEarly = early;
  state.daySummaryOpen = !early;
  daySummaryTransitioning = false;
  setMessage(reason === 'missing-fish'
    ? '鱼不够了，先去补货。'
    : early
      ? '暂时打烊。'
      : `第 ${state.day} 天时间到了。`);
  render();
  window.requestAnimationFrame(() => {
    if (state.daySummaryOpen) daySummaryDismissButton.focus();
    else goFishingButton.focus();
  });
  if (!hasUnsettledSaveState()) saveGame();
  else scheduleSave();
  return true;
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

function availableFishServings(id) {
  if (!needsFishing(id)) return Number.POSITIVE_INFINITY;
  const rawServings = rawFishCount(id) * rawFishYield(id);
  const boardServings = boardServingCapacity(id);
  const slicedServings = state.sliceTypes.filter((sliceId) => sliceId === id).length;
  const finishedSushi = state.sushiTypes.filter((sushiId) => sushiId === id).length;
  return rawServings + boardServings + slicedServings + finishedSushi;
}

function kitchenWorkIsInFlight() {
  return Boolean(
    state.incomingSlices
    || state.incomingRice
    || state.incomingSushi
    || state.incomingDrinks
    || state.drinkPouring
    || state.salmonOnBoard
    || state.shrimpOnBoard
    || state.shrimpHeads.length
    || state.shrimpHeadDiscarding,
  );
}

function hasMissingFishForWaitingOrders() {
  const requiredServings = new Map();
  state.customers.forEach((customer) => {
    if (customer.served || customer.leaving) return;
    pendingOrderItems(customer).forEach((item) => {
      if (item.type !== 'sushi' || !needsFishing(item.id)) return;
      requiredServings.set(item.id, (requiredServings.get(item.id) ?? 0) + 1);
    });
  });
  return Array.from(requiredServings).some(([id, required]) => availableFishServings(id) < required);
}

function allUnlockedFishAreGone() {
  const unlockedFish = state.unlockedIngredients.filter((id) => needsFishing(id));
  return unlockedFish.length > 0 && unlockedFish.every((id) => availableFishServings(id) <= 0);
}

function maybeEndDayForMissingFish() {
  if (!isServingDay() || state.gamePaused || tutorialNeedsCompletion() || kitchenWorkIsInFlight()) return false;
  if (!hasMissingFishForWaitingOrders() && !allUnlockedFishAreGone()) return false;
  finishDay({ early: true, reason: 'missing-fish' });
  return true;
}

function customerWaitDuration(customer) {
  const multiplier = Number(customer?.patienceMultiplier);
  const normalizedMultiplier = Number.isFinite(multiplier) ? multiplier : 1;
  return Math.round(CUSTOMER_WAIT_MS * Math.min(1.35, Math.max(0.45, normalizedMultiplier)));
}

function getPatience(customer) {
  if (customer.tutorial) return 100;
  const waitDuration = customerWaitDuration(customer);
  return Math.max(0, Math.min(100, ((waitDuration - (gameplayNow() - customer.arrivedAt)) / waitDuration) * 100));
}

function stopCustomerPatienceLoop() {
  if (customerPatienceFrame === null) return;
  window.cancelAnimationFrame(customerPatienceFrame);
  customerPatienceFrame = null;
}

function refreshCustomerPatience() {
  customerPatienceFrame = null;
  if (state.gamePaused) return;

  let hasWaitingCustomer = false;
  state.customers.forEach((customer) => {
    if (customer.served || customer.leaving) return;
    const card = customerCardFor(customer.id);
    const fill = card?._patienceFill;
    if (!fill) return;
    hasWaitingCustomer = true;
    fill.style.transform = `scaleX(${getPatience(customer) / 100})`;
  });

  if (hasWaitingCustomer) customerPatienceFrame = window.requestAnimationFrame(refreshCustomerPatience);
}

function ensureCustomerPatienceLoop() {
  if (state.gamePaused || customerPatienceFrame !== null) return;
  if (!state.customers.some((customer) => !customer.served && !customer.leaving)) return;
  customerPatienceFrame = window.requestAnimationFrame(refreshCustomerPatience);
}

function createCustomerCard(customer) {
  const card = document.createElement('article');
  const motion = document.createElement('div');
  const avatar = document.createElement('img');
  const order = document.createElement('div');
  const wait = document.createElement('div');
  const fill = document.createElement('i');
  const receivedSushi = document.createElement('img');

  card.className = 'customer is-entering';
  card.dataset.customerId = customer.id;
  motion.className = 'customer-motion';
  avatar.className = 'customer-avatar';
  avatar.draggable = false;
  avatar.addEventListener('click', (event) => {
    if (avatar.tabIndex !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    evictBeggar(card.dataset.customerId);
  });
  avatar.addEventListener('keydown', (event) => {
    if (avatar.tabIndex !== 0 || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    evictBeggar(card.dataset.customerId);
  });
  order.className = 'customer-order';
  wait.className = 'customer-wait';
  wait.append(fill);
  card._patienceFill = fill;
  receivedSushi.className = 'customer-received-sushi is-hidden';
  receivedSushi.alt = '顾客拿到的寿司';
  receivedSushi.draggable = false;
  motion.append(avatar, order, wait, receivedSushi);
  card.append(motion);
  card.addEventListener('animationend', (event) => {
    if (event.animationName === 'customer-enter') card.classList.remove('is-entering');
  });
  return card;
}

function appendCustomerOrderItem(order, item) {
  const itemWrap = document.createElement('span');
  const icon = document.createElement('img');

  itemWrap.className = 'customer-order-item';
  itemWrap.style.cssText = 'position:relative;display:inline-grid;place-items:center;width:1.72em;height:1.72em;flex:0 0 auto;';
  itemWrap.title = `${orderItemName(item)}${item.fulfilled ? '（已交付）' : ''}`;
  icon.src = orderItemAsset(item);
  icon.alt = item.fulfilled ? `${orderItemName(item)}，已交付` : orderItemName(item);
  icon.draggable = false;

  if (item.fulfilled) {
    icon.style.cssText = 'opacity:.36;filter:grayscale(1) brightness(.82);';
    const check = document.createElement('b');
    check.textContent = '✓';
    check.setAttribute('aria-hidden', 'true');
    check.style.cssText = 'position:absolute;right:-.28em;bottom:-.28em;display:grid;place-items:center;width:.9em;height:.9em;border:1px solid #704331;border-radius:999px;color:#fff8dc;background:#70af77;font-size:.76em;line-height:1;box-shadow:0 1px 0 rgb(90 57 45 / .22);';
    itemWrap.append(icon, check);
  } else {
    itemWrap.append(icon);
  }

  order.append(itemWrap);
}

function customerOrderSignature(customer) {
  const status = customer.served ? 'served' : customer.leaving ? 'leaving' : 'waiting';
  const items = (customer.orderItems ?? []).map((item) => `${item.type}:${item.id ?? 'tea'}:${item.fulfilled ? 1 : 0}`);
  return `${status}|${items.join('|')}`;
}

function updateCustomerCard(card, customer) {
  const avatar = card.querySelector('.customer-avatar');
  const order = card.querySelector('.customer-order');
  const wait = card.querySelector('.customer-wait');
  const fill = wait.querySelector('i');
  const receivedSushi = card.querySelector('.customer-received-sushi');
  const orderItems = customer.orderItems ?? [];

  const avatarSrc = `${CUSTOMER_ASSET_PATH}${customer.avatar}`;
  if (avatar.getAttribute('src') !== avatarSrc) avatar.src = avatarSrc;
  const isBeggar = customer.customerType === 'beggar';
  const canEvictBeggar = isBeggar && !customer.served && !customer.leaving && isServingDay() && !state.gamePaused;
  avatar.alt = canEvictBeggar
    ? '逃单客，点击驱逐'
    : isBeggar && customer.fledWithoutPay
      ? '逃单客正在离开'
      : '正在等待点寿司的顾客';
  avatar.tabIndex = canEvictBeggar ? 0 : -1;
  avatar.setAttribute('role', canEvictBeggar ? 'button' : 'img');
  avatar.title = canEvictBeggar ? '点击驱逐' : '';
  card.classList.toggle('is-beggar', isBeggar);
  card.classList.toggle('is-impatient', customer.customerType === 'impatient');
  card.classList.toggle('is-large-order', customer.customerType === 'large-order');
  card.classList.toggle('is-regular', customer.customerType === 'regular');
  card.classList.toggle('is-serving', Boolean(customer.served));
  card.classList.toggle('is-leaving', Boolean(customer.leaving));
  receivedSushi.classList.add('is-hidden');
  const signature = customerOrderSignature(customer);
  if (order.dataset.signature !== signature) {
    order.replaceChildren();
    order.dataset.signature = signature;
    order.setAttribute('aria-label', `订单：${orderSummary(orderItems)}`);

    if (customer.served) {
      order.append(customer.fledWithoutPay ? '逃单了' : '谢谢！');
    } else if (customer.leaving) {
      order.append('下次见');
    } else {
      orderItems.forEach((item) => appendCustomerOrderItem(order, item));
    }
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
  const currentCards = Array.from(customerQueue.children);
  const currentIds = currentCards.map((card) => card.dataset.customerId);
  const desiredIdList = state.customers.map((customer) => customer.id);
  const desiredIds = new Set(desiredIdList);
  const layoutChanged = currentIds.length !== desiredIdList.length
    || currentIds.some((id, index) => id !== desiredIdList[index]);
  const beforeRects = layoutChanged
    ? new Map(currentCards.map((card) => [card.dataset.customerId, card.getBoundingClientRect()]))
    : null;
  Array.from(customerQueue.children).forEach((card) => {
    if (!desiredIds.has(card.dataset.customerId)) card.remove();
  });
  state.customers.forEach((customer, index) => {
    const card = customerCardFor(customer.id) ?? createCustomerCard(customer);
    updateCustomerCard(card, customer);
    if (customerQueue.children[index] !== card) customerQueue.append(card);
  });
  if (beforeRects) animateCustomerReflow(beforeRects);
  ensureCustomerPatienceLoop();
}

function fadeOutCustomer(customer, { holdMs = 0, scheduleNext = true } = {}) {
  if (customer.leaving || customerExitTimers.has(customer.id)) return;
  const startFade = () => {
    customer.leaving = true;
    renderCustomers();
    customerExitTimers.set(customer.id, setGameplayTimeout(() => {
      customerExitTimers.delete(customer.id);
      const index = state.customers.findIndex((waitingCustomer) => waitingCustomer.id === customer.id);
      if (index !== -1) state.customers.splice(index, 1);
      render();
      scheduleSave();
      if (scheduleNext) scheduleCustomer(950);
    }, CUSTOMER_EXIT_MS));
  };
  if (holdMs <= 0) {
    startFade();
    return;
  }
  customerExitTimers.set(customer.id, setGameplayTimeout(startFade, holdMs));
}

function scheduleCustomer(delay = CUSTOMER_ARRIVAL_DELAY_MS) {
  if (customerSpawnTimer) clearGameplayTimeout(customerSpawnTimer);
  customerSpawnTimer = null;
  if (tutorialNeedsCompletion() || !isServingDay() || state.gamePaused || state.customers.length >= MAX_WAITING_CUSTOMERS) return;
  customerSpawnTimer = setGameplayTimeout(() => {
    customerSpawnTimer = null;
    if (tutorialNeedsCompletion() || !isServingDay() || state.gamePaused || state.customers.length >= MAX_WAITING_CUSTOMERS) return;
    const template = nextCustomerTemplate();
    const orderItems = createCustomerOrder(template);
    const customer = {
      ...template,
      id: `${state.customerSerial}-${Date.now()}`,
      orderItems,
      price: template.customerType === 'beggar' ? 0 : orderItems.reduce((total, item) => total + item.price, 0),
      arrivedAt: gameplayNow(),
      served: false,
      leaving: false,
      day: state.day,
      dayResolved: false,
    };
    state.customerSerial += 1;
    state.customers.push(customer);
    customerLeaveTimers.set(customer.id, setGameplayTimeout(() => customerLeaves(customer.id), customerWaitDuration(customer)));
    setMessage(template.customerType === 'beggar'
      ? '逃单客出现了，点击他可以驱逐。'
      : `有客人来了，想要${orderSummary(orderItems)}。`);
    render();
    scheduleCustomer();
  }, delay);
}

function customerLeaves(customerId) {
  const customer = state.customers.find((waitingCustomer) => waitingCustomer.id === customerId);
  customerLeaveTimers.delete(customerId);
  if (!customer || customer.served || customer.leaving || state.gamePaused) return;
  resolveDayCustomer(customer);
  setMessage('有位客人等太久离开了。');
  fadeOutCustomer(customer);
}

function evictBeggar(customerId) {
  const customer = state.customers.find((waitingCustomer) => waitingCustomer.id === customerId);
  if (!customer || customer.customerType !== 'beggar' || customer.served || customer.leaving || state.gamePaused || !isServingDay() || customerExitTimers.has(customer.id)) return false;

  const leaveTimer = customerLeaveTimers.get(customer.id);
  if (leaveTimer) clearGameplayTimeout(leaveTimer);
  customerLeaveTimers.delete(customer.id);
  resolveDayCustomer(customer);
  setMessage('已驱逐逃单客。');
  fadeOutCustomer(customer);
  scheduleSave();
  return true;
}

function canContinueCurrentDay() {
  return state.dayPhase === 'settlement'
    && state.dayEndedEarly
    && state.dayTimeRemainingMs > 0;
}

function resumeShop() {
  if (state.dayPhase !== 'settlement') return;
  const continuingCurrentDay = canContinueCurrentDay();
  clearCustomerTimers();
  if (!continuingCurrentDay) {
    state.day += 1;
    state.dayCustomersFinished = 0;
    state.dayCustomersServed = 0;
    state.dayIncome = 0;
    state.dayTimeRemainingMs = dayDurationForDay(state.day);
  }
  state.dayPhase = 'service';
  state.dayTimerStarted = false;
  state.dayTimerStartedAt = 0;
  state.dayEndedEarly = false;
  state.daySummaryOpen = false;
  daySummaryTransitioning = false;
  state.shopOpen = true;
  state.shopPanelOpen = false;
  state.sashimiPickerOpen = false;
  setMessage(continuingCurrentDay ? `继续第 ${state.day} 天营业。` : `第 ${state.day} 天开始营业。`);
  render();
  startDayClock();
  scheduleCustomer(550);
  scheduleSave();
}

function goFishing() {
  if (state.gamePaused) return;
  if (state.dayPhase !== 'settlement') {
    setMessage('本日结算后，再去海边钓鱼补货。');
    return;
  }
  if (hasUnsettledSaveState()) {
    setMessage('先等手上的食材处理完成，再带着鱼篓出门。');
    return;
  }
  if (!saveGame()) {
    setMessage('进度还在保存，等一下再去钓鱼。');
    return;
  }
  window.location.assign('index.html?scene=fishing');
}

function pauseGame() {
  if (state.gamePaused) return;
  clearIngredientDrag();
  stopCustomerPatienceLoop();
  stopDayClockLoop();
  state.activeCut = null;
  state.activeShrimpCut = null;
  state.pauseSettingsOpen = false;
  pauseOverlayClosing = false;
  pauseStartedAt = performance.now();
  state.gamePaused = true;
  pauseGameplayTimeouts();
  setMessage('游戏已暂停。');
  render();
  window.requestAnimationFrame(() => resumeGameButton.focus());
}

function resumeGame() {
  if (!state.gamePaused) return;
  accumulatedPausedTime += performance.now() - pauseStartedAt;
  pauseStartedAt = 0;
  state.gamePaused = false;
  state.pauseSettingsOpen = false;
  pauseOverlayClosing = true;
  gamePauseOverlay.setAttribute('aria-hidden', 'true');
  closeModal(gamePauseOverlay, 220, () => {
    pauseOverlayClosing = false;
  });
  resumeGameplayTimeouts();
  setMessage('继续游戏。');
  render();
  ensureCustomerPatienceLoop();
  ensureDayClockLoop();
  window.requestAnimationFrame(() => gamePauseButton.focus());
}

function toggleGamePause() {
  if (state.gamePaused) resumeGame();
  else pauseGame();
}

function openGameSettings() {
  if (!state.gamePaused) return;
  state.pauseSettingsOpen = true;
  render();
  window.requestAnimationFrame(() => motionSettingButton.focus());
}

function closeGameSettings() {
  if (!state.gamePaused) return;
  state.pauseSettingsOpen = false;
  render();
  window.requestAnimationFrame(() => openGameSettingsButton.focus());
}

function toggleReducedMotion() {
  gameSettings.reducedMotion = !gameSettings.reducedMotion;
  saveGameSettings();
  render();
}

function exitGame() {
  if (!state.gamePaused || stage.classList.contains('is-exiting-game')) return;
  exitGameButton.disabled = true;
  exitGameButton.setAttribute('aria-busy', 'true');
  saveGame();
  stage.classList.add('is-exiting-game');
  exitLoadingOverlay.setAttribute('aria-hidden', 'false');
  const exitDelay = gameSettings.reducedMotion ? 1 : 900;
  window.setTimeout(() => window.location.assign('index.html?returning=1'), exitDelay);
}

function blockPausedGameInput(event) {
  if ((!state.gamePaused && !pauseOverlayClosing) || event.target.closest?.('#game-pause-overlay')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function blockShopPanelInput(event) {
  const shopEvent = event.target instanceof Node && ingredientShopPanel.contains(event.target);
  if ((!state.shopPanelOpen && !shopPanelClosing) || shopEvent) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function blockSettledDayInput(event) {
  if (state.dayPhase !== 'settlement') return;
  if (daySummaryTransitioning) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  const target = event.target instanceof Node ? event.target : null;
  const allowed = target?.closest('#day-summary-overlay, #settlement-actions, #ingredient-shop-panel, #game-pause-button, #game-pause-overlay');
  if (allowed) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function trapShopPanelFocus(event) {
  if (!state.shopPanelOpen || event.key !== 'Tab') return;
  const focusable = Array.from(ingredientShopPanel.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'))
    .filter((element) => !element.classList.contains('is-hidden'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function blockTutorialWelcomeInput(event) {
  const tutorialEvent = event.target instanceof Node && tutorialGuide.contains(event.target);
  if (!tutorialNeedsCompletion() || state.tutorialStarted || tutorialEvent) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

stage.addEventListener('pointerdown', blockPausedGameInput, true);
stage.addEventListener('click', blockPausedGameInput, true);
stage.addEventListener('keydown', blockPausedGameInput, true);
stage.addEventListener('pointerdown', blockShopPanelInput, true);
stage.addEventListener('click', blockShopPanelInput, true);
stage.addEventListener('keydown', blockShopPanelInput, true);
stage.addEventListener('pointerdown', blockSettledDayInput, true);
stage.addEventListener('click', blockSettledDayInput, true);
stage.addEventListener('keydown', blockSettledDayInput, true);
window.addEventListener('pointerdown', blockTutorialWelcomeInput, true);
window.addEventListener('keydown', blockTutorialWelcomeInput, true);
window.addEventListener('keydown', trapShopPanelFocus, true);

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  if (daySummaryTransitioning || shopPanelClosing || pauseOverlayClosing) return;
  if (state.daySummaryOpen) {
    dismissDaySummary();
    return;
  }
  if (state.shopPanelOpen) {
    closeIngredientShop();
    return;
  }
  toggleGamePause();
}, true);

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
  if (state.gamePaused) return;
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
  if (state.sushiStored >= storageCapacityFor('sushi')) {
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
  const sushiGrid = storageGridFor('sushi');
  const makingSushi = playSushiMakingAnimation(sushiType.id);
  setMessage(`正在捏制${sushiType.name}寿司。`);
  render();
  setGameplayTimeout(() => {
    makingSushi.maker.remove();
    if (animationVersion !== state.flightVersion) return;
    flyCompletedItem({
      className: 'sushi',
      src: sushiAsset(sushiType.id, 'nigiri'),
      sourceRect: makingSushi.sourceRect,
      targetRect,
      targetIndex,
      columns: sushiGrid.columns,
      rows: sushiGrid.rows,
      gap: 0.04,
      displayScale: 1.12,
      onFinish: () => {
        state.incomingSushi = Math.max(0, state.incomingSushi - 1);
        setMessage(`${sushiType.name}寿司做好了，已放进寿司架。`);
        render();
        if (!state.incomingSushi) scheduleSave();
      },
    });
  }, motionDuration(420));
}

function renderSlices() {
  const displayedTypes = state.sliceTypes.slice(0, Math.max(0, state.sliceTypes.length - state.incomingSlices));
  const existingItems = Array.from(sliceRack.children);
  existingItems.slice(displayedTypes.length).forEach((item) => item.remove());

  displayedTypes.forEach((ingredientId, index) => {
    const sushiType = sushiTypeFor(ingredientId);
    let slice = existingItems[index];
    if (!slice) {
      slice = document.createElement('button');
      const sliceImage = document.createElement('img');
      slice.type = 'button';
      slice.className = 'sushi-slice-crop';
      sliceImage.alt = '';
      sliceImage.draggable = false;
      slice.addEventListener('pointerdown', prepareSliceDrag);
      slice.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        makeSushi(slice.dataset.ingredientId);
      });
      slice.append(sliceImage);
      sliceRack.append(slice);
    }

    const sliceImage = slice.querySelector('img');
    slice.dataset.ingredientId = sushiType.id;
    slice.setAttribute('aria-label', `第 ${index + 1} 片${sushiType.name}，拖到米饭上制作寿司`);
    const nextSource = sushiAsset(sushiType.id, 'slice');
    if (sliceImage.getAttribute('src') !== nextSource) sliceImage.src = nextSource;
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
      item.className = 'stored-sushi stored-sushi-button';
      item.addEventListener('pointerdown', prepareSushiServeDrag);
      item.append(document.createElement('img'));
      sushiRack.append(item);
    }
    const image = item.querySelector('img');
    item.dataset.ingredientId = sushiType.id;
    item.setAttribute('aria-label', `第 ${index + 1} 份${sushiType.name}寿司，拖给顾客`);
    const nextSource = sushiAsset(sushiType.id, 'nigiri');
    if (image.getAttribute('src') !== nextSource) image.src = nextSource;
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
    const drink = document.createElement('button');
    const image = document.createElement('img');
    drink.type = 'button';
    drink.className = 'stored-drink stored-sushi-button';
    drink.setAttribute('aria-label', `第 ${index + 1} 杯茶，拖给顾客`);
    drink.addEventListener('pointerdown', prepareDrinkServeDrag);
    image.src = `${KITCHEN_ASSET_PATH}tea-cup-ready.png`;
    image.alt = '一杯茶';
    image.draggable = false;
    drink.append(image);
    drinkRack.append(drink);
  }
}

function renderSashimiChoices() {
  sashimiChoices.forEach((choice) => {
    const ingredientId = choice.dataset.ingredientId;
    const unlocked = isIngredientUnlocked(ingredientId);
    const stocked = hasRawFish(ingredientId);
    const stockLabel = choice.querySelector('[data-fish-stock]');
    show(choice, unlocked);
    choice.disabled = !unlocked || !stocked;
    choice.classList.toggle('is-out-of-stock', unlocked && !stocked);
    if (stockLabel && needsFishing(ingredientId)) stockLabel.textContent = `库存 ${rawFishCount(ingredientId)}`;
    choice.title = unlocked
      ? stocked
        ? needsFishing(ingredientId) ? `鱼篓库存：${rawFishCount(ingredientId)}` : '玉子烧无限供应'
        : `库存为 0，今天结算后去钓鱼获得${sushiName(ingredientId)}`
      : '先在食材商店购买这个鱼种';
  });
}

function shopPreviewAsset(ingredientId) {
  if (ingredientId === 'tea') return `${KITCHEN_ASSET_PATH}tea-cup-ready.png`;
  return ingredientId === 'shrimp'
    ? `${KITCHEN_ASSET_PATH}shrimp-whole.png`
    : sushiAsset(ingredientId, 'loin');
}

function storageUpgradePreviewAsset(upgrade) {
  return `${KITCHEN_ASSET_PATH}${upgrade.asset}`;
}

function renderStorageUpgrades() {
  storageUpgradeItems.replaceChildren();

  STORAGE_UPGRADES.forEach((upgrade) => {
    const level = storageLevelFor(upgrade.id);
    const currentCapacity = storageCapacityFor(upgrade.id);
    const maxed = storageUpgradeIsMaxed(upgrade);
    const nextCapacity = maxed ? currentCapacity : upgrade.capacities[level + 1];
    const nextPrice = maxed ? null : upgrade.prices[level];
    const needsTea = Boolean(upgrade.requiresTea && !isTeaUnlocked());
    const canAfford = !maxed && state.cash >= nextPrice;
    const item = document.createElement('article');
    const image = document.createElement('img');
    const detail = document.createElement('div');
    const name = document.createElement('b');
    const price = document.createElement('span');
    const button = document.createElement('button');

    item.className = `ingredient-shop-item storage-upgrade-item${level ? ' is-owned' : ''}${maxed ? ' is-maxed' : ''}`;
    image.src = storageUpgradePreviewAsset(upgrade);
    image.alt = upgrade.name;
    image.draggable = false;
    name.textContent = upgrade.name;
    price.textContent = maxed
      ? `已扩至 ${currentCapacity} 格`
      : needsTea
        ? '先购买茶饮配方'
        : `${currentCapacity} → ${nextCapacity} 格 · 第${level + 1}/${upgrade.prices.length}次 · ¥${nextPrice}`;
    detail.append(name, price);

    button.type = 'button';
    button.disabled = maxed || needsTea || !canAfford;
    button.textContent = maxed
      ? '已扩到最大'
      : needsTea
        ? '先买茶饮配方'
        : canAfford
          ? `扩容 ¥${nextPrice}`
          : `余额不足 ¥${nextPrice}`;
    button.title = maxed
      ? `${upgrade.name}已扩到最大`
      : needsTea
        ? '先购买茶饮配方，才能扩容茶水架'
        : canAfford
          ? `第 ${level + 1}/${upgrade.prices.length} 次：把${upgrade.name}从 ${currentCapacity} 格扩到 ${nextCapacity} 格`
          : `余额不足，还差 ¥${nextPrice - state.cash}`;
    button.addEventListener('click', () => buyStorageUpgrade(upgrade.id));
    item.append(image, detail, button);
    storageUpgradeItems.append(item);
  });
}

function renderIngredientShop() {
  const canUseShop = state.dayPhase === 'settlement' && !state.gamePaused && !tutorialNeedsCompletion();
  if (!canUseShop) state.shopPanelOpen = false;
  const isOpen = state.shopPanelOpen && canUseShop;
  setModalVisibility(ingredientShopPanel, isOpen, 230);
  show(ingredientShopToggle, canUseShop);
  ingredientShopToggle.setAttribute('aria-expanded', String(isOpen));
  ingredientShopPanel.setAttribute('aria-hidden', String(!isOpen));
  ingredientShopCash.textContent = `¥${state.cash}`;
  if (!isOpen) {
    shopRenderSignature = '';
    return;
  }

  const nextSignature = [
    state.cash,
    state.teaUnlocked ? 1 : 0,
    state.unlockedIngredients.join(','),
    ...STORAGE_UPGRADES.map((upgrade) => storageLevelFor(upgrade.id)),
  ].join('|');
  if (nextSignature === shopRenderSignature) return;
  shopRenderSignature = nextSignature;
  ingredientShopItems.replaceChildren();

  SHOP_ITEMS.forEach((shopItem) => {
    const itemName = shopItemName(shopItem);
    const unlocked = isShopItemUnlocked(shopItem);
    const isFish = needsFishing(shopItem.id);
    const canAfford = state.cash >= shopItem.price;
    const item = document.createElement('article');
    const image = document.createElement('img');
    const detail = document.createElement('div');
    const name = document.createElement('b');
    const price = document.createElement('span');
    const button = document.createElement('button');

    item.className = `ingredient-shop-item${unlocked ? ' is-owned' : ''}`;
    image.src = shopPreviewAsset(shopItem.id);
    image.alt = itemName;
    image.draggable = false;
    name.textContent = itemName;
    price.textContent = unlocked
      ? isFish ? '已解锁 · 去钓鱼' : '已购买'
      : `¥${shopItem.price}`;
    detail.append(name, price);

    button.type = 'button';
    button.disabled = unlocked || !canAfford;
    button.textContent = unlocked
      ? isFish ? '钓点已开放' : '已购买'
      : canAfford
        ? `购买 ¥${shopItem.price}`
        : `余额不足 ¥${shopItem.price}`;
    button.title = unlocked
      ? isFish ? '已解锁：每天结算后可以去钓鱼获得' : '这个项目已经解锁'
      : canAfford ? `购买${itemName}` : `余额不足，还差 ¥${shopItem.price - state.cash}`;
    button.addEventListener('click', () => buyIngredient(shopItem.id));
    item.append(image, detail, button);
    ingredientShopItems.append(item);
  });

  renderStorageUpgrades();
}

function renderDaySummary() {
  const showSummary = state.dayPhase === 'settlement' && state.daySummaryOpen;
  if (showSummary) openModal(daySummaryOverlay);
  else if (!daySummaryTransitioning) closeModal(daySummaryOverlay, 230);
  daySummaryOverlay.setAttribute('aria-hidden', String(!showSummary));
  daySummaryTitle.textContent = '今天结束';
  openShopButton.textContent = canContinueCurrentDay()
    ? `继续第 ${state.day} 天`
    : `开始第 ${state.day + 1} 天`;
}

function dismissDaySummary() {
  if (!state.daySummaryOpen) return;
  state.daySummaryOpen = false;
  daySummaryTransitioning = true;
  daySummaryOverlay.setAttribute('aria-hidden', 'true');
  closeModal(daySummaryOverlay, 230, () => {
    daySummaryTransitioning = false;
    render();
    window.requestAnimationFrame(() => ingredientShopToggle.focus());
  });
  render();
}

function toggleIngredientShop() {
  if (state.gamePaused || shopPanelClosing) return;
  if (state.shopPanelOpen) {
    closeIngredientShop();
    return;
  }
  if (tutorialNeedsCompletion()) {
    setMessage('完成或跳过新手教程后，再去采购。');
    return;
  }
  if (state.dayPhase !== 'settlement') {
    setMessage('本日结算后，再去采购食材。');
    return;
  }
  state.shopPanelOpen = true;
  render();
  window.requestAnimationFrame(() => ingredientShopClose.focus());
}

function closeIngredientShop() {
  if (!state.shopPanelOpen || shopPanelClosing) return;
  state.shopPanelOpen = false;
  shopPanelClosing = true;
  ingredientShopPanel.setAttribute('aria-hidden', 'true');
  closeModal(ingredientShopPanel, 230, () => {
    shopPanelClosing = false;
    render();
    window.requestAnimationFrame(() => ingredientShopToggle.focus());
  });
  render();
}

function buyIngredient(ingredientId) {
  if (state.gamePaused || state.dayPhase !== 'settlement') return;
  const shopItem = shopItemFor(ingredientId);
  if (!shopItem || isShopItemUnlocked(shopItem)) return;
  const itemName = shopItemName(shopItem);
  if (state.cash < shopItem.price) {
    setMessage(`余额不足，还差 ¥${shopItem.price - state.cash} 才能购买${itemName}。`);
    render();
    return;
  }
  state.cash -= shopItem.price;
  if (ingredientId === 'tea') {
    state.teaUnlocked = true;
    setMessage('茶饮配方已解锁，饮品机和顾客订单都会出现茶。');
  } else {
    state.unlockedIngredients = [...state.unlockedIngredients, ingredientId];
    setMessage(`${sushiName(ingredientId)}钓点已开放。它不会直接加入冰柜，每天结算后去钓鱼获得。`);
  }
  // Save the unlock immediately. `goFishing()` also saves before navigation,
  // but this prevents a just-bought fishing spot from disappearing on a fast
  // refresh or an interrupted scene change.
  if (!saveGame()) scheduleSave();
  render();
}

function buyStorageUpgrade(storageId) {
  if (state.gamePaused || state.dayPhase !== 'settlement') return;
  const upgrade = storageUpgradeFor(storageId);
  if (!upgrade || storageUpgradeIsMaxed(upgrade)) return;
  if (upgrade.requiresTea && !isTeaUnlocked()) {
    setMessage('先购买茶饮配方，才能扩容茶水架。');
    render();
    return;
  }
  const price = upgrade.prices[storageLevelFor(storageId)];
  if (state.cash < price) {
    setMessage(`余额不足，还差 ¥${price - state.cash} 才能扩容${upgrade.name}。`);
    render();
    return;
  }

  const previousCapacity = storageCapacityFor(storageId);
  const nextLevel = storageLevelFor(storageId) + 1;
  state.cash -= price;
  state.storageLevels = { ...state.storageLevels, [storageId]: nextLevel };
  setMessage(`${upgrade.name}已扩容：${previousCapacity} → ${storageCapacityFor(storageId)} 格。`);
  if (!saveGame()) scheduleSave();
  render();
}

function renderStorageLayouts() {
  const sliceGrid = storageGridFor('slices');
  const sushiGrid = storageGridFor('sushi');
  const drinkGrid = storageGridFor('drinks');
  sliceRack.style.setProperty('--slice-columns', String(sliceGrid.columns));
  sliceRack.style.setProperty('--slice-rows', String(sliceGrid.rows));
  sushiRack.style.setProperty('--stock-columns', String(sushiGrid.columns));
  sushiRack.style.setProperty('--stock-rows', String(sushiGrid.rows));
  drinkRack.style.setProperty('--drink-columns', String(drinkGrid.columns));
  drinkRack.style.setProperty('--drink-rows', String(drinkGrid.rows));
}

function renderShrimpBatch() {
  const remainingShrimp = state.shrimpBatch.filter((shrimp) => !shrimp.cut);
  show(shrimpBatch, state.shrimpOnBoard && remainingShrimp.length > 0);
  const remainingIds = new Set(remainingShrimp.map((shrimp) => shrimp.id));
  const existingItems = new Map(Array.from(shrimpBatch.children).map((item) => [item.dataset.shrimpId, item]));
  existingItems.forEach((item, shrimpId) => {
    if (!remainingIds.has(shrimpId)) item.remove();
  });

  remainingShrimp.forEach((shrimp, index) => {
    let item = existingItems.get(shrimp.id);
    if (!item) {
      item = document.createElement('button');
      const image = document.createElement('img');
      const guide = document.createElement('span');
      item.type = 'button';
      item.className = 'shrimp-batch-item';
      image.src = `${KITCHEN_ASSET_PATH}shrimp-whole.png`;
      image.alt = '带头甜虾';
      image.draggable = false;
      guide.className = 'shrimp-head-cut-guide';
      guide.setAttribute('aria-hidden', 'true');
      item.append(image, guide);
      item.addEventListener('pointerdown', startShrimpCut);
      item.addEventListener('pointermove', moveShrimpCut);
      item.addEventListener('pointerup', cancelShrimpCut);
      item.addEventListener('pointercancel', cancelShrimpCut);
      item.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (hasRoomForShrimp()) finishShrimpPrep(item.dataset.shrimpId, item);
        else setMessage('配料架空间不够，先做几份寿司再处理甜虾。');
      });
    }

    item.dataset.shrimpId = shrimp.id;
    item.setAttribute('aria-label', `第 ${index + 1} 只甜虾，在竖向虚线附近按住后向下滑动去头`);
    item.classList.toggle('is-cutting', state.activeShrimpCut === shrimp.id);
    if (shrimpBatch.children[index] !== item) shrimpBatch.append(item);
  });
}

function renderShrimpHeads() {
  show(shrimpHeadRack, state.shrimpHeads.length > 0);
  const headIds = new Set(state.shrimpHeads.map((head) => head.id));
  const existingItems = new Map(Array.from(shrimpHeadRack.children).map((item) => [item.dataset.shrimpHeadId, item]));
  existingItems.forEach((item, headId) => {
    if (!headIds.has(headId)) item.remove();
  });

  state.shrimpHeads.forEach((head, index) => {
    let item = existingItems.get(head.id);
    if (!item) {
      item = document.createElement('button');
      const image = document.createElement('img');
      item.type = 'button';
      item.className = 'shrimp-head';
      image.src = `${KITCHEN_ASSET_PATH}shrimp-head.png`;
      image.alt = '待丢弃的虾头';
      image.draggable = false;
      item.append(image);
      item.addEventListener('pointerdown', prepareShrimpHeadDrag);
    }

    item.dataset.shrimpHeadId = head.id;
    item.setAttribute('aria-label', `第 ${index + 1} 个虾头，拖到垃圾桶`);
    if (shrimpHeadRack.children[index] !== item) shrimpHeadRack.append(item);
  });
}

function render() {
  syncTutorialProgress();
  if (maybeEndDayForMissingFish()) return;
  stage.classList.toggle('is-game-paused', state.gamePaused);
  stage.classList.toggle('is-day-settled', state.dayPhase === 'settlement');
  stage.classList.toggle('is-reduced-motion', gameSettings.reducedMotion);
  setModalVisibility(gamePauseOverlay, state.gamePaused, 220);
  gamePauseOverlay.setAttribute('aria-hidden', String(!state.gamePaused));
  show(gamePauseMenu, !state.pauseSettingsOpen);
  show(gameSettingsPanel, state.pauseSettingsOpen);
  gamePauseButton.textContent = state.gamePaused ? '继续游戏' : '暂停';
  gamePauseButton.setAttribute('aria-pressed', String(state.gamePaused));
  motionSettingButton.textContent = gameSettings.reducedMotion ? '已关闭' : '已开启';
  motionSettingButton.setAttribute('aria-pressed', String(!gameSettings.reducedMotion));
  const backgroundSource = `${KITCHEN_ASSET_PATH}kitchen-background.jpg`;
  if (sceneBackground.getAttribute('src') !== backgroundSource) sceneBackground.src = backgroundSource;
  sceneBackground.alt = '海边寿司店后台';
  const boardSushiType = sushiTypeFor(state.boardIngredientId);
  const servingDay = isServingDay();
  stageName.textContent = servingDay
    ? `第 ${state.day} 天营业`
    : state.dayEndedEarly
      ? `第 ${state.day} 天补货中`
      : `第 ${state.day} 天休息中`;
  dayLabel.textContent = `第 ${state.day} 天`;
  dayStatus.textContent = state.dayPhase === 'settlement'
    ? state.dayEndedEarly ? '补货后继续' : '今日已结束'
    : tutorialNeedsCompletion()
      ? '新手教程'
      : `剩余 ${formatDayTime(dayTimeRemaining())}`;
  cashValue.textContent = `¥${state.cash}`;
  renderStorageLayouts();
  freezerButton.classList.toggle('is-active', state.sashimiPickerOpen);
  sashimiPicker.classList.remove('is-picked');
  setModalVisibility(sashimiPicker, state.sashimiPickerOpen, 160);
  renderSashimiChoices();
  renderIngredientShop();
  renderDaySummary();
  show(boardSalmon, state.salmonOnBoard);
  const boardIngredientSource = sushiAsset(boardSushiType.id, 'loin');
  if (boardIngredientImage.getAttribute('src') !== boardIngredientSource) boardIngredientImage.src = boardIngredientSource;
  boardIngredientImage.alt = `待切${boardSushiType.name}`;
  boardSalmon.setAttribute('aria-label', `${boardSushiType.boardName}，在虚线附近按住并向下滑动切片`);
  boardSalmon.classList.toggle('is-cutting', state.activeCut !== null);
  boardSalmon.classList.remove('is-shrimp', 'is-shrimp-cutting');
  const completedCuts = state.cutLines.filter(Boolean).length;
  const croppedLeft = completedCuts ? CUT_LINES[completedCuts - 1] : 0;
  boardSalmon.style.clipPath = state.salmonOnBoard ? `inset(0 0 0 ${croppedLeft * 100}%)` : '';
  boardSalmon.querySelectorAll('.cut-guide').forEach((guide, index) => {
    guide.classList.toggle('is-cut', state.cutLines[index]);
    guide.classList.toggle('is-active', state.activeCut === index);
  });
  renderShrimpBatch();
  renderShrimpHeads();
  trashBin.classList.toggle('is-discarding', state.shrimpHeadDiscarding);
  const showSettlementActions = state.dayPhase === 'settlement' && !state.daySummaryOpen && !daySummaryTransitioning;
  show(settlementActions, showSettlementActions);
  show(openShopButton, showSettlementActions);
  show(goFishingButton, showSettlementActions);
  settlementActions.setAttribute('aria-label', state.dayEndedEarly ? '补货操作' : '今日结束操作');
  const teaUnlocked = isTeaUnlocked();
  if (!teaUnlocked && (state.cupOnMachine || state.drinkPouring || state.incomingDrinks)) {
    state.cupOnMachine = false;
    state.drinkPouring = false;
    state.incomingDrinks = 0;
    state.drinkVersion += 1;
  }
  show(drinkMachine, teaUnlocked);
  show(cupStation, teaUnlocked);
  show(drinkRack, teaUnlocked);
  show(machineCup, teaUnlocked && state.cupOnMachine);
  drinkMachine.setAttribute('aria-hidden', String(!teaUnlocked));
  cupStation.setAttribute('aria-hidden', String(!teaUnlocked));
  drinkRack.setAttribute('aria-hidden', String(!teaUnlocked));
  machineCup.setAttribute('aria-hidden', String(!teaUnlocked));
  const machineCupSource = state.drinkPouring
    ? `${KITCHEN_ASSET_PATH}tea-cup-ready.png`
    : `${KITCHEN_ASSET_PATH}tea-cup-empty.png`;
  if (machineCup.getAttribute('src') !== machineCupSource) machineCup.src = machineCupSource;
  machineCup.classList.toggle('is-filling', state.drinkPouring);
  drinkMachine.classList.toggle('is-pouring', state.drinkPouring);
  drinkMachine.classList.remove('is-locked');
  cupStation.classList.remove('is-locked');
  drinkMachine.setAttribute('aria-disabled', 'false');
  cupStation.setAttribute('aria-disabled', 'false');
  drinkMachine.title = '点击接茶';
  cupStation.title = '拖出空杯';
  renderSlices();
  renderStockRack(riceRack, state.riceStored - state.incomingRice, 'stored-rice', `${KITCHEN_ASSET_PATH}rice-portion.png`, '一团米饭');
  renderSushiRack();
  if (teaUnlocked) renderDrinks();
  else drinkRack.replaceChildren();
  renderCustomers();
  renderTutorial();
}

function pointIsInside(event, element) {
  const bounds = element.getBoundingClientRect();
  return event.clientX >= bounds.left && event.clientX <= bounds.right
    && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
}

function moveDragPreview(event) {
  if (!ingredientDrag) return;
  ingredientDrag.pointerX = event.clientX;
  ingredientDrag.pointerY = event.clientY;
  if (ingredientDrag.previewFrame !== null) return;
  ingredientDrag.previewFrame = window.requestAnimationFrame(() => {
    if (!ingredientDrag) return;
    ingredientDrag.previewFrame = null;
    const x = ingredientDrag.pointerX - ingredientDrag.stageRect.left;
    const y = ingredientDrag.pointerY - ingredientDrag.stageRect.top;
    ingredientDrag.preview.style.setProperty('--drag-x', `${x}px`);
    ingredientDrag.preview.style.setProperty('--drag-y', `${y}px`);
  });
}

function clearIngredientDrag() {
  if (!ingredientDrag) return;
  if (ingredientDrag.previewFrame !== null) window.cancelAnimationFrame(ingredientDrag.previewFrame);
  if (ingredientDrag.source.hasPointerCapture?.(ingredientDrag.pointerId)) {
    ingredientDrag.source.releasePointerCapture(ingredientDrag.pointerId);
  }
  ingredientDrag.source.classList.remove('is-dragging');
  ingredientDrag.preview.remove();
  boardStation.classList.remove('is-drop-target');
  assemblyStation.classList.remove('is-drop-target');
  drinkMachine.classList.remove('is-drop-target');
  riceRack.classList.remove('is-drop-target');
  trashBin.classList.remove('is-drop-target');
  customerQueue.querySelector('.customer.is-drop-target')?.classList.remove('is-drop-target');
  ingredientDrag = null;
}

function startIngredientDrag(event, type, requestedIngredientId = null) {
  if (state.gamePaused) return;
  const source = event.currentTarget;
  event.preventDefault();
  if (ingredientDrag) return;
  const ingredientId = requestedIngredientId ?? source.dataset.ingredientId ?? 'salmon';
  const sushiType = sushiTypeFor(ingredientId);
  const isCustomerDelivery = type === 'serve' || type === 'serve-drink';

  const preview = document.createElement('img');
  preview.className = `ingredient-drag-preview ${type}`;
  preview.src = type === 'shrimp-head'
    ? `${KITCHEN_ASSET_PATH}shrimp-head.png`
    : type === 'ingredient'
    ? sushiType.id === 'shrimp'
      ? `${KITCHEN_ASSET_PATH}shrimp-whole.png`
      : sushiAsset(sushiType.id, 'loin')
    : type === 'slice'
      ? sushiAsset(sushiType.id, 'slice')
      : type === 'cup'
        ? `${KITCHEN_ASSET_PATH}tea-cup-empty.png`
        : type === 'serve-drink'
          ? `${KITCHEN_ASSET_PATH}tea-cup-ready.png`
          : sushiAsset(sushiType.id, 'nigiri');
  preview.alt = '';
  preview.draggable = false;
  stage.append(preview);
  const stageRect = stage.getBoundingClientRect();
  const targetCustomer = isCustomerDelivery ? getActiveCustomer() : null;
  const target = targetCustomer ? customerCardFor(targetCustomer.id)?.querySelector('.customer-avatar') : null;
  ingredientDrag = {
    type,
    source,
    pointerId: event.pointerId,
    preview,
    target,
    targetCustomerId: targetCustomer?.id ?? null,
    ingredientId: sushiType.id,
    shrimpHeadId: source.dataset.shrimpHeadId ?? null,
    stageRect,
    pointerX: event.clientX,
    pointerY: event.clientY,
    previewFrame: null,
  };
  preview.style.setProperty('--drag-x', `${event.clientX - stageRect.left}px`);
  preview.style.setProperty('--drag-y', `${event.clientY - stageRect.top}px`);
  if (type === 'slice' || type === 'ingredient' || type === 'shrimp-head' || isCustomerDelivery) source.classList.add('is-dragging');
  source.setPointerCapture(event.pointerId);
  const dropTarget = type === 'ingredient' ? boardStation : type === 'cup' ? drinkMachine : type === 'shrimp-head' ? trashBin : isCustomerDelivery ? target?.closest('.customer') : riceRack;
  dropTarget?.classList.add('is-drop-target');
  moveDragPreview(event);
  setMessage(type === 'ingredient'
    ? sushiType.id === 'shrimp' ? '把一只带头甜虾拖到切菜板。' : `把${sushiType.boardName}拖到切菜板。`
    : type === 'shrimp-head' ? '把虾头拖到垃圾桶。'
      : type === 'cup' ? '把空杯拖到饮品机。'
        : type === 'serve-drink' ? '把茶直接拖给顾客。'
        : type === 'serve' ? '把寿司直接拖给顾客。'
          : `把${sushiType.name}片拖到米饭架。`);
}

function createShrimpBatch() {
  state.shrimpBatchSerial += 1;
  return Array.from({ length: SHRIMP_BATCH_SIZE }, (_, index) => ({
    id: `${state.shrimpBatchSerial}-${index}`,
    cut: false,
  }));
}

function canSelectSashimi(ingredientId = null) {
  if (state.incomingSlices) {
    setMessage('等切好的配料放好后，再拿新的食材。');
    return false;
  }
  if (state.salmonOnBoard) {
    setMessage(`切菜板上还有${sushiTypeFor(state.boardIngredientId).boardName}，先把它切完再拿新的。`);
    return false;
  }
  if (state.shrimpOnBoard) {
    const remaining = state.shrimpBatch.filter((shrimp) => !shrimp.cut).length;
    setMessage(`切菜板上还有 ${remaining} 只甜虾，先把它们处理完再拿新的。`);
    return false;
  }
  if (ingredientId === 'shrimp' && (state.shrimpHeads.length || state.shrimpHeadDiscarding)) {
    setMessage(state.shrimpHeadDiscarding ? '虾头正在丢进垃圾桶，等一下再拿新的甜虾。' : '先把菜板上的虾头拖进垃圾桶，再拿下一只甜虾。');
    return false;
  }
  return true;
}

function openSashimiPicker() {
  if (state.gamePaused) return;
  if (!canSelectSashimi()) return;
  state.sashimiPickerOpen = !state.sashimiPickerOpen;
  setMessage(state.sashimiPickerOpen ? '选择一种食材。' : '已收起食材选择。');
  render();
}

function dragSashimiFromPicker(event) {
  const ingredientId = event.currentTarget.dataset.ingredientId;
  if (!isIngredientUnlocked(ingredientId)) {
    setMessage('这个食材还没有解锁，去食材商店购买吧。');
    return;
  }
  if (!hasRawFish(ingredientId)) {
    setMessage(`${sushiName(ingredientId)}库存为 0。今天结算后去钓鱼补货吧。`);
    render();
    return;
  }
  if (!canSelectSashimi(ingredientId)) return;
  const sushiType = sushiTypeFor(ingredientId);
  state.sashimiPickerOpen = false;
  sashimiPicker.classList.add('is-picked');
  startIngredientDrag(event, 'ingredient', sushiType.id);
  setMessage(`拖动${sushiType.pickerName}到切菜板。`);
}

function takeRice() {
  if (state.gamePaused) return;
  if (state.riceStored >= MAX_RICE) {
    setMessage('米饭架已经存满 8 团。');
    return;
  }
  playStationMotion(riceBin, 'is-dispensing', motionDuration(420));
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
      if (!state.incomingRice) scheduleSave();
    },
  });
}

function prepareCupDrag(event) {
  if (!isTeaUnlocked()) {
    setMessage('先在食材商店购买茶饮配方。');
    return;
  }
  if (state.cupOnMachine || state.drinkPouring) {
    setMessage('饮品机里已经有一只杯子。');
    return;
  }
  if (state.drinksStored >= storageCapacityFor('drinks')) {
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
  if (state.sushiStored >= storageCapacityFor('sushi')) {
    setMessage('寿司架满了，先出餐再继续制作。');
    return;
  }
  startIngredientDrag(event, 'slice', event.currentTarget.dataset.ingredientId);
}

function prepareShrimpHeadDrag(event) {
  if (!state.shrimpHeads.length || state.shrimpHeadDiscarding) {
    setMessage('现在没有需要处理的虾头。');
    return;
  }
  startIngredientDrag(event, 'shrimp-head', 'shrimp');
}

function prepareSushiServeDrag(event) {
  if (!state.shopOpen) {
    setMessage('今天已经结算，开始下一天后再出餐。');
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

function prepareDrinkServeDrag(event) {
  if (!state.shopOpen) {
    setMessage('今天已经结算，开始下一天后再出餐。');
    return;
  }
  const customer = getActiveCustomer();
  if (!customer) {
    setMessage('还没有正在等待的顾客。');
    return;
  }
  if (state.incomingDrinks) {
    setMessage('等茶滑进饮料架再出餐。');
    return;
  }
  startIngredientDrag(event, 'serve-drink');
}

function playCustomerDeliveryFlight({ src, fromClientX, fromClientY, targetRect, isDrink }) {
  if (!targetRect) return;
  const stageRect = stage.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) return;
  const fromX = fromClientX - stageRect.left;
  const fromY = fromClientY - stageRect.top;
  const toX = targetRect.left + (targetRect.width * 0.52) - stageRect.left;
  const toY = targetRect.top + (targetRect.height * 0.55) - stageRect.top;
  const item = document.createElement('img');
  const size = Math.max(
    isDrink ? 22 : 36,
    Math.min(isDrink ? 46 : 76, Math.min(targetRect.width, targetRect.height) * (isDrink ? 0.22 : 0.38)),
  );

  item.className = `customer-delivery-flight${isDrink ? ' is-drink' : ''}`;
  item.src = src;
  item.alt = '';
  item.draggable = false;
  item.style.left = `${fromX}px`;
  item.style.top = `${fromY}px`;
  item.style.width = `${size}px`;
  item.style.height = `${size}px`;
  item.style.setProperty('--flight-x', `${toX - fromX}px`);
  item.style.setProperty('--flight-y', `${toY - fromY}px`);
  stage.append(item);
  finishFlightOnAnimationEnd(item, 'customer-delivery-flight');
}

function completeCustomerOrderItem(customer, item) {
  item.fulfilled = true;
  const remaining = pendingOrderItems(customer);

  if (remaining.length) {
    setMessage(`已交付${orderItemName(item)}，还需要${orderSummary(remaining)}。`);
    render();
    return;
  }

  const leaveTimer = customerLeaveTimers.get(customer.id);
  if (leaveTimer) clearGameplayTimeout(leaveTimer);
  customerLeaveTimers.delete(customer.id);

  if (customer.customerType === 'beggar') {
    customer.served = true;
    customer.fledWithoutPay = true;
    resolveDayCustomer(customer);
    setMessage('逃单客拿走食物跑掉了，没有留下钱。');
    render();
    scheduleSave();
    fadeOutCustomer(customer, { holdMs: 160 });
    return;
  }

  customer.served = true;
  state.cash += customer.price;
  state.lifetimeRevenue = Math.min(9_999_999, state.lifetimeRevenue + customer.price);
  if (resolveDayCustomer(customer, { served: true })) state.dayIncome += customer.price;
  window.SeasideSushiLeaderboard?.recordOrder(customer.orderItems);
  setMessage(`订单完成，获得 ¥${customer.price}。`);
  render();
  scheduleSave();
  fadeOutCustomer(customer, { holdMs: 420 });
}

function deliverSushiToCustomer(ingredientId, customerId) {
  const customer = state.customers.find((waitingCustomer) => waitingCustomer.id === customerId && !waitingCustomer.served && !waitingCustomer.leaving);
  if (!customer || !state.sushiStored) return false;
  const sushiType = sushiTypeFor(ingredientId);
  const matchingOrderItem = pendingOrderItems(customer).find((item) => item.type === 'sushi' && item.id === sushiType.id);
  if (!matchingOrderItem) {
    const remaining = pendingOrderItems(customer);
    setMessage(`这位客人还需要${orderSummary(remaining)}，这份${sushiType.name}寿司不能交付。`);
    render();
    return false;
  }
  const storedIndex = state.sushiTypes.indexOf(sushiType.id);
  if (storedIndex === -1) {
    setMessage('这份寿司已经不在寿司架里了。');
    render();
    return false;
  }
  state.sushiTypes.splice(storedIndex, 1);
  state.sushiStored = state.sushiTypes.length;
  completeCustomerOrderItem(customer, matchingOrderItem);
  return true;
}

function deliverDrinkToCustomer(customerId) {
  const customer = state.customers.find((waitingCustomer) => waitingCustomer.id === customerId && !waitingCustomer.served && !waitingCustomer.leaving);
  if (!customer || !state.drinksStored) return false;
  const matchingOrderItem = pendingOrderItems(customer).find((item) => item.type === 'tea');
  if (!matchingOrderItem) {
    const remaining = pendingOrderItems(customer);
    setMessage(`这位客人还需要${orderSummary(remaining)}，这杯茶不能交付。`);
    render();
    return false;
  }

  state.drinksStored = Math.max(0, state.drinksStored - 1);
  completeCustomerOrderItem(customer, matchingOrderItem);
  return true;
}

freezerButton.addEventListener('click', openSashimiPicker);
sashimiChoices.forEach((choice) => choice.addEventListener('pointerdown', dragSashimiFromPicker));
ingredientShopToggle.addEventListener('click', toggleIngredientShop);
ingredientShopClose.addEventListener('click', closeIngredientShop);
ingredientShopPanel.addEventListener('click', (event) => {
  if (event.target === ingredientShopPanel) closeIngredientShop();
});
riceBin.addEventListener('click', takeRice);
cupStation.addEventListener('pointerdown', prepareCupDrag);

window.addEventListener('pointermove', (event) => moveDragPreview(event), { passive: true });
window.addEventListener('pointercancel', () => clearIngredientDrag());
window.addEventListener('pointerup', (event) => {
  if (!ingredientDrag || event.pointerId !== ingredientDrag.pointerId) return;
  const { type, source, target, targetCustomerId, ingredientId, shrimpHeadId, preview } = ingredientDrag;
  const sushiType = sushiTypeFor(ingredientId);
  const isCustomerDelivery = type === 'serve' || type === 'serve-drink';
  const shrimpHeadSourceRect = type === 'shrimp-head' ? source.getBoundingClientRect() : null;
  const deliveryFlight = isCustomerDelivery && target
    ? {
      src: preview.currentSrc || preview.src,
      fromClientX: event.clientX,
      fromClientY: event.clientY,
      targetRect: target.getBoundingClientRect(),
      isDrink: type === 'serve-drink',
    }
    : null;
  const destination = type === 'ingredient' ? boardStation : type === 'cup' ? drinkMachine : type === 'shrimp-head' ? trashBin : isCustomerDelivery ? target : riceRack;
  const accepted = Boolean(destination && pointIsInside(event, destination));
  if (source.hasPointerCapture(event.pointerId)) source.releasePointerCapture(event.pointerId);
  clearIngredientDrag();

  if (!accepted) {
    setMessage(type === 'ingredient'
      ? sushiType.id === 'shrimp' ? '把带头甜虾拖到切菜板里。' : `把${sushiType.boardName}拖到切菜板里。`
      : type === 'shrimp-head' ? '把虾头拖到垃圾桶里。'
        : type === 'cup' ? '把空杯拖到饮品机里。'
          : type === 'serve-drink' ? '把茶直接拖到顾客身上。'
          : type === 'serve' ? '把寿司直接拖到顾客身上。'
            : `把${sushiType.name}片拖到米饭架里。`);
    render();
    return;
  }

  if (type === 'serve') {
    if (deliverSushiToCustomer(sushiType.id, targetCustomerId)) playCustomerDeliveryFlight(deliveryFlight);
    return;
  }

  if (type === 'serve-drink') {
    if (deliverDrinkToCustomer(targetCustomerId)) playCustomerDeliveryFlight(deliveryFlight);
    return;
  }

  if (type === 'shrimp-head') {
    discardShrimpHead(shrimpHeadSourceRect, shrimpHeadId);
    return;
  }

  if (type === 'ingredient') {
    if (!consumeRawFish(sushiType.id)) {
      setMessage(`${sushiType.name}库存不足，今天结算后去钓鱼补货。`);
      render();
      return;
    }
    state.salmonOnBoard = sushiType.id !== 'shrimp';
    state.shrimpOnBoard = sushiType.id === 'shrimp';
    state.shrimpBatch = sushiType.id === 'shrimp' ? createShrimpBatch() : [];
    state.boardIngredientId = sushiType.id === 'shrimp' ? null : sushiType.id;
    state.cutLines = [false, false, false];
    state.activeCut = null;
    state.activeShrimpCut = null;
    setMessage(sushiType.id === 'shrimp'
      ? '4 只甜虾已放到切菜板。沿每只虾头旁的竖向虚线向下滑动，就能逐只去头。'
      : `${sushiType.boardName}已放到切菜板。在虚线附近按住，轻轻向下滑动即可切片。`);
  } else if (type === 'cup') {
    state.cupOnMachine = true;
    setMessage('空杯放好了，点击饮品机接饮料。');
  } else {
    makeSushi(sushiType.id);
    return;
  }
  render();
});

function pointerPosition(event, element = boardSalmon) {
  const bounds = element.getBoundingClientRect();
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
  return storageCapacityFor('slices') - state.slicesReady >= CUT_SLICE_ORIGINS[index].length;
}

function flySlice(sourceRect, rackRect, sourceFraction, sliceIndex, flightVersion, ingredientId, staggerMs = 0) {
  const stageRect = stage.getBoundingClientRect();
  const flyingSlice = document.createElement('img');
  const fromX = sourceRect.left + (sourceRect.width * sourceFraction) - stageRect.left;
  const fromY = sourceRect.top + (sourceRect.height * 0.54) - stageRect.top;
  const sliceGrid = storageGridFor('slices');
  const column = sliceIndex % sliceGrid.columns;
  const row = Math.floor(sliceIndex / sliceGrid.columns);
  const columnGap = rackRect.width * 0.02;
  const rowGap = rackRect.height * 0.07;
  const targetWidth = (rackRect.width - (columnGap * (sliceGrid.columns - 1))) / sliceGrid.columns;
  const targetHeight = (rackRect.height - (rowGap * (sliceGrid.rows - 1))) / sliceGrid.rows;
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
  flyingSlice.style.setProperty('--flight-x', `${toX - fromX}px`);
  flyingSlice.style.setProperty('--flight-y', `${toY - fromY}px`);
  const animationStagger = gameSettings.reducedMotion ? 0 : staggerMs;
  flyingSlice.style.animationDelay = `${animationStagger}ms`;
  stage.append(flyingSlice);

  finishFlightOnAnimationEnd(flyingSlice, 'sushi-slice-flight', () => {
    if (flightVersion !== state.flightVersion) return;
    state.incomingSlices = Math.max(0, state.incomingSlices - 1);
    render();
    if (!state.incomingSlices) scheduleSave();
  });
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
  item.style.setProperty('--flight-x', `${toX - fromX}px`);
  item.style.setProperty('--flight-y', `${toY - fromY}px`);
  if (className === 'rice') {
    const distance = Math.hypot(toX - fromX, toY - fromY);
    const lift = Math.min(Math.max(52, distance * 0.33), stageRect.height * 0.28);
    for (let point = 1; point < 8; point += 1) {
      const progress = point / 8;
      const arcX = (toX - fromX) * progress;
      const arcY = ((toY - fromY) * progress) - (lift * 4 * progress * (1 - progress));
      item.style.setProperty(`--rice-flight-x-${point}`, `${arcX}px`);
      item.style.setProperty(`--rice-flight-y-${point}`, `${arcY}px`);
    }
  }
  stage.append(item);

  finishFlightOnAnimationEnd(item, className === 'rice' ? 'rice-completed-flight' : 'completed-item-flight', () => {
    if (flightVersion === state.flightVersion) onFinish();
  });
}

function discardShrimpHead(sourceRect, headId) {
  if (!headId || !state.shrimpHeads.some((head) => head.id === headId) || state.shrimpHeadDiscarding) return;
  const stageRect = stage.getBoundingClientRect();
  const trashRect = trashBin.getBoundingClientRect();
  const head = document.createElement('img');
  const animationVersion = state.flightVersion;
  const headSize = Math.max(30, Math.min(sourceRect.width, sourceRect.height) * 0.9);

  head.className = 'flying-shrimp-head';
  head.src = `${KITCHEN_ASSET_PATH}shrimp-head.png`;
  head.alt = '';
  head.draggable = false;
  const fromX = sourceRect.left + (sourceRect.width / 2) - stageRect.left;
  const fromY = sourceRect.top + (sourceRect.height / 2) - stageRect.top;
  const toX = trashRect.left + (trashRect.width / 2) - stageRect.left;
  const toY = trashRect.top + (trashRect.height * 0.44) - stageRect.top;
  head.style.left = `${fromX}px`;
  head.style.top = `${fromY}px`;
  head.style.width = `${headSize}px`;
  head.style.height = `${headSize}px`;
  head.style.setProperty('--flight-x', `${toX - fromX}px`);
  head.style.setProperty('--flight-y', `${toY - fromY}px`);

  state.shrimpHeads = state.shrimpHeads.filter((shrimpHead) => shrimpHead.id !== headId);
  state.shrimpHeadDiscarding = true;
  setMessage('正在把虾头丢进垃圾桶。');
  render();
  stage.append(head);

  finishFlightOnAnimationEnd(head, 'shrimp-head-flight', () => {
    if (animationVersion !== state.flightVersion) return;
    state.shrimpHeadDiscarding = false;
    setMessage(state.shrimpHeads.length ? '这个虾头已经处理好，剩下的也要丢进垃圾桶。' : '所有虾头都处理好了，可以再拿一批甜虾。');
    render();
    if (!state.shrimpHeads.length && !state.incomingSlices) scheduleSave();
  });
}

function finishCutLine(index) {
  if (state.gamePaused) return;
  const sourceRect = boardSalmon.getBoundingClientRect();
  const rackRect = sliceRack.getBoundingClientRect();
  const sliceOrigins = CUT_SLICE_ORIGINS[index];
  const firstSliceIndex = state.slicesReady;
  const flightVersion = state.flightVersion;
  const ingredientId = sushiTypeFor(state.boardIngredientId).id;
  const sushiType = sushiTypeFor(ingredientId);

  state.cutLines[index] = true;
  state.slicesReady = Math.min(storageCapacityFor('slices'), state.slicesReady + sliceOrigins.length);
  state.sliceTypes.push(...Array(sliceOrigins.length).fill(ingredientId));
  state.incomingSlices += sliceOrigins.length;
  const completed = state.cutLines.filter(Boolean).length;
  state.salmonOnBoard = completed < CUT_LINES.length;
  if (!state.salmonOnBoard) state.boardIngredientId = null;
  setMessage(completed < CUT_LINES.length ? `切好一片${sushiType.name}，继续切下一条虚线。` : `最后两片${sushiType.name}切好了！`);
  render();
  sliceOrigins.forEach((origin, offset) => {
    flySlice(
      sourceRect,
      rackRect,
      origin,
      firstSliceIndex + offset,
      flightVersion,
      ingredientId,
      offset * SLICE_FLIGHT_STAGGER_MS,
    );
  });
}

function hasRoomForShrimp() {
  return storageCapacityFor('slices') - state.slicesReady >= 1;
}

function finishShrimpPrep(shrimpId, sourceElement) {
  if (state.gamePaused) return;
  const shrimp = state.shrimpBatch.find((batchItem) => batchItem.id === shrimpId && !batchItem.cut);
  if (!shrimp || !hasRoomForShrimp()) return;
  const sourceRect = sourceElement.getBoundingClientRect();
  const rackRect = sliceRack.getBoundingClientRect();
  const sliceIndex = state.slicesReady;
  const flightVersion = state.flightVersion;

  shrimp.cut = true;
  state.shrimpOnBoard = state.shrimpBatch.some((batchItem) => !batchItem.cut);
  state.activeShrimpCut = null;
  state.shrimpHeads.push({ id: shrimp.id });
  state.slicesReady += 1;
  state.sliceTypes.push('shrimp');
  state.incomingSlices += 1;
  const remaining = state.shrimpBatch.filter((batchItem) => !batchItem.cut).length;
  setMessage(remaining
    ? `一只甜虾处理好了，还剩 ${remaining} 只；虾头记得逐个拖进垃圾桶。`
    : '这批甜虾都处理好了，先把所有虾头拖进垃圾桶，才能拿下一批。');
  render();
  flySlice(sourceRect, rackRect, 0.54, sliceIndex, flightVersion, 'shrimp');
}

function startShrimpCut(event) {
  event.preventDefault();
  const item = event.currentTarget;
  const shrimpId = item.dataset.shrimpId;
  const shrimp = state.shrimpBatch.find((batchItem) => batchItem.id === shrimpId && !batchItem.cut);
  if (!shrimp || state.activeShrimpCut !== null) return;
  if (!hasRoomForShrimp()) {
    setMessage('配料架空间不够，先做几份寿司再处理甜虾。');
    return;
  }

  const point = pointerPosition(event, item);
  if (Math.abs(point.x - SHRIMP_HEAD_CUT_X) > 0.42) {
    setMessage('从虾头旁的竖向虚线开始，轻轻向下滑动就能去头。');
    return;
  }

  state.activeShrimpCut = shrimpId;
  state.shrimpCutStartY = point.y;
  item.classList.add('is-cutting');
  item.setPointerCapture(event.pointerId);
}

function moveShrimpCut(event) {
  const item = event.currentTarget;
  const shrimpId = item.dataset.shrimpId;
  if (state.activeShrimpCut !== shrimpId) return;
  const point = pointerPosition(event, item);
  if (point.y - state.shrimpCutStartY < CUT_SWIPE_DISTANCE) return;
  if (item.hasPointerCapture(event.pointerId)) item.releasePointerCapture(event.pointerId);
  finishShrimpPrep(shrimpId, item);
}

function cancelShrimpCut(event) {
  const item = event.currentTarget;
  if (state.activeShrimpCut !== item.dataset.shrimpId) return;
  state.activeShrimpCut = null;
  item.classList.remove('is-cutting');
  if (item.hasPointerCapture(event.pointerId)) item.releasePointerCapture(event.pointerId);
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
  if (state.gamePaused) return;
  if (!isTeaUnlocked()) {
    setMessage('先在食材商店购买茶饮配方。');
    return;
  }
  if (!state.cupOnMachine) {
    setMessage('先从杯子区拖一个空杯到饮品机。');
    return;
  }
  if (state.drinkPouring) return;
  state.drinkPouring = true;
  const version = state.drinkVersion;
  setMessage('正在接茶。');
  render();
  setGameplayTimeout(() => {
    if (version !== state.drinkVersion) return;
    const sourceRect = machineCup.getBoundingClientRect();
    const targetRect = drinkRack.getBoundingClientRect();
    const targetIndex = state.drinksStored;
    state.cupOnMachine = false;
    state.drinkPouring = false;
    state.drinksStored += 1;
    state.incomingDrinks += 1;
    setMessage('茶做好了，已放进饮料架。');
    render();
    const drinkGrid = storageGridFor('drinks');
    flyCompletedItem({
      className: 'drink',
      src: `${KITCHEN_ASSET_PATH}tea-cup-ready.png`,
      sourceRect,
      targetRect,
      targetIndex,
      columns: drinkGrid.columns,
      rows: drinkGrid.rows,
      gap: 0.1,
      onFinish: () => {
        state.incomingDrinks = Math.max(0, state.incomingDrinks - 1);
        render();
        if (!state.incomingDrinks) scheduleSave();
      },
    });
  }, motionDuration(DRINK_FILL_MS));
});

gamePauseButton.addEventListener('click', toggleGamePause);
resumeGameButton.addEventListener('click', resumeGame);
openGameSettingsButton.addEventListener('click', openGameSettings);
closeGameSettingsButton.addEventListener('click', closeGameSettings);
motionSettingButton.addEventListener('click', toggleReducedMotion);
exitGameButton.addEventListener('click', exitGame);
openShopButton.addEventListener('click', resumeShop);
goFishingButton.addEventListener('click', goFishing);
daySummaryDismissButton.addEventListener('click', dismissDaySummary);
tutorialStartButton.addEventListener('click', startTutorial);
tutorialSkipButton.addEventListener('click', skipTutorial);

restoreGameSettings();
restoreGame();
setMessage(state.dayPhase === 'settlement'
  ? state.dayEndedEarly
    ? `第 ${state.day} 天暂时打烊，补货后继续。`
    : `第 ${state.day} 天结束。`
  : tutorialNeedsCompletion()
    ? '第 1 天：先完成新手教程，招待第一位客人。'
    : `第 ${state.day} 天营业中：第一位客人马上就到。`);
render();
startDayClock();
scheduleCustomer(700);
window.addEventListener('pagehide', () => {
  if (!hasUnsettledSaveState()) saveGame();
});

function preloadInteractionAssets() {
  const assetNames = new Set(['rice-portion.png', 'tea-cup-ready.png', 'shrimp-whole.png', 'shrimp-head.png', 'trash-bin.png']);
  SUSHI_TYPE_LIST.forEach((sushiType) => {
    assetNames.add(sushiType.loin);
    assetNames.add(sushiType.slice);
    assetNames.add(sushiType.nigiri);
  });
  const assetUrls = [
    ...Array.from(assetNames, (name) => `${KITCHEN_ASSET_PATH}${name}`),
    ...CUSTOMER_CATALOG.map((customer) => `${CUSTOMER_ASSET_PATH}${customer.avatar}`),
  ];
  assetUrls.forEach((src) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    image.decode?.().catch(() => {});
  });
}

if ('requestIdleCallback' in window) {
  window.requestIdleCallback(preloadInteractionAssets, { timeout: 1200 });
} else {
  window.setTimeout(preloadInteractionAssets, 600);
}
