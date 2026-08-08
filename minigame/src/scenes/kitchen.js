const { APP, REWARDED_AD } = require('../config');
const { loadSave, saveGame } = require('../core/storage');
const { RewardedAd } = require('../core/rewarded-ad');

const W = APP.designWidth;
const H = APP.designHeight;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fillRounded(ctx, x, y, width, height, radius, color) {
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

function strokeRounded(ctx, x, y, width, height, radius, color, lineWidth = 3) {
  roundedRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function pointInRect(point, rect) {
  return Boolean(rect) && point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

class KitchenScene {
  constructor({ ctx, assets }) {
    this.ctx = ctx;
    this.assets = assets;
    this.save = loadSave();
    this.screen = 'menu';
    this.ready = false;
    this.notice = '';
    this.noticeUntil = 0;
    this.adBusy = false;
    this.rewardedAd = new RewardedAd();
    this.hitboxes = {};
  }

  async load() {
    await this.assets.preload([
      ['menuBackground', 'assets/menu/sushi-shop-menu-background-soft-v3.jpg'],
      ['kitchenBackground', 'assets/kitchen/kitchen-background-soft-v3.jpg'],
      ['riceBin', 'assets/kitchen/rice-bin.png'],
      ['ricePortion', 'assets/kitchen/rice-portion.png'],
      ['tamagoLoin', 'assets/kitchen/tamago-loin.png'],
      ['tamagoNigiri', 'assets/kitchen/tamago-nigiri.png'],
      ['teaCup', 'assets/kitchen/tea-cup-ready.png'],
      ['customer', 'assets/customers/customer-regular.png'],
    ]);
    this.rewardedAd.prepare();
    this.ready = true;
  }

  setNotice(text, duration = 2400) {
    this.notice = text;
    this.noticeUntil = Date.now() + duration;
  }

  persist() {
    this.save = saveGame(this.save);
  }

  remainingCooldown() {
    return Math.max(0, this.save.rewardCooldownEndsAt - Date.now());
  }

  formatCooldown() {
    const seconds = Math.ceil(this.remainingCooldown() / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  drawCover(image, x, y, width, height) {
    if (!image) return false;
    const imageRatio = image.width / image.height;
    const destinationRatio = width / height;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.width;
    let sourceHeight = image.height;
    if (imageRatio > destinationRatio) {
      sourceWidth = image.height * destinationRatio;
      sourceX = (image.width - sourceWidth) / 2;
    } else {
      sourceHeight = image.width / destinationRatio;
      sourceY = (image.height - sourceHeight) / 2;
    }
    this.ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    return true;
  }

  drawContain(image, x, y, width, height) {
    if (!image) return false;
    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    this.ctx.drawImage(image, x + ((width - drawWidth) / 2), y + ((height - drawHeight) / 2), drawWidth, drawHeight);
    return true;
  }

  drawText(text, x, y, options = {}) {
    const { size = 24, color = '#553520', align = 'left', weight = '700', baseline = 'middle' } = options;
    this.ctx.fillStyle = color;
    this.ctx.font = `${weight} ${size}px PingFang SC, Microsoft YaHei, sans-serif`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, x, y);
  }

  drawButton(rect, { label, sublabel = '', color = '#e69352', disabled = false, icon = null }) {
    const ctx = this.ctx;
    fillRounded(ctx, rect.x, rect.y + 6, rect.width, rect.height, 22, disabled ? '#a9a7a0' : '#814525');
    fillRounded(ctx, rect.x, rect.y, rect.width, rect.height - 6, 22, disabled ? '#d9d6c9' : color);
    strokeRounded(ctx, rect.x, rect.y, rect.width, rect.height - 6, 22, disabled ? '#918e86' : '#683b24', 3);
    if (icon) this.drawContain(icon, rect.x + 13, rect.y + 7, 42, rect.height - 20);
    const textX = icon ? rect.x + 66 : rect.x + (rect.width / 2);
    const align = icon ? 'left' : 'center';
    this.drawText(label, textX, rect.y + (sublabel ? 23 : 29), { size: sublabel ? 20 : 23, color: disabled ? '#746f68' : '#fff9d9', align, weight: '900' });
    if (sublabel) this.drawText(sublabel, textX, rect.y + 48, { size: 13, color: disabled ? '#827d75' : '#fff2bd', align, weight: '700' });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    this.hitboxes = {};
    if (!this.ready) {
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, '#86d9e7');
      gradient.addColorStop(1, '#f8cf8d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      this.drawText('正在准备寿司台…', W / 2, H / 2, { size: 36, color: '#fff9dc', align: 'center', weight: '900' });
      return;
    }
    if (this.screen === 'menu') this.renderMenu();
    else this.renderKitchen();
    this.renderNotice();
  }

  renderMenu() {
    const ctx = this.ctx;
    const hasBackground = this.drawCover(this.assets.get('menuBackground'), 0, 0, W, H);
    if (!hasBackground) {
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, '#80d7dd');
      gradient.addColorStop(1, '#fff0b8');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    }
    const veil = ctx.createLinearGradient(0, 0, W, 0);
    veil.addColorStop(0, 'rgba(19, 69, 80, .68)');
    veil.addColorStop(.55, 'rgba(19, 69, 80, .16)');
    veil.addColorStop(1, 'rgba(19, 69, 80, .04)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, W, H);

    this.drawText('海边', 100, 184, { size: 50, color: '#fff5ce', weight: '900' });
    this.drawText('寿司店', 96, 254, { size: 78, color: '#fffdf0', weight: '900' });
    this.drawText('用新鲜海味，经营你的海边小店', 102, 304, { size: 21, color: '#e9fff8', weight: '700' });

    const start = { x: 102, y: 356, width: 248, height: 68 };
    this.drawButton(start, { label: '开始营业', sublabel: '点击进入制作台', color: '#ef9961' });
    this.hitboxes.start = start;

    fillRounded(ctx, 101, 454, 253, 96, 20, 'rgba(255, 250, 222, .88)');
    strokeRounded(ctx, 101, 454, 253, 96, 20, '#6a5139', 3);
    this.drawText('贝壳', 126, 483, { size: 17, color: '#87603b', weight: '900' });
    this.drawText(`${this.save.shells}`, 126, 520, { size: 34, color: '#bd6332', weight: '900' });
    this.drawText('小游戏原生存档', 236, 520, { size: 14, color: '#6b7469', align: 'center', weight: '700' });
  }

  renderKitchen() {
    const ctx = this.ctx;
    const hasBackground = this.drawCover(this.assets.get('kitchenBackground'), 0, 0, W, H);
    if (!hasBackground) {
      ctx.fillStyle = '#e6cfab';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = 'rgba(255, 248, 223, .20)';
    ctx.fillRect(0, 0, W, H);

    fillRounded(ctx, 30, 23, 262, 64, 18, 'rgba(255, 250, 223, .94)');
    strokeRounded(ctx, 30, 23, 262, 64, 18, '#6d5037', 3);
    this.drawText('今日贝壳', 56, 48, { size: 16, color: '#8f6841', weight: '900' });
    this.drawText(`${this.save.shells}`, 56, 72, { size: 25, color: '#c36532', weight: '900' });
    this.drawText('玉子烧订单', 204, 56, { size: 14, color: '#586b65', align: 'center', weight: '900' });

    const back = { x: 1160, y: 27, width: 88, height: 48 };
    this.drawButton(back, { label: '菜单', color: '#72b9b1' });
    this.hitboxes.back = back;

    this.renderIngredientStation({
      rect: { x: 52, y: 410, width: 232, height: 226 },
      name: '米饭盒',
      detail: `库存 ${this.save.inventory.rice} / 8`,
      image: this.assets.get('riceBin'),
      action: 'rice',
      tint: '#f1dfae',
    });
    this.renderIngredientStation({
      rect: { x: 314, y: 410, width: 232, height: 226 },
      name: '玉子烧盒',
      detail: `库存 ${this.save.inventory.tamago} / 8`,
      image: this.assets.get('tamagoLoin'),
      action: 'tamago',
      tint: '#f3d977',
    });
    this.renderBoard();
    this.renderCustomer();
    this.renderRewardButton();
  }

  renderIngredientStation({ rect, name, detail, image, action, tint }) {
    const ctx = this.ctx;
    fillRounded(ctx, rect.x, rect.y + 8, rect.width, rect.height, 20, '#855237');
    fillRounded(ctx, rect.x, rect.y, rect.width, rect.height - 8, 20, '#f9ebc6');
    strokeRounded(ctx, rect.x, rect.y, rect.width, rect.height - 8, 20, '#704932', 3);
    fillRounded(ctx, rect.x + 12, rect.y + 42, rect.width - 24, 128, 16, tint);
    strokeRounded(ctx, rect.x + 12, rect.y + 42, rect.width - 24, 128, 16, '#825b3e', 2);
    this.drawContain(image, rect.x + 25, rect.y + 49, rect.width - 50, 110);
    this.drawText(name, rect.x + 18, rect.y + 24, { size: 20, color: '#643f2a', weight: '900' });
    this.drawText(detail, rect.x + 18, rect.y + 191, { size: 15, color: '#8d6344', weight: '700' });
    this.drawText('点击取用', rect.x + rect.width - 18, rect.y + 191, { size: 14, color: '#ae663b', align: 'right', weight: '900' });
    this.hitboxes[action] = rect;
  }

  renderBoard() {
    const ctx = this.ctx;
    const rect = { x: 580, y: 366, width: 334, height: 270 };
    fillRounded(ctx, rect.x, rect.y + 9, rect.width, rect.height, 23, '#805037');
    fillRounded(ctx, rect.x, rect.y, rect.width, rect.height - 9, 23, '#ead6a8');
    strokeRounded(ctx, rect.x, rect.y, rect.width, rect.height - 9, 23, '#76503a', 4);
    this.drawText('制作菜板', rect.x + 23, rect.y + 28, { size: 23, color: '#673f29', weight: '900' });
    this.drawText('1 份米饭 + 1 份玉子烧', rect.x + 23, rect.y + 54, { size: 15, color: '#8d6846', weight: '700' });
    fillRounded(ctx, rect.x + 24, rect.y + 76, rect.width - 48, 118, 18, '#f7e9bf');
    strokeRounded(ctx, rect.x + 24, rect.y + 76, rect.width - 48, 118, 18, '#bf9363', 3);
    if (this.save.inventory.rice > 0) this.drawContain(this.assets.get('ricePortion'), rect.x + 43, rect.y + 87, 108, 96);
    if (this.save.inventory.tamago > 0) this.drawContain(this.assets.get('tamagoLoin'), rect.x + 176, rect.y + 90, 112, 89);
    const canMake = this.save.inventory.rice > 0 && this.save.inventory.tamago > 0 && this.save.inventory.tamagoSushi < 8;
    const makeRect = { x: rect.x + 24, y: rect.y + 212, width: rect.width - 48, height: 43 };
    this.drawButton(makeRect, { label: canMake ? '点击制作玉子烧寿司' : '准备食材后制作', color: canMake ? '#ef9d55' : '#d0c7b5', disabled: !canMake });
    this.hitboxes.board = rect;

    const tray = { x: 939, y: 412, width: 202, height: 206 };
    fillRounded(ctx, tray.x, tray.y + 7, tray.width, tray.height, 22, '#704b3a');
    fillRounded(ctx, tray.x, tray.y, tray.width, tray.height - 7, 22, '#fff8dd');
    strokeRounded(ctx, tray.x, tray.y, tray.width, tray.height - 7, 22, '#744c35', 3);
    this.drawText('完成寿司', tray.x + 18, tray.y + 26, { size: 20, color: '#643e2a', weight: '900' });
    this.drawText(`${this.save.inventory.tamagoSushi} / 8`, tray.x + tray.width - 18, tray.y + 27, { size: 17, color: '#bc6633', align: 'right', weight: '900' });
    const count = this.save.inventory.tamagoSushi;
    for (let index = 0; index < Math.min(count, 4); index += 1) {
      const col = index % 2;
      const row = Math.floor(index / 2);
      this.drawContain(this.assets.get('tamagoNigiri'), tray.x + 18 + (col * 87), tray.y + 47 + (row * 70), 75, 58);
    }
  }

  renderCustomer() {
    const ctx = this.ctx;
    const card = { x: 950, y: 112, width: 268, height: 255 };
    fillRounded(ctx, card.x, card.y + 8, card.width, card.height, 24, '#77513b');
    fillRounded(ctx, card.x, card.y, card.width, card.height - 8, 24, '#fff7d9');
    strokeRounded(ctx, card.x, card.y, card.width, card.height - 8, 24, '#6f4a36', 3);
    this.drawContain(this.assets.get('customer'), card.x + 8, card.y + 56, 111, 164);
    this.drawText('顾客订单', card.x + 139, card.y + 34, { size: 20, color: '#63442f', weight: '900' });
    fillRounded(ctx, card.x + 136, card.y + 62, 106, 94, 16, '#f4e5b7');
    strokeRounded(ctx, card.x + 136, card.y + 62, 106, 94, 16, '#b88d61', 2);
    this.drawContain(this.assets.get('tamagoNigiri'), card.x + 151, card.y + 71, 77, 59);
    this.drawText('玉子烧寿司 ×1', card.x + 139, card.y + 181, { size: 15, color: '#906040', weight: '900' });
    const serve = { x: card.x + 132, y: card.y + 202, width: 116, height: 39 };
    this.drawButton(serve, { label: '出餐 +12', color: this.save.inventory.tamagoSushi ? '#69ba9d' : '#d1c7b8', disabled: !this.save.inventory.tamagoSushi });
    this.hitboxes.customer = card;
  }

  renderRewardButton() {
    const rect = { x: 48, y: 110, width: 292, height: 66 };
    const configured = this.rewardedAd.isConfigured();
    const remaining = this.remainingCooldown();
    const disabled = this.adBusy || remaining > 0;
    const label = disabled && remaining ? `冷却中 ${this.formatCooldown()}` : '观看广告领贝壳';
    const sublabel = configured ? `完整观看可得 ${REWARDED_AD.rewardShells} 贝壳` : '等待填写微信广告位';
    this.drawButton(rect, { label, sublabel, color: configured ? '#4db5b3' : '#b5a897', disabled });
    this.hitboxes.reward = rect;
  }

  renderNotice() {
    if (!this.notice || Date.now() >= this.noticeUntil) return;
    const ctx = this.ctx;
    const width = clamp((this.notice.length * 26) + 68, 250, 700);
    const x = (W - width) / 2;
    const y = 103;
    fillRounded(ctx, x, y, width, 48, 18, 'rgba(45, 77, 70, .90)');
    this.drawText(this.notice, W / 2, y + 25, { size: 19, color: '#fffce7', align: 'center', weight: '800' });
  }

  handleTouch(point) {
    if (!this.ready) return;
    if (this.screen === 'menu') {
      if (pointInRect(point, this.hitboxes.start)) {
        this.screen = 'kitchen';
        this.setNotice('第一位顾客想要玉子烧寿司！');
      }
      return;
    }
    if (pointInRect(point, this.hitboxes.back)) {
      this.screen = 'menu';
      return;
    }
    if (pointInRect(point, this.hitboxes.rice)) {
      if (this.save.inventory.rice >= 8) this.setNotice('米饭已经放满了。');
      else {
        this.save.inventory.rice += 1;
        this.persist();
        this.setNotice('取到一份米饭。');
      }
      return;
    }
    if (pointInRect(point, this.hitboxes.tamago)) {
      if (this.save.inventory.tamago >= 8) this.setNotice('玉子烧已经放满了。');
      else {
        this.save.inventory.tamago += 1;
        this.persist();
        this.setNotice('取到一份玉子烧。');
      }
      return;
    }
    if (pointInRect(point, this.hitboxes.board)) {
      if (this.save.inventory.tamagoSushi >= 8) this.setNotice('寿司托盘已经满了。');
      else if (!this.save.inventory.rice || !this.save.inventory.tamago) this.setNotice('还需要一份米饭和一份玉子烧。');
      else {
        this.save.inventory.rice -= 1;
        this.save.inventory.tamago -= 1;
        this.save.inventory.tamagoSushi += 1;
        this.persist();
        this.setNotice('玉子烧寿司做好了！');
      }
      return;
    }
    if (pointInRect(point, this.hitboxes.customer)) {
      if (!this.save.inventory.tamagoSushi) this.setNotice('先做好一份玉子烧寿司。');
      else {
        this.save.inventory.tamagoSushi -= 1;
        this.save.shells += 12;
        this.persist();
        this.setNotice('出餐成功，顾客留下了 12 贝壳！');
      }
      return;
    }
    if (pointInRect(point, this.hitboxes.reward)) this.watchRewardedAd();
  }

  async watchRewardedAd() {
    if (this.adBusy) return;
    if (this.remainingCooldown() > 0) {
      this.setNotice(`奖励冷却中，还需 ${this.formatCooldown()}。`);
      return;
    }
    if (!this.rewardedAd.isConfigured()) {
      this.setNotice('请先在小游戏后台创建广告位并填入 adUnitId。', 3600);
      return;
    }
    this.adBusy = true;
    this.setNotice('正在加载激励视频…');
    const result = await this.rewardedAd.show();
    this.adBusy = false;
    if (!result.rewarded) {
      this.setNotice(result.reason === 'closed' ? '没有完整观看，本次不发放奖励。' : '暂时没有可播放的广告，请稍后再试。');
      return;
    }
    this.save.shells += REWARDED_AD.rewardShells;
    this.save.rewardCooldownEndsAt = Date.now() + REWARDED_AD.cooldownMs;
    this.persist();
    this.setNotice(`完整观看成功，获得 ${REWARDED_AD.rewardShells} 贝壳！`, 3600);
  }
}

module.exports = { KitchenScene };
