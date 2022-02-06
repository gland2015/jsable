import "./index.d";

import { getObjPropFn } from "../parseObjPath";

export class ItemTree<T = any> {
  constructor(list: Array<T>, options?: ItemTreeOptions<T>) {
    this.tree = list;
    const { getId, getChild } = buildOptions(options);
    this.getId = getId;
    this.getChild = getChild;
  }

  public tree: Array<T>;
  private getId: (o: T) => string | number;
  private getChild: (o: T) => Array<T>;

  public iterat(fn: iteratFn<T>, initData?) {
    // 父在子之前遍历
    let path = [0];
    let isEnd = false;
    let isStopDown = false;
    const context = {
      path,
      end() {
        isEnd = true;
      },
      stop() {
        isStopDown = true;
      },
    };

    const iterator = (list, pData, path) => {
      for (let i = 0; i < list.length; i++) {
        path[path.length - 1] = i;
        let item = list[i];
        let childList = this.getChild(item);
        path.push(0);
        let subData = fn(item, pData, context);
        path.pop();

        if (isEnd) {
          return;
        }
        if (isStopDown) {
          isStopDown = false;
          continue;
        }
        if (childList?.length) {
          iterator(childList, subData, context);
          if (isEnd) {
            return;
          }
        }
      }
    };

    iterator(this.tree, initData, path);
  }

