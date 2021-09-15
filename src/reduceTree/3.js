class ItemAction {
  constructor(that, set) {
    this.that = that;
    this.set = set;
  }

  someChild(fn, options) {
    this.set(type, fn, options);
    let data = {
      type: "up",
      interFn: null,
    };

    options = {
      includeSelf: false,
      excludeSun: false,
    };

    data = {
      type: "up",
      needData: {
        listData: true,
        childList: false,
      },
      interFn: (item, childListData, childList) => {
        if (options.includeSelf) {
          if (fn(item)) {
            return true;
          }
        }

        if (options.excludeSun) {
          return childList.some((o) => {
            return fn(o);
          });
        } else {
          return childListData.some(Boolean);
        }
      },
    };
    return this.that;
  }

  everyChild(fn, options) {
    options = {
      includeSelf: false,
      excludeSun: false,
    };

    data = {
      type: "up",
      interFn: (item, childListData, childList) => {
        if (options.includeSelf) {
          if (!fn(item)) {
            return false;
          }
        }

        if (options.excludeSun) {
          return childList.every((o) => {
            return fn(o);
          });
        } else {
          return childListData.every(Boolean);
        }
      },
    };
  }

  reduceChild(rValueValue, itemToValue, options) {
    options = {
      initValue: undefined,
      includeSelf: false,
      excludeSun: false,
    };

    data = {
      type: "up",
      interFn: (item, childListData, childList) => {
        let value;
        let hasValue = false;
        if (options.includeSelf) {
          value = itemToValue(item);
          hasValue = true;
        }

        if (options.excludeSun) {
          childList.forEach((o) => {
            let v = itemToValue(o);
            if (hasValue) {
              value = rValueValue(value, v);
            } else {
              hasValue = true;
              value = v;
            }
          });
        } else {
          childListData.forEach((v) => {
            value = rValueValue(v);
          });
        }

        return value;
      },
    };
  }

  someParent(fn, options) {
    data = {
      type: "down",
      interFn: (item, pData) => {
        if (options.includeSelf) {
          if (!fn(item)) {
            return false;
          }
        }

        if (options.excludeSun) {
          return childList.every((o) => {
            return fn(o);
          });
        } else {
          return childListData.every(Boolean);
        }
      },
    };
  }

  everyParent(fn, options) {}

  reduceParent(fn, options) {}
}
