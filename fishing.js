const SAVE_KEY = 'seaside-sushi-shop.save.v1';
const SAVE_VERSION = 1;
const MAX_RAW_FISH = 99;
const BITE_MIN_MS = 900;
const BITE_MAX_MS = 2200;
const BITE_WINDOW_MS = 1250;
const FISH_CATALOG = {
  salmon: { id: 'salmon', name: '三文鱼', weight: 50 },
  tuna: { id: 'tuna', name: '金枪鱼', weight: 20 },
  shrimp: { id: 'shrimp', name: '甜虾食材', weight: 30 },
};
const FISH_IDS = Object.keys(FISH_CATALOG);

const $ = (selector) => document.querySelector(selector);
const fishingButton = $('#fishing-button');
const finishFishingButton = $('#finish-fishing-button');
const bobber = $('#bobber');
const fishingLine = $('#fishing-line');
const speech = $('#fishing-speech');
const instruction = $('#fishing-instruction');
const catchPop = $('#catch-pop');
const sessionCatchCount = $('#session-catch-count');
const resultOverlay = $('#fishing-result-overlay');
const resultCatchCount = $('#result-catch-count');
const resultTitle = $('#fishing-result-title');
const backToKitchenButton = $('#back-to-kitchen-button');

const state = {
  phase: 'ready',
  ended: false,
  unlockedFish: [],
  rawFish: { salmon: 0, tuna: 0, shrimp: 0 },
  sessionCatch: { salmon: 0, tuna: 0, shrimp: 0 },
  totalCaught: 0,
};

let biteTimer = null;
let escapeTimer = null;
let popTimer = null;

function asStoredCount(value, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(max, Math.max(0, Math.floor(parsed)));
}

function normalizeRawFish(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(FISH_IDS.map((id) => [id, asStoredCount(source[id], MAX_RAW_FISH)]));
}

function readSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return { version: SAVE_VERSION, inventory: {} };
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || saved.version !== SAVE_VERSION) return { version: SAVE_VERSION, inventory: {} };
    return saved;
  } catch {
    return { version: SAVE_VERSION, inventory: {} };
  }
}

function getUnlockedFish(save) {
  const unlocked = Array.isArray(save.unlockedIngredients) ? save.unlockedIngredients : [];
  return FISH_IDS.filter((id) => unlocked.includes(id));
}

function persistRawFish(nextRawFish) {
  try {
    const saved = readSave();
    const inventory = saved.inventory && typeof saved.inventory === 'object' ? saved.inventory : {};
    const nextSave = {
      ...saved,
      version: SAVE_VERSION,
      inventory: {
        ...inventory,
        rawFish: normalizeRawFish(nextRawFish),
      },
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(nextSave));
    return true;
  } catch {
    return false;
  }
}

function catchableFish() {
  return state.unlockedFish.filter((id) => state.rawFish[id] < MAX_RAW_FISH);
}

function pickFish() {
  const pool = catchableFish();
  const totalWeight = pool.reduce((total, id) => total + FISH_CATALOG[id].weight, 0);
  let roll = Math.random() * totalWeight;
  for (const id of pool) {
    roll -= FISH_CATALOG[id].weight;
    if (roll <= 0) return id;
  }
  return pool[0] ?? null;
}

function clearFishingTimers() {
  if (biteTimer) window.clearTimeout(biteTimer);
  if (escapeTimer) window.clearTimeout(escapeTimer);
  biteTimer = null;
  escapeTimer = null;
}

function setInstruction(text, speechText = text) {
  instruction.textContent = text;
  speech.textContent = speechText;
}

function resetLine() {
  clearFishingTimers();
  state.phase = 'ready';
  fishingLine.classList.remove('is-cast');
  bobber.classList.remove('is-visible', 'is-biting');
  renderControls();
}

function renderFishStocks() {
  FISH_IDS.forEach((id) => {
    const item = document.querySelector(`[data-fish-id="${id}"]`);
    const unlocked = state.unlockedFish.includes(id);
    const count = state.rawFish[id];
    item.classList.toggle('is-locked', !unlocked);
    $(`#${id}-count`).textContent = count;
    $(`#${id}-status`).textContent = unlocked
      ? count >= MAX_RAW_FISH ? '鱼篓已满' : '可钓'
      : '未解锁';
  });
  sessionCatchCount.textContent = `${state.totalCaught} 份`;
}

