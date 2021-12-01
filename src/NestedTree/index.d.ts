type KeyOp<T> =
  | string
  | {
      get: (o: T) => number;
      set: (o: T, n: number) => any;
    };

type TreeOptions<T> = {
  id?: string | ((o: T) => number | string);
  lft?: KeyOp<T>;
  rgt?: KeyOp<T>;
  depth?: KeyOp<T>;
};

type BuildItemOptions<T> = {
  startDepth?: number;
  startLeft?: number;
  children?: string & ((o: T) => Array<T>);
  setItem?: (o: T, lft: number, rgt: number, depth: number, children?: Array<T>) => any;
};

type BuildFlatOptions<T> = {
  startDepth?: number;
  startLeft?: number;
  flatId?: string & ((o: T) => number | string);
  parentId?: string | ((o: T) => number | string);
  isRoot?: (pid: string | number, o?: T) => boolean;
  setItem: (o: T, lft: number, rgt: number, depth: number, children?: Array<T>) => any;
};
