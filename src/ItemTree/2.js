import { ItemAction } from "./itemAction";
import { EntireAction } from "./entireAction";
import { TreeData } from "./treeData";

export class ItemTree {
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
  itemKeys = {};
  itemData(key) {
    const that = this;
    const set = (data) => {
      if (key) {
        this.itemKeys[key] = data;
      } else {
        this.itemValue = data;
      }
    };
    return new ItemAction(that, set);
  }
  unItemData(key) {
    if (key) {
      delete this.itemKeys[key];
    } else {
      this.itemKeys = {};
      this.itemValue = null;
    }
  }

  entireValue;
  entireKeys = {};
  entireData(key) {
    const that = this;
    const set = (data) => {
      if (key) {
        this.entireKeys[key] = data;
      } else {
        this.entireValue = data;
      }
    };

    return new EntireAction(that, set);
  }
  unEntireData(key) {
    if (key) {
      delete this.entireKeys[key];
    } else {
      this.entireKeys = {};
      this.entireValue = null;
    }
  }

  collect(colItemFn) {
    let result;
    const upInfo = {
      num: 0,
      list: [],
    };
    const downInfo = {
      num: 0,
      list: [],
    };

    let hasItemFn = false;
    let hasUpItem = false;

    const pushFnItem = (fnItem, type) => {
      if (type === "up") {
        const index = upInfo.num;
        fnItem.context.end = () => {
          if (upInfo.list[index]) {
            upInfo.list[index] = null;
            upInfo.num--;
          }
        };
        upInfo.list.push(fnItem);
        upInfo.num++;
      } else {
        const index = downInfo.num;
        fnItem.context.end = () => {
          if (downInfo.list[index]) {
            downInfo.list[index] = null;
            downInfo.num--;
          }
        };
        downInfo.list.push(fnItem);
        downInfo.num++;
      }
    };
    if (this.itemValue) {
      hasItemFn = true;
      const fnItem = {
        context: {
          end: null,
        },
        fnInfo: this.itemValue.fnInfo,
        setItemValue(fn_data, oldValue) {
          return fn_data;
        },
      };
      pushFnItem(fnItem, this.itemValue.type);
    } else {
      for (const key in this.itemKeys) {
        hasItemFn = true;
        let keyItem = this.itemKeys[key];
        if (!keyItem) {
          continue;
        }
        const fnItem = {
          context: {
            end: null,
          },
          fnInfo: keyItem.fnInfo,
          setItemValue(fn_value, oldValue) {
            if (!oldValue) {
              oldValue = {};
            }
            oldValue[key] = fn_value;
            return oldValue;
          },
        };
        pushFnItem(fnItem, keyItem.type);
        if (keyItem.type === "up") {
          hasUpItem = true;
        }
      }
    }

    let entireData;
    if (this.entireValue) {
      const fnItem = {
        context: {
          end: null,
        },
        fnInfo: this.entireValue.fnInfo,
        setEntireValue(fn_data) {
          entireData = fn_data;
        },
      };

      if (downInfo.num || !upInfo.num) {
        pushFnItem(fnItem, "down");
      } else {
        pushFnItem(fnItem, "up");
      }
    } else {
      for (const key in this.entireKeys) {
        let keyEntire = this.entireKeys[key];
        if (!keyEntire) {
          continue;
        }
        const fnItem = {
          context: {
            end: null,
          },
          fnInfo: keyEntire.fnInfo,
          setEntireValue(fn_data) {
            if (!entireData) {
              entireData = {};
            }
            entireData[key] = fn_data;
          },
        };

        if (downInfo.num || !upInfo.num) {
          pushFnItem(fnItem, "down");
        } else {
          pushFnItem(fnItem, "up");
        }
      }
    }

    let treeData = new TreeData();

    if (upInfo.num) {
      this.iteratUp((item, listData, context) => {
        if (!upInfo.num) {
          context.end();
          return;
        }

        let itData;
        let r = upInfo.list.map((itemInfo, i) => {
          if (!itemInfo) {
            return null;
          }
          const fnInfo = itemInfo.fnInfo;
          let fn_data = fnInfo.fn(
            item,
            listData ? listData.map((o) => o[i]) : null,
            item[this.childKey],
            itemInfo.context
          );

          let value = fn_data;
          if (fnInfo.getValue) {
            value = fnInfo.getValue(value);
          }

          if (itemInfo.setEntireValue) {
            itemInfo.setEntireValue(value);
          } else {
            itData = itemInfo.setItemValue(value, itData);
          }

          return fn_data;
        });

        if (downInfo.num) {
          if (hasUpItem) {
            treeData.set(context.path, itData);
          }
        } else if (hasItemFn) {
          colItemFn(item, itData);
        }

        return r;
      });
    }

    if (downInfo.num) {
      this.iterat((item, pData, context) => {
        if (!downInfo.num) {
          context.end();
          return;
        }

        let itData = hasUpItem ? treeData.get(context.path) : undefined;
        let listR = downInfo.list.map((itemInfo, i) => {
          if (!itemInfo) {
            return null;
          }
          const fnInfo = itemInfo.fnInfo;
          let fn_data = fnInfo.fn(
            item,
            pData ? pData.data[i] : null,
            pData ? pData.pItem : null,
            itemInfo.context
          );

          let value = fn_data;
          if (fnInfo.getValue) {
            value = fnInfo.getValue(value);
          }

          if (itemInfo.setEntireValue) {
            itemInfo.setEntireValue(value);
          } else {
            itData = itemInfo.setItemValue(value, itData);
          }

          return fn_data;
        });

        if (hasItemFn) {
          colItemFn(item, itData);
        }

        return {
          pItem: item,
          data: listR,
        };
      }, null);
    }

    return entireData;
  }

  // todo
  setIndexes() {}
  
  find() {}
  findOne() {}
  map() {}
  filter() {}
  clone() {}
  restore() {}

  get() {}
  set() {}

  select(id) {
    isParentOf;
    isChildOf;
    getDepth;
  }
}