function renderControls() {
  const hasFishToCatch = catchableFish().length > 0;
  fishingButton.disabled = state.ended || state.phase === 'waiting' || !hasFishToCatch;
  fishingButton.textContent = state.phase === 'biting'
    ? '收线！'
    : state.phase === 'waiting'
      ? '等待咬钩'
      : hasFishToCatch ? '放线' : '没有可钓的鱼';
  bobber.setAttribute('aria-label', state.phase === 'biting' ? '有鱼咬钩，点击收线' : '浮标');
}

function render() {
  renderFishStocks();
  renderControls();
}

function showCatch(type) {
  catchPop.textContent = `钓到了${FISH_CATALOG[type].name}！`;
  catchPop.classList.remove('is-showing');
  void catchPop.offsetWidth;
  catchPop.classList.add('is-showing');
  if (popTimer) window.clearTimeout(popTimer);
  popTimer = window.setTimeout(() => catchPop.classList.remove('is-showing'), 900);
}

function startBite() {
  if (state.ended || state.phase !== 'waiting') return;
  state.phase = 'biting';
  bobber.classList.add('is-biting');
  setInstruction('浮标在剧烈晃动，快收线！', '就是现在，收线！');
  renderControls();
  escapeTimer = window.setTimeout(() => {
    if (state.ended || state.phase !== 'biting') return;
    resetLine();
    setInstruction('鱼跑掉了，再试一次。', '差一点！再放一次线吧。');
  }, BITE_WINDOW_MS);
}

function castLine() {
  const pool = catchableFish();
  if (!pool.length) {
    setInstruction('还没有可钓的鱼种。先回店里购买一种鱼，再回来钓。', '先买一种鱼的钓点吧。');
    renderControls();
    return;
  }
  state.phase = 'waiting';
  fishingLine.classList.add('is-cast');
  bobber.classList.add('is-visible');
  setInstruction('鱼线已经放下，安静等一等。', '耐心一点，鱼马上会来。');
  renderControls();
  biteTimer = window.setTimeout(startBite, BITE_MIN_MS + (Math.random() * (BITE_MAX_MS - BITE_MIN_MS)));
}

function reelIn() {
  const type = pickFish();
  if (!type) {
    resetLine();
    setInstruction('鱼篓已经装满了，先回店里使用食材。', '鱼篓装不下啦。');
    return;
  }
  const nextRawFish = { ...state.rawFish, [type]: state.rawFish[type] + 1 };
  if (!persistRawFish(nextRawFish)) {
    resetLine();
    setInstruction('鱼篓没能保存，检查浏览器存储后再试。', '这次没记下来，再试一次。');
    return;
  }

  state.rawFish = nextRawFish;
  state.sessionCatch[type] += 1;
  state.totalCaught += 1;
  showCatch(type);
  resetLine();
  setInstruction(`鱼篓里多了 1 份${FISH_CATALOG[type].name}。`, '新鲜食材到手，再来一条！');
  render();
}

function startFishing() {
  if (state.ended) return;
  if (state.phase === 'ready') castLine();
  else if (state.phase === 'biting') reelIn();
}

function finishFishing() {
  if (state.ended) return;
  state.ended = true;
  resetLine();
  const total = state.totalCaught;
  resultCatchCount.textContent = total;
  resultTitle.textContent = total ? '这次钓得不错！' : '下次一定会钓到！';
  resultOverlay.classList.remove('is-hidden');
  window.requestAnimationFrame(() => backToKitchenButton.focus());
}

function returnToKitchen() {
  window.location.assign('index.html?scene=kitchen');
}

function initializeFishing() {
  const save = readSave();
  const inventory = save.inventory && typeof save.inventory === 'object' ? save.inventory : {};
  state.unlockedFish = getUnlockedFish(save);
  state.rawFish = normalizeRawFish(inventory.rawFish);
  if (state.unlockedFish.length) {
    setInstruction('点击放线，等浮标剧烈晃动时收线。', '今天要钓点什么新鲜食材呢？');
  } else {
    setInstruction('先回店里购买一种鱼的钓点，再来这里捕鱼。', '玉子烧够用，但鱼要先买钓点。');
  }
  render();
}

fishingButton.addEventListener('click', startFishing);
bobber.addEventListener('click', startFishing);
finishFishingButton.addEventListener('click', finishFishing);
backToKitchenButton.addEventListener('click', returnToKitchen);
window.addEventListener('pagehide', clearFishingTimers, { once: true });

initializeFishing();
