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
