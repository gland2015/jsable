import { handleCallArgs } from "../makeUtils";

interface AOptions {
  ids?: (args: Iterable<any>) => Array<any>;
  holdError?: boolean;
}

/**
 * 生成相同参数只成功执行一次的缓存函数, 支持异步函数和同步函数
 */
export function makeSingleFn(targetFn, options?: AOptions): (...args) => any {
  let dataMap = new Map();

  // 获取id函数
  let getIds = options?.ids || defaultIdsHandler;
  // 是否保留错误
  let holdError = options?.holdError;

  return function () {
    let that = this;
    let args = arguments;

    // 获取id
    let ids = getIds(args);
    ids.unshift(ids.length);

    // 获取缓存数据
    let data = dataMap;
    for (let i = 0; i < ids.length; i++) {
      let argV = ids[i];
      let nextData = data.get(argV);
      if (!nextData) {
        nextData = new Map([[10, new Map()]]);
        data.set(argV, nextData);
      }
      data = nextData.get(10);
    }

    // [1 - 状态： 1 - 正在获取  2 - 已经获取]
    // [2 - 数据值 - {  isError, isAsync, value }]
    // [3 - 队列]
    // [10 - 子数据]
    let status = data.get(1);
    if (status === 2) {
      // 已经成功调用
      let dataInfo = data.get(2);
      if (dataInfo.isError) {
        if (dataInfo.isAsync) {
          return Promise.reject(dataInfo.value);
        }
        throw dataInfo.value;
      }
      return dataInfo.isAsync ? Promise.resolve(dataInfo.value) : dataInfo.value;
    }

    if (status === 1) {
      // 正在调用
      let list = data.get(3);
      if (!list) {
        list = [];
        data.set(3, list);
      }
      return new Promise(function (resolve, reject) {
        let info = { resolve, reject, args, that };
        list.push(info);
      });
    }

    // 第一次调用
    data.set(1, 1);

    let value;
    try {
      value = targetFn.apply(that, args);
    } catch (error) {
      if (holdError) {
        data.set(1, 2);
        data.set(2, { isError: true, value: error });
      } else {
        data.delete(1);
        throw error;
      }
      return;
    }

    let isPromise = Promise.resolve(value) === value;
    if (isPromise) {
      return value
        .then((v) => {
          data.set(1, 2);
          data.set(2, { isAsync: true, value: v });
          let list = data.get(3);
          data.delete(3);
          if (list) {
            list.forEach((o) => o.resolve(v));
          }
        })
        .catch((error) => {
          if (holdError) {
            data.set(1, 2);
            data.set(2, { isAsync: true, isError: true, value: error });
            let list = data.get(3);
            data.delete(3);
            if (list) {
              list.forEach((o) => o.reject(error));
            }
            throw error;
          } else {
            Promise.resolve(1).then(async () => {
              let list = data.get(3);
              if (list) {
                let item;
                while ((item = list[0])) {
                  list.shift();
                  try {
                    let r = await targetFn.apply(item.that, item.args);
                    data.set(1, 2);
                    data.set(2, { isAsync: true, value: r });
                    data.delete(3);

                    item.resolve(r);
                    list.forEach((o) => o.resolve(error));
                  } catch (err) {
                    item.reject(err);
                  }
                }

                if (data.get(1) !== 2) {
                  data.delete(1);
                  data.delete(2);
                  data.delete(3);
                }
              }
            });
            throw error;
          }
        });
    } else {
      data.set(1, 2);
      data.set(2, { value });
      return value;
    }
  };
}

interface COptions {
  ids?: (args: Iterable<any>) => Array<any>;

  // 设置数字或函数返回真实成功回调， 函数要自己更改参数回调为接收的回调. 数字是负数则从参数列表倒数
  callback?: [number, number?] | ((args: Iterable<any>, successCall, errorCall?) => [Function, Function?]);
}

function defaultIdsHandler(args) {
  let arr = [];
  for (let i = 0; i < args.length - 2; i++) {
    arr.push(args[i]);
  }
  return arr;
}

/**
 * 生成相同参数只成功执行一次的缓存函数,
 */
export function makeSingleFnC(targetFn, options?: COptions): (...args) => void {
  let dataMap = new Map();

  // 获取id函数
  let getIds = options?.ids || defaultIdsHandler;

  // 获取参数处理函数
  let handleInitArgs = handleCallArgs(options?.callback);

  return function () {
    let that = this;
    let args = arguments;

    // 获取id
    let ids = getIds(args);
    ids.unshift(ids.length);

    // 获取真实成功回调，并重置参数
    let arrCall = handleInitArgs(
      args,
      function () {
        data.set(1, 2);
        data.set(2, arguments);
        arrCall[0].apply(that, arguments);
        let list = data.get(3);
        data.delete(3);
        if (list) {
          for (let i = 0; i < list.length; i++) {
            try {
              list[i].arrCall[0].apply(that, arguments);
            } catch (err) {}
          }
        }
      },
      function () {
        data.delete(1);
        data.delete(2);
        (arrCall[1] || arrCall[0]).apply(that, arguments);
        let list = data.get(3);
        data.delete(3);
        if (list) {
          for (let i = 0; i < list.length; i++) {
            try {
              (list[i].arrCall[1] || list[i].arrCall[0]).apply(that, arguments);
            } catch (err) {}
          }
        }
      }
    );

    // 获取缓存数据
    let data = dataMap;
    for (let i = 0; i < ids.length; i++) {
      let argV = ids[i];
      let nextData = data.get(argV);
      if (!nextData) {
        nextData = new Map([[10, new Map()]]);
        data.set(argV, nextData);
      }
      data = nextData.get(10);
    }

    // [1 - 状态： 1 - 正在获取  2 - 已经获取]
    // [2 - 数据值]
    // [3 - 队列]
    // [10 - 子数据]
    let status = data.get(1);
    if (status === 2) {
      // 已经成功调用
      arrCall[0].apply(that, data.get(2));
      return;
    }
    if (status === 1) {
      // 正在调用
      let list = data.get(3);
      if (!list) {
        list = [];
        data.set(3, list);
      }
      list.push({ arrCall });
      return;
    }
    // 第一次调用
    data.set(1, 1);
    targetFn.apply(that, args);
  };
}
