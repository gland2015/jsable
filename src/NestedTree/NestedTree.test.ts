import { NestedTree } from ".";

describe("NestedTree", () => {
  let testList1 = new TestList();
  let treeList2 = new TestList();

  it("get", () => {
    let tree = NestedTree.fromItem(testList1.list);

    let id = testList1.randomId();
    let item = tree.get(id);
    let testItem = testList1.get(id);

    expect(item["path"]).toEqual(testItem["path"]);

    id = testList1.randomId();
    item = tree.get(function (o) {
      return o["id"] === id;
    });
    testItem = testList1.get(id);

    expect(item["path"]).toEqual(testItem["path"]);
  });

  it("push", () => {
    let tree = NestedTree.fromItem(testList1.list);

  })
});

class TestList {
  constructor() {
    this.idMap = {};
    this.list = this.createList(6);
    this.count = 0;
  }

  list;
  idMap;
  count;

  randomId() {
    let ids = Object.keys(this.idMap);
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
        children: this.createList(cNum - 1 - i, curPath),
      };

      this.idMap[id] = o;

      return o;
    });
    return list;
  }
}
