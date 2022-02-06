type KeyOp<T> =
  | string
  | number
  | {
      get: (o: T) => number;
      set: (o: T, n: number) => any;
    };

type TreeOptions<T> = {
  id?: string | number | ((o: T) => number | string);
  lft?: KeyOp<T>;
  rgt?: KeyOp<T>;
  depth?: KeyOp<T>;
  pid?: KeyOp<T>;
  rootPid?: string | number | null;
};

type BuildItemOptions<T, S> = TreeOptions<T> & {
  startDepth?: number;
  startLeft?: number;
  children?: string | number | ((o: S) => Array<S>);
  setItem?: (o: S, lft: number, rgt: number, depth: number, parentId: number | string) => T;
};

type BuildFlatOptions<T, S> = TreeOptions<T> & {
  startDepth?: number;
  startLeft?: number;
  flatId?: string | number | ((o: S) => number | string);
  flatPid?: string | number | ((o: S) => number | string);
  setItem?: (o: S, lft: number, rgt: number, depth: number, parentId: number | string) => any;
};

type idFn<T> = string | number | ((o: T) => boolean);

type PosType = 1 | 2 | 3 | 4;

type SetItem = string | number | ((o, childs) => any);

type RelationType = "default" | "direct" | "self-direct" | "no-self" | "no-self-no-direct";

type ListInfo<T> = {
  list: Array<T>;
  minLeft: number;
  minDpt: number;
};
