let it = new TreeIterator(tree, childKey);
it.get(path);

const fn = (item, data, path) => {
  return data;
};
it.iteratDown(fn, initData);

const fn = (item, listData, path) => {
  return data;
};
it.iteratUp(fn);

const fn = (item, { key }, path) => {};
it.data("key")
  .someChild((item) => item.a, { includeSelf: false, includeSun: true })
  .collect(fn);

