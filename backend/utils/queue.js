// backend/utils/queue.js
// Lightweight in-memory queue with basic concurrency.
// Safe for dev/testing and small workloads. Exports a singleton.

class SimpleQueue {
  constructor(concurrency = 3) {
    this.concurrency = Math.max(1, parseInt(concurrency, 10));
    this.running = 0;
    this.queue = [];
  }

  add(jobNameOrFn, jobData) {
    // support signature: add(fn) OR add(name, fn) OR add(name, data) if your code uses name
    let jobFn;
    if (typeof jobNameOrFn === 'function') {
      jobFn = jobNameOrFn;
    } else if (typeof jobData === 'function') {
      jobFn = jobData;
    } else {
      // fallback: create a no-op wrapper if jobData is provided as object.
      jobFn = async () => jobData;
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ jobFn, resolve, reject });
      setImmediate(() => this._next());
    });
  }

  async _next() {
    if (this.running >= this.concurrency) return;
    const item = this.queue.shift();
    if (!item) return;
    this.running++;
    try {
      const result = await item.jobFn();
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      this.running--;
      setImmediate(() => this._next());
    }
  }

  size() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

module.exports = new SimpleQueue(process.env.UPLOAD_QUEUE_CONCURRENCY || 3);
