const fish = {
  salmon: { label: '三文鱼', weight: 45 },
  mackerel: { label: '鲭鱼', weight: 35 },
  seabream: { label: '海鲷', weight: 20 },
};

const state = { phase: 'ready', seconds: 60, total: 0, catch: { salmon: 0, mackerel: 0, seabream: 0 }, ended: false };
const $ = (selector) => document.querySelector(selector);
const fishingButton = $('#fishing-button');
const finishButton = $('#finish-button');
const line = $('#fishing-line');
const bobber = $('#bobber');
const speech = $('#speech');
const instruction = $('#instruction');
let biteTimer;

function renderCatch() {
  Object.keys(state.catch).forEach((type) => { $(`#${type}-count`).textContent = state.catch[type]; });
}

function weightedFish() {
  const roll = Math.random() * 100;
  let running = 0;
  for (const [type, data] of Object.entries(fish)) {
    running += data.weight;
    if (roll < running) return type;
  }
  return 'salmon';
}

function resetLine() {
  window.clearTimeout(biteTimer);
  state.phase = 'ready';
  line.classList.remove('casting');
  bobber.classList.remove('visible', 'biting');
  fishingButton.textContent = '放线';
  fishingButton.disabled = false;
}

function showCatch(type) {
  const popup = $('#catch-pop');
  popup.textContent = `钓到了 ${fish[type].label}！`;
  popup.classList.remove('show');
  void popup.offsetWidth;
  popup.classList.add('show');
}

function startFishing() {
  if (state.ended) return;
  if (state.phase === 'ready') {
    state.phase = 'waiting';
    line.classList.add('casting');
    bobber.classList.add('visible');
    fishingButton.textContent = '等一等';
    fishingButton.disabled = true;
    instruction.textContent = '安静一点，鱼马上就会靠近……';
    speech.textContent = '耐心等鱼咬钩。';
    biteTimer = window.setTimeout(() => {
      if (state.ended || state.phase !== 'waiting') return;
      state.phase = 'biting';
      bobber.classList.add('biting');
      fishingButton.disabled = false;
      fishingButton.textContent = '收线！';
      instruction.textContent = '有鱼咬钩了，快收线！';
      speech.textContent = '就是现在！';
    }, 900 + Math.random() * 1600);
    return;
  }
  if (state.phase === 'biting') {
    const caught = weightedFish();
    state.catch[caught] += 1;
    state.total += 1;
    renderCatch();
    showCatch(caught);
    instruction.textContent = `收进鱼篓了！明天可以做${fish[caught].label}寿司。`;
    speech.textContent = '再来一条吧！';
    resetLine();
  }
}

function endFishing() {
  if (state.ended) return;
  state.ended = true;
  window.clearTimeout(biteTimer);
  line.classList.remove('casting');
  bobber.classList.remove('visible', 'biting');
  fishingButton.disabled = true;
  finishButton.disabled = true;
  $('#total-catch').textContent = state.total;
  $('#result-dialog').showModal();
}

function tick() {
  if (state.ended) return;
  state.seconds -= 1;
  const minutes = Math.floor(Math.max(0, state.seconds) / 60).toString().padStart(2, '0');
  const seconds = (Math.max(0, state.seconds) % 60).toString().padStart(2, '0');
  $('#time-text').textContent = `${minutes}:${seconds}`;
  if (state.seconds <= 0) endFishing();
}

fishingButton.addEventListener('click', startFishing);
bobber.addEventListener('click', startFishing);
finishButton.addEventListener('click', endFishing);
$('#back-to-restaurant').addEventListener('click', () => {
  $('#result-dialog').close();
  speech.textContent = '餐厅场景下一步制作。';
});
window.setInterval(tick, 1000);
renderCatch();
