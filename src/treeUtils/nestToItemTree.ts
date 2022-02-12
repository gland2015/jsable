/**
 * nestList to ItemList
 */
export function nestToItemTree(nestList: Array<any>, setItem: (item, childs) => any, getLft: (item) => number, getRgt: (item) => number) {
  // 1、fn返回目标元素的子元素列表
  // 2、每个子元素已包含其子
  let list = nestList.concat().sort((a, b) => {
    let lft = getLft(a);
    let lft2 = getLft(b);
    return lft - lft2;
  });

  let result = [];
  findChild(result);

  return result;

  function findChild(arr, rgt = Number.POSITIVE_INFINITY, index = 0) {
    let item = list[index];
    if (item) {
      let itemRgt = getRgt(item);
      if (itemRgt <= rgt) {
        index++;
        let cList = [];
        index = findChild(cList, itemRgt, index);
        let bItem = setItem(item, cList);
        arr.push(bItem);

        return findChild(arr, rgt, index);
      }
    }
    return index;
  }
}
