interface ItemTreeOptions<T> {
  id?: string | number | ((o: T) => string | number);
  children?: string | number | ((o: T) => Array<T>);
}

type iteratContext = {
  path: Array<number>;
  end: () => void;
  stop: () => void;
};

type iteratFn<T> = (item: T, pData?: any, context?: iteratContext) => any;

type iteratUpFn<T> = (item: T, subData?: Array<any>, context?: iteratContext) => any;

type filterInfo<T = any> = string | number | ((o: T) => boolean);
