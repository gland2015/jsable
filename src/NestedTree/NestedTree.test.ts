import { NestedTree } from ".";

const { TestList, eachTable } = init();

describe.each(eachTable)("NestedTree", (treeOp, util) => {
  it("get", () => {
    const testList1 = new TestList();
    const testList2 = new TestList();

    let nestedTree = NestedTree.fromItem(testList1.list, treeOp);

    let id = testList2.randomId();
    let item = nestedTree.get(id);
    let testItem = testList2.get(id);

    expect(util.getUserId(item)).toEqual(testItem.userId);

    id = testList2.randomId();
    item = nestedTree.get(function (o) {
      return util.getId(o) === id;
    });
    testItem = testList2.get(id);

    expect(util.getUserId(item)).toEqual(testItem.userId);
  });

  it("push", () => {
    // let tree = NestedTree.fromItem(testList1.list);
  });
});

function init() {
  class TestList {
    constructor() {
      this.count = 0;
      this.idMap = {};
      this.list = this.createList(6);
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
        const curPath = parent.concat(i);
        this.count++;
        const id = this.count;
        const o = {
          id,
          path: curPath,
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

  const eachTable: any = [
    [
      undefined as any,
      {
        getUserId: function (o) {
          return o.userId;
        },
        getId: function (o) {
          return o.id;
        },
      },
    ],
    [
      {
        id: "_id",
        lft: "$lft",
        rgt: "$rgt",
        depth: "$depth",
        startDepth: 2,
        startLeft: 3,
        setItem: (o, lft, rgt, depth) => ({ _id: o.id, $lft: lft, $rgt: rgt, $depth: depth, path: o.path, order: o.order, userId: o.userId }),
        children: "children",
      },
      {
        getUserId: function (o) {
          return o.userId;
        },
        getId: function (o) {
          return o._id;
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
          set: (o, dpt) => (o.data.dpt = dpt),
          get: (o) => o.data.dpt,
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
      },
    ],
  ];

  return { TestList, eachTable };
}
