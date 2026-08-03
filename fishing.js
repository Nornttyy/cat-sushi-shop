const SAVE_KEY = 'seaside-sushi-shop.save.v1';
const SAVE_VERSION = 1;
const MAX_RAW_FISH = 99;
const FISH_BASKET_CAPACITY = 12;
const MAX_CATCHES_PER_TRIP = 5;
const SWING_MIN_ANGLE = 4;
const SWING_MAX_ANGLE = 70;
const SWING_SPEED = 54;
const TARGET_COUNT = 4;
const FISH_SPAWN_SLOTS = [
  { angle: 64, distance: 0.58 },
  { angle: 52, distance: 0.74 },
  { angle: 67, distance: 0.8 },
  { angle: 58, distance: 0.9 },
];

const FISH_CATALOG = {
  salmon: {
    id: 'salmon',
    name: '三文鱼',
    weight: 50,
    asset: 'assets/fishing-v2/salmon.png',
    swimSpeed: 0.16,
    pullSpeed: 0.9,
    scale: 1,
    hitRadius: 0.088,
  },
  tuna: {
    id: 'tuna',
    name: '金枪鱼',
    weight: 20,
    asset: 'assets/fishing-v2/tuna-whole.png',
    swimSpeed: 0.095,
    pullSpeed: 0.64,
    scale: 1.08,
    hitRadius: 0.078,
  },
  shrimp: {
    id: 'shrimp',
    name: '甜虾食材',
    weight: 30,
    asset: 'assets/restaurant/kitchen-layers/optimized/shrimp-whole.png',
    swimSpeed: 0.22,
    pullSpeed: 1.18,
    scale: 0.98,
    hitRadius: 0.068,
  },
};

const FISH_IDS = Object.keys(FISH_CATALOG);
const $ = (selector) => document.querySelector(selector);

const fishingScene = $('#fishing-scene');
const rodTip = $('#rod-tip');
const hookRig = $('#hook-rig');
const hookArm = $('#hook-arm');
const fishingLine = $('#fishing-line');
const fishingHook = $('#fishing-hook');
const fishingTargets = $('#fishing-targets');
const fishingTargetTemplate = $('#fishing-target-template');
const fishingButton = $('#fishing-button');
const finishFishingButton = $('#finish-fishing-button');
const speech = $('#fishing-speech');
const instruction = $('#fishing-instruction');
const catchPop = $('#catch-pop');
const sessionCatchCount = $('#session-catch-count');
const resultOverlay = $('#fishing-result-overlay');
const resultCatchCount = $('#result-catch-count');
const resultTitle = $('#fishing-result-title');
const backToKitchenButton = $('#back-to-kitchen-button');

const state = {
  phase: 'aiming',
  ended: false,
  unlockedFish: [],
  rawFish: { salmon: 0, tuna: 0, shrimp: 0 },
  sessionCatch: { salmon: 0, tuna: 0, shrimp: 0 },
  totalCaught: 0,
  targets: [],
  activeTarget: null,
  targetSerial: 0,
  hookToken: 0,
  awardedToken: 0,
  angle: 36,
  swingDirection: 1,
  ropeLength: 52,
  anchor: { x: 0, y: 0 },
  targetsPrepared: false,
  lastFrame: 0,
  animationFrame: null,
};

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

