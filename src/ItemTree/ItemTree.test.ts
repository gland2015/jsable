import { ItemTree } from ".";
import { getTypeChild, RelationType } from "../treeUtils";

describe.each([false, true])("ItemBase", (isSetIndex) => {
  it("iterat", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }
    let order = 1;
    tree.iterat(function (item, pData = null, context) {
      const data = item.iterat;
      expect(data.order).toEqual(order);
      expect(data.pData).toEqual(pData);
      expect(item.path).toEqual(context.path);
      order++;
      return (pData || []).concat(item.id);
    });
  });

  it("iterat stop", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    let order = 1;
    tree.iterat(function (item, pData = null, context) {
      const data = item.iterat;
      expect(data.order).toEqual(order);
      expect(data.pData).toEqual(pData);
      expect(item.path).toEqual(context.path);

      if (order === 2) {
        context.stop();
        order += 2;
      }
      order++;
      return (pData || []).concat(item.id);
    });
  });

  it("iterat end", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    let order = 1;
    tree.iterat(function (item, pData = null, context) {
      const data = item.iterat;
      expect(data.order).toEqual(order);
      expect(data.pData).toEqual(pData);
      expect(item.path).toEqual(context.path);

      if (order === 2) {
        context.end();
        order += 200;
      }
      order++;
      return (pData || []).concat(item.id);
    });
  });

  it("iteratUp", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    let order = 1;
    let list = tree.iteratUp(function (item, subData, context) {
      const data = item.iteratUp;
      expect(data.order).toEqual(order);
      expect(data.subData).toEqual(subData);
      expect(item.path).toEqual(context.path);
      order++;
      return item.id;
    });
    expect(list).toEqual([1, 6]);
  });

  it("iteratUp stop", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    let order = 1;
    let list = tree.iteratUp(function (item, subData, context) {
      const data = item.iteratUp;
      expect(data.order).toEqual(order);
      expect(data.subData).toEqual(subData);
      expect(item.path).toEqual(context.path);
      if (order === 3) {
        context.stop();
        order += 2;
      }
      order++;
      return item.id;
    });
    expect(list).toEqual([null, 6]);
  });

  it("iteratUp end", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    let order = 1;
    let list = tree.iteratUp(function (item, subData, context) {
      const data = item.iteratUp;
      expect(data.order).toEqual(order);
      expect(data.subData).toEqual(subData);
      expect(item.path).toEqual(context.path);
      if (order === 3) {
        context.end();
        order += 200;
      }
      order++;
      return item.id;
    });
    expect(list).toEqual([]);
  });
});

describe.each([false, true])("Action", (isSetIndex) => {
  let relList: Array<RelationType> = [null, "direct", "direct", "direct-indirect", "indirect", "self-direct"];

  it("collect someChild", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    let item3Path = [0, 0, 0];

    relList.forEach(function (type) {
      tree.itemData("1").someChild(function (o) {
        return o.id === 3;
      }, type);
      tree.collect(function (item, data) {
        let isChild = getIsChildOf(item3Path, item.path, type);
        if (isChild) {
          expect(data["1"]).toEqual(true);
        } else {
          expect(data["1"]).toEqual(false);
        }
      });
    });
  });

  it("collect everyChild", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    relList.forEach(function (type) {
      let fn = function (o) {
        return o.id === 3 || o.id === 4 || o.id === 2;
      };
      tree.itemData("1").everyChild(fn, type);

      tree.collect(function (item, data) {
        let childList = tree.node(item).childList(type);
        let bool = childList.every(fn);

        if (bool !== data["1"]) {
          console.log("1");
        }

        expect(bool).toEqual(data["1"]);
      });
    });
  });

  it("collect someParent", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    relList.forEach(function (type) {
      let fn = function (o) {
        return o.id === 1;
      };
      tree.itemData("1").someParent(fn, type);

      tree.collect(function (item, data) {
        let list = tree.node(item).parentList(type);
        let bool = list.some(fn);

        if (bool !== data["1"]) {
          console.log("1");
          tree.node(item).parentList(type);
        }

        expect(bool).toEqual(data["1"]);
      });
    });
  });

  it("collect everyParent", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    relList.forEach(function (type) {
      let fn = function (o) {
        return o.id === 1;
      };
      tree.itemData("1").everyParent(fn, type);

      tree.collect(function (item, data) {
        let list = tree.node(item).parentList(type);
        let bool = list.every(fn);

        if (bool !== data["1"]) {
          console.log("1");
          tree.node(item).parentList(type);
        }

        expect(bool).toEqual(data["1"]);
      });
    });
  });

  it("collect countChildNum", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    relList.forEach(function (type) {
      tree.itemData("1").countChildNum(type);

      tree.collect(function (item, data) {
        let list = tree.node(item).childList(type);
        let bool = list.length;

        if (bool !== data["1"]) {
          console.log("1");
        }

        expect(bool).toEqual(data["1"]);
      });
    });
  });

  it("collect countParentNum", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    relList.forEach(function (type) {
      tree.itemData("1").countParentNum(type);

      tree.collect(function (item, data) {
        let list = tree.node(item).parentList(type);
        let bool = list.length;

        if (bool !== data["1"]) {
          console.log("1");
        }

        expect(bool).toEqual(data["1"]);
      });
    });
  });

  it("collect some", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    tree.entireData("1").some(function (o) {
      return o.id === 1;
    });

    let data = tree.collect();
    expect(data["1"]).toEqual(true);

    tree.unEntireData();
    tree.entireData().some(function (o) {
      return o.id === 9999;
    });

    data = tree.collect();
    expect(data).toEqual(false);
  });

  it("collect every", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    tree.entireData("1").every(function (o) {
      return o.id < 10000;
    });

    let data = tree.collect();
    expect(data["1"]).toEqual(true);
  });

  it("collect reduce", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    tree.entireData("1").reduce(function (value, item) {
      return value + 1;
    }, 0);

    let data = tree.collect();
    expect(data["1"]).toEqual(tree.size());
  });

  it("collect total", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    let item3Path = [0, 0, 0];
    let fn_everyChild = function (o) {
      return o.id === 3 || o.id === 4;
    };
    let fn_someParent = function (o) {
      return o.id === 1;
    };
    let fn_everyParent = function (o) {
      return o.id === 1;
    };

    relList.forEach(function (type) {
      tree
        .itemData("someChild")
        .someChild(function (o) {
          return o.id === 3;
        }, type)
        .itemData("everyChild")
        .everyChild(fn_everyChild, type)
        .itemData("someParent")
        .someParent(fn_someParent, type)
        .itemData("everyParent")
        .everyParent(fn_everyParent, type)
        .entireData("reduce")
        .reduce((value, item) => value + 1, 0)
        .entireData("some")
        .some((item) => item.id === 9999);

      let entireData = tree.collect(function (item, data) {
        let childList = tree.node(item).childList(type);
        let parentList = tree.node(item).parentList(type);

        let someChild = getIsChildOf(item3Path, item.path, type);
        let everyChild = childList.every(fn_everyChild);
        let someParent = parentList.some(fn_someParent);
        let everyParent = parentList.every(fn_everyParent);

        expect(data["someChild"]).toEqual(someChild);
        expect(data["everyChild"]).toEqual(everyChild);
        expect(data["someParent"]).toEqual(someParent);
        expect(data["everyParent"]).toEqual(everyParent);
      });

      expect(entireData.some).toEqual(false);
      expect(entireData.reduce).toEqual(tree.size());
    });
  });
});

