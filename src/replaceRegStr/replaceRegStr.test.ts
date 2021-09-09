import { replaceRegStr } from ".";

describe("replaceRegStr", () => {
  it("replace", () => {
    let str = `abc啊额了&^%$#@!)(*~\`/\\:;,}，![?.]'{"|a125+-_o个\n\r`;
    let regStr = replaceRegStr(str);
    let reg = new RegExp(regStr);

    expect(reg.test(str)).toEqual(true);
  });
});
