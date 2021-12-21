import "./index.d";

type NewNode<T, S> = S | Array<S> | NestedTree<T, S> | NestedNode<any, any>;

/**
 * 嵌套模型树
 *
 */
export class NestedTree<T = any, S = any> {
  constructor(list: Array<T>, options?: TreeOptions<T>) {
    this.core = new NestedCore<T, S>(list, options);
  }

  static buildListByItem<T, S>(itemTree: Array<S>, options?: BuildItemOptions<S>): Array<T> {
    const { startDepth = 1, startLeft = 1, children = "children", setItem } = options || {};
    const getChild = typeof children === "function" ? children : (o) => o[children];
    const getItem = setItem || ((o, lft, rgt, depth) => ({ ...o, lft, rgt, depth }));

    const list = [];

    let left = startLeft;
    itemTree.forEach(function (o) {
      let right = buildNode(o, left, startDepth).right;
      left = right + 1;
    });

    function buildNode(o, left, depth) {
      let right = left + 1;

      const cList = getChild(o);
      if (cList && cList.length) {
        const cDepth = depth + 1;
        cList.forEach(function (co) {
          right = buildNode(co, right, cDepth) + 1;
        });
      }

      const item = getItem(o, left, right, depth);
      list.push(item);

      return right;
    }

    return list;
  }

  static buildListByFlat<T, S>(flatTree: Array<S>, options?: BuildFlatOptions<S>): Array<T> {
    const { flatId = "id", parentId = "parentId", isRoot, setItem, ...itemOpt } = options || {};

    const getId = typeof flatId === "function" ? flatId : (o) => o[flatId];
    const getPid = typeof parentId === "function" ? parentId : (o) => o[parentId];
    const getIsRoot = typeof isRoot === "function" ? isRoot : (pid, o) => pid !== null && pid !== undefined;
    const getItem = setItem || ((o, lft, rgt, depth) => ({ ...o, lft, rgt, depth }));

    const itemList = [];
    const obj = {};
    flatTree.forEach(function (o) {
      const id = getId(o);
      const pid = getPid(o);

      let info = obj[id];
      if (info) {
        info.doc = o;
      } else {
        info = obj[id] = {
          doc: o,
          children: [],
        };
      }
      if (getIsRoot(pid, o)) {
        itemList.push(info);
      } else {
        let pInfo = obj[pid];
        if (!pInfo) {
          pInfo = obj[pid] = {
            doc: null,
            children: [],
          };
        }
        pInfo.children.push(info);
      }
    });

    const setItemFlat = function (o, lft, rgt, depth) {
      return getItem(o.doc, lft, rgt, depth);
    };
    itemOpt["setItem"] = setItemFlat;

    const list = NestedTree.buildListByItem<T, S>(itemList, itemOpt);

    return list;
  }

  /**
   * 从item tree创建nested tree
   * options:
   *  startDepth - 构建时起始深度 - 默认1
   *  startLeft - 构建时左节点的起始值 - 默认1
   *  children - 创建时获取children - 默认'children'
   *  setItem - 创建时生成item
   *  ...TreeOptions
   *
   * 算法:
   * buildNode: - 构建一个树节点 - 返回这个节点的right值
   *  1、接收一个节点初始数据，和起始left节点值
   *  2、节点right值为left + 1
   *  3、若有子，则依次构建子，每个子的left为上一个子的right + 1
   *  4、该节点right值为最后一个子的right + 1 或 其left + 1(若无子)
   *  5、生成节点并追加到列表
   * buildNode依次构建根节点，每个节点的left为上一个的right + 1
   */
  static fromItem<T, S>(itemTree: Array<S>, options?: TreeOptions<T> & BuildItemOptions<S>): NestedTree<T, S> {
    const list = NestedTree.buildListByItem<T, S>(itemTree, options);
    const tree = new NestedTree(list, options);
    tree.core.from = "item";
    return tree;
  }

