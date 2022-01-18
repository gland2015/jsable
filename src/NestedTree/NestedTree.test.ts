import { NestedTree } from ".";

const { TestList, eachTable } = init();

const InitList = new TestList();
const testIds = InitList.idList;
const moveTarIds = [1, 49, 63, , 46, 34, 43, 44];

describe.each(eachTable)("NestedTree", (treeOp, util) => {
  it("toItemTreeObj", () => {
    const testList1 = new TestList();
    const testList2 = new TestList();

    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    nestedTree.check();

    let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
    expect(testList2.list).toEqual(treeList);
  });

  it("get", () => {
    const testList1 = new TestList();
    const testList2 = new TestList();

    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    // 1 随机获取
    let id = testList2.randomId();
    let item = nestedTree.get(id);
    let testItem = testList2.get(id);
    expect(util.getUserId(item)).toEqual(testItem.userId);

    // 2 随机获取
    id = testList2.randomId();
    item = nestedTree.get(function (o) {
      return util.getId(o) === id;
    });
    testItem = testList2.get(id);
    expect(util.getUserId(item)).toEqual(testItem.userId);

    // 3 建立索引后随机获取
    nestedTree.setIndex();
    id = testList2.randomId();
    item = nestedTree.get(id);
    testItem = testList2.get(id);
    expect(util.getUserId(item)).toEqual(testItem.userId);
  });

  it("push", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    const testList2 = new TestList();
    let nestedTree = nestedTree1.clone();

    let data = [
      {
        id: 1001,
        path: [],
        order: 1,
        userId: 1001,
        children: [
          {
            id: 1002,
            path: [1001],
            order: 1,
            userId: 1002,
            children: [],
          },
        ],
      },
      {
        id: 1003,
        path: [],
        order: 2,
        userId: 1003,
        children: [],
      },
    ];
    nestedTree.push(JSON.parse(JSON.stringify(data)));
    testList2.push(null, data);

    nestedTree.check();

    let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
    expect(testList2.list).toEqual(treeList);
  });

  it("push move", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    [testList1.lastId].forEach(function (idTar) {
      const { parentIds, otherIds } = testList1.getRelIds(idTar, 2);

      otherIds.forEach(function (idMove) {
        const testList2 = new TestList();
        let nestedTree = nestedTree1.clone();

        nestedTree.push(nestedTree.node(idMove));
        nestedTree.check();

        testList2.moveTo(idMove, idTar, 2);

        let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
        expect(testList2.list).toEqual(treeList);
      });
    });
  });

  it("unshift", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    const testList2 = new TestList();
    let nestedTree = nestedTree1.clone();

    let data = [
      {
        id: 1001,
        path: [],
        order: 1,
        userId: 1001,
        children: [
          {
            id: 1002,
            path: [1001],
            order: 1,
            userId: 1002,
            children: [],
          },
        ],
      },
      {
        id: 1003,
        path: [],
        order: 2,
        userId: 1003,
        children: [],
      },
    ];
    nestedTree.unshift(JSON.parse(JSON.stringify(data)));
    testList2.unshift(null, data);

    nestedTree.check();

    let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
    expect(testList2.list).toEqual(treeList);
  });

  it("unshift move", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    [testList1.firstId].forEach(function (idTar) {
      const { parentIds, otherIds } = testList1.getRelIds(idTar, 1);

      otherIds.forEach(function (idMove) {
        const testList2 = new TestList();
        let nestedTree = nestedTree1.clone();

        nestedTree.unshift(nestedTree.node(idMove));
        nestedTree.check();

        testList2.moveTo(idMove, idTar, 1);

        let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
        expect(testList2.list).toEqual(treeList);
      });
    });
  });

  it.only("remove", () => {
    const testList1 = new TestList();
    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    nestedTree.remove(nestedTree.node(49).lft, nestedTree.node(57).rgt);
    nestedTree.check();

    const testList2 = new TestList();
    testList2.remove(49);
    testList2.remove(57);

    let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList1));
    expect(testList2.list).toEqual(treeList);
  });

  it("removeBy", () => {
    const testList1 = new TestList();
    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    let idTar = 34;
    nestedTree.removeBy(idTar);
    nestedTree.check();

    const testList2 = new TestList();
    testList2.remove(idTar);

    let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList1));
    expect(testList2.list).toEqual(treeList);
  });
});

