/*
  检查传入值是否为空：
  1、转换为布尔值为false
  2、数组长度为0
  3、对象没有可枚举属性
  4、无穷大
*/
export function isEmpty(data: any) {
  if (!data) return true;
  if (Array.isArray(data)) {
    return data.length ? false : true;
  }
  if (typeof data === "object") {
    let r = true;
    for (let k in data) {
      r = false;
      break;
    }
    return r;
  }
  if (typeof data === "number" && !isFinite(data)) {
    return true;
  }
  return false;
}
