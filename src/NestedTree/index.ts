import "./index.d";
import { cloneDeep } from "../cloneDeep";

type NewNode<T, S> = S | T | Array<T> | Array<S> | NestedTree<T, S> | NestedNode<any, any>;

// clone, check self

/**
 * 嵌套模型树
 *
 */
export class NestedTree<T = any, S = any> {
  constructor(list: Array<T>, options?: TreeOptions<T>) {
    this.core = new NestedCore<T, S>(list, options);
  }

  static buildListByItem<T, S>(itemTree: Array<S>, options?: BuildItemOptions<T, S>): Array<T> {
    const bOptions = buildOptions(options);
    const { startDepth = 1, startLeft = 1, children = "children", rootPid = null } = options || {};

    const getId = bOptions.getId;
    const getItem = bOptions.setItem;
    const getChild = typeof children === "function" ? children : (o) => o[children];

    const list = [];

    let left = startLeft;
    itemTree.forEach(function (o) {
      let result = buildNode(o, left, startDepth);
      result.fn(rootPid);
      left = result.right + 1;
    });

    function buildNode(o, left, depth) {
      let right = left + 1;

      const cList = getChild(o);
      const fnList = [];
      if (cList && cList.length) {
        const cDepth = depth + 1;
        for (let i = 0; i < cList.length; i++) {
          let co = cList[i];
          let result = buildNode(co, right, cDepth);
          right = result.right + 1;
          fnList.push(result.fn);
        }
      }

      return {
        right,
        fn: function (pid) {
          const item = getItem(o, left, right, depth, pid);
          list.push(item);

          let id = getId(item);

          for (let i = 0; i < fnList.length; i++) {
            let fn = fnList[i];
            fn(id);
          }
        },
      };
    }

    return list;
  }

  static buildListByFlat<T, S>(flatTree: Array<S>, options?: BuildFlatOptions<T, S>): Array<T> {
    const bOptions = buildOptions(options);
    const { flatId = bOptions.getId, flatPid = bOptions.getPid, setItem, rootPid = null, ...itemOpt } = options || {};

    let itemList = [];

    if (flatTree.length) {
      const getId = typeof flatId === "function" ? flatId : (o) => o[flatId];
      const getPid = typeof flatPid === "function" ? flatPid : (o) => o[flatPid];

      const itemObj = {};

      flatTree.forEach(function (o) {
        const id = getId(o);
        const pid = getPid(o);

        let info = itemObj[id];
        if (info) {
          info.id = id;
          info.pid = pid;
          info.doc = o;
        } else {
          info = itemObj[id] = {
            id,
            pid,
            doc: o,
            children: [],
          };
        }

        if (pid === undefined || pid === null) {
          itemList.push(info);
        } else {
          let pInfo = itemObj[pid];
          if (!pInfo) {
            pInfo = itemObj[pid] = {
              id: pid,
              pid: null,
              doc: null,
              children: [],
            };
          }
          pInfo.children.push(info);
        }
      });

      // 更换pid为参数rootPid
      if (rootPid !== null && itemObj[rootPid] && itemObj[rootPid].children.length) {
        itemList = itemObj[rootPid].children;
      } else if (!itemList.length) {
        // 查找rootList
        for (let key in itemObj) {
          let item = itemObj[key];
          if (!item.doc) {
            itemList = item.children.length;
          }
        }
      }
    }

    itemOpt["rootPid"] = rootPid;
    const setItemFlat = function (o, lft, rgt, depth, pid) {
      return bOptions.setItem(o.doc, lft, rgt, depth, pid);
    };
    itemOpt["setItem"] = setItemFlat;

    const list = NestedTree.buildListByItem<T, S>(itemList, itemOpt);

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
  static fromItem<T, S>(itemTree: Array<S>, options?: BuildItemOptions<T, S>): NestedTree<T, S> {
    const list = NestedTree.buildListByItem<T, S>(itemTree, options);
    const tree = new NestedTree(list, options);
    tree.core.from = "item";
    const { startLeft = 1, startDepth = 1 } = options || {};
    tree.core["$minLeft"] = startLeft;
    tree.core["$minDpt"] = startDepth;
    return tree;
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
  static fromFlat<T, S>(flatTree: Array<S>, options?: TreeOptions<T> & BuildFlatOptions<T, S>): NestedTree<T, S> {
    const list = NestedTree.buildListByFlat<T, S>(flatTree, options);
    const tree = new NestedTree(list, options);
    tree.core.from = "flat";
    const { startLeft = 1, startDepth = 1 } = options || {};
    tree.core["$minLeft"] = startLeft;
    tree.core["$minDpt"] = startDepth;
    return tree;
  }

  private core: NestedCore<T, S>;

  get rootId() {
    return this.core.rootPid;
  }

  public values() {
    return this.core.list;
  }

  public size() {
    return this.core.list.length;
  }

  public setIndex() {
    this.core.setIndex();
  }

  public removeIndex() {
    this.core.removeIndex();
  }

  public get(id: idFn<T>) {
    return this.core.get(id);
  }

  public node(id): NestedNode<T, S> {
    const nodeData = this.core.get(id);
    if (!nodeData) {
      throw new Error("node is not exist:" + id);
    }
    return new NestedNode(nodeData, this.core);
  }

  /**
   * 检查数数据的正确性, 不正确则报错
   *  1、起始
   *  2、父
   *  3、深度
   *  4、连贯
   */
  public check() {
    return this.core.check();
  }

  public isChildOf(node1: NestedNode<T, S>, node2: NestedNode<T, S>, type?: RelationType) {
    return this.core.isChildOf(node1.nodeData, node2.nodeData, type);
  }

  public isParentOf(node1: NestedNode<T, S>, node2: NestedNode<T, S>, type?: RelationType) {
    return this.core.isParentOf(node1.nodeData, node2.nodeData, type);
  }

  public isSlibingOf(node1: NestedNode<T, S>, node2: NestedNode<T, S>) {
    return this.core.isSlibingOf(node1.nodeData, node2.nodeData);
  }

  public parentIds(node: NestedNode<T, S>) {
    return this.core.parentIds(node.nodeData);
  }

  /**
   * 在最后面添加元素
   */
  public push(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 2;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(null, item, position);
    } else {
      const listInfo = this.core.buildNewNode(item, this.core.rootPid);
      this.core.add(listInfo, null, position);
    }

    return this;
  }

  /**
   * 在最前面添加元素
   */
  public unshift(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 1;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(null, item, position);
    } else {
      const listInfo = this.core.buildNewNode(item, this.core.rootPid);
      this.core.add(listInfo, null, position);
    }

    return this;
  }

