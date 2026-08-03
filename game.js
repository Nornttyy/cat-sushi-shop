const startButton = document.querySelector('#start-button');
const menuStage = document.querySelector('.main-menu-stage');

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

const kitchenAssetsReady = Promise.all(kitchenAssetSources.map(preloadImage));
let kitchenMarkupReady = loadKitchenMarkup();

function waitForMenuTransition() {
  return new Promise((resolve) => window.setTimeout(resolve, 700));
}

function waitForLoadingScreen() {
  return new Promise((resolve) => window.setTimeout(resolve, 1800));
}

async function enterKitchen(event) {
  const button = event.currentTarget;
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
    kitchenScript.src = 'kitchen.js?v=smooth-items-v15-20260803';
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

startButton.addEventListener('click', enterKitchen);