  /**
   * flat tree创建nested tree
   * options:
   *  startDepth - 构建时起始深度 - 默认1
   *  startLeft - 构建时左节点的起始值 - 默认1
   *  flatId - flat树的id - 默认'id'
   *  parentId - 创建时获取parentId - 默认'parentId'
   *  isRoot - 判断是否是根节点
   *  setItem - 创建时生成item
   *  ...TreeOptions
   */
  static fromFlat<T, S>(flatTree: Array<S>, options?: TreeOptions<T> & BuildFlatOptions<S>): NestedTree<T, S> {
    const list = NestedTree.buildListByFlat<T, S>(flatTree, options);
    const tree = new NestedTree(list, options);
    tree.core.from = "flat";
    return tree;
  }

  private core: NestedCore<T, S>;

  public values() {
    return this.core.list;
  }

  public get(id: idFn<T>) {
    return this.core.get(id);
  }

  public node(id) {
    const nodeData = this.core.get(id);
    if (!nodeData) {
      throw new Error("node is not exist:" + id);
    }
    return new NestedNode(nodeData, this.core);
  }

  /**
   * 在最后面添加元素
   */
  public push(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 2;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(null, item, position);
    } else {
      const newList = this.core.buildNewNode(item);
      this.core.add(newList, null, position);
    }

    return this;
  }

  /**
   * 在最前面添加元素
   */
  public unshift(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 1;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(null, item, position);
    } else {
      const newList = this.core.buildNewNode(item);
      this.core.add(newList, null, position);
    }

    return this;
  }

  public toItemTreeObj(setItem?: SetItem) {
    return this.core.toItemTreeObj(setItem);
  }

  /**
   * 移除节点
   */
  public remove(startLft: number, endRgt: number) {
    return this.core.remove(startLft, endRgt);
  }

  /**
   * 移除节点
   */
  public removeBy(id: idFn<T>) {
    let item = this.get(id);
    if (!item) {
      return null;
    }
    return this.core.remove(this.core.getLft(item), this.core.getRgt(item));
  }
}

class NestedNode<T, S> {
  constructor(nodeData, core: NestedCore<T, S>) {
    this.nodeData = nodeData;
    this.core = core;
  }

  public nodeData;
  private core: NestedCore<T, S>;

  get lft() {
    return this.core.getLft(this.nodeData);
  }

  get rgt() {
    return this.core.getRgt(this.nodeData);
  }

  get dpt() {
    return this.core.getDpt(this.nodeData);
  }

  values(): Array<T> {
    let list = [];
    const theLft = this.core.getLft(this.nodeData);
    const theRgt = this.core.getDpt(this.nodeData);

    this.core.forEach((o) => {
      let lft = this.core.getLft(o);
      let rgt = this.core.getRgt(o);

      if (lft >= theLft && rgt <= theRgt) {
        list.push(o);
      }
    });

    return list;
  }

  get(id: idFn<T>): T {
    return this.core.get(id, this.values());
  }

  /**
   * 添加到节点的子节点的最后
   */
  push(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 4;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(this, item, position);
    } else {
      // 追加节点
      const newList = this.core.buildNewNode(item);
      this.core.add(newList, this, position);
    }

    return this;
  }

  /**
   * 添加到节点的子节点最前
   */
  unshift(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 3;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(this, item, position);
    } else {
      // 添加节点
      const newList = this.core.buildNewNode(item);
      this.core.add(newList, null, position);
    }

    return this;
  }

  link(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 2;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(this, item, position);
    } else {
      // 添加节点
      const newList = this.core.buildNewNode(item);
      this.core.add(newList, null, position);
    }

    return this;
  }

  linkBefore(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 1;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(this, item, position);
    } else {
      // 添加节点
      const newList = this.core.buildNewNode(item);
      this.core.add(newList, null, position);
    }

    return this;
  }

  toItemTreeObj(setItem?: SetItem) {
    return this.core.toItemTreeObj(setItem, this.values());
  }

  /**
   * 移除节点
   */
  public remove(startLft: number, endRgt: number) {
    if (startLft <= endRgt && startLft >= this.lft && endRgt <= this.rgt) {
      return this.core.remove(startLft, endRgt);
    } else {
      throw new Error("over range");
    }
  }

  /**
   * 移除节点
   */
  public removeSelf() {
    return this.core.remove(this.lft, this.rgt);
  }

  /**
   * 移除节点
   */
  public removeBy(id: idFn<T>) {
    let item = this.get(id);
    if (!item) {
      return null;
    }
    return this.core.remove(this.core.getLft(item), this.core.getRgt(item));
  }
}

