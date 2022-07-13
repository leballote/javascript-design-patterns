class SimpleDB {
  constructor(name) {
    this.name = name;
    if (localStorage[name] == null) {
      this.elements = {};
      this.lastId = 0;
      this.#writeStorage();
    } else {
      this.#readStorage();
    }
  }

  getList(n) {
    this.#readStorage();
    if (n == null) {
      return Object.values(this.elements);
    }
    return Object.values(this.elements).slice(0, n);
  }

  get(id) {
    this.#readStorage();
    if (id == null) {
      return this.getList();
    } else if (id in this.elements) {
      return { ...this.elements[id] };
    }
    return false;
  }

  update(id, el) {
    this.#readStorage();
    if (!(id in this.elements)) {
      throw new Error(`Element not found in DB ${this.name}`);
    }
    this.elements[id] = el;
    this.elements[id].id = id;
    this.#writeStorage();
    return { ...this.elements[id] };
  }

  insert(el) {
    this.#readStorage();
    if (el.id == null) {
      el.id = this.lastId++;
    }
    if (this.elements[el.id] != null) {
      throw new Error(`Element with id ${el.id} already exists`);
    }
    this.elements[el.id] = el;
    this.#writeStorage();
    return { ...this.elements[el.id] };
  }

  delete(id) {
    this.#readStorage();
    let out = null;
    if (!(id in this.elements)) return out;

    if (id === this.lastId) {
      this.lastId--;
    }

    out = { ...this.elements[id] };
    delete this.elements[id];
    this.#writeStorage();
    return out;
  }

  #readStorage() {
    this.elements = JSON.parse(localStorage[this.name]);
    this.lastId = parseInt(localStorage[`${this.name}-lastId`]);
  }

  #writeStorage() {
    localStorage[this.name] = JSON.stringify(this.elements);
    localStorage[`${this.name}-lastId`] = this.lastId;
  }

  get size() {
    this.#readStorage();
    return Object.keys(this.elements).length;
  }
}

export default SimpleDB;