describe.each([false, true])("ItemTree", (isSetIndex) => {
  it("isParentOf", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    expect(tree.isParentOf(1, 2)).toEqual(true);
    expect(tree.isParentOf(2, 3)).toEqual(true);
    expect(tree.isParentOf(2, 3, "direct")).toEqual(true);
    expect(tree.isParentOf(2, 3, "direct-indirect")).toEqual(true);
    expect(tree.isParentOf(2, 3, "indirect")).toEqual(false);
    expect(tree.isParentOf(2, 3, "self-direct")).toEqual(true);
  });

  it("isSlibingOf", () => {
    let treeData = getTestTree();
    let tree = new ItemTree(treeData);
    if (isSetIndex) {
      tree.setIndex();
    }

    expect(tree.isSlibingOf(1, 2)).toEqual(false);
    expect(tree.isSlibingOf(3, 4)).toEqual(true);
  });

  it("fromFlat", () => {
    let list = [
      { id: 1, name: "n1", parentId: null },
      { id: 2, name: "n2", parentId: 1 },
    ];

    let tree = ItemTree.fromFlat(list, {
      flatId: "id",
      flatPid: "parentId",
      setItem: (o, childs) => ({ id: o.id, name: o.name, children: childs }),
    });

    let cList = tree.node(1).childList("direct-indirect");
    expect(tree.size()).toEqual(2);
    expect(cList).toEqual([{ id: 2, name: "n2", children: [] }]);
  });
});

function getIsChildOf(path1, path2, type?: RelationType) {
  for (let i = 0; i < path2.length; i++) {
    if (path2[i] !== path1[i]) {
      return false;
    }
  }
  return getTypeChild(path1.length - path2.length, type);
}

function getTestTree() {
  let tree = [
    {
      id: 1,
      path: [0],
      iterat: {
        order: 1,
        pData: null,
      },
      iteratUp: {
        order: 5,
        subData: [2, 5],
      },
      children: [
        {
          id: 2,
          path: [0, 0],
          iterat: {
            order: 2,
            pData: [1],
          },
          iteratUp: {
            order: 3,
            subData: [3, 4],
          },
          children: [
            {
              id: 3,
              path: [0, 0, 0],
              iterat: {
                order: 3,
                pData: [1, 2],
              },
              iteratUp: {
                order: 1,
                subData: [],
              },
            },
            {
              id: 4,
              path: [0, 0, 1],
              iterat: {
                order: 4,
                pData: [1, 2],
              },
              iteratUp: {
                order: 2,
                subData: [],
              },
            },
          ],
        },
        {
          id: 5,
          path: [0, 1],
          iterat: {
            order: 5,
            pData: [1],
          },
          iteratUp: {
            order: 4,
            subData: [],
          },
        },
      ],
    },
    {
      id: 6,
      path: [1],
      iterat: {
        order: 6,
        pData: null,
      },
      iteratUp: {
        order: 10,
        subData: [7, 10],
      },
      children: [
        {
          id: 7,
          path: [1, 0],
          iterat: {
            order: 7,
            pData: [6],
          },
          iteratUp: {
            order: 8,
            subData: [8, 9],
          },
          children: [
            {
              id: 8,
              path: [1, 0, 0],
              iterat: {
                order: 8,
                pData: [6, 7],
              },
              iteratUp: {
                order: 6,
                subData: [],
              },
            },
            {
              id: 9,
              path: [1, 0, 1],
              iterat: {
                order: 9,
                pData: [6, 7],
              },
              iteratUp: {
                order: 7,
                subData: [],
              },
            },
          ],
        },
        {
          id: 10,
          path: [1, 1],
          iterat: {
            order: 10,
            pData: [6],
          },
          iteratUp: {
            order: 9,
            subData: [],
          },
        },
      ],
    },
  ];

  return tree;
}
