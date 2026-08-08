class Assets {
  constructor() {
    this.images = new Map();
  }

  load(name, source) {
    if (this.images.has(name)) return this.images.get(name).promise;
    const image = wx.createImage();
    const record = { image, ready: false, failed: false, promise: null };
    record.promise = new Promise((resolve) => {
      image.onload = () => { record.ready = true; resolve(record); };
      image.onerror = () => { record.failed = true; resolve(record); };
      image.src = source;
    });
    this.images.set(name, record);
    return record.promise;
  }

  get(name) {
    const record = this.images.get(name);
    return record?.ready ? record.image : null;
  }

  async preload(entries) {
    await Promise.all(entries.map(([name, source]) => this.load(name, source)));
  }
}

module.exports = { Assets };
