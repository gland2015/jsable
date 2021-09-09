import { ArraySorter } from ".";

describe("ArraySorter", () => {
  let initData = getData();
  it("o.random & o.sort", () => {
    let data = getData();

    let sorter = new ArraySorter(data, 2);
    sorter.random();
    expect(isEqual(initData, data)).toEqual(false);
    sorter.sort((a, b) => a - b);
    expect(isEqual(initData, data)).toEqual(true);
  });

  it("o.reverse", () => {
    let data = getData();
    let data2 = getData();
    let sorter = new ArraySorter(data, 2);
    sorter.reverse();
    let sorter2 = new ArraySorter(data2, 2);
    sorter2.sort((a, b) => b - a);

    expect(isEqual(data, data2)).toEqual(true);
  });

  it("o.map & o.filter", () => {
    let data = getData();
    let sorter = new ArraySorter(data, 2);
    sorter
      .map((v, i, target) => {
        return { rowId: parseInt(target[1][i].match(/\d+$/)[0]), index: i };
      })
      .filter((v, i, target) => {
        return v.rowId === 1 || v.rowId === 2;
      })
      .sort((a, b) => b.index - a.index);

    expect(
      isEqual(data, [
        [0, 8, 7, 3, 5, 4, 6, 2, 1, 9],
        [
          "row0",
          "row2",
          "row1",
          "row0",
          "row2",
          "row1",
          "row0",
          "row2",
          "row1",
          "row0",
        ],
      ])
    ).toEqual(true);
  });

  it("o.group.sort", () => {
    let data = getData();
    let sorter = new ArraySorter(data, 2);

    sorter
      .group((v, i, target) => {
        return target[1][i];
      })
      .filter((vs, is, target) => true)
      .map((v, i, target) => i)
      .sort((a, b) => b - a);

    console.log("data", data);

    expect(
      isEqual(data, [
        [9, 7, 8, 6, 4, 5, 3, 1, 2, 0],
        [
          "row0",
          "row1",
          "row2",
          "row0",
          "row1",
          "row2",
          "row0",
          "row1",
          "row2",
          "row0",
        ],
      ])
    ).toEqual(true);
  });

  function isEqual(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }

  function getData() {
    let arr = new Array(10).fill(null);
    let list = [
      arr.map((v, i) => i),
      arr.map((v, i) => {
        return `row${i % 3}`;
      }),
    ];
    return list;
  }
});
