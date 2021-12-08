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

let b = fs.readFileSync("./1", {
    encoding: "binary"
})

console.log("b",b);

// console.log(encoding.convert(b, "cp936", "utf8").toString("hex"));;