  public toItemTreeObj(setItem?: SetItem) {
    return this.core.toItemTreeObj(setItem);
  }

  /**
   * 移除节点
   */
  public remove(startLft: number, endRgt: number) {
    return this.core.remove(startLft, endRgt);
  }

  /**
   * 移除节点
   */
  public removeBy(id: idFn<T>) {
    let item = this.get(id);
    if (!item) {
      return null;
    }
    return this.core.remove(this.core.getLft(item), this.core.getRgt(item));
  }

  public clone() {
    let newTree = Object.create(Object.getPrototypeOf(this));
    Object.assign(newTree, this);
    newTree.core = newTree.core.clone();
    return newTree as NestedTree<T, S>;
  }
}

class NestedNode<T, S> {
  constructor(nodeData, core: NestedCore<T, S>) {
    this.nodeData = nodeData;
    this.core = core;
  }

  public nodeData;
  private core: NestedCore<T, S>;

  get lft() {
    return this.core.getLft(this.nodeData);
  }

  get rgt() {
    return this.core.getRgt(this.nodeData);
  }

  get dpt() {
    return this.core.getDpt(this.nodeData);
  }

  get id() {
    return this.core.getId(this.nodeData);
  }

  get parentId() {
    return this.core.getPid(this.nodeData);
  }

  values(): Array<T> {
    let list = [];
    const theLft = this.core.getLft(this.nodeData);
    const theRgt = this.core.getDpt(this.nodeData);

    this.core.forEach((o) => {
      let lft = this.core.getLft(o);
      let rgt = this.core.getRgt(o);

      if (lft >= theLft && rgt <= theRgt) {
        list.push(o);
      }
    });

    return list;
  }

  size() {
    return (this.rgt - this.lft + 1) / 2;
  }

  get(id: idFn<T>): T {
    return this.core.get(id, this.values());
  }

  /**
   * 添加到节点的子节点的最后
   */
  push(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 4;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(this, item, position);
    } else {
      // 追加节点
      const listInfo = this.core.buildNewNode(item, this.id);
      this.core.add(listInfo, this, position);
    }

