const MAX_WAITING_CUSTOMERS = 2;
const KITCHEN_ASSET_PATH = 'assets/restaurant/kitchen-layers/optimized/';
const CUSTOMER_ASSET_PATH = 'assets/restaurant/customers/';
const CUT_LINES = [0.3, 0.5, 0.7];
const CUT_START_TOLERANCE = 0.18;
const CUT_SWIPE_DISTANCE = 0.12;
const CUT_SLICE_ORIGINS = [[0.15], [0.4], [0.6, 0.85]];
const CUSTOMER_WAIT_MS = 75000;
const CUSTOMER_ARRIVAL_DELAY_MS = 3600;
const CUSTOMER_EXIT_MS = 820;
const SLICE_FLIGHT_STAGGER_MS = 70;
const SPECIAL_ORDER_MINIMUM_DAY = 3;
const SPECIAL_ORDER_SPAWN_CHANCE = 0.36;
const SPECIAL_ORDER_BONUS_RATE = 0.18;
const SPECIAL_ORDER_BONUS_MAX = 8;
const DRINK_TYPES = Object.freeze({
  tea: Object.freeze({ id: 'tea', name: '茶', price: 3, asset: 'tea-cup-ready-vivid-v1.png' }),
  'yuzu-soda': Object.freeze({ id: 'yuzu-soda', name: '柚子苏打', price: 5, asset: 'yuzu-soda-ready-vivid-v1.png' }),
  'strawberry-soda': Object.freeze({ id: 'strawberry-soda', name: '草莓苏打', price: 6, asset: 'strawberry-soda-ready-vivid-v1.png' }),
});
const DRINK_TYPE_LIST = Object.values(DRINK_TYPES);
const FIRST_DAY_SERVICE_MS = 90 * 1000;
const STANDARD_DAY_SERVICE_MS = 150 * 1000;
const DAY_CLOCK_SAVE_INTERVAL_MS = 5 * 1000;
const TUTORIAL_STEP = Object.freeze({
  WELCOME: 0,
  FREEZER: 1,
  PLACE_TAMAGO: 2,
  CUT_TAMAGO: 3,
  TAKE_RICE: 4,
  MAKE_SUSHI: 5,
  SERVE_CUSTOMER: 6,
});
const TUTORIAL_STEP_COUNT = 6;
const SHRIMP_BATCH_SIZE = 4;
const SHRIMP_HEAD_CUT_X = 0.5;
const RAW_FISH_IDS = ['salmon', 'tuna', 'shrimp', 'mackerel', 'seabream', 'eel'];
const PLATTER_FISH_IDS = ['salmon', 'tuna', 'shrimp', 'mackerel', 'seabream'];
const RECIPE_IDS = Object.freeze(['nori', 'uni-gunkan', 'roe-gunkan', 'sashimi-platter']);
const MAX_RAW_FISH = Number.MAX_SAFE_INTEGER;
const SAVE_KEY = 'seaside-sushi-shop.save.v1';
const SAVE_VERSION = 1;
const SETTINGS_KEY = 'seaside-sushi-shop.settings.v1';
const DEFAULT_SOUND_VOLUME = 0.48;
const INITIAL_UNLOCKED_INGREDIENTS = ['tamago'];
const DEFAULT_DECORATION_THEME_ID = 'coastal';
const DECORATION_THEMES = Object.freeze([
  Object.freeze({
    id: 'coastal',
    name: '海风原木',
    description: '原本温暖的海边料理台',
    background: 'kitchen-background-vivid-v2.jpg',
    price: 0,
  }),
  Object.freeze({
    id: 'christmas',
    name: '圣诞主题',
    description: '暖灯、花环与节日小装饰',
    background: 'kitchen-background-christmas.jpg',
    price: 1800,
  }),
  Object.freeze({
    id: 'toy',
    name: '玩具主题',
    description: '彩旗、积木与柔和糖果色',
    background: 'kitchen-background-toy.jpg',
    price: 2600,
  }),
  Object.freeze({
    id: 'game',
    name: '游戏主题',
    description: '复古街机与游戏手柄装饰',
    background: 'kitchen-background-game.jpg',
    price: 3600,
  }),
  Object.freeze({
    id: 'cyber',
    name: '赛博主题',
    description: '蓝紫霓虹与未来感灯带',
    background: 'kitchen-background-cyber.jpg',
    price: 4800,
  }),
  Object.freeze({
    id: 'primitive',
    name: '原始主题',
    description: '粗木、藤编、陶土与叶片',
    background: 'kitchen-background-primitive.jpg',
    price: 3200,
  }),
]);
const SHOP_ITEMS = [
  { id: 'tea', name: '茶饮配方', asset: 'tea-cup-ready-vivid-v1.png', price: 120, kind: 'drink', drinkId: 'tea' },
  { id: 'yuzu-soda', name: '柚子苏打配方', asset: 'yuzu-soda-ready-vivid-v1.png', price: 380, kind: 'drink', drinkId: 'yuzu-soda', requiresTea: true },
  { id: 'strawberry-soda', name: '草莓苏打配方', asset: 'strawberry-soda-ready-vivid-v1.png', price: 560, kind: 'drink', drinkId: 'strawberry-soda', requiresTea: true },
  { id: 'salmon', price: 180 },
  { id: 'shrimp', price: 260 },
  { id: 'tuna', price: 350 },
  { id: 'mackerel', price: 480 },
  { id: 'nori', name: '紫菜配方', asset: 'nori-sheets-vivid-v1.png', price: 420, kind: 'recipe', recipeId: 'nori' },
  { id: 'roe-gunkan', name: '鱼籽军舰配方', asset: 'roe-gunkan-vivid-v1.png', price: 900, kind: 'recipe', recipeId: 'roe-gunkan', requiresRecipe: 'nori' },
  { id: 'seabream', price: 780 },
  { id: 'uni-gunkan', name: '海胆军舰配方', asset: 'uni-gunkan-vivid-v1.png', price: 1180, kind: 'recipe', recipeId: 'uni-gunkan', requiresRecipe: 'nori' },
  { id: 'sashimi-platter', name: '刺身拼盘盘具', asset: 'plate-stack-vivid-v1.png', price: 1100, kind: 'recipe', recipeId: 'sashimi-platter' },
  { id: 'eel', price: 1250 },
];
const STORAGE_UPGRADES = [
  {
    id: 'slices',
    name: '鱼片架扩容',
    asset: 'salmon-slice-vivid-v1.png',
    prices: [180, 360, 650],
    capacities: [12, 16, 20, 24],
    grids: [
      { columns: 4, rows: 3 },
      { columns: 4, rows: 4 },
      { columns: 5, rows: 4 },
      { columns: 6, rows: 4 },
    ],
  },
  {
    id: 'sushi',
    name: '寿司架扩容',
    asset: 'tamago-nigiri-vivid-v1.png',
    prices: [220, 450, 800],
    capacities: [8, 12, 16, 20],
    grids: [
      { columns: 2, rows: 4 },
      { columns: 3, rows: 4 },
      { columns: 4, rows: 4 },
      { columns: 4, rows: 5 },
    ],
  },
  {
    id: 'drinks',
    name: '饮品架扩容',
    asset: 'tea-cup-ready-vivid-v1.png',
    prices: [140, 300, 550],
    requiresTea: true,
    capacities: [8, 10, 12, 14],
    grids: [
      { columns: 2, rows: 4 },
      { columns: 2, rows: 5 },
      { columns: 3, rows: 4 },
      { columns: 3, rows: 5 },
    ],
  },
  {
    id: 'rice',
    name: '饭盒扩容',
    asset: 'rice-bin-vivid-v1.png',
    prices: [280, 560, 980],
    capacities: [8, 12, 16, 20],
    unit: '团',
    grids: [
      { columns: 2, rows: 4 },
      { columns: 3, rows: 4 },
      { columns: 4, rows: 4 },
      { columns: 4, rows: 5 },
    ],
  },
  {
    id: 'teaMachine',
    name: '饮品机提速',
    asset: 'drink-machine-opaque-vivid-v1.png',
    prices: [320, 650, 1120],
    requiresTea: true,
    durations: [760, 610, 480, 360],
  },
  {
    id: 'freezer',
    name: '冰柜扩容',
    asset: 'fish-well-frosted-vivid-v2.png',
    prices: [380, 760, 1320],
    capacities: [12, 18, 26, 36],
    unit: '份',
  },
];
const SUSHI_TYPES = {
  salmon: {
    id: 'salmon',
    name: '三文鱼',
    pickerName: '三文鱼刺身',
    boardName: '大三文鱼',
    loin: 'salmon-loin-vivid-v1.png',
    slice: 'salmon-slice-vivid-v1.png',
    nigiri: 'salmon-nigiri-vivid-v1.png',
    price: 4,
  },
  tuna: {
    id: 'tuna',
    name: '金枪鱼',
    pickerName: '金枪鱼刺身',
    boardName: '大金枪鱼块',
    loin: 'tuna-loin-vivid-v1.png',
    slice: 'tuna-slice-vivid-v1.png',
    nigiri: 'tuna-nigiri-vivid-v1.png',
    price: 6,
  },
  shrimp: {
    id: 'shrimp',
    name: '甜虾',
    pickerName: '甜虾',
    boardName: '一只带头甜虾',
    // 甜虾按“单只”处理；切菜板的四格只表示可同时摆放的数量。
    loin: 'shrimp-whole-vivid-v1.png',
    whole: 'shrimp-whole-vivid-v1.png',
    head: 'shrimp-head-vivid-v1.png',
    slice: 'shrimp-slice-vivid-v1.png',
    nigiri: 'shrimp-nigiri-vivid-v1.png',
    price: 5,
  },
  mackerel: {
    id: 'mackerel',
    name: '鲭鱼',
    pickerName: '鲭鱼刺身',
    boardName: '大鲭鱼块',
    loin: 'mackerel-loin-vivid-v1.png',
    slice: 'mackerel-slice-vivid-v1.png',
    nigiri: 'mackerel-nigiri-vivid-v1.png',
    price: 7,
  },
  seabream: {
    id: 'seabream',
    name: '真鲷',
    pickerName: '真鲷刺身',
    boardName: '大真鲷块',
    loin: 'seabream-loin-vivid-v1.png',
    slice: 'seabream-slice-vivid-v1.png',
    nigiri: 'seabream-nigiri-vivid-v1.png',
    price: 10,
  },
  eel: {
    id: 'eel',
    name: '蒲烧鳗鱼',
    pickerName: '鳗鱼蒲烧',
    boardName: '大蒲烧鳗鱼',
    loin: 'eel-loin-vivid-v1.png',
    slice: 'eel-slice-vivid-v1.png',
    nigiri: 'eel-nigiri-vivid-v1.png',
    price: 14,
  },
  uni: {
    id: 'uni',
    name: '海胆军舰',
    pickerName: '海胆食材',
    boardName: '海胆食材盒',
    loin: 'uni-loin-vivid-v1.png',
    slice: 'uni-slice-vivid-v1.png',
    nigiri: 'uni-gunkan-vivid-v1.png',
    price: 12,
    kind: 'gunkan',
    recipeId: 'uni-gunkan',
    requiresRecipe: 'nori',
  },
  roe: {
    id: 'roe',
    name: '鱼籽军舰',
    pickerName: '鱼籽食材',
    boardName: '鱼籽食材碗',
    loin: 'roe-loin-vivid-v1.png',
    slice: 'roe-slice-vivid-v1.png',
    nigiri: 'roe-gunkan-vivid-v1.png',
    price: 10,
    kind: 'gunkan',
    recipeId: 'roe-gunkan',
    requiresRecipe: 'nori',
  },
  tamago: {
    id: 'tamago',
    name: '玉子烧',
    pickerName: '玉子烧',
    boardName: '玉子烧块',
    loin: 'tamago-loin-vivid-v1.png',
    slice: 'tamago-slice-vivid-v1.png',
    nigiri: 'tamago-nigiri-vivid-v1.png',
    price: 3,
  },
};
const SUSHI_TYPE_LIST = Object.values(SUSHI_TYPES);
const PLATTER_TYPES = Object.freeze({
  'platter-salmon': { id: 'platter-salmon', name: '三文鱼刺身拼盘', nigiri: 'sashimi-platter-salmon-vivid-v1.png', price: 14, kind: 'platter' },
  'platter-tuna': { id: 'platter-tuna', name: '金枪鱼刺身拼盘', nigiri: 'sashimi-platter-tuna-vivid-v1.png', price: 20, kind: 'platter' },
  'platter-shrimp': { id: 'platter-shrimp', name: '甜虾刺身拼盘', nigiri: 'sashimi-platter-shrimp-vivid-v1.png', price: 17, kind: 'platter' },
  'platter-mackerel': { id: 'platter-mackerel', name: '鲭鱼刺身拼盘', nigiri: 'sashimi-platter-mackerel-vivid-v1.png', price: 23, kind: 'platter' },
  'platter-seabream': { id: 'platter-seabream', name: '真鲷刺身拼盘', nigiri: 'sashimi-platter-seabream-vivid-v1.png', price: 32, kind: 'platter' },
  'platter-mixed': { id: 'platter-mixed', name: '精选三拼', nigiri: 'sashimi-platter-mixed-vivid-v1.png', price: 20, kind: 'platter' },
});
const PLATTER_TYPE_LIST = Object.values(PLATTER_TYPES);
const CUSTOMER_CATALOG = Object.freeze([
  Object.freeze({ avatar: 'customer-summer-vivid-v2.png', customerType: 'standard', minimumDay: 1, patienceMultiplier: 1 }),
  Object.freeze({ avatar: 'customer-sailor-vivid-v2.png', customerType: 'standard', minimumDay: 3, patienceMultiplier: 1.04 }),
  Object.freeze({ avatar: 'customer-student-vivid-v2.png', customerType: 'impatient', minimumDay: 5, patienceMultiplier: 0.64 }),
  Object.freeze({ avatar: 'customer-artist-vivid-v2.png', customerType: 'large-order', minimumDay: 8, patienceMultiplier: 1.14 }),
  Object.freeze({ avatar: 'customer-beggar-vivid-v2.png', customerType: 'beggar', minimumDay: 7, patienceMultiplier: 0.86 }),
  Object.freeze({ avatar: 'customer-fisher-vivid-v2.png', customerType: 'regular', minimumDay: 12, favoriteSushiId: 'salmon', patienceMultiplier: 1.16 }),
  Object.freeze({ avatar: 'customer-rush-vivid-v2.png', customerType: 'impatient', minimumDay: 12, patienceMultiplier: 0.58 }),
  Object.freeze({ avatar: 'customer-feast-vivid-v2.png', customerType: 'large-order', minimumDay: 12, patienceMultiplier: 1.18 }),
  Object.freeze({ avatar: 'customer-regular-vivid-v2.png', customerType: 'regular', minimumDay: 12, favoriteSushiId: 'tuna', patienceMultiplier: 1.2 }),
]);
const SPECIAL_CUSTOMER_TEMPLATE = Object.freeze({
  avatar: 'customer-vip-vivid-v2.png',
  customerType: 'special',
  minimumDay: SPECIAL_ORDER_MINIMUM_DAY,
  patienceMultiplier: 1.08,
  specialOrder: true,
});
const CUSTOMER_TEMPLATES = Object.freeze([...CUSTOMER_CATALOG, SPECIAL_CUSTOMER_TEMPLATE]);

function sushiTypeFor(id) {
  return SUSHI_TYPES[id] ?? SUSHI_TYPES.salmon;
}

function dishFor(id) {
  return PLATTER_TYPES[id] ?? sushiTypeFor(id);
}

function sushiAsset(id, asset) {
  return `${KITCHEN_ASSET_PATH}${sushiTypeFor(id)[asset]}`;
}

function dishAsset(id, asset = 'nigiri') {
  return `${KITCHEN_ASSET_PATH}${dishFor(id)[asset]}`;
}

function sushiName(id) {
  return sushiTypeFor(id).name;
}

function dishDisplayName(dish) {
  return dish.kind === 'gunkan' || dish.kind === 'platter' ? dish.name : `${dish.name}寿司`;
}

function isKnownDrinkId(id) {
  return typeof id === 'string' && Object.hasOwn(DRINK_TYPES, id);
}

function drinkFor(id) {
  return DRINK_TYPES[id] ?? DRINK_TYPES.tea;
}

function drinkAsset(id) {
  return `${KITCHEN_ASSET_PATH}${drinkFor(id).asset}`;
}

function isDrinkOrderItem(item) {
  return item?.type === 'drink' || item?.type === 'tea';
}

function drinkIdForOrderItem(item) {
  return isKnownDrinkId(item?.id) ? item.id : 'tea';
}

function orderItemName(item) {
  return isDrinkOrderItem(item) ? drinkFor(drinkIdForOrderItem(item)).name : dishDisplayName(dishFor(item.id));
}

function orderItemAsset(item) {
  return isDrinkOrderItem(item)
    ? drinkAsset(drinkIdForOrderItem(item))
    : dishAsset(item.id, 'nigiri');
}

function pendingOrderItems(customer) {
  return (customer.orderItems ?? []).filter((item) => !item.fulfilled);
}

