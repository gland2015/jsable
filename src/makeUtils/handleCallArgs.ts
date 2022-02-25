export function handleCallArgs(pos): (args, successCall, errorCall) => any {
  let callback = pos || [-2, -1];
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

  return handleInitArgs;
}
