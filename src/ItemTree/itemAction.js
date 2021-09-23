export class ItemAction {
  constructor(that, set) {
    this.that = that;
    this.set = set;
  }

  someChild(fn, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "up",
      fnInfo: {
        getValue: (o) => o.val,
        fn: (item, listData, childList) => {
          let val;
          let itemVal;
          let hasImV;

          if (shallow) {
            val = listData.some((o, i) => {
              if (o.hasImV) {
                return o.itemVal;
              }
              return fn(childList[i]);
            });
          } else {
            val = listData.some((o) => {
              return o.val;
            });
          }

          if (!val && self) {
            itemVal = fn(item);
            hasImV = true;
            val = itemVal;
          }
          return { val, itemVal, hasImV };
        },
      },
    };
    this.set(data);
    return this.that;
  }

  everyChild(fn, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "up",
      fnInfo: {
        getValue: (o) => Boolean(o.val),
        fn: (item, listData, childList) => {
          let val;
          let itemVal;
          let hasImV;

          if (self) {
            itemVal = fn(item);
            hasImV = true;
          }

          if (!hasImV || itemVal) {
            if (shallow) {
              val = listData.every((o, i) => {
                if (o.hasImV) {
                  return o.itemVal;
                }
                return fn(childList[i]);
              });
            } else {
              val = listData.every((o) => {
                return o.val;
              });
            }
          }

          return { val, itemVal, hasImV };
        },
      },
    };
    this.set(data);
    return this.that;
  }

  reduceChild(rValueValue, itemToValue, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "up",
      fnInfo: {
        getValue: (o) => o.val,
        fn: (item, listData, childList) => {
          let val;
          let itemVal;
          let hasImV;

          if (self) {
            itemVal = itemToValue(item);
            hasImV = true;
            val = itemVal;
          }

          listData.forEach((o, i) => {
            let oVal;
            if (shallow) {
              oVal = o.hasImV ? o.itemVal : itemToValue(childList[i]);
            } else {
              if (self) {
                oVal = o.val;
              } else {
                oVal = o.hasImV ? o.itemVal : itemToValue(childList[i]);
                oVal = rValueValue(oVal, o.val);
              }
            }
            if (i === 0) {
              if (hasImV) {
                val = rValueValue(itemVal, oVal);
              } else {
                val = oVal;
              }
            } else {
              val = rValueValue(val, oVal);
            }
          });

          return { val, itemVal, hasImV };
        },
      },
    };

    this.set(data);
    return this.that;
  }

  someParent(fn, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "down",
      fnInfo: {
        getValue: (o) => Boolean(o.val),
        fn: (item, pData, pItem) => {
          let val = false;
          let itemVal;
          let hasImV;

          if (self) {
            itemVal = fn(item);
            hasImV = true;
          }

          if (itemVal) {
            val = true;
          } else {
            if (shallow) {
              if (pData) {
                val = pData.hasImV ? pData.itemVal : fn(pItem);
              } else {
                val = false;
              }
            } else {
              val = pData ? pData.val : false;
            }
          }

          return { val, itemVal, hasImV };
        },
      },
    };

    this.set(data);
    return this.that;
  }

  everyParent(fn, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "down",
      fnInfo: {
        getValue: (o) => Boolean(o.val),
        fn: (item, pData, pItem) => {
          let val;
          let itemVal;
          let hasImV;

          if (self) {
            itemVal = fn(item);
            hasImV = true;
          }

          if (!self || itemVal) {
            if (shallow) {
              if (pData) {
                val = pData.hasImV ? pData.itemVal : fn(pItem);
              } else {
                val = true;
              }
            } else {
              val = pData ? pData.val : true;
            }
          }

          return { val, itemVal, hasImV };
        },
      },
    };

    this.set(data);
    return this.that;
  }

  reduceParent(rValueValue, itemToValue, options) {
    const self = options?.self;
    const shallow = options?.shallow;

    const data = {
      type: "down",
      fnInfo: {
        getValue: (o) => o.val,
        fn: (item, pData, pItem) => {
          let val;
          let itemVal;
          let hasImV;

          if (self) {
            itemVal = itemToValue(item);
            hasImV = true;
          }

          if (pData) {
            let pItVal = pData.hasImV ? pData.itemVal : itemToValue(pItem);
            if (shallow) {
              val = self ? rValueValue(itemVal, pItVal) : pItVal;
            } else {
              val = self
                ? rValueValue(itemVal, pData.val)
                : rValueValue(pItVal, pData.val);
            }
          } else {
            val = itemVal;
          }

          return { val, itemVal, hasImV };
        },
      },
    };

    this.set(data);
    return this.that;
  }
}
