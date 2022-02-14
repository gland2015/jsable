import { CacheObject } from "../cacheObject";

let getChild_ = function (level: number, type: RelationType) {
  let cache = new CacheObject();
  cache.set("1", function () {
    return {
      default: function (level) {
        return true;
      },
      direct: function (level) {
        return level === 1;
      },
      "self-direct": function (level) {
        return level <= 1;
      },
      "direct-indirect": function (level) {
        return level > 0;
      },
      indirect: function (level) {
        return level > 1;
      },
    };
  });

  getChild_ = function (level, type) {
    let obj = cache.get("1");
    let fn = obj[type] || obj.default;
    return fn(level);
  };

  return getChild_(level, type);
};

export type RelationType = "default" | "direct" | "self-direct" | "direct-indirect" | "indirect";

/**
 * 获取是否是按类型的父子关系
 * 已经是子或孙或相等判断具体类型
 * level: 子到父的距离，相等是0
 */
export function getTypeChild(level: number, type?: RelationType) {
  return getChild_(level, type);
}