function orderSummary(items) {
  const counts = new Map();
  items.forEach((item) => {
    const name = orderItemName(item);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  return Array.from(counts, ([name, count]) => count > 1 ? `${name}×${count}` : name).join('、');
}

function orderItemsPrice(items) {
  return items.reduce((total, item) => total + Math.max(0, Number(item?.price) || 0), 0);
}

function isSpecialOrderCustomer(customer) {
  return Boolean(customer?.specialOrder || customer?.customerType === 'special');
}

function specialOrderBonusFor(items) {
  const basePrice = orderItemsPrice(items);
  return Math.max(1, Math.min(SPECIAL_ORDER_BONUS_MAX, Math.round(basePrice * SPECIAL_ORDER_BONUS_RATE)));
}

function normalizedSpecialOrderBonus(value, orderItems) {
  const savedBonus = Number(value);
  if (Number.isFinite(savedBonus)) {
    return Math.min(SPECIAL_ORDER_BONUS_MAX, Math.max(0, Math.floor(savedBonus)));
  }
  return specialOrderBonusFor(orderItems);
}

function customerOrderPrice(customer, orderItems = customer?.orderItems ?? []) {
  if (customer?.customerType === 'beggar') return 0;
  const bonus = isSpecialOrderCustomer(customer)
    ? normalizedSpecialOrderBonus(customer?.specialBonus, orderItems)
    : 0;
  return orderItemsPrice(orderItems) + bonus;
}

function createSpecialCustomerOrder() {
  const remainingServings = new Map(orderableDishTypes().map(({ dish, servings }) => [dish.id, servings]));
  const orderItems = [];

  // 特别订单至少有两份寿司；选择池只包含当前能够完成的菜品。
  for (let index = 0; index < 2; index += 1) {
    const orderPool = orderableDishTypes()
      .map(({ dish }) => dish)
      .filter((dish) => (remainingServings.get(dish.id) ?? 0) > 0);
    const dish = orderPool[Math.floor(Math.random() * orderPool.length)] ?? SUSHI_TYPES.tamago;
    orderItems.push({ type: 'sushi', id: dish.id, price: dish.price, fulfilled: false });
    if (Number.isFinite(remainingServings.get(dish.id))) {
      remainingServings.set(dish.id, Math.max(0, remainingServings.get(dish.id) - 1));
    }
  }

  const availableDrinks = unlockedDrinkTypes();
  if (availableDrinks.length && Math.random() < 0.62) {
    const drink = availableDrinks[Math.floor(Math.random() * availableDrinks.length)] ?? DRINK_TYPES.tea;
    orderItems.push({ type: 'drink', id: drink.id, price: drink.price, fulfilled: false });
  }

  return orderItems;
}

function createCustomerOrder(template = CUSTOMER_CATALOG[0]) {
  const remainingServings = new Map(orderableDishTypes().map(({ dish, servings }) => [dish.id, servings]));
  const orderItems = [];

  if (isSpecialOrderCustomer(template)) return createSpecialCustomerOrder();

  // 逃单客只会要一份基础寿司，确保第 7 天起无论玩家买了什么都能应对。
  if (template.customerType === 'beggar') {
    const tamago = SUSHI_TYPES.tamago;
    return [{ type: 'sushi', id: tamago.id, price: tamago.price, fulfilled: false }];
  }

  if (template.customerType === 'regular') {
    const favorite = SUSHI_TYPES[template.favoriteSushiId];
    if (!favorite || (remainingServings.get(favorite.id) ?? 0) <= 0) {
      return createCustomerOrder({ customerType: 'standard' });
    }
    orderItems.push({ type: 'sushi', id: favorite.id, price: favorite.price, fulfilled: false });
    return orderItems;
  }

  const sushiCount = template.customerType === 'large-order'
    ? 3
    : template.customerType === 'impatient'
      ? 1
      : 1 + (Math.random() < 0.58 ? 1 : 0) + (remainingServings.size > 1 && Math.random() < 0.18 ? 1 : 0);

  for (let index = 0; index < sushiCount; index += 1) {
    const orderPool = orderableDishTypes().map(({ dish }) => dish).filter((dish) => (remainingServings.get(dish.id) ?? 0) > 0);
    const sushi = orderPool[Math.floor(Math.random() * orderPool.length)] ?? SUSHI_TYPES.tamago;
    orderItems.push({ type: 'sushi', id: sushi.id, price: sushi.price, fulfilled: false });
    if (Number.isFinite(remainingServings.get(sushi.id))) {
      remainingServings.set(sushi.id, Math.max(0, remainingServings.get(sushi.id) - 1));
    }
  }

  const drinkChance = template.customerType === 'large-order'
    ? 0.46
    : template.customerType === 'impatient'
      ? 0.18
      : 0.62;
  const availableDrinks = unlockedDrinkTypes();
  if (orderItems.length < 4 && availableDrinks.length && Math.random() < drinkChance) {
    const drink = availableDrinks[Math.floor(Math.random() * availableDrinks.length)] ?? DRINK_TYPES.tea;
    orderItems.push({ type: 'drink', id: drink.id, price: drink.price, fulfilled: false });
  }

  return orderItems;
}

function isIngredientUnlocked(id) {
  return state.unlockedIngredients.includes(id);
}

function decorationThemeFor(id) {
  return DECORATION_THEMES.find((theme) => theme.id === id) ?? DECORATION_THEMES[0];
}

function isDecorationThemeId(id) {
  return typeof id === 'string' && DECORATION_THEMES.some((theme) => theme.id === id);
}

function normalizeUnlockedDecorations(value) {
  const saved = Array.isArray(value) ? value.filter(isDecorationThemeId) : [];
  return [...new Set([DEFAULT_DECORATION_THEME_ID, ...saved])];
}

function normalizedActiveDecoration(value, unlockedDecorations) {
  return isDecorationThemeId(value) && unlockedDecorations.includes(value)
    ? value
    : DEFAULT_DECORATION_THEME_ID;
}

function isDrinkUnlocked(id) {
  return state.unlockedDrinks.includes(id);
}

function hasUnlockedDrinks() {
  return state.unlockedDrinks.length > 0;
}

function unlockedDrinkTypes() {
  return DRINK_TYPE_LIST.filter((drink) => isDrinkUnlocked(drink.id));
}

function isRecipeUnlocked(id) {
  return state.unlockedRecipes.includes(id);
}

function isTeaUnlocked() {
  return isDrinkUnlocked('tea');
}

function isSushiTypeUnlocked(sushiType) {
  if (!sushiType || sushiType.kind === 'platter') return false;
  if (sushiType.recipeId && !isRecipeUnlocked(sushiType.recipeId)) return false;
  if (sushiType.requiresRecipe && !isRecipeUnlocked(sushiType.requiresRecipe)) return false;
  return sushiType.recipeId ? true : isIngredientUnlocked(sushiType.id);
}

function unlockedSushiTypes() {
  return SUSHI_TYPE_LIST.filter(isSushiTypeUnlocked);
}

function needsFishing(id) {
  return RAW_FISH_IDS.includes(id);
}

function normalizedFishingFeaturedFish(value, unlockedIngredients = state.unlockedIngredients) {
  return needsFishing(value) && Array.isArray(unlockedIngredients) && unlockedIngredients.includes(value)
    ? value
    : null;
}

function rawFishYield(id) {
  return id === 'shrimp' ? SHRIMP_BATCH_SIZE : CUT_SLICE_ORIGINS.flat().length;
}

function rawFishCount(id) {
  return needsFishing(id) ? state.rawFish[id] ?? 0 : Number.POSITIVE_INFINITY;
}

function hasRawFish(id) {
  return !needsFishing(id) || rawFishCount(id) > 0;
}

function consumeRawFish(id) {
  if (!needsFishing(id)) return true;
  if (!hasRawFish(id)) return false;
  state.rawFish[id] -= 1;
  return true;
}

function boardServingCapacity(id) {
  if (id === 'shrimp') return state.shrimpBatch.filter((shrimp) => !shrimp.cut).length;
  if (!state.salmonOnBoard || state.boardIngredientId !== id) return 0;
  return state.cutLines.reduce((remaining, cut, index) => remaining + (cut ? 0 : CUT_SLICE_ORIGINS[index].length), 0);
}

function availableSushiServings(id) {
  if (!needsFishing(id)) return Number.POSITIVE_INFINITY;
  const finishedSlices = state.sliceTypes.filter((sliceId) => sliceId === id).length;
  const finishedSushi = state.sushiTypes.filter((sushiId) => sushiId === id).length;
  const pendingOrders = state.customers.reduce((total, customer) => {
    if (customer.served || customer.leaving) return total;
    return total + pendingOrderItems(customer).filter((item) => item.type === 'sushi' && item.id === id).length;
  }, 0);
  const total = (rawFishCount(id) * rawFishYield(id)) + boardServingCapacity(id) + finishedSlices + finishedSushi;
  return Math.max(0, total - pendingOrders);
}

function availableDishServings(id) {
  const dish = dishFor(id);
  const pendingOrders = state.customers.reduce((total, customer) => {
    if (customer.served || customer.leaving) return total;
    return total + pendingOrderItems(customer).filter((item) => item.type === 'sushi' && item.id === id).length;
  }, 0);
  if (dish.kind === 'platter') {
    const finishedPlatters = state.sushiTypes.filter((dishId) => dishId === id).length;
    return Math.max(0, finishedPlatters - pendingOrders);
  }
  return availableSushiServings(id);
}

function orderableDishTypes() {
  return unlockedSushiTypes()
    .concat(isRecipeUnlocked('sashimi-platter') ? PLATTER_TYPE_LIST : [])
    .map((dish) => ({ dish, servings: availableDishServings(dish.id) }))
    .filter((entry) => entry.servings > 0);
}

function customerTemplateCanOrder(template) {
  const minimumDay = Math.max(1, Math.floor(Number(template?.minimumDay) || 1));
  if (!template || state.day < minimumDay) return false;
  if (!template || template.customerType !== 'regular') return true;
  const favoriteId = template.favoriteSushiId;
  return Boolean(favoriteId && isIngredientUnlocked(favoriteId) && availableSushiServings(favoriteId) > 0);
}

function nextCustomerTemplate() {
  const eligible = CUSTOMER_CATALOG.filter(customerTemplateCanOrder);
  return eligible[state.customerSerial % eligible.length] ?? CUSTOMER_CATALOG[0];
}

function canSpawnSpecialOrderToday() {
  return state.day >= SPECIAL_ORDER_MINIMUM_DAY && state.specialOrderDay !== state.day;
}

function shouldSpawnSpecialCustomer() {
  if (!canSpawnSpecialOrderToday()) return false;
  if (state.customers.some((customer) => isSpecialOrderCustomer(customer) && !customer.leaving)) return false;

  // A normal customer can still arrive first, but once the day is well under
  // way the remaining special slot is guaranteed to be offered.
  const elapsed = Math.max(0, dayDurationForDay(state.day) - dayTimeRemaining());
  const isDue = elapsed >= dayDurationForDay(state.day) * 0.56;
  return isDue || Math.random() < SPECIAL_ORDER_SPAWN_CHANCE;
}

function shopItemFor(id) {
  return SHOP_ITEMS.find((item) => item.id === id) ?? null;
}

function isShopItemUnlocked(shopItem) {
  if (shopItem.kind === 'drink') return isDrinkUnlocked(shopItem.drinkId);
  if (shopItem.kind === 'recipe') return isRecipeUnlocked(shopItem.recipeId);
  return isIngredientUnlocked(shopItem.id);
}

function shopItemUnlockDay(shopItem) {
  return Math.max(1, Math.floor(Number(shopItem?.minimumDay) || 1));
}

function isShopItemAvailable(shopItem) {
  return state.day >= shopItemUnlockDay(shopItem);
}

function shopItemName(shopItem) {
  return shopItem.name ?? sushiName(shopItem.id);
}

function recipeName(recipeId) {
  return SHOP_ITEMS.find((shopItem) => shopItem.recipeId === recipeId)?.name ?? '前置配方';
}

function purchaseRequirements(item) {
  const requirements = [];
  if (item?.requiresRecipe) {
    requirements.push({
      name: recipeName(item.requiresRecipe),
      met: isRecipeUnlocked(item.requiresRecipe),
    });
  }
  if (item?.requiresTea) {
    requirements.push({
      name: shopItemName(shopItemFor('tea')),
      met: isTeaUnlocked(),
    });
  }
  return requirements;
}

function unmetPurchaseRequirementNames(item) {
  return purchaseRequirements(item)
    .filter((requirement) => !requirement.met)
    .map((requirement) => requirement.name);
}

function appendPurchaseRequirement(detail, item) {
  const requirements = purchaseRequirements(item);
  if (!requirements.length) return requirements;

  const prerequisite = document.createElement('span');
  const met = requirements.every((requirement) => requirement.met);
  prerequisite.className = `shop-prerequisite${met ? ' is-met' : ''}`;
  prerequisite.textContent = `${met ? '前置已满足：' : '前置：'}${requirements.map((requirement) => requirement.name).join('、')}`;
  detail.append(prerequisite);
  return requirements;
}

function storageUpgradeFor(id) {
  return STORAGE_UPGRADES.find((upgrade) => upgrade.id === id) ?? null;
}

function storageUpgradeValues(upgrade) {
  return upgrade?.capacities ?? upgrade?.durations ?? [];
}

function normalizeStorageLevels(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(STORAGE_UPGRADES.map((upgrade) => [
    upgrade.id,
    asStoredCount(source[upgrade.id], storageUpgradeValues(upgrade).length - 1),
  ]));
}

// 海岛鱼钩探索独立于厨房储物架：这两个等级只决定水下可到达的距离和
// 一次收线的暂存数量。顶层保存能让旧存档安全地以 0 级开始。
const FISHING_UPGRADE_MAX_LEVEL = 3;
function normalizeFishingUpgrades(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    lineLength: asStoredCount(source.lineLength, FISHING_UPGRADE_MAX_LEVEL),
    hookCapacity: asStoredCount(source.hookCapacity, FISHING_UPGRADE_MAX_LEVEL),
  };
}

function storageLevelFor(id, levels = state.storageLevels) {
  const upgrade = storageUpgradeFor(id);
  if (!upgrade) return 0;
  return asStoredCount(levels?.[id], storageUpgradeValues(upgrade).length - 1);
}

function storageCapacityFor(id, levels = state.storageLevels) {
  const upgrade = storageUpgradeFor(id);
  if (!upgrade?.capacities) return 0;
  return upgrade.capacities[storageLevelFor(id, levels)] ?? upgrade.capacities[0];
}

function storageGridFor(id, levels = state.storageLevels) {
  const upgrade = storageUpgradeFor(id);
  if (!upgrade?.grids) return { columns: 1, rows: 1 };
  return upgrade.grids[storageLevelFor(id, levels)] ?? upgrade.grids[0];
}

function storageUpgradeIsMaxed(upgrade) {
  return storageLevelFor(upgrade.id) >= storageUpgradeValues(upgrade).length - 1;
}

function storageUpgradeValue(upgrade, levels = state.storageLevels) {
  const values = storageUpgradeValues(upgrade);
  return values[storageLevelFor(upgrade.id, levels)] ?? values[0] ?? 0;
}

function storageUpgradeValueLabel(upgrade, value) {
  if (upgrade.durations) return `${(value / 1000).toFixed(value % 1000 ? 2 : 0)} 秒`;
  return `${value} ${upgrade.unit ?? '格'}`;
}

function riceStorageCapacity() {
  return storageCapacityFor('rice');
}

function teaFillDuration() {
  return storageUpgradeValue(storageUpgradeFor('teaMachine'));
}

function rawFishStorageCapacity() {
  return storageCapacityFor('freezer');
}

function rawFishStorageTotal(rawFish = state.rawFish) {
  return RAW_FISH_IDS.reduce((total, id) => total + Math.max(0, Number(rawFish?.[id]) || 0), 0);
}

const state = {
  salmonOnBoard: false,
  shrimpOnBoard: false,
  shrimpBatch: [],
  shrimpBatchSerial: 0,
  boardIngredientId: null,
  cutLines: [false, false, false],
  activeCut: null,
  cutStartY: 0,
  activeShrimpCut: null,
  shrimpCutStartY: 0,
  shrimpHeads: [],
  shrimpHeadDiscarding: false,
  slicesReady: 0,
  incomingSlices: 0,
  sliceTypes: [],
  flightVersion: 0,
  riceStored: 0,
  incomingRice: 0,
  sushiStored: 0,
  incomingSushi: 0,
  sushiTypes: [],
  cupOnMachine: false,
  drinkPouring: false,
  drinksStored: 0,
  incomingDrinks: 0,
  drinkVersion: 0,
  machineDrinkId: null,
  drinkPickerOpen: false,
  drinkTypes: [],
  sashimiPickerOpen: false,
  shopPanelOpen: false,
  unlockedDecorations: [DEFAULT_DECORATION_THEME_ID],
  activeDecoration: DEFAULT_DECORATION_THEME_ID,
  unlockedIngredients: [...INITIAL_UNLOCKED_INGREDIENTS],
  unlockedRecipes: [],
  unlockedDrinks: [],
  platterAssembly: [],
  platterMaking: false,
  rawFish: { salmon: 0, tuna: 0, shrimp: 0, mackerel: 0, seabream: 0, eel: 0 },
  fishingFeaturedFish: null,
  fishingUpgrades: normalizeFishingUpgrades({}),
  storageLevels: normalizeStorageLevels({}),
  teaUnlocked: false,
  tutorialCompleted: false,
  tutorialStarted: false,
  tutorialStep: TUTORIAL_STEP.WELCOME,
  tutorialCustomerId: null,
  day: 1,
  dayPhase: 'service',
  dayCustomersFinished: 0,
  dayCustomersServed: 0,
  dayIncome: 0,
  dayTimeRemainingMs: FIRST_DAY_SERVICE_MS,
  dayTimerStarted: false,
  dayTimerStartedAt: 0,
  dayEndedEarly: false,
  daySummaryOpen: false,
  shopOpen: true,
  gamePaused: false,
  pauseSettingsOpen: false,
  cash: 0,
  lifetimeRevenue: 0,
  customers: [],
  customerSerial: 0,
  specialOrderDay: 0,
};

let lastSavedSnapshot = '';
// The fishing scene can update this one inventory field from another tab.
// Keep a baseline so a later kitchen save preserves those catches while still
// applying any fish this kitchen tab has used.
let lastSavedRawFish = normalizeRawFish(state.rawFish);
let externalSaveReloadTimer = null;
let saveTimer = null;
let gameSettings = { soundEnabled: true, soundVolume: DEFAULT_SOUND_VOLUME };
let accumulatedPausedTime = 0;
let pauseStartedAt = 0;
const gameplayTimeouts = new Set();

function gameplayNow() {
  const now = performance.now();
  const activePauseDuration = state.gamePaused ? now - pauseStartedAt : 0;
  return now - accumulatedPausedTime - activePauseDuration;
}

function armGameplayTimeout(timer) {
  if (timer.cleared || state.gamePaused || timer.handle !== null) return;
  timer.startedAt = performance.now();
  timer.handle = window.setTimeout(() => {
    timer.handle = null;
    gameplayTimeouts.delete(timer);
    if (!timer.cleared) timer.callback();
  }, timer.remaining);
}

function setGameplayTimeout(callback, delay) {
  const timer = {
    callback,
    remaining: Math.max(0, delay),
    startedAt: 0,
    handle: null,
    cleared: false,
  };
  gameplayTimeouts.add(timer);
  armGameplayTimeout(timer);
  return timer;
}

function clearGameplayTimeout(timer) {
  if (!timer || timer.cleared) return;
  timer.cleared = true;
  if (timer.handle !== null) window.clearTimeout(timer.handle);
  timer.handle = null;
  gameplayTimeouts.delete(timer);
}

function pauseGameplayTimeouts() {
  const now = performance.now();
  gameplayTimeouts.forEach((timer) => {
    if (timer.cleared || timer.handle === null) return;
    window.clearTimeout(timer.handle);
    timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    timer.handle = null;
  });
}

function resumeGameplayTimeouts() {
  [...gameplayTimeouts].forEach((timer) => armGameplayTimeout(timer));
}

function normalizedSoundVolume(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SOUND_VOLUME;
  return Math.min(0.8, Math.max(0, parsed));
}

function syncSoundSettings() {
  window.SeasideSushiAudio?.configure({
    enabled: gameSettings.soundEnabled,
    volume: gameSettings.soundVolume,
  });
}

function restoreGameSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY));
    if (saved && typeof saved === 'object') {
      gameSettings.soundEnabled = saved.soundEnabled !== false;
      gameSettings.soundVolume = normalizedSoundVolume(saved.soundVolume);
    }
  } catch {
    gameSettings = { soundEnabled: true, soundVolume: DEFAULT_SOUND_VOLUME };
  }
  syncSoundSettings();
}

function saveGameSettings() {
  syncSoundSettings();
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(gameSettings));
  } catch {
    // Settings are optional; private browsing can refuse storage without affecting play.
  }
}

function asStoredCount(value, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(max, Math.max(0, Math.floor(parsed)));
}

function normalizeRawFish(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(RAW_FISH_IDS.map((id) => [id, asStoredCount(source[id], MAX_RAW_FISH)]));
}

function isKnownDishId(id) {
  return typeof id === 'string' && Boolean(PLATTER_TYPES[id] || SUSHI_TYPES[id]);
}

function normalizeUnlockedDrinks(value, legacyTeaUnlocked = false) {
  const values = Array.isArray(value) ? [...value] : [];
  if (legacyTeaUnlocked) values.push('tea');
  return [...new Set(values.filter(isKnownDrinkId))];
}

function savedDrinkTypes(value, unlockedDrinks, max) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((id) => isKnownDrinkId(id) && unlockedDrinks.includes(id))
    .slice(0, max);
}

function isIngredientId(id) {
  const sushiType = SUSHI_TYPES[id];
  return Boolean(sushiType && !sushiType.recipeId);
}

function normalizeUnlockedRecipes(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => RECIPE_IDS.includes(id)))];
}

function canRestoreDish(id, unlockedIngredients, unlockedRecipes) {
  const dish = dishFor(id);
  if (dish.kind === 'platter') return unlockedRecipes.includes('sashimi-platter');
  if (dish.recipeId && !unlockedRecipes.includes(dish.recipeId)) return false;
  if (dish.requiresRecipe && !unlockedRecipes.includes(dish.requiresRecipe)) return false;
  return dish.recipeId ? true : unlockedIngredients.includes(dish.id);
}

function savedSushiTypes(value, unlockedIngredients, unlockedRecipes, max) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((id) => isKnownDishId(id) && canRestoreDish(id, unlockedIngredients, unlockedRecipes))
    .slice(0, max);
}

function savedPlatterAssembly(value, unlockedRecipes) {
  if (!unlockedRecipes.includes('sashimi-platter') || !Array.isArray(value)) return [];
  return value.filter((id) => PLATTER_FISH_IDS.includes(id)).slice(0, 2);
}

function normalizedTutorialStep(value) {
  const step = Number(value);
  return Number.isInteger(step) && step >= TUTORIAL_STEP.WELCOME && step <= TUTORIAL_STEP.SERVE_CUSTOMER
    ? step
    : TUTORIAL_STEP.WELCOME;
}

function customerTemplateForSavedCustomer(customer) {
  if (!customer || typeof customer !== 'object') return CUSTOMER_CATALOG[0];
  if (customer.specialOrder) return SPECIAL_CUSTOMER_TEMPLATE;
  return CUSTOMER_TEMPLATES.find((template) => template.customerType === customer.customerType && template.avatar === customer.avatar)
    ?? CUSTOMER_TEMPLATES.find((template) => template.customerType === customer.customerType)
    ?? CUSTOMER_CATALOG[0];
}

function savedCustomerOrderItems(value, unlockedIngredients, unlockedRecipes, unlockedDrinks) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (!item || typeof item !== 'object') return null;
    if (isDrinkOrderItem(item)) {
      const drinkId = drinkIdForOrderItem(item);
      if (!unlockedDrinks.includes(drinkId)) return null;
      return {
        type: 'drink',
        id: drinkId,
        price: drinkFor(drinkId).price,
        fulfilled: Boolean(item.fulfilled),
      };
    }
    if (item.type !== 'sushi' || !isKnownDishId(item.id) || !canRestoreDish(item.id, unlockedIngredients, unlockedRecipes)) return null;
    return {
      type: 'sushi',
      id: item.id,
      price: dishFor(item.id).price,
      fulfilled: Boolean(item.fulfilled),
    };
  }).filter(Boolean).slice(0, 4);
}

function savedWaitingCustomers() {
  return state.customers
    .filter((customer) => customer && !customer.served && !customer.leaving && customer.day === state.day)
    .map((customer, index) => {
      const template = customerTemplateForSavedCustomer(customer);
      const isTutorialCustomer = Boolean(customer.tutorial);
      const waitDuration = customerWaitDuration(customer);
      const elapsed = Math.max(0, gameplayNow() - Number(customer.arrivedAt || 0));
      return {
        id: typeof customer.id === 'string' ? customer.id.slice(0, 80) : `saved-${index}`,
        customerType: template.customerType,
        avatar: template.avatar,
        minimumDay: template.minimumDay,
        favoriteSushiId: template.favoriteSushiId ?? null,
        patienceMultiplier: template.patienceMultiplier,
        specialOrder: isSpecialOrderCustomer(customer),
        specialBonus: isSpecialOrderCustomer(customer)
          ? normalizedSpecialOrderBonus(customer.specialBonus, customer.orderItems ?? [])
          : 0,
        orderItems: customer.orderItems ?? [],
        remainingPatienceMs: isTutorialCustomer ? null : Math.max(0, Math.ceil(waitDuration - elapsed)),
        tutorial: isTutorialCustomer,
      };
    })
    .filter((customer) => customer.orderItems.some((item) => !item.fulfilled));
}

function restoredWaitingCustomers(value, { unlockedIngredients, unlockedRecipes, unlockedDrinks, day }) {
  if (!Array.isArray(value)) return [];
  const now = gameplayNow();
  const seenIds = new Set();
  return value.slice(0, MAX_WAITING_CUSTOMERS).map((savedCustomer, index) => {
    const template = customerTemplateForSavedCustomer(savedCustomer);
    const orderItems = savedCustomerOrderItems(savedCustomer?.orderItems, unlockedIngredients, unlockedRecipes, unlockedDrinks);
    if (!orderItems.length || orderItems.every((item) => item.fulfilled)) return null;
    const isTutorialCustomer = Boolean(savedCustomer?.tutorial);
    const waitDuration = customerWaitDuration(template);
    const storedRemaining = Number(savedCustomer?.remainingPatienceMs);
    const remainingPatienceMs = isTutorialCustomer
      ? waitDuration
      : Number.isFinite(storedRemaining)
        ? Math.min(waitDuration, Math.max(0, Math.floor(storedRemaining)))
        : waitDuration;
    let id = typeof savedCustomer?.id === 'string' && savedCustomer.id ? savedCustomer.id.slice(0, 80) : `restored-${index}`;
    if (seenIds.has(id)) id = `restored-${index}`;
    seenIds.add(id);
    const specialOrder = Boolean(template.specialOrder || savedCustomer?.specialOrder || template.customerType === 'special');
    const specialBonus = specialOrder
      ? normalizedSpecialOrderBonus(savedCustomer?.specialBonus, orderItems)
      : 0;
    const restoredCustomer = {
      ...template,
      specialOrder,
      specialBonus,
    };
    return {
      ...restoredCustomer,
      id,
      orderItems,
      price: customerOrderPrice(restoredCustomer, orderItems),
      arrivedAt: isTutorialCustomer ? now : now - (waitDuration - remainingPatienceMs),
      served: false,
      leaving: false,
      day,
      dayResolved: false,
      tutorial: isTutorialCustomer,
    };
  }).filter(Boolean);
}

function hasUnsettledSaveState() {
  return Boolean(
    state.incomingSlices
    || state.incomingRice
    || state.incomingSushi
    || state.incomingDrinks
    || state.drinkPouring
    || state.platterMaking
    || state.salmonOnBoard
    || state.shrimpOnBoard
    || state.shrimpHeads.length
    || state.shrimpHeadDiscarding
  );
}

function buildSaveSnapshot() {
  const stableSliceCount = Math.max(0, state.sliceTypes.length - state.incomingSlices);
  const stableSushiCount = Math.max(0, state.sushiTypes.length - state.incomingSushi);
  const stableDrinkCount = Math.max(0, state.drinkTypes.length - state.incomingDrinks);
  return {
    version: SAVE_VERSION,
    cash: asStoredCount(state.cash, 9_999_999),
    lifetimeRevenue: asStoredCount(state.lifetimeRevenue, 9_999_999),
    unlockedDecorations: normalizeUnlockedDecorations(state.unlockedDecorations),
    activeDecoration: normalizedActiveDecoration(state.activeDecoration, state.unlockedDecorations),
    unlockedIngredients: [...new Set(state.unlockedIngredients.filter(isIngredientId))],
    fishingFeaturedFish: normalizedFishingFeaturedFish(state.fishingFeaturedFish),
    fishingUpgrades: normalizeFishingUpgrades(state.fishingUpgrades),
    unlockedRecipes: normalizeUnlockedRecipes(state.unlockedRecipes),
    unlockedDrinks: normalizeUnlockedDrinks(state.unlockedDrinks),
    storageLevels: normalizeStorageLevels(state.storageLevels),
    teaUnlocked: isTeaUnlocked(),
    tutorialCompleted: Boolean(state.tutorialCompleted),
    tutorialStarted: Boolean(!state.tutorialCompleted && state.tutorialStarted),
    tutorialStep: normalizedTutorialStep(state.tutorialStep),
    day: Math.max(1, Math.floor(state.day)),
    dayPhase: state.dayPhase,
    dayCustomersFinished: Math.max(0, Math.floor(state.dayCustomersFinished)),
    dayCustomersServed: Math.max(0, Math.floor(state.dayCustomersServed)),
    dayIncome: Math.max(0, Math.floor(state.dayIncome)),
    dayTimeRemainingMs: Math.ceil(dayTimeRemaining()),
    dayEndedEarly: Boolean(state.dayEndedEarly),
    shopOpen: Boolean(state.shopOpen),
    customerSerial: Math.max(0, Math.floor(state.customerSerial)),
    // Keep the once-per-day special-order rule after a refresh, while old
    // saves without this field remain valid.
    specialOrderDay: state.specialOrderDay === state.day ? state.day : 0,
    customers: savedWaitingCustomers(),
    inventory: {
      rawFish: normalizeRawFish(state.rawFish),
      sliceTypes: state.sliceTypes.slice(0, stableSliceCount),
      rice: Math.max(0, state.riceStored - state.incomingRice),
      sushiTypes: state.sushiTypes.slice(0, stableSushiCount),
      platterAssembly: savedPlatterAssembly(state.platterAssembly, state.unlockedRecipes),
      drinks: state.drinkTypes.slice(0, stableDrinkCount),
    },
  };
}

function storedRawFishSnapshot() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || saved.version !== SAVE_VERSION) return null;
    const inventory = saved.inventory && typeof saved.inventory === 'object' ? saved.inventory : {};
    return {
      raw,
      rawFish: normalizeRawFish(inventory.rawFish),
      day: asStoredCount(saved.day, 9_999),
    };
  } catch {
    return null;
  }
}

function saveSnapshotWithoutRawFish(raw) {
  try {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || saved.version !== SAVE_VERSION) return null;
    const inventory = saved.inventory && typeof saved.inventory === 'object' ? saved.inventory : {};
    const comparableInventory = { ...inventory };
    delete comparableInventory.rawFish;
    return JSON.stringify({ ...saved, inventory: comparableInventory });
  } catch {
    return null;
  }
}

function onlyRawFishChangedSinceLastSave(raw) {
  if (!lastSavedSnapshot || raw === lastSavedSnapshot) return true;
  const previous = saveSnapshotWithoutRawFish(lastSavedSnapshot);
  const latest = saveSnapshotWithoutRawFish(raw);
  return Boolean(previous && latest && previous === latest);
}

function rawFishWithLocalChanges(latestRawFish) {
  return Object.fromEntries(RAW_FISH_IDS.map((id) => {
    const current = asStoredCount(state.rawFish?.[id], MAX_RAW_FISH);
    const baseline = asStoredCount(lastSavedRawFish?.[id], MAX_RAW_FISH);
    const latest = asStoredCount(latestRawFish?.[id], MAX_RAW_FISH);
    return [id, asStoredCount(latest + current - baseline, MAX_RAW_FISH)];
  }));
}

