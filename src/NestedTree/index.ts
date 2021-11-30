export type KeyOp<T> =
  | string
  | {
      get: (o: T) => number;
      set: (o: T, n: number) => any;
    };

export type TreeOp<T> = {
  id?: string | ((o: T) => number | string);
  lft?: KeyOp<T>;
  rft?: KeyOp<T>;
  depth?: KeyOp<T>;
};

/**
 * 嵌套模型树
 *
 */
export class NestedTree<T> {
  constructor(list: Array<T>, options?: TreeOp<T>) {
    this.initOptions(options);
    this.map = Object.create(null);
    list.forEach((o) => {
      const id = this.getId(o);
      this.map[id] = o;
    });
    this.list = list;
  }

  // todo null 或 false等代表不设置
  /**
   * 从item tree创建nested tree
   * options:
   *  startDepth - 构建时起始深度 - 默认1
   *  startLeft - 构建时左节点的起始值 - 默认1
   *  children - 创建时获取children - 默认'children'
   *  setItem - 创建时生成item
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
  static fromItem<T>(
    itemTree: Array<T>,
    options?: TreeOp<T> & {
      startDepth?: number;
      startLeft?: number;
      children?: string & ((o: T) => Array<T>);
      setItem?: (o: T, lft: number, rft: number, depth: number, children?: Array<T>) => any;
    }
  ): NestedTree<T> {
    const { startDepth = 1, startLeft = 1, children = "children", setItem, ...treeOpt } = options || {};
    const getChild = typeof children === "function" ? children : (o) => o[children];
    const getItem = setItem || ((o, lft, rft, depth) => ({ ...o, lft, rft, depth }));

    const list = [];

    let left = startLeft;
    itemTree.forEach(function (o) {
      let right = buildNode(o, left, startDepth).right;
      left = right + 1;
    });

    function buildNode(o, left, depth, nodes?) {
      let right = left + 1;

      const cNodes = [];
      const cList = getChild(o);
      if (cList && cList.length) {
        const cDepth = depth + 1;
        cList.forEach(function (co) {
          right = buildNode(co, right, cDepth, cNodes) + 1;
        });
      }

      const item = getItem(o, left, right, depth, cNodes);
      list.push(item);
      nodes && nodes.push(item);

      return right;
    }

    return new NestedTree(list, treeOpt);
  }

  /**
   * flat tree创建nested tree
   * options:
   *  parentId - 创建时获取parentId - 默认'parentId'
   *  startLeft - 起始左节点 - 默认1
   *  setItem - 创建时生成item
   */
  static fromFlat<T>(
    flatTree: Array<T>,
    options?: TreeOp<T> & {
      startDepth?: number;
      startLeft?: number;
      flatId?: string & ((o: T) => number | string);
      parentId?: string | ((o: T) => number | string);
      isRoot?: (pid: string | number, o?: T) => boolean;
      setItem: (o: T, lft: number, rft: number, depth: number, children?: Array<T>) => any;
    }
  ): NestedTree<T> {
    const { flatId = "id", parentId = "parentId", isRoot, setItem, ...itemOpt } = options || {};

    const getId = typeof flatId === "function" ? flatId : (o) => o[flatId];
    const getPid = typeof parentId === "function" ? parentId : (o) => o[parentId];
    const getIsRoot = typeof isRoot === "function" ? isRoot : (pid, o) => pid !== null && pid !== undefined;
    const getItem = setItem || ((o, lft, rft, depth) => ({ ...o, lft, rft, depth }));

    const list = [];
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
        list.push(info);
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

    const setItemFlat = function (o, lft, rft, depth, children) {
      return getItem(o.doc, lft, rft, depth, children);
    };
    itemOpt["setItem"] = setItemFlat;

    return NestedTree.fromItem(list, itemOpt);
  }

  private initOptions(options?: TreeOp<T>) {
    const id = options?.id || "id";
    const lft = options?.lft || "lft";
    const rft = options?.rft || "rft";

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

    if (typeof rft === "object") {
      this.getRft = rft.get;
      this.setRft = rft.set;
    } else {
      this.getRft = function (o) {
        return o[rft];
      };
      this.setRft = function (o, n) {
        o[rft] = n;
      };
    }
  }

  private map: { [key: string]: T };
  private list: Array<T>;
  private nodeData: T;

  private getId: (o: T) => string | number;
  private getLft: (o: T) => number;
  private setLft: (o: T, n: number) => any;
  private getRft: (o: T) => number;
  private setRft: (o: T, n: number) => any;

  public values() {
    // todo
  }

  public get(id) {
    return this.map[id];
  }

  public node(id) {}

  public forEach(fn) {
    this.list.forEach(fn, this);
  }

  public push(item: T | NestedTree<T>) {

  }
}

class NestedBase<T> {
  constructor() {}

  private get: (id) => any;
  private list: Array<any>;
  private getId: (o: T) => string | number;
  private getLft: (o: T) => number;
  private setLft: (o: T, n: number) => any;
  private getRft: (o: T) => number;
  private setRft: (o: T, n: number) => any;
  private getDpt: (o: T) => number;
  private setDpt: (o: T, n: number) => any;

  protected push(item, id) {
    let lft, rft, dpt;
    if (id !== null && id !== undefined) {
      let o = this.get(id);
      if (!o) {
        throw new Error("Node for id:" + id + "is not exist");
      }
      lft = this.getLft(o);
      rft = this.getRft(o);
      dpt = this.getDpt(o);
    } else {
    }
  }

  unshift;
}

class NestedNode {
  constructor() {}

  value() {}

  push() {}
  unshift() {}

  link() {}
  linkBefore() {}
}

let t = new NestedTree([]);

t.get;
