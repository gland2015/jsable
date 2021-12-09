import "./index.d";

type NewNode<T, S> = S | Array<S> | NestedTree<T, S>;

/**
 * 嵌套模型树
 *
 */
export class NestedTree<T, S> {
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

  private getMaxRgt(): number | null {
    let max = null;
    this.core.forEach((o) => {
      let rgt = this.core.getRgt(o);
      if (max === null) {
        max = rgt;
      } else if (max < rgt) {
        max = rgt;
      }
    });
    return max;
  }

  private getMinLft(): number | null {
    let min = null;
    this.core.forEach((o) => {
      let lft = this.core.getLft(o);
      if (min === null) {
        min = lft;
      } else if (min > lft) {
        min = lft;
      }
    });
    return min;
  }

  private getMinDpt(): number | null {
    let min = null;
    this.core.forEach((o) => {
      let dpt = this.core.getDpt(o);
      if (min === null) {
        min = dpt;
      } else if (min > dpt) {
        min = dpt;
      }
    });
    return min;
  }

  public get(id) {
    return this.core.get(id);
  }

  public node(id) {
    const nodeData = this.core.get(id);
    return new NestedNode(nodeData, this.core);
  }

  /**
   * 在最后面添加元素
   */
  public push(item: NewNode<T, S>) {
    const newTree = this.core.buildNewNode(item);
    if (!newTree.core.size()) {
      return this;
    }
    if (!this.core.size()) {
      this.core.list = newTree.core.list;
      return this;
    }

    const maxRgt = this.getMaxRgt();
    const minDpt = this.getMinDpt();

    const newMinLft = newTree.getMinLft();
    const newMinDpt = newTree.getMinDpt();
    const diffVal = maxRgt + 1 - newMinLft;
    const diffDpt = minDpt - newMinDpt;

    if (diffVal) {
      newTree.core.forEach((o) => {
        let lft = this.core.getLft(o) + diffVal;
        let rgt = this.core.getRgt(o) + diffVal;
        this.core.setLft(o, lft);
        this.core.setRgt(o, rgt);
      });
    }

    if (diffDpt) {
      newTree.core.forEach((o) => {
        let dpt = this.core.getDpt(o) + diffDpt;
        this.core.setDpt(o, dpt);
      });
    }

    this.core.list.push(...newTree.core.list);

    return this;
  }

