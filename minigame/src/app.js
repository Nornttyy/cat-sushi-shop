const { APP } = require('./config');
const { Assets } = require('./core/assets');
const { KitchenScene } = require('./scenes/kitchen');

function getWindowInfo() {
  const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  return {
    width: info.windowWidth || info.screenWidth,
    height: info.windowHeight || info.screenHeight,
    pixelRatio: info.pixelRatio || 1,
  };
}

class MiniGameApp {
  constructor() {
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.assets = new Assets();
    this.scene = new KitchenScene({ ctx: this.ctx, assets: this.assets });
    this.view = { width: APP.designWidth, height: APP.designHeight, scale: 1, offsetX: 0, offsetY: 0, pixelRatio: 1 };
    this.frameId = null;
    this.requestFrame = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (callback) => setTimeout(() => callback(Date.now()), 16);
    this.render = this.render.bind(this);
  }

  resize() {
    const screen = getWindowInfo();
    const scale = Math.min(screen.width / APP.designWidth, screen.height / APP.designHeight);
    const renderedWidth = APP.designWidth * scale;
    const renderedHeight = APP.designHeight * scale;
    this.view = {
      width: screen.width,
      height: screen.height,
      pixelRatio: screen.pixelRatio,
      scale,
      offsetX: (screen.width - renderedWidth) / 2,
      offsetY: (screen.height - renderedHeight) / 2,
    };
    this.canvas.width = Math.round(screen.width * screen.pixelRatio);
    this.canvas.height = Math.round(screen.height * screen.pixelRatio);
  }

  toDesignPoint(touch) {
    const x = touch.clientX ?? touch.pageX ?? touch.x ?? 0;
    const y = touch.clientY ?? touch.pageY ?? touch.y ?? 0;
    return {
      x: (x - this.view.offsetX) / this.view.scale,
      y: (y - this.view.offsetY) / this.view.scale,
    };
  }

  render() {
    const { ctx, canvas, view } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.pixelRatio * view.scale, 0, 0, view.pixelRatio * view.scale, view.offsetX * view.pixelRatio, view.offsetY * view.pixelRatio);
    this.scene.render();
    this.frameId = this.requestFrame(this.render);
  }

  async start() {
    this.resize();
    wx.setPreferredFramesPerSecond?.(60);
    wx.onWindowResize?.(() => this.resize());
    wx.onTouchEnd((event) => {
      const touch = event.changedTouches?.[0] || event.touches?.[0];
      if (touch) this.scene.handleTouch(this.toDesignPoint(touch));
    });
    this.render();
    try {
      await this.scene.load();
    } catch (error) {
      wx.showModal?.({ title: APP.title, content: '素材加载失败，请重新打开小游戏。', showCancel: false });
    }
  }
}

module.exports = { MiniGameApp };