class NestedCore<T, S> {
  constructor(list: Array<T>, options?: TreeOptions<T>) {
    this.options = options;
    this.init(list, options);
  }

  private init(list: Array<T>, options?: TreeOptions<T>) {
    const id = options?.id || "id";
    const lft = options?.lft || "lft";
    const rgt = options?.rgt || "rgt";

    if (typeof id === "function") {
      this.getId = id;
    } else {
      this.getId = function (o) {
        return o[id];
      };
    }

    if (typeof lft === "object") {
      this.getLft = lft.get;
      this.setLft = lft.set;
    } else {
      this.getLft = function (o) {
        return o[lft];
      };
      this.setLft = function (o, n) {
        o[lft] = n;
      };
    }

    if (typeof rgt === "object") {
      this.getRgt = rgt.get;
      this.setRgt = rgt.set;
    } else {
      this.getRgt = function (o) {
        return o[rgt];
      };
      this.setRgt = function (o, n) {
        o[rgt] = n;
      };
    }
  }

  public list: Array<T>;

  public from: "flat" | "item";
  public options: TreeOptions<T>;

  public getId: (o: T) => string | number;
  public getLft: (o: T) => number;
  public setLft: (o: T, n: number) => any;
  public getRgt: (o: T) => number;
  public setRgt: (o: T, n: number) => any;
  public getDpt: (o: T) => number;
  public setDpt: (o: T, n: number) => any;

  public size(): number {
    return this.list.length;
  }

  public get(id: idFn<T>, list = this.list): T {
    let result: T;
    let is;
    if (typeof id === "function") {
      is = id;
    } else {
      is = (o) => {
        let oId = this.getId(o);
        return oId === id;
      };
    }

    const l = list.length;
    for (let i = 0; i < l; i++) {
      const o = list[i];
      if (is(o)) {
        result = o;
        break;
      }
    }

    return result;
  }

  public forEach(fn, list = this.list) {
    const l = list.length;
    for (let i = 0; i < l; i++) {
      fn(list[i]);
    }
  }

  public buildNewNode(item: NewNode<T, S>): Array<T> {
    if (!item) {
      return [];
    }
    if (item instanceof NestedTree) {
      return item.values();
    }

    if (item instanceof NestedNode) {
      return item.values();
    }

    if (!Array.isArray(item)) {
      item = [item];
    }

    if (this.from === "flat") {
      return NestedTree.fromFlat<T, S>(item, this.options).values();
    }
    if (this.from === "item") {
      return NestedTree.fromItem<T, S>(item, this.options).values();
    }
    return new NestedTree<T, S>(item as any, this.options).values();
  }

  /**
   * 获取右值最大的元素
   */
  public maxRgtItem(list?: Array<T>): T | null {
    let maxItem = null;
    let maxRgt = null;
    this.forEach((o) => {
      const rgt = this.getRgt(o);
      if (maxRgt === null || maxRgt < rgt) {
        maxItem = o;
        maxRgt = rgt;
      }
    }, list);
    return maxItem;
  }

  /**
   * 获取左值最小的元素
   */
  public minLftItem(list?: Array<T>): T | null {
    let minItem = null;
    let minLft = null;
    this.forEach((o) => {
      let lft = this.getLft(o);
      if (minLft === null || minLft > lft) {
        minItem = o;
        minLft = lft;
      }
    }, list);
    return minItem;
  }