function reconcileExternalFishBeforeSave() {
  const stored = storedRawFishSnapshot();
  // A saved game that was deleted elsewhere must stay deleted. Fresh games
  // have no prior snapshot and may create their first save normally.
  if (!stored) return !lastSavedSnapshot;

  // A different day means another tab has already advanced the game. Do not
  // let this stale page restore the previous day on top of that save.
  if (stored.day && stored.day !== state.day) return false;
  // Fishing only changes rawFish. Any other external change is authoritative:
  // refusing to save here prevents an old kitchen tab from overwriting cash,
  // unlocks, customers, or a freshly reset save.
  if (!onlyRawFishChangedSinceLastSave(stored.raw)) return false;
  state.rawFish = rawFishWithLocalChanges(stored.rawFish);
  return true;
}

function scheduleExternalSaveReload({ saveRemoved = false } = {}) {
  if (externalSaveReloadTimer !== null || document.visibilityState === 'hidden') return;
  externalSaveReloadTimer = window.setTimeout(() => {
    externalSaveReloadTimer = null;
    // A reset should return to the menu instead of constructing a new kitchen
    // from a page that was restored from history.
    if (saveRemoved) window.location.replace('./?returning=1');
    else window.location.reload();
  }, 80);
}

function syncExternalSave(raw = window.localStorage.getItem(SAVE_KEY)) {
  if (raw === lastSavedSnapshot) return;
  if (!raw) {
    if (lastSavedSnapshot) scheduleExternalSaveReload({ saveRemoved: true });
    return;
  }

  const stored = storedRawFishSnapshot();
  if (!stored) {
    scheduleExternalSaveReload();
    return;
  }

  const sameDay = !stored.day || stored.day === state.day;
  if (sameDay && onlyRawFishChangedSinceLastSave(stored.raw)) {
    state.rawFish = rawFishWithLocalChanges(stored.rawFish);
    lastSavedSnapshot = stored.raw;
    lastSavedRawFish = normalizeRawFish(stored.rawFish);
    render();
    return;
  }

  // A different scene/tab changed more than fish stock. Reloading is safer
  // than keeping a stale kitchen that could make a whole day unsaveable.
  scheduleExternalSaveReload();
}

function saveGame() {
  if (hasUnsettledSaveState()) return false;
  if (!reconcileExternalFishBeforeSave()) return false;
  const snapshot = JSON.stringify(buildSaveSnapshot());
  if (snapshot === lastSavedSnapshot) return true;
  try {
    window.localStorage.setItem(SAVE_KEY, snapshot);
    lastSavedSnapshot = snapshot;
    lastSavedRawFish = normalizeRawFish(state.rawFish);
    return true;
  } catch {
    return false;
  }
}

function scheduleSave(delay = 180) {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    if (hasUnsettledSaveState()) {
      scheduleSave(240);
      return;
    }
    saveGame();
  }, delay);
}

function restoreGame() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || saved.version !== SAVE_VERSION) return false;

    const savedUnlocks = Array.isArray(saved.unlockedIngredients)
      ? saved.unlockedIngredients.filter(isIngredientId)
      : [];
    const unlockedIngredients = [...new Set([...INITIAL_UNLOCKED_INGREDIENTS, ...savedUnlocks])];
    const unlockedDecorations = normalizeUnlockedDecorations(saved.unlockedDecorations);
    const activeDecoration = normalizedActiveDecoration(saved.activeDecoration, unlockedDecorations);
    const fishingFeaturedFish = normalizedFishingFeaturedFish(saved.fishingFeaturedFish, unlockedIngredients);
    const fishingUpgrades = normalizeFishingUpgrades(saved.fishingUpgrades);
    const unlockedRecipes = normalizeUnlockedRecipes(saved.unlockedRecipes);
    const inventory = saved.inventory && typeof saved.inventory === 'object' ? saved.inventory : {};
    const storageLevels = normalizeStorageLevels(saved.storageLevels);
    const rawFish = normalizeRawFish(inventory.rawFish);
    let sliceTypes = savedSushiTypes(inventory.sliceTypes, unlockedIngredients, unlockedRecipes, storageCapacityFor('slices', storageLevels));
    let sushiTypes = savedSushiTypes(inventory.sushiTypes, unlockedIngredients, unlockedRecipes, storageCapacityFor('sushi', storageLevels));
    let platterAssembly = savedPlatterAssembly(inventory.platterAssembly, unlockedRecipes);
    let riceStored = asStoredCount(inventory.rice, storageCapacityFor('rice', storageLevels));
    const unlockedDrinks = normalizeUnlockedDrinks(saved.unlockedDrinks, Boolean(saved.teaUnlocked));
    const legacyTeaCount = Boolean(saved.teaUnlocked)
      ? asStoredCount(inventory.tea, storageCapacityFor('drinks', storageLevels))
      : 0;
    const savedDrinks = Array.isArray(inventory.drinks)
      ? inventory.drinks
      : Array.from({ length: legacyTeaCount }, () => 'tea');
    let drinkTypes = savedDrinkTypes(savedDrinks, unlockedDrinks, storageCapacityFor('drinks', storageLevels));
    // Old saves predate the tutorial. Keep their owners in the game instead of
    // putting an established shop back through a first-day lesson.
    const tutorialCompleted = typeof saved.tutorialCompleted === 'boolean' ? saved.tutorialCompleted : true;
    const tutorialStarted = !tutorialCompleted && Boolean(saved.tutorialStarted);
    const tutorialStep = tutorialStarted ? normalizedTutorialStep(saved.tutorialStep) : TUTORIAL_STEP.WELCOME;
    const hasSavedDay = Number.isFinite(Number(saved.day)) && Number(saved.day) >= 1;
    const day = hasSavedDay
      ? asStoredCount(saved.day, 9_999) || 1
      : tutorialCompleted ? 2 : 1;
    const legacySettlement = !hasSavedDay && typeof saved.shopOpen === 'boolean' && !saved.shopOpen;
    let dayPhase = saved.dayPhase === 'settlement' || legacySettlement ? 'settlement' : 'service';
    const dayCustomersFinished = asStoredCount(saved.dayCustomersFinished, 9_999_999);
    const dayCustomersServed = Math.min(dayCustomersFinished, asStoredCount(saved.dayCustomersServed, 9_999_999));
    const dayIncome = asStoredCount(saved.dayIncome, 9_999_999);
    const lifetimeRevenue = asStoredCount(saved.lifetimeRevenue ?? saved.cash, 9_999_999);
    const dayDuration = dayDurationForDay(day);
    const savedDayTime = Number(saved.dayTimeRemainingMs);
    const dayTimeRemainingMs = Number.isFinite(savedDayTime)
      ? Math.min(dayDuration, Math.max(0, Math.floor(savedDayTime)))
      : dayDuration;
    const dayFinishedWhileAway = dayPhase === 'service' && tutorialCompleted && dayTimeRemainingMs <= 0;
    if (dayFinishedWhileAway) {
      dayPhase = 'settlement';
      // Match a normal end-of-day: food left on the counter must not return
      // merely because the page was refreshed at the end of a shift.
      sliceTypes = [];
      riceStored = 0;
      sushiTypes = [];
      platterAssembly = [];
      drinkTypes = [];
    }
    const shopOpen = dayPhase === 'service';
    const customers = dayPhase === 'service'
      ? restoredWaitingCustomers(saved.customers, {
        unlockedIngredients,
        unlockedRecipes,
        unlockedDrinks,
        day,
      }).filter((customer) => tutorialStarted || !customer.tutorial)
      : [];
    const tutorialCustomerId = tutorialStarted
      ? customers.find((customer) => customer.tutorial)?.id ?? null
      : null;
    const savedSpecialOrderDay = asStoredCount(saved.specialOrderDay, 9_999);
    const specialOrderDay = savedSpecialOrderDay === day
      ? day
      : customers.some(isSpecialOrderCustomer)
        ? day
        : 0;

    Object.assign(state, {
      salmonOnBoard: false,
      shrimpOnBoard: false,
      shrimpBatch: [],
      shrimpBatchSerial: 0,
      boardIngredientId: null,
      cutLines: [false, false, false],
      activeCut: null,
      cutStartY: 0,
      activeShrimpCut: null,
      shrimpCutStartY: 0,
      shrimpHeads: [],
      shrimpHeadDiscarding: false,
      slicesReady: sliceTypes.length,
      incomingSlices: 0,
      sliceTypes,
      flightVersion: 0,
      riceStored,
      incomingRice: 0,
      sushiStored: sushiTypes.length,
      incomingSushi: 0,
      sushiTypes,
      cupOnMachine: false,
      drinkPouring: false,
      drinksStored: drinkTypes.length,
      incomingDrinks: 0,
      drinkVersion: 0,
      machineDrinkId: null,
      drinkPickerOpen: false,
      drinkTypes,
      sashimiPickerOpen: false,
      shopPanelOpen: false,
      unlockedDecorations,
      activeDecoration,
      unlockedIngredients,
      unlockedRecipes,
      platterAssembly,
      platterMaking: false,
      rawFish,
      fishingFeaturedFish,
      fishingUpgrades,
      storageLevels,
      teaUnlocked: unlockedDrinks.includes('tea'),
      unlockedDrinks,
      tutorialCompleted,
      tutorialStarted,
      tutorialStep,
      tutorialCustomerId,
      day,
      dayPhase,
      dayCustomersFinished,
      dayCustomersServed,
      dayIncome,
      dayTimeRemainingMs,
      dayTimerStarted: false,
      dayTimerStartedAt: 0,
      dayEndedEarly: dayPhase === 'settlement' && Boolean(saved.dayEndedEarly),
      daySummaryOpen: false,
      shopOpen,
      gamePaused: false,
      pauseSettingsOpen: false,
      cash: asStoredCount(saved.cash, 9_999_999),
      lifetimeRevenue,
      customers,
      customerSerial: asStoredCount(saved.customerSerial, 9_999_999),
      specialOrderDay,
    });
    lastSavedSnapshot = raw;
    lastSavedRawFish = normalizeRawFish(rawFish);
    return true;
  } catch {
    return false;
  }
}

const stage = document.querySelector('#kitchen-stage');
const message = document.querySelector('#kitchen-message');
const sceneBackground = document.querySelector('#scene-background');
const stageName = document.querySelector('#stage-name');
const customerQueue = document.querySelector('#customer-queue');
const cashValue = document.querySelector('#cash-value');
const dayLabel = document.querySelector('#day-label');
const dayStatus = document.querySelector('#day-status');
const daySummaryOverlay = document.querySelector('#day-summary-overlay');
const daySummaryTitle = document.querySelector('#day-summary-title');
const daySummaryDismissButton = document.querySelector('#day-summary-dismiss');
const fishStation = document.querySelector('.fish-station');
const freezerButton = document.querySelector('#freezer-button');
const sashimiPicker = document.querySelector('#sashimi-picker');
const sashimiChoices = Array.from(document.querySelectorAll('.sashimi-choice'));
const ingredientShopToggle = document.querySelector('#ingredient-shop-toggle');
const ingredientShopPanel = document.querySelector('#ingredient-shop-panel');
const ingredientShopClose = document.querySelector('#ingredient-shop-close');
const ingredientShopCash = document.querySelector('#ingredient-shop-cash');
const ingredientShopItems = document.querySelector('#ingredient-shop-items');
const storageUpgradeItems = document.querySelector('#storage-upgrade-items');
const decorationThemeItems = document.querySelector('#decoration-theme-items');
const riceBin = document.querySelector('#rice-bin');
const boardStation = document.querySelector('.board-station');
const assemblyStation = document.querySelector('.assembly-station');
const boardSalmon = document.querySelector('#board-salmon');
const boardIngredientImage = document.querySelector('#board-ingredient-image');
const shrimpBatch = document.querySelector('#shrimp-batch');
const shrimpHeadRack = document.querySelector('#shrimp-head-rack');
const trashBin = document.querySelector('#trash-bin');
const sliceRack = document.querySelector('#slice-rack');
const riceRack = document.querySelector('#rice-rack');
const sushiRack = document.querySelector('#sushi-rack');
const platterStation = document.querySelector('#platter-station');
const platterSlicePreview = document.querySelector('#platter-slice-preview');
const drinkPicker = document.querySelector('#drink-picker');
const gamePauseButton = document.querySelector('#game-pause-button');
const gamePauseOverlay = document.querySelector('#game-pause-overlay');
const gamePauseMenu = document.querySelector('#game-pause-menu');
const gameSettingsPanel = document.querySelector('#game-settings-panel');
const resumeGameButton = document.querySelector('#resume-game-button');
const openGameSettingsButton = document.querySelector('#open-game-settings-button');
const closeGameSettingsButton = document.querySelector('#close-game-settings-button');
const soundSettingButton = document.querySelector('#sound-setting-button');
const soundVolumeSetting = document.querySelector('#sound-volume-setting');
const soundVolumeValue = document.querySelector('#sound-volume-value');
const exitGameButton = document.querySelector('#exit-game-button');
const exitLoadingOverlay = document.querySelector('#exit-loading-overlay');
const openShopButton = document.querySelector('#open-shop-button');
const goFishingButton = document.querySelector('#go-fishing-button');
const settlementActions = document.querySelector('#settlement-actions');
const drinkMachine = document.querySelector('#drink-machine');
const cupStation = document.querySelector('#cup-station');
const machineCup = document.querySelector('#machine-cup');
const drinkRack = document.querySelector('#drink-rack');
const tutorialGuide = document.querySelector('#tutorial-guide');
const tutorialStepLabel = document.querySelector('#tutorial-step-label');
const tutorialTitle = document.querySelector('#tutorial-title');
const tutorialDescription = document.querySelector('#tutorial-description');
const tutorialStartButton = document.querySelector('#tutorial-start-button');
const tutorialSkipButton = document.querySelector('#tutorial-skip-button');
const selectTamago = document.querySelector('#select-tamago');
let ingredientDrag = null;
let customerPatienceFrame = null;
let shopRenderSignature = '';
let customerSpawnTimer = null;
const customerLeaveTimers = new Map();
const customerExitTimers = new Map();
const stationMotionTimers = new WeakMap();
const stationMotionFrames = new WeakMap();
let dayEndTimer = null;
let dayClockFrame = null;
let dayClockLastSecond = null;
let dayClockLastSavedAt = 0;
const modalCloseTimers = new WeakMap();
let daySummaryTransitioning = false;
let shopPanelClosing = false;
let pauseOverlayClosing = false;
let tutorialWelcomeClosing = false;
let fishingTransitioning = false;

stage.addEventListener('dragstart', (event) => event.preventDefault());

function show(element, visible) {
  element.classList.toggle('is-hidden', !visible);
}

function setMessage(text) {
  message.textContent = text;
}

function playSound(effect) {
  window.SeasideSushiAudio?.play(effect);
}

function tutorialNeedsCompletion() {
  return !state.tutorialCompleted;
}

function tutorialIsRunning() {
  return tutorialNeedsCompletion() && state.tutorialStarted;
}

function tutorialCustomer() {
  return state.tutorialCustomerId
    ? state.customers.find((customer) => customer.id === state.tutorialCustomerId) ?? null
    : null;
}

function tutorialStepFromProgress() {
  const hasReadyTamagoSushi = state.sushiTypes.includes('tamago') && !state.incomingSushi;
  if (hasReadyTamagoSushi) return TUTORIAL_STEP.SERVE_CUSTOMER;

  const hasReadyTamagoSlice = state.sliceTypes.includes('tamago') && !state.incomingSlices;
  if (hasReadyTamagoSlice) {
    return state.riceStored && !state.incomingRice ? TUTORIAL_STEP.MAKE_SUSHI : TUTORIAL_STEP.TAKE_RICE;
  }

  if (state.salmonOnBoard && state.boardIngredientId === 'tamago') return TUTORIAL_STEP.CUT_TAMAGO;
  return TUTORIAL_STEP.FREEZER;
}

function spawnTutorialCustomer() {
  if (!tutorialIsRunning() || state.tutorialStep !== TUTORIAL_STEP.SERVE_CUSTOMER || tutorialCustomer()) return;
  const tutorialSushi = SUSHI_TYPES.tamago;
  const customer = {
    avatar: CUSTOMER_CATALOG[0].avatar,
    id: `tutorial-${Date.now()}`,
    orderItems: [{ type: 'sushi', id: tutorialSushi.id, price: tutorialSushi.price, fulfilled: false }],
    price: tutorialSushi.price,
    arrivedAt: gameplayNow(),
    served: false,
    leaving: false,
    day: state.day,
    dayResolved: false,
    tutorial: true,
  };
  state.tutorialCustomerId = customer.id;
  state.customers.push(customer);
  setMessage('第一位客人来了，只想要一份玉子烧寿司。');
}

function tutorialStepIsReady() {
  switch (state.tutorialStep) {
    case TUTORIAL_STEP.FREEZER:
      return state.sashimiPickerOpen;
    case TUTORIAL_STEP.PLACE_TAMAGO:
      return state.salmonOnBoard && state.boardIngredientId === 'tamago';
    case TUTORIAL_STEP.CUT_TAMAGO:
      return state.cutLines.every(Boolean) && state.sliceTypes.filter((id) => id === 'tamago').length >= 4 && !state.incomingSlices;
    case TUTORIAL_STEP.TAKE_RICE:
      return state.riceStored > 0 && !state.incomingRice;
    case TUTORIAL_STEP.MAKE_SUSHI:
      return state.sushiTypes.includes('tamago') && !state.incomingSushi;
    case TUTORIAL_STEP.SERVE_CUSTOMER:
      return Boolean(tutorialCustomer()?.served);
    default:
      return false;
  }
}

function finishTutorial({ skipped = false } = {}) {
  if (state.tutorialCompleted) return;
  const customer = tutorialCustomer();
  if (skipped && customer && !customer.served && !customer.leaving) {
    customer.tutorial = false;
    customerLeaveTimers.set(customer.id, setGameplayTimeout(() => customerLeaves(customer.id), CUSTOMER_WAIT_MS));
  }
  if (customer) customer.tutorial = false;
  state.tutorialCompleted = true;
  state.tutorialStarted = false;
  state.tutorialStep = TUTORIAL_STEP.WELCOME;
  state.tutorialCustomerId = null;
  setMessage(skipped
    ? '已跳过新手教程，可以按自己的节奏经营。'
    : '第一单完成！教程结束，接下来自己完成第一天的订单吧。');
  startDayClock();
  if (!hasUnsettledSaveState()) saveGame();
  else scheduleSave();
  if (skipped) scheduleCustomer(650);
}

function syncTutorialProgress() {
  if (!tutorialIsRunning()) return;
  let safety = 0;
  while (tutorialStepIsReady() && safety < TUTORIAL_STEP_COUNT) {
    if (state.tutorialStep === TUTORIAL_STEP.SERVE_CUSTOMER) {
      finishTutorial();
      return;
    }
    state.tutorialStep += 1;
    if (state.tutorialStep === TUTORIAL_STEP.SERVE_CUSTOMER) spawnTutorialCustomer();
    safety += 1;
  }
}

function tutorialView() {
  const cutProgress = state.cutLines.filter(Boolean).length;
  const customerCard = tutorialCustomer() ? customerCardFor(state.tutorialCustomerId) : null;
  switch (state.tutorialStep) {
    case TUTORIAL_STEP.FREEZER:
      return {
        label: `第 1/${TUTORIAL_STEP_COUNT} 步`,
        title: '先选玉子烧',
        description: '点击左边的冰柜，打开食材选择。',
        targets: [freezerButton],
      };
    case TUTORIAL_STEP.PLACE_TAMAGO:
      return {
        label: `第 2/${TUTORIAL_STEP_COUNT} 步`,
        title: '把玉子烧放上菜板',
        description: '按住玉子烧，拖到旁边的切菜板。',
        targets: [selectTamago, boardStation],
      };
    case TUTORIAL_STEP.CUT_TAMAGO:
      return {
        label: `第 3/${TUTORIAL_STEP_COUNT} 步`,
        title: '沿虚线切片',
        description: `在虚线附近按住后向下滑动，切出玉子烧片（${cutProgress}/3）。`,
        targets: [boardSalmon],
      };
    case TUTORIAL_STEP.TAKE_RICE:
      return {
        label: `第 4/${TUTORIAL_STEP_COUNT} 步`,
        title: '取一团米饭',
        description: '点击饭盒，米饭会飞进制作区。',
        targets: [riceBin],
      };
    case TUTORIAL_STEP.MAKE_SUSHI:
      return {
        label: `第 5/${TUTORIAL_STEP_COUNT} 步`,
        title: '组合成寿司',
        description: '把一片玉子烧拖到米饭架，做出第一份寿司。',
        targets: [sliceRack, riceRack],
      };
    case TUTORIAL_STEP.SERVE_CUSTOMER:
      return {
        label: `第 6/${TUTORIAL_STEP_COUNT} 步`,
        title: '交给第一位客人',
        description: '把寿司架里的玉子烧寿司拖到客人身上。',
        targets: [sushiRack, customerCard],
      };
    default:
      return {
        label: '新手教程',
        title: '欢迎来到海边寿司店',
        description: '跟着做出第一份玉子烧寿司，再交给第一位客人吧。',
        targets: [],
      };
  }
}

function renderTutorial() {
  stage.querySelectorAll('.is-tutorial-target').forEach((element) => element.classList.remove('is-tutorial-target'));
  const visible = tutorialNeedsCompletion();
  show(tutorialGuide, visible);
  if (!visible) {
    tutorialGuide.classList.remove('is-closing');
    return;
  }

  const welcome = !state.tutorialStarted;
  const view = tutorialView();
  tutorialGuide.classList.toggle('is-welcome', welcome);
  tutorialStepLabel.textContent = view.label;
  tutorialTitle.textContent = view.title;
  tutorialDescription.textContent = view.description;
  show(tutorialStartButton, welcome);
  tutorialSkipButton.textContent = welcome ? '先自己试试' : '跳过教程';
  view.targets.filter(Boolean).forEach((element) => element.classList.add('is-tutorial-target'));
  if (welcome && document.activeElement !== tutorialStartButton && document.activeElement !== tutorialSkipButton) {
    window.requestAnimationFrame(() => {
      if (tutorialNeedsCompletion() && !state.tutorialStarted) tutorialStartButton.focus();
    });
  }
}

function leaveTutorialWelcome(onFinished) {
  if (tutorialWelcomeClosing) return;
  tutorialWelcomeClosing = true;
  tutorialGuide.classList.add('is-closing');
  window.setTimeout(() => {
    tutorialWelcomeClosing = false;
    tutorialGuide.classList.remove('is-closing');
    onFinished();
  }, motionDuration(220));
}

function startTutorial() {
  if (!tutorialNeedsCompletion() || tutorialWelcomeClosing) return;
  leaveTutorialWelcome(() => {
    state.tutorialStarted = true;
    state.tutorialStep = tutorialStepFromProgress();
    if (state.tutorialStep === TUTORIAL_STEP.SERVE_CUSTOMER) spawnTutorialCustomer();
    setMessage('新手教程开始：跟着高亮提示完成第一单。');
    render();
  });
}

function skipTutorial() {
  if (!tutorialNeedsCompletion() || tutorialWelcomeClosing) return;
  leaveTutorialWelcome(() => {
    finishTutorial({ skipped: true });
    render();
  });
}

function motionDuration(duration) {
  return duration;
}

function openModal(element) {
  const closeTimer = modalCloseTimers.get(element);
  if (closeTimer !== undefined) {
    window.clearTimeout(closeTimer);
    modalCloseTimers.delete(element);
  }
  element.classList.remove('is-hidden', 'is-closing');
}

function closeModal(element, duration = 220, onClosed) {
  if (element.classList.contains('is-hidden')) {
    onClosed?.();
    return;
  }
  if (element.classList.contains('is-closing')) return;

  element.classList.add('is-closing');
  const closeTimer = window.setTimeout(() => {
    if (modalCloseTimers.get(element) !== closeTimer) return;
    modalCloseTimers.delete(element);
    element.classList.remove('is-closing');
    element.classList.add('is-hidden');
    onClosed?.();
  }, motionDuration(duration));
  modalCloseTimers.set(element, closeTimer);
}

function setModalVisibility(element, visible, duration = 220) {
  if (visible) openModal(element);
  else closeModal(element, duration);
}

function finishFlightOnAnimationEnd(element, animationName, onFinish) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    element.removeEventListener('animationend', handleAnimationEnd);
    element.remove();
    onFinish?.();
  };
  const handleAnimationEnd = (event) => {
    if (event.target !== element || event.animationName !== animationName) return;
    finish();
  };

  element.addEventListener('animationend', handleAnimationEnd);
  window.requestAnimationFrame(() => {
    if (element.isConnected) element.classList.add('is-flying');
  });
}

function playStationMotion(element, className, duration) {
  const previousTimer = stationMotionTimers.get(element);
  const previousFrame = stationMotionFrames.get(element);
  if (previousTimer) clearGameplayTimeout(previousTimer);
  if (previousFrame) window.cancelAnimationFrame(previousFrame);
  element.classList.remove(className);
  const frame = window.requestAnimationFrame(() => {
    stationMotionFrames.delete(element);
    if (!element.isConnected) return;
    element.classList.add(className);
    stationMotionTimers.set(element, setGameplayTimeout(() => {
      element.classList.remove(className);
      stationMotionTimers.delete(element);
    }, duration));
  });
  stationMotionFrames.set(element, frame);
}

