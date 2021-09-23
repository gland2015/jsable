export class TreeData {
  constructor() {
    this.data = [];
  }

  data;

  set(path, value) {
    if (!path || !path.length) return;
    let list = this.data;
    let l = path.length - 1;
    for (let i = 0; i < l; i++) {
      let index = path[i];
      if (!list[index]) {
        list[index] = {
          v: undefined,
          c: [],
        };
      }
      list = list[index].c;
    }
    if (list[path[l]]) {
      list[path[l]].v = value;
    } else {
      list[path[l]] = { v: value, c: [] };
    }
  }

  get(path) {
    if (!path || !path.length) return;
    let list = this.data;
    let l = path.length - 1;
    for (let i = 0; i < l; i++) {
      let index = path[i];
      if (!list[index]) {
        return;
      }
      list = list[index].c;
    }
    let tar = list[path[l]];
    return tar && tar.v;
  }
}
