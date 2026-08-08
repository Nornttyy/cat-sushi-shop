const { APP } = require('../config');

const emptyInventory = () => ({ rice: 0, tamago: 0, tamagoSushi: 0 });

function defaultSave() {
  return {
    version: 1,
    shells: 0,
    inventory: emptyInventory(),
    rewardCooldownEndsAt: 0,
  };
}

function count(value, maximum = 999) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(maximum, Math.floor(parsed))) : 0;
}

function normalizeSave(value) {
  const fallback = defaultSave();
  if (!value || typeof value !== 'object') return fallback;
  const inventory = value.inventory && typeof value.inventory === 'object' ? value.inventory : {};
  return {
    version: 1,
    shells: count(value.shells, 999999),
    inventory: {
      rice: count(inventory.rice, 8),
      tamago: count(inventory.tamago, 8),
      tamagoSushi: count(inventory.tamagoSushi, 8),
    },
    rewardCooldownEndsAt: Math.max(0, Number(value.rewardCooldownEndsAt) || 0),
  };
}

function loadSave() {
  try {
    return normalizeSave(wx.getStorageSync(APP.saveKey));
  } catch (error) {
    return defaultSave();
  }
}

function saveGame(value) {
  const next = normalizeSave(value);
  try {
    wx.setStorageSync(APP.saveKey, next);
  } catch (error) {
    // 磁盘空间不足时继续保留内存状态，避免中断本局游戏。
  }
  return next;
}

module.exports = { defaultSave, loadSave, saveGame };
