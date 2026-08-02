const startButton = document.querySelector('#start-button');

function showDayPreparation() {
  const card = document.querySelector('.main-menu-card');
  card.classList.add('is-day-preparation');
  card.innerHTML = `
    <p class="day-number">第 1 天</p>
    <h1 class="day-preparation-title">营业准备</h1>
    <p class="day-preparation-description">检查食材和工具，准备好后再打开店门。</p>
    <div class="day-menu-note"><span>今日菜单</span><b>三文鱼握寿司</b></div>
    <button id="open-business-button" class="main-menu-start" type="button">
      <span>开门营业</span>
      <small>进入制作台</small>
    </button>
  `;
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

startButton.addEventListener('click', showDayPreparation);
