const startButton = document.querySelector('#start-button');
const wealthLeaderboardButton = document.querySelector('#wealth-leaderboard-button');
const resetSaveButton = document.querySelector('#reset-save-button');
const saveResetStatus = document.querySelector('#save-reset-status');
const resetSaveDialog = document.querySelector('#reset-save-dialog');
const cancelResetSaveButton = document.querySelector('#cancel-reset-save-button');
const confirmResetSaveButton = document.querySelector('#confirm-reset-save-button');
const wealthLeaderboardDialog = document.querySelector('#wealth-leaderboard-dialog');
const wealthLeaderboardTotal = document.querySelector('#wealth-leaderboard-total');
const wealthLeaderboardRank = document.querySelector('#wealth-leaderboard-rank');
const wealthLeaderboardList = document.querySelector('#wealth-leaderboard-list');
const closeWealthLeaderboardButton = document.querySelector('#close-wealth-leaderboard-button');
const menuStage = document.querySelector('.main-menu-stage');
const MENU_SAVE_KEY = 'seaside-sushi-shop.save.v1';
const menuSearchParams = new URLSearchParams(window.location.search);
const requestedScene = menuSearchParams.get('scene');
const returningToMenu = menuSearchParams.get('returning') === '1';
let resetSaveDialogOpen = false;
let resetSaveDialogCloseTimer = null;
let wealthLeaderboardDialogOpen = false;
let wealthLeaderboardDialogCloseTimer = null;
let wealthLeaderboardRequest = 0;

function menuModalDuration(duration) {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 1 : duration;
}

function storedAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.min(9_999_999, Math.max(0, Math.floor(amount)));
}

function formatCurrency(value) {
  return `¥${storedAmount(value).toLocaleString('zh-CN')}`;
}

function rankClass(rank) {
  if (rank === 1) return 'is-top-one';
  if (rank === 2) return 'is-top-two';
  if (rank === 3) return 'is-top-three';
  return '';
}

function renderLeaderboardNotice(title, detail = '') {
  wealthLeaderboardList.replaceChildren();
  const row = document.createElement('li');
  const heading = document.createElement('b');
  const note = document.createElement('span');
  row.className = 'wealth-leaderboard-entry is-status';
  heading.textContent = title;
  note.textContent = detail;
  row.append(heading, note);
  wealthLeaderboardList.append(row);
}

function renderLeaderboardEntries(payload) {
  const me = payload?.me && typeof payload.me === 'object' ? payload.me : null;
  const listedEntries = Array.isArray(payload?.entries) ? payload.entries : [];
  if (!me) throw new Error('排行榜服务返回的数据不完整。');

  const entries = listedEntries
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      playerId: String(entry.playerId ?? ''),
      nickname: String(entry.nickname ?? '海边店主').slice(0, 24),
      rank: Math.max(1, Math.floor(Number(entry.rank) || 0)),
      revenue: storedAmount(entry.revenue),
    }));
  const playerId = String(me.playerId ?? '');
  const playerEntry = {
    playerId,
    nickname: String(me.nickname ?? '我的寿司店').slice(0, 24),
    rank: Math.max(1, Math.floor(Number(me.rank) || 0)),
    revenue: storedAmount(me.revenue),
  };
  if (!entries.some((entry) => entry.playerId && entry.playerId === playerId)) entries.push(playerEntry);
  entries.sort((left, right) => left.rank - right.rank || right.revenue - left.revenue);

  wealthLeaderboardTotal.textContent = formatCurrency(playerEntry.revenue);
  wealthLeaderboardRank.textContent = `全服第 ${playerEntry.rank} 名`;
  wealthLeaderboardList.replaceChildren();

  entries.forEach((entry) => {
    const row = document.createElement('li');
    const rankBadge = document.createElement('span');
    const name = document.createElement('div');
    const title = document.createElement('b');
    const detail = document.createElement('span');
    const revenue = document.createElement('strong');
    const isPlayer = entry.playerId && entry.playerId === playerId;

    row.className = `wealth-leaderboard-entry${isPlayer ? ' is-player' : ''}`;
    rankBadge.className = `wealth-leaderboard-rank ${rankClass(entry.rank)}`.trim();
    rankBadge.textContent = String(entry.rank);
    title.textContent = entry.nickname;
    detail.textContent = isPlayer ? '我的寿司店' : '在线店主';
    name.className = 'wealth-leaderboard-name';
    name.append(title, detail);
    revenue.className = 'wealth-leaderboard-value';
    revenue.textContent = formatCurrency(entry.revenue);
    row.append(rankBadge, name, revenue);
    wealthLeaderboardList.append(row);
  });
}

