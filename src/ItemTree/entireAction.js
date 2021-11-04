export class EntireAction {
  constructor(that, set) {
    this.that = that;
    this.set = set;
  }

  some(fn) {
    const data = {
      fnInfo: {
        fn: (item, args1, args2, context) => {
          if (fn(item)) {
            context.end();
            return true;
          }
          return false;
        },
      },
    };
    this.set(data);
    return this.that;
  }

  every(fn) {
    const data = {
      fnInfo: {
        fn: (item, args1, args2, context) => {
          if (fn(item)) {
            return true;
          }
          context.end();
          return false;
        },
      },
    };

    this.set(data);
    return this.that;
  }

  reduce(fn, initValue) {
    let value = initValue;

    const data = {
      fnInfo: {
        fn: (item, args1, args2, context) => {
          value = fn(item, value);
          return value;
        },
      },
    };

    this.set(data);
    return this.that;
  }
}