  /**
   * 在最前面添加元素
   */
  public unshift(item: NewNode<T, S>) {
    const newTree = this.core.buildNewNode(item);
    if (!newTree.core.size()) {
      return this;
    }
    if (!this.core.size()) {
      this.core.list = newTree.core.list;
      return this;
    }

    const minLft = this.getMinLft();
    const minDpt = this.getMinDpt();

    const newMaxRgt = newTree.getMaxRgt();
    const newMinDpt = newTree.getMinDpt();
    const diffVal = newMaxRgt + 1 - minLft;
    const diffDpt = minDpt - newMinDpt;

    if (diffVal) {
      this.core.forEach((o) => {
        let lft = this.core.getLft(o) + diffVal;
        let rgt = this.core.getRgt(o) + diffVal;
        this.core.setLft(o, lft);
        this.core.setRgt(o, rgt);
      });
    }

    if (diffDpt) {
      newTree.core.forEach((o) => {
        let dpt = this.core.getDpt(o) + diffDpt;
        this.core.setDpt(o, dpt);
      });
    }

    this.core.list.push(...newTree.core.list);

    return this;
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

  public get(id: idFn<T>): T {
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

    const l = this.list.length;
    for (let i = 0; i < l; i++) {
      const o = this.list[i];
      if (is(o)) {
        result = o;
        break;
      }
    }

    return result;
  }

  public forEach(fn) {
    const l = this.list.length;
    for (let i = 0; i < l; i++) {
      fn(this.list[i]);
    }
  }

  public buildNewNode(item: NewNode<T, S>): NestedTree<T, S> {
    if (!item) {
      return new NestedTree<T, S>([]);
    }
    if (item instanceof NestedTree) {
      return item;
    }

    if (!Array.isArray(item)) {
      item = [item];
    }

    if (this.from === "flat") {
      return NestedTree.fromFlat<T, S>(item, this.options);
    }
    if (this.from === "item") {
      return NestedTree.fromItem<T, S>(item, this.options);
    }
    return new NestedTree<T, S>(item as any, this.options);
  }

  public add(startLeft: number, list: Array<T>) {
    let startRight = startLeft + 1;
    let addNum = list.length * 2;
    this.forEach((o) => {
      let lft = this.getLft(o);
      let rgt = this.getRgt(o);

      if (lft >= startLeft) {
        this.setLft(o, lft + addNum);
      }

      if (rgt >= startRight) {
        this.setRgt(o, rgt + addNum);
      }
    });
  }

  public remove(minLeft: number, maxRight: number) {
    const newList = [];
    let diff = maxRight - minLeft;
    this.forEach((o) => {
      let lft = this.getLft(o);
      let rgt = this.getRgt(o);

      if (lft >= minLeft && rgt <= maxRight) {
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
  }

  public move(minLeft: number, maxRight: number, tarLeft: number) {}
}

class NestedNode<T, S> {
  constructor(nodeData, core: NestedCore<T, S>) {
    this.nodeData = nodeData;
    this.core = core;
  }

  private nodeData;
  private core: NestedCore<T, S>;

  value() {}

  push() {}
  unshift() {}

  link() {}
  linkBefore() {}
}

let t = new NestedTree([]);

t.get;

/**

这是一条从左值开始递增的线，若一值小，则先确定，后面的变动不会影响它
[1 2] [3 4] [5 6] [7 8] [8 9]

一、添加：
  设新节点左值为l1,右值则为r1 = l1+1
  则原来的节点:
    1、左值>=l1，左值加2
    2、右值>=r1，右值加2
二、移除：
  设目标节点左值为l1，右值为r1，差为d1 = r1 - l1
  则剩余的节点:
    1、左值>l1，左值减d1
    2、右值>r1，右值减d1
三、移动：
  设目标节点左值为l1，右值为r1，差为d1 = r1 - l1
  设占位添加后的左值为l2,右值则为r2 = l2 + d1
1、占位添加
  (新-2)
  当前节点及其子节点:
    (1)左右都加 l2 - l1
  则其余节点:
    (1)左值>=l2，左值加d1
    (2)右值>=r2，右值加d1
2、移除
  (原-3)
  若l1>=l2，由r = l + d, 得出r1>=r2
    则l3 = l1 + d1, r3 = r1 + d1  = l1 + 2d1;
    否l3 = l1, r3 = r1 = l1 + d1;
  则所有节点接前一步操作后:
    (1)左值>l3，左值减d1
    (2)右值>r3，右值减d1
3、合并操作
  设讨论节点左值为x,右值为y;
  若l1>=l2,
    对于其余节点(x<l1 || (y>r1 -> y>l1+d1))：
      (1)若(x>=l2 && (x + d1 <=l1 + d1 -> x <= l1))
          即(x>=l2 && x <= l1)
          左值加d1
        否则若(x<l2 && x>l1+d1) -> 不存在
          左值减d1
        否则
          不变
      (2)若(y>=r2 = l2 + d1 && (y + d1 <= r1 + d1 -> y <= l1 + d1))
          即(y > l2 + d1 && y <= l1 + d1)
          即(l2 + d1 < y <= l1 + d1)
          右值加d1
        否则若(y<r2 && y > r1 + d1)
          即(y<l2+d1 && y > l1 + 2d1)
          即(l1 + d1 < y - d1 < l2) -> 不存在
          右值减d1
        否则
          不变
    对于目标节点(x >= l1 && y<=r1 = l1 + d1):
      (1)若(x + l2 - l1 > l1 + d1)
          即(x > 2l1 - l2 + d1)
          左值 加 l2 - l1 - d1
        否则
          左值 加 l2 - l1
      (2)若(y + l2 - l1 > r1 + d1)
          即(y > 2*l1 + 2*d1 - l2)
          右值 加 l2 - l1 - d1
        否则
          右值 加 l2 - l1
  若l1<l2,
    对于其余节点(x<l1 || (y>r1 -> y>l1+d1)):
      (1)若(x >= l2 && x + d1 <= l1)
          即(x >= l2 && x <= l1 - d1) - 不存在
          左值加d1
        否则若(x<l2 && x>l1)
          左值减d1
        否则不变
      (2)若(y>=r2 && y + d1 <= r1)
        即(l2 + d1 < y <= l1)  -> 不存在
          右值加d1
        否则若(y<r2 && y>r1)
          即(l1 + d1 < y < l2 + d1)
          右值减d1
        否则
          不变
    对于目标节点(x >= l1 && y<=r1 = l1 + d1):
      (1)若(x + l2 - l1 > l1)
          即 (x > 2*l1 - l2)
          左值 加 l2 - l1 - d1
        否则
          左值 加 l2 - l1
      (2)若(y + l2 - l1 > r1)
          即(y > 2 * l1 - l2 + d1)
          右值 加 l2 - l1 - d1
        否则
          右值 加 l2 - l1



 */