async function renderWealthLeaderboard() {
  const request = ++wealthLeaderboardRequest;
  const leaderboard = window.SeasideSushiLeaderboard;
  wealthLeaderboardTotal.textContent = '—';
  wealthLeaderboardRank.textContent = '正在连接全服排行榜';
  renderLeaderboardNotice('正在加载排行榜…', '首次连接时会自动生成匿名店主身份。');

  if (!leaderboard?.getLeaderboard) {
    wealthLeaderboardRank.textContent = '排行榜服务未加载';
    renderLeaderboardNotice('排行榜暂时不可用', '请刷新页面后重试。');
    return;
  }

  try {
    const payload = await leaderboard.getLeaderboard();
    if (request !== wealthLeaderboardRequest) return;
    renderLeaderboardEntries(payload);
  } catch {
    if (request !== wealthLeaderboardRequest) return;
    wealthLeaderboardTotal.textContent = '—';
    wealthLeaderboardRank.textContent = '暂时无法连接';
    renderLeaderboardNotice('排行榜服务正在启动', '稍后再点一次即可刷新。');
  }
}

function canFishFromSavedDay() {
  try {
    const raw = window.localStorage.getItem(MENU_SAVE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || saved.version !== 1) return false;
    if (saved.dayPhase === 'settlement') return true;

    // Preserve access for a legacy save that was already paused before the
    // day system existed. New saves must explicitly reach daily settlement.
    const hasSavedDay = Number.isFinite(Number(saved.day)) && Number(saved.day) >= 1;
    return !hasSavedDay && saved.shopOpen === false;
  } catch {
    return false;
  }
}

// 只有首屏正在看得到的素材会阻塞进入制作台。后续食材、主题和顾客会由
// kitchen.js 在空闲时按需预热，避免慢网为尚未解锁的内容等待十几兆图片。
const kitchenEntryAssetSources = [
  'assets/restaurant/kitchen-layers/optimized/kitchen-background.jpg',
  'assets/restaurant/kitchen-layers/optimized/fish-well-frosted-vivid-v2.png',
  'assets/restaurant/kitchen-layers/optimized/cutting-board-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/trash-bin-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/rice-bin-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/drink-machine-opaque-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/cup-station-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/tamago-loin-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/tamago-slice-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/tamago-nigiri-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/rice-portion-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/salmon-loin-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/salmon-slice-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/salmon-nigiri-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/tea-cup-empty-vivid-v1.png',
  'assets/restaurant/kitchen-layers/optimized/tea-cup-ready-vivid-v1.png',
];
const hookExpeditionAssetSources = [
  // The expedition is a separate illustration set. None of the former
  // bobber / golden-hook assets are requested or drawn in this scene.
  'assets/diving-expedition/island-base-v1.png',
  'assets/diving-expedition/underwater-reef-v1.png',
];

const shouldEnterFishing = requestedScene === 'fishing' && canFishFromSavedDay();

function preloadImage(source) {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;

    image.decoding = 'async';
    const finish = () => {
      if (settled) return;
      settled = true;
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', finish);
      resolve();
    };
    const handleLoad = () => {
      if (typeof image.decode !== 'function') {
        finish();
        return;
      }
      // `decode()` is only reliable after the network resource has loaded.
      // Calling it immediately after assigning `src` can reject early on slow
      // devices, which used to make the loader believe every image was ready.
      image.decode().catch(() => undefined).then(finish);
    };

    image.addEventListener('load', handleLoad, { once: true });
    image.addEventListener('error', finish, { once: true });
    image.src = source;

    // Cached images can finish before listeners are processed in some webviews.
    if (image.complete) {
      if (image.naturalWidth > 0) handleLoad();
      else finish();
    }
  });
}

function loadKitchenMarkup() {
  return fetch('kitchen.html', { cache: 'no-cache' }).then(async (response) => {
    if (!response.ok) throw new Error(`无法载入营业制作台：${response.status}`);
    return response.text();
  });
}

function loadHookExpeditionMarkup() {
  return fetch('hook-expedition.html', { cache: 'no-cache' }).then(async (response) => {
    if (!response.ok) throw new Error(`无法载入钓鱼场景：${response.status}`);
    return response.text();
  });
}

