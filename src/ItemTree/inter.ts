abstract class ItemTree {
  /**
   * 从flat列表生成自定义的ItemTree
   * options:
   *    id - 唯一标识 - 默认'id'
   *    pid - 父的唯一标识 - 默认'parentId'
   *    item - 如何生成itemTree元素 - 默认 {children: [o]} => o
   *    isRoot - 判断是否是根元素 - 默认pid为null或undefined是根元素
   *    onRest - 处理非root且未发现父的元素 - 默认无
   */
  static fromFlat: <T>(
    flatList: Array<T>,
    options?: {
      id?: string | ((o: T) => any);
      pid?: string | ((o: T) => any);
      item?: string | ((o: T, children: Array<T>) => any);
      isRoot?: (o: any) => boolean;
      onRest?: (o: Array<T>) => any;
    }
  ) => ItemTree;

  /**
   * 从nest树生成自定义的ItemTree
   * options:
   *    lft - 左值 - 默认'lft'
   *    rft - 右值- 默认'rft'
   *    item - 如何生成根元素，默认 {children: [o]} => o
   */
  static fromNest: <T>(
    nestTree: Array<T>,
    options?: {
      lft?: string | ((o: T) => number);
      rft?: string | ((o: T) => number);
      item?: string | ((o: T, children: Array<T>) => any);
    }
  ) => ItemTree;



}

// 上面两个生成的若是函数item或id或pid，则生成树后续如要用到则需手动指定







