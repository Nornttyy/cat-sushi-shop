const APP = Object.freeze({
  title: '海边寿司店',
  designWidth: 1280,
  designHeight: 720,
  saveKey: 'seaside-sushi-shop.wechat-minigame.v1',
});

const REWARDED_AD = Object.freeze({
  // 在微信小游戏后台创建“激励视频广告”后，把广告位 ID 填在这里。
  // 留空时，游戏会提示广告尚未配置，且绝不会发放奖励。
  adUnitId: '',
  rewardShells: 30,
  cooldownMs: 10 * 60 * 1000,
});

module.exports = { APP, REWARDED_AD };
