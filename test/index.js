import fs from "fs";
import child_process from "child_process";
import encoding from "encoding";

// child_process.exec(
//   "test.bat",
//   { encoding: "buffer" },
//   function (error, stdout, stderr) {
//     let hex = stdout.toString("hex");
//     console.log(hex);

//     console.log(stdout.toString());
//   }
// );

import iconvLite from "iconv-lite";

child_process.exec("chcp 65001 && test.bat", function(e, s) {
    console.log(s);
})

// const ls = child_process.spawn("chcp 65001");

// ls.stdout.on("data", (data) => {
//   console.log("data", data.toString());
//     // console.log(`stdout: ${iconvLite.decode(data, "cp936")}`);
// });

// ls.on("close", (code) => {
//   console.log(`子进程退出码：${iconvLite.decode(code, "cp936")}`);
// });
