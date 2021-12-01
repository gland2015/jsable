import "./index.d";

/**
 * 嵌套模型树
 *
 */
export class NestedTree<T> {
  constructor(list: Array<T>, options?: TreeOptions<T>) {
    this.core = this.initCore(options);
    const map = Object.create(null);
    list.forEach((o) => {
      const id = this.core.getId(o);
      map[id] = o;
    });
    this.core.list = list;
    this.core.map = map;
  }

  static buildListByItem<T>(itemTree: Array<T>, options?: BuildItemOptions<T>): Array<T> {
    const { startDepth = 1, startLeft = 1, children = "children", setItem } = options || {};
    const getChild = typeof children === "function" ? children : (o) => o[children];
    const getItem = setItem || ((o, lft, rgt, depth) => ({ ...o, lft, rgt, depth }));

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

    return list;
  }

  static buildListByFlat<T>(flatTree: Array<T>, options?: BuildFlatOptions<T>): Array<T> {
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

    const setItemFlat = function (o, lft, rgt, depth, children) {
      return getItem(o.doc, lft, rgt, depth, children);
    };
    itemOpt["setItem"] = setItemFlat;

    const list = NestedTree.buildListByItem(itemList, itemOpt);

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
  static fromItem<T>(itemTree: Array<T>, options?: TreeOptions<T> & BuildItemOptions<T>): NestedTree<T> {
    const list = NestedTree.buildListByItem<T>(itemTree, options);
    return new NestedTree(list, options);
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
  static fromFlat<T>(flatTree: Array<T>, options?: TreeOptions<T> & BuildFlatOptions<T>): NestedTree<T> {
    const list = NestedTree.buildListByFlat(flatTree, options);
    return new NestedTree(list, options);
  }

  private core: NestedCore<T>;

  private initCore(options?: TreeOptions<T>) {
    const core = new NestedCore<T>();

    const id = options?.id || "id";
    const lft = options?.lft || "lft";
    const rgt = options?.rgt || "rgt";

    if (typeof id === "function") {
      core.getId = id;
    } else {
      core.getId = function (o) {
        return o[id];
      };
    }

    if (typeof lft === "object") {
      core.getLft = lft.get;
      core.setLft = lft.set;
    } else {
      core.getLft = function (o) {
        return o[lft];
      };
      core.setLft = function (o, n) {
        o[lft] = n;
      };
    }

    if (typeof rgt === "object") {
      core.getRgt = rgt.get;
      core.setRgt = rgt.set;
    } else {
      core.getRgt = function (o) {
        return o[rgt];
      };
      core.setRgt = function (o, n) {
        o[rgt] = n;
      };
    }
    return core;
  }

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

  public get(id) {
    return this.core.get(id);
  }

  public node(id) {
    const nodeData = this.core.get(id);
    return new NestedNode(nodeData, this.core);
  }

  public push(item: T | NestedTree<T>) {
    const maxRgt = this.getMaxRgt();
  }
}

class NestedCore<T> {
  constructor() {}

  public list: Array<T>;
  public map: { [key: string]: T };
  public get: (id) => T;

  public getId: (o: T) => string | number;
  public getLft: (o: T) => number;
  public setLft: (o: T, n: number) => any;
  public getRgt: (o: T) => number;
  public setRgt: (o: T, n: number) => any;
  public getDpt: (o: T) => number;
  public setDpt: (o: T, n: number) => any;

  public forEach(fn) {
    this.list.forEach(fn, this);
  }
}

class NestedNode<T> {
  constructor(nodeData, core: NestedCore<T>) {
    this.nodeData = nodeData;
    this.core = core;
  }

  private nodeData;
  private core: NestedCore<T>;

  value() {}

  push() {}
  unshift() {}

  link() {}
  linkBefore() {}
}

let t = new NestedTree([]);

t.get;
