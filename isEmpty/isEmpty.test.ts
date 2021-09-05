import { isEmpty } from ".";

describe("isEmpty", () => {
  it("null is empty", () => {
    expect(isEmpty(null)).toEqual(true);
  });
  it("undefined is empty", () => {
    expect(isEmpty(undefined)).toEqual(true);
  });
  it("array length 0 is empty", () => {
    expect(isEmpty([])).toEqual(true);
  });
  it("array length 1 is not empty", () => {
    expect(isEmpty([0, 0, 0])).toEqual(false);
  });
  it("object no item is empty", () => {
    expect(isEmpty({})).toEqual(true);
  });
  it("object has item is not empty", () => {
    expect(isEmpty({ a: 1 })).toEqual(false);
  });
});
