/**
 * 对一维或二维数组进行排序，传入第二个参数dim = 1 | 2，默认为1
 * 二维数组第一个元素为参考列，后续通过map可以更换
 */
class ArraySorter {
  constructor(target, dim: 1 | 2 = 1) {
    this.dim = dim;
    this.target = target;
    if (dim === 2) {
      if (!target || !Array.isArray(target[0])) {
        throw new Error("target is not 2 dim array");
      }
      let l = target[0].length;
      target.forEach((v) => {
        if (v.length !== l) {
          throw new Error("target sub array length is not equal");
        }
      });
      this.data = target[0];
    } else {
      this.data = target;
      if (!Array.isArray(target)) {
        throw new Error("target is not array");
      }
    }
  }

  private dim: 1 | 2;
  private indexes: Array<number>;
  private target: Array<any>;
  private data: Array<any>;
  private groupMap: Map<any, any>;

  map(fn) {
    let mapper;
    if (this.indexes) {
      mapper = (v, i) => {
        if (this.indexes[i] === null) {
          return null;
        }
        return fn(v, i, this.target);
      };
    } else {
      mapper = (v, i) => {
        return fn(v, i, this.target);
      };
    }
    this.data = this.data.map(mapper);
    return this;
  }

  group(fn) {
    this.groupMap = new Map();

    let indexes = this.indexes || [];
    let pusher = (i) => {
      let groupId = fn(this.data[i], i, this.target);
      if (!groupId) {
        indexes[i] = null;
        return;
      }
      let item = this.groupMap.get(groupId);
      if (!item) {
        item = {
          groupId,
          index: [],
        };
        this.groupMap.set(groupId, item);
      }
      item.index.push(i);
    };
    if (this.indexes) {
      this.indexes.forEach((v, i) => {
        if (v !== null) {
          pusher(i);
        }
      });
    } else {
      for (let i = 0; i < this.data.length; i++) {
        indexes[i] = i;
        pusher(i);
      }
    }
    this.indexes = indexes;
    return this;
  }

  filter(fn) {
    if (this.groupMap) {
      let indexes = this.data.map((v, i) => null);
      for (const item of this.groupMap.values()) {
        let isVaild = fn(
          item.index.map((v) => this.data[v]),
          item.index,
          this.target,
          item.groupId
        );
        if (isVaild) {
          item.index.forEach((v) => {
            indexes[v] = v;
          });
        } else {
          this.groupMap.delete(item.groupId);
        }
      }
      this.indexes = indexes;
    } else {
      if (this.indexes) {
        this.indexes.forEach((v, i) => {
          if (v !== null) {
            let isVaild = fn(this.data[v], v, this.target);
            if (!isVaild) {
              this.indexes[i] = null;
            }
          }
        });
      } else {
        this.indexes = this.data.map((v, i) => {
          let isVaild = fn(v, i, this.target);
          if (isVaild) {
            return i;
          }
          return null;
        });
      }
    }
    return this;
  }

  sort(fn) {
    const sortIndexes = (indexes) => {
      let indexes_ = indexes.concat();
      indexes_.sort((a, b) => {
        return fn(this.data[a], this.data[b]);
      });

      indexes.forEach((v, i) => {
        this.indexes[v] = indexes_[i];
      });
    };

    if (!this.indexes) {
      this.indexes = this.data.map((v, i) => i);
    }
    if (this.groupMap) {
      for (const item of this.groupMap.values()) {
        sortIndexes(item.index);
      }
    } else {
      let vaildIndexes = this.indexes.filter((v) => v !== null);
      sortIndexes(vaildIndexes);
    }

    let info = [];
    let target = this.dim === 2 ? this.target : [this.target];
    this.indexes.forEach((v, i) => {
      if (v === null || v === i) {
        return;
      }
      let arr = [i, target.map((o) => o[v])];
      info.push(arr);
    });

    info.forEach((arr) => {
      target.forEach((o, i) => {
        o[arr[0]] = arr[1][i];
      });
    });

    return this.target;
  }
}

export { ArraySorter };