    return this;
  }

  /**
   * 添加到节点的子节点最前
   */
  unshift(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 3;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(this, item, position);
    } else {
      // 添加节点
      const listInfo = this.core.buildNewNode(item, this.id);
      this.core.add(listInfo, this, position);
    }

    return this;
  }

  link(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 2;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(this, item, position);
    } else {
      // 添加节点
      const listInfo = this.core.buildNewNode(item, this.parentId);
      this.core.add(listInfo, this, position);
    }

    return this;
  }

  linkBefore(item: NewNode<T, S> | NestedNode<T, S>) {
    const position = 1;
    if (item instanceof NestedNode && item["core"] === this.core) {
      // 移动节点
      this.core.move(this, item, position);
    } else {
      // 添加节点
      const listInfo = this.core.buildNewNode(item, this.parentId);
      this.core.add(listInfo, this, position);
    }

    return this;
  }

  public isChildOf(node: NestedNode<T, S>, type?: RelationType) {
    return this.core.isChildOf(this.nodeData, node.nodeData, type);
  }

  public isParentOf(node: NestedNode<T, S>, type?: RelationType) {
    return this.core.isParentOf(this.nodeData, node.nodeData, type);
  }

  public isSlibingOf(node: NestedNode<T, S>) {
    return this.core.isSlibingOf(this.nodeData, node.nodeData);
  }

  public parentIds() {
    return this.core.parentIds(this.nodeData);
  }

  toItemTreeObj(setItem?: SetItem) {
    return this.core.toItemTreeObj(setItem, this.values());
  }

  /**
   * 移除节点
   */
  public remove(startLft: number, endRgt: number) {
    if (startLft <= endRgt && startLft >= this.lft && endRgt <= this.rgt) {
      return this.core.remove(startLft, endRgt);
    } else {
      throw new Error("over range");
    }
  }

  /**
   * 移除节点
   */
  public removeSelf() {
    return this.core.remove(this.lft, this.rgt);
  }

  /**
   * 移除节点
   */
  public removeBy(id: idFn<T>) {
    let item = this.get(id);
    if (!item) {
      return null;
    }
    return this.core.remove(this.core.getLft(item), this.core.getRgt(item));
  }
}

class NestedCore<T, S> {
  constructor(list: Array<T>, options?: TreeOptions<T>) {
    this.list = list;
    this.options = options;
    this.init(options);
  }

  private init(options?: TreeOptions<T>) {
    const { setItem, ...obj } = buildOptions(options);
    Object.assign(this, obj);
  }

  public list: Array<T>;
  public map: { [key: string]: T };

  public from: "flat" | "item";
  public options: TreeOptions<T>;
  public rootPid: string | number;

  public getId: (o: T) => string | number;
  public getPid: (o: T) => string | number;
  public setPid: (o: T, id: string | number | null) => any;
  public getLft: (o: T) => number;
  public setLft: (o: T, n: number) => any;
  public getRgt: (o: T) => number;
  public setRgt: (o: T, n: number) => any;
  public getDpt: (o: T) => number;
  public setDpt: (o: T, n: number) => any;

  private $minLeft: number = null;
  private $minDpt: number = null;

  get minLft() {
    if (this.$minLeft !== null) {
      return this.$minLeft;
    }
    let item = this.minLftItem();
    if (item) {
      this.$minLeft = this.getLft(item);
      this.$minDpt = this.getDpt(item);
      return this.$minLeft;
    } else {
      return null;
    }
  }

  get maxRgt() {
    const size = this.size();
    return size === 0 ? null : this.minLft + size * 2 - 1;
  }

  get minDpt() {
    if (this.$minDpt !== null) {
      return this.$minDpt;
    }
    let item = this.minLftItem();
    if (item) {
      this.$minLeft = this.getLft(item);
      this.$minDpt = this.getDpt(item);
      return this.$minDpt;
    } else {
      return null;
    }
  }

  public clone() {
    let newCore = Object.create(Object.getPrototypeOf(this));
    Object.assign(newCore, this);

    newCore.list = cloneDeep(this.list);
    if (this.options) {
      newCore.options = cloneDeep(this.options);
    }

    if (this.map) {
      newCore.setIndex();
    }

    return newCore as NestedCore<T, S>;
  }

