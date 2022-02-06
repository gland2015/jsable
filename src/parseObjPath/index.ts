/*
    先执行转义，并记住被转义的字符在转义后的位置
    然后手动split字符串，并跳过转义位置

    然后解析数组中括号，一定是在元素最后，并且不能是第一个，并且需要跳过转义的中括号
*/
export function parseObjPath(str: string): Array<string | number> {
  if (!str) return [""];

  let r = [];

  // 解析 "." 访问
  let arr = [];
  let arrPos = []; // 每组中在转义整个字符串的起始位置

  // 有转义的位置
  let iList = [];
  str = str.replace(/\\([\s\S])/g, function (s1, s2, index) {
    iList.push(index);
    return s2;
  });
  iList = iList.map((o, i) => (i ? o - i : o));

  // 手动跳跃split
  let i = 0;
  let t = i;
  for (; i < str.length; i++) {
    if (str[i] === "." && iList.indexOf(i) === -1) {
      arr.push(str.slice(t, i));
      arrPos.push(t);
      t = i + 1;
    }
  }
  arr.push(str.slice(t, i));
  arrPos.push(t);

  // 解析数组访问
  let reg = /[\s\S]\[(\d+)\]$/;
  arr.forEach(function (o, oi) {
    let list = [];
    let m = null;
    while ((m = o.match(reg))) {
      // 确保这两个中括号没被转义
      let i1 = arrPos[oi] + m.index + 1;
      let i2 = arrPos[oi] + o.length - 1;
      if (iList.indexOf(i1) !== -1 || iList.indexOf(i2) !== -1) {
        break;
      }
      list.unshift(parseInt(m[1]));
      o = o.replace(/\[(\d+)\]$/, "");
    }
    r.push(o, ...list);
  });

  return r;
}

export function getObjPropFn(value: number | string) {
  let result: { set: (o, v) => void; get: (o) => any } = {} as any;
  let arr = typeof value === "string" ? parseObjPath(value) : [value];
  if (arr.length === 1) {
    result.set = function (o, v) {
      o[value] = v;
    };
    result.get = function (o) {
      return o[value];
    };
  } else {
    result.set = function (o, v) {
      for (let i = 0; i < arr.length - 1; i++) {
        let key = arr[i];
        o = o[key];
      }
      o[arr[arr.length - 1]] = v;
    };
    result.get = function (o) {
      for (let i = 0; i < arr.length - 1; i++) {
        let key = arr[i];
        o = o[key];
      }
      return o[arr[arr.length - 1]];
    };
  }

  return result;
}