describe.each(eachTable)("NestedNode", (treeOp, util) => {
  it("push", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    testIds.forEach(function (id) {
      const testList2 = new TestList();
      let nestedTree = nestedTree1.clone();

      let tarData = testList2.get(id);
      let data = [
        {
          id: 1001,
          path: tarData.path.concat(id),
          order: 1,
          userId: 1001,
          children: [
            {
              id: 1002,
              path: tarData.path.concat(id, 1001),
              order: 1,
              userId: 1002,
              children: [],
            },
          ],
        },
        {
          id: 1003,
          path: tarData.path.concat(id),
          order: 2,
          userId: 1003,
          children: [],
        },
      ];
      nestedTree.node(id).push(JSON.parse(JSON.stringify(data)));
      testList2.push(id, data);

      nestedTree.check();

      let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
      expect(testList2.list).toEqual(treeList);
    });
  });

  it("push move", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    moveTarIds.forEach(function (idTar) {
      const { parentIds, otherIds } = testList1.getRelIds(idTar, 4);

      otherIds.forEach(function (idMove) {
        const testList2 = new TestList();
        let nestedTree = nestedTree1.clone();

        nestedTree.node(idTar).push(nestedTree.node(idMove));
        nestedTree.check();

        testList2.moveTo(idMove, idTar, 4);

        let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
        expect(testList2.list).toEqual(treeList);
      });

      parentIds.forEach(function (idMove) {
        let nestedTree = nestedTree1.clone();
        expect(() => {
          nestedTree.node(idTar).push(nestedTree.node(idMove));
        }).toThrowError();
      });
    });
  });

  it("unshift", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    testIds.forEach(function (id) {
      const testList2 = new TestList();
      let nestedTree = nestedTree1.clone();

      let tarData = testList2.get(id);
      let data = [
        {
          id: 1001,
          path: tarData.path.concat(id),
          order: 1,
          userId: 1001,
          children: [
            {
              id: 1002,
              path: tarData.path.concat(id, 1001),
              order: 1,
              userId: 1002,
              children: [],
            },
          ],
        },
        {
          id: 1003,
          path: tarData.path.concat(id),
          order: 2,
          userId: 1003,
          children: [],
        },
      ];
      nestedTree.node(id).unshift(JSON.parse(JSON.stringify(data)));
      testList2.unshift(id, data);

      nestedTree.check();

      let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
      expect(testList2.list).toEqual(treeList);
    });
  });

  it("unshift move", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    moveTarIds.forEach(function (idTar) {
      const { parentIds, otherIds } = testList1.getRelIds(idTar, 3);

      otherIds.forEach(function (idMove) {
        const testList2 = new TestList();
        let nestedTree = nestedTree1.clone();

        nestedTree.node(idTar).unshift(nestedTree.node(idMove));
        nestedTree.check();

        testList2.moveTo(idMove, idTar, 3);

        let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
        expect(testList2.list).toEqual(treeList);
      });

      parentIds.forEach(function (idMove) {
        let nestedTree = nestedTree1.clone();
        expect(() => {
          nestedTree.node(idTar).unshift(nestedTree.node(idMove));
        }).toThrowError();
      });
    });
  });

  it("link", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    testIds.forEach(function (id) {
      const testList2 = new TestList();
      let nestedTree = nestedTree1.clone();

      let tarData = testList2.get(id);
      let data = [
        {
          id: 1001,
          path: tarData.path.concat(),
          order: 1,
          userId: 1001,
          children: [
            {
              id: 1002,
              path: tarData.path.concat(1001),
              order: 1,
              userId: 1002,
              children: [],
            },
          ],
        },
        {
          id: 1003,
          path: tarData.path.concat(),
          order: 2,
          userId: 1003,
          children: [],
        },
      ];
      nestedTree.node(id).link(JSON.parse(JSON.stringify(data)));
      testList2.link(id, data);

      nestedTree.check();

      let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
      expect(testList2.list).toEqual(treeList);
    });
  });

  it("link move", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    moveTarIds.forEach(function (idTar) {
      const { parentIds, otherIds } = testList1.getRelIds(idTar, 2);

      otherIds.forEach(function (idMove) {
        const testList2 = new TestList();
        let nestedTree = nestedTree1.clone();

        nestedTree.node(idTar).link(nestedTree.node(idMove));
        nestedTree.check();

        testList2.moveTo(idMove, idTar, 2);

        let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));

        expect(testList2.list).toEqual(treeList);
      });

      parentIds.forEach(function (idMove) {
        let nestedTree = nestedTree1.clone();
        expect(() => {
          nestedTree.node(idTar).link(nestedTree.node(idMove));
        }).toThrowError();
      });
    });
  });

  it("linkBefore", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    testIds.forEach(function (id) {
      const testList2 = new TestList();
      let nestedTree = nestedTree1.clone();

      let tarData = testList2.get(id);
      let data = [
        {
          id: 1001,
          path: tarData.path.concat(),
          order: 1,
          userId: 1001,
          children: [
            {
              id: 1002,
              path: tarData.path.concat(1001),
              order: 1,
              userId: 1002,
              children: [],
            },
          ],
        },
        {
          id: 1003,
          path: tarData.path.concat(),
          order: 2,
          userId: 1003,
          children: [],
        },
      ];
      nestedTree.node(id).linkBefore(JSON.parse(JSON.stringify(data)));
      testList2.linkBefore(id, data);

      nestedTree.check();

      let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
      expect(testList2.list).toEqual(treeList);
    });
  });

  it("linkBefore move", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    moveTarIds.forEach(function (idTar) {
      const { parentIds, otherIds } = testList1.getRelIds(idTar, 1);

      otherIds.forEach(function (idMove) {
        const testList2 = new TestList();
        let nestedTree = nestedTree1.clone();

        nestedTree.node(idTar).linkBefore(nestedTree.node(idMove));
        nestedTree.check();

        testList2.moveTo(idMove, idTar, 1);

        let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));

        expect(testList2.list).toEqual(treeList);
      });

      parentIds.forEach(function (idMove) {
        let nestedTree = nestedTree1.clone();
        expect(() => {
          nestedTree.node(idTar).linkBefore(nestedTree.node(idMove));
        }).toThrowError();
      });
    });
  });

  it("removeSelf", () => {
    const testList1 = new TestList();
    let nestedTree1 = NestedTree.fromItem(testList1.list, treeOp);

    testIds.forEach(function (idTar) {
      const testList2 = new TestList();
      let nestedTree = nestedTree1.clone();

      nestedTree.node(idTar).removeSelf();
      nestedTree.check();

      testList2.remove(idTar);

      let treeList = nestedTree.toItemTreeObj(util.toItemObj.bind(testList2));
      expect(testList2.list).toEqual(treeList);
    });
  });

  it("parentIds", () => {
    const testList1 = new TestList();
    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    let idTar = 36;
    let parentIds = nestedTree.node(idTar).parentIds();

    expect(parentIds).toEqual([35, 34, 33]);
  });

  it("isChildOf", () => {
    const testList1 = new TestList();
    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    let idTar = 36;

    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(33))).toEqual(true);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(33), "direct")).toEqual(false);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(33), "no-self")).toEqual(true);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(33), "no-self-no-direct")).toEqual(true);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(33), "self-direct")).toEqual(false);

    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(34))).toEqual(true);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(34), "direct")).toEqual(false);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(34), "no-self")).toEqual(true);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(34), "no-self-no-direct")).toEqual(true);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(34), "self-direct")).toEqual(false);

    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(35))).toEqual(true);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(35), "direct")).toEqual(true);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(35), "no-self")).toEqual(true);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(35), "no-self-no-direct")).toEqual(false);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(35), "self-direct")).toEqual(true);

    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(idTar))).toEqual(true);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(idTar), "direct")).toEqual(false);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(idTar), "no-self")).toEqual(false);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(idTar), "no-self-no-direct")).toEqual(false);
    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(idTar), "self-direct")).toEqual(true);

    expect(nestedTree.node(idTar).isChildOf(nestedTree.node(1))).toEqual(false);
  });

  it("isParentOf", () => {
    const testList1 = new TestList();
    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    let idTar = 33;

    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(33))).toEqual(true);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(33), "direct")).toEqual(false);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(33), "no-self")).toEqual(false);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(33), "no-self-no-direct")).toEqual(false);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(33), "self-direct")).toEqual(true);

    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(34))).toEqual(true);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(34), "direct")).toEqual(true);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(34), "no-self")).toEqual(true);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(34), "no-self-no-direct")).toEqual(false);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(34), "self-direct")).toEqual(true);

    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(35))).toEqual(true);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(35), "direct")).toEqual(false);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(35), "no-self")).toEqual(true);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(35), "no-self-no-direct")).toEqual(true);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(35), "self-direct")).toEqual(false);

    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(36))).toEqual(true);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(36), "direct")).toEqual(false);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(36), "no-self")).toEqual(true);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(36), "no-self-no-direct")).toEqual(true);
    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(36), "self-direct")).toEqual(false);

    expect(nestedTree.node(idTar).isParentOf(nestedTree.node(1))).toEqual(false);
  });

  it.only("isSlibingOf", () => {
    const testList1 = new TestList();
    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    let idTar = 33;

    expect(nestedTree.node(33).isSlibingOf(nestedTree.node(1))).toEqual(true);
    expect(nestedTree.node(34).isSlibingOf(nestedTree.node(48))).toEqual(true);

    expect(nestedTree.node(idTar).isSlibingOf(nestedTree.node(2))).toEqual(false);
  });
});