  public check() {
    const options = this.options || {};
    let startDepth = null;
    let startLeft = null;

    // 检查起始
    if (this.from) {
      startDepth = selectValue("number", options["startDepth"], 1);
      startLeft = selectValue("number", options["startLeft"], 1);
      if (this.$minDpt !== null && startDepth !== this.$minDpt) {
        throw new Error("minDpt and startDepth not same: startDepth: " + startDepth + ", minDpt: " + this.$minDpt);
      }
      if (this.$minLeft !== null && startLeft !== this.$minLeft) {
        throw new Error("minLeft and startLeft not same: startLeft: " + startLeft + ", minLeft: " + this.$minLeft);
      }
    } else {
      if (this.$minDpt !== null) {
        startDepth = this.$minDpt;
      }
      if (this.$minLeft !== null) {
        startLeft = this.$minLeft;
      }
    }

    if (!this.list.length) {
      return;
    }

    let list = this.toItemTreeObj((o, childs) => {
      return {
        item: o,
        id: this.getId(o),
        lft: this.getLft(o),
        rgt: this.getRgt(o),
        pid: this.getPid(o),
        dpt: this.getDpt(o),
        childs,
      };
    });

    // 检查起始
    let firstItem = list[0];
    if (startDepth !== null) {
      let dpt = firstItem.dpt;
      if (startDepth !== dpt) {
        throw new Error("startDepth is not right: " + startDepth + " - " + dpt);
      }
    } else {
      startDepth = firstItem.dpt;
    }

    if (startLeft !== null) {
      let lft = firstItem.lft;
      if (lft !== startLeft) {
        throw new Error("startLeft is not right: " + startLeft + " - " + lft);
      }
    } else {
      startLeft = firstItem.lft;
    }

    iterat(list, firstItem.pid, startDepth, startLeft);

    function iterat(list, pid, dpt, value) {
      for (let i = 0; i < list.length; i++) {
        let o = list[i];

        // 检查父
        if (o.pid !== pid) {
          throw new Error(o.id + " parentId is not right: " + o.pid + " - " + pid);
        }
        // 检查深度
        if (o.dpt !== dpt) {
          throw new Error(o.id + " depth is not right: " + o.dpt + " - " + dpt);
        }

        // 检查左连贯
        if (o.lft !== value) {
          throw new Error(o.id + " left value is not right: " + o.lft + " - " + value);
        }

        if (o.childs.length) {
          value = iterat(o.childs, o.id, dpt + 1, value + 1) + 1;
        } else {
          value = value + 1;
        }

        // 检查右连贯
        let rgt = value;
        if (rgt !== o.rgt) {
          throw new Error(o.id + " right is not right: " + o.rgt + " - " + rgt);
        }

        if (i !== list.length - 1) {
          value = value + 1;
        }
      }
      // 返回列表最后大的右值，空列表返回原值
      return value;
    }
  }

  public size(): number {
    return this.list.length;
  }

  public get(id: idFn<T>, list = this.list): T {
    let result: T;
    let is;
    if (typeof id === "function") {
      is = id;
    } else {
      if (this.map) {
        return this.map[id];
      }

      is = (o) => {
        let oId = this.getId(o);
        return oId === id;
      };
    }

    const l = list.length;
    for (let i = 0; i < l; i++) {
      const o = list[i];
      if (is(o)) {
        result = o;
        break;
      }
    }

    return result;
  }

  public forEach(fn, list = this.list) {
    const l = list.length;
    for (let i = 0; i < l; i++) {
      fn(list[i]);
    }
  }

  public setIndex() {
    let map = {};
    this.forEach((o) => {
      let id = this.getId(o);
      map[id] = o;
    });
    this.map = map;
  }

  public removeIndex() {
    this.map = null;
  }

  public isChildOf(node1: T, node2: T, type?: RelationType) {
    const l1 = this.getLft(node1);
    const r1 = this.getRgt(node1);
    const l2 = this.getLft(node2);
    const r2 = this.getRgt(node2);

    if (!type || type === "default") {
      return l1 >= l2 && r1 <= r2;
    }

    if (type === "no-self") {
      return l1 > l2 && r1 < r2;
    }

    const dpt1 = this.getDpt(node1);
    const dpt2 = this.getDpt(node2);

    if (type === "direct") {
      return l1 > l2 && r1 < r2 && dpt1 === dpt2 + 1;
    }

    if (type === "no-self-no-direct") {
      return l1 > l2 && r1 < r2 && dpt1 > dpt2 + 1;
    }

    if (type === "self-direct") {
      return l1 >= l2 && r1 <= r2 && dpt1 <= dpt2 + 1;
    }

    throw new Error("unknown relation type: " + type);
  }

  public isParentOf(node1: T, node2: T, type?: RelationType) {
    const l1 = this.getLft(node1);
    const r1 = this.getRgt(node1);
    const l2 = this.getLft(node2);
    const r2 = this.getRgt(node2);

    if (!type || type === "default") {
      return l1 <= l2 && r1 >= r2;
    }

    if (type === "no-self") {
      return l1 < l2 && r1 > r2;
    }

    const dpt1 = this.getDpt(node1);
    const dpt2 = this.getDpt(node2);

    if (type === "direct") {
      return l1 < l2 && r1 > r2 && dpt1 === dpt2 - 1;
    }

    if (type === "no-self-no-direct") {
      return l1 < l2 && r1 > r2 && dpt1 < dpt2 - 1;
    }

    if (type === "self-direct") {
      return l1 <= l2 && r1 >= r2 && dpt1 >= dpt2 - 1;
    }

    throw new Error("unknown relation type: " + type);
  }

  public isSlibingOf(node1: T, node2: T) {
    const pid1 = this.getPid(node1);
    const pid2 = this.getPid(node2);

    return pid1 === pid2;
  }

