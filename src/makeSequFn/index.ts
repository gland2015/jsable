import { handleCallArgs } from "../makeUtils";

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
    public callArr;
  }

  const timeout = options?.timeout;
  const timeIval = options?.timeIval || timeout;
  const onEnd = options?.onEnd;

  // 获取参数处理函数
  let handleInitArgs = handleCallArgs(options?.callback);

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
        nextObj.callArr[0].apply(that, arguments);
        nextObj.complete();
      }
    }

    function theErrorCall() {
      if (!nextObj.hasComplete) {
        nextObj.hasComplete = true;
        (nextObj.callArr[1] || nextObj.callArr[0]).apply(that, arguments);
        nextObj.complete();
      }
    }

    const nextObj = new LinkData();
    nextObj.callArr = handleInitArgs(args, theSuccessCall, theErrorCall);

    nextObj.run = function () {
      fn.apply(that, args);
    };

    nextObj.complete = function () {
      nextObj.callArr = [];
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
                linkObj.hasComplete = true;
                (linkObj.callArr[1] || linkObj.callArr[0]).call(that, new Error("TIMEOUT"));
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
