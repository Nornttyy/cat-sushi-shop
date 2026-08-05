const backroomDoor = document.querySelector('#backroom-door');

async function enterBackroom() {
  backroomDoor.disabled = true;
  window.SeasideSushiAudio?.play('ui');

  try {
    const response = await fetch('kitchen.html', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`无法载入后台：${response.status}`);

    const kitchenDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const kitchenStage = kitchenDocument.querySelector('main');
    if (!kitchenStage) throw new Error('后台内容不存在');

    document.body.replaceChildren(kitchenStage);
    document.title = '海边寿司店';

    const kitchenScript = document.createElement('script');
    kitchenScript.src = 'kitchen.js?v=settings-clean-v81-20260805';
    kitchenScript.defer = true;
    document.body.append(kitchenScript);
  } catch (error) {
    backroomDoor.disabled = false;
    console.error(error);
  }
}

backroomDoor.addEventListener('click', enterBackroom);
