interface AOptions {
  // ms
  timeout?: number;
  // ms - 精度
  timeIval?: number;
  onEnd?: Function;
}

/**
 * 异步函数，并发转顺序逐一执行，并可timeout
 */
export function makeSequFnA<T = any>(fn: Function, options?: AOptions): (...args: any) => Promise<T> {
  class LinkData {
    public resolve;
    public reject;
    public args;
    public that;
    public nextObj: LinkData;

    public run() {
      Promise.resolve()
        .then(() => {
          // 确保先执行上一步的await/then后的代码
          return fn.apply(this.that, this.args);
        })
        .then((value) => {
          this.resolve && this.resolve(value);
          this.complete();
        })
        .catch((error) => {
          this.reject && this.reject(error);
          this.complete();
        });
    }

    public complete(isTimeOut?: boolean) {
      if (!this.resolve) {
        return;
      }

      let nextObj = this.nextObj;
      if (isTimeOut) {
        // 清除引用
        delete this.resolve;
        delete this.reject;
        delete this.args;
        delete this.that;
        delete this.nextObj;
      }

      if (nextObj) {
        linkObj = nextObj;
        linkObj.run();
      } else {
        beforeObj = linkObj = lastObj = null;
        if (timeout) {
          clearInterval(timer);
        }
        onEnd && onEnd();
      }
    }
  }

  const timeout = options?.timeout;
  const timeIval = options?.timeIval || timeout;
  const onEnd = options?.onEnd;

  let linkObj: LinkData = null;
  let lastObj: LinkData = null;

  let timer = null;
  let countTime = 0;
  let beforeObj: LinkData = null;

  return function () {
    const nextObj = new LinkData();
    nextObj.args = arguments;
    nextObj.that = this;

    return new Promise(function (resolve, reject) {
      nextObj.resolve = resolve;
      nextObj.reject = reject;
      if (linkObj) {
        lastObj.nextObj = nextObj;
        lastObj = nextObj;
      } else {
        linkObj = lastObj = nextObj;
        linkObj.run();

        // 安装定时器
        if (timeout) {
          beforeObj = linkObj;
          countTime = 0;
          timer = setInterval(() => {
            countTime += timeIval;
            if (linkObj === beforeObj) {
              // 每隔一段时间查是否超时
              if (countTime >= timeout) {
                if (linkObj) {
                  linkObj.reject(new Error("TIMEOUT"));
                  linkObj.complete(true);
                  countTime = 0;
                  beforeObj = linkObj;
                } else {
                  clearInterval(timer);
                }
              }
            } else {
              countTime = 0;
              beforeObj = linkObj;
            }
          }, timeIval);
        }
      }
    });
  };
}

interface COptions {
  // ms
  timeout?: number;
  // ms - 精度
  timeIval?: number;

  onEnd?: Function;

  // 设置数字或函数返回真实成功回调， 函数要自己更改参数回调为接收的回调. 数字是负数则从参数列表倒数
  callback?: [number, number?] | ((args: Iterable<any>, successCall, errorCall?) => [Function, Function?]);
}

/**
 * 成功回调函数, 并发转顺序逐一执行，并可timeout
 */
export function makeSequFnC<T = any>(fn: Function, options?: COptions): (...args: any) => void {
  class LinkData {
    public nextObj: LinkData;
    public run;
    public complete;
    public hasComplete;
  }

  const timeout = options?.timeout;
  const timeIval = options?.timeIval || timeout;
  const onEnd = options?.onEnd;

  let callback = options?.callback || [-2, -1];
  // 获取参数处理函数
  let handleInitArgs;
  if (Array.isArray(callback)) {
    let pos1 = callback[0];
    let pos2 = typeof callback[1] === "number" ? callback[1] : null;
    handleInitArgs = function (args, successCall, errorCall) {
      let suPos = pos1 < 0 ? args.length + pos1 : pos1;
      let errPos = pos2 === null ? null : pos2 < 0 ? args.length + pos2 : pos2;

      let arr = [args[suPos]];
      args[suPos] = successCall;
      if (errPos !== null) {
        arr.push(args[errPos]);
        args[errPos] = errorCall;
      }
      return arr;
    };
  } else {
    handleInitArgs = callback;
  }

  let linkObj: LinkData = null;
  let lastObj: LinkData = null;

  let timer = null;
  let countTime = 0;
  let beforeObj: LinkData = null;

  return function () {
    const that = this;
    const args = arguments;

    function theSuccessCall() {
      if (!nextObj.hasComplete) {
        nextObj.hasComplete = true;
        callArr[0].apply(that, arguments);
        nextObj.complete();
      }
    }

    function theErrorCall() {
      if (!nextObj.hasComplete) {
        nextObj.hasComplete = true;
        (callArr[1] || callArr[0]).apply(that, arguments);
        nextObj.complete();
      }
    }

    let callArr = handleInitArgs(args, theSuccessCall, theErrorCall);

    const nextObj = new LinkData();

    nextObj.run = function () {
      fn.apply(that, args);
    };

    nextObj.complete = function () {
      callArr = [];
      if (nextObj.nextObj) {
        linkObj = nextObj.nextObj;
        linkObj.run();
      } else {
        linkObj = beforeObj = lastObj = null;
        if (timeout) {
          clearInterval(timer);
        }
        onEnd && onEnd();
      }
    };

    if (linkObj) {
      lastObj.nextObj = nextObj;
      lastObj = nextObj;
    } else {
      linkObj = lastObj = nextObj;
      linkObj.run();

      // 安装定时器
      if (timeout) {
        beforeObj = linkObj;
        countTime = 0;
        timer = setInterval(() => {
          countTime += timeIval;
          if (linkObj === beforeObj) {
            // 每隔一段时间查是否超时
            if (countTime >= timeout) {
              if (linkObj) {
                nextObj.hasComplete = true;
                (callArr[1] || callArr[0]).call(that, new Error("timeout"));
                linkObj.complete();
                countTime = 0;
                beforeObj = linkObj;
              } else {
                clearInterval(timer);
              }
            }
          } else {
            countTime = 0;
            beforeObj = linkObj;
          }
        }, timeIval);
      }
    }
  };
}
