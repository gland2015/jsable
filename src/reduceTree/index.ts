/*
[
    {
        id: 1,
        name: "a",
        children: []
    }
]

function fn(item, pData, path) {
    return data;
}

依次从上往下遍历树数据，其中pData，是其父fn返回的数据，若无父，则是initData或null

*/
export function reduceTree(
  treeList,
  fn = (item?, pData?, path?) => null,
  options?: {
    childKey: string;
    initData: any;
  }
) {
  options = options || ({} as any);
  const initData = "initData" in options ? options.initData : null;
  const childKey = options?.childKey || "children";

  let path = [0];
  let pInfo = [{ list: treeList, pData: initData }];
  while (1) {
    let last = path.length - 1;
    let info = pInfo[last];

    let item = info.list[path[last]];
    if (item) {
      let pData = fn(item, info.pData, path);
      let list = item[childKey];
      if (list?.length) {
        path.push(0);
        pInfo.push({ list, pData });
        continue;
      }
      path[last]++;
      continue;
    }

    if (last > 0) {
      path.pop();
      path[path.length]++;
      pInfo.pop();
      continue;
    }
    break;
  }
}

/*
      向上遍历树
  */
export function reduceTreeByUp(
  treeList,
  fn = (item?, sData?, path?) => null,
  options?: {
    childKey: string;
    initData: any;
  }
) {
  options = options || ({} as any);
  const initData = "initData" in options ? options.initData : null;
  const childKey = options?.childKey || "children";

  let path = [0];
  let pInfo = [{ list: treeList, pData: initData }];

  while (1) {
    let last = path.length - 1;
    let info = pInfo[last];

    let item = info.list[path[last]];
    if (item) {
      let pData = fn(item, info.pData, path);
      let list = item[childKey];
      if (list?.length) {
        path.push(0);
        pInfo.push({ list, pData });
        continue;
      }
      path[last]++;
      continue;
    }

    if (last > 0) {
      path.pop();
      pInfo.pop();
      continue;
    }
    break;
  }
}
