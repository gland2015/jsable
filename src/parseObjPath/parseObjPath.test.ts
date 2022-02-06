import { getObjPropFn, parseObjPath } from ".";

describe("parseObjPath", () => {
  it("base", () => {
    expect(parseObjPath("abc")).toEqual(["abc"]);
    expect(parseObjPath("ab.c")).toEqual(["ab", "c"]);
    expect(parseObjPath("a.b.c")).toEqual(["a", "b", "c"]);
    expect(parseObjPath("a.b[0].c")).toEqual(["a", "b", 0, "c"]);
    expect(parseObjPath("a.b[0][1][2].c[3]")).toEqual(["a", "b", 0, 1, 2, "c", 3]);
    expect(parseObjPath("a[2].b[0].c")).toEqual(["a", 2, "b", 0, "c"]);
    expect(parseObjPath("a.b\\.c")).toEqual(["a", "b.c"]);
    expect(parseObjPath("a.b[0\\].c")).toEqual(["a", "b[0]", "c"]);
    expect(parseObjPath("a.[0].c")).toEqual(["a", "[0]", "c"]);
    expect(parseObjPath("a.b\\\\.c")).toEqual(["a", "b\\", "c"]);
    expect(parseObjPath("a.b\\\\\\.c")).toEqual(["a", "b\\.c"]);
    expect(parseObjPath("a.b.c.")).toEqual(["a", "b", "c", ""]);
    expect(parseObjPath("a.\\b.c")).toEqual(["a", "b", "c"]);
    expect(parseObjPath("a.\\\\b.c")).toEqual(["a", "\\b", "c"]);
  });

  it("getObjPropFn", () => {
    let value = "a.b.c[1].d";
    let fnObj = getObjPropFn(value);

    let obj = {
      a: {
        b: {
          c: [1, { d: 22 }],
        },
      },
    };

    expect(fnObj.get(obj)).toEqual(22);
    expect(fnObj.set(obj, 33)).toEqual(undefined);
    expect(fnObj.get(obj)).toEqual(33);
  });
});