function randomBetween(min, max) {
  return min + (Math.random() * (max - min));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setInstruction(text, speechText = text) {
  instruction.textContent = text;
  speech.textContent = speechText;
}

function catchableFish() {
  return state.unlockedFish.filter((id) => state.rawFish[id] < FISH_BASKET_CAPACITY);
}

function weightedFish(pool = catchableFish()) {
  const totalWeight = pool.reduce((total, id) => total + FISH_CATALOG[id].weight, 0);
  let roll = Math.random() * totalWeight;
  for (const id of pool) {
    roll -= FISH_CATALOG[id].weight;
    if (roll <= 0) return id;
  }
  return pool[0] ?? null;
}

function getSceneRect() {
  return fishingScene.getBoundingClientRect();
}

function getWaterRect() {
  return fishingTargets.getBoundingClientRect();
}

function idleRopeLength() {
  const sceneRect = getSceneRect();
  return clamp(sceneRect.height * 0.085, 42, 72);
}

function maxRopeLength() {
  const sceneRect = getSceneRect();
  return Math.max(idleRopeLength() + 92, Math.min(sceneRect.height * 0.73, sceneRect.width * 0.52));
}

function syncHookAnchor() {
  const sceneRect = getSceneRect();
  const tipRect = rodTip.getBoundingClientRect();
  if (!sceneRect.width || !sceneRect.height || !tipRect.width || !tipRect.height) return false;

  state.anchor.x = tipRect.left + (tipRect.width / 2) - sceneRect.left;
  state.anchor.y = tipRect.top + (tipRect.height / 2) - sceneRect.top;
  hookRig.style.left = `${state.anchor.x}px`;
  hookRig.style.top = `${state.anchor.y}px`;
  return true;
}

function hookEndpoint() {
  const radians = state.angle * (Math.PI / 180);
  return {
    x: state.anchor.x + (Math.sin(radians) * state.ropeLength),
    y: state.anchor.y + (Math.cos(radians) * state.ropeLength),
  };
}

function renderHook() {
  // A CSS-rotated vertical line moves left for a positive angle. Negating the
  // angle keeps the mathematical hook path and the visible rope aimed into
  // the open water on the right of the dock.
  hookArm.style.transform = `rotate(${(-state.angle).toFixed(2)}deg)`;
  fishingLine.style.height = `${state.ropeLength.toFixed(1)}px`;
  fishingHook.style.transform = `translateY(${state.ropeLength.toFixed(1)}px)`;
  hookRig.classList.toggle('is-casting', state.phase === 'extending');
  hookRig.classList.toggle('is-reeling', state.phase === 'retracting');
  hookRig.classList.toggle('is-carrying', Boolean(state.activeTarget));
  fishingLine.classList.toggle('is-cast', state.phase !== 'aiming');
}

function renderFishStocks() {
  FISH_IDS.forEach((id) => {
    const item = document.querySelector(`[data-fish-id="${id}"]`);
    const unlocked = state.unlockedFish.includes(id);
    const count = state.rawFish[id];
    item.classList.toggle('is-locked', !unlocked);
    $(`#${id}-count`).textContent = count;
    $(`#${id}-status`).textContent = unlocked
      ? count >= FISH_BASKET_CAPACITY ? '鱼篓已满' : '海里可抓'
      : '未解锁';
  });
  sessionCatchCount.textContent = `${state.totalCaught} / ${MAX_CATCHES_PER_TRIP} 份`;
}

function renderControls() {
  const tripFull = state.totalCaught >= MAX_CATCHES_PER_TRIP;
  const canCast = state.phase === 'aiming' && !state.ended && !tripFull && catchableFish().length > 0 && state.targets.length > 0;
  fishingButton.disabled = !canCast;
  fishingButton.textContent = state.phase === 'extending'
    ? '钩子出发中'
    : state.phase === 'retracting'
      ? state.activeTarget ? '正在拉回' : '正在收线'
      : tripFull ? '本趟收获已满' : catchableFish().length ? '发射钩子' : '没有可抓的鱼';
  finishFishingButton.disabled = state.ended || state.phase !== 'aiming';
  finishFishingButton.title = state.phase === 'aiming' ? '带着今天的收获回店里' : '先等钩子收回来';
}

function render() {
  renderFishStocks();
  renderControls();
}

function showCatch(type) {
  catchPop.textContent = `抓到了${FISH_CATALOG[type].name}！`;
  catchPop.classList.remove('is-showing');
  void catchPop.offsetWidth;
  catchPop.classList.add('is-showing');
  if (popTimer) window.clearTimeout(popTimer);
  popTimer = window.setTimeout(() => catchPop.classList.remove('is-showing'), 900);
}

function targetCount() {
  const poolSize = catchableFish().length;
  if (!poolSize) return 0;
  return Math.min(TARGET_COUNT, 3 + poolSize);
}

function targetsAreTooClose(x, y) {
  return state.targets.some((target) => {
    if (target === state.activeTarget) return false;
    const distance = Math.hypot(target.x - x, target.baseY - y);
    return distance < 0.14;
  });
}

function createTarget(type) {
  const catalog = FISH_CATALOG[type];
  if (!catalog || !fishingTargetTemplate) return null;

  const sceneRect = getSceneRect();
  const waterRect = getWaterRect();
  const waterLeft = waterRect.left - sceneRect.left;
  const waterTop = waterRect.top - sceneRect.top;
  let x = 0.5;
  let y = 0.62;
  let slotIndex = -1;
  const occupiedSlots = new Set(state.targets.map((target) => target.slotIndex).filter((index) => index >= 0));
  const availableSlots = FISH_SPAWN_SLOTS
    .map((slot, index) => ({ slot, index }))
    .filter(({ index }) => !occupiedSlots.has(index));

  // Spawn fish inside the actual sweep cone rather than across the whole
  // screen. Every target starts in reachable open water, not in the pier or
  // behind the stock card.
  for (const candidate of availableSlots) {
    const angle = (candidate.slot.angle + randomBetween(-1.7, 1.7)) * (Math.PI / 180);
    const length = maxRopeLength() * (candidate.slot.distance + randomBetween(-0.018, 0.018));
    const pointX = state.anchor.x + (Math.sin(angle) * length);
    const pointY = state.anchor.y + (Math.cos(angle) * length);
    const nextX = (pointX - waterLeft) / waterRect.width;
    const nextY = (pointY - waterTop) / waterRect.height;
    const safelyBeyondPier = pointX > sceneRect.width * 0.53 && pointY > state.anchor.y + 66;
    if (nextX < 0.08 || nextX > 0.92 || nextY < 0.12 || nextY > 0.95 || !safelyBeyondPier) continue;
    if (targetsAreTooClose(nextX, nextY)) continue;
    x = nextX;
    y = nextY;
    slotIndex = candidate.index;
    break;
  }

  const element = fishingTargetTemplate.content.firstElementChild.cloneNode(true);
  const image = element.querySelector('img');
  state.targetSerial += 1;
  element.dataset.fishId = type;
  element.dataset.targetId = String(state.targetSerial);
  element.setAttribute('aria-label', `水中的${catalog.name}`);
  element.tabIndex = -1;
  image.src = catalog.asset;
  image.alt = catalog.name;

  const target = {
    id: state.targetSerial,
    type,
    element,
    x,
    baseY: y,
    y,
    direction: Math.random() < 0.5 ? -1 : 1,
    speed: catalog.swimSpeed * randomBetween(0.72, 1.14),
    wobble: randomBetween(0.012, 0.032),
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: randomBetween(1.4, 2.35),
    scale: catalog.scale * randomBetween(0.88, 1.11),
    captureToken: null,
    slotIndex,
  };

  fishingTargets.append(element);
  state.targets.push(target);
  applyTargetPosition(target);
  return target;
}

function spawnTargets() {
  const pool = catchableFish();
  while (state.targets.length < targetCount() && pool.length) {
    const representedTypes = new Set(state.targets.map((target) => target.type));
    const missingTypes = pool.filter((id) => !representedTypes.has(id));
    const type = weightedFish(missingTypes.length ? missingTypes : pool);
    if (!type || !createTarget(type)) break;
  }
}

function clearTargets() {
  state.targets.forEach((target) => target.element.remove());
  state.targets = [];
  state.activeTarget = null;
}

function prepareInitialTargets() {
  if (state.targetsPrepared || state.ended) return;
  // The rod-tip marker has a stable layout before the fisherman image has
  // finished decoding. Do not leave a purchased fishing spot empty just
  // because one decorative image is slow or fails to load.
  if (!syncHookAnchor()) {
    window.requestAnimationFrame(prepareInitialTargets);
    return;
  }
  clearTargets();
  spawnTargets();
  state.targetsPrepared = true;
  render();
}

function applyTargetPosition(target) {
  target.element.style.setProperty('--fish-x', `${(target.x * 100).toFixed(2)}%`);
  target.element.style.setProperty('--fish-y', `${(target.y * 100).toFixed(2)}%`);
  target.element.style.setProperty('--fish-direction', String(target.direction));
  target.element.style.setProperty('--fish-scale', target.scale.toFixed(3));
}

function updateTargets(deltaSeconds) {
  state.targets.forEach((target) => {
    if (target === state.activeTarget) return;
    target.x += target.direction * target.speed * deltaSeconds;
    if (target.x < 0.06 || target.x > 0.94) {
      target.x = clamp(target.x, 0.06, 0.94);
      target.direction *= -1;
    }
    target.wobblePhase += target.wobbleSpeed * deltaSeconds;
    target.y = clamp(target.baseY + (Math.sin(target.wobblePhase) * target.wobble), 0.12, 0.9);
    applyTargetPosition(target);
  });
}

function targetPositionInScene(target) {
  const sceneRect = getSceneRect();
  const waterRect = getWaterRect();
  return {
    x: waterRect.left - sceneRect.left + (target.x * waterRect.width),
    y: waterRect.top - sceneRect.top + (target.y * waterRect.height),
    radius: Math.max(22, Math.min(waterRect.width, waterRect.height) * FISH_CATALOG[target.type].hitRadius),
  };
}

function findHookedTarget() {
  const hook = hookEndpoint();
  let closest = null;
  let closestDistance = Number.POSITIVE_INFINITY;
  state.targets.forEach((target) => {
    if (target === state.activeTarget) return;
    const position = targetPositionInScene(target);
    const distance = Math.hypot(position.x - hook.x, position.y - hook.y);
    if (distance <= position.radius + 15 && distance < closestDistance) {
      closest = target;
      closestDistance = distance;
    }
  });
  return closest;
}

function hookTarget(target) {
  state.activeTarget = target;
  target.captureToken = state.hookToken;
  target.element.classList.add('is-hooked', 'is-carried');
  target.element.style.setProperty('--fish-x', '27px');
  target.element.style.setProperty('--fish-y', '35px');
  fishingHook.append(target.element);
  state.phase = 'retracting';
  setInstruction(`钩住了${FISH_CATALOG[target.type].name}，正在拉回鱼篓！`, '抓住了，慢慢收回来！');
  renderControls();
}

function startRetracting() {
  if (state.phase !== 'extending') return;
  state.phase = 'retracting';
  setInstruction('没有抓到鱼，钩子正在收回。', '这次空钩了，再瞄准一点。');
  renderControls();
}

function awardCaughtFish(target) {
  if (!target || target.captureToken !== state.hookToken || state.awardedToken === target.captureToken) return false;
  state.awardedToken = target.captureToken;
  const type = target.type;
  if (state.rawFish[type] >= FISH_BASKET_CAPACITY) return false;

  const nextRawFish = { ...state.rawFish, [type]: state.rawFish[type] + 1 };
  if (!persistRawFish(nextRawFish)) {
    setInstruction('抓到了鱼，但鱼篓没能保存。检查浏览器存储后再试。', '这条鱼没记下来，再来一次吧。');
    return false;
  }

  state.rawFish = nextRawFish;
  state.sessionCatch[type] += 1;
  state.totalCaught += 1;
  showCatch(type);
  setInstruction(`鱼篓里多了 1 份${FISH_CATALOG[type].name}。钩子继续摆动吧！`, '新鲜食材到手，再抓一条！');
  return true;
}

function finishRetraction() {
  const caughtTarget = state.activeTarget;
  state.activeTarget = null;
  state.phase = 'aiming';
  state.ropeLength = idleRopeLength();

  if (caughtTarget) {
    caughtTarget.element.remove();
    state.targets = state.targets.filter((target) => target !== caughtTarget);
    const awarded = awardCaughtFish(caughtTarget);
    if (awarded && (state.totalCaught >= MAX_CATCHES_PER_TRIP || !catchableFish().length)) {
      render();
      finishFishing({ auto: true });
      return;
    }
  } else {
    setInstruction('钩子收回来了，继续瞄准水里的鱼。', '再试一次，这次一定能抓到。');
  }

  spawnTargets();
  render();
}

function updateHook(deltaSeconds) {
  if (state.phase === 'aiming') {
    state.ropeLength = idleRopeLength();
    state.angle += state.swingDirection * SWING_SPEED * deltaSeconds;
    if (state.angle >= SWING_MAX_ANGLE || state.angle <= SWING_MIN_ANGLE) {
      state.angle = clamp(state.angle, SWING_MIN_ANGLE, SWING_MAX_ANGLE);
      state.swingDirection *= -1;
    }
    return;
  }

  if (state.phase === 'extending') {
    state.ropeLength += getSceneRect().height * 1.24 * deltaSeconds;
    const hooked = findHookedTarget();
    if (hooked) {
      hookTarget(hooked);
      return;
    }
    if (state.ropeLength >= maxRopeLength()) {
      state.ropeLength = maxRopeLength();
      startRetracting();
    }
    return;
  }

  if (state.phase === 'retracting') {
    const target = state.activeTarget;
    const pullSpeed = target ? FISH_CATALOG[target.type].pullSpeed : 1.38;
    state.ropeLength -= getSceneRect().height * 1.42 * pullSpeed * deltaSeconds;
    if (state.ropeLength <= idleRopeLength()) finishRetraction();
  }
}

function runFrame(now) {
  const lastFrame = state.lastFrame || now;
  const deltaSeconds = Math.min(0.045, Math.max(0, (now - lastFrame) / 1000));
  state.lastFrame = now;

  if (!state.ended) {
    syncHookAnchor();
    updateTargets(deltaSeconds);
    updateHook(deltaSeconds);
    renderHook();
  }
  state.animationFrame = window.requestAnimationFrame(runFrame);
}

function startAnimationLoop() {
  if (state.animationFrame !== null) return;
  state.lastFrame = performance.now();
  state.animationFrame = window.requestAnimationFrame(runFrame);
}

function stopAnimationLoop() {
  if (state.animationFrame !== null) window.cancelAnimationFrame(state.animationFrame);
  state.animationFrame = null;
}

function castHook() {
  if (state.ended || state.phase !== 'aiming') return;
  if (!catchableFish().length || !state.targets.length) {
    setInstruction('还没有可抓的鱼。先回店里购买一种鱼的钓点，再回来捕鱼。', '玉子烧够用，但鱼要先开放钓点。');
    renderControls();
    return;
  }
  state.phase = 'extending';
  state.hookToken += 1;
  state.angle = clamp(state.angle, SWING_MIN_ANGLE, SWING_MAX_ANGLE);
  setInstruction('钩子已经射出，碰到鱼会自动拉回。', '瞄得不错，看看能不能钩住！');
  renderControls();
}

function finishFishing({ auto = false } = {}) {
  if (state.ended) return;
  if (state.phase !== 'aiming') {
    setInstruction('钩子还在水里，收回来后才能回店里。', '先把钩子收回来吧。');
    return;
  }
  state.ended = true;
  stopAnimationLoop();
  const total = state.totalCaught;
  resultCatchCount.textContent = total;
  resultTitle.textContent = auto
    ? '这一趟收获装满啦！'
    : total ? '这次钓得不错！' : '下次一定会抓到！';
  resultOverlay.classList.remove('is-hidden');
  window.requestAnimationFrame(() => backToKitchenButton.focus());
}

function returnToKitchen() {
  window.location.assign('index.html?scene=kitchen');
}

function handleSceneLaunch(event) {
  if (event.target.closest('.fish-stock-board, .fishing-speech, .catch-pop')) return;
  if (event.target.closest('button') && !event.target.closest('.fishing-target')) return;
  castHook();
}

function initializeFishing() {
  const save = readSave();
  const inventory = save.inventory && typeof save.inventory === 'object' ? save.inventory : {};
  state.unlockedFish = getUnlockedFish(save);
  state.rawFish = normalizeRawFish(inventory.rawFish);
  state.ropeLength = idleRopeLength();
  syncHookAnchor();

  if (state.unlockedFish.length && catchableFish().length) {
    setInstruction('钩子会来回摆动，瞄准水里的鱼后点击发射。', '看准时机，把新鲜食材抓回来！');
  } else if (state.unlockedFish.length) {
    setInstruction('鱼篓已经满了，先回店里把食材用掉吧。', '鱼篓装不下啦，先做点寿司。');
  } else {
    setInstruction('先回店里购买一种鱼的钓点，再来这里抓鱼。', '玉子烧够用，但鱼要先买钓点。');
  }
  render();
  renderHook();
  startAnimationLoop();
  if (document.readyState === 'complete') {
    window.requestAnimationFrame(prepareInitialTargets);
  } else {
    window.addEventListener('load', prepareInitialTargets, { once: true });
  }
}

fishingButton.addEventListener('click', castHook);
fishingScene.addEventListener('pointerdown', handleSceneLaunch);
finishFishingButton.addEventListener('click', finishFishing);
backToKitchenButton.addEventListener('click', returnToKitchen);
window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat || state.ended) return;
  event.preventDefault();
  castHook();
});
window.addEventListener('resize', () => {
  if (!state.ended) {
    syncHookAnchor();
    state.ropeLength = Math.min(state.ropeLength, maxRopeLength());
    renderHook();
  }
});
window.addEventListener('pagehide', () => {
  stopAnimationLoop();
  if (popTimer) window.clearTimeout(popTimer);
}, { once: true });

initializeFishing();