function loadStylesheet(id, href) {
  const current = document.querySelector(`#${id}`);
  if (current) return Promise.resolve(current);

  return new Promise((resolve, reject) => {
    const stylesheet = document.createElement('link');
    stylesheet.id = id;
    stylesheet.rel = 'stylesheet';
    stylesheet.href = href;
    stylesheet.addEventListener('load', () => resolve(stylesheet), { once: true });
    stylesheet.addEventListener('error', () => reject(new Error(`无法载入样式：${href}`)), { once: true });
    document.head.append(stylesheet);
  });
}

// 直接打开可用的钓鱼页时，不必预热厨房；若钓鱼条件不满足，优先预热
// 实际会回退进入的厨房，避免同时下载两套场景。
const hookExpeditionAssetsReady = shouldEnterFishing
  ? Promise.all(hookExpeditionAssetSources.map(preloadImage))
  : Promise.resolve();

// 场景切换必须等全部核心图像完成解码。此前的 2.2 秒上限会让慢网络
// 在素材仍是空白时进入游戏，因而这里不再以时间强制放行。
let kitchenAssetWarmup = shouldEnterFishing
  ? null
  : Promise.all(kitchenEntryAssetSources.map(preloadImage));
const hookExpeditionAssetWarmup = hookExpeditionAssetsReady;
let kitchenMarkupReady = loadKitchenMarkup();
let hookExpeditionMarkupReady = loadHookExpeditionMarkup();

function warmKitchenAssets() {
  // 直接打开钓鱼页时会跳过厨房预加载；若该存档不能钓鱼而回退到营业台，
  // 此处必须补回预加载，不能把厨房当作已经就绪。
  if (!kitchenAssetWarmup) {
    kitchenAssetWarmup = Promise.all(kitchenEntryAssetSources.map(preloadImage));
  }
  return kitchenAssetWarmup;
}

function waitForMenuTransition() {
  return new Promise((resolve) => window.setTimeout(resolve, 700));
}

function waitForLoadingScreen() {
  return new Promise((resolve) => window.setTimeout(resolve, 1800));
}

async function enterKitchen(event) {
  const button = event?.currentTarget ?? startButton;
  if (menuStage.classList.contains('is-entering-game')) return;

  window.SeasideSushiAudio?.play('ui');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  menuStage.classList.add('is-entering-game');

  try {
    await waitForMenuTransition();
    menuStage.classList.add('is-loading-game');

    const [kitchenMarkup] = await Promise.all([
      kitchenMarkupReady,
      warmKitchenAssets(),
      waitForLoadingScreen(),
    ]);
    const kitchenDocument = new DOMParser().parseFromString(kitchenMarkup, 'text/html');
    const kitchenStage = kitchenDocument.querySelector('main');
    if (!kitchenStage) throw new Error('营业制作台内容不存在');

    document.body.replaceChildren(kitchenStage);
    document.title = '海边寿司店';

    const kitchenScript = document.createElement('script');
    kitchenScript.src = 'kitchen.js?v=sushi-menu-v102-20260806';
    kitchenScript.defer = true;
    document.body.append(kitchenScript);
  } catch (error) {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    menuStage.classList.remove('is-entering-game', 'is-loading-game');
    kitchenMarkupReady = loadKitchenMarkup();
    console.error(error);
  }
}

async function enterFishing() {
  if (menuStage.classList.contains('is-entering-game')) return;
  window.SeasideSushiAudio?.play('ui');
  menuStage.classList.add('is-entering-game', 'is-loading-game');

  try {
    const [fishingMarkup] = await Promise.all([
      hookExpeditionMarkupReady,
      hookExpeditionAssetWarmup,
      waitForMenuTransition(),
      loadStylesheet('hook-expedition-style', 'hook-expedition.css?v=hook-expedition-v3-20260806'),
    ]);
    const fishingDocument = new DOMParser().parseFromString(fishingMarkup, 'text/html');
    const fishingStage = fishingDocument.querySelector('main');
    if (!fishingStage) throw new Error('钓鱼场景内容不存在');

    document.body.replaceChildren(fishingStage);
    document.title = '海边寿司店';

    const fishingScript = document.createElement('script');
    fishingScript.src = 'hook-expedition.js?v=hook-expedition-v3-20260806';
    fishingScript.defer = true;
    document.body.append(fishingScript);
  } catch (error) {
    document.querySelector('#hook-expedition-style')?.remove();
    menuStage.classList.remove('is-entering-game', 'is-loading-game');
    hookExpeditionMarkupReady = loadHookExpeditionMarkup();
    console.error(error);
  }
}

startButton.addEventListener('click', enterKitchen);

