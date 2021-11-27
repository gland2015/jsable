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
  }

  // todo null 或 false等代表不设置
  /**
   * 从item tree创建nested tree
   * options:
   *  id - 创建后从元素中获取id - 默认'id'
   *  lft - 创建后从元素设置，获取lft值 - 默认'lft'
   *  rft - 创建后从元素设置，获取rft值 - 默认'rft'
   *  depth - 创建后从元素设置，获取depth值 - 默认'depth'
   *  startLeft - 构建时左节点的起始值 - 默认1
   *  children - 创建时获取children - 默认'children'
   *  setItem - 创建时生成item
   *
   * 算法:
   * buildNode: - 构建一个树节点
   *  1、接收一个节点初始数据，和起始left节点值
   *  2、节点right值为left + 1
   *  3、若有子，则依次构建子，每个子的left为上一个子的right + 1
   *  4、该节点right值为最后一个子的right + 1 或 其left + 1(若无子)
   *  5、生成节点并追加到列表
   *  6、返回该节点的right值
   * buildNode依次构建根节点，每个节点的left为上一个的right + 1
   */
  static fromItem<T>(
    itemTree: Array<T>,
    options?: {
      id?: string & ((o: T) => number | string);
      lft?: KeyOp<T>;
      rft?: KeyOp<T>;
      depth?: KeyOp<T>;
      startLeft?: number;
      children?: string & ((o: T) => Array<T>);
      setItem: (o: T, lft: number, rft: number, depth: number) => any;
    }
  ): NestedTree<T> {
    const { id = "id", lft = "lft", rft = "rft", depth = "depth", startLeft = 1, children = "children", setItem } = options || {};
    const getChild = typeof children === "function" ? children : (o) => o[children];
    const getItem = setItem || ((o, lft, rft, depth) => ({ ...o, lft, rft, depth }));

    const list = [];

    let left = startLeft;
    itemTree.forEach(function (o) {
      let right = buildNode(o, left, 1);
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

      list.push(getItem(o, left, right, depth));

      return right;
    }

    return new NestedTree(list, {
      id,
      lft,
      rft,
      depth,
    });
  }

  /**
   * flat tree创建nested tree
   * options:
   *  id - 创建后从元素中获取id - 默认'id'
   *  lft - 创建后从元素设置，获取lft值 - 默认'lft'
   *  rft - 创建后从元素设置，获取rft值 - 默认'rft'
   *  depth - 创建后从元素设置，获取depth值 - 默认'depth'
   *  parentId - 创建时获取parentId - 默认'parentId'
   *  setItem - 创建时生成item
   */
  static fromFlat<T>(
    flatTree: Array<T>,
    options?: {
      id?: string & ((o: T) => number | string);
      lft?: KeyOp<T>;
      rft?: KeyOp<T>;
      depth?: KeyOp<T>;
      parentId?: KeyOp<T>;
      setItem: (o: T, lft: number, rft: number, depth: number) => any;
    }
  ) {}

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
  private getId: (o: T) => string | number;
  private getLft: (o: T) => number;
  private setLft: (o: T, n: number) => any;
  private getRft: (o: T) => number;
  private setRft: (o: T, n: number) => any;

  public get(id) {
    return this.map[id];
  }
}