function clearCustomerTimers({ keepExitTimers = false } = {}) {
  if (customerSpawnTimer) clearGameplayTimeout(customerSpawnTimer);
  customerSpawnTimer = null;
  customerLeaveTimers.forEach((timer) => clearGameplayTimeout(timer));
  customerLeaveTimers.clear();
  if (keepExitTimers) return;
  customerExitTimers.forEach((timer) => clearGameplayTimeout(timer));
  customerExitTimers.clear();
}

function isServingDay() {
  return state.dayPhase === 'service' && state.shopOpen;
}

function dayDurationForDay(day = state.day) {
  return Math.max(1, Math.floor(Number(day) || 1)) === 1
    ? FIRST_DAY_SERVICE_MS
    : STANDARD_DAY_SERVICE_MS;
}

function dayTimeRemaining() {
  const storedRemaining = Math.max(0, Number(state.dayTimeRemainingMs) || 0);
  if (!state.dayTimerStarted) return storedRemaining;
  return Math.max(0, storedRemaining - (gameplayNow() - state.dayTimerStartedAt));
}

function formatDayTime(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function stopDayClockLoop() {
  if (dayClockFrame !== null) window.cancelAnimationFrame(dayClockFrame);
  dayClockFrame = null;
  dayClockLastSecond = null;
}

function clearDayEndTimer() {
  if (!dayEndTimer) return;
  clearGameplayTimeout(dayEndTimer);
  dayEndTimer = null;
}

function stopDayClock() {
  if (state.dayTimerStarted) state.dayTimeRemainingMs = dayTimeRemaining();
  state.dayTimerStarted = false;
  state.dayTimerStartedAt = 0;
  clearDayEndTimer();
  stopDayClockLoop();
}

function refreshDayClock() {
  dayClockFrame = null;
  if (!isServingDay() || state.gamePaused || !state.dayTimerStarted) return;

  const remaining = dayTimeRemaining();
  if (remaining <= 0) {
    state.dayTimeRemainingMs = 0;
    state.dayTimerStarted = false;
    finishDay();
    return;
  }

  const remainingSecond = Math.ceil(remaining / 1000);
  if (remainingSecond !== dayClockLastSecond) {
    dayClockLastSecond = remainingSecond;
    dayStatus.textContent = `剩余 ${formatDayTime(remaining)}`;
  }

  const now = gameplayNow();
  if (now - dayClockLastSavedAt >= DAY_CLOCK_SAVE_INTERVAL_MS && !hasUnsettledSaveState()) {
    dayClockLastSavedAt = now;
    saveGame();
  }
  dayClockFrame = window.requestAnimationFrame(refreshDayClock);
}

function ensureDayClockLoop() {
  if (!isServingDay() || state.gamePaused || !state.dayTimerStarted || dayClockFrame !== null) return;
  dayClockFrame = window.requestAnimationFrame(refreshDayClock);
}

function startDayClock() {
  if (!isServingDay() || tutorialNeedsCompletion() || state.dayTimerStarted) return;
  const remaining = dayTimeRemaining();
  if (remaining <= 0) {
    finishDay();
    return;
  }

  state.dayTimeRemainingMs = remaining;
  state.dayTimerStarted = true;
  state.dayTimerStartedAt = gameplayNow();
  dayClockLastSavedAt = state.dayTimerStartedAt;
  clearDayEndTimer();
  dayEndTimer = setGameplayTimeout(() => {
    dayEndTimer = null;
    state.dayTimeRemainingMs = 0;
    state.dayTimerStarted = false;
    finishDay();
  }, remaining);
  ensureDayClockLoop();
}

function resolveDayCustomer(customer, { served = false } = {}) {
  if (!customer || customer.day !== state.day || customer.dayResolved || state.dayPhase !== 'service') return false;
  customer.dayResolved = true;
  state.dayCustomersFinished += 1;
  if (served) state.dayCustomersServed += 1;
  return true;
}

function returnUntouchedBoardIngredient() {
  let ingredientId = null;
  if (state.salmonOnBoard && state.boardIngredientId && !state.cutLines.some(Boolean)) {
    ingredientId = state.boardIngredientId;
  } else if (state.shrimpOnBoard && state.shrimpBatch.length && state.shrimpBatch.every((shrimp) => !shrimp.cut)) {
    ingredientId = 'shrimp';
  }
  if (!ingredientId || !needsFishing(ingredientId)) return;
  state.rawFish[ingredientId] = Math.min(MAX_RAW_FISH, (state.rawFish[ingredientId] ?? 0) + 1);
}

function clearInProgressKitchenWork({ returnUntouchedIngredient = true } = {}) {
  // Completed ingredients already exist in their storage arrays before their
  // flight animation ends. Keep those items, but cancel their visual callback
  // so an ended day cannot modify the counter behind the settlement screen.
  // A fish that has only been placed on the board has not produced anything;
  // return it only when an early shortage will continue the same day.
  if (returnUntouchedIngredient) returnUntouchedBoardIngredient();
  state.flightVersion += 1;
  state.drinkVersion += 1;
  state.incomingSlices = 0;
  state.incomingRice = 0;
  state.incomingSushi = 0;
  state.incomingDrinks = 0;
  state.slicesReady = state.sliceTypes.length;
  state.sushiStored = state.sushiTypes.length;
  if (state.platterMaking) state.platterAssembly = [];
  state.platterMaking = false;
  state.cupOnMachine = false;
  state.drinkPouring = false;
  state.machineDrinkId = null;
  state.drinkPickerOpen = false;
  state.salmonOnBoard = false;
  state.boardIngredientId = null;
  state.cutLines = [false, false, false];
  state.activeCut = null;
  state.shrimpOnBoard = false;
  state.shrimpBatch = [];
  state.activeShrimpCut = null;
  state.shrimpHeads = [];
  state.shrimpHeadDiscarding = false;
  stage.querySelectorAll('.flying-sushi-slice, .flying-completed-item, .flying-shrimp-head, .sushi-making-animation, .customer-delivery-flight').forEach((element) => element.remove());
}

function clearCounterFood() {
  // Counter racks are daily food, not permanent inventory. Keep freezer fish
  // untouched, but clear every ready or half-made serving for the next day.
  state.sliceTypes = [];
  state.slicesReady = 0;
  state.riceStored = 0;
  state.sushiTypes = [];
  state.sushiStored = 0;
  state.drinkTypes = [];
  state.drinksStored = 0;
  state.platterAssembly = [];
}

function finishDay({ early = false, reason = 'time' } = {}) {
  if (state.dayPhase !== 'service') return false;
  stopDayClock();
  clearCustomerTimers();
  stopCustomerPatienceLoop();
  clearIngredientDrag();
  // An early fish shortage continues the same day after restocking. A normal
  // end starts a fresh day, so nothing prepared on the counter carries over.
  clearInProgressKitchenWork({ returnUntouchedIngredient: early });
  if (!early) clearCounterFood();
  state.customers = [];
  state.sashimiPickerOpen = false;
  state.shopOpen = false;
  state.dayPhase = 'settlement';
  state.dayEndedEarly = early;
  state.daySummaryOpen = !early;
  daySummaryTransitioning = false;
  setMessage(reason === 'missing-fish'
    ? '鱼不够了，先去补货。'
    : early
      ? '暂时打烊。'
      : `第 ${state.day} 天时间到了。`);
  if (!early) playSound('dayEnd');
  render();
  window.requestAnimationFrame(() => {
    if (state.daySummaryOpen) daySummaryDismissButton.focus();
    else goFishingButton.focus();
  });
  if (!hasUnsettledSaveState()) saveGame();
  else scheduleSave();
  return true;
}

function customerCardFor(customerId) {
  return Array.from(customerQueue.children).find((card) => card.dataset.customerId === customerId);
}

function getActiveCustomer() {
  return state.customers.find((customer) => !customer.served && !customer.leaving);
}

function activeCustomerAvatar() {
  const customer = getActiveCustomer();
  return customer ? customerCardFor(customer.id)?.querySelector('.customer-avatar') : null;
}

function availableFishServings(id) {
  if (!needsFishing(id)) return Number.POSITIVE_INFINITY;
  const rawServings = rawFishCount(id) * rawFishYield(id);
  const boardServings = boardServingCapacity(id);
  const slicedServings = state.sliceTypes.filter((sliceId) => sliceId === id).length;
  const finishedSushi = state.sushiTypes.filter((sushiId) => sushiId === id).length;
  return rawServings + boardServings + slicedServings + finishedSushi;
}

function kitchenWorkIsInFlight() {
  return Boolean(
    state.incomingSlices
    || state.incomingRice
    || state.incomingSushi
    || state.incomingDrinks
    || state.drinkPouring
    || state.platterMaking
    || state.salmonOnBoard
    || state.shrimpOnBoard
    || state.shrimpHeads.length
    || state.shrimpHeadDiscarding,
  );
}

function hasMissingFishForWaitingOrders() {
  const requiredServings = new Map();
  state.customers.forEach((customer) => {
    if (customer.served || customer.leaving) return;
    pendingOrderItems(customer).forEach((item) => {
      if (item.type !== 'sushi' || !needsFishing(item.id)) return;
      requiredServings.set(item.id, (requiredServings.get(item.id) ?? 0) + 1);
    });
  });
  return Array.from(requiredServings).some(([id, required]) => availableFishServings(id) < required);
}

function maybeEndDayForMissingFish() {
  if (!isServingDay() || state.gamePaused || tutorialNeedsCompletion() || kitchenWorkIsInFlight()) return false;
  // 没有生鱼并不代表不能营业：玉子烧和饮品仍可继续售卖。
  // 只有已经排队的订单确实缺少所需鱼种时，才提前结束当天。
  if (!hasMissingFishForWaitingOrders()) return false;
  finishDay({ early: true, reason: 'missing-fish' });
  return true;
}

function customerWaitDuration(customer) {
  const multiplier = Number(customer?.patienceMultiplier);
  const normalizedMultiplier = Number.isFinite(multiplier) ? multiplier : 1;
  return Math.round(CUSTOMER_WAIT_MS * Math.min(1.35, Math.max(0.45, normalizedMultiplier)));
}

function getPatience(customer) {
  if (customer.tutorial) return 100;
  const waitDuration = customerWaitDuration(customer);
  return Math.max(0, Math.min(100, ((waitDuration - (gameplayNow() - customer.arrivedAt)) / waitDuration) * 100));
}

function stopCustomerPatienceLoop() {
  if (customerPatienceFrame === null) return;
  window.cancelAnimationFrame(customerPatienceFrame);
  customerPatienceFrame = null;
}

function refreshCustomerPatience() {
  customerPatienceFrame = null;
  if (state.gamePaused) return;

  let hasWaitingCustomer = false;
  state.customers.forEach((customer) => {
    if (customer.served || customer.leaving) return;
    const card = customerCardFor(customer.id);
    const fill = card?._patienceFill;
    if (!fill) return;
    hasWaitingCustomer = true;
    fill.style.transform = `scaleX(${getPatience(customer) / 100})`;
  });

  if (hasWaitingCustomer) customerPatienceFrame = window.requestAnimationFrame(refreshCustomerPatience);
}

function ensureCustomerPatienceLoop() {
  if (state.gamePaused || customerPatienceFrame !== null) return;
  if (!state.customers.some((customer) => !customer.served && !customer.leaving)) return;
  customerPatienceFrame = window.requestAnimationFrame(refreshCustomerPatience);
}

function createCustomerCard(customer) {
  const card = document.createElement('article');
  const motion = document.createElement('div');
  const avatar = document.createElement('img');
  const order = document.createElement('div');
  const wait = document.createElement('div');
  const fill = document.createElement('i');
  const receivedSushi = document.createElement('img');

  card.className = 'customer is-entering';
  card.dataset.customerId = customer.id;
  motion.className = 'customer-motion';
  avatar.className = 'customer-avatar';
  avatar.draggable = false;
  avatar.addEventListener('click', (event) => {
    if (avatar.tabIndex !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    evictBeggar(card.dataset.customerId);
  });
  avatar.addEventListener('keydown', (event) => {
    if (avatar.tabIndex !== 0 || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    evictBeggar(card.dataset.customerId);
  });
  order.className = 'customer-order';
  wait.className = 'customer-wait';
  wait.append(fill);
  card._patienceFill = fill;
  receivedSushi.className = 'customer-received-sushi is-hidden';
  receivedSushi.alt = '顾客拿到的寿司';
  receivedSushi.draggable = false;
  motion.append(avatar, order, wait, receivedSushi);
  card.append(motion);
  card.addEventListener('animationend', (event) => {
    if (event.animationName === 'customer-enter') card.classList.remove('is-entering');
  });
  return card;
}

function appendCustomerOrderItem(order, item) {
  const itemWrap = document.createElement('span');
  const icon = document.createElement('img');

  itemWrap.className = 'customer-order-item';
  itemWrap.style.cssText = 'position:relative;display:inline-grid;place-items:center;width:1.72em;height:1.72em;flex:0 0 auto;';
  itemWrap.title = `${orderItemName(item)}${item.fulfilled ? '（已交付）' : ''}`;
  icon.src = orderItemAsset(item);
  icon.alt = item.fulfilled ? `${orderItemName(item)}，已交付` : orderItemName(item);
  icon.draggable = false;

  if (item.fulfilled) {
    icon.style.cssText = 'opacity:.36;filter:grayscale(1) brightness(.82);';
    const check = document.createElement('b');
    check.textContent = '✓';
    check.setAttribute('aria-hidden', 'true');
    check.style.cssText = 'position:absolute;right:-.28em;bottom:-.28em;display:grid;place-items:center;width:.9em;height:.9em;border:1px solid #704331;border-radius:999px;color:#fff8dc;background:#70af77;font-size:.76em;line-height:1;box-shadow:0 1px 0 rgb(90 57 45 / .22);';
    itemWrap.append(icon, check);
  } else {
    itemWrap.append(icon);
  }

  order.append(itemWrap);
}

function appendSpecialOrderReward(order, customer) {
  const bonus = normalizedSpecialOrderBonus(customer.specialBonus, customer.orderItems ?? []);
  if (!bonus) return;

  const reward = document.createElement('strong');
  reward.className = 'special-order-reward';
  reward.textContent = `奖励 +¥${bonus}`;
  reward.setAttribute('aria-label', `完成这份特别订单可额外获得 ¥${bonus}`);
  order.append(reward);
}

function showSpecialOrderReward(customer, bonus) {
  if (!bonus) return;
  const card = customerCardFor(customer.id);
  const stageRect = stage.getBoundingClientRect();
  const cardRect = card?.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height || !cardRect) return;

  const reward = document.createElement('div');
  reward.className = 'special-order-reward-float';
  reward.textContent = `+¥${bonus} 特别奖励`;
  reward.setAttribute('aria-hidden', 'true');
  reward.style.left = `${cardRect.left + (cardRect.width * .5) - stageRect.left}px`;
  reward.style.top = `${cardRect.top + (cardRect.height * .23) - stageRect.top}px`;
  reward.addEventListener('animationend', () => reward.remove(), { once: true });
  stage.append(reward);
}

function customerOrderSignature(customer) {
  const status = customer.served ? 'served' : customer.leaving ? 'leaving' : 'waiting';
  const items = (customer.orderItems ?? []).map((item) => `${item.type}:${isDrinkOrderItem(item) ? drinkIdForOrderItem(item) : item.id}:${item.fulfilled ? 1 : 0}`);
  const special = isSpecialOrderCustomer(customer) ? `special:${normalizedSpecialOrderBonus(customer.specialBonus, customer.orderItems ?? [])}` : 'standard';
  return `${status}|${special}|${items.join('|')}`;
}

function updateCustomerCard(card, customer) {
  const avatar = card.querySelector('.customer-avatar');
  const order = card.querySelector('.customer-order');
  const wait = card.querySelector('.customer-wait');
  const fill = wait.querySelector('i');
  const receivedSushi = card.querySelector('.customer-received-sushi');
  const orderItems = customer.orderItems ?? [];

  const avatarSrc = `${CUSTOMER_ASSET_PATH}${customer.avatar}`;
  if (avatar.getAttribute('src') !== avatarSrc) avatar.src = avatarSrc;
  const isBeggar = customer.customerType === 'beggar';
  const isSpecialOrder = isSpecialOrderCustomer(customer);
  const canEvictBeggar = isBeggar && !customer.served && !customer.leaving && isServingDay() && !state.gamePaused;
  avatar.alt = canEvictBeggar
    ? '逃单客，点击驱逐'
    : isBeggar && customer.fledWithoutPay
      ? '逃单客正在离开'
      : isSpecialOrder
        ? '正在等待特别订单的顾客'
      : '正在等待点寿司的顾客';
  avatar.tabIndex = canEvictBeggar ? 0 : -1;
  avatar.setAttribute('role', canEvictBeggar ? 'button' : 'img');
  avatar.title = canEvictBeggar ? '点击驱逐' : '';
  card.classList.toggle('is-beggar', isBeggar);
  card.classList.toggle('is-impatient', customer.customerType === 'impatient');
  card.classList.toggle('is-large-order', customer.customerType === 'large-order');
  card.classList.toggle('is-regular', customer.customerType === 'regular');
  card.classList.toggle('is-special-order', isSpecialOrder);
  card.classList.toggle('is-serving', Boolean(customer.served));
  card.classList.toggle('is-leaving', Boolean(customer.leaving));
  receivedSushi.classList.add('is-hidden');
  const signature = customerOrderSignature(customer);
  if (order.dataset.signature !== signature) {
    order.replaceChildren();
    order.dataset.signature = signature;
    const specialBonus = isSpecialOrder
      ? normalizedSpecialOrderBonus(customer.specialBonus, orderItems)
      : 0;
    order.setAttribute('aria-label', `${isSpecialOrder ? `特别订单：${orderSummary(orderItems)}，完成奖励 ¥${specialBonus}` : `订单：${orderSummary(orderItems)}`}`);

    if (customer.served) {
      order.append(customer.fledWithoutPay ? '逃单了' : '谢谢！');
    } else if (customer.leaving) {
      order.append('下次见');
    } else {
      orderItems.forEach((item) => appendCustomerOrderItem(order, item));
      if (isSpecialOrder) appendSpecialOrderReward(order, customer);
    }
  }

  const patienceValue = getPatience(customer);
  const isWaiting = !customer.served && !customer.leaving;
  wait.classList.toggle('is-hidden', !isWaiting);
  fill.style.transform = `scaleX(${patienceValue / 100})`;
}

function animateCustomerReflow(beforeRects) {
  window.requestAnimationFrame(() => {
    state.customers.forEach((customer) => {
      const card = customerCardFor(customer.id);
      const previousRect = beforeRects.get(customer.id);
      if (!card || !previousRect || card.classList.contains('is-entering') || card.classList.contains('is-leaving')) return;

      const nextRect = card.getBoundingClientRect();
      const offsetX = previousRect.left - nextRect.left;
      const offsetY = previousRect.top - nextRect.top;
      if (Math.abs(offsetX) < 1 && Math.abs(offsetY) < 1) return;

      card.animate([
        { transform: `translate3d(${offsetX}px, ${offsetY}px, 0)` },
        { transform: 'translate3d(0, 0, 0)' },
      ], {
        duration: 620,
        easing: 'cubic-bezier(.22, .8, .24, 1)',
      });
    });
  });
}

function renderCustomers() {
  const currentCards = Array.from(customerQueue.children);
  const currentIds = currentCards.map((card) => card.dataset.customerId);
  const desiredIdList = state.customers.map((customer) => customer.id);
  const desiredIds = new Set(desiredIdList);
  const layoutChanged = currentIds.length !== desiredIdList.length
    || currentIds.some((id, index) => id !== desiredIdList[index]);
  const beforeRects = layoutChanged
    ? new Map(currentCards.map((card) => [card.dataset.customerId, card.getBoundingClientRect()]))
    : null;
  Array.from(customerQueue.children).forEach((card) => {
    if (!desiredIds.has(card.dataset.customerId)) card.remove();
  });
  state.customers.forEach((customer, index) => {
    const card = customerCardFor(customer.id) ?? createCustomerCard(customer);
    updateCustomerCard(card, customer);
    if (customerQueue.children[index] !== card) customerQueue.append(card);
  });
  if (beforeRects) animateCustomerReflow(beforeRects);
  ensureCustomerPatienceLoop();
}

function fadeOutCustomer(customer, { holdMs = 0, scheduleNext = true } = {}) {
  if (customer.leaving || customerExitTimers.has(customer.id)) return;
  const startFade = () => {
    customer.leaving = true;
    renderCustomers();
    customerExitTimers.set(customer.id, setGameplayTimeout(() => {
      customerExitTimers.delete(customer.id);
      const index = state.customers.findIndex((waitingCustomer) => waitingCustomer.id === customer.id);
      if (index !== -1) state.customers.splice(index, 1);
      render();
      scheduleSave();
      if (scheduleNext) scheduleCustomer(950);
    }, CUSTOMER_EXIT_MS));
  };
  if (holdMs <= 0) {
    startFade();
    return;
  }
  customerExitTimers.set(customer.id, setGameplayTimeout(startFade, holdMs));
}

function scheduleCustomer(delay = CUSTOMER_ARRIVAL_DELAY_MS) {
  if (customerSpawnTimer) clearGameplayTimeout(customerSpawnTimer);
  customerSpawnTimer = null;
  if (tutorialNeedsCompletion() || !isServingDay() || state.gamePaused || state.customers.length >= MAX_WAITING_CUSTOMERS) return;
  customerSpawnTimer = setGameplayTimeout(() => {
    customerSpawnTimer = null;
    if (tutorialNeedsCompletion() || !isServingDay() || state.gamePaused || state.customers.length >= MAX_WAITING_CUSTOMERS) return;
    const isSpecialOrder = shouldSpawnSpecialCustomer();
    const template = isSpecialOrder ? SPECIAL_CUSTOMER_TEMPLATE : nextCustomerTemplate();
    const orderItems = createCustomerOrder(template);
    const specialBonus = isSpecialOrder ? specialOrderBonusFor(orderItems) : 0;
    const customer = {
      ...template,
      id: `${state.customerSerial}-${Date.now()}`,
      orderItems,
      specialOrder: isSpecialOrder,
      specialBonus,
      price: customerOrderPrice({ ...template, specialOrder: isSpecialOrder, specialBonus }, orderItems),
      arrivedAt: gameplayNow(),
      served: false,
      leaving: false,
      day: state.day,
      dayResolved: false,
    };
    state.customerSerial += 1;
    if (isSpecialOrder) state.specialOrderDay = state.day;
    state.customers.push(customer);
    customerLeaveTimers.set(customer.id, setGameplayTimeout(() => customerLeaves(customer.id), customerWaitDuration(customer)));
    playSound('customerIn');
    setMessage(template.customerType === 'beggar'
      ? '逃单客出现了，点击他可以驱逐。'
      : isSpecialOrder
        ? `特别订单来了，完成${orderSummary(orderItems)}可额外获得 ¥${specialBonus}。`
      : `有客人来了，想要${orderSummary(orderItems)}。`);
    render();
    scheduleSave();
    scheduleCustomer();
  }, delay);
}

function restoreSavedCustomerTimers() {
  if (!isServingDay() || state.gamePaused) return;
  state.customers.forEach((customer) => {
    if (customer.tutorial || customer.served || customer.leaving || customerLeaveTimers.has(customer.id)) return;
    const remaining = Math.max(0, customerWaitDuration(customer) - (gameplayNow() - customer.arrivedAt));
    customerLeaveTimers.set(customer.id, setGameplayTimeout(() => customerLeaves(customer.id), remaining));
  });
}

function customerLeaves(customerId) {
  const customer = state.customers.find((waitingCustomer) => waitingCustomer.id === customerId);
  customerLeaveTimers.delete(customerId);
  if (!customer || customer.served || customer.leaving || state.gamePaused) return;
  resolveDayCustomer(customer);
  playSound('customerOut');
  setMessage('有位客人等太久离开了。');
  fadeOutCustomer(customer);
}

function evictBeggar(customerId) {
  const customer = state.customers.find((waitingCustomer) => waitingCustomer.id === customerId);
  if (!customer || customer.customerType !== 'beggar' || customer.served || customer.leaving || state.gamePaused || !isServingDay() || customerExitTimers.has(customer.id)) return false;

  const leaveTimer = customerLeaveTimers.get(customer.id);
  if (leaveTimer) clearGameplayTimeout(leaveTimer);
  customerLeaveTimers.delete(customer.id);
  resolveDayCustomer(customer);
  playSound('customerOut');
  setMessage('已驱逐逃单客。');
  fadeOutCustomer(customer);
  scheduleSave();
  return true;
}

function canContinueCurrentDay() {
  return state.dayPhase === 'settlement'
    && state.dayEndedEarly
    && state.dayTimeRemainingMs > 0;
}

function resumeShop() {
  if (state.dayPhase !== 'settlement') return;
  const continuingCurrentDay = canContinueCurrentDay();
  clearCustomerTimers();
  if (!continuingCurrentDay) {
    state.day += 1;
    state.dayCustomersFinished = 0;
    state.dayCustomersServed = 0;
    state.dayIncome = 0;
    state.dayTimeRemainingMs = dayDurationForDay(state.day);
    state.specialOrderDay = 0;
  }
  state.dayPhase = 'service';
  state.dayTimerStarted = false;
  state.dayTimerStartedAt = 0;
  state.dayEndedEarly = false;
  state.daySummaryOpen = false;
  daySummaryTransitioning = false;
  state.shopOpen = true;
  state.shopPanelOpen = false;
  state.sashimiPickerOpen = false;
  playSound('dayStart');
  setMessage(continuingCurrentDay ? `继续第 ${state.day} 天营业。` : `第 ${state.day} 天开始营业。`);
  render();
  startDayClock();
  scheduleCustomer(550);
  scheduleSave();
}

function goFishing() {
  if (state.gamePaused || fishingTransitioning) return;
  if (state.dayPhase !== 'settlement') {
    setMessage('本日结算后，再去海边钓鱼补货。');
    return;
  }
  if (hasUnsettledSaveState()) {
    setMessage('先等手上的食材处理完成，再带着鱼篓出门。');
    return;
  }
  if (!saveGame()) {
    // A newer tab may own the save. Refresh that authoritative state instead
    // of leaving a visible button that cannot complete its scene switch.
    syncExternalSave();
    setMessage('进度还在保存，等一下再去钓鱼。');
    return;
  }
  fishingTransitioning = true;
  goFishingButton.disabled = true;
  goFishingButton.setAttribute('aria-busy', 'true');
  stage.classList.add('is-entering-fishing');
  const loadingText = exitLoadingOverlay.querySelector('span');
  if (loadingText) loadingText.textContent = '前往海边';
  exitLoadingOverlay.setAttribute('aria-label', '正在前往海边');
  exitLoadingOverlay.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => window.location.assign('./?scene=fishing'), motionDuration(420));
}

function pauseGame() {
  if (state.gamePaused) return;
  clearIngredientDrag();
  stopCustomerPatienceLoop();
  stopDayClockLoop();
  state.activeCut = null;
  state.activeShrimpCut = null;
  state.pauseSettingsOpen = false;
  pauseOverlayClosing = false;
  pauseStartedAt = performance.now();
  state.gamePaused = true;
  pauseGameplayTimeouts();
  setMessage('游戏已暂停。');
  render();
  window.requestAnimationFrame(() => resumeGameButton.focus());
}

function resumeGame() {
  if (!state.gamePaused) return;
  accumulatedPausedTime += performance.now() - pauseStartedAt;
  pauseStartedAt = 0;
  state.gamePaused = false;
  state.pauseSettingsOpen = false;
  pauseOverlayClosing = true;
  gamePauseOverlay.setAttribute('aria-hidden', 'true');
  closeModal(gamePauseOverlay, 220, () => {
    pauseOverlayClosing = false;
  });
  resumeGameplayTimeouts();
  setMessage('继续游戏。');
  render();
  ensureCustomerPatienceLoop();
  ensureDayClockLoop();
  window.requestAnimationFrame(() => gamePauseButton.focus());
}

function toggleGamePause() {
  if (state.gamePaused) resumeGame();
  else pauseGame();
}

function openGameSettings() {
  if (!state.gamePaused) return;
  state.pauseSettingsOpen = true;
  playSound('ui');
  render();
  window.requestAnimationFrame(() => soundSettingButton.focus());
}

function closeGameSettings() {
  if (!state.gamePaused) return;
  state.pauseSettingsOpen = false;
  playSound('ui');
  render();
  window.requestAnimationFrame(() => openGameSettingsButton.focus());
}

function toggleSoundEffects() {
  gameSettings.soundEnabled = !gameSettings.soundEnabled;
  saveGameSettings();
  if (gameSettings.soundEnabled) playSound('ui');
  render();
}

function updateSoundVolume(event) {
  gameSettings.soundVolume = normalizedSoundVolume(Number(event.currentTarget.value) / 100);
  saveGameSettings();
  render();
}

function exitGame() {
  if (!state.gamePaused || stage.classList.contains('is-exiting-game')) return;
  exitGameButton.disabled = true;
  exitGameButton.setAttribute('aria-busy', 'true');
  saveGame();
  stage.classList.add('is-exiting-game');
  exitLoadingOverlay.setAttribute('aria-hidden', 'false');
  const exitDelay = 900;
  window.setTimeout(() => window.location.assign('./?returning=1'), exitDelay);
}

function blockPausedGameInput(event) {
  if ((!state.gamePaused && !pauseOverlayClosing) || event.target.closest?.('#game-pause-overlay')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function blockShopPanelInput(event) {
  const shopEvent = event.target instanceof Node && ingredientShopPanel.contains(event.target);
  if ((!state.shopPanelOpen && !shopPanelClosing) || shopEvent) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function blockSettledDayInput(event) {
  if (state.dayPhase !== 'settlement') return;
  if (daySummaryTransitioning) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  const target = event.target instanceof Node ? event.target : null;
  const allowed = target?.closest('#day-summary-overlay, #settlement-actions, #ingredient-shop-panel, #game-pause-button, #game-pause-overlay');
  if (allowed) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function trapShopPanelFocus(event) {
  if (!state.shopPanelOpen || event.key !== 'Tab') return;
  const focusable = Array.from(ingredientShopPanel.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'))
    .filter((element) => !element.classList.contains('is-hidden'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function blockTutorialWelcomeInput(event) {
  const tutorialEvent = event.target instanceof Node && tutorialGuide.contains(event.target);
  if (!tutorialNeedsCompletion() || state.tutorialStarted || tutorialEvent) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

stage.addEventListener('pointerdown', blockPausedGameInput, true);
stage.addEventListener('click', blockPausedGameInput, true);
stage.addEventListener('keydown', blockPausedGameInput, true);
stage.addEventListener('pointerdown', blockShopPanelInput, true);
stage.addEventListener('click', blockShopPanelInput, true);
stage.addEventListener('keydown', blockShopPanelInput, true);
stage.addEventListener('pointerdown', blockSettledDayInput, true);
stage.addEventListener('click', blockSettledDayInput, true);
stage.addEventListener('keydown', blockSettledDayInput, true);
window.addEventListener('pointerdown', blockTutorialWelcomeInput, true);
window.addEventListener('keydown', blockTutorialWelcomeInput, true);
window.addEventListener('keydown', trapShopPanelFocus, true);

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  if (daySummaryTransitioning || shopPanelClosing || pauseOverlayClosing) return;
  if (state.daySummaryOpen) {
    dismissDaySummary();
    return;
  }
  if (state.shopPanelOpen) {
    closeIngredientShop();
    return;
  }
  toggleGamePause();
}, true);

function playSushiMakingAnimation(ingredientId) {
  const stageRect = stage.getBoundingClientRect();
  const stationRect = assemblyStation.getBoundingClientRect();
  const width = Math.max(38, stationRect.width * 0.38);
  const height = Math.max(34, stationRect.height * 0.43);
  const centerX = stationRect.left - stageRect.left + (stationRect.width * 0.56);
  const centerY = stationRect.top - stageRect.top + (stationRect.height * 0.48);
  const maker = document.createElement('div');
  const rice = document.createElement('img');
  const topping = document.createElement('img');

  maker.className = 'sushi-making-animation';
  maker.setAttribute('aria-hidden', 'true');
  maker.style.left = `${centerX}px`;
  maker.style.top = `${centerY}px`;
  maker.style.width = `${width}px`;
  maker.style.height = `${height}px`;

  rice.className = 'sushi-making-rice';
  rice.src = `${KITCHEN_ASSET_PATH}rice-portion-vivid-v1.png`;
  rice.alt = '';
  topping.className = 'sushi-making-topping';
  topping.src = sushiAsset(ingredientId, 'slice');
  topping.alt = '';
  maker.append(rice, topping);
  stage.append(maker);
  requestAnimationFrame(() => maker.classList.add('is-making'));

  return {
    maker,
    sourceRect: {
      left: stageRect.left + centerX - (width / 2),
      top: stageRect.top + centerY - (height / 2),
      width,
      height,
    },
  };
}

function makeSushi(ingredientId = 'salmon') {
  if (state.gamePaused) return;
  const sushiType = sushiTypeFor(ingredientId);
  const finishedDishName = dishDisplayName(sushiType);
  if (state.incomingSlices) {
    setMessage('等鱼片滑到旁边再制作寿司。');
    return;
  }
  if (state.incomingRice) {
    setMessage('等米饭滑进米饭架再制作寿司。');
    return;
  }
  if (!state.riceStored) {
    setMessage('先点击饭盒拿一团米饭。');
    return;
  }
  if (state.sushiStored >= storageCapacityFor('sushi')) {
    setMessage('寿司架满了，先出餐再继续制作。');
    return;
  }
  const sliceIndex = state.sliceTypes.indexOf(sushiType.id);
  if (sliceIndex === -1) {
    setMessage(`找不到可用的${sushiType.name}片。`);
    return;
  }
  state.sliceTypes.splice(sliceIndex, 1);
  state.slicesReady -= 1;
  state.riceStored -= 1;
  state.sushiStored += 1;
  state.incomingSushi += 1;
  state.sushiTypes.push(sushiType.id);
  const targetRect = sushiRack.getBoundingClientRect();
  const targetIndex = state.sushiStored - 1;
  const animationVersion = state.flightVersion;
  const sushiGrid = storageGridFor('sushi');
  const makingSushi = playSushiMakingAnimation(sushiType.id);
  playSound('sushi');
  setMessage(`正在制作${finishedDishName}。`);
  render();
  setGameplayTimeout(() => {
    makingSushi.maker.remove();
    if (animationVersion !== state.flightVersion) return;
    flyCompletedItem({
      className: 'sushi',
      src: sushiAsset(sushiType.id, 'nigiri'),
      sourceRect: makingSushi.sourceRect,
      targetRect,
      targetIndex,
      columns: sushiGrid.columns,
      rows: sushiGrid.rows,
      gap: 0.04,
      displayScale: 1.12,
      onFinish: () => {
        state.incomingSushi = Math.max(0, state.incomingSushi - 1);
        setMessage(`${finishedDishName}做好了，已放进寿司架。`);
        render();
        if (!state.incomingSushi) scheduleSave();
      },
    });
  }, motionDuration(420));
}

function platterDishIdFor(ingredients) {
  if (ingredients.length !== 3) return null;
  const uniqueIngredients = [...new Set(ingredients)];
  if (uniqueIngredients.length === 1) return `platter-${uniqueIngredients[0]}`;
  return uniqueIngredients.length === 3 ? 'platter-mixed' : null;
}

function platterNextSliceAllowed(ingredientId) {
  if (!PLATTER_FISH_IDS.includes(ingredientId)) return false;
  const current = state.platterAssembly;
  if (current.length < 2) return true;
  const unique = [...new Set(current)];
  if (unique.length === 1) return ingredientId === unique[0];
  return !unique.includes(ingredientId);
}

function platterRuleMessage(ingredientId) {
  if (!PLATTER_FISH_IDS.includes(ingredientId)) return '刺身拼盘只能使用三文鱼、金枪鱼、甜虾、鲭鱼或真鲷鱼片。';
  const unique = [...new Set(state.platterAssembly)];
  if (state.platterAssembly.length === 2 && unique.length === 1) return `这盘已经是${sushiName(unique[0])}拼盘，再放一片相同鱼片就能完成。`;
  if (state.platterAssembly.length === 2) return '精选三拼的最后一片要换成第三种不同的鱼。';
  return '把鱼片拖进盘子。三片同种鱼会做成单品拼盘，三种不同鱼会做成精选三拼。';
}

function renderPlatterStation() {
  const platterUnlocked = isRecipeUnlocked('sashimi-platter');
  show(platterStation, platterUnlocked);
  platterStation.classList.toggle('is-building', platterUnlocked && state.platterAssembly.length > 0);
  platterStation.classList.toggle('is-making', state.platterMaking);
  platterStation.setAttribute('aria-label', state.platterAssembly.length
    ? `刺身拼盘盘子，已放入 ${state.platterAssembly.length} / 3 片鱼。${platterRuleMessage(state.platterAssembly.at(-1))}`
    : '刺身拼盘盘子，拖入三片同种鱼或三种不同鱼片制作拼盘');
  platterSlicePreview.replaceChildren();
  state.platterAssembly.forEach((ingredientId) => {
    const image = document.createElement('img');
    image.src = sushiAsset(ingredientId, 'slice');
    image.alt = '';
    image.draggable = false;
    platterSlicePreview.append(image);
  });
}

function addSliceToPlatter(ingredientId) {
  if (!isRecipeUnlocked('sashimi-platter')) {
    setMessage('先在采购商店购买刺身拼盘盘具。');
    render();
    return false;
  }
  if (state.platterMaking) {
    setMessage('这盘刺身正在滑进寿司架，稍等一下。');
    return false;
  }
  if (!platterNextSliceAllowed(ingredientId)) {
    setMessage(platterRuleMessage(ingredientId));
    render();
    return false;
  }
  if (state.platterAssembly.length >= 3) {
    setMessage('盘子已经满了。');
    return false;
  }
  const sliceIndex = state.sliceTypes.indexOf(ingredientId);
  if (sliceIndex === -1) {
    setMessage('这片鱼已经不在鱼片架里了。');
    render();
    return false;
  }
  const nextAssembly = [...state.platterAssembly, ingredientId];
  const completedDishId = platterDishIdFor(nextAssembly);
  if (nextAssembly.length === 3 && !completedDishId) {
    setMessage('一盘刺身只能是三片同种鱼，或刚好三种不同鱼。');
    render();
    return false;
  }
  if (completedDishId && state.sushiStored >= storageCapacityFor('sushi')) {
    setMessage('寿司架满了，先出餐再完成刺身拼盘。');
    return false;
  }

  state.sliceTypes.splice(sliceIndex, 1);
  state.slicesReady = state.sliceTypes.length;
  state.platterAssembly = nextAssembly;
  playSound('place');

  if (!completedDishId) {
    setMessage(`已放入第 ${nextAssembly.length} 片${sushiName(ingredientId)}。${platterRuleMessage(ingredientId)}`);
    render();
    scheduleSave();
    return true;
  }

  const platterDish = dishFor(completedDishId);
  const sourceRect = platterStation.getBoundingClientRect();
  const targetRect = sushiRack.getBoundingClientRect();
  const targetIndex = state.sushiStored;
  const sushiGrid = storageGridFor('sushi');
  const assemblyVersion = state.flightVersion;
  state.sushiStored += 1;
  state.incomingSushi += 1;
  state.sushiTypes.push(completedDishId);
  state.platterMaking = true;
  playStationMotion(platterStation, 'is-making', motionDuration(520));
  playSound('sushi');
  setMessage(`正在摆好${platterDish.name}。`);
  render();
  setGameplayTimeout(() => {
    if (assemblyVersion !== state.flightVersion) return;
    flyCompletedItem({
      className: 'sushi',
      src: dishAsset(completedDishId, 'nigiri'),
      sourceRect,
      targetRect,
      targetIndex,
      columns: sushiGrid.columns,
      rows: sushiGrid.rows,
      gap: 0.04,
      displayScale: 1.16,
      onFinish: () => {
        state.incomingSushi = Math.max(0, state.incomingSushi - 1);
        state.platterAssembly = [];
        state.platterMaking = false;
        setMessage(`${platterDish.name}做好了，已放进寿司架。`);
        render();
        if (!state.incomingSushi) scheduleSave();
      },
    });
  }, motionDuration(160));
  return true;
}

function renderSlices() {
  const displayedTypes = state.sliceTypes.slice(0, Math.max(0, state.sliceTypes.length - state.incomingSlices));
  const existingItems = Array.from(sliceRack.children);
  existingItems.slice(displayedTypes.length).forEach((item) => item.remove());

  displayedTypes.forEach((ingredientId, index) => {
    const sushiType = sushiTypeFor(ingredientId);
    let slice = existingItems[index];
    if (!slice) {
      slice = document.createElement('button');
      const sliceImage = document.createElement('img');
      slice.type = 'button';
      slice.className = 'sushi-slice-crop';
      sliceImage.alt = '';
      sliceImage.draggable = false;
      slice.addEventListener('pointerdown', prepareSliceDrag);
      slice.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        makeSushi(slice.dataset.ingredientId);
      });
      slice.append(sliceImage);
      sliceRack.append(slice);
    }

    const sliceImage = slice.querySelector('img');
    slice.dataset.ingredientId = sushiType.id;
    slice.setAttribute('aria-label', `第 ${index + 1} 片${sushiType.name}，拖到米饭上制作寿司`);
    const nextSource = sushiAsset(sushiType.id, 'slice');
    if (sliceImage.getAttribute('src') !== nextSource) sliceImage.src = nextSource;
  });
}

function renderSushiRack() {
  const displayedTypes = state.sushiTypes.slice(0, Math.max(0, state.sushiTypes.length - state.incomingSushi));
  const existingItems = Array.from(sushiRack.children);
  existingItems.slice(displayedTypes.length).forEach((item) => item.remove());

  displayedTypes.forEach((ingredientId, index) => {
    const sushiType = dishFor(ingredientId);
    let item = existingItems[index];
    if (!item) {
      item = document.createElement('button');
      item.type = 'button';
      item.className = 'stored-sushi stored-sushi-button';
      item.addEventListener('pointerdown', prepareSushiServeDrag);
      item.append(document.createElement('img'));
      sushiRack.append(item);
    }
    const image = item.querySelector('img');
    item.dataset.ingredientId = sushiType.id;
    item.setAttribute('aria-label', `第 ${index + 1} 份${dishDisplayName(sushiType)}，拖给顾客或垃圾桶`);
    const nextSource = dishAsset(sushiType.id, 'nigiri');
    if (image.getAttribute('src') !== nextSource) image.src = nextSource;
    image.alt = dishDisplayName(sushiType);
    image.draggable = false;
  });
}

function renderStockRack(rack, count, className, src, alt, onPointerDown = null, dragInstruction = '拖给顾客') {
  const visibleCount = Math.max(0, count);
  const existingItems = Array.from(rack.children);
  existingItems.slice(visibleCount).forEach((item) => item.remove());

  for (let index = 0; index < visibleCount; index += 1) {
    if (existingItems[index]) continue;
    const item = document.createElement(onPointerDown ? 'button' : 'img');
    item.className = onPointerDown ? `${className} stored-sushi-button` : className;
    if (onPointerDown) {
      const image = document.createElement('img');
      item.type = 'button';
      item.setAttribute('aria-label', `第 ${index + 1} 份${alt}，${dragInstruction}`);
      image.src = src;
      image.alt = alt;
      image.draggable = false;
      item.addEventListener('pointerdown', onPointerDown);
      item.append(image);
    } else {
      item.src = src;
      item.alt = alt;
      item.draggable = false;
    }
    rack.append(item);
  }
}

function renderDrinks() {
  const displayedTypes = state.drinkTypes.slice(0, Math.max(0, state.drinkTypes.length - state.incomingDrinks));
  const existingDrinks = Array.from(drinkRack.children);
  existingDrinks.slice(displayedTypes.length).forEach((drink) => drink.remove());
  displayedTypes.forEach((drinkId, index) => {
    const drinkType = drinkFor(drinkId);
    const drink = existingDrinks[index] ?? document.createElement('button');
    const image = drink.querySelector('img') ?? document.createElement('img');
    drink.type = 'button';
    drink.className = 'stored-drink stored-sushi-button';
    drink.dataset.drinkId = drinkType.id;
    drink.setAttribute('aria-label', `第 ${index + 1} 杯${drinkType.name}，拖给顾客或垃圾桶`);
    if (!drink.isConnected) drink.addEventListener('pointerdown', prepareDrinkServeDrag);
    const source = drinkAsset(drinkType.id);
    if (image.getAttribute('src') !== source) image.src = source;
    image.alt = `一杯${drinkType.name}`;
    image.draggable = false;
    if (!image.isConnected) drink.append(image);
    if (drinkRack.children[index] !== drink) drinkRack.append(drink);
  });
}

function renderDrinkPicker() {
  const choices = unlockedDrinkTypes();
  const visible = Boolean(
    state.drinkPickerOpen
    && state.cupOnMachine
    && !state.drinkPouring
    && !state.gamePaused
    && choices.length > 1,
  );
  if (!visible) state.drinkPickerOpen = false;
  show(drinkPicker, visible);
  drinkPicker.setAttribute('aria-hidden', String(!visible));
  if (!visible) {
    drinkPicker.dataset.signature = '';
    return;
  }

  const signature = choices.map((drink) => drink.id).join('|');
  if (drinkPicker.dataset.signature === signature) return;
  drinkPicker.dataset.signature = signature;
  drinkPicker.replaceChildren();
  choices.forEach((drink) => {
    const choice = document.createElement('button');
    const image = document.createElement('img');
    const name = document.createElement('span');
    choice.type = 'button';
    choice.className = 'drink-choice';
    choice.dataset.drinkId = drink.id;
    choice.setAttribute('aria-label', `制作${drink.name}`);
    choice.title = `制作${drink.name} · ¥${drink.price}`;
    image.src = drinkAsset(drink.id);
    image.alt = drink.name;
    image.draggable = false;
    name.textContent = drink.name;
    choice.append(image, name);
    choice.addEventListener('click', () => startDrinkProduction(drink.id));
    drinkPicker.append(choice);
  });
}

function renderSashimiChoices() {
  sashimiChoices.forEach((choice) => {
    const ingredientId = choice.dataset.ingredientId;
    const sushiType = sushiTypeFor(ingredientId);
    const unlocked = isSushiTypeUnlocked(sushiType);
    const stocked = hasRawFish(ingredientId);
    const stockLabel = choice.querySelector('[data-fish-stock]');
    show(choice, unlocked);
    choice.disabled = !unlocked || !stocked;
    choice.classList.toggle('is-out-of-stock', unlocked && !stocked);
    if (stockLabel && needsFishing(ingredientId)) stockLabel.textContent = `库存 ${rawFishCount(ingredientId)}`;
    choice.title = unlocked
      ? stocked
        ? needsFishing(ingredientId) ? `鱼篓库存：${rawFishCount(ingredientId)}` : `${sushiType.name}配方已解锁，可无限制作`
        : `库存为 0，今天结算后去钓鱼获得${sushiName(ingredientId)}`
      : sushiType.requiresRecipe && !isRecipeUnlocked(sushiType.requiresRecipe)
        ? `先购买${recipeName(sushiType.requiresRecipe)}`
        : sushiType.recipeId
          ? `先购买${recipeName(sushiType.recipeId)}`
          : '先在食材商店购买这个鱼种';
  });
}

function shopPreviewAsset(ingredientId) {
  const shopItem = shopItemFor(ingredientId);
  if (shopItem?.asset) return `${KITCHEN_ASSET_PATH}${shopItem.asset}`;
  return ingredientId === 'shrimp'
    ? `${KITCHEN_ASSET_PATH}shrimp-whole-vivid-v1.png`
    : sushiAsset(ingredientId, 'loin');
}

function storageUpgradePreviewAsset(upgrade) {
  return `${KITCHEN_ASSET_PATH}${upgrade.asset}`;
}

function decorationThemeAsset(themeOrId) {
  const theme = typeof themeOrId === 'string' ? decorationThemeFor(themeOrId) : themeOrId;
  return `${KITCHEN_ASSET_PATH}${theme.background}`;
}

function decorationThemeIsUnlocked(themeId) {
  return state.unlockedDecorations.includes(themeId);
}

function renderDecorationThemes() {
  decorationThemeItems.replaceChildren();

  DECORATION_THEMES.forEach((theme) => {
    const unlocked = decorationThemeIsUnlocked(theme.id);
    const active = state.activeDecoration === theme.id;
    const affordable = state.cash >= theme.price;
    const item = document.createElement('article');
    const image = document.createElement('img');
    const detail = document.createElement('div');
    const name = document.createElement('b');
    const description = document.createElement('span');
    const button = document.createElement('button');

    item.className = `decoration-theme-card${unlocked ? ' is-owned' : ''}${active ? ' is-active' : ''}`;
    image.src = decorationThemeAsset(theme);
    image.alt = theme.name;
    image.draggable = false;
    name.textContent = theme.name;
    description.textContent = unlocked
      ? active ? '正在使用' : '已拥有，结算时可切换'
      : `${theme.description} · ¥${theme.price}`;
    detail.append(name, description);

    button.type = 'button';
    button.disabled = active || (!unlocked && !affordable);
    button.textContent = active
      ? '正在使用'
      : unlocked
        ? '使用主题'
        : affordable
          ? `购买 ¥${theme.price}`
          : `余额不足 ¥${theme.price}`;
    button.title = active
      ? `${theme.name}正在使用`
      : unlocked
        ? `切换为${theme.name}`
        : affordable
          ? `购买并使用${theme.name}`
          : `余额不足，还差 ¥${theme.price - state.cash}`;
    button.addEventListener('click', () => buyOrSelectDecoration(theme.id));
    detail.append(button);
    item.append(image, detail);
    decorationThemeItems.append(item);
  });
}

function renderStorageUpgrades() {
  storageUpgradeItems.replaceChildren();

  STORAGE_UPGRADES.forEach((upgrade) => {
    const level = storageLevelFor(upgrade.id);
    const values = storageUpgradeValues(upgrade);
    const currentValue = storageUpgradeValue(upgrade);
    const maxed = storageUpgradeIsMaxed(upgrade);
    const nextValue = maxed ? currentValue : values[level + 1];
    const nextPrice = maxed ? null : upgrade.prices[level];
    const unmetRequirements = unmetPurchaseRequirementNames(upgrade);
    const prerequisiteMet = unmetRequirements.length === 0;
    const canAfford = !maxed && state.cash >= nextPrice;
    const actionLabel = upgrade.durations ? '提速' : '升级';
    const item = document.createElement('article');
    const image = document.createElement('img');
    const detail = document.createElement('div');
    const name = document.createElement('b');
    const price = document.createElement('span');
    const button = document.createElement('button');

    item.className = `ingredient-shop-item storage-upgrade-item${level ? ' is-owned' : ''}${maxed ? ' is-maxed' : ''}${prerequisiteMet ? '' : ' is-locked'}`;
    image.src = storageUpgradePreviewAsset(upgrade);
    image.alt = upgrade.name;
    image.draggable = false;
    name.textContent = upgrade.name;
    price.textContent = maxed
      ? `已升级至 ${storageUpgradeValueLabel(upgrade, currentValue)}`
      : `${storageUpgradeValueLabel(upgrade, currentValue)} → ${storageUpgradeValueLabel(upgrade, nextValue)} · 第${level + 1}/${upgrade.prices.length}次 · ¥${nextPrice}`;
    detail.append(name);
    appendPurchaseRequirement(detail, upgrade);
    detail.append(price);

    button.type = 'button';
    button.disabled = maxed || !prerequisiteMet || !canAfford;
    button.textContent = maxed
      ? '已扩到最大'
      : !prerequisiteMet
        ? `需要：${unmetRequirements.join('、')}`
        : canAfford
          ? `${actionLabel} ¥${nextPrice}`
          : `余额不足 ¥${nextPrice}`;
    button.title = maxed
      ? `${upgrade.name}已扩到最大`
      : !prerequisiteMet
        ? `先购买${unmetRequirements.join('、')}，才能${actionLabel}`
        : canAfford
          ? `第 ${level + 1}/${upgrade.prices.length} 次：把${upgrade.name}从 ${storageUpgradeValueLabel(upgrade, currentValue)}提升到 ${storageUpgradeValueLabel(upgrade, nextValue)}`
          : `余额不足，还差 ¥${nextPrice - state.cash}`;
    button.addEventListener('click', () => buyStorageUpgrade(upgrade.id));
    item.append(image, detail, button);
    storageUpgradeItems.append(item);
  });
}

function renderIngredientShop() {
  const canUseShop = state.dayPhase === 'settlement' && !state.gamePaused && !tutorialNeedsCompletion();
  if (!canUseShop) state.shopPanelOpen = false;
  const isOpen = state.shopPanelOpen && canUseShop;
  setModalVisibility(ingredientShopPanel, isOpen, 230);
  show(ingredientShopToggle, canUseShop);
  ingredientShopToggle.setAttribute('aria-expanded', String(isOpen));
  ingredientShopPanel.setAttribute('aria-hidden', String(!isOpen));
  ingredientShopCash.textContent = `¥${state.cash}`;
  if (!isOpen) {
    shopRenderSignature = '';
    return;
  }

  const nextSignature = [
    state.day,
    state.cash,
    state.activeDecoration,
    state.unlockedDecorations.join(','),
    state.unlockedDrinks.join(','),
    state.unlockedIngredients.join(','),
    state.unlockedRecipes.join(','),
    ...STORAGE_UPGRADES.map((upgrade) => storageLevelFor(upgrade.id)),
  ].join('|');
  if (nextSignature === shopRenderSignature) return;
  shopRenderSignature = nextSignature;
  ingredientShopItems.replaceChildren();

  SHOP_ITEMS.forEach((shopItem) => {
    const itemName = shopItemName(shopItem);
    const unlocked = isShopItemUnlocked(shopItem);
    const available = isShopItemAvailable(shopItem);
    const unlockDay = shopItemUnlockDay(shopItem);
    const isFish = needsFishing(shopItem.id);
    const unmetRequirements = unmetPurchaseRequirementNames(shopItem);
    const prerequisiteMet = unmetRequirements.length === 0;
    const canAfford = state.cash >= shopItem.price;
    const item = document.createElement('article');
    const image = document.createElement('img');
    const detail = document.createElement('div');
    const name = document.createElement('b');
    const price = document.createElement('span');
    const button = document.createElement('button');

    item.className = `ingredient-shop-item${unlocked ? ' is-owned' : ''}${available && prerequisiteMet ? '' : ' is-locked'}`;
    image.src = shopPreviewAsset(shopItem.id);
    image.alt = itemName;
    image.draggable = false;
    name.textContent = itemName;
    price.textContent = unlocked
      ? isFish ? '已解锁 · 去钓鱼' : '已购买'
      : !available ? `第 ${unlockDay} 天解锁`
        : `¥${shopItem.price}`;
    detail.append(name);
    appendPurchaseRequirement(detail, shopItem);
    detail.append(price);

    button.type = 'button';
    button.disabled = unlocked || !available || !prerequisiteMet || !canAfford;
    button.textContent = unlocked
      ? isFish ? '钓点已开放' : '已购买'
      : !available
        ? `第 ${unlockDay} 天解锁`
        : !prerequisiteMet
        ? `需要：${unmetRequirements.join('、')}`
        : canAfford
        ? `购买 ¥${shopItem.price}`
        : `余额不足 ¥${shopItem.price}`;
    button.title = unlocked
      ? isFish ? '已解锁：每天结算后可以去钓鱼获得' : '这个项目已经解锁'
      : !available
        ? `第 ${unlockDay} 天起可以购买${itemName}`
        : !prerequisiteMet
          ? `前置物品：${unmetRequirements.join('、')}`
        : canAfford ? `购买${itemName}` : `余额不足，还差 ¥${shopItem.price - state.cash}`;
    button.addEventListener('click', () => buyIngredient(shopItem.id));
    item.append(image, detail, button);
    ingredientShopItems.append(item);
  });

  renderStorageUpgrades();
  renderDecorationThemes();
}

function renderDaySummary() {
  const showSummary = state.dayPhase === 'settlement' && state.daySummaryOpen;
  if (showSummary) openModal(daySummaryOverlay);
  else if (!daySummaryTransitioning) closeModal(daySummaryOverlay, 230);
  daySummaryOverlay.setAttribute('aria-hidden', String(!showSummary));
  daySummaryTitle.textContent = '今天结束';
}

function dismissDaySummary() {
  if (!state.daySummaryOpen) return;
  state.daySummaryOpen = false;
  daySummaryTransitioning = true;
  daySummaryOverlay.setAttribute('aria-hidden', 'true');
  closeModal(daySummaryOverlay, 230, () => {
    daySummaryTransitioning = false;
    render();
    window.requestAnimationFrame(() => ingredientShopToggle.focus());
  });
  render();
}

function toggleIngredientShop() {
  if (state.gamePaused || shopPanelClosing) return;
  if (state.shopPanelOpen) {
    closeIngredientShop();
    return;
  }
  if (tutorialNeedsCompletion()) {
    setMessage('完成或跳过新手教程后，再去采购。');
    return;
  }
  if (state.dayPhase !== 'settlement') {
    setMessage('本日结算后，再去采购食材。');
    return;
  }
  state.shopPanelOpen = true;
  playSound('ui');
  render();
  window.requestAnimationFrame(() => ingredientShopClose.focus());
}

function closeIngredientShop() {
  if (!state.shopPanelOpen || shopPanelClosing) return;
  state.shopPanelOpen = false;
  shopPanelClosing = true;
  playSound('ui');
  ingredientShopPanel.setAttribute('aria-hidden', 'true');
  closeModal(ingredientShopPanel, 230, () => {
    shopPanelClosing = false;
    render();
    window.requestAnimationFrame(() => ingredientShopToggle.focus());
  });
  render();
}

function buyIngredient(ingredientId) {
  if (state.gamePaused || state.dayPhase !== 'settlement') return;
  const shopItem = shopItemFor(ingredientId);
  if (!shopItem || isShopItemUnlocked(shopItem)) return;
  const itemName = shopItemName(shopItem);
  if (!isShopItemAvailable(shopItem)) {
    setMessage(`${itemName}会在第 ${shopItemUnlockDay(shopItem)} 天开放。`);
    render();
    return;
  }
  const unmetRequirements = unmetPurchaseRequirementNames(shopItem);
  if (unmetRequirements.length) {
    setMessage(`需要先购买${unmetRequirements.join('、')}，才能购买${itemName}。`);
    render();
    return;
  }
  if (state.cash < shopItem.price) {
    setMessage(`余额不足，还差 ¥${shopItem.price - state.cash} 才能购买${itemName}。`);
    render();
    return;
  }
  state.cash -= shopItem.price;
  playSound('purchase');
  if (shopItem.kind === 'drink') {
    state.unlockedDrinks = [...new Set([...state.unlockedDrinks, shopItem.drinkId])];
    state.teaUnlocked = isTeaUnlocked();
    setMessage(shopItem.drinkId === 'tea'
      ? '茶饮配方已解锁，饮品机和顾客订单都会出现茶。'
      : `${drinkFor(shopItem.drinkId).name}配方已解锁。把空杯放到饮品机后，就能选择制作它。`);
  } else if (shopItem.kind === 'recipe') {
    state.unlockedRecipes = [...new Set([...state.unlockedRecipes, shopItem.recipeId])];
    const recipeMessages = {
      nori: '紫菜配方已解锁，海胆军舰和鱼籽军舰可以制作了。',
      'uni-gunkan': '海胆军舰配方已解锁，可从冰柜选择海胆食材制作。',
      'roe-gunkan': '鱼籽军舰配方已解锁，可从冰柜选择鱼籽食材制作。',
      'sashimi-platter': '刺身拼盘盘具已放到操作台：三片同种鱼做单品拼盘，三种不同鱼做精选三拼。',
    };
    setMessage(recipeMessages[shopItem.recipeId] ?? `${itemName}已解锁。`);
  } else {
    state.unlockedIngredients = [...state.unlockedIngredients, ingredientId];
    state.fishingFeaturedFish = ingredientId;
    setMessage(`${sushiName(ingredientId)}钓点已开放。它不会直接加入冰柜，每天结算后去钓鱼获得。`);
  }
  // Save the unlock immediately. `goFishing()` also saves before navigation,
  // but this prevents a just-bought fishing spot from disappearing on a fast
  // refresh or an interrupted scene change.
  if (!saveGame()) scheduleSave();
  render();
}

function buyStorageUpgrade(storageId) {
  if (state.gamePaused || state.dayPhase !== 'settlement') return;
  const upgrade = storageUpgradeFor(storageId);
  if (!upgrade || storageUpgradeIsMaxed(upgrade)) return;
  if (upgrade.requiresTea && !isTeaUnlocked()) {
    setMessage('先购买茶饮配方，才能升级饮品机。');
    render();
    return;
  }
  const price = upgrade.prices[storageLevelFor(storageId)];
  if (state.cash < price) {
    setMessage(`余额不足，还差 ¥${price - state.cash} 才能扩容${upgrade.name}。`);
    render();
    return;
  }

  const previousValue = storageUpgradeValue(upgrade);
  const nextLevel = storageLevelFor(storageId) + 1;
  state.cash -= price;
  state.storageLevels = { ...state.storageLevels, [storageId]: nextLevel };
  playSound('purchase');
  setMessage(`${upgrade.name}已升级：${storageUpgradeValueLabel(upgrade, previousValue)} → ${storageUpgradeValueLabel(upgrade, storageUpgradeValue(upgrade))}。`);
  if (!saveGame()) scheduleSave();
  render();
}

function buyOrSelectDecoration(themeId) {
  if (state.gamePaused || state.dayPhase !== 'settlement') return;
  const theme = decorationThemeFor(themeId);
  if (state.activeDecoration === theme.id) return;

  if (!decorationThemeIsUnlocked(theme.id)) {
    if (state.cash < theme.price) {
      setMessage(`余额不足，还差 ¥${theme.price - state.cash} 才能购买${theme.name}。`);
      render();
      return;
    }
    state.cash -= theme.price;
    state.unlockedDecorations = [...new Set([...state.unlockedDecorations, theme.id])];
    playSound('purchase');
    setMessage(`${theme.name}已购入，店铺焕然一新。`);
  } else {
    playSound('ui');
    setMessage(`已切换为${theme.name}。`);
  }

  state.activeDecoration = theme.id;
  if (!saveGame()) scheduleSave();
  render();
}

function renderStorageLayouts() {
  const sliceGrid = storageGridFor('slices');
  const riceGrid = storageGridFor('rice');
  const sushiGrid = storageGridFor('sushi');
  const drinkGrid = storageGridFor('drinks');
  sliceRack.style.setProperty('--slice-columns', String(sliceGrid.columns));
  sliceRack.style.setProperty('--slice-rows', String(sliceGrid.rows));
  riceRack.style.setProperty('--stock-columns', String(riceGrid.columns));
  riceRack.style.setProperty('--stock-rows', String(riceGrid.rows));
  riceRack.dataset.storageLevel = String(storageLevelFor('rice'));
  sushiRack.style.setProperty('--stock-columns', String(sushiGrid.columns));
  sushiRack.style.setProperty('--stock-rows', String(sushiGrid.rows));
  drinkRack.style.setProperty('--drink-columns', String(drinkGrid.columns));
  drinkRack.style.setProperty('--drink-rows', String(drinkGrid.rows));
}

function renderEquipmentAppearance() {
  const equipment = [
    [riceBin, 'rice'],
    [drinkMachine, 'teaMachine'],
    [fishStation, 'freezer'],
  ];
  equipment.forEach(([element, upgradeId]) => {
    if (!element) return;
    const level = storageLevelFor(upgradeId);
    element.dataset.upgradeLevel = String(level);
    element.classList.toggle('is-upgraded', level > 0);
  });

  const rawFishTotal = rawFishStorageTotal();
  const rawFishCapacity = rawFishStorageCapacity();
  const freezerLabel = `冰柜生鱼库存 ${rawFishTotal}/${rawFishCapacity} 份`;
  freezerButton.title = freezerLabel;
  freezerButton.setAttribute('aria-label', `点击冰柜选择刺身，${freezerLabel}`);
  const teaDuration = motionDuration(teaFillDuration());
  machineCup.style.setProperty('--drink-fill-duration', `${teaDuration}ms`);
  drinkMachine.style.setProperty('--drink-fill-duration', `${teaDuration}ms`);
}

function setIconControl(button, label, icon) {
  if (!button) return;
  button.setAttribute('aria-label', label);
  button.title = label;
  if (icon) button.dataset.icon = icon;
}

function renderDecorationScene() {
  const theme = decorationThemeFor(state.activeDecoration);
  const backgroundSource = decorationThemeAsset(theme);
  stage.dataset.decoration = theme.id;
  stage.style.setProperty('--kitchen-background', `url("${backgroundSource}")`);
  sceneBackground.alt = `${theme.name}的海边寿司制作台`;

  if (sceneBackground.getAttribute('src') === backgroundSource) return;
  sceneBackground.classList.add('is-theme-switching');
  const reveal = () => {
    if (sceneBackground.getAttribute('src') === backgroundSource) {
      sceneBackground.classList.remove('is-theme-switching');
    }
  };
  sceneBackground.addEventListener('load', reveal, { once: true });
  sceneBackground.addEventListener('error', reveal, { once: true });
  sceneBackground.src = backgroundSource;
  window.setTimeout(reveal, 560);
}

function renderShrimpBatch() {
  const remainingShrimp = state.shrimpBatch.filter((shrimp) => !shrimp.cut);
  show(shrimpBatch, state.shrimpOnBoard && remainingShrimp.length > 0);
  const remainingIds = new Set(remainingShrimp.map((shrimp) => shrimp.id));
  const existingItems = new Map(Array.from(shrimpBatch.children).map((item) => [item.dataset.shrimpId, item]));
  existingItems.forEach((item, shrimpId) => {
    if (!remainingIds.has(shrimpId)) item.remove();
  });

  remainingShrimp.forEach((shrimp, index) => {
    let item = existingItems.get(shrimp.id);
    if (!item) {
      item = document.createElement('button');
      const image = document.createElement('img');
      const guide = document.createElement('span');
      item.type = 'button';
      item.className = 'shrimp-batch-item';
      image.src = `${KITCHEN_ASSET_PATH}shrimp-whole-vivid-v1.png`;
      image.alt = '带头甜虾';
      image.draggable = false;
      guide.className = 'shrimp-head-cut-guide';
      guide.setAttribute('aria-hidden', 'true');
      item.append(image, guide);
      item.addEventListener('pointerdown', startShrimpCut);
      item.addEventListener('pointermove', moveShrimpCut);
      item.addEventListener('pointerup', cancelShrimpCut);
      item.addEventListener('pointercancel', cancelShrimpCut);
      item.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (hasRoomForShrimp()) finishShrimpPrep(item.dataset.shrimpId, item);
        else setMessage('配料架空间不够，先做几份寿司再处理甜虾。');
      });
    }

    item.dataset.shrimpId = shrimp.id;
    item.setAttribute('aria-label', `第 ${index + 1} 只甜虾，在细虚线处按住后向下滑动去头`);
    item.classList.toggle('is-cutting', state.activeShrimpCut === shrimp.id);
    if (shrimpBatch.children[index] !== item) shrimpBatch.append(item);
  });
}

function renderShrimpHeads() {
  show(shrimpHeadRack, state.shrimpHeads.length > 0);
  const headIds = new Set(state.shrimpHeads.map((head) => head.id));
  const existingItems = new Map(Array.from(shrimpHeadRack.children).map((item) => [item.dataset.shrimpHeadId, item]));
  existingItems.forEach((item, headId) => {
    if (!headIds.has(headId)) item.remove();
  });

  state.shrimpHeads.forEach((head, index) => {
    let item = existingItems.get(head.id);
    if (!item) {
      item = document.createElement('button');
      const image = document.createElement('img');
      item.type = 'button';
      item.className = 'shrimp-head';
      image.src = `${KITCHEN_ASSET_PATH}shrimp-head-vivid-v1.png`;
      image.alt = '待丢弃的虾头';
      image.draggable = false;
      item.append(image);
      item.addEventListener('pointerdown', prepareShrimpHeadDrag);
    }

    item.dataset.shrimpHeadId = head.id;
    item.setAttribute('aria-label', `第 ${index + 1} 个虾头，拖到垃圾桶`);
    if (shrimpHeadRack.children[index] !== item) shrimpHeadRack.append(item);
  });
}

function render() {
  syncTutorialProgress();
  if (maybeEndDayForMissingFish()) return;
  stage.classList.toggle('is-game-paused', state.gamePaused);
  stage.classList.toggle('is-day-settled', state.dayPhase === 'settlement');
  setModalVisibility(gamePauseOverlay, state.gamePaused, 220);
  gamePauseOverlay.setAttribute('aria-hidden', String(!state.gamePaused));
  show(gamePauseMenu, !state.pauseSettingsOpen);
  show(gameSettingsPanel, state.pauseSettingsOpen);
  setIconControl(gamePauseButton, state.gamePaused ? '继续游戏' : '暂停游戏', state.gamePaused ? 'play' : 'pause');
  setIconControl(ingredientShopToggle, '采购商店');
  setIconControl(goFishingButton, '去钓鱼');
  setIconControl(openShopButton, canContinueCurrentDay() ? `继续第 ${state.day} 天` : `开始第 ${state.day + 1} 天`);
  gamePauseButton.setAttribute('aria-pressed', String(state.gamePaused));
  soundSettingButton.textContent = gameSettings.soundEnabled ? '已开启' : '已关闭';
  soundSettingButton.setAttribute('aria-pressed', String(gameSettings.soundEnabled));
  const soundPercent = Math.round(gameSettings.soundVolume * 100);
  soundVolumeSetting.value = String(soundPercent);
  soundVolumeSetting.disabled = !gameSettings.soundEnabled;
  soundVolumeSetting.setAttribute('aria-valuetext', `${soundPercent}%`);
  soundVolumeValue.textContent = `${soundPercent}%`;
  renderDecorationScene();
  const boardSushiType = sushiTypeFor(state.boardIngredientId);
  const servingDay = isServingDay();
  stageName.textContent = servingDay
    ? `第 ${state.day} 天营业`
    : state.dayEndedEarly
      ? `第 ${state.day} 天补货中`
      : `第 ${state.day} 天休息中`;
  dayLabel.textContent = `第 ${state.day} 天`;
  dayStatus.textContent = state.dayPhase === 'settlement'
    ? state.dayEndedEarly ? '补货后继续' : '今日已结束'
    : tutorialNeedsCompletion()
      ? '新手教程'
      : `剩余 ${formatDayTime(dayTimeRemaining())}`;
  cashValue.textContent = `¥${state.cash}`;
  renderStorageLayouts();
  renderEquipmentAppearance();
  freezerButton.classList.toggle('is-active', state.sashimiPickerOpen);
  sashimiPicker.classList.remove('is-picked');
  setModalVisibility(sashimiPicker, state.sashimiPickerOpen, 160);
  renderSashimiChoices();
  renderIngredientShop();
  renderDaySummary();
  show(boardSalmon, state.salmonOnBoard);
  const boardIngredientSource = sushiAsset(boardSushiType.id, 'loin');
  if (boardIngredientImage.getAttribute('src') !== boardIngredientSource) boardIngredientImage.src = boardIngredientSource;
  boardIngredientImage.alt = `待切${boardSushiType.name}`;
  boardSalmon.setAttribute('aria-label', `${boardSushiType.boardName}，在虚线附近按住并向下滑动切片`);
  boardSalmon.classList.toggle('is-cutting', state.activeCut !== null);
  boardSalmon.classList.remove('is-shrimp', 'is-shrimp-cutting');
  const completedCuts = state.cutLines.filter(Boolean).length;
  const croppedLeft = completedCuts ? CUT_LINES[completedCuts - 1] : 0;
  boardSalmon.style.clipPath = state.salmonOnBoard ? `inset(0 0 0 ${croppedLeft * 100}%)` : '';
  boardSalmon.querySelectorAll('.cut-guide').forEach((guide, index) => {
    guide.classList.toggle('is-cut', state.cutLines[index]);
    guide.classList.toggle('is-active', state.activeCut === index);
  });
  renderShrimpBatch();
  renderShrimpHeads();
  trashBin.classList.toggle('is-discarding', state.shrimpHeadDiscarding);
  trashBin.title = '拖入物品丢弃；点击可清空菜板上的食材';
  const showSettlementActions = state.dayPhase === 'settlement'
    && !state.daySummaryOpen
    && !daySummaryTransitioning
    && !shopPanelClosing
    && !fishingTransitioning;
  show(settlementActions, showSettlementActions);
  show(openShopButton, showSettlementActions);
  show(goFishingButton, showSettlementActions);
  settlementActions.setAttribute('aria-label', state.dayEndedEarly ? '补货操作' : '今日结束操作');
  const drinksUnlocked = hasUnlockedDrinks();
  if (!drinksUnlocked && (state.cupOnMachine || state.drinkPouring || state.incomingDrinks)) {
    state.cupOnMachine = false;
    state.drinkPouring = false;
    state.incomingDrinks = 0;
    state.drinkVersion += 1;
    state.machineDrinkId = null;
    state.drinkPickerOpen = false;
  }
  show(drinkMachine, drinksUnlocked);
  show(cupStation, drinksUnlocked);
  show(drinkRack, drinksUnlocked);
  show(machineCup, drinksUnlocked && state.cupOnMachine);
  drinkMachine.setAttribute('aria-hidden', String(!drinksUnlocked));
  cupStation.setAttribute('aria-hidden', String(!drinksUnlocked));
  drinkRack.setAttribute('aria-hidden', String(!drinksUnlocked));
  machineCup.setAttribute('aria-hidden', String(!drinksUnlocked));
  const machineDrink = drinkFor(state.machineDrinkId);
  const machineCupSource = state.drinkPouring
    ? drinkAsset(machineDrink.id)
    : `${KITCHEN_ASSET_PATH}tea-cup-empty-vivid-v1.png`;
  if (machineCup.getAttribute('src') !== machineCupSource) machineCup.src = machineCupSource;
  machineCup.classList.toggle('is-filling', state.drinkPouring);
  drinkMachine.classList.toggle('is-pouring', state.drinkPouring);
  drinkMachine.classList.remove('is-locked');
  cupStation.classList.remove('is-locked');
  drinkMachine.setAttribute('aria-disabled', 'false');
  cupStation.setAttribute('aria-disabled', 'false');
  drinkMachine.title = state.cupOnMachine
    ? state.drinkPouring
      ? `正在接${machineDrink.name}`
      : unlockedDrinkTypes().length > 1 ? '点击选择饮品' : `点击接${unlockedDrinkTypes()[0]?.name ?? '饮品'}`
    : '先放一只空杯';
  cupStation.title = '拖出空杯';
  renderSlices();
  renderStockRack(
    riceRack,
    state.riceStored - state.incomingRice,
    'stored-rice',
    `${KITCHEN_ASSET_PATH}rice-portion-vivid-v1.png`,
    '米饭',
    prepareRiceDiscardDrag,
    '拖到垃圾桶丢弃',
  );
  renderSushiRack();
  renderPlatterStation();
  renderDrinkPicker();
  if (drinksUnlocked) renderDrinks();
  else drinkRack.replaceChildren();
  renderCustomers();
  renderTutorial();
}

function pointIsInside(event, element) {
  const bounds = element.getBoundingClientRect();
  return event.clientX >= bounds.left && event.clientX <= bounds.right
    && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
}

function canDropInTrash(type) {
  return ['ingredient', 'slice', 'rice', 'cup', 'shrimp-head', 'serve', 'serve-drink'].includes(type);
}

function pointIsInsideTrash(event) {
  const bounds = trashBin.getBoundingClientRect();
  // The painted bin extends beyond its layout box.  Match the drop area to
  // the visible rim so drops onto the drawing cannot miss.
  const paddingX = bounds.width * 0.16;
  const paddingY = bounds.height * 0.16;
  return event.clientX >= bounds.left - paddingX && event.clientX <= bounds.right + paddingX
    && event.clientY >= bounds.top - paddingY && event.clientY <= bounds.bottom + paddingY;
}

function moveDragPreview(event) {
  if (!ingredientDrag) return;
  ingredientDrag.pointerX = event.clientX;
  ingredientDrag.pointerY = event.clientY;
  if (ingredientDrag.previewFrame !== null) return;
  ingredientDrag.previewFrame = window.requestAnimationFrame(() => {
    if (!ingredientDrag) return;
    ingredientDrag.previewFrame = null;
    const x = ingredientDrag.pointerX - ingredientDrag.stageRect.left;
    const y = ingredientDrag.pointerY - ingredientDrag.stageRect.top;
    ingredientDrag.preview.style.setProperty('--drag-x', `${x}px`);
    ingredientDrag.preview.style.setProperty('--drag-y', `${y}px`);
  });
}

function clearIngredientDrag() {
  if (!ingredientDrag) return;
  if (ingredientDrag.previewFrame !== null) window.cancelAnimationFrame(ingredientDrag.previewFrame);
  if (ingredientDrag.source.hasPointerCapture?.(ingredientDrag.pointerId)) {
    ingredientDrag.source.releasePointerCapture(ingredientDrag.pointerId);
  }
  ingredientDrag.source.classList.remove('is-dragging');
  ingredientDrag.preview.remove();
  boardStation.classList.remove('is-drop-target');
  assemblyStation.classList.remove('is-drop-target');
  drinkMachine.classList.remove('is-drop-target');
  riceRack.classList.remove('is-drop-target');
  platterStation.classList.remove('is-drop-target');
  trashBin.classList.remove('is-drop-target');
  customerQueue.querySelector('.customer.is-drop-target')?.classList.remove('is-drop-target');
  ingredientDrag = null;
}

function startIngredientDrag(event, type, requestedIngredientId = null) {
  if (state.gamePaused) return;
  const source = event.currentTarget;
  event.preventDefault();
  if (ingredientDrag) return;
  const ingredientId = requestedIngredientId ?? source.dataset.ingredientId ?? 'salmon';
  const sushiType = sushiTypeFor(ingredientId);
  const dish = dishFor(ingredientId);
  const drink = drinkFor(ingredientId);
  const isCustomerDelivery = type === 'serve' || type === 'serve-drink';

  const preview = document.createElement('img');
  preview.className = `ingredient-drag-preview ${type}`;
  preview.src = type === 'shrimp-head'
    ? `${KITCHEN_ASSET_PATH}shrimp-head-vivid-v1.png`
    : type === 'ingredient'
    ? sushiType.id === 'shrimp'
      ? `${KITCHEN_ASSET_PATH}shrimp-whole-vivid-v1.png`
      : sushiAsset(sushiType.id, 'loin')
    : type === 'rice'
      ? `${KITCHEN_ASSET_PATH}rice-portion-vivid-v1.png`
    : type === 'slice'
      ? sushiAsset(sushiType.id, 'slice')
      : type === 'cup'
        ? `${KITCHEN_ASSET_PATH}tea-cup-empty-vivid-v1.png`
        : type === 'serve-drink'
          ? drinkAsset(drink.id)
          : dishAsset(dish.id, 'nigiri');
  preview.alt = '';
  preview.draggable = false;
  stage.append(preview);
  const stageRect = stage.getBoundingClientRect();
  const targetCustomer = isCustomerDelivery ? getActiveCustomer() : null;
  const target = targetCustomer ? customerCardFor(targetCustomer.id)?.querySelector('.customer-avatar') : null;
  ingredientDrag = {
    type,
    source,
    pointerId: event.pointerId,
    preview,
    target,
    targetCustomerId: targetCustomer?.id ?? null,
    ingredientId: type === 'serve-drink' ? drink.id : isCustomerDelivery ? dish.id : sushiType.id,
    shrimpHeadId: source.dataset.shrimpHeadId ?? null,
    stageRect,
    pointerX: event.clientX,
    pointerY: event.clientY,
    previewFrame: null,
  };
  preview.style.setProperty('--drag-x', `${event.clientX - stageRect.left}px`);
  preview.style.setProperty('--drag-y', `${event.clientY - stageRect.top}px`);
  if (type === 'slice' || type === 'rice' || type === 'ingredient' || type === 'shrimp-head' || isCustomerDelivery) source.classList.add('is-dragging');
  source.setPointerCapture(event.pointerId);
  const dropTarget = type === 'ingredient'
    ? boardStation
    : type === 'cup'
      ? drinkMachine
      : type === 'rice' || type === 'shrimp-head'
        ? null
        : isCustomerDelivery
          ? target?.closest('.customer')
          : riceRack;
  dropTarget?.classList.add('is-drop-target');
  if (type === 'slice' && isRecipeUnlocked('sashimi-platter') && !state.platterMaking) platterStation.classList.add('is-drop-target');
  if (canDropInTrash(type)) trashBin.classList.add('is-drop-target');
  moveDragPreview(event);
  setMessage(type === 'ingredient'
    ? sushiType.id === 'shrimp' ? '把一只带头甜虾拖到切菜板。' : `把${sushiType.boardName}拖到切菜板。`
    : type === 'shrimp-head' ? '把虾头拖到垃圾桶。'
      : type === 'rice' ? '把米饭拖到垃圾桶丢弃。'
      : type === 'cup' ? '把空杯拖到饮品机。'
        : type === 'serve-drink' ? `把${drink.name}拖给顾客，或拖进垃圾桶丢弃。`
        : type === 'serve' ? '把寿司拖给顾客，或拖进垃圾桶丢弃。'
          : isRecipeUnlocked('sashimi-platter')
            ? `把${sushiType.name}片拖到米饭架做寿司，或拖到盘子做刺身拼盘。`
            : `把${sushiType.name}片拖到米饭架。`);
}

function createShrimpBatch() {
  state.shrimpBatchSerial += 1;
  return Array.from({ length: SHRIMP_BATCH_SIZE }, (_, index) => ({
    id: `${state.shrimpBatchSerial}-${index}`,
    cut: false,
  }));
}

function canSelectSashimi(ingredientId = null) {
  if (state.incomingSlices) {
    setMessage('等切好的配料放好后，再拿新的食材。');
    return false;
  }
  if (state.salmonOnBoard) {
    setMessage(`切菜板上还有${sushiTypeFor(state.boardIngredientId).boardName}，先把它切完再拿新的。`);
    return false;
  }
  if (state.shrimpOnBoard) {
    const remaining = state.shrimpBatch.filter((shrimp) => !shrimp.cut).length;
    setMessage(`切菜板上还有 ${remaining} 只甜虾，先把它们处理完再拿新的。`);
    return false;
  }
  if (ingredientId === 'shrimp' && (state.shrimpHeads.length || state.shrimpHeadDiscarding)) {
    setMessage(state.shrimpHeadDiscarding ? '虾头正在丢进垃圾桶，等一下再拿新的甜虾。' : '先把菜板上的虾头拖进垃圾桶，再拿下一只甜虾。');
    return false;
  }
  return true;
}

function openSashimiPicker() {
  if (state.gamePaused) return;
  if (!canSelectSashimi()) return;
  state.sashimiPickerOpen = !state.sashimiPickerOpen;
  playSound(state.sashimiPickerOpen ? 'freezer' : 'ui');
  setMessage(state.sashimiPickerOpen ? '选择一种食材。' : '已收起食材选择。');
  render();
}

function dragSashimiFromPicker(event) {
  const ingredientId = event.currentTarget.dataset.ingredientId;
  const sushiType = sushiTypeFor(ingredientId);
  if (!isSushiTypeUnlocked(sushiType)) {
    setMessage(sushiType.recipeId ? `先在采购商店购买${recipeName(sushiType.recipeId)}。` : '这个食材还没有解锁，去食材商店购买吧。');
    return;
  }
  if (!hasRawFish(ingredientId)) {
    setMessage(`${sushiName(ingredientId)}库存为 0。今天结算后去钓鱼补货吧。`);
    render();
    return;
  }
  if (!canSelectSashimi(ingredientId)) return;
  state.sashimiPickerOpen = false;
  sashimiPicker.classList.add('is-picked');
  startIngredientDrag(event, 'ingredient', sushiType.id);
  setMessage(`拖动${sushiType.pickerName}到切菜板。`);
}

function takeRice() {
  if (state.gamePaused) return;
  const capacity = riceStorageCapacity();
  if (state.riceStored >= capacity) {
    setMessage(`米饭架已经存满 ${capacity} 团。`);
    return;
  }
  playStationMotion(riceBin, 'is-dispensing', motionDuration(420));
  playSound('rice');
  state.riceStored += 1;
  state.incomingRice += 1;
  const sourceRect = riceBin.getBoundingClientRect();
  const targetRect = riceRack.getBoundingClientRect();
  const targetIndex = state.riceStored - 1;
  const riceGrid = storageGridFor('rice');
  setMessage('米饭正在滑进米饭架。');
  render();
  flyCompletedItem({
    className: 'rice',
    src: `${KITCHEN_ASSET_PATH}rice-portion-vivid-v1.png`,
    sourceRect,
    targetRect,
    targetIndex,
    columns: riceGrid.columns,
    rows: riceGrid.rows,
    gap: 0.04,
    displayScale: 1.12,
    onFinish: () => {
      state.incomingRice = Math.max(0, state.incomingRice - 1);
      setMessage('米饭已放进米饭架。拖一片配料到米饭架制作寿司。');
      render();
      if (!state.incomingRice) scheduleSave();
    },
  });
}

function prepareCupDrag(event) {
  if (!hasUnlockedDrinks()) {
    setMessage('先在采购商店购买饮品配方。');
    return;
  }
  if (state.cupOnMachine || state.drinkPouring) {
    setMessage('饮品机里已经有一只杯子。');
    return;
  }
  if (state.drinkTypes.length >= storageCapacityFor('drinks')) {
    setMessage('饮料架满了，先等待出餐。');
    return;
  }
  startIngredientDrag(event, 'cup');
}

function prepareSliceDrag(event) {
  if (state.incomingSlices) {
    setMessage('等鱼片滑到架子里再制作寿司。');
    return;
  }
  if (state.incomingRice) {
    setMessage('等米饭滑进米饭架再制作寿司。');
    return;
  }
  if (state.platterMaking) {
    setMessage('刺身拼盘正在做好，等它滑进寿司架再继续。');
    return;
  }
  const canUsePlatter = isRecipeUnlocked('sashimi-platter');
  if (!state.riceStored && !canUsePlatter) {
    setMessage('先点击饭盒拿一团米饭。');
    return;
  }
  if (state.sushiStored >= storageCapacityFor('sushi') && !canUsePlatter) {
    setMessage('寿司架满了，先出餐再继续制作。');
    return;
  }
  startIngredientDrag(event, 'slice', event.currentTarget.dataset.ingredientId);
}

function prepareRiceDiscardDrag(event) {
  if (state.incomingRice) {
    setMessage('等米饭滑进米饭架后再处理。');
    return;
  }
  if (!state.riceStored) {
    setMessage('米饭架里没有可以丢弃的米饭。');
    return;
  }
  startIngredientDrag(event, 'rice');
}

function prepareShrimpHeadDrag(event) {
  if (!state.shrimpHeads.length || state.shrimpHeadDiscarding) {
    setMessage('现在没有需要处理的虾头。');
    return;
  }
  startIngredientDrag(event, 'shrimp-head', 'shrimp');
}

function prepareSushiServeDrag(event) {
  if (state.incomingSushi) {
    setMessage('等寿司滑进寿司架再出餐。');
    return;
  }
  startIngredientDrag(event, 'serve');
}

function prepareDrinkServeDrag(event) {
  if (state.incomingDrinks) {
    setMessage('等饮品滑进饮品架再出餐。');
    return;
  }
  startIngredientDrag(event, 'serve-drink', event.currentTarget.dataset.drinkId);
}

function playCustomerDeliveryFlight({ src, fromClientX, fromClientY, targetRect, isDrink }) {
  if (!targetRect) return;
  const stageRect = stage.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) return;
  const fromX = fromClientX - stageRect.left;
  const fromY = fromClientY - stageRect.top;
  const toX = targetRect.left + (targetRect.width * 0.52) - stageRect.left;
  const toY = targetRect.top + (targetRect.height * 0.55) - stageRect.top;
  const item = document.createElement('img');
  const size = Math.max(
    isDrink ? 22 : 36,
    Math.min(isDrink ? 46 : 76, Math.min(targetRect.width, targetRect.height) * (isDrink ? 0.22 : 0.38)),
  );

  item.className = `customer-delivery-flight${isDrink ? ' is-drink' : ''}`;
  item.src = src;
  item.alt = '';
  item.draggable = false;
  item.style.left = `${fromX}px`;
  item.style.top = `${fromY}px`;
  item.style.width = `${size}px`;
  item.style.height = `${size}px`;
  item.style.setProperty('--flight-x', `${toX - fromX}px`);
  item.style.setProperty('--flight-y', `${toY - fromY}px`);
  stage.append(item);
  finishFlightOnAnimationEnd(item, 'customer-delivery-flight');
}

function completeCustomerOrderItem(customer, item) {
  item.fulfilled = true;
  const remaining = pendingOrderItems(customer);

  if (remaining.length) {
    setMessage(`已交付${orderItemName(item)}，还需要${orderSummary(remaining)}。`);
    render();
    return;
  }

  const leaveTimer = customerLeaveTimers.get(customer.id);
  if (leaveTimer) clearGameplayTimeout(leaveTimer);
  customerLeaveTimers.delete(customer.id);

  if (customer.customerType === 'beggar') {
    customer.served = true;
    customer.fledWithoutPay = true;
    resolveDayCustomer(customer);
    playSound('customerOut');
    setMessage('逃单客拿走食物跑掉了，没有留下钱。');
    render();
    scheduleSave();
    fadeOutCustomer(customer, { holdMs: 160 });
    return;
  }

  customer.served = true;
  const orderPrice = customerOrderPrice(customer);
  customer.price = orderPrice;
  state.cash += orderPrice;
  state.lifetimeRevenue = Math.min(9_999_999, state.lifetimeRevenue + orderPrice);
  if (resolveDayCustomer(customer, { served: true })) state.dayIncome += orderPrice;
  window.SeasideSushiLeaderboard?.recordOrder(customer.orderItems);
  playSound('cash');
  const specialBonus = isSpecialOrderCustomer(customer)
    ? normalizedSpecialOrderBonus(customer.specialBonus, customer.orderItems)
    : 0;
  if (specialBonus) showSpecialOrderReward(customer, specialBonus);
  setMessage(specialBonus
    ? `特别订单完成，获得 ¥${orderPrice}（奖励 ¥${specialBonus}）。`
    : `订单完成，获得 ¥${orderPrice}。`);
  render();
  scheduleSave();
  fadeOutCustomer(customer, { holdMs: 420 });
}

function deliverSushiToCustomer(ingredientId, customerId) {
  const customer = state.customers.find((waitingCustomer) => waitingCustomer.id === customerId && !waitingCustomer.served && !waitingCustomer.leaving);
  if (!customer || !state.sushiStored) return false;
  const sushiType = dishFor(ingredientId);
  const matchingOrderItem = pendingOrderItems(customer).find((item) => item.type === 'sushi' && item.id === sushiType.id);
  if (!matchingOrderItem) {
    const remaining = pendingOrderItems(customer);
    setMessage(`这位客人还需要${orderSummary(remaining)}，这份${dishDisplayName(sushiType)}不能交付。`);
    render();
    return false;
  }
  const storedIndex = state.sushiTypes.indexOf(sushiType.id);
  if (storedIndex === -1) {
    setMessage('这份寿司已经不在寿司架里了。');
    render();
    return false;
  }
  state.sushiTypes.splice(storedIndex, 1);
  state.sushiStored = state.sushiTypes.length;
  playSound('serve');
  completeCustomerOrderItem(customer, matchingOrderItem);
  return true;
}

function deliverDrinkToCustomer(drinkId, customerId) {
  const customer = state.customers.find((waitingCustomer) => waitingCustomer.id === customerId && !waitingCustomer.served && !waitingCustomer.leaving);
  const drink = drinkFor(drinkId);
  if (!customer || !state.drinkTypes.includes(drink.id)) return false;
  const matchingOrderItem = pendingOrderItems(customer).find((item) => isDrinkOrderItem(item) && drinkIdForOrderItem(item) === drink.id);
  if (!matchingOrderItem) {
    const remaining = pendingOrderItems(customer);
    setMessage(`这位客人还需要${orderSummary(remaining)}，这杯${drink.name}不能交付。`);
    render();
    return false;
  }

  const storedIndex = state.drinkTypes.indexOf(drink.id);
  state.drinkTypes.splice(storedIndex, 1);
  state.drinksStored = state.drinkTypes.length;
  playSound('serve');
  completeCustomerOrderItem(customer, matchingOrderItem);
  return true;
}

function playTrashFlight({ src, fromClientX, fromClientY, sourceRect = null }) {
  const stageRect = stage.getBoundingClientRect();
  const trashRect = trashBin.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height || !trashRect.width || !trashRect.height) return;

  const fallbackSize = Math.min(stageRect.width * 0.065, stageRect.height * 0.16);
  const sourceSize = sourceRect ? Math.max(sourceRect.width, sourceRect.height) * 0.62 : fallbackSize;
  const size = Math.max(24, Math.min(76, sourceSize || fallbackSize));
  const item = document.createElement('img');
  const fromX = fromClientX - stageRect.left;
  const fromY = fromClientY - stageRect.top;
  const toX = trashRect.left + (trashRect.width / 2) - stageRect.left;
  const toY = trashRect.top + (trashRect.height * 0.43) - stageRect.top;

  item.className = 'flying-trash-item';
  item.src = src;
  item.alt = '';
  item.draggable = false;
  item.style.left = `${fromX}px`;
  item.style.top = `${fromY}px`;
  item.style.width = `${size}px`;
  item.style.height = `${size}px`;
  item.style.setProperty('--flight-x', `${toX - fromX}px`);
  item.style.setProperty('--flight-y', `${toY - fromY}px`);
  stage.append(item);
  finishFlightOnAnimationEnd(item, 'trash-item-flight');
}

function discardDraggedItem(type, { ingredientId, sourceRect, src, fromClientX, fromClientY, shrimpHeadId }) {
  if (type === 'shrimp-head') {
    discardShrimpHead(sourceRect, shrimpHeadId);
    return true;
  }

  const sushiType = sushiTypeFor(ingredientId);
  const dish = dishFor(ingredientId);
  let label = '';
  let discarded = false;

  if (type === 'ingredient') {
    discarded = consumeRawFish(sushiType.id);
    label = `${sushiType.name}食材`;
  } else if (type === 'slice') {
    const index = state.sliceTypes.indexOf(sushiType.id);
    if (index !== -1) {
      state.sliceTypes.splice(index, 1);
      state.slicesReady = state.sliceTypes.length;
      discarded = true;
    }
    label = `${sushiType.name}鱼片`;
  } else if (type === 'rice') {
    if (state.riceStored > 0) {
      state.riceStored -= 1;
      discarded = true;
    }
    label = '米饭';
  } else if (type === 'serve') {
    const index = state.sushiTypes.indexOf(dish.id);
    if (index !== -1) {
      state.sushiTypes.splice(index, 1);
      state.sushiStored = state.sushiTypes.length;
      discarded = true;
    }
    label = dishDisplayName(dish);
  } else if (type === 'serve-drink') {
    const drink = drinkFor(ingredientId);
    const index = state.drinkTypes.indexOf(drink.id);
    if (index !== -1) {
      state.drinkTypes.splice(index, 1);
      state.drinksStored = state.drinkTypes.length;
      discarded = true;
    }
    label = drink.name;
  } else if (type === 'cup') {
    discarded = true;
    label = '空杯';
  }

  if (!discarded) {
    setMessage('这个物品已经不在制作台上了。');
    render();
    return false;
  }

  playStationMotion(trashBin, 'is-discarding', motionDuration(620));
  playTrashFlight({ src, fromClientX, fromClientY, sourceRect });
  playSound('trash');
  setMessage(`${label}已经丢进垃圾桶。`);
  render();
  if (!hasUnsettledSaveState()) saveGame();
  else scheduleSave();
  return true;
}

function discardWorkInProgress() {
  if (state.gamePaused || ingredientDrag) return;
  let sourceRect = null;
  let src = '';
  let label = '';

  if (state.salmonOnBoard) {
    const sushiType = sushiTypeFor(state.boardIngredientId);
    sourceRect = boardSalmon.getBoundingClientRect();
    src = sushiAsset(sushiType.id, 'loin');
    label = sushiType.boardName;
    state.salmonOnBoard = false;
    state.boardIngredientId = null;
    state.cutLines = [false, false, false];
    state.activeCut = null;
  } else if (state.shrimpOnBoard) {
    const remaining = state.shrimpBatch.filter((shrimp) => !shrimp.cut).length;
    sourceRect = shrimpBatch.getBoundingClientRect();
    src = `${KITCHEN_ASSET_PATH}shrimp-whole-vivid-v1.png`;
    label = remaining > 1 ? `${remaining} 只甜虾` : '甜虾';
    state.shrimpOnBoard = false;
    state.shrimpBatch = [];
    state.activeShrimpCut = null;
  } else if (state.cupOnMachine || state.drinkPouring) {
    const machineDrink = drinkFor(state.machineDrinkId);
    sourceRect = machineCup.getBoundingClientRect();
    src = state.drinkPouring
      ? drinkAsset(machineDrink.id)
      : `${KITCHEN_ASSET_PATH}tea-cup-empty-vivid-v1.png`;
    label = state.drinkPouring ? `正在制作的${machineDrink.name}` : '空杯';
    state.cupOnMachine = false;
    state.drinkPouring = false;
    state.machineDrinkId = null;
    state.drinkPickerOpen = false;
    state.drinkVersion += 1;
  } else if (state.shrimpHeads.length && !state.shrimpHeadDiscarding) {
    const firstHead = shrimpHeadRack.querySelector('.shrimp-head');
    discardShrimpHead(firstHead?.getBoundingClientRect() ?? trashBin.getBoundingClientRect(), firstHead?.dataset.shrimpHeadId);
    return;
  } else if (state.platterAssembly.length && !state.platterMaking) {
    const removedIngredient = state.platterAssembly.pop();
    sourceRect = platterStation.getBoundingClientRect();
    src = sushiAsset(removedIngredient, 'slice');
    label = `盘中的${sushiName(removedIngredient)}鱼片`;
  } else {
    setMessage('把米饭、鱼片、寿司、饮品或食材拖进垃圾桶；点击垃圾桶也能清空菜板或盘中的刺身。');
    return;
  }

  playStationMotion(trashBin, 'is-discarding', motionDuration(620));
  playTrashFlight({
    src,
    sourceRect,
    fromClientX: sourceRect.left + (sourceRect.width / 2),
    fromClientY: sourceRect.top + (sourceRect.height / 2),
  });
  playSound('trash');
  setMessage(`${label}已经丢进垃圾桶。`);
  render();
  if (!hasUnsettledSaveState()) saveGame();
  else scheduleSave();
}

freezerButton.addEventListener('click', openSashimiPicker);
sashimiChoices.forEach((choice) => choice.addEventListener('pointerdown', dragSashimiFromPicker));
ingredientShopToggle.addEventListener('click', toggleIngredientShop);
ingredientShopClose.addEventListener('click', closeIngredientShop);
ingredientShopPanel.addEventListener('click', (event) => {
  if (event.target === ingredientShopPanel) closeIngredientShop();
});
riceBin.addEventListener('click', takeRice);
cupStation.addEventListener('pointerdown', prepareCupDrag);
trashBin.addEventListener('click', discardWorkInProgress);

window.addEventListener('pointermove', (event) => moveDragPreview(event), { passive: true });
window.addEventListener('pointercancel', () => clearIngredientDrag());
window.addEventListener('pointerup', (event) => {
  if (!ingredientDrag || event.pointerId !== ingredientDrag.pointerId) return;
  const { type, source, target, targetCustomerId, ingredientId, shrimpHeadId, preview } = ingredientDrag;
  const sushiType = sushiTypeFor(ingredientId);
  const dish = dishFor(ingredientId);
  const drink = drinkFor(ingredientId);
  const isCustomerDelivery = type === 'serve' || type === 'serve-drink';
  const sourceRect = source.getBoundingClientRect();
  const previewSrc = preview.currentSrc || preview.src;
  const deliveryFlight = isCustomerDelivery && target
    ? {
      src: previewSrc,
      fromClientX: event.clientX,
      fromClientY: event.clientY,
      targetRect: target.getBoundingClientRect(),
      isDrink: type === 'serve-drink',
    }
    : null;
  const droppedOnPlatter = type === 'slice'
    && isRecipeUnlocked('sashimi-platter')
    && !state.platterMaking
    && pointIsInside(event, platterStation);
  const destination = type === 'ingredient'
    ? boardStation
    : type === 'cup'
      ? drinkMachine
      : type === 'rice' || type === 'shrimp-head'
        ? null
        : isCustomerDelivery
          ? target
          : droppedOnPlatter ? platterStation : riceRack;
  const droppedInTrash = canDropInTrash(type) && pointIsInsideTrash(event);
  const accepted = droppedInTrash || Boolean(destination && pointIsInside(event, destination));
  if (source.hasPointerCapture(event.pointerId)) source.releasePointerCapture(event.pointerId);
  clearIngredientDrag();

  if (!accepted) {
    setMessage(type === 'ingredient'
      ? sushiType.id === 'shrimp' ? '把带头甜虾拖到切菜板里，或拖进垃圾桶。' : `把${sushiType.boardName}拖到切菜板里，或拖进垃圾桶。`
      : type === 'shrimp-head' ? '把虾头拖到垃圾桶里。'
        : type === 'rice' ? '把米饭拖到垃圾桶里。'
          : type === 'cup' ? '把空杯拖到饮品机里，或拖进垃圾桶。'
            : type === 'serve-drink' ? `把${drink.name}拖到顾客身上，或拖进垃圾桶。`
              : type === 'serve' ? '把寿司拖到顾客身上，或拖进垃圾桶。'
                : isRecipeUnlocked('sashimi-platter')
                  ? `把${sushiType.name}片拖到米饭架做寿司，或拖到盘子做刺身拼盘。`
                  : `把${sushiType.name}片拖到米饭架里，或拖进垃圾桶。`);
    render();
    return;
  }

  if (droppedInTrash) {
    discardDraggedItem(type, {
      ingredientId,
      sourceRect,
      src: previewSrc,
      fromClientX: event.clientX,
      fromClientY: event.clientY,
      shrimpHeadId,
    });
    return;
  }

  if (type === 'serve') {
    if (deliverSushiToCustomer(dish.id, targetCustomerId)) playCustomerDeliveryFlight(deliveryFlight);
    return;
  }

  if (type === 'serve-drink') {
    if (deliverDrinkToCustomer(drink.id, targetCustomerId)) playCustomerDeliveryFlight(deliveryFlight);
    return;
  }

  if (type === 'ingredient') {
    if (!consumeRawFish(sushiType.id)) {
      setMessage(`${sushiType.name}库存不足，今天结算后去钓鱼补货。`);
      render();
      return;
    }
    state.salmonOnBoard = sushiType.id !== 'shrimp';
    state.shrimpOnBoard = sushiType.id === 'shrimp';
    state.shrimpBatch = sushiType.id === 'shrimp' ? createShrimpBatch() : [];
    state.boardIngredientId = sushiType.id === 'shrimp' ? null : sushiType.id;
    state.cutLines = [false, false, false];
    state.activeCut = null;
    state.activeShrimpCut = null;
    playSound('place');
    setMessage(sushiType.id === 'shrimp'
      ? '4 只甜虾已放到切菜板。按住每只虾的虾头后向下滑动，就能逐只去头。'
      : `${sushiType.boardName}已放到切菜板。在虚线附近按住，轻轻向下滑动即可切片。`);
  } else if (type === 'cup') {
    state.cupOnMachine = true;
    state.machineDrinkId = null;
    state.drinkPickerOpen = false;
    playSound('place');
    setMessage('空杯放好了，点击饮品机选择饮品。');
  } else if (type === 'slice' && destination === platterStation) {
    addSliceToPlatter(sushiType.id);
    return;
  } else {
    makeSushi(sushiType.id);
    return;
  }
  render();
});

function pointerPosition(event, element = boardSalmon) {
  const bounds = element.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) / bounds.width,
    y: (event.clientY - bounds.top) / bounds.height,
  };
}

