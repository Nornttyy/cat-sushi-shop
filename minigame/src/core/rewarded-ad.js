const { REWARDED_AD } = require('../config');

class RewardedAd {
  constructor({ adUnitId = REWARDED_AD.adUnitId } = {}) {
    this.adUnitId = adUnitId;
    this.instance = null;
  }

  isConfigured() {
    return Boolean(this.adUnitId && /^adunit-[A-Za-z0-9]+$/.test(this.adUnitId));
  }

  prepare() {
    if (!this.isConfigured() || !wx.createRewardedVideoAd) return null;
    if (this.instance) return this.instance;
    try {
      const instance = wx.createRewardedVideoAd({ adUnitId: this.adUnitId });
      if (!instance) return null;
      this.instance = instance;
      return this.instance;
    } catch (error) {
      // 广告后台未开通、广告位错误等问题不能阻断小游戏启动。
      this.instance = null;
      return null;
    }
  }

  async show() {
    const ad = this.prepare();
    if (!ad) return { rewarded: false, reason: this.isConfigured() ? 'unavailable' : 'unconfigured' };

    return new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        ad.offClose?.(finish);
        ad.offError?.(fail);
      };
      const finish = (result) => {
        if (settled) return;
        settled = true;
        cleanup();
        // 旧基础库的关闭回调可能没有 result；此时微信视为完整播放。
        resolve({ rewarded: result === undefined || result?.isEnded === true, reason: 'closed' });
      };
      const fail = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve({ rewarded: false, reason: 'unavailable' });
      };
      ad.onClose?.(finish);
      ad.onError?.(fail);
      const show = async () => {
        try {
          await ad.show();
        } catch (firstError) {
          try {
            await ad.load();
            await ad.show();
          } catch (secondError) {
            fail();
          }
        }
      };
      show();
    });
  }
}

module.exports = { RewardedAd };