  public parentIds(node: T) {
    if (this.map) {
      let pid = this.getPid(node);
      let ids = [];

      while (pid !== undefined && pid !== null) {
        ids.push(pid);
        let nextNode = this.map[pid];
        if (!nextNode) {
          break;
        }
        pid = this.getPid(nextNode);
      }
      return ids;
    } else {
      let nLft = this.getLft(node);
      let nRgt = this.getRgt(node);
      let ids = [];
      this.forEach((o) => {
        let lft = this.getLft(o);
        let rgt = this.getRgt(o);
        if (lft < nLft && rgt > nRgt) {
          ids.push({
            lft,
            id: this.getId(o),
          });
        }
      });
      ids.sort((a, b) => b.lft - a.lft);
      return ids.map((o) => o.id);
    }
  }

  public buildNewNode(item: NewNode<T, S>, parentId: any) {
    const result: ListInfo<T> = {
      list: [],
      minLeft: null,
      minDpt: null,
    };

    if (!item) {
      return result;
    }

    if (item instanceof NestedTree) {
      let values = item.values();
      if (values.length) {
        let oldPid = item["core"].rootPid;
        if (oldPid !== parentId) {
          this.forEach((o) => {
            let pid = this.getPid(o);
            if (pid === oldPid) {
              this.setPid(o, parentId);
            }
          }, values);
        }
        result.list = values;
        result.minLeft = item["core"]["$minLeft"];
        result.minDpt = item["core"]["$minDpt"];
      }
      return result;
    }

    if (item instanceof NestedNode) {
      this.setPid(item.nodeData, parentId);
      result.list = item.values();
      result.minLeft = item.lft;
      result.minDpt = item.dpt;
      return result;
    }

    if (!Array.isArray(item)) {
      item = [item] as Array<T> | Array<S>;
    }

    if (this.from === "flat") {
      let tree = NestedTree.fromFlat<T, S>(item as Array<S>, { ...this.options, rootPid: parentId });
      result.list = tree.values();
      result.minLeft = tree["core"]["$minLeft"];
      result.minDpt = tree["core"]["$minDpt"];
      return result;
    }

    if (this.from === "item") {
      let tree = NestedTree.fromItem<T, S>(item as Array<S>, { ...this.options, rootPid: parentId });
      result.list = tree.values();
      result.minLeft = tree["core"]["$minLeft"];
      result.minDpt = tree["core"]["$minDpt"];
      return result;
    }

    // 查找pid
    let lftItem = this.minLftItem(item as Array<T>);
    let lPid = this.getPid(lftItem);
    if (lPid !== parentId) {
      // 替换pid
      this.forEach((o) => {
        let pid = this.getPid(o);
        if (pid === lPid) {
          this.setPid(o, parentId);
        }
      }, item as Array<T>);
    }
    result.list = item as Array<T>;
    result.minLeft = this.getLft(lftItem);
    result.minDpt = this.getDpt(lftItem);
    return result;
  }

  /**
   * 获取右值最大的元素
   */
  public maxRgtItem(list?: Array<T>): T | null {
    let maxItem = null;
    let maxRgt = null;
    this.forEach((o) => {
      const rgt = this.getRgt(o);
      if (maxRgt === null || maxRgt < rgt) {
        maxItem = o;
        maxRgt = rgt;
      }
    }, list);
    return maxItem;
  }

  /**
   * 获取左值最小的元素
   */
  public minLftItem(list?: Array<T>): T | null {
    let minItem = null;
    let minLft = null;
    this.forEach((o) => {
      let lft = this.getLft(o);
      if (minLft === null || minLft > lft) {
        minItem = o;
        minLft = lft;
      }
    }, list);
    return minItem;
  }

