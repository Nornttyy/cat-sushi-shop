const recipes = {
  salmon: { name: '三文鱼寿司', topping: '三文鱼', coins: 8 },
  shrimp: { name: '虾寿司', topping: '虾', coins: 10 },
  egg: { name: '玉子寿司', topping: '玉子', coins: 12 },
};

const state = { order: 'salmon', ingredients: [], coins: 0, served: 0, seconds: 75, beltOrder: [0, 1, 2], gameOver: false };
const $ = (selector) => document.querySelector(selector);
const ingredientButtons = [...document.querySelectorAll('.ingredient')];
const dish = $('#dish');
const hint = $('#hint');
const serveButton = $('#serve-dish');
const timerFill = $('#timer-fill');
const beltDishes = [$('#belt-dish-a'), $('#belt-dish-b'), $('#belt-dish-c')];

function chooseOrder(previous) {
  const keys = Object.keys(recipes);
  const options = keys.filter((key) => key !== previous);
  return options[Math.floor(Math.random() * options.length)];
}

function renderOrder() {
  const recipe = recipes[state.order];
  $('#order-name').textContent = recipe.name;
  $('#order-topping').textContent = recipe.topping;
  $('#order-icon').className = `sushi-icon ${state.order}`;
}

function renderDish() {
  const hasRice = state.ingredients.includes('rice');
  const topping = state.ingredients.find((item) => item !== 'rice');
  dish.className = `dish${hasRice ? ' has-rice' : ''}${topping ? ` has-${topping}` : ''}`;
  ingredientButtons.forEach((button) => button.classList.toggle('selected', state.ingredients.includes(button.dataset.ingredient)));
  const ready = hasRice && topping === state.order && state.ingredients.length === 2;
  serveButton.disabled = !ready;
  if (!hasRice) hint.textContent = '先放一团米饭';
  else if (!topping) hint.textContent = '再选一种配料';
  else if (ready) hint.textContent = '做好了，交给客人吧！';
  else hint.textContent = '这个不是客人点的寿司';
}

function addIngredient(ingredient) {
  if (state.gameOver) return;
  if (state.ingredients.includes(ingredient)) return;
  if (ingredient === 'rice' && state.ingredients.some((item) => item !== 'rice')) {
    hint.textContent = '先重做，再从米饭开始';
    return;
  }
  if (ingredient !== 'rice' && !state.ingredients.includes('rice')) {
    hint.textContent = '要先放米饭哦';
    return;
  }
  if (ingredient !== 'rice' && state.ingredients.some((item) => item !== 'rice')) {
    hint.textContent = '一份寿司只能放一种配料';
    return;
  }
  state.ingredients.push(ingredient);
  renderDish();
}

function clearDish() {
  if (state.gameOver) return;
  state.ingredients = [];
  renderDish();
}

function serveDish() {
  if (serveButton.disabled || state.gameOver) return;
  state.coins += recipes[state.order].coins;
  state.served += 1;
  $('#coins').textContent = state.coins;
  hint.textContent = '客人很满意！';
  state.ingredients = [];
  serveButton.disabled = true;
  window.setTimeout(() => {
    if (state.gameOver) return;
    state.order = chooseOrder(state.order);
    renderOrder();
    renderDish();
  }, 650);
}

function renderBelt() {
  const slots = [27, 50, 73];
  state.beltOrder.forEach((dishIndex, slot) => { beltDishes[dishIndex].style.left = `${slots[slot]}%`; });
}

function moveBelt(direction) {
  if (direction === 'left') state.beltOrder.push(state.beltOrder.shift());
  else state.beltOrder.unshift(state.beltOrder.pop());
  renderBelt();
}

function endDay() {
  state.gameOver = true;
  $('#served-count').textContent = state.served;
  $('#final-coins').textContent = state.coins;
  $('#result-dialog').showModal();
}

function tick() {
  if (state.gameOver) return;
  state.seconds -= 1;
  timerFill.style.width = `${Math.max(0, state.seconds / 75 * 100)}%`;
  if (state.seconds <= 0) endDay();
}

ingredientButtons.forEach((button) => button.addEventListener('click', () => addIngredient(button.dataset.ingredient)));
$('#clear-dish').addEventListener('click', clearDish);
serveButton.addEventListener('click', serveDish);
$('#move-left').addEventListener('click', () => moveBelt('left'));
$('#move-right').addEventListener('click', () => moveBelt('right'));
$('#restart').addEventListener('click', () => window.location.reload());
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') moveBelt('left');
  if (event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') moveBelt('right');
});

renderOrder();
renderDish();
renderBelt();
window.setInterval(tick, 1000);