  /**
   * 添加子列表
   *
   * position:
   *  1 - tarNode左边，或最左(无tarNode)
   *  2 - tarNode右边，或最右(无tarNode)
   *  3 - tarNode的最前子节点
   *  4 - tarNode的最后子节点
   */
  public add(list: Array<T>, tarNode: NestedNode<T, S>, position: PosType) {
    if (!list.length) return this;
    if (!this.list.length) {
      this.list = list;
      return this;
    }

    let curAdd: number, newAdd: number, newDptAdd: number;
    let targetLft;
    if (tarNode) {
      const newMinLftItem = this.minLftItem(list);
      const newMinLft = this.getLft(newMinLftItem);
      const newLftDpt = this.getDpt(newMinLftItem);

      const newMaxRgtItem = this.maxRgtItem(list);
      const newMaxRgt = this.getRgt(newMaxRgtItem);
      const newRgtDpt = this.getDpt(newMaxRgtItem);

      if (position === 1 || position === 3) {
        targetLft = position === 1 ? tarNode.lft : tarNode.lft + 1;
        const tarDpt = position === 1 ? tarNode.dpt : tarNode.dpt - 1;
        newDptAdd = tarDpt - newRgtDpt;
      } else {
        targetLft = position === 2 ? tarNode.rgt : tarNode.rgt - 1;
        const tarDpt = position === 2 ? tarNode.dpt : tarNode.dpt - 1;
        newDptAdd = tarDpt - newLftDpt;
      }
      curAdd = newMaxRgt - newMinLft + 1;
      newAdd = targetLft - newMinLft;
    } else {
      if (position === 1) {
        // unshift
        const minLftItem = this.minLftItem();
        const minLft = this.getLft(minLftItem);
        const minLftDpt = this.getDpt(minLftItem);

        const newMaxRgtItem = this.maxRgtItem(list);
        const newMaxRgt = this.getRgt(newMaxRgtItem);
        const newMinRgtDpt = this.getDpt(newMaxRgtItem);

        const newMinLftItem = this.minLftItem(list);
        const newMinLft = this.getLft(newMinLftItem);

        targetLft = minLft;

        curAdd = newMaxRgt + 1 - newMinLft;
        newAdd = minLft - newMinLft;
        newDptAdd = minLftDpt - newMinRgtDpt;
      } else {
        // push
        const lftItem = this.minLftItem(list);
        const newLft = this.getLft(lftItem);
        const newDpt = this.getDpt(lftItem);

        const maxRgtItem = this.maxRgtItem();
        const maxRgt = this.getRgt(maxRgtItem);
        const maxRgtDpt = this.getDpt(maxRgtItem);

        targetLft = maxRgt + 1;

        newAdd = maxRgt + 1 - newLft;
        newDptAdd = maxRgtDpt - newDpt;
      }
    }

    if (curAdd) {
      this.forEach((o) => {
        let lft = this.getLft(o);
        let rgt = this.getRgt(o);

        if (lft >= targetLft) {
          lft += curAdd;
          this.setLft(o, lft);
        }

        if (rgt >= targetLft) {
          rgt += curAdd;
          this.setRgt(o, rgt);
        }
      });
    }

    if (newAdd) {
      this.forEach((o) => {
        let lft = this.getLft(o) + newAdd;
        let rgt = this.getRgt(o) + newAdd;
        this.setLft(o, lft);
        this.setRgt(o, rgt);
      });
    }

    if (newDptAdd) {
      this.forEach((o) => {
        let dpt = this.getDpt(o) + newDptAdd;
        this.setDpt(o, dpt);
      });
    }

    this.list.push(...list);

    return this;
  }

  public remove(minLeft: number, maxRight: number) {
    const newList = [];
    const rList = [];
    let diff = maxRight - minLeft;
    this.forEach((o) => {
      let lft = this.getLft(o);
      let rgt = this.getRgt(o);

      if (lft >= minLeft && rgt <= maxRight) {
        rList.push(o);
        return;
      }
      if (lft > minLeft) {
        this.setLft(o, lft - diff);
      }
      if (rgt > maxRight) {
        this.setRgt(o, rgt - diff);
      }
      newList.push(o);
    });
    this.list = newList;

    return rList;
  }

