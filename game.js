const startButton = document.querySelector('#start-button');

async function enterKitchen() {
  startButton.disabled = true;
  startButton.querySelector('span').textContent = '正在开店…';

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
    startButton.disabled = false;
    startButton.querySelector('span').textContent = '开始营业';
    console.error(error);
  }
}

startButton.addEventListener('click', enterKitchen);
