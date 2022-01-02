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
  pid?: string | KeyOp<T>;
  rootPid?: string | number | null;
};

type BuildItemOptions<T, S> = TreeOptions<T> & {
  startDepth?: number;
  startLeft?: number;
  children?: string | ((o: S) => Array<S>);
  setItem?: (o: S, lft: number, rgt: number, depth: number, parentId: number | string) => T;
};

type BuildFlatOptions<T, S> = TreeOptions<T> & {
  startDepth?: number;
  startLeft?: number;
  flatId?: string & ((o: S) => number | string);
  flatPid?: string | ((o: S) => number | string);
  setItem?: (o: S, lft: number, rgt: number, depth: number, parentId: number | string) => any;
};

type idFn<T> = string | number | ((o: T) => boolean);

type PosType = 1 | 2 | 3 | 4;

type SetItem = string | ((o, childs) => any);

type RelationType = "default" | "direct" | "self-direct" | "no-self" | "no-self-no-direct";