  /**
   * 添加子列表
   *
   * position:
   *  1 - tarNode左边，或最左(无tarNode)
   *  2 - tarNode右边，或最右(无tarNode)
   *  3 - tarNode的最前子节点
   *  4 - tarNode的最后子节点
   */
  public add(listInfo: ListInfo<T>, tarNode: NestedNode<T, S>, position: PosType) {
    const list = listInfo.list;

    if (!list.length) return this;

    // 新列表新增左右值，和深度
    let newAdd: number, newDptAdd: number;

    let newMinLft = listInfo.minLeft;
    let newDpt = listInfo.minDpt;
    if (typeof newMinLft !== "number" || typeof newDpt !== "number") {
      const newMinLftItem = this.minLftItem(list);
      newMinLft = this.getLft(newMinLftItem);
      newDpt = this.getDpt(newMinLftItem);
    }

    if (this.list.length) {
      // 当前列表新增左值右值
      let curAdd: number;

      let targetLft;
      let newMaxRgt = newMinLft + list.length * 2 - 1;

      if (tarNode) {
        if (position === 1 || position === 3) {
          targetLft = position === 1 ? tarNode.lft : tarNode.lft + 1;
          const tarDpt = position === 1 ? tarNode.dpt : tarNode.dpt + 1;
          newDptAdd = tarDpt - newDpt;
        } else {
          targetLft = position === 2 ? tarNode.rgt + 1 : tarNode.rgt;
          const tarDpt = position === 2 ? tarNode.dpt : tarNode.dpt + 1;
          newDptAdd = tarDpt - newDpt;
        }
        curAdd = newMaxRgt - newMinLft + 1;
        newAdd = targetLft - newMinLft;
      } else {
        if (position === 1) {
          // unshift
          const minLft = this.minLft;
          const minLftDpt = this.minDpt;

          targetLft = minLft;

          curAdd = newMaxRgt + 1 - newMinLft;
          newAdd = minLft - newMinLft;
          newDptAdd = minLftDpt - newDpt;
        } else {
          // push
          const maxRgt = this.maxRgt;
          const maxRgtDpt = this.minDpt;

          targetLft = maxRgt + 1;

          newAdd = maxRgt + 1 - newMinLft;
          newDptAdd = maxRgtDpt - newDpt;
        }
      }

      if (curAdd) {
        this.forEach((o) => {
          let lft = this.getLft(o);
          let rgt = this.getRgt(o);

          if (lft >= targetLft) {
            lft += curAdd;
            this.setLft(o, lft);
          }

          if (rgt >= targetLft) {
            rgt += curAdd;
            this.setRgt(o, rgt);
          }
        });
      }
    } else {
      const { startDepth = 1, startLeft = 1 } = (this.options as any) || {};
      let minLft = selectValue("number", this.$minLeft, this.from ? startLeft : null);
      let minDpt = selectValue("number", this.$minDpt, this.from ? startDepth : null);

      if (typeof minLft !== "number") {
        this.$minLeft = newMinLft;
      } else {
        this.$minLeft = minLft;
        newAdd = minLft - newMinLft;
      }

      if (typeof minDpt !== "number") {
        this.$minDpt = newDpt;
      } else {
        this.$minDpt = minDpt;
        newDptAdd = minDpt - newDpt;
      }
    }

    if (newAdd) {
      this.forEach((o) => {
        let lft = this.getLft(o) + newAdd;
        let rgt = this.getRgt(o) + newAdd;
        this.setLft(o, lft);
        this.setRgt(o, rgt);
      }, list);
    }

    if (newDptAdd) {
      this.forEach((o) => {
        let dpt = this.getDpt(o) + newDptAdd;
        this.setDpt(o, dpt);
      }, list);
    }

    if (this.map) {
      this.forEach((o) => {
        let id = this.getId(o);
        this.map[id] = o;
      }, list);
    }

    this.list.push(...list);

    return this;
  }

  public remove(minLeft: number, maxRight: number) {
    const newList = [];
    const rList = [];

    let diff = maxRight - minLeft + 1;
    this.forEach((o) => {
      let lft = this.getLft(o);
      let rgt = this.getRgt(o);

      if (lft >= minLeft && rgt <= maxRight) {
        rList.push(o);
        return;
      }
      if (lft >= minLeft) {
        this.setLft(o, lft - diff);
      }
      if (rgt >= maxRight) {
        this.setRgt(o, rgt - diff);
      }
      newList.push(o);
    });
    this.list = newList;

    if (this.map) {
      this.forEach((o) => {
        let id = this.getId(o);
        delete this.map[id];
      });
    }

    return rList;
  }

  public move(curNode: NestedNode<T, S>, moveNode: NestedNode<T, S>, position: PosType) {
    const initLft = moveNode.lft;
    const initRgt = moveNode.rgt;

    let tarLft, dptAdd;

    if (curNode) {
      if (position === 1) {
        tarLft = curNode.lft;
        dptAdd = curNode.dpt - moveNode.dpt;
      } else if (position === 2) {
        tarLft = curNode.rgt + 1;
        dptAdd = curNode.dpt - moveNode.dpt;
      } else if (position === 3) {
        tarLft = curNode.lft + 1;
        dptAdd = curNode.dpt + 1 - moveNode.dpt;
      } else {
        tarLft = curNode.rgt;
        dptAdd = curNode.dpt + 1 - moveNode.dpt;
      }
    } else {
      if (position === 1) {
        const minLft = this.minLft;
        const minLftDpt = this.minDpt;

        tarLft = minLft;
        dptAdd = minLftDpt - moveNode.dpt;
      } else {
        const maxRgt = this.maxRgt;
        const maxRgtDpt = this.minDpt;

        tarLft = maxRgt + 1;
        dptAdd = maxRgtDpt - moveNode.dpt;
      }
    }

    let hasMove = this.move_(initLft, initRgt, tarLft, dptAdd);

    if (hasMove) {
      if (curNode) {
        if (position === 1 || position === 2) {
          this.setPid(moveNode.nodeData, curNode.parentId);
        } else {
          this.setPid(moveNode.nodeData, curNode.id);
        }
      } else {
        this.setPid(moveNode.nodeData, null);
      }
    }
  }

