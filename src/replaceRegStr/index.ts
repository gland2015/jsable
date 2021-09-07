
/*
   将字符串中在正则表达式中有特殊含义的字符添加反斜杠，
   防止在构建时转义
*/
export function replaceRegStr(str: string) {
    return str.replace(/[\<\>\=\.\:\*\?\+\^\$\|\\\{\}\[\]]/g, "\\$1");
}
