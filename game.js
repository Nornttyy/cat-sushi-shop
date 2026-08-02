const startButton = document.querySelector('#start-button');

function showShopPreparation() {
  const stage = document.querySelector('.main-menu-stage');
  const card = document.querySelector('.main-menu-card');
  const background = stage.querySelector('.menu-background');
  stage.classList.add('is-in-shop');
  background.src = 'assets/restaurant/kitchen-layers/optimized/kitchen-background.jpg?v=shop-interior-20260802';
  background.alt = '海边寿司店厨房内景';
  card.remove();

  const shopUi = document.createElement('section');
  shopUi.className = 'shop-opening-ui';
  shopUi.innerHTML = `
    <div class="shop-day-panel"><span>第 1 天</span><b>开门前</b></div>
    <div class="shop-opening-panel">
      <span>海风正好，食材已经备齐</span>
      <button id="open-business-button" class="main-menu-start" type="button">
        <span>开门营业</span>
        <small>开始今天的工作</small>
      </button>
    </div>
  `;
  stage.append(shopUi);
  document.querySelector('#open-business-button').addEventListener('click', enterKitchen);
}

async function enterKitchen(event) {
  const openBusinessButton = event.currentTarget;
  openBusinessButton.disabled = true;
  openBusinessButton.querySelector('span').textContent = '正在开店…';

  try {
    const response = await fetch('kitchen.html', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`无法载入制作台：${response.status}`);

    const kitchenDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const kitchenStage = kitchenDocument.querySelector('main');
    if (!kitchenStage) throw new Error('制作台内容不存在');

    document.body.replaceChildren(kitchenStage);
    document.title = '海边寿司店';

    const kitchenScript = document.createElement('script');
    kitchenScript.src = 'kitchen.js?v=single-page-20260802';
    kitchenScript.defer = true;
    document.body.append(kitchenScript);
  } catch (error) {
    openBusinessButton.disabled = false;
    openBusinessButton.querySelector('span').textContent = '开门营业';
    console.error(error);
  }
}

startButton.addEventListener('click', showShopPreparation);