function init() {
  class TestList {
    constructor() {
      this.count = 0;
      this.idMap = {};
      this.idList = [];
      this.list = this.createList(6);
    }

    isParentOf(id, id2) {
      let path = this.idMap[id];
      let path2 = this.idMap[id2];

      if (path.length === 0) return false;

      return path.every((o, i) => o === path2[i]);
    }

    remove(id) {
      const itemIn = this.getInList(id);
      itemIn.list.splice(itemIn.index, 1);
    }

    moveTo(id, id2, pos) {
      const itemIn = this.getInList(id);
      const item2In = this.getInList(id2);

      let newPath;
      itemIn.list[itemIn.index] = null;
      if (pos === 1) {
        item2In.list.splice(item2In.index, 0, itemIn.item);
        newPath = item2In.item.path.concat();
      } else if (pos === 2) {
        item2In.list.splice(item2In.index + 1, 0, itemIn.item);
        newPath = item2In.item.path.concat();
      } else if (pos === 3) {
        item2In.item.children.unshift(itemIn.item);
        newPath = item2In.item.path.concat(item2In.item.id);
      } else {
        // 4
        item2In.item.children.push(itemIn.item);
        newPath = item2In.item.path.concat(item2In.item.id);
      }

      itemIn.list.splice(itemIn.list.indexOf(null), 1);

      rePath(itemIn.item, newPath);

      function rePath(item, path) {
        item.path = path;
        if (item.children.length) {
          let nextPath = path.concat(item.id);
          for (let i = 0; i < item.children.length; i++) {
            rePath(item.children[i], nextPath);
          }
        }
      }
    }

    push(id, list) {
      if (id) {
        this.idMap[id].children.push(...list);
      } else {
        this.list.push(...list);
      }
      this.addMap(list);
    }

    unshift(id, list) {
      if (id) {
        this.idMap[id].children.unshift(...list);
      } else {
        this.list.unshift(...list);
      }
      this.addMap(list);
    }

    link(id, data) {
      const { list, index } = this.getInList(id);
      list.splice(index + 1, 0, ...data);
      this.addMap(list);
    }

    linkBefore(id, data) {
      const { list, index } = this.getInList(id);
      list.splice(index, 0, ...data);
      this.addMap(list);
    }

    addMap(list) {
      for (let i = 0; i < list.length; i++) {
        let item = list[i];
        this.idList.push(item.id);
        this.idMap[item.id] = item;
        if (item.children && item.children.length) {
          this.addMap(item.children);
        }
      }
    }

    get firstId() {
      return this.list[0].id;
    }

    get lastId() {
      return this.list[this.list.length - 1].id;
    }

    list;
    idMap;
    count;
    idList;

    randomId() {
      let ids = this.idList;
      let i = (Math.random() * ids.length) | 0;
      return ids[i];
    }

    getRelIds(id, pos?) {
      let item = this.get(id);
      let parentIds;

      if (pos === 1 || pos === 2) {
        parentIds = item.path.concat();
      } else {
        parentIds = item.path.concat(id);
      }

      let otherIds = this.idList.filter((d) => parentIds.indexOf(d) === -1);

      return {
        parentIds,
        otherIds,
      };
    }

    get(id) {
      let item = this.idMap[id];
      if (!item) {
        throw new Error("not find :" + id);
      }
      return item;
    }

    getInList(id) {
      let item = this.idMap[id];

      let itemInList;
      let itemPid = item.path[item.path.length - 1];
      if (itemPid) {
        itemInList = this.get(itemPid).children;
      } else {
        itemInList = this.list;
      }
      let index = itemInList.indexOf(item);
      if (index === -1) {
        throw new Error("not in list: " + id);
      }

      return {
        list: itemInList,
        index,
        item,
      };
    }

    createList(cNum, parent = []) {
      let list = new Array(cNum).fill(null).map((e, i) => {
        this.count++;
        const id = this.count;
        const curPath = parent.concat(id);
        this.idList.push(id);
        const o = {
          id,
          path: parent,
          order: i,
          userId: id + curPath.join("-"),
          children: this.createList(cNum - 1 - i, curPath),
        };

        this.idMap[id] = o;

        return o;
      });
      return list;
    }
  }

  /**
   * 不同的选项
   */
  let eachTable: any = [
    [
      undefined as any,
      {
        getUserId: function (o) {
          return o.userId;
        },
        getId: function (o) {
          return o.id;
        },
        toItemObj: function (o, childs) {
          let path = this.get(o.id).path;
          if (o.depth - 1 !== path.length) {
            throw new Error("depth error");
          }

          if (o.parentId !== (path[path.length - 1] || null)) {
            throw new Error("error parentId");
          }

          return {
            id: o.id,
            path: path,
            order: o.order,
            userId: o.userId,
            children: childs,
          };
        },
      },
    ],
    [
      {
        id: "id",
        lft: "$lft",
        rgt: "$rgt",
        depth: "$depth",
        pid: "$parentId",
        startDepth: 2,
        startLeft: 3,
        children: "children",
      },
      {
        getUserId: function (o) {
          return o.userId;
        },
        getId: function (o) {
          return o.id;
        },
        toItemObj: function (o, childs) {
          let path = this.get(o.id).path;
          if (o.$depth - 2 !== path.length) {
            throw new Error("depth error");
          }

          if (o.$parentId !== (path[path.length - 1] || null)) {
            throw new Error("error parentId");
          }

          return {
            id: o.id,
            path: path,
            order: o.order,
            userId: o.userId,
            children: childs,
          };
        },
      },
    ],
    [
      {
        id: (o) => o.doc.id,
        lft: {
          set: (o, lft) => (o.data.lft = lft),
          get: (o) => o.data.lft,
        },
        rgt: {
          set: (o, rgt) => (o.data.rgt = rgt),
          get: (o) => o.data.rgt,
        },
        depth: {
          set: (o, dpt) => (o.data.depth = dpt),
          get: (o) => o.data.depth,
        },
        pid: {
          set: (o, pid) => (o.data.parentId = pid),
          get: (o) => o.data.parentId,
        },
        startDepth: 1,
        startLeft: 1,
        setItem: (o, lft, rgt, depth, parentId) => ({
          doc: { id: o.id, path: o.path, order: o.order, userId: o.userId },
          data: { lft, rgt, depth, parentId },
        }),
        children: (o) => o.children,
      },
      {
        getUserId: function (o) {
          return o.doc.userId;
        },
        getId: function (o) {
          return o.doc.id;
        },
        toItemObj: function (o, childs) {
          let path = this.get(o.doc.id).path;
          if (o.data.depth - 1 !== path.length) {
            throw new Error("depth error");
          }

          if (o.data.parentId !== (path[path.length - 1] || null)) {
            throw new Error("error parentId");
          }

          return {
            id: o.doc.id,
            path: path,
            order: o.doc.order,
            userId: o.doc.userId,
            children: childs,
          };
        },
      },
    ],
  ];

  let excludeIndex = [];

  eachTable = eachTable.filter(function (o, i) {
    if (excludeIndex.includes(i)) {
      return false;
    }

    return true;
  });

  return { TestList, eachTable };
}