function findCutLine(x, tolerance = 0.09) {
  const nextCut = state.cutLines.findIndex((cut) => !cut);
  return nextCut !== -1 && Math.abs(x - CUT_LINES[nextCut]) < tolerance ? nextCut : -1;
}

function hasRoomForCut(index) {
  return storageCapacityFor('slices') - state.slicesReady >= CUT_SLICE_ORIGINS[index].length;
}

function flySlice(sourceRect, rackRect, sourceFraction, sliceIndex, flightVersion, ingredientId, staggerMs = 0) {
  const stageRect = stage.getBoundingClientRect();
  const flyingSlice = document.createElement('img');
  const fromX = sourceRect.left + (sourceRect.width * sourceFraction) - stageRect.left;
  const fromY = sourceRect.top + (sourceRect.height * 0.54) - stageRect.top;
  const sliceGrid = storageGridFor('slices');
  const column = sliceIndex % sliceGrid.columns;
  const row = Math.floor(sliceIndex / sliceGrid.columns);
  const columnGap = rackRect.width * 0.02;
  const rowGap = rackRect.height * 0.07;
  const targetWidth = (rackRect.width - (columnGap * (sliceGrid.columns - 1))) / sliceGrid.columns;
  const targetHeight = (rackRect.height - (rowGap * (sliceGrid.rows - 1))) / sliceGrid.rows;
  const toX = rackRect.left + (column * (targetWidth + columnGap)) + (targetWidth / 2) - stageRect.left;
  const toY = rackRect.top + (row * (targetHeight + rowGap)) + (targetHeight / 2) - stageRect.top;

  flyingSlice.className = 'flying-sushi-slice';
  flyingSlice.src = sushiAsset(ingredientId, 'slice');
  flyingSlice.alt = '';
  flyingSlice.draggable = false;
  flyingSlice.style.left = `${fromX}px`;
  flyingSlice.style.top = `${fromY}px`;
  flyingSlice.style.width = `${targetWidth}px`;
  flyingSlice.style.height = `${targetHeight}px`;
  flyingSlice.style.setProperty('--flight-x', `${toX - fromX}px`);
  flyingSlice.style.setProperty('--flight-y', `${toY - fromY}px`);
  const animationStagger = staggerMs;
  flyingSlice.style.animationDelay = `${animationStagger}ms`;
  stage.append(flyingSlice);

  finishFlightOnAnimationEnd(flyingSlice, 'sushi-slice-flight', () => {
    if (flightVersion !== state.flightVersion) return;
    state.incomingSlices = Math.max(0, state.incomingSlices - 1);
    render();
    if (!state.incomingSlices) scheduleSave();
  });
}

