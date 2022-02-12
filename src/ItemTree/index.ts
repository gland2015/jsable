interface ItemTreeOptions<T> {
  id?: string | number | ((o: T) => string | number);
  children?: string | number | ((o: T) => Array<T>);
}

type BuildFlatOptions<T> = ItemTreeOptions<T> & {
  flatId?: string | number | ((o: any) => number | string);
  flatPid?: string | number | ((o: any) => number | string);
  setItem?: (o: any, childs: Array<T>) => T;
};

type BuildNestOptions<T> = ItemTreeOptions<T> & {
  rgt?: string | number | ((o: any) => number | string);
  lft?: string | number | ((o: any) => number | string);
  setItem?: (o: any, childs: Array<T>, level?: number) => T;
};

type iteratContext = {
  path: Array<number>;
  end: () => void;
  stop: () => void;
};

type iteratFn<T> = (item: T, pData?: any, context?: iteratContext) => any;

type iteratUpFn<T> = (item: T, subData?: Array<any>, context?: iteratContext) => any;

type Id = string | number;

import { getObjPropFn } from "../parseObjPath";
import { nestToItemTree, flatToItemTree, RelationType, getTypeChild } from "../treeUtils";

class TreeCore<T = any> {
  constructor(list: Array<T>, options?: ItemTreeOptions<T>) {
    this.tree = list;
    const { getId, getChild } = buildOptions(options);
    this.getId = getId;
    this.getChild = getChild;
  }

  public tree: Array<T>;

  public getId: (o: T) => string | number;
  public getChild: (o: T) => Array<T>;
}

abstract class TreeBase<T = any> {
  constructor() {}

  protected core: TreeCore<T>;
  protected abstract get tree(): Array<T>;
  protected map: {
    [key: string]: {
      pId: string | number;
      data: T;
    };
  };

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
        let childList = this.core.getChild(item);
        let subData = fn(item, pData, context);