  /**
   * 参数:
   *  l1 - 移动节点的左值
   *  r1 - 移动节点的右值
   *  l2 - 占位移动后的左值
   *  dptDiff - 两边的深度差
   */
  public move_(l1: number, r1: number, l2: number, dptDiff: number) {
    if (l1 === l2 || r1 + 1 === l2) {
      return false;
    }

    if (l1 <= l2 && l2 <= r1) {
      throw new Error("can not move to self!");
    }

    const d1 = r1 - l1;
    const diff = l2 - l1;
    const isBack = l1 >= l2;

    const C_d1_1 = d1 + 1;
    const C_diff_d_1 = diff - d1 - 1;

    this.forEach((o) => {
      const x = this.getLft(o);
      const y = this.getRgt(o);

      const isMove = isMoveNode(x, y);
      if (isBack) {
        if (isMove) {
          this.setLft(o, x + diff);
          this.setRgt(o, y + diff);
          if (dptDiff) {
            this.setDpt(o, this.getDpt(o) + dptDiff);
          }
        } else {
          if (x >= l2 && x <= l1) {
            this.setLft(o, x + C_d1_1);
          }

          if (y >= l2 && y <= l1) {
            this.setRgt(o, y + C_d1_1);
          }
        }
      } else {
        if (isMove) {
          this.setLft(o, x + C_diff_d_1);
          this.setRgt(o, y + C_diff_d_1);
          if (dptDiff) {
            this.setDpt(o, this.getDpt(o) + dptDiff);
          }
        } else {
          if (x < l2 && x > l1) {
            this.setLft(o, x - C_d1_1);
          }

          if (y < l2 && y > l1) {
            this.setRgt(o, y - C_d1_1);
          }
        }
      }
    });

    return true;

    function isMoveNode(x, y) {
      return x >= l1 && y <= r1;
    }
  }

  public toItemTreeObj(setItem: SetItem = "children", values = this.list) {
    // 1、fn返回目标元素的子元素列表
    // 2、每个子元素已包含其子
    const that = this;
    if (typeof setItem === "string") {
      let name = setItem;
      setItem = function (o, childs) {
        o[name] = childs;
        return o;
      };
    }

    let list = values.concat().sort((a, b) => {
      let lft = this.getLft(a);
      let lft2 = this.getLft(b);
      return lft - lft2;
    });

    let result = [];
    findChild(result);

    return result;

    function findChild(arr, rgt = Number.POSITIVE_INFINITY, index = 0) {
      let item = list[index];
      if (item) {
        let itemRgt = that.getRgt(item);
        if (itemRgt <= rgt) {
          index++;
          let cList = [];
          index = findChild(cList, itemRgt, index);
          let bItem = (setItem as any)(item, cList);
          arr.push(bItem);

          return findChild(arr, rgt, index);
        }
      }
      return index;
    }
  }

  public toItemTreeObj_(setItem: SetItem = "children", values = this.list) {
    if (typeof setItem === "string") {
      let name = setItem;
      setItem = function (o, childs) {
        o[name] = childs;
        return o;
      };
    }

    let list = values.concat().sort((a, b) => {
      let lft = this.getLft(a);
      let lft2 = this.getLft(b);
      return lft - lft2;
    });

    let result = [];
    let stack = [];

    for (let i = 0; i <= list.length; i++) {
      let item = list[i];

      let itemRgt = this.getRgt(item);
      if (item && !stack.length) {
        stack.push({
          rgt: itemRgt,
          item,
          childs: [],
        });
        continue;
      }

      for (let j = stack.length - 1; j >= 0; j--) {
        let data = stack[j];
        if (!item || itemRgt > data.rgt) {
          let bItem = setItem(data.item, data.childs);
          if (j === 0) {
            result.push(bItem);
          } else {
            stack[j - 1].childs.push(bItem);
          }
          stack.pop();
        } else {
          stack.push({
            rgt: itemRgt,
            item,
            childs: [],
          });
          break;
        }
      }
    }

    return result;
  }
}

function selectValue(type: "string" | "number" | "object", ...vlist) {
  let value = null;
  for (let i = 0; i < vlist.length; i++) {
    if (typeof vlist[i] === type) {
      value = vlist[i];
      break;
    }
  }
  return value;
}

