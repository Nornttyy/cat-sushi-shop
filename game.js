const startButton = document.querySelector('#start-button');

async function enterKitchen(event) {
  const button = event.currentTarget;
  button.disabled = true;
  button.querySelector('span').textContent = '正在进入后台…';

  try {
    const response = await fetch('kitchen.html', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`无法载入制作台：${response.status}`);

    const kitchenDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const kitchenStage = kitchenDocument.querySelector('main');
    if (!kitchenStage) throw new Error('制作台内容不存在');

    document.body.replaceChildren(kitchenStage);
    document.title = '海边寿司店';

    const kitchenScript = document.createElement('script');
    kitchenScript.src = 'kitchen.js?v=preopen-backstage-20260802';
    kitchenScript.defer = true;
    document.body.append(kitchenScript);
  } catch (error) {
    button.disabled = false;
    button.querySelector('span').textContent = '开始游戏';
    console.error(error);
  }
}

startButton.addEventListener('click', enterKitchen);