function flyCompletedItem({ className, src, sourceRect, targetRect, targetIndex, columns, rows, gap, displayScale = 1, onFinish }) {
  const flightVersion = state.flightVersion;
  const stageRect = stage.getBoundingClientRect();
  const column = targetIndex % columns;
  const row = Math.floor(targetIndex / columns);
  const columnGap = targetRect.width * gap;
  const rowGap = targetRect.height * gap;
  const targetWidth = (targetRect.width - (columnGap * (columns - 1))) / columns;
  const targetHeight = (targetRect.height - (rowGap * (rows - 1))) / rows;
  const fromX = sourceRect.left + (sourceRect.width / 2) - stageRect.left;
  const fromY = sourceRect.top + (sourceRect.height / 2) - stageRect.top;
  const toX = targetRect.left + (column * (targetWidth + columnGap)) + (targetWidth / 2) - stageRect.left;
  const toY = targetRect.top + (row * (targetHeight + rowGap)) + (targetHeight / 2) - stageRect.top;
  const item = document.createElement('img');

  item.className = `flying-completed-item ${className}`;
  item.src = src;
  item.alt = '';
  item.draggable = false;
  item.style.left = `${fromX}px`;
  item.style.top = `${fromY}px`;
  item.style.width = `${targetWidth * displayScale}px`;
  item.style.height = `${targetHeight * displayScale}px`;
  item.style.setProperty('--flight-x', `${toX - fromX}px`);
  item.style.setProperty('--flight-y', `${toY - fromY}px`);
  if (className === 'rice') {
    const distance = Math.hypot(toX - fromX, toY - fromY);
    const lift = Math.min(Math.max(52, distance * 0.33), stageRect.height * 0.28);
    for (let point = 1; point < 8; point += 1) {
      const progress = point / 8;
      const arcX = (toX - fromX) * progress;
      const arcY = ((toY - fromY) * progress) - (lift * 4 * progress * (1 - progress));
      item.style.setProperty(`--rice-flight-x-${point}`, `${arcX}px`);
      item.style.setProperty(`--rice-flight-y-${point}`, `${arcY}px`);
    }
  }
  stage.append(item);

  finishFlightOnAnimationEnd(item, className === 'rice' ? 'rice-completed-flight' : 'completed-item-flight', () => {
    if (flightVersion === state.flightVersion) onFinish();
  });
}

