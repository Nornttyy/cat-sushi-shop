const businessDoor = document.querySelector('#business-door');

async function enterBusiness() {
  businessDoor.disabled = true;

  try {
    const response = await fetch('kitchen.html', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`无法载入营业制作台：${response.status}`);

    const kitchenDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const kitchenStage = kitchenDocument.querySelector('main');
    if (!kitchenStage) throw new Error('营业制作台内容不存在');

    document.body.replaceChildren(kitchenStage);
    document.title = '海边寿司店';

    const kitchenScript = document.createElement('script');
    kitchenScript.src = 'kitchen.js?v=procurement-shop-v31-20260804';
    kitchenScript.defer = true;
    document.body.append(kitchenScript);
  } catch (error) {
    businessDoor.disabled = false;
    console.error(error);
  }
}

businessDoor.addEventListener('click', enterBusiness);
