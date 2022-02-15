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
  public map: {
    [key: string]: {
      pId: string | number;
      data: T;
    };
  };

  public getId: (o: T) => string | number;
  public getChild: (o: T) => Array<T>;
}

abstract class TreeBase<T = any> {
  constructor() {}

  protected core: TreeCore<T>;
  protected abstract get tree(): Array<T>;

  public iterat(fn: iteratFn<T>, initData?, tree: Array<T> = this.tree) {
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

    iterator(tree, initData, path);
  }

  public iteratUp(fn: iteratUpFn<T>, tree: Array<T> = this.tree) {
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

    return iterator(tree, path);
  }

  public itemData(key?) {
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

  public unItemData(key?) {
    if (key) {
      delete this.itemKeys[key];
    } else {
      this.itemKeys = {};
      this.itemValue = null;
    }
    return this;
  }

  public entireData(key?) {
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

  public unEntireData(key?) {
    if (key) {
      delete this.entireKeys[key];
    } else {
      this.entireKeys = {};
      this.entireValue = null;
    }
    return this;
  }

  public collect(colItemFn?) {
    if (!this.tree.length) {
      if (this.entireValue) {
        return this.entireValue.emptyValue;
      }
      if (this.entireKeys) {
        let data = {};
        let hasKey;
        for (let key in this.entireKeys) {
          hasKey = true;
          data[key] = this.entireKeys[key].emptyValue;
        }
        return hasKey ? data : undefined;
      }
      return;
    }

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
            const fn_value = fnInfo.fn(item, listData && listData.length ? listData.map((o) => o.fnDataList[i]) : null, children, itemInfo.context);

            let value = fn_value;
            // 获取保存结果
            if (fnInfo.getValue) {
              value = fnInfo.getValue(value);
            }
            if (itemInfo.saveEntireData) {
              itemInfo.saveEntireData(value);
            } else {
              itData = itemInfo.saveItemData(value, itData);
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
              if (itemInfo.saveEntireData) {
                itemInfo.saveEntireData(value);
              } else {
                itData = itemInfo.saveItemData(value, itData);
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

          if (itemInfo.saveEntireData) {
            itemInfo.saveEntireData(value);
          } else {
            itData = itemInfo.saveItemData(value, itData);
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
      if (this.core.map) {
        let item = this.core.map[info];
        if (!item) {
          return null;
        }
        if (this instanceof ItemNode) {
          if (this._isParentOf(this.id, info)) {
            return item.data;
          }
          return null;
        }
        return item.data;
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
    return node;
  }

  public flat(): Array<T> {
    let list = [];
    this.iterat((item) => {
      list.push(item);
    });
    return list;
  }

  /**
   * 从上往下排列
   */
  protected _findParents(id: string | number, skip = 0, limit = null) {
    let list: Array<T> = [];
    if (this.core.map) {
      let item = this.core.map[id];
      while (item.pId !== null && item.pId !== undefined) {
        if (skip > 0) {
          skip--;
        } else {
          list.unshift(item.data);
          if (limit !== null) {
            limit--;
            if (!limit) {
              break;
            }
          }
        }
        item = this.core.map[item.pId];
        if (!item) {
          break;
        }
      }
    } else {
      let path;
      this.iterat(
        (item, pData, context) => {
          if (this.core.getId(item) === id) {
            path = context.path.concat();
            context.end();
          }
        },
        null,
        this.core.tree
      );

      if (path) {
        let treeList = this.core.tree;
        let item;
        for (let i = 0; i < path.length; i++) {
          item = treeList[path[i]];
          list.push(item);
          treeList = this.core.getChild(item);
        }
        while (skip > 0) {
          skip--;
          list.pop();
        }
        if (limit) {
          list = list.slice(-1 * limit);
        }
      }
    }

    return list;
  }

  protected _parentList(id, type?: RelationType) {
    if (!type || type === "default") {
      return this._findParents(id, 0, null);
    }

    if (type === "direct") {
      return this._findParents(id, 1, 1);
    }

    if (type === "direct-indirect") {
      return this._findParents(id, 1, null);
    }

    if (type === "indirect") {
      return this._findParents(id, 2, null);
    }

    if (type === "self-direct") {
      return this._findParents(id, 0, 2);
    }

    return this._parentList(id);
  }

  protected _isParentOf(a: Id, b: Id, type?: RelationType) {
    type = type || "default";
    if (a === b) {
      if (type === "default" || type === "self-direct") {
        return true;
      }
      return false;
    }

    if (this.core.map) {
      let path = [];
      let id = b;
      let hasFindA = false;
      while (id !== null && id !== undefined) {
        path.push(id);
        let p = this.core.map[id];
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

    if (this.core.map) {
      let pa = this.core.map[a];
      let pb = this.core.map[b];
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
   * 设置或更新索引
   */
  public setIndex(obj?: T) {
    let tree = this.tree;
    if (obj) {
      this.removeIndex(this.core.getId(obj));
      tree = [obj];
    }

    if (!this.core.map) {
      this.core.map = {};
    }

    const set = (list: Array<T>, pId) => {
      if (list && list.length) {
        for (let i = 0; i < list.length; i++) {
          let o = list[i];
          let id = this.core.getId(o);
          let childs = this.core.getChild(o);

          this.core.map[id] = {
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
      this.core.map = null;
      return;
    }

    const remove = (id) => {
      let obj = this.core.map[id];
      if (obj) {
        delete this.core.map[id];
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

  public size(): number {
    return this.flat().length;
  }

  public findParents(id: Id, type?: RelationType): Array<T> {
    return this._parentList(id, type);
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

  public childList(type?: RelationType): Array<T> {
    if (!type || type === "default") {
      return this.flat();
    }

    if (type === "direct") {
      return this.core.getChild(this.nodeData[0]) || [];
    }

    if (type === "direct-indirect") {
      let list = this.flat();
      list.shift();
      return list;
    }

    if (type === "indirect") {
      let list = [];
      this.iterat((item, pData, context) => {
        if (context.path.length > 2) {
          list.push(item);
        }
      });
      return list;
    }

    if (type === "self-direct") {
      let list = this.core.getChild(this.nodeData[0]) || [];
      list = list.concat();
      list.unshift(this.nodeData[0]);
      return list;
    }

    return this.childList();
  }

  public childNum(type?: RelationType): number {
    return this.childList().length;
  }

  /**
   * 从上往下的列表
   */
  public parentList(type?: RelationType): Array<T> {
    return this._parentList(this.id, type);
  }

  public parentNum(type?: RelationType): number {
    return this.parentList().length;
  }
}

class ItemAction<T> {
  constructor(that: T, set) {
    this.that = that;
    this.set = set;
  }

  private that: T;
  private set;

  private some(list, fn) {
    let val = false;
    if (list) {
      for (let i = 0; i < list.length; i++) {
        if (fn(list[i])) {
          val = true;
          break;
        }
      }
    }
    return val;
  }

  private every(list, fn) {
    let val = true;
    if (list) {
      for (let i = 0; i < list.length; i++) {
        if (!fn(list[i])) {
          val = false;
          break;
        }
      }
    }
    return val;
  }

  private count(list, fn) {
    let val = 0;
    if (list) {
      for (let i = 0; i < list.length; i++) {
        val += fn(list[i]);
      }
    }
    return val;
  }

  public someChild(fn, type?: RelationType) {
    let execFn;
    if (type === "direct") {
      execFn = (item, listData, childList) => {
        return { val: this.some(childList, fn) };
      };
    } else if (type === "direct-indirect") {
      execFn = (item, listData, childList) => {
        let val = this.some(listData, (o) => o.val);
        if (!val) {
          val = this.some(childList, fn);
        }
        return { val };
      };
    } else if (type === "self-direct") {
      execFn = (item, listData, childList) => {
        let itemVal = fn(item);
        if (itemVal) {
          return { itemVal, val: true };
        }
        return { itemVal, val: this.some(listData, (o) => o.itemVal) };
      };
    } else if (type === "indirect") {
      execFn = (item, listData, childList) => {
        let val = this.some(listData, (o) => o.val || o.preVal);
        if (!val) {
          let preVal = this.some(childList, fn);
          return { preVal, val };
        }
        return { val };
      };
    } else {
      execFn = (item, listData, childList) => {
        let val = this.some(listData, (o) => o.val);
        if (!val) {
          val = Boolean(fn(item));
        }
        return { val };
      };
    }

    const data = {
      type: "up",
      fnInfo: {
        getValue: (o) => o.val,
        fn: execFn,
      },
    };
    this.set(data);
    return this.that;
  }

  public everyChild(fn, type?: RelationType) {
    let execFn;
    if (type === "direct") {
      execFn = (item, listData, childList) => {
        return { val: this.every(childList, fn) };
      };
    } else if (type === "direct-indirect") {
      execFn = (item, listData, childList) => {
        let val = this.every(listData, (o) => o.val);
        if (val) {
          val = this.every(childList, fn);
        }
        return { val };
      };
    } else if (type === "indirect") {
      execFn = (item, listData, childList) => {
        let val = this.every(listData, (o) => o.val && o.preVal);
        if (!val) {
          return { val };
        }
        let preVal = this.every(childList, fn);
        return { val, preVal };
      };
    } else if (type === "self-direct") {
      execFn = (item, listData, childList) => {
        let itemVal = Boolean(fn(item));
        let val = false;
        if (itemVal) {
          val = this.every(listData, (o) => o.itemVal);
        }
        return { val, itemVal };
      };
    } else {
      execFn = (item, listData, childList) => {
        let val = this.every(listData, (o) => o.val);
        if (val) {
          val = Boolean(fn(item));
        }
        return { val };
      };
    }

    const data = {
      type: "up",
      fnInfo: {
        getValue: (o) => Boolean(o.val),
        fn: execFn,
      },
    };
    this.set(data);
    return this.that;
  }

  public countChildValue(fn: (o) => number, type?: RelationType) {
    let execFn;
    if (type === "direct") {
      execFn = (item, listData, childList) => {
        return { val: this.count(childList, fn) };
      };
    } else if (type === "direct-indirect") {
      execFn = (item, listData, childList) => {
        let val = this.count(listData, (o) => o.val);
        val += this.count(childList, fn);
        return { val };
      };
    } else if (type === "indirect") {
      execFn = (item, listData, childList) => {
        let val = this.count(listData, (o) => o.val + (o.preVal || 0));
        let preVal = this.count(childList, fn);
        return { val, preVal };
      };
    } else if (type === "self-direct") {
      execFn = (item, listData, childList) => {
        let itemVal = fn(item);
        let val = itemVal + this.count(listData, (o) => o.itemVal);
        return { val, itemVal };
      };
    } else {
      execFn = (item, listData, childList) => {
        let val = fn(item);
        val += this.count(listData, (o) => o.val);
        return { val };
      };
    }

    const data = {
      type: "up",
      fnInfo: {
        getValue: (o) => o.val,
        fn: execFn,
      },
    };
    this.set(data);
    return this.that;
  }

  public countChildNum(type?: RelationType) {
    return this.countChildValue((o) => 1, type);
  }

  public self(fn) {
    const data = {
      type: "down",
      fnInfo: {
        getValue: (o) => o,
        fn: (item, pData, pItem) => {
          return fn(item);
        },
      },
    };

    this.set(data);
    return this.that;
  }

  public someParent(fn, type?: RelationType) {
    let execFn;
    if (type === "direct") {
      execFn = (item, pData, pItem) => {
        return { val: pItem ? fn(pItem) : false };
      };
    } else if (type === "direct-indirect") {
      execFn = (item, pData, pItem) => {
        let val = pData?.val;
        if (val) {
          return { val };
        }
        return { val: pItem ? fn(pItem) : false };
      };
    } else if (type === "indirect") {
      execFn = (item, pData, pItem) => {
        let val = pData?.val || pData?.preVal;
        if (val) {
          return { val };
        }
        return { val, preVal: pItem ? fn(pItem) : false };
      };
    } else if (type === "self-direct") {
      execFn = (item, pData, pItem) => {
        let itemVal = fn(item);
        if (itemVal) {
          return { val: true, itemVal };
        }

        return { val: pData?.itemVal, itemVal };
      };
    } else {
      execFn = (item, pData, pItem) => {
        let val = pData?.val;
        if (val) {
          return { val };
        }
        return { val: fn(item) };
      };
    }

    const data = {
      type: "down",
      fnInfo: {
        getValue: (o) => Boolean(o.val),
        fn: execFn,
      },
    };

    this.set(data);
    return this.that;
  }

  public everyParent(fn, type?: RelationType) {
    let execFn;
    if (type === "direct") {
      execFn = (item, pData, pItem) => {
        return { val: pItem ? fn(pItem) : true };
      };
    } else if (type === "direct-indirect") {
      execFn = (item, pData, pItem) => {
        let val;
        if (pItem) {
          val = pData.val && fn(pItem);
        } else {
          val = true;
        }
        return { val };
      };
    } else if (type === "indirect") {
      execFn = (item, pData, pItem) => {
        if (pData) {
          if (pData.val) {
            if (pData.ppItem) {
              return { val: fn(pData.ppItem), ppItem: pItem };
            }
            return { val: true, ppItem: pItem };
          }
          return { val: false };
        }
        return { val: true, ppItem: pItem };
      };
    } else if (type === "self-direct") {
      execFn = (item, pData, pItem) => {
        let itemVal = fn(item);
        if (!itemVal) {
          return { val: false, itemVal: false };
        }

        if (pData) {
          if (!pData.itemVal) {
            return { val: false, itemVal };
          }
        }

        return { val: true, itemVal: true };
      };
    } else {
      execFn = (item, pData, pItem) => {
        if (pData) {
          if (!pData.val) {
            return { val: false };
          }
        }

        return { val: fn(item) };
      };
    }

    const data = {
      type: "down",
      fnInfo: {
        getValue: (o) => Boolean(o.val),
        fn: execFn,
      },
    };

    this.set(data);
    return this.that;
  }

  public countParentValue(fn, type?: RelationType) {
    let execFn;
    if (type === "direct") {
      execFn = (item, pData, pItem) => {
        return { val: pItem ? fn(pItem) : 0 };
      };
    } else if (type === "direct-indirect") {
      execFn = (item, pData, pItem) => {
        if (pData) {
          return { val: pData.val + fn(item) };
        }
        return { val: 0 };
      };
    } else if (type === "indirect") {
      execFn = (item, pData, pItem) => {
        let val = (pData?.val || 0) + (pData?.preVal || 0);
        return { val, preVal: pItem ? fn(pItem) : 0 };
      };
    } else if (type === "self-direct") {
      execFn = (item, pData, pItem) => {
        let itemVal = fn(item);
        let val = itemVal + (pData?.itemVal || 0);

        return { val, itemVal };
      };
    } else {
      execFn = (item, pData, pItem) => {
        let val = (pData?.val || 0) + fn(item);
        return { val };
      };
    }

    const data = {
      type: "down",
      fnInfo: {
        getValue: (o) => o.val,
        fn: execFn,
      },
    };

    this.set(data);
    return this.that;
  }

  public countParentNum(type?: RelationType) {
    return this.countParentValue((o) => 1, type);
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
      emptyValue: false,
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
      emptyValue: true,
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

  reduce(fn, initValue = null) {
    let value = initValue;

    const data = {
      emptyValue: value,
      fnInfo: {
        fn: (item, args1, args2, context) => {
          value = fn(value, item);
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
