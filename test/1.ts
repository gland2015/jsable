class A {
  private d;
  /**
   * sdfsdf
   */
  me: () => number;
}

class B implements A {
  private d;
  me() {
    return 0;
  }
}

let b = new B();
b.me;

B.prototype.me = function (this: A) {
  this.me();
  return 4;
};

function G() {}

G.prototype.me = function () {};
G.prototype.me1 = function () {};

let g = new G();
g;
