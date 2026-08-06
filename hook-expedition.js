(() => {
  'use strict';

  const SAVE_KEY = 'seaside-sushi-shop.save.v1';
  const SAVE_VERSION = 1;
  const FISH_IDS = Object.freeze(['salmon', 'tuna', 'shrimp', 'mackerel', 'seabream', 'eel']);
  const RAW_FISH_CAPACITIES = Object.freeze([12, 18, 26, 36]);
  const WORLD = Object.freeze({ width: 2700, height: 1640, anchor: { x: 238, y: 780 } });
  const LINE_LENGTHS = Object.freeze([620, 870, 1160, 1500]);
  const HOOK_CAPACITIES = Object.freeze([5, 8, 12, 16]);
  const LINE_PRICES = Object.freeze([260, 620, 1280]);
  const HOOK_PRICES = Object.freeze([320, 760, 1520]);
  const FISH_CATALOG = Object.freeze({
    salmon: Object.freeze({ id: 'salmon', name: '三文鱼', weight: 44, size: 94, sprite: 'assets/diving-expedition/fish-salmon-vivid-v1.png' }),
    tuna: Object.freeze({ id: 'tuna', name: '金枪鱼', weight: 20, size: 112, sprite: 'assets/diving-expedition/fish-tuna-vivid-v1.png' }),
    shrimp: Object.freeze({ id: 'shrimp', name: '甜虾', weight: 31, size: 82, sprite: 'assets/diving-expedition/fish-shrimp-vivid-v1.png' }),
    mackerel: Object.freeze({ id: 'mackerel', name: '鲭鱼', weight: 38, size: 96, sprite: 'assets/diving-expedition/fish-mackerel-vivid-v1.png' }),
    seabream: Object.freeze({ id: 'seabream', name: '真鲷', weight: 18, size: 90, sprite: 'assets/diving-expedition/fish-seabream-vivid-v1.png' }),
    eel: Object.freeze({ id: 'eel', name: '蒲烧鳗鱼', weight: 10, size: 122, sprite: 'assets/diving-expedition/fish-eel-vivid-v1.png' }),
  });
  const OBSTACLE_SPRITES = Object.freeze({
    'is-rock': 'assets/diving-expedition/reef-rock-vivid-v1.png',
    'is-coral': 'assets/diving-expedition/reef-coral-vivid-v1.png',
    'is-kelp': 'assets/diving-expedition/reef-seaweed-vivid-v1.png',
    'is-star': 'assets/diving-expedition/reef-star-vivid-v1.png',
  });
  const DIRECTIONS = Object.freeze({
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  });

  const $ = (selector) => document.querySelector(selector);
  const stage = $('#hook-expedition-stage');
  const underwater = $('#underwater-expedition');
  const viewport = $('#underwater-viewport');
  const world = $('#underwater-world');
  const lineLayer = $('#hook-line-layer');
  const hookLine = $('#hook-line');
  const hookAnchor = $('#hook-anchor');
  const hook = $('#explorer-hook');
  const fishLayer = $('#underwater-fish');
  const obstacleLayer = $('#underwater-obstacles');
  const catchPop = $('#hook-catch-pop');
  const cashValue = $('#expedition-cash');
  const lineLengthValue = $('#line-length-value');
  const hookBagValue = $('#hook-bag-value');
  const message = $('#expedition-message');
  const launchButton = $('#launch-hook-button');
  const reelButton = $('#reel-hook-button');
  const returnButton = $('#return-kitchen-button');
  const openShopButton = $('#open-hook-shop');
  const shopPanel = $('#hook-shop-panel');
  const closeShopButton = $('#close-hook-shop');
  const lineUpgradeDetail = $('#line-upgrade-detail');
  const hookUpgradeDetail = $('#hook-upgrade-detail');
  const buyLineButton = $('#buy-line-upgrade');
  const buyHookButton = $('#buy-hook-upgrade');
  const shopNote = $('#hook-shop-note');
  const resultOverlay = $('#hook-result-overlay');
  const resultTitle = $('#hook-result-title');
  const resultDetail = $('#hook-result-detail');
  const closeResultButton = $('#close-hook-result');
  const directionPad = $('#underwater-direction-pad');

  const state = {
    validEntry: false,
    phase: 'island',
    save: null,
    cash: 0,
    unlockedFish: [],
    featuredFish: null,
    rawFish: emptyRawFish(),
    rawFishCapacity: RAW_FISH_CAPACITIES[0],
    fishingUpgrades: normalizeFishingUpgrades({}),
    hook: { x: WORLD.anchor.x + 72, y: WORLD.anchor.y },
    anchor: { ...WORLD.anchor },
    keys: new Set(),
    obstacles: [],
    fish: [],
    bag: [],
    mapSerial: 0,
    animationFrame: null,
    lastFrame: 0,
    popTimer: null,
    resultTimer: null,
  };

  function asNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function asCount(value, maximum = Number.MAX_SAFE_INTEGER) {
    return Math.min(maximum, Math.max(0, Math.floor(asNumber(value, 0))));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function emptyRawFish() {
    return Object.fromEntries(FISH_IDS.map((id) => [id, 0]));
  }

  function normalizeRawFish(value) {
    const source = value && typeof value === 'object' ? value : {};
    return Object.fromEntries(FISH_IDS.map((id) => [id, asCount(source[id])]));
  }

  function normalizeFishingUpgrades(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      lineLength: asCount(source.lineLength, LINE_LENGTHS.length - 1),
      hookCapacity: asCount(source.hookCapacity, HOOK_CAPACITIES.length - 1),
    };
  }

  function rawFishTotal(rawFish = state.rawFish) {
    return FISH_IDS.reduce((total, id) => total + asCount(rawFish?.[id]), 0);
  }

  function freezerCapacityFromSave(save) {
    const levels = save?.storageLevels && typeof save.storageLevels === 'object' ? save.storageLevels : {};
    const freezerLevel = asCount(levels.freezer, RAW_FISH_CAPACITIES.length - 1);
    return RAW_FISH_CAPACITIES[freezerLevel] ?? RAW_FISH_CAPACITIES[0];
  }

  function lineLength() {
    return LINE_LENGTHS[state.fishingUpgrades.lineLength] ?? LINE_LENGTHS[0];
  }

  function hookCapacity() {
    return HOOK_CAPACITIES[state.fishingUpgrades.hookCapacity] ?? HOOK_CAPACITIES[0];
  }

  function readSave() {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      return saved && typeof saved === 'object' && saved.version === SAVE_VERSION ? saved : null;
    } catch {
      return null;
    }
  }

  function canFishFromSavedDay(save) {
    if (!save || typeof save !== 'object') return false;
    if (save.dayPhase === 'settlement') return true;
    const hasSavedDay = Number.isFinite(Number(save.day)) && Number(save.day) >= 1;
    return !hasSavedDay && save.shopOpen === false;
  }

  function unlockedFishFromSave(save) {
    const unlocked = Array.isArray(save?.unlockedIngredients) ? save.unlockedIngredients : [];
    return FISH_IDS.filter((id) => unlocked.includes(id));
  }

  function loadSave(save = readSave()) {
    state.save = save;
    state.validEntry = canFishFromSavedDay(save);
    state.cash = asCount(save?.cash, 9_999_999);
    state.unlockedFish = unlockedFishFromSave(save);
    state.featuredFish = typeof save?.fishingFeaturedFish === 'string' && state.unlockedFish.includes(save.fishingFeaturedFish)
      ? save.fishingFeaturedFish
      : null;
    state.rawFish = normalizeRawFish(save?.inventory?.rawFish);
    state.rawFishCapacity = freezerCapacityFromSave(save);
    state.fishingUpgrades = normalizeFishingUpgrades(save?.fishingUpgrades);
  }

  function writeSave(mutator) {
    const latest = readSave();
    if (!latest || !canFishFromSavedDay(latest)) return { ok: false, reason: 'stale' };
    // JSON saves only contain plain data; this keeps the scene compatible
    // with older mobile WebViews that do not yet provide structuredClone.
    const next = mutator(JSON.parse(JSON.stringify(latest)));
    if (!next || typeof next !== 'object') return { ok: false, reason: 'storage' };
    try {
      next.version = SAVE_VERSION;
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      loadSave(next);
      return { ok: true, save: next };
    } catch {
      return { ok: false, reason: 'storage' };
    }
  }

  function formatCash(value) {
    return `¥${asCount(value, 9_999_999).toLocaleString('zh-CN')}`;
  }

  function setMessage(text) {
    message.textContent = text;
  }

  function playSound(name) {
    window.SeasideSushiAudio?.play?.(name);
  }

  function setShopNote(text = '') {
    shopNote.textContent = text;
  }

  function transitionDuration(duration) {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 1 : duration;
  }

  function renderHud() {
    cashValue.textContent = formatCash(state.cash);
    lineLengthValue.textContent = `${lineLength()}m`;
    hookBagValue.textContent = `${state.bag.length} / ${hookCapacity()}`;
    hook.classList.toggle('is-full', state.bag.length >= hookCapacity());
  }

  function nextUpgradeLabel(level, values, prices, suffix, fallback) {
    if (level >= values.length - 1) return `已达最高 ${values[values.length - 1]}${suffix}`;
    return `下一级 ${values[level + 1]}${suffix} · ${formatCash(prices[level] ?? 0)}`;
  }

  function renderShop() {
    const lineLevel = state.fishingUpgrades.lineLength;
    const bagLevel = state.fishingUpgrades.hookCapacity;
    lineUpgradeDetail.textContent = nextUpgradeLabel(lineLevel, LINE_LENGTHS, LINE_PRICES, 'm', '');
    hookUpgradeDetail.textContent = nextUpgradeLabel(bagLevel, HOOK_CAPACITIES, HOOK_PRICES, ' 条', '');

    const lineMaxed = lineLevel >= LINE_LENGTHS.length - 1;
    const bagMaxed = bagLevel >= HOOK_CAPACITIES.length - 1;
    const lineCost = LINE_PRICES[lineLevel] ?? 0;
    const bagCost = HOOK_PRICES[bagLevel] ?? 0;
    buyLineButton.disabled = !state.validEntry || lineMaxed || state.cash < lineCost;
    buyHookButton.disabled = !state.validEntry || bagMaxed || state.cash < bagCost;
    buyLineButton.textContent = lineMaxed ? '已满级' : `升级 ${formatCash(lineCost)}`;
    buyHookButton.textContent = bagMaxed ? '已满级' : `升级 ${formatCash(bagCost)}`;
  }

  function canLaunch() {
    return state.validEntry && state.unlockedFish.length > 0 && rawFishTotal() < state.rawFishCapacity;
  }

  function renderIslandActions() {
    launchButton.disabled = !canLaunch();
    returnButton.disabled = state.phase !== 'island';
    if (!state.validEntry) setMessage('请结束今天的营业后，再从海边出发。');
    else if (!state.unlockedFish.length) setMessage('先在店里的采购商店购买鱼类，海里才会出现对应食材。');
    else if (rawFishTotal() >= state.rawFishCapacity) setMessage('冰柜已经装满，先回店里把食材做成寿司吧。');
    else if (state.phase === 'island') setMessage('每次抛钩都会生成一张新的大海域。');
  }

  function openShop() {
    if (state.phase !== 'island') return;
    renderShop();
    setShopNote('');
    shopPanel.classList.remove('is-hidden');
    shopPanel.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => closeShopButton.focus());
    playSound('ui');
  }

  function closeShop() {
    shopPanel.classList.add('is-hidden');
    shopPanel.setAttribute('aria-hidden', 'true');
  }

  function buyUpgrade(kind) {
    const config = kind === 'lineLength'
      ? { values: LINE_LENGTHS, prices: LINE_PRICES, name: '鱼线长度' }
      : { values: HOOK_CAPACITIES, prices: HOOK_PRICES, name: '鱼钩容量' };
    const level = state.fishingUpgrades[kind];
    if (level >= config.values.length - 1) {
      setShopNote(`${config.name}已经是最高级。`);
      return;
    }
    const price = config.prices[level] ?? 0;
    if (state.cash < price) {
      setShopNote(`还差 ${formatCash(price - state.cash)}。`);
      return;
    }
    const result = writeSave((saved) => {
      const savedCash = asCount(saved.cash, 9_999_999);
      const upgrades = normalizeFishingUpgrades(saved.fishingUpgrades);
      if (savedCash < price || upgrades[kind] !== level) return null;
      upgrades[kind] += 1;
      saved.cash = savedCash - price;
      saved.fishingUpgrades = upgrades;
      return saved;
    });
    if (!result.ok) {
      setShopNote('存档已变化，请回店里后再试。');
      return;
    }
    setShopNote(`${config.name}升级完成！`);
    renderHud();
    renderShop();
    renderIslandActions();
    playSound('purchase');
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let output = value;
      output = Math.imul(output ^ (output >>> 15), output | 1);
      output ^= output + Math.imul(output ^ (output >>> 7), output | 61);
      return ((output ^ (output >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomWeightedFish(random, pool) {
    const total = pool.reduce((sum, id) => sum + (FISH_CATALOG[id]?.weight ?? 1), 0);
    let ticket = random() * total;
    for (const id of pool) {
      ticket -= FISH_CATALOG[id]?.weight ?? 1;
      if (ticket <= 0) return id;
    }
    return pool[0];
  }

  function distance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function collidesObstacle(position, clearance = 0) {
    return state.obstacles.some((obstacle) => {
      const dx = (position.x - obstacle.x) / (obstacle.radiusX + clearance);
      const dy = (position.y - obstacle.y) / (obstacle.radiusY + clearance);
      return (dx * dx) + (dy * dy) < 1;
    });
  }

  function randomOpenPosition(random, minimumFromAnchor = 180, clearance = 0) {
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const candidate = {
        x: 170 + random() * (WORLD.width - 330),
        y: 150 + random() * (WORLD.height - 300),
      };
      if (distance(candidate, state.anchor) < minimumFromAnchor) continue;
      if (!collidesObstacle(candidate, clearance)) return candidate;
    }
    return { x: WORLD.width * .68, y: WORLD.height * .52 };
  }

  function makeObstacle(random, index) {
    const type = ['is-rock', 'is-coral', 'is-kelp', 'is-star'][Math.floor(random() * 4)];
    const isStar = type === 'is-star';
    const width = (isStar ? 92 : 115) + Math.floor(random() * (isStar ? 78 : 135));
    const height = (isStar ? 76 : 95) + Math.floor(random() * (isStar ? 68 : 118));
    const position = randomOpenPosition(random, 260, Math.max(width, height) * .38);
    return {
      id: `${state.mapSerial}-${index}`,
      x: position.x,
      y: position.y,
      width,
      height,
      radiusX: width * .45,
      radiusY: height * .42,
      rotation: Math.round((random() * 36) - 18),
      type,
    };
  }

  function renderObstacles() {
    obstacleLayer.replaceChildren();
    const fragment = document.createDocumentFragment();
    state.obstacles.forEach((obstacle) => {
      const element = document.createElement('div');
      element.className = `reef-obstacle ${obstacle.type}`;
      element.style.left = `${obstacle.x}px`;
      element.style.top = `${obstacle.y}px`;
      element.style.setProperty('--obstacle-width', `${obstacle.width}px`);
      element.style.setProperty('--obstacle-height', `${obstacle.height}px`);
      element.style.setProperty('--obstacle-rotate', `${obstacle.rotation}deg`);
      element.style.setProperty('--obstacle-sprite', `url("${OBSTACLE_SPRITES[obstacle.type] ?? OBSTACLE_SPRITES['is-rock']}")`);
      fragment.append(element);
    });
    obstacleLayer.append(fragment);
  }

  function makeFish(random, index, forceId = null) {
    const id = forceId ?? randomWeightedFish(random, state.unlockedFish);
    const fishType = FISH_CATALOG[id] ?? FISH_CATALOG.salmon;
    let position = randomOpenPosition(random, 220, fishType.size * .68);
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const overlapsFish = state.fish.some((fish) => distance(position, fish) < fishType.size + fish.size);
      if (!overlapsFish) break;
      position = randomOpenPosition(random, 220, fishType.size * .68);
    }
    return {
      id: `${state.mapSerial}-fish-${index}`,
      fishId: id,
      x: position.x,
      y: position.y,
      size: fishType.size * (.88 + random() * .34),
      facing: random() > .5 ? 1 : -1,
      speed: `${(2.4 + random() * 2.8).toFixed(2)}s`,
      delay: `${(-random() * 3).toFixed(2)}s`,
      caught: false,
      element: null,
    };
  }

  function renderFish() {
    fishLayer.replaceChildren();
    const fragment = document.createDocumentFragment();
    state.fish.forEach((fish) => {
      const type = FISH_CATALOG[fish.fishId] ?? FISH_CATALOG.salmon;
      const element = document.createElement('div');
      element.className = 'expedition-fish';
      element.dataset.fishId = fish.fishId;
      element.setAttribute('role', 'img');
      element.setAttribute('aria-label', type.name);
      element.style.left = `${fish.x}px`;
      element.style.top = `${fish.y}px`;
      element.style.setProperty('--fish-size', `${Math.round(fish.size)}px`);
      element.style.setProperty('--fish-face', String(fish.facing));
      element.style.setProperty('--fish-speed', fish.speed);
      element.style.setProperty('--fish-delay', fish.delay);
      element.style.setProperty('--fish-sprite', `url("${type.sprite}")`);
      fish.element = element;
      fragment.append(element);
    });
    fishLayer.append(fragment);
  }

  function generateMap() {
    state.mapSerial += 1;
    const seed = (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF) ^ (state.mapSerial * 1973)) >>> 0;
    const random = seededRandom(seed);
    world.style.setProperty('--map-hue', `${Math.round((random() * 18) - 9)}deg`);
    world.style.setProperty('--map-saturation', `${(random() * .12).toFixed(2)}`);
    world.style.setProperty('--map-light', `${(0.96 + random() * .12).toFixed(2)}`);
    state.obstacles = [];
    const obstacleCount = 25 + Math.floor(random() * 10);
    for (let index = 0; index < obstacleCount; index += 1) state.obstacles.push(makeObstacle(random, index));
    state.fish = [];
    const fishCount = 16 + Math.floor(random() * 7) + (state.unlockedFish.length * 2);
    if (state.featuredFish) state.fish.push(makeFish(random, 0, state.featuredFish));
    while (state.fish.length < fishCount) state.fish.push(makeFish(random, state.fish.length));
    renderObstacles();
    renderFish();
  }

  function setHookPosition(x, y) {
    state.hook.x = clamp(x, 48, WORLD.width - 48);
    state.hook.y = clamp(y, 48, WORLD.height - 48);
    const vectorX = state.hook.x - state.anchor.x;
    const vectorY = state.hook.y - state.anchor.y;
    const currentLength = Math.hypot(vectorX, vectorY);
    if (currentLength > lineLength()) {
      const scale = lineLength() / currentLength;
      state.hook.x = state.anchor.x + (vectorX * scale);
      state.hook.y = state.anchor.y + (vectorY * scale);
    }
  }

  function updateWorld() {
    const dx = state.hook.x - state.anchor.x;
    const dy = state.hook.y - state.anchor.y;
    const lineDistance = Math.hypot(dx, dy);
    hook.style.left = `${state.hook.x}px`;
    hook.style.top = `${state.hook.y}px`;
    hook.style.setProperty('--hook-angle', `${Math.atan2(dy, dx) * (180 / Math.PI) + 90}deg`);
    hookAnchor.style.left = `${state.anchor.x}px`;
    hookAnchor.style.top = `${state.anchor.y}px`;
    hookLine.setAttribute('x1', String(state.anchor.x));
    hookLine.setAttribute('y1', String(state.anchor.y));
    hookLine.setAttribute('x2', String(state.hook.x));
    hookLine.setAttribute('y2', String(state.hook.y));
    lineLayer.classList.toggle('is-tight', lineDistance >= lineLength() - 6);

    const viewportWidth = viewport.clientWidth || 1280;
    const viewportHeight = viewport.clientHeight || 720;
    const cameraX = clamp((viewportWidth * .48) - state.hook.x, viewportWidth - WORLD.width, 0);
    const cameraY = clamp((viewportHeight * .52) - state.hook.y, viewportHeight - WORLD.height, 0);
    world.style.setProperty('--camera-x', `${cameraX}px`);
    world.style.setProperty('--camera-y', `${cameraY}px`);
  }

  function showCatchPop(text) {
    if (state.popTimer) window.clearTimeout(state.popTimer);
    catchPop.textContent = text;
    catchPop.style.left = `${state.hook.x}px`;
    catchPop.style.top = `${state.hook.y - 54}px`;
    catchPop.classList.remove('is-showing');
    void catchPop.offsetWidth;
    catchPop.classList.add('is-showing');
    state.popTimer = window.setTimeout(() => catchPop.classList.remove('is-showing'), transitionDuration(900));
  }

  function catchNearbyFish() {
    if (state.bag.length >= hookCapacity()) return;
    const target = state.fish.find((fish) => !fish.caught && distance(state.hook, fish) <= Math.max(60, fish.size * .58));
    if (!target) return;
    target.caught = true;
    target.element?.classList.add('is-caught');
    state.bag.push(target.fishId);
    const type = FISH_CATALOG[target.fishId] ?? FISH_CATALOG.salmon;
    showCatchPop(`钓到 ${type.name}`);
    renderHud();
    if (state.bag.length >= hookCapacity()) setMessage('鱼钩已经装满，收线把食材带回去吧！');
    else setMessage(`钓到${type.name}！继续往更深处探索。`);
    playSound('hook');
  }

  function tryMoveHook(dt) {
    let horizontal = 0;
    let vertical = 0;
    if (state.keys.has('left')) horizontal -= 1;
    if (state.keys.has('right')) horizontal += 1;
    if (state.keys.has('up')) vertical -= 1;
    if (state.keys.has('down')) vertical += 1;
    if (!horizontal && !vertical) return;
    const magnitude = Math.hypot(horizontal, vertical) || 1;
    const speed = 355;
    const candidate = {
      x: state.hook.x + ((horizontal / magnitude) * speed * dt),
      y: state.hook.y + ((vertical / magnitude) * speed * dt),
    };
    const before = { ...state.hook };
    setHookPosition(candidate.x, candidate.y);
    if (collidesObstacle(state.hook, 28)) {
      state.hook.x = before.x;
      state.hook.y = before.y;
      return;
    }
    catchNearbyFish();
  }

  function finishReel() {
    state.phase = 'island';
    state.keys.clear();
    stage.classList.remove('is-underwater');
    underwater.setAttribute('aria-hidden', 'true');
    reelButton.disabled = true;
    const carried = [...state.bag];
    state.bag = [];
    const result = depositCatch(carried);
    renderHud();
    renderIslandActions();
    playSound('reel');
    window.setTimeout(() => showResult(result), transitionDuration(380));
  }

  function updateReeling(dt) {
    const vectorX = state.anchor.x - state.hook.x;
    const vectorY = state.anchor.y - state.hook.y;
    const remaining = Math.hypot(vectorX, vectorY);
    if (remaining <= 8) {
      setHookPosition(state.anchor.x, state.anchor.y);
      finishReel();
      return;
    }
    const speed = Math.max(420, lineLength() * .78);
    const move = Math.min(remaining, speed * dt);
    setHookPosition(state.hook.x + ((vectorX / remaining) * move), state.hook.y + ((vectorY / remaining) * move));
  }

  function animationFrame(timestamp) {
    const previous = state.lastFrame || timestamp;
    const dt = Math.min(.05, Math.max(.001, (timestamp - previous) / 1000));
    state.lastFrame = timestamp;
    if (state.phase === 'exploring') tryMoveHook(dt);
    else if (state.phase === 'reeling') updateReeling(dt);
    if (state.phase === 'exploring' || state.phase === 'reeling') {
      updateWorld();
      state.animationFrame = window.requestAnimationFrame(animationFrame);
    } else {
      state.animationFrame = null;
    }
  }

  function beginAnimation() {
    if (state.animationFrame !== null) window.cancelAnimationFrame(state.animationFrame);
    state.lastFrame = 0;
    state.animationFrame = window.requestAnimationFrame(animationFrame);
  }

  function launchHook() {
    if (!canLaunch()) {
      renderIslandActions();
      return;
    }
    closeShop();
    state.phase = 'exploring';
    state.bag = [];
    state.anchor = { ...WORLD.anchor };
    setHookPosition(state.anchor.x + 84, state.anchor.y);
    generateMap();
    stage.classList.add('is-underwater');
    underwater.setAttribute('aria-hidden', 'false');
    reelButton.disabled = false;
    renderHud();
    setMessage('用方向键或屏幕方向盘控制鱼钩，别撞上珊瑚和岩石。');
    playSound('cast');
    window.requestAnimationFrame(() => {
      updateWorld();
      beginAnimation();
    });
  }

  function reelHook() {
    if (state.phase !== 'exploring') return;
    state.phase = 'reeling';
    state.keys.clear();
    reelButton.disabled = true;
    setMessage('正在收线，鱼钩会把这次的收获带回码头。');
    playSound('reel');
  }

  function depositCatch(caughtFish) {
    if (!caughtFish.length) return { added: 0, lost: 0, reason: 'empty' };
    let report = { added: 0, lost: caughtFish.length };
    const result = writeSave((saved) => {
      const inventory = saved.inventory && typeof saved.inventory === 'object' ? saved.inventory : {};
      const rawFish = normalizeRawFish(inventory.rawFish);
      const capacity = freezerCapacityFromSave(saved);
      const freeSlots = Math.max(0, capacity - rawFishTotal(rawFish));
      const accepted = caughtFish.slice(0, freeSlots);
      accepted.forEach((id) => { rawFish[id] += 1; });
      saved.inventory = { ...inventory, rawFish };
      report = { added: accepted.length, lost: Math.max(0, caughtFish.length - accepted.length) };
      return saved;
    });
    if (!result.ok) return { added: 0, lost: caughtFish.length, reason: 'stale' };
    return { added: report.added, lost: report.lost, reason: null };
  }

  function showResult(result) {
    if (result.reason === 'empty') {
      resultTitle.textContent = '这次没有钓到鱼';
      resultDetail.textContent = '换个方向再抛一次，新的海域会重新生成。';
    } else if (result.reason === 'stale') {
      resultTitle.textContent = '没有成功带回';
      resultDetail.textContent = '存档已经变化，请回店里确认后再出发。';
    } else {
      resultTitle.textContent = result.added ? '收获已带回冰柜' : '冰柜已经满了';
      resultDetail.textContent = result.lost
        ? `带回 ${result.added} 条，冰柜空间不足，留下 ${result.lost} 条。`
        : `这次带回 ${result.added} 条新鲜食材。`;
    }
    resultOverlay.classList.remove('is-hidden');
    resultOverlay.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => closeResultButton.focus());
  }

  function closeResult() {
    resultOverlay.classList.add('is-hidden');
    resultOverlay.setAttribute('aria-hidden', 'true');
    renderIslandActions();
    launchButton.focus();
  }

  function returnToKitchen() {
    if (state.phase !== 'island') return;
    playSound('ui');
    returnButton.disabled = true;
    setMessage('正在回到寿司店…');
    window.setTimeout(() => window.location.assign('./?scene=kitchen'), transitionDuration(240));
  }

  function handleKey(event, pressed) {
    const direction = DIRECTIONS[event.code];
    if (!direction || state.phase !== 'exploring') return;
    event.preventDefault();
    if (pressed) state.keys.add(direction);
    else state.keys.delete(direction);
  }

  function bindDirectionPad() {
    directionPad.querySelectorAll('[data-direction]').forEach((button) => {
      const direction = button.dataset.direction;
      const setPressed = (pressed) => {
        if (state.phase !== 'exploring') return;
        if (pressed) state.keys.add(direction);
        else state.keys.delete(direction);
      };
      button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture?.(event.pointerId); setPressed(true); });
      button.addEventListener('pointerup', () => setPressed(false));
      button.addEventListener('pointercancel', () => setPressed(false));
      button.addEventListener('pointerleave', (event) => { if (event.buttons) return; setPressed(false); });
    });
  }

  function initialize() {
    world.style.setProperty('--world-width', `${WORLD.width}px`);
    world.style.setProperty('--world-height', `${WORLD.height}px`);
    lineLayer.setAttribute('viewBox', `0 0 ${WORLD.width} ${WORLD.height}`);
    loadSave();
    renderHud();
    renderShop();
    renderIslandActions();
    hookAnchor.style.left = `${state.anchor.x}px`;
    hookAnchor.style.top = `${state.anchor.y}px`;

    launchButton.addEventListener('click', launchHook);
    reelButton.addEventListener('click', reelHook);
    returnButton.addEventListener('click', returnToKitchen);
    openShopButton.addEventListener('click', openShop);
    closeShopButton.addEventListener('click', closeShop);
    shopPanel.addEventListener('click', (event) => { if (event.target === shopPanel) closeShop(); });
    buyLineButton.addEventListener('click', () => buyUpgrade('lineLength'));
    buyHookButton.addEventListener('click', () => buyUpgrade('hookCapacity'));
    closeResultButton.addEventListener('click', closeResult);
    resultOverlay.addEventListener('click', (event) => { if (event.target === resultOverlay) closeResult(); });
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        if (!shopPanel.classList.contains('is-hidden')) { event.preventDefault(); closeShop(); return; }
        if (!resultOverlay.classList.contains('is-hidden')) { event.preventDefault(); closeResult(); return; }
      }
      handleKey(event, true);
    });
    window.addEventListener('keyup', (event) => handleKey(event, false));
    window.addEventListener('blur', () => state.keys.clear());
    window.addEventListener('resize', () => { if (state.phase === 'exploring' || state.phase === 'reeling') updateWorld(); });
    window.addEventListener('storage', (event) => {
      if (event.key !== SAVE_KEY || state.phase !== 'island') return;
      loadSave();
      renderHud();
      renderShop();
      renderIslandActions();
    });
    bindDirectionPad();
  }

  initialize();
})();