function buildOptions(options) {
  const id = options?.id || "id";
  const lft = options?.lft || "lft";
  const rgt = options?.rgt || "rgt";
  const depth = options?.depth || "depth";
  const pid = options?.pid || "parentId";
  const rootPid = options?.rootPid || null;

  const result: any = { rootPid };
  const lists = [
    {
      value: id,
      get: "getId",
    },
    {
      value: lft,
      get: "getLft",
      set: "setLft",
    },
    {
      value: rgt,
      get: "getRgt",
      set: "setRgt",
    },
    {
      value: depth,
      get: "getDpt",
      set: "setDpt",
    },
    {
      value: pid,
      get: "getPid",
      set: "setPid",
    },
  ];

  lists.forEach(function ({ value, set, get }) {
    if (typeof value === "object") {
      if (set) {
        result[set] = value.set;
      }
      result[get] = value.get;
    } else if (typeof value === "function") {
      result[get] = value;
    } else {
      result[set] = function (o, v) {
        o[value] = v;
      };
      result[get] = function (o) {
        return o[value];
      };
    }
  });

  if (options?.setItem) {
    result.setItem = options.setItem;
  } else {
    result.setItem = function (o, lft, rgt, depth, pid) {
      result.setLft(o, lft);
      result.setRgt(o, rgt);
      result.setDpt(o, depth);
      result.setPid(o, pid);
      return o;
    };
  }

  return result;
}

/**

这是一条从左值开始递增的线，若一值小，则先确定，后面的变动不会影响它
[1 2] [3 4] [5 6] [7 8] [8 9]

一、添加：
  设新节点左值为l1，右值为r1，设差d1 = r1 - l1
  则原来的节点:
    1、左值>=l1，左值加d1 + 1
    2、右值>=l1，右值加d1 + 1
二、移除：
  设目标节点左值为l1，右值为r1，设差d1 = r1 - l1
  则剩余的节点:
    1、左值>l1，左值减d1 + 1
    2、右值>l1，右值减d1 + 1
三、移动：
  设目标节点左值为l1，右值为r1，设差d1 = r1 - l1
  设占位添加后的左值为l2,右值则为r2 = l2 + d1
1、占位添加
  (新-2)
  当前节点及其子节点:
    (1)左右都加 l2 - l1
  则其余节点:
    (1)左值>=l2，左值加d1 + 1
    (2)右值>=l2，右值加d1 + 1
2、移除
  (原-3)
  若l1>=l2，
    则l3 = l1 + d1 + 1, r3 = r1 + d1 + 1  = l1 + 2 * d1 + 1;
    否l3 = l1, r3 = r1 = l1 + d1;
  则所有节点接前一步操作后的:
    (1)左值>l3，左值减d1 + 1
    (2)右值>l3，右值减d1 + 1
3、合并操作
  设讨论节点左值为x,右值为y;
  若l1>=l2,
    对于其余节点(x < l1 || (y>r1 -> y > l1 + d1))：
      (1)若(x>=l2 && (x + d1 + 1 <=l1 + d1 + 1 -> x <= l1))
          即(x>=l2 && x <= l1)
          左值加d1 + 1
        否则若(x < l2 && x > l1 + d1 + 1) -> 不存在
          左值减(d1 + 1)
        否则
          不变
      (2)右值同样

    对于目标节点(x >= l1 && y<=r1 = l1 + d1):
      (1)若(x + l2 - l1 > l1 + d1 + 1)  
          即(x > 2 * l1 - l2 + d1 + 1)
            [-> 由l1 - l2 > d1 (不能移动到自身) -> x > l1 + 2 * d1 + 1] 
            -> 不存在
          左值 加 l2 - l1 - d1 - 1
        否则
          左值 加 l2 - l1
      (2)右值同上

  若l1<l2,
    对于其余节点(x < l1 || (y>r1 -> y > l1 + d1))：
      (1)若(x >= l2 && x + d1 + 1 <= l1)
          即(x >= l2 && x <= l1 - d1 - 1) - 不存在
          左值加d1 + 1
        否则若(x<l2 && x>l1)
          左值减(d1 + 1)
        否则不变
      (2)右值同样
      
    对于目标节点(x >= l1 && y<=r1 = l1 + d1):
      (1)若(x + l2 - l1 > l1) -> 必存在
          即 (x > 2*l1 - l2)
          左值 加 l2 - l1 - d1 - 1
        否则      -> 不存在
          左值 加 l2 - l1
      (2)右值同样



      
      [1 4] [5 6] [7 8]
      [2 3]
      
       let arr = list
        .map((o) => ({
          o,
          lft,
          rgt,
        }))
        .sort((a, b) => a.lft - b.lft);
      
      let result = [];
      
      let i = 0;
      function fn(sList) {
        let item = arr[i];
        sList.push(item);
      
        if (item.lft) {
        }
      }
      
    
      
      

      
      */
