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
const requestedScene = new URLSearchParams(window.location.search).get('scene');
let resetSaveDialogOpen = false;
let resetSaveDialogCloseTimer = null;
let wealthLeaderboardDialogOpen = false;
let wealthLeaderboardDialogCloseTimer = null;

const WEALTH_RIVALS = Object.freeze([
  { id: 'lighthouse', name: '灯塔食堂', revenue: 940 },
  { id: 'tide', name: '潮汐小铺', revenue: 610 },
  { id: 'seagull', name: '海鸥寿司屋', revenue: 360 },
  { id: 'shell', name: '贝壳餐车', revenue: 150 },
]);

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

function readWealthProfile() {
  try {
    const raw = window.localStorage.getItem(MENU_SAVE_KEY);
    if (!raw) return { revenue: 0, cash: 0, day: 1 };
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || saved.version !== 1) return { revenue: 0, cash: 0, day: 1 };
    return {
      revenue: storedAmount(saved.lifetimeRevenue ?? saved.cash),
      cash: storedAmount(saved.cash),
      day: Math.max(1, storedAmount(saved.day) || 1),
    };
  } catch {
    return { revenue: 0, cash: 0, day: 1 };
  }
}

function rankClass(rank) {
  if (rank === 1) return 'is-top-one';
  if (rank === 2) return 'is-top-two';
  if (rank === 3) return 'is-top-three';
  return '';
}

function renderWealthLeaderboard() {
  const profile = readWealthProfile();
  const entries = [
    ...WEALTH_RIVALS.map((rival) => ({ ...rival, isPlayer: false })),
    {
      id: 'player',
      name: '我的寿司店',
      revenue: profile.revenue,
      cash: profile.cash,
      day: profile.day,
      isPlayer: true,
    },
  ].sort((left, right) => (
    right.revenue - left.revenue
    || Number(right.isPlayer) - Number(left.isPlayer)
    || left.name.localeCompare(right.name, 'zh-CN')
  ));

  const playerRank = entries.findIndex((entry) => entry.isPlayer) + 1;
  wealthLeaderboardTotal.textContent = formatCurrency(profile.revenue);
  wealthLeaderboardRank.textContent = `当前第 ${playerRank} 名`;
  wealthLeaderboardList.replaceChildren();

  entries.forEach((entry, index) => {
    const rank = index + 1;
    const row = document.createElement('li');
    const rankBadge = document.createElement('span');
    const name = document.createElement('div');
    const title = document.createElement('b');
    const detail = document.createElement('span');
    const revenue = document.createElement('strong');

    row.className = `wealth-leaderboard-entry${entry.isPlayer ? ' is-player' : ''}`;
    rankBadge.className = `wealth-leaderboard-rank ${rankClass(rank)}`.trim();
    rankBadge.textContent = String(rank);
    title.textContent = entry.name;
    detail.textContent = entry.isPlayer
      ? `第 ${entry.day} 天 · 余额 ${formatCurrency(entry.cash)}`
      : '附近店主';
    name.className = 'wealth-leaderboard-name';
    name.append(title, detail);
    revenue.className = 'wealth-leaderboard-value';
    revenue.textContent = formatCurrency(entry.revenue);
    row.append(rankBadge, name, revenue);
    wealthLeaderboardList.append(row);
  });
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

// 这些素材会在主菜单停留时悄悄进入浏览器缓存，进制作台时就不会一张张跳出来。
const kitchenAssetSources = [
  'assets/restaurant/kitchen-layers/optimized/kitchen-background.jpg',
  'assets/restaurant/kitchen-layers/optimized/fish-well-frosted.png',
  'assets/restaurant/kitchen-layers/optimized/salmon-loin.png',
  'assets/restaurant/kitchen-layers/optimized/tuna-loin.png',
  'assets/restaurant/kitchen-layers/optimized/shrimp-loin.png',
  'assets/restaurant/kitchen-layers/optimized/shrimp-whole.png',
  'assets/restaurant/kitchen-layers/optimized/shrimp-head.png',
  'assets/restaurant/kitchen-layers/optimized/tamago-loin.png',
  'assets/restaurant/kitchen-layers/optimized/cutting-board.png',
  'assets/restaurant/kitchen-layers/optimized/trash-bin.png',
  'assets/restaurant/kitchen-layers/optimized/rice-bin.png',
  'assets/restaurant/kitchen-layers/optimized/rice-portion.png',
  'assets/restaurant/kitchen-layers/optimized/salmon-slice.png',
  'assets/restaurant/kitchen-layers/optimized/tuna-slice.png',
  'assets/restaurant/kitchen-layers/optimized/shrimp-slice.png',
  'assets/restaurant/kitchen-layers/optimized/tamago-slice.png',
  'assets/restaurant/kitchen-layers/optimized/salmon-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/tuna-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/shrimp-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/tamago-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/drink-machine-opaque.png',
  'assets/restaurant/kitchen-layers/optimized/cup-station.png',
  'assets/restaurant/kitchen-layers/optimized/tea-cup-empty.png',
  'assets/restaurant/kitchen-layers/optimized/tea-cup-ready.png',
  'assets/restaurant/customers/customer-summer.png',
  'assets/restaurant/customers/customer-fisher.png',
];
const fishingAssetSources = [
  'assets/fishing-v2/sea-background.png',
  'assets/fishing-v2/pier.png',
  'assets/fishing-v2/fisherman.png',
  'assets/fishing-v2/basket.png',
  'assets/fishing-v2/bobber.png',
  'assets/fishing-v2/salmon.png',
  'assets/fishing-v2/tuna-whole.png',
  'assets/restaurant/kitchen-layers/optimized/shrimp-whole.png',
];

function preloadImage(source) {
  const image = new Image();
  image.decoding = 'async';
  image.src = source;

  if (typeof image.decode === 'function') {
    return image.decode().catch(() => undefined);
  }

  return new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  });
}

