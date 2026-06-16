// Лабораторна 4: двостороння черга з пріоритетами
// Дозволяє діставати елементи за пріоритетом (найвищий/найнижчий)
// та за порядком вставки (найстаріший/найновіший).

class BiPriorityQueue {
  constructor() {
    this.items = []; // { item, priority, seq }
    this.seq = 0;
  }

  enqueue(item, priority = 0) {
    this.items.push({ item, priority, seq: this.seq++ });
    return this;
  }

  get size() {
    return this.items.length;
  }

  // mode: "highest" | "lowest" | "oldest" | "newest"
  _indexFor(mode) {
    if (this.items.length === 0) return -1;
    let best = 0;
    for (let i = 1; i < this.items.length; i++) {
      const a = this.items[i], b = this.items[best];
      if (mode === "highest" && a.priority > b.priority) best = i;
      else if (mode === "lowest" && a.priority < b.priority) best = i;
      else if (mode === "oldest" && a.seq < b.seq) best = i;
      else if (mode === "newest" && a.seq > b.seq) best = i;
    }
    return best;
  }

  peek(mode = "highest") {
    const i = this._indexFor(mode);
    return i === -1 ? undefined : this.items[i].item;
  }

  dequeue(mode = "highest") {
    const i = this._indexFor(mode);
    if (i === -1) return undefined;
    return this.items.splice(i, 1)[0].item;
  }

  toArray(mode = "highest") {
    const copy = [...this.items];
    copy.sort((a, b) => {
      if (mode === "highest") return b.priority - a.priority || a.seq - b.seq;
      if (mode === "lowest") return a.priority - b.priority || a.seq - b.seq;
      if (mode === "oldest") return a.seq - b.seq;
      return b.seq - a.seq; // newest
    });
    return copy.map((e) => e.item);
  }
}

module.exports = { BiPriorityQueue };
