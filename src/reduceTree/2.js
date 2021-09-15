class ItemTree {
  constructor(tree, childKey, idKey) {
    this.tree = tree;
    this.childKey = childKey;
    this.idKey = idKey;
  }

  iterat(fn, initData) {
    // 父在子之前遍历
    let path = [0];
    let isEnd = false;
    let isStopDown = false;
    const context = {
      path,
      end() {
        isEnd = true;
      },
      stopDown() {
        isStopDown = true;
      },
    };

    const iterator = (subList, pData, path) => {
      for (let i = 0; i < subList.length; i++) {
        let item = subList[i];
        let subList = item[this.childKey];
        let subData = fn(item, pData, context);
        if (isEnd) {
          return;
        }
        if (isStopDown) {
          isStopDown = false;
          continue;
        }
        if (subList?.length) {
          path.push(0);
          iterator(subList, subData, context);
          path.pop();
          if (isEnd) {
            return;
          }
        }
      }
    };

    iterator(this.tree, initData, path);
  }

  iteratUp(fn) {
    // 子在父之前遍历
    let isEnd = false;
    let isStopUp = false;

    const path = [0];
    const context = {
      path,
      end() {
        isEnd = true;
      },
      stopUp() {
        isStopUp = true;
      },
    };

    const iterator = (list, path) => {
      let result = [];
      let pl = path.length - 1;
      for (let i = 0; i < list.length; i++) {
        path[pl] = i;
        let item = list[i];
        let subList = item[this.childKey];

        let subData = [];
        if (subList?.length) {
          path.push(0);
          subData = iterator(subList, path);
          path.pop();
          if (isEnd) {
            return;
          }
          if (isStopUp) {
            if (path.length === 1) {
              isStopUp = false;
              continue;
            } else {
              return;
            }
          }
        }

        let data = fn(item, subData, context);
        if (isEnd) {
          return;
        }
        if (isStopUp) {
          if (path.length === 1) {
            isStopUp = false;
            continue;
          } else {
            return;
          }
        }
        result.push(data);
      }
      return result;
    };

    iterator(this.tree, path);
  }

  itemValue;
  itemKeys = {
    key1: {},
  };
  itemData(key) {
    const that = this;
    const set = (type, fn, options) => {};
    return {
      someChild(fn) {},
    };
  }

  entireValue;
  entireKeys = {};
  entireData(key) {}

  collect(fn) {
    if (this.itemValue) {
    }

    this.iterat((item, pData, context) => {}, null);

    this.iteratUp((item, listData, context) => {});
  }
}

class ItemAction {
  constructor(that, set) {
    this.that = that;
    this.set = set;
  }

  someChild(fn, options) {
    this.set(type, fn, options);
    let data = {
      type: "up",
      interFn: null,
    };

    options = {
      includeSelf: false,
      excludeSun: false,
    };

    data = {
      type: "up",
      needData: {
        listData: true,
        childList: false,
      },
      interFn: (item, childListData, childList) => {
        if (options.includeSelf) {
          if (fn(item)) {
            return true;
          }
        }

        if (options.excludeSun) {
          return childList.some((o) => {
            return fn(o);
          });
        } else {
          return childListData.some(Boolean);
        }
      },
    };
    return this.that;
  }

  everyChild(fn, options) {
    options = {
      includeSelf: false,
      excludeSun: false,
    };

    data = {
      type: "up",
      interFn: (item, childListData, childList) => {
        if (options.includeSelf) {
          if (!fn(item)) {
            return false;
          }
        }

        if (options.excludeSun) {
          return childList.every((o) => {
            return fn(o);
          });
        } else {
          return childListData.every(Boolean);
        }
      },
    };
  }

  reduceChild(rValueValue, itemToValue, options) {
    options = {
      initValue: undefined,
      includeSelf: false,
      excludeSun: false,
    };

    data = {
      type: "up",
      interFn: (item, childListData, childList) => {
        let value;
        let hasValue = false;
        if (options.includeSelf) {
          value = itemToValue(item);
          hasValue = true;
        }

        if (options.excludeSun) {
          childList.forEach((o) => {
            let v = itemToValue(o);
            if (hasValue) {
              value = rValueValue(value, v);
            } else {
              hasValue = true;
              value = v;
            }
          });
        } else {
          childListData.forEach((v) => {
            value = rValueValue(v);
          });
        }

        return value;
      },
    };
  }

  someParent(fn, options) {
    data = {
      type: "down",
      interFn: (item, pData) => {
        if (options.includeSelf) {
          if (!fn(item)) {
            return false;
          }
        }

        if (options.excludeSun) {
          return childList.every((o) => {
            return fn(o);
          });
        } else {
          return childListData.every(Boolean);
        }
      },
    };
  }

  everyParent(fn, options) {}

  reduceParent(fn, options) {}
}
