class SimpleDB {
    constructor(name) {
        this.name = name;
        if (localStorage[name] == null) {
            this.elements = {}; 
            this.lastId = 0;
            this._writeStorage();
        } else {
            this._readStorage();
        }

    }

    getList(n) {
        this._readStorage();
        if (n == null) {
            return Object.values(this.elements);
        }
        return Object.values(this.elements).slice(0, n);
    }

    get(id) {
        this._readStorage();
        if (id == null) {
            return this.getList();
        } else if (id in this.elements) {
            return this.elements[id];
        }
        return false;
    }

    update(id, el) {
        this._readStorage();
        if (!(id in this.elements)) {
            throw new Error(`Element not found in DB ${this.name}`);
        }
        this.elements[id] = el;
        this.elements[id].id = id;
        this._writeStorage();
        return this.elements[id];
    }

    insert(el) {
        this._readStorage();
        this.elements[this.lastId] = el;
        this.elements[this.lastId].id = this.lastId; 
        const out = this.elements[this.lastId];
        this.lastId++;
        this._writeStorage();
        return out;
    }

    delete(id) {
        this._readStorage();
        let out = false;
        if (id in this.elements) {
            out = true;
            if (id === this.lastId) {
                this.lastId--;
            }
        }
        delete this.elements[id];
        this._writeStorage();
        return out;
    }

    _readStorage() {
        this.elements = JSON.parse(localStorage[this.name]);
        this.lastId = parseInt(localStorage[`${this.name}-lastId`]);
    }

    _writeStorage() {
        localStorage[this.name] = JSON.stringify(this.elements); 
        localStorage[`${this.name}-lastId`] = this.lastId;
    }

    get size() {
        this._readStorage();
        return Object.keys(this.elements).length;
    }
}

export default SimpleDB;
