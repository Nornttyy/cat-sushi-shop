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

// 这些素材会在主菜单停留时悄悄进入浏览器缓存，进制作台时就不会一张张跳出来。
const kitchenAssetSources = [
  'assets/restaurant/kitchen-layers/optimized/kitchen-background.jpg',
  'assets/restaurant/kitchen-layers/optimized/fish-well-frosted.png',
  'assets/restaurant/kitchen-layers/optimized/salmon-loin.png',
  'assets/restaurant/kitchen-layers/optimized/tuna-loin.png',
  'assets/restaurant/kitchen-layers/optimized/shrimp-loin.png',
  'assets/restaurant/kitchen-layers/optimized/mackerel-loin.png',
  'assets/restaurant/kitchen-layers/optimized/seabream-loin.png',
  'assets/restaurant/kitchen-layers/optimized/eel-loin.png',
  'assets/restaurant/kitchen-layers/optimized/uni-loin.png',
  'assets/restaurant/kitchen-layers/optimized/roe-loin.png',
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
  'assets/restaurant/kitchen-layers/optimized/mackerel-slice.png',
  'assets/restaurant/kitchen-layers/optimized/seabream-slice.png',
  'assets/restaurant/kitchen-layers/optimized/eel-slice.png',
  'assets/restaurant/kitchen-layers/optimized/tamago-slice.png',
  'assets/restaurant/kitchen-layers/optimized/uni-slice.png',
  'assets/restaurant/kitchen-layers/optimized/roe-slice.png',
  'assets/restaurant/kitchen-layers/optimized/salmon-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/tuna-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/shrimp-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/mackerel-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/seabream-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/eel-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/tamago-nigiri.png',
  'assets/restaurant/kitchen-layers/optimized/nori-sheets.png',
  'assets/restaurant/kitchen-layers/optimized/uni-gunkan.png',
  'assets/restaurant/kitchen-layers/optimized/roe-gunkan.png',
  'assets/restaurant/kitchen-layers/optimized/plate-stack.png',
  'assets/restaurant/kitchen-layers/optimized/sashimi-platter-salmon.png',
  'assets/restaurant/kitchen-layers/optimized/sashimi-platter-tuna.png',
  'assets/restaurant/kitchen-layers/optimized/sashimi-platter-shrimp.png',
  'assets/restaurant/kitchen-layers/optimized/sashimi-platter-mackerel.png',
  'assets/restaurant/kitchen-layers/optimized/sashimi-platter-seabream.png',
  'assets/restaurant/kitchen-layers/optimized/sashimi-platter-mixed.png',
  'assets/restaurant/kitchen-layers/optimized/drink-machine-opaque.png',
  'assets/restaurant/kitchen-layers/optimized/cup-station.png',
  'assets/restaurant/kitchen-layers/optimized/tea-cup-empty.png',
  'assets/restaurant/kitchen-layers/optimized/tea-cup-ready.png',
  'assets/restaurant/customers/customer-summer.png',
  'assets/restaurant/customers/customer-beggar.png',
  'assets/restaurant/customers/customer-fisher.png',
  'assets/restaurant/customers/customer-rush.png',
  'assets/restaurant/customers/customer-feast.png',
  'assets/restaurant/customers/customer-regular.png',
];
const fishingAssetSources = [
  'assets/fishing-v2/sea-background.png',
  'assets/fishing-v2/pier.png',
  'assets/fishing-v2/fisherman.png',
  'assets/fishing-v2/basket.png',
  'assets/fishing-v2/bobber.png',
  'assets/fishing-v2/golden-fishing-hook.png',
  'assets/fishing-v2/salmon.png',
  'assets/fishing-v2/tuna-whole.png',
  'assets/fishing-v2/mackerel.png',
  'assets/fishing-v2/seabream.png',
  'assets/fishing-v2/eel.png',
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

  window.SeasideSushiAudio?.play('ui');
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
    kitchenScript.src = 'kitchen.js?v=sushi-menu-v85-20260805';
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
      fishingMarkupReady,
      fishingAssetWarmup,
      waitForMenuTransition(),
      loadStylesheet('fishing-scene-style', 'fishing.css?v=sushi-menu-v6-20260805'),
    ]);
    const fishingDocument = new DOMParser().parseFromString(fishingMarkup, 'text/html');
    const fishingStage = fishingDocument.querySelector('main');
    if (!fishingStage) throw new Error('钓鱼场景内容不存在');

    document.body.replaceChildren(fishingStage);
    document.title = '海边寿司店';

    const fishingScript = document.createElement('script');
    fishingScript.src = 'fishing.js?v=sushi-menu-v76-20260805';
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
    if (!canFishFromSavedDay()) enterKitchen();
    else enterFishing();
  }
}