  public move(curNode: NestedNode<T, S>, moveNode: NestedNode<T, S>, position: PosType) {
    const initLft = moveNode.lft;
    const initRgt = moveNode.rgt;

    let tarLft, dptAdd;

    if (curNode) {
      if (position === 1) {
        tarLft = curNode.lft;
        dptAdd = curNode.dpt - moveNode.dpt;
      } else if (position === 2) {
        tarLft = curNode.rgt + 1;
        dptAdd = curNode.dpt - moveNode.dpt;
      } else if (position === 3) {
        tarLft = curNode.lft + 1;
        dptAdd = curNode.dpt - 1 - moveNode.dpt;
      } else {
        tarLft = curNode.rgt;
        dptAdd = curNode.dpt - 1 - moveNode.dpt;
      }
    } else {
      if (position === 1) {
        const minLftItem = this.minLftItem();
        const minLft = this.getLft(minLftItem);
        const minLftDpt = this.getDpt(minLftItem);

        tarLft = minLft;
        dptAdd = minLftDpt - moveNode.dpt;
      } else {
        const maxRgtItem = this.maxRgtItem();
        const maxRgt = this.getRgt(maxRgtItem);
        const maxRgtDpt = this.getDpt(maxRgtItem);

        tarLft = maxRgt + 1;
        dptAdd = maxRgtDpt - moveNode.dpt;
      }
    }
    this.move_(initLft, initRgt, tarLft, dptAdd);
  }

  public move_(l1: number, r1: number, l2: number, dptDiff: number) {
    if (l1 <= l2 && l2 <= r1) {
      throw new Error("can not move to self!");
    }

    const d1 = r1 - l1;
    const diff = l2 - l1;
    const isBack = l1 >= l2;

    this.forEach((o) => {
      const x = this.getLft(o);
      const y = this.getRgt(o);

      const isMove = isMoveNode(x, y);
      if (isBack) {
        if (isMove) {
          this.setLft(o, x + diff);
          this.setRgt(o, y + diff);
          if (dptDiff) {
            this.setDpt(o, this.getDpt(o) + dptDiff);
          }
        } else {
          if (x >= l2 && x <= l1) {
            this.setLft(o, x + d1 + 1);
          }

          if (y >= l2 && y <= l1) {
            this.setRgt(o, y + d1 + 1);
          }
        }
      } else {
        if (isMove) {
          this.setLft(o, x + diff - d1);
          this.setRgt(o, y + diff - d1);
          if (dptDiff) {
            this.setDpt(o, this.getDpt(o) + dptDiff);
          }
        } else {
          if (x < l2 && x > l1) {
            this.setLft(o, x - d1 - 1);
          }

          if (y < l2 && y > l1) {
            this.setRgt(o, y - d1 - 1);
          }
        }
      }
    });

    function isMoveNode(x, y) {
      return x >= l1 && y <= r1;
    }
  }

  public toItemTreeObj(setItem: SetItem = "children", values = this.list) {
    // 1、fn返回目标元素的子元素列表
    // 2、每个子元素已包含其子
    const that = this;
    if (typeof setItem === "string") {
      let name = setItem;
      setItem = function (o, childs) {
        o[name] = childs;
        return o;
      };
    }

    let list = values.concat().sort((a, b) => {
      let lft = this.getLft(a);
      let lft2 = this.getLft(b);
      return lft - lft2;
    });

    let result = [];
    findChild(result);

    return result;

    function findChild(arr, rgt = Number.POSITIVE_INFINITY, index = 0) {
      let item = list[index];
      if (item) {
        let itemRgt = that.getRgt(item);
        if (itemRgt <= rgt) {
          index++;
          let cList = [];
          index = findChild(cList, itemRgt, index);

          let bItem = (setItem as any)(item, cList);
          arr.push(bItem);

          return findChild(arr, rgt, index);
        }
      }
      return index;
    }
  }

