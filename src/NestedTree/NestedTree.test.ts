import { NestedTree } from ".";

const { TestList, eachTable } = init();

describe.each(eachTable)("NestedTree", (treeOp, util) => {
  it("toItemTreeObj", () => {
    const testList1 = new TestList();
    const testList2 = new TestList();

    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    let treeList = nestedTree.toItemTreeObj(util.toItemObj);
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
    const testList2 = new TestList();

    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    let id = 1;
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
    nestedTree.node(1).push(JSON.parse(JSON.stringify(data)));
    testList2.push(1, data);

    let treeList = nestedTree.toItemTreeObj(util.toItemObj);
    expect(testList2.list).toEqual(treeList);
  });
});

function init() {
  class TestList {
    constructor() {
      this.count = 0;
      this.idMap = {};
      this.list = this.createList(6);
    }

    isParentOf(id, id2) {
      let path = this.idMap[id];
      let path2 = this.idMap[id2];

      if (path.length === 0) return false;

      return path.every((o, i) => o === path2[i]);
    }

    move(id, id2) {
      this.idMap[id].children.push(this.idMap[id2]);
    }

    push(id, list) {
      this.idMap[id].children.push(...list);
    }

    list;
    idMap;
    count;

    randomId() {
      let ids = Object.keys(this.idMap).map((id) => parseInt(id));
      let i = (Math.random() * ids.length) | 0;
      return ids[i];
    }

    get(id) {
      return this.idMap[id];
    }

    createList(cNum, parent = []) {
      let list = new Array(cNum).fill(null).map((e, i) => {
        this.count++;
        const id = this.count;
        const curPath = parent.concat(id);
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
          if (o.depth - 1 !== o.path.length) {
            throw new Error("depth error");
          }

          return {
            id: o.id,
            path: o.path,
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
          if (o.$depth - 2 !== o.path.length) {
            throw new Error("depth error");
          }

          return {
            id: o.id,
            path: o.path,
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
        startDepth: 1,
        startLeft: 1,
        setItem: (o, lft, rgt, depth) => ({
          doc: { id: o.id, path: o.path, order: o.order, userId: o.userId },
          data: { lft, rgt, depth },
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
          if (o.data.depth - 1 !== o.doc.path.length) {
            throw new Error("depth error");
          }

          return {
            id: o.doc.id,
            path: o.doc.path,
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