function discardShrimpHead(sourceRect, headId) {
  if (!headId || !state.shrimpHeads.some((head) => head.id === headId) || state.shrimpHeadDiscarding) return;
  const stageRect = stage.getBoundingClientRect();
  const trashRect = trashBin.getBoundingClientRect();
  const head = document.createElement('img');
  const animationVersion = state.flightVersion;
  const headSize = Math.max(30, Math.min(sourceRect.width, sourceRect.height) * 0.9);

  head.className = 'flying-shrimp-head';
  head.src = `${KITCHEN_ASSET_PATH}shrimp-head-vivid-v1.png`;
  head.alt = '';
  head.draggable = false;
  const fromX = sourceRect.left + (sourceRect.width / 2) - stageRect.left;
  const fromY = sourceRect.top + (sourceRect.height / 2) - stageRect.top;
  const toX = trashRect.left + (trashRect.width / 2) - stageRect.left;
  const toY = trashRect.top + (trashRect.height * 0.44) - stageRect.top;
  head.style.left = `${fromX}px`;
  head.style.top = `${fromY}px`;
  head.style.width = `${headSize}px`;
  head.style.height = `${headSize}px`;
  head.style.setProperty('--flight-x', `${toX - fromX}px`);
  head.style.setProperty('--flight-y', `${toY - fromY}px`);

  state.shrimpHeads = state.shrimpHeads.filter((shrimpHead) => shrimpHead.id !== headId);
  state.shrimpHeadDiscarding = true;
  playSound('trash');
  setMessage('正在把虾头丢进垃圾桶。');
  render();
  stage.append(head);

  finishFlightOnAnimationEnd(head, 'shrimp-head-flight', () => {
    if (animationVersion !== state.flightVersion) return;
    state.shrimpHeadDiscarding = false;
    setMessage(state.shrimpHeads.length ? '这个虾头已经处理好，剩下的也要丢进垃圾桶。' : '所有虾头都处理好了，可以再拿一批甜虾。');
    render();
    if (!state.shrimpHeads.length && !state.incomingSlices) scheduleSave();
  });
}