  public iteratUp(fn: iteratUpFn<T>) {
    // 子在父之前遍历
    let isEnd = false;
    let isStopUp = false;

    const path = [0];
    const context = {
      path,
      end() {
        isEnd = true;
      },
      stop() {
        isStopUp = true;
      },
    };

    const iterator = (list, path) => {
      let result = [];

      for (let i = 0; i < list.length; i++) {
        path[path.length - 1] = i;
        let item = list[i];
        let subList = this.getChild(item);

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

    return iterator(this.tree, path);
  }

  // 收集每个元素的数据
  private itemValue;
  private itemKeys = {} as any;
  public itemData(key) {
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
  public unItemData(key) {
    if (key) {
      delete this.itemKeys[key];
    } else {
      this.itemKeys = {};
      this.itemValue = null;
    }
    return this;
  }

  // 收集树的整体数据
  private entireValue;
  private entireKeys = {} as any;
  public entireData(key) {
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
  public unEntireData(key) {
    if (key) {
      delete this.entireKeys[key];
    } else {
      this.entireKeys = {};
      this.entireValue = null;
    }
    return this;
  }

  public collect(colItemFn) {
    // 保存向上搜索和向下搜索的函数信息
    const upInfo = {
      need: false,
      num: 0,
      list: [],
    };
    const downInfo = {
      need: false,
      num: 0,
      list: [],
    };

    const totalInfo = {
      hasItemFn: false,
      hasUpItem: false,
    };

    // 统一添加搜索函数信息
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
      totalInfo.hasItemFn = true;

      // saveData - 主要是为了区分整体数据和key数据
      // fn_value 值函数返回的数据,
      // data 前面的数据
      const fnItem = {
        context: {
          end: null,
        },
        fnInfo: this.itemValue.fnInfo,
        saveItemData(fn_value, data) {
          return fn_value;
        },
      };
      pushFnItem(fnItem, this.itemValue.type);
    } else {
      for (const key in this.itemKeys) {
        totalInfo.hasItemFn = true;
        let keyItem = this.itemKeys[key];
        if (!keyItem) {
          continue;
        }
        const fnItem = {
          context: {
            end: null,
          },
          fnInfo: keyItem.fnInfo,
          saveItemData(fn_value, data) {
            if (!data) {
              data = {};
            }
            data[key] = fn_value;
            return data;
          },
        };
        pushFnItem(fnItem, keyItem.type);
        // todo
        if (keyItem.type === "up") {
          totalInfo.hasUpItem = true;
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
        saveEntireData(fn_value) {
          entireData = fn_value;
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
          saveEntireData(fn_value) {
            if (!entireData) {
              entireData = {};
            }
            entireData[key] = fn_value;
          },
        };

        if (downInfo.num || !upInfo.num) {
          pushFnItem(fnItem, "down");
        } else {
          pushFnItem(fnItem, "up");
        }
      }
    }

    upInfo.need = Boolean(upInfo.num);
    downInfo.need = Boolean(downInfo.num);

    if (upInfo.need) {
      const topList = this.iteratUp((item, listData, context) => {
        // 数量减为0
        let r = { fnDataList: null, callback: null };
        let itData;
        const children = this.getChild(item);

        // 如果还存在向上函数
        if (upInfo.num) {
          r.fnDataList = upInfo.list.map((itemInfo, i) => {
            // 已调用end
            if (!itemInfo) {
              return null;
            }
            const fnInfo = itemInfo.fnInfo;
            // 获取计算结果
            const fn_value = fnInfo.fn(item, listData ? listData.map((o) => o[i].fnDataList) : null, children, itemInfo.context);

            let value = fn_value;
            // 获取保存结果
            if (fnInfo.getValue) {
              value = fnInfo.getValue(value);
            }
            if (itemInfo.saveEntireData) {
              itemInfo.saveEntireData(value);
            } else {
              itData = itemInfo.setItemData(value, itData);
            }

            return fn_value;
          });
        }

        if (downInfo.need) {
          // 保存回调等待父数据调用
          r.callback = (pData, pItem) => {
            let downData = downInfo.list.map((itemInfo, i) => {
              // 已调用
              if (!itemInfo) {
                return null;
              }
              const fnInfo = itemInfo.fnInfo;
              // 获取计算结果
              let fn_value = fnInfo.fn(item, pData ? pData[i] : null, pItem, itemInfo.context);

              let value = fn_value;
              if (fnInfo.getValue) {
                value = fnInfo.getValue(value);
              }

              // 保存结果
              if (itemInfo.setEntireValue) {
                itemInfo.setEntireValue(value);
              } else {
                itData = itemInfo.setItemValue(value, itData);
              }

              return fn_value;
            });

            // 向下调用, 如果还存在向下函数
            if (downInfo.num) {
              downInfo.list.forEach((itemInfo, i) => {
                if (!itemInfo) {
                  return null;
                }
                return listData[i].callback(downData, pItem);
              });
            }

            if (totalInfo.hasItemFn) {
              colItemFn(item, itData);
            }
          };
        } else if (totalInfo.hasItemFn) {
          colItemFn(item, itData);
        } else {
          context.end();
        }

        return r;
      });

      // 启动调用
      if (downInfo.need) {
        topList.forEach(function (data) {
          if (data?.callback) {
            data.callback(null, null);
          }
        });
      }
    } else if (downInfo.need) {
      this.iterat((item, pData, context) => {
        if (!downInfo.num) {
          context.end();
          return;
        }

        let itData;
        let listR = downInfo.list.map((itemInfo, i) => {
          if (!itemInfo) {
            return null;
          }
          const fnInfo = itemInfo.fnInfo;
          let fn_data = fnInfo.fn(item, pData ? pData.data[i] : null, pData ? pData.pItem : null, itemInfo.context);

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

        if (totalInfo.hasItemFn) {
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

  private buildFindInfo(value) {
    if (typeof value === "function") {
      return value;
    }
    return (o) => {
      return this.getId(o) === value;
    };
  }

  public find(info: filterInfo<T>): Array<T> {
    const list = [];

    const fn = this.buildFindInfo(info);
    this.iterat((item, pData, context) => {
      if (fn(item)) {
        list.push(item);
      }
    });
    return list;
  }

  public findOne(info: filterInfo<T>): Array<T> {
    let r;

    const fn = this.buildFindInfo(info);
    this.iterat((item, pData, context) => {
      if (fn(item)) {
        r = item;
        context.end();
      }
    });
    return r;
  }

  
}

class ItemAction<T> {
  constructor(that: T, set) {
    this.that = that;
    this.set = set;
  }

  private that: T;
  private set;

  someChild(fn, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "up",
      fnInfo: {
        getValue: (o) => Boolean(o.val),
        fn: (item, listData, childList) => {
          let val;
          let itemVal;
          let hasImV;

          if (shallow) {
            val = listData.some((o, i) => {
              if (o.hasImV) {
                return o.itemVal;
              }
              return fn(childList[i]);
            });
          } else {
            val = listData.some((o) => {
              return o.val;
            });
          }

          if (!val && self) {
            itemVal = fn(item);
            hasImV = true;
            val = itemVal;
          }
          return { val, itemVal, hasImV };
        },
      },
    };
    this.set(data);
    return this.that;
  }

  everyChild(fn, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "up",
      fnInfo: {
        getValue: (o) => Boolean(o.val),
        fn: (item, listData, childList) => {
          let val;
          let itemVal;
          let hasImV;

          if (self) {
            itemVal = fn(item);
            hasImV = true;
          }

          if (!hasImV || itemVal) {
            if (shallow) {
              val = listData.every((o, i) => {
                if (o.hasImV) {
                  return o.itemVal;
                }
                return fn(childList[i]);
              });
            } else {
              val = listData.every((o) => {
                return o.val;
              });
            }
          }

          return { val, itemVal, hasImV };
        },
      },
    };
    this.set(data);
    return this.that;
  }

  reduceChild(rValueValue, itemToValue, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "up",
      fnInfo: {
        getValue: (o) => o.val,
        fn: (item, listData, childList) => {
          let val;
          let itemVal;
          let hasImV;

          if (self) {
            itemVal = itemToValue(item);
            hasImV = true;
            val = itemVal;
          }

          listData.forEach((o, i) => {
            let oVal;
            if (shallow) {
              oVal = o.hasImV ? o.itemVal : itemToValue(childList[i]);
            } else {
              if (self) {
                oVal = o.val;
              } else {
                oVal = o.hasImV ? o.itemVal : itemToValue(childList[i]);
                oVal = rValueValue(oVal, o.val);
              }
            }
            if (i === 0) {
              if (hasImV) {
                val = rValueValue(itemVal, oVal);
              } else {
                val = oVal;
              }
            } else {
              val = rValueValue(val, oVal);
            }
          });

          return { val, itemVal, hasImV };
        },
      },
    };

    this.set(data);
    return this.that;
  }

  someParent(fn, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "down",
      fnInfo: {
        getValue: (o) => Boolean(o.val),
        fn: (item, pData, pItem) => {
          let val = false;
          let itemVal;
          let hasImV;

          if (self) {
            itemVal = fn(item);
            hasImV = true;
          }

          if (itemVal) {
            val = true;
          } else {
            if (shallow) {
              if (pData) {
                val = pData.hasImV ? pData.itemVal : fn(pItem);
              } else {
                val = false;
              }
            } else {
              val = pData ? pData.val : false;
            }
          }

          return { val, itemVal, hasImV };
        },
      },
    };

    this.set(data);
    return this.that;
  }

  everyParent(fn, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "down",
      fnInfo: {
        getValue: (o) => Boolean(o.val),
        fn: (item, pData, pItem) => {
          let val;
          let itemVal;
          let hasImV;

          if (self) {
            itemVal = fn(item);
            hasImV = true;
          }

          if (!self || itemVal) {
            if (shallow) {
              if (pData) {
                val = pData.hasImV ? pData.itemVal : fn(pItem);
              } else {
                val = true;
              }
            } else {
              val = pData ? pData.val : true;
            }
          }

          return { val, itemVal, hasImV };
        },
      },
    };

    this.set(data);
    return this.that;
  }

  reduceParent(rValueValue, itemToValue, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "down",
      fnInfo: {
        getValue: (o) => o.val,
        fn: (item, pData, pItem) => {
          let val;
          let itemVal;
          let hasImV;

          if (self) {
            itemVal = itemToValue(item);
            hasImV = true;
          }

          if (pData) {
            let pItVal = pData.hasImV ? pData.itemVal : itemToValue(pItem);
            if (shallow) {
              val = self ? rValueValue(itemVal, pItVal) : pItVal;
            } else {
              val = self ? rValueValue(itemVal, pData.val) : rValueValue(pItVal, pData.val);
            }
          } else {
            val = itemVal;
          }

          return { val, itemVal, hasImV };
        },
      },
    };

    this.set(data);
    return this.that;
  }
}

class EntireAction<T> {
  constructor(that: T, set) {
    this.that = that;
    this.set = set;
  }
  private that: T;
  private set;

  some(fn) {
    const data = {
      fnInfo: {
        fn: (item, args1, args2, context) => {
          if (fn(item)) {
            context.end();
            return true;
          }
          return false;
        },
      },
    };
    this.set(data);
    return this.that;
  }

  every(fn) {
    const data = {
      fnInfo: {
        fn: (item, args1, args2, context) => {
          if (fn(item)) {
            return true;
          }
          context.end();
          return false;
        },
      },
    };

    this.set(data);
    return this.that;
  }

  reduce(fn, initValue) {
    let value = initValue;

    const data = {
      fnInfo: {
        fn: (item, args1, args2, context) => {
          value = fn(item, value);
          return value;
        },
      },
    };

    this.set(data);
    return this.that;
  }
}

function buildOptions(options) {
  let { id = "id", children = "children" } = options || {};

  return {
    getId: buildGet(id),
    getChild: buildGet(children),
  };

  function buildGet(value) {
    if (typeof value === "function") {
      return value;
    }
    if (typeof value === "string") {
      return getObjPropFn(value).get;
    }
    return function (o) {
      return o[value];
    };
  }
}