function loadKitchenMarkup() {
  return fetch('kitchen.html', { cache: 'no-cache' }).then(async (response) => {
    if (!response.ok) throw new Error(`无法载入营业制作台：${response.status}`);
    return response.text();
  });
}

function loadFishingMarkup() {
  return fetch('fishing.html', { cache: 'no-cache' }).then(async (response) => {
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

// 从钓鱼场景返回或直接打开钓鱼时，不能被整套厨房素材阻塞。
// 主菜单只预热最可能马上进入的厨房；钓鱼场景则只在后台预热自己的图。
const kitchenAssetsReady = requestedScene === 'fishing'
  ? Promise.resolve()
  : Promise.all(kitchenAssetSources.map(preloadImage));
const fishingAssetsReady = requestedScene === 'fishing'
  ? Promise.all(fishingAssetSources.map(preloadImage))
  : Promise.resolve();

// 预加载只是为了让进场更顺，不该成为无法开始游戏的门槛。
// 个别图片在移动网络或 CDN 上迟迟没有完成解码时，继续在后台加载即可。
function waitForAssetWarmup(assetsReady, maximumWait = 2200) {
  return new Promise((resolve) => {
    let finished = false;
    let timeoutId = 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      resolve();
    };

    timeoutId = window.setTimeout(finish, maximumWait);
    Promise.resolve(assetsReady).then(finish, finish);
  });
}

const kitchenAssetWarmup = waitForAssetWarmup(kitchenAssetsReady);
const fishingAssetWarmup = waitForAssetWarmup(fishingAssetsReady);
let kitchenMarkupReady = loadKitchenMarkup();
let fishingMarkupReady = loadFishingMarkup();

function waitForMenuTransition() {
  return new Promise((resolve) => window.setTimeout(resolve, 700));
}

function waitForLoadingScreen() {
  return new Promise((resolve) => window.setTimeout(resolve, 1800));
}

async function enterKitchen(event) {
  const button = event?.currentTarget ?? startButton;
  if (menuStage.classList.contains('is-entering-game')) return;

  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  menuStage.classList.add('is-entering-game');

  try {
    await waitForMenuTransition();
    menuStage.classList.add('is-loading-game');

    const [kitchenMarkup] = await Promise.all([
      kitchenMarkupReady,
      kitchenAssetWarmup,
      waitForLoadingScreen(),
    ]);
    const kitchenDocument = new DOMParser().parseFromString(kitchenMarkup, 'text/html');
    const kitchenStage = kitchenDocument.querySelector('main');
    if (!kitchenStage) throw new Error('营业制作台内容不存在');

    document.body.replaceChildren(kitchenStage);
    document.title = '海边寿司店';

    const kitchenScript = document.createElement('script');
    kitchenScript.src = 'kitchen.js?v=wealth-board-v35-20260804';
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
  menuStage.classList.add('is-entering-game', 'is-loading-game');

  try {
    const [fishingMarkup] = await Promise.all([
      fishingMarkupReady,
      fishingAssetWarmup,
      waitForMenuTransition(),
      loadStylesheet('fishing-scene-style', 'fishing.css?v=modal-motion-v4-20260804'),
    ]);
    const fishingDocument = new DOMParser().parseFromString(fishingMarkup, 'text/html');
    const fishingStage = fishingDocument.querySelector('main');
    if (!fishingStage) throw new Error('钓鱼场景内容不存在');

    document.body.replaceChildren(fishingStage);
    document.title = '海边寿司店';

    const fishingScript = document.createElement('script');
    fishingScript.src = 'fishing.js?v=modal-motion-v9-20260804';
    fishingScript.defer = true;
    document.body.append(fishingScript);
  } catch (error) {
    document.querySelector('#fishing-scene-style')?.remove();
    menuStage.classList.remove('is-entering-game', 'is-loading-game');
    fishingMarkupReady = loadFishingMarkup();
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
  renderWealthLeaderboard();
  wealthLeaderboardDialogOpen = true;
  wealthLeaderboardDialog.classList.remove('is-hidden', 'is-closing');
  wealthLeaderboardDialog.setAttribute('aria-hidden', 'false');
  wealthLeaderboardButton.setAttribute('aria-expanded', 'true');
  window.requestAnimationFrame(() => closeWealthLeaderboardButton.focus());
}

function closeWealthLeaderboard() {
  if (!wealthLeaderboardDialogOpen || wealthLeaderboardDialog.classList.contains('is-closing')) return;
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

if (requestedScene === 'kitchen' || requestedScene === 'fishing') {
  window.history.replaceState({}, document.title, window.location.pathname);
  if (requestedScene === 'kitchen' || !canFishFromSavedDay()) enterKitchen();
  else enterFishing();
}