function finishCutLine(index) {
  if (state.gamePaused) return;
  const sourceRect = boardSalmon.getBoundingClientRect();
  const rackRect = sliceRack.getBoundingClientRect();
  const sliceOrigins = CUT_SLICE_ORIGINS[index];
  const firstSliceIndex = state.slicesReady;
  const flightVersion = state.flightVersion;
  const ingredientId = sushiTypeFor(state.boardIngredientId).id;
  const sushiType = sushiTypeFor(ingredientId);

  state.cutLines[index] = true;
  state.slicesReady = Math.min(storageCapacityFor('slices'), state.slicesReady + sliceOrigins.length);
  state.sliceTypes.push(...Array(sliceOrigins.length).fill(ingredientId));
  state.incomingSlices += sliceOrigins.length;
  const completed = state.cutLines.filter(Boolean).length;
  state.salmonOnBoard = completed < CUT_LINES.length;
  if (!state.salmonOnBoard) state.boardIngredientId = null;
  playSound('chop');
  setMessage(completed < CUT_LINES.length ? `切好一片${sushiType.name}，继续切下一条虚线。` : `最后两片${sushiType.name}切好了！`);
  render();
  sliceOrigins.forEach((origin, offset) => {
    flySlice(
      sourceRect,
      rackRect,
      origin,
      firstSliceIndex + offset,
      flightVersion,
      ingredientId,
      offset * SLICE_FLIGHT_STAGGER_MS,
    );
  });
}

function hasRoomForShrimp() {
  return storageCapacityFor('slices') - state.slicesReady >= 1;
}

function finishShrimpPrep(shrimpId, sourceElement) {
  if (state.gamePaused) return;
  const shrimp = state.shrimpBatch.find((batchItem) => batchItem.id === shrimpId && !batchItem.cut);
  if (!shrimp || !hasRoomForShrimp()) return;
  const sourceRect = sourceElement.getBoundingClientRect();
  const rackRect = sliceRack.getBoundingClientRect();
  const sliceIndex = state.slicesReady;
  const flightVersion = state.flightVersion;

  shrimp.cut = true;
  state.shrimpOnBoard = state.shrimpBatch.some((batchItem) => !batchItem.cut);
  state.activeShrimpCut = null;
  state.shrimpHeads.push({ id: shrimp.id });
  state.slicesReady += 1;
  state.sliceTypes.push('shrimp');
  state.incomingSlices += 1;
  const remaining = state.shrimpBatch.filter((batchItem) => !batchItem.cut).length;
  playSound('shrimp');
  setMessage(remaining
    ? `一只甜虾处理好了，还剩 ${remaining} 只；虾头记得逐个拖进垃圾桶。`
    : '这批甜虾都处理好了，先把所有虾头拖进垃圾桶，才能拿下一批。');
  render();
  flySlice(sourceRect, rackRect, 0.54, sliceIndex, flightVersion, 'shrimp');
}

function startShrimpCut(event) {
  event.preventDefault();
  const item = event.currentTarget;
  const shrimpId = item.dataset.shrimpId;
  const shrimp = state.shrimpBatch.find((batchItem) => batchItem.id === shrimpId && !batchItem.cut);
  if (!shrimp || state.activeShrimpCut !== null) return;
  if (!hasRoomForShrimp()) {
    setMessage('配料架空间不够，先做几份寿司再处理甜虾。');
    return;
  }

  const point = pointerPosition(event, item);
  if (Math.abs(point.x - SHRIMP_HEAD_CUT_X) > 0.42) {
    setMessage('从虾头位置开始，轻轻向下滑动就能去头。');
    return;
  }

  state.activeShrimpCut = shrimpId;
  state.shrimpCutStartY = point.y;
  item.classList.add('is-cutting');
  item.setPointerCapture(event.pointerId);
}

function moveShrimpCut(event) {
  const item = event.currentTarget;
  const shrimpId = item.dataset.shrimpId;
  if (state.activeShrimpCut !== shrimpId) return;
  const point = pointerPosition(event, item);
  if (point.y - state.shrimpCutStartY < CUT_SWIPE_DISTANCE) return;
  if (item.hasPointerCapture(event.pointerId)) item.releasePointerCapture(event.pointerId);
  finishShrimpPrep(shrimpId, item);
}

function cancelShrimpCut(event) {
  const item = event.currentTarget;
  if (state.activeShrimpCut !== item.dataset.shrimpId) return;
  state.activeShrimpCut = null;
  item.classList.remove('is-cutting');
  if (item.hasPointerCapture(event.pointerId)) item.releasePointerCapture(event.pointerId);
}

boardSalmon.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  const point = pointerPosition(event);
  const cutLine = findCutLine(point.x, CUT_START_TOLERANCE);
  if (cutLine === -1) {
    setMessage('在下一条虚线附近按住，再向下滑动一点。');
    return;
  }
  if (!hasRoomForCut(cutLine)) {
    setMessage('配料架空间不够，先做几份寿司再继续切。');
    return;
  }
  state.activeCut = cutLine;
  state.cutStartY = point.y;
  boardSalmon.setPointerCapture(event.pointerId);
  render();
});

boardSalmon.addEventListener('pointermove', (event) => {
  if (state.activeCut === null) return;
  const point = pointerPosition(event);
  const followsGuide = Math.abs(point.x - CUT_LINES[state.activeCut]) < 0.28;
  if (followsGuide && point.y - state.cutStartY >= CUT_SWIPE_DISTANCE) {
    const cutLine = state.activeCut;
    state.activeCut = null;
    if (boardSalmon.hasPointerCapture(event.pointerId)) boardSalmon.releasePointerCapture(event.pointerId);
    finishCutLine(cutLine);
  }
});

function cancelCut(event) {
  if (state.activeCut === null) return;
  state.activeCut = null;
  if (boardSalmon.hasPointerCapture(event.pointerId)) boardSalmon.releasePointerCapture(event.pointerId);
  render();
}

boardSalmon.addEventListener('pointerup', cancelCut);
boardSalmon.addEventListener('pointercancel', cancelCut);

boardSalmon.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  const cutLine = state.cutLines.findIndex((cut) => !cut);
  if (cutLine !== -1 && hasRoomForCut(cutLine)) finishCutLine(cutLine);
});

function startDrinkProduction(drinkId) {
  const drink = drinkFor(drinkId);
  if (state.gamePaused || !isDrinkUnlocked(drink.id) || !state.cupOnMachine || state.drinkPouring) return;

  state.drinkPickerOpen = false;
  state.drinkPouring = true;
  state.machineDrinkId = drink.id;
  const version = state.drinkVersion;
  playSound('teaStart');
  setMessage(`正在接${drink.name}。`);
  render();
  setGameplayTimeout(() => {
    if (version !== state.drinkVersion) return;
    const sourceRect = machineCup.getBoundingClientRect();
    const targetRect = drinkRack.getBoundingClientRect();
    const targetIndex = state.drinkTypes.length;
    state.cupOnMachine = false;
    state.drinkPouring = false;
    state.machineDrinkId = null;
    state.drinkTypes.push(drink.id);
    state.drinksStored = state.drinkTypes.length;
    state.incomingDrinks += 1;
    playSound('teaReady');
    setMessage(`${drink.name}做好了，已放进饮品架。`);
    render();
    const drinkGrid = storageGridFor('drinks');
    flyCompletedItem({
      className: 'drink',
      src: drinkAsset(drink.id),
      sourceRect,
      targetRect,
      targetIndex,
      columns: drinkGrid.columns,
      rows: drinkGrid.rows,
      gap: 0.1,
      onFinish: () => {
        state.incomingDrinks = Math.max(0, state.incomingDrinks - 1);
        render();
        if (!state.incomingDrinks) scheduleSave();
      },
    });
  }, motionDuration(teaFillDuration()));
}

drinkMachine.addEventListener('click', () => {
  if (state.gamePaused) return;
  if (!hasUnlockedDrinks()) {
    setMessage('先在采购商店购买饮品配方。');
    return;
  }
  if (!state.cupOnMachine) {
    setMessage('先从杯子区拖一个空杯到饮品机。');
    return;
  }
  if (state.drinkPouring) return;
  const choices = unlockedDrinkTypes();
  if (choices.length === 1) {
    startDrinkProduction(choices[0].id);
    return;
  }
  state.drinkPickerOpen = !state.drinkPickerOpen;
  setMessage(state.drinkPickerOpen ? '选择这杯要制作的饮品。' : '点击饮品机选择饮品。');
  render();
});

gamePauseButton.addEventListener('click', toggleGamePause);
resumeGameButton.addEventListener('click', resumeGame);
openGameSettingsButton.addEventListener('click', openGameSettings);
closeGameSettingsButton.addEventListener('click', closeGameSettings);
soundSettingButton.addEventListener('click', toggleSoundEffects);
soundVolumeSetting.addEventListener('input', updateSoundVolume);
exitGameButton.addEventListener('click', exitGame);
openShopButton.addEventListener('click', resumeShop);
goFishingButton.addEventListener('click', goFishing);
daySummaryDismissButton.addEventListener('click', dismissDaySummary);
tutorialStartButton.addEventListener('click', startTutorial);
tutorialSkipButton.addEventListener('click', skipTutorial);

restoreGameSettings();
restoreGame();
if (tutorialIsRunning() && state.tutorialStep === TUTORIAL_STEP.SERVE_CUSTOMER && !tutorialCustomer()) {
  spawnTutorialCustomer();
}
setMessage(state.dayPhase === 'settlement'
  ? state.dayEndedEarly
    ? `第 ${state.day} 天暂时打烊，补货后继续。`
    : `第 ${state.day} 天结束。`
  : tutorialNeedsCompletion()
    ? '第 1 天：先完成新手教程，招待第一位客人。'
    : `第 ${state.day} 天营业中：第一位客人马上就到。`);
render();
startDayClock();
restoreSavedCustomerTimers();
scheduleCustomer(700);
window.addEventListener('pagehide', () => {
  if (!hasUnsettledSaveState()) saveGame();
});
window.addEventListener('storage', (event) => {
  if (event.key !== SAVE_KEY || event.storageArea !== window.localStorage) return;
  syncExternalSave(event.newValue);
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) syncExternalSave();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncExternalSave();
});

function preloadInteractionAssets() {
  // Do not silently download every future customer, fish, and decoration on
  // a new save. Warm only what this shop can use now; newly bought content
  // naturally starts loading when its own UI is opened.
  const assetNames = new Set(['rice-portion-vivid-v1.png', 'tea-cup-empty-vivid-v1.png', 'trash-bin-vivid-v1.png']);
  const ingredientIds = new Set([
    ...state.unlockedIngredients,
    ...state.sliceTypes,
    ...state.sushiTypes,
    ...state.platterAssembly,
    state.boardIngredientId,
  ]);
  if (state.shrimpOnBoard) ingredientIds.add('shrimp');
  ingredientIds.forEach((id) => {
    const sushiType = SUSHI_TYPES[id];
    if (!sushiType) return;
    ['loin', 'whole', 'head', 'slice', 'nigiri'].forEach((property) => {
      if (sushiType[property]) assetNames.add(sushiType[property]);
    });
  });
  state.unlockedDrinks.forEach((id) => assetNames.add(drinkFor(id).asset));
  if (state.unlockedRecipes.includes('nori')) assetNames.add('nori-sheets-vivid-v1.png');
  if (state.unlockedRecipes.includes('uni-gunkan')) {
    ['uni-loin-vivid-v1.png', 'uni-slice-vivid-v1.png', 'uni-gunkan-vivid-v1.png'].forEach((name) => assetNames.add(name));
  }
  if (state.unlockedRecipes.includes('roe-gunkan')) {
    ['roe-loin-vivid-v1.png', 'roe-slice-vivid-v1.png', 'roe-gunkan-vivid-v1.png'].forEach((name) => assetNames.add(name));
  }
  if (state.unlockedRecipes.includes('sashimi-platter')) {
    assetNames.add('plate-stack-vivid-v1.png');
    state.sushiTypes.filter((id) => PLATTER_TYPES[id]).forEach((id) => assetNames.add(PLATTER_TYPES[id].nigiri));
  }

  const customerAvatars = new Set(state.customers.map((customer) => customer.avatar).filter(Boolean));
  if (!customerAvatars.size) customerAvatars.add(nextCustomerTemplate().avatar);
  if (canSpawnSpecialOrderToday()) customerAvatars.add(SPECIAL_CUSTOMER_TEMPLATE.avatar);
  const assetUrls = [
    ...Array.from(assetNames, (name) => `${KITCHEN_ASSET_PATH}${name}`),
    ...Array.from(customerAvatars, (avatar) => `${CUSTOMER_ASSET_PATH}${avatar}`),
  ];
  assetUrls.forEach((src) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    image.decode?.().catch(() => {});
  });
}

if ('requestIdleCallback' in window) {
  window.requestIdleCallback(preloadInteractionAssets, { timeout: 1200 });
} else {
  window.setTimeout(preloadInteractionAssets, 600);
}