        if (isEnd) {
          return;
        }
        if (isStopDown) {
          isStopDown = false;
          continue;
        }
        if (childList?.length) {
          path.push(0);
          iterator(childList, subData, path);
          path.pop();
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
        let subList = this.core.getChild(item);

        let subData = [];
        if (subList?.length) {
          path.push(0);
          subData = iterator(subList, path);
          path.pop();
          if (isEnd) {
            return result;
          }
          if (isStopUp) {
            if (path.length === 1) {
              result.push(null);
              isStopUp = false;
              continue;
            } else {
              return;
            }
          }
        }

        let data = fn(item, subData, context);
        if (isEnd) {
          return result;
        }
        if (isStopUp) {
          if (path.length === 1) {
            result.push(null);
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
        const children = this.core.getChild(item);

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

  public find(fn: (o: T) => boolean): Array<T> {
    const list = [];

    this.iterat((item, pData, context) => {
      if (fn(item)) {
        list.push(item);
      }
    });
    return list;
  }

  public findOne(info: string | number | ((o: T) => boolean)): T {
    let fn;
    if (typeof info !== "function") {
      if (this.map) {
        let item = this.map[info];
        return item ? item.data : null;
      } else {
        fn = (o) => {
          return this.core.getId(o) === info;
        };
      }
    } else {
      fn = info;
    }

    let r;
    this.iterat((item, pData, context) => {
      if (fn(item)) {
        r = item;
        context.end();
      }
    });
    return r;
  }

  /**
   * 设置或更新索引
   */
  public setIndex(obj?: T) {
    let tree = this.tree;
    if (obj) {
      this.removeIndex(this.core.getId(obj));
      tree = [obj];
    }

    if (!this.map) {
      this.map = {};
    }

    const set = (list: Array<T>, pId) => {
      if (list && list.length) {
        for (let i = 0; i < list.length; i++) {
          let o = list[i];
          let id = this.core.getId(o);
          let childs = this.core.getChild(o);

          this.map[id] = {
            pId,
            data: o,
          };

          set(childs, id);
        }
      }
    };
    set(tree, null);
  }

  /**
   * 移除索引
   */
  public removeIndex(id?: string | number) {
    if (id === undefined || id === null) {
      this.map = null;
      return;
    }

    const remove = (id) => {
      let obj = this.map[id];
      if (obj) {
        delete this.map[id];
        let childs = this.core.getChild(obj.data);
        if (childs && childs.length) {
          for (let i = 0; i < childs.length; i++) {
            remove(this.core.getId(childs[i]));
          }
        }
      }
    };

    remove(id);
  }

  protected _isParentOf(a: Id, b: Id, type?: RelationType) {
    type = type || "default";
    if (a === b) {
      if (type === "default" || type === "self-direct") {
        return true;
      }
      return false;
    }

    if (this.map) {
      let path = [];
      let id = b;
      let hasFindA = false;
      while (id !== null && id !== undefined) {
        path.push(id);
        let p = this.map[id];
        if (!p) {
          break;
        }
        id = p.pId;
        if (path.indexOf(id) !== -1) {
          break;
        }
        if (id === a) {
          hasFindA = true;
          break;
        }
      }

      if (!hasFindA) {
        return false;
      }

      return getTypeChild(path.length + 1, type);
    } else {
      let r = false;
      let hasFindA = false;
      // 依赖遍历方式，一枝一枝
      this.iterat((item, pData, context) => {
        let id = this.core.getId(item);
        if (hasFindA) {
          if (!pData) {
            context.end();
          } else if (id === b) {
            r = getTypeChild(pData.length, type);
            context.end();
          } else {
            return pData.concat(id);
          }
        } else {
          if (id === a) {
            hasFindA = true;
            return [a];
          } else if (id === b) {
            context.end();
          }
        }
      });
      return r;
    }
  }

  protected _isSlibingOf(a: Id, b: Id) {
    if (a === b) {
      return true;
    }

    if (this.map) {
      let pa = this.map[a];
      let pb = this.map[b];
      return Boolean(pa && pb && pa.pId === pb.pId);
    } else {
      let r = false;
      this.iterat((item, pData, context) => {
        let id = this.core.getId(item);

        if (id === a || id === b) {
          let list = pData || this.tree;
          let findTar = id === a ? b : a;
          let i = context.path[context.path.length - 1] + 1;
          for (; i < list.length; i++) {
            let oId = this.core.getId(list[i]);
            if (oId === findTar) {
              r = true;
              break;
            }
          }
          context.end();
          return;
        }
        return this.core.getChild(item);
      });
      return r;
    }
  }

  // 收集每个元素的数据
  private itemValue;
  private itemKeys = {} as any;
  // 收集树的整体数据
  private entireValue;
  private entireKeys = {} as any;
}

export class ItemTree<T = any> extends TreeBase<T> {
  constructor(list: Array<T>, options?: ItemTreeOptions<T>) {
    super();
    this.core = new TreeCore(list, options);
  }

  static fromFlat<T = any>(flatList: Array<any>, options: BuildFlatOptions<T>): ItemTree<T> {
    const { id, children, flatId = id, flatPid, setItem } = options || {};
    let itemList = [];
    if (flatList.length) {
      const getId = typeof flatId === "function" ? flatId : getObjPropFn(flatId || "id").get;
      const getPid = typeof flatPid === "function" ? flatPid : getObjPropFn(flatPid || "parentId").get;
      const getItem = typeof setItem === "function" ? setItem : (o, children, level) => ({ ...o, children, level });

      itemList = flatToItemTree(flatList, getId, getPid, getItem).tree;
    }
    return new ItemTree(itemList, { id, children });
  }

  static fromNest<T = any>(nestList: Array<any>, options?: BuildNestOptions<T>): ItemTree<T> {
    const { id, children, lft, rgt, setItem } = options || {};

    const getLft = typeof lft === "function" ? lft : getObjPropFn(lft || "lft").get;
    const getRgt = typeof rgt === "function" ? rgt : getObjPropFn(rgt || "rgt").get;
    const getItem = typeof setItem === "function" ? setItem : (o, childs) => ({ ...o, children: childs });
    const itemList = nestToItemTree(nestList, getItem, getLft, getRgt);

    return new ItemTree(itemList, { id, children });
  }

  protected get tree() {
    return this.core.tree;
  }

  public value(): Array<T> {
    return this.tree;
  }

  /**
   * 返回一个树节点
   */
  public node(id: Id | T | ((o: T) => boolean)) {
    let data: T;
    let type = typeof id;
    if (type === "object") {
      data = id as any;
    } else {
      data = this.findOne(id as any);
      if (!data) {
        throw new Error("not find node: " + id);
      }
    }

    let node = new ItemNode<T>(data, this.core);
    if (this.map) {
      node.setIndex();
    }
    return node;
  }

  /**
   * 判断a是否是b的父
   */
  public isParentOf(a: Id, b: Id, type?: RelationType) {
    return this._isParentOf(a, b, type);
  }

  /**
   * 判断a是否是b的子
   */
  public isChildOf(a: Id, b: Id, type?: RelationType) {
    return this._isParentOf(b, a, type);
  }

  /**
   * 判断a和b是否是兄弟
   */
  public isSlibingOf(a: Id, b: Id) {
    return this._isSlibingOf(a, b);
  }
}

class ItemNode<T = any> extends TreeBase<T> {
  constructor(data: T, core: TreeCore<T>) {
    super();
    this.nodeData = [data];
    this.core = core;
  }

  private nodeData: Array<T>;
  protected get tree() {
    return this.nodeData;
  }

  public value(): T {
    return this.nodeData[0];
  }

  public get id() {
    return this.core.getId(this.nodeData[0]);
  }

  public isParentOf(b: Id | ItemNode<T>, type?: RelationType) {
    if (b instanceof ItemNode) {
      b = b.id;
    }
    return this._isParentOf(this.id, b, type);
  }

  public isChildOf(b: Id | ItemNode<T>, type?: RelationType) {
    if (b instanceof ItemNode) {
      b = b.id;
    }
    return this._isParentOf(b, this.id, type);
  }

  public isSlibingOf(b: Id | ItemNode<T>) {
    if (b instanceof ItemNode) {
      b = b.id;
    }
    return this._isSlibingOf(this.id, b);
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
