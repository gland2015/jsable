export class CacheObject {
  constructor() {
    this.fnData = Object.create(null);
  }

  private fnData: { [key: string]: any };

  public set(key: string, fn: Function) {
    this.fnData[key] = () => {
      let data = fn();
      this.fnData[key] = () => {
        return data;
      };
      return data;
    };
  }

  public get(key: string) {
    let fn = this.fnData[key];
    return fn ? fn() : null;
  }

  public remove(key: string) {
    delete this.fnData[key];
  }
}
