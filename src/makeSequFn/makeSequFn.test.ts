import { makeSequFnA, makeSequFnC } from ".";

describe("makeSequFnA", () => {
  it("base", async () => {
    let order = 1;
    let fn = makeSequFnA(function (value) {
      order++;
      expect(2 * value).toEqual(order);
      return new Promise(function (resolve, reject) {
        setTimeout(() => {
          order++;
          resolve(null);
        });
      });
    });

    await fn(1);
    await fn(2);
    await fn(3);
  });

  it("timeout", async () => {
    let order = 1;
    let fn = makeSequFnA(
      function (value) {
        order++;
        expect(2 * value).toEqual(order);
        return new Promise(function (resolve, reject) {
          setTimeout(() => {
            order++;
            if (value !== 3) {
              resolve(null);
            }
          });
        });
      },
      {
        timeIval: 100,
        timeout: 200,
        onEnd() {
          order += 10;
        },
      }
    );

    fn(1);
    fn(2);
    fn(3).catch((err) => {
      order += 10;
      expect(err.message).toEqual("TIMEOUT");
    });

    await new Promise((r) => setTimeout(r, 500));
    expect(order).toEqual(27);
  });
});

describe("makeSequFnC", () => {
  it("base", async () => {
    let order = 1;
    let fn = makeSequFnC(function (value, successCallback, errorCallBack) {
      order++;
      expect(2 * value).toEqual(order);
      setTimeout(() => {
        order++;
        successCallback();
      });
    });

    fn(
      1,
      () => {},
      () => {}
    );
    fn(
      2,
      () => {},
      () => {}
    );
    fn(
      3,
      () => {},
      () => {}
    );
  });

  it("timeout", async () => {
    let order = 1;
    let fn = makeSequFnC(
      function (value, successCallback, errorCallBack) {
        order++;
        expect(2 * value).toEqual(order);
        setTimeout(() => {
          order++;
          if (value !== 3) {
            successCallback();
          }
        });
      },
      {
        timeIval: 100,
        timeout: 200,
        onEnd() {
          order += 10;
        },
      }
    );

    fn(
      1,
      () => {},
      () => {}
    );
    fn(
      2,
      () => {},
      () => {}
    );
    fn(
      3,
      () => {},
      (e) => {
        order += 10;
        expect(e.message).toEqual("TIMEOUT");
      }
    );
    await new Promise((r) => setTimeout(r, 500));
    expect(order).toEqual(27);
  });
});
