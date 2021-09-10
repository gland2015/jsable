let it = new TreeIterator(tree, childKey, idKey);
it.get(path);

context = { path, stop, end };
const fn = (item, data, context) => {
  return data;
};
// 向下
it.iterat(fn, initData);

const fn = (item, listData, context) => {
  return data;
};
it.iteratUp(fn);

const fn = (item, { key }, path) => {};
// 无key则是一个值，不是的对象属性，此时不能定义其它有key的对象
// 没有item data 可以不传fn
it.entireData("llsd")
  .some((item) => item.a)
  .itemData("key")
  .someChild((item) => item.a, { includeSelf: false, includeSun: true })
  .collect(fn || null);
it.unEntireData(key || null);
it.unItemData(key || null);

// nest map
it.setIndexes();

it.find((item) => {});
item.findOne((item) => {});
item.findById(id);

// 替换item
it.map((item) => item);
// 清除节点
it.filter((item) => true);

// 更新数据
it.restore(tree, childKey, idKey);

it.select(fn); // 选择新的一列 ？？
it.select(id).parent(); // 深度与否
it.select(id).child();

it.select(id).isParent;
it.select(id).isChild;
it.select(id).iterat();
it.select(id).entireData().collect(); // ...
it.select(id).getDepth();
// static from

it.add;
it.append;
it.push;
it.unshift;
it.shift;
