/*
  flatList to itemList
  会统计丢失信息
*/
export function flatToItemTree(
  flatList: Array<any>,
  getId: (o) => string | number,
  getPid: (o) => string | number,
  setItem: (o, childs, level) => any
) {
  if (!flatList.length) return { tree: [], rootId: null, lostList: [] };
  // 索引列表并添加子到父
  const dataMap = {};
  const rootList = [];
  for (let i = 0; i < flatList.length; i++) {
    let doc = flatList[i];
    if (!doc) return;
    const id = getId(doc);
    const parentId = getPid(doc);

    if (dataMap[id]) {
      dataMap[id].id = id;
      dataMap[id].parentId = parentId;
      dataMap[id].doc = doc;
    } else {
      dataMap[id] = { id, parentId, doc, children: [], count: 0 };
    }

    if (parentId === null || parentId === undefined) {
      rootList.push(doc);
    } else if (id !== parentId) {
      if (!dataMap[parentId]) {
        dataMap[parentId] = {
          id: parentId,
          parentId: null,
          doc: null,
          children: [],
          count: 0,
        };
      }
      dataMap[parentId].children.push(doc);
      dataMap[parentId].count++;
    }
  }

  let rootId = null;
  let tree = buildTree(rootList, 1);
  let lostMap = {};

  // 寻找丢失节点
  for (let key in dataMap) {
    let item = dataMap[key];
    if (!item.doc) {
      lostMap[key] = {
        id: item.id,
        list: buildTree(item.children, 1),
        count: item.count,
      };
    }
  }

  if (!tree.length) {
    let maxCount, maxKey;
    for (let key in lostMap) {
      let item = lostMap[key];
      if (maxCount === undefined) {
        maxCount = item.count;
        maxKey = key;
      } else if (maxCount < item.count) {
        maxCount = item.count;
        maxKey = key;
      }
    }
    if (maxCount) {
      tree = lostMap[maxKey].list;
      rootId = lostMap[maxKey].id;
      delete lostMap[maxKey];
    }
  }

  let lostList = Object.keys(lostMap).map((k) => lostMap[k]);

  return { tree, rootId, lostList };

  // 形成树
  function buildTree(list, level) {
    let tree = [];
    for (let i = 0; i < list.length; i++) {
      let doc = list[i];
      let id = getId(doc);
      let data = dataMap[id];

      const children = buildTree(data.children, level + 1);
      const node = setItem(doc, children, level);
      if (node) {
        tree.push(node);
      }
    }
    return tree;
  }
}