  public toItemTreeObj_(setItem: SetItem = "children", values = this.list) {
    if (typeof setItem === "string") {
      let name = setItem;
      setItem = function (o, childs) {
        o[name] = childs;
        return o;
      };
    }

    let list = values.concat().sort((a, b) => {
      let lft = this.getLft(a);
      let lft2 = this.getLft(b);
      return lft - lft2;
    });

    let result = [];
    let stack = [];

    for (let i = 0; i <= list.length; i++) {
      let item = list[i];

      let itemRgt = this.getRgt(item);
      if (item && !stack.length) {
        stack.push({
          rgt: itemRgt,
          item,
          childs: [],
        });
        continue;
      }

      for (let j = stack.length - 1; j >= 0; j--) {
        let data = stack[j];
        if (!item || itemRgt > data.rgt) {
          let bItem = setItem(data.item, data.childs);
          if (j === 0) {
            result.push(bItem);
          } else {
            stack[j - 1].childs.push(bItem);
          }
          stack.pop();
        } else {
          stack.push({
            rgt: itemRgt,
            item,
            childs: [],
          });
          break;
        }
      }
    }

    return result;
  }
}

/**

这是一条从左值开始递增的线，若一值小，则先确定，后面的变动不会影响它
[1 2] [3 4] [5 6] [7 8] [8 9]

一、添加：
  设新节点左值为l1，右值为r1，设差d1 = r1 - l1
  则原来的节点:
    1、左值>=l1，左值加d1 + 1
    2、右值>=l1，右值加d1 + 1
二、移除：
  设目标节点左值为l1，右值为r1，设差d1 = r1 - l1
  则剩余的节点:
    1、左值>l1，左值减d1 + 1
    2、右值>l1，右值减d1 + 1
三、移动：
  设目标节点左值为l1，右值为r1，设差d1 = r1 - l1
  设占位添加后的左值为l2,右值则为r2 = l2 + d1
1、占位添加
  (新-2)
  当前节点及其子节点:
    (1)左右都加 l2 - l1
  则其余节点:
    (1)左值>=l2，左值加d1 + 1
    (2)右值>=l2，右值加d1 + 1
2、移除
  (原-3)
  若l1>=l2，
    则l3 = l1 + d1 + 1, r3 = r1 + d1 + 1  = l1 + 2 * d1 + 1;
    否l3 = l1, r3 = r1 = l1 + d1;
  则所有节点接前一步操作后的:
    (1)左值>l3，左值减d1 + 1
    (2)右值>l3，右值减d1 + 1
3、合并操作
  设讨论节点左值为x,右值为y;
  若l1>=l2,
    对于其余节点(x < l1 || (y>r1 -> y > l1 + d1))：
      (1)若(x>=l2 && (x + d1 + 1 <=l1 + d1 + 1 -> x <= l1))
          即(x>=l2 && x <= l1)
          左值加d1 + 1
        否则若(x < l2 && x > l1 + d1 + 1) -> 不存在
          左值减(d1 + 1)
        否则
          不变
      (2)右值同样

    对于目标节点(x >= l1 && y<=r1 = l1 + d1):
      (1)若(x + l2 - l1 > l1 + d1 + 1)  
          即(x > 2 * l1 - l2 + d1 + 1)
            [-> 由l1 - l2 > d1 (不能移动到自身) -> x > l1 + 2 * d1 + 1] 
            -> 不存在
          左值 加 l2 - l1 - d1 - 1
        否则
          左值 加 l2 - l1
      (2)右值同上

  若l1<l2,
    对于其余节点(x < l1 || (y>r1 -> y > l1 + d1))：
      (1)若(x >= l2 && x + d1 + 1 <= l1)
          即(x >= l2 && x <= l1 - d1 - 1) - 不存在
          左值加d1 + 1
        否则若(x<l2 && x>l1)
          左值减(d1 + 1)
        否则不变
      (2)右值同样
      
    对于目标节点(x >= l1 && y<=r1 = l1 + d1):
      (1)若(x + l2 - l1 > l1) -> 必存在
          即 (x > 2*l1 - l2)
          左值 加 l2 - l1 - d1 - 1
        否则      -> 不存在
          左值 加 l2 - l1
      (2)右值同样



      
      [1 4] [5 6] [7 8]
      [2 3]
      
       let arr = list
        .map((o) => ({
          o,
          lft,
          rgt,
        }))
        .sort((a, b) => a.lft - b.lft);
      
      let result = [];
      
      let i = 0;
      function fn(sList) {
        let item = arr[i];
        sList.push(item);
      
        if (item.lft) {
        }
      }
      
    
      
      

      
      */
