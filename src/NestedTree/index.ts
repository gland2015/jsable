export type KeyOp<T> =
  | string
  | {
      get: (o: T) => number;
      set: (o: T, n: number) => any;
    };

export type TreeOp<T> = {
  lft?: KeyOp<T>;
  rft?: KeyOp<T>;
};

/**
 * 嵌套模型树
 *
 */
export class NestedTree<T> {
  constructor(list: Array<T>, options?: TreeOp<T>) {}

  
}
