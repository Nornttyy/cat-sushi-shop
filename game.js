const startButton = document.querySelector('#start-button');

async function enterBackroom(event) {
  const button = event.currentTarget;
  button.disabled = true;
  button.querySelector('span').textContent = '正在进入后台…';

  try {
    const response = await fetch('backroom.html', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`无法载入后台：${response.status}`);

    const backroomDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const backroomStage = backroomDocument.querySelector('main');
    if (!backroomStage) throw new Error('后台内容不存在');

    document.body.replaceChildren(backroomStage);
    document.title = '海边寿司店';

    const backroomScript = document.createElement('script');
    backroomScript.src = 'backroom.js?v=separate-backroom-20260802';
    backroomScript.defer = true;
    document.body.append(backroomScript);
  } catch (error) {
    button.disabled = false;
    button.querySelector('span').textContent = '开始游戏';
    console.error(error);
  }
}

startButton.addEventListener('click', enterBackroom);
