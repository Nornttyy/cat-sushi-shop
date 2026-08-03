const startButton = document.querySelector('#start-button');
const resetSaveButton = document.querySelector('#reset-save-button');
const saveResetStatus = document.querySelector('#save-reset-status');
const resetSaveDialog = document.querySelector('#reset-save-dialog');
const cancelResetSaveButton = document.querySelector('#cancel-reset-save-button');
const confirmResetSaveButton = document.querySelector('#confirm-reset-save-button');
const menuStage = document.querySelector('.main-menu-stage');
const MENU_SAVE_KEY = 'seaside-sushi-shop.save.v1';
const requestedScene = new URLSearchParams(window.location.search).get('scene');
let resetSaveDialogOpen = false;

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

const kitchenAssetsReady = Promise.all(kitchenAssetSources.map(preloadImage));
const fishingAssetsReady = Promise.all(fishingAssetSources.map(preloadImage));
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
      kitchenAssetsReady,
      waitForLoadingScreen(),
    ]);
    const kitchenDocument = new DOMParser().parseFromString(kitchenMarkup, 'text/html');
    const kitchenStage = kitchenDocument.querySelector('main');
    if (!kitchenStage) throw new Error('营业制作台内容不存在');

    document.body.replaceChildren(kitchenStage);
    document.title = '海边寿司店';

    const kitchenScript = document.createElement('script');
    kitchenScript.src = 'kitchen.js?v=smooth-items-v19-20260803';
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
      fishingAssetsReady,
      waitForMenuTransition(),
      loadStylesheet('fishing-scene-style', 'fishing.css?v=fishing-stock-v1-20260803'),
    ]);
    const fishingDocument = new DOMParser().parseFromString(fishingMarkup, 'text/html');
    const fishingStage = fishingDocument.querySelector('main');
    if (!fishingStage) throw new Error('钓鱼场景内容不存在');

    document.body.replaceChildren(fishingStage);
    document.title = '海边寿司店 · 钓鱼';

    const fishingScript = document.createElement('script');
    fishingScript.src = 'fishing.js?v=fishing-stock-v1-20260803';
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

function openResetSaveDialog() {
  resetSaveDialogOpen = true;
  resetSaveDialog.classList.remove('is-hidden');
  resetSaveButton.setAttribute('aria-expanded', 'true');
  window.requestAnimationFrame(() => cancelResetSaveButton.focus());
}

function closeResetSaveDialog() {
  resetSaveDialogOpen = false;
  resetSaveDialog.classList.add('is-hidden');
  resetSaveButton.setAttribute('aria-expanded', 'false');
  window.requestAnimationFrame(() => resetSaveButton.focus());
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

resetSaveButton.addEventListener('click', openResetSaveDialog);
cancelResetSaveButton.addEventListener('click', closeResetSaveDialog);
confirmResetSaveButton.addEventListener('click', resetSave);
resetSaveDialog.addEventListener('click', (event) => {
  if (event.target === resetSaveDialog) closeResetSaveDialog();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && resetSaveDialogOpen) {
    event.preventDefault();
    closeResetSaveDialog();
  }
});

if (requestedScene === 'kitchen' || requestedScene === 'fishing') {
  window.history.replaceState({}, document.title, window.location.pathname);
  if (requestedScene === 'kitchen') enterKitchen();
  else enterFishing();
}
