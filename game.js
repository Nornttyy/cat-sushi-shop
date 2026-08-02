const startButton = document.querySelector('#start-button');

async function enterRestaurant(event) {
  const button = event.currentTarget;
  button.disabled = true;
  button.querySelector('span').textContent = '正在进入餐厅…';

  try {
    const response = await fetch('restaurant.html', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`无法载入餐厅：${response.status}`);

    const restaurantDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const restaurantStage = restaurantDocument.querySelector('main');
    if (!restaurantStage) throw new Error('餐厅内容不存在');

    document.body.replaceChildren(restaurantStage);
    document.title = '海边寿司店';

    const restaurantScript = document.createElement('script');
    restaurantScript.src = 'restaurant.js?v=restaurant-props-20260802';
    restaurantScript.defer = true;
    document.body.append(restaurantScript);
  } catch (error) {
    button.disabled = false;
    button.querySelector('span').textContent = '开始游戏';
    console.error(error);
  }
}

startButton.addEventListener('click', enterRestaurant);