function openWealthLeaderboard() {
  if (resetSaveDialogOpen) return;
  if (wealthLeaderboardDialogCloseTimer !== null) {
    window.clearTimeout(wealthLeaderboardDialogCloseTimer);
    wealthLeaderboardDialogCloseTimer = null;
  }
  void renderWealthLeaderboard();
  wealthLeaderboardDialogOpen = true;
  wealthLeaderboardDialog.classList.remove('is-hidden', 'is-closing');
  wealthLeaderboardDialog.setAttribute('aria-hidden', 'false');
  wealthLeaderboardButton.setAttribute('aria-expanded', 'true');
  window.requestAnimationFrame(() => closeWealthLeaderboardButton.focus());
}

function closeWealthLeaderboard() {
  if (!wealthLeaderboardDialogOpen || wealthLeaderboardDialog.classList.contains('is-closing')) return;
  wealthLeaderboardRequest += 1;
  wealthLeaderboardDialogOpen = false;
  wealthLeaderboardDialog.setAttribute('aria-hidden', 'true');
  wealthLeaderboardDialog.classList.add('is-closing');
  wealthLeaderboardButton.setAttribute('aria-expanded', 'false');
  wealthLeaderboardDialogCloseTimer = window.setTimeout(() => {
    wealthLeaderboardDialogCloseTimer = null;
    wealthLeaderboardDialog.classList.remove('is-closing');
    wealthLeaderboardDialog.classList.add('is-hidden');
    window.requestAnimationFrame(() => wealthLeaderboardButton.focus());
  }, menuModalDuration(220));
}

function openResetSaveDialog() {
  if (wealthLeaderboardDialogOpen) return;
  if (resetSaveDialogCloseTimer !== null) {
    window.clearTimeout(resetSaveDialogCloseTimer);
    resetSaveDialogCloseTimer = null;
  }
  resetSaveDialogOpen = true;
  resetSaveDialog.classList.remove('is-hidden', 'is-closing');
  resetSaveDialog.setAttribute('aria-hidden', 'false');
  resetSaveButton.setAttribute('aria-expanded', 'true');
  window.requestAnimationFrame(() => cancelResetSaveButton.focus());
}

function closeResetSaveDialog() {
  if (!resetSaveDialogOpen || resetSaveDialog.classList.contains('is-closing')) return;
  resetSaveDialogOpen = false;
  resetSaveDialog.setAttribute('aria-hidden', 'true');
  resetSaveDialog.classList.add('is-closing');
  resetSaveButton.setAttribute('aria-expanded', 'false');
  resetSaveDialogCloseTimer = window.setTimeout(() => {
    resetSaveDialogCloseTimer = null;
    resetSaveDialog.classList.remove('is-closing');
    resetSaveDialog.classList.add('is-hidden');
    window.requestAnimationFrame(() => resetSaveButton.focus());
  }, menuModalDuration(220));
}

function resetSave() {
  try {
    window.localStorage.removeItem(MENU_SAVE_KEY);
    saveResetStatus.textContent = '存档已重置，下次营业会从零开始。';
  } catch {
    saveResetStatus.textContent = '当前浏览器无法重置存档。';
  }
  closeResetSaveDialog();
}

wealthLeaderboardButton.addEventListener('click', openWealthLeaderboard);
closeWealthLeaderboardButton.addEventListener('click', closeWealthLeaderboard);
wealthLeaderboardDialog.addEventListener('click', (event) => {
  if (event.target === wealthLeaderboardDialog) closeWealthLeaderboard();
});
window.addEventListener('seaside-sushi-leaderboard-update', () => {
  if (wealthLeaderboardDialogOpen) void renderWealthLeaderboard();
});
resetSaveButton.addEventListener('click', openResetSaveDialog);
cancelResetSaveButton.addEventListener('click', closeResetSaveDialog);
confirmResetSaveButton.addEventListener('click', resetSave);
resetSaveDialog.addEventListener('click', (event) => {
  if (event.target === resetSaveDialog) closeResetSaveDialog();
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (wealthLeaderboardDialogOpen) {
    event.preventDefault();
    closeWealthLeaderboard();
    return;
  }
  if (!resetSaveDialogOpen) return;
  event.preventDefault();
  closeResetSaveDialog();
});

if (requestedScene === 'kitchen' || requestedScene === 'fishing' || returningToMenu) {
  window.history.replaceState({}, document.title, window.location.pathname);
  if (requestedScene === 'kitchen') enterKitchen();
  else if (requestedScene === 'fishing') {
    if (!shouldEnterFishing) enterKitchen();
    else enterFishing();
  }
}
