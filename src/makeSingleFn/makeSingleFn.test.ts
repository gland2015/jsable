import { makeSingleFnC } from ".";

describe("makeSingleFnC", () => {
  it("base", async () => {
    let order = 1;
    let num = 1;

    let fn = makeSingleFnC(function (value, successCallBack, errorCallBack) {
      expect(value).toEqual(num);
      order++;
      setTimeout(() => {
        successCallBack(num + 100);
      });
    });

    fn(
      1,
      function (v) {
        order += 2;
        expect(v).toEqual(101);
      },
      function (err) {}
    );
    fn(
      1,
      function (v) {
        order += 2;
        expect(v).toEqual(101);
      },
      function (err) {}
    );
    fn(
      1,
      function (v) {
        order += 2;
        expect(v).toEqual(101);
      },
      function (err) {}
    );
    await new Promise((r) => setTimeout(r, 200));
    expect(order).toEqual(8);

    num = 2;
    fn(
      2,
      function (v) {
        order += 2;
        expect(v).toEqual(102);
      },
      function (err) {}
    );
    fn(
      2,
      function (v) {
        order += 2;
        expect(v).toEqual(102);
      },
      function (err) {}
    );
    fn(
      2,
      function (v) {
        order += 2;
        expect(v).toEqual(102);
      },
      function (err) {}
    );
    await new Promise((r) => setTimeout(r, 200));
    expect(order).toEqual(15);
  });
});
