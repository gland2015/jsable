export type KeyOp<T> = string & {
  get: (o: T) => number;
  set: (o: T, n: number) => any;
};

export type TreeOp<T> = {
  id?: string & ((o: T) => number | string);
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
   *  children - 创建时获取children - 默认'children'
   *  setItem - 创建时生成item
   */
  static fromItem<T>(
    itemTree: Array<T>,
    options?: {
      id?: string & ((o: T) => number | string);
      lft?: KeyOp<T>;
      rft?: KeyOp<T>;
      depth?: KeyOp<T>;
      children?: string & ((o: T) => Array<T>);
      setItem: (o: T, lft: number, rft: number, depth: number) => any;
    }
  ): NestedTree<T> {
    return null;
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
