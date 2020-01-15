class Fan {
  constructor(cb) {
    this.cb = cb
    Star.target = this
  }
  updateView(newVal) {
    this.cb(newVal)
  }
  // constructor(vm, expr, cb) {
  //   this.vm = vm;
  //   this.expr = expr;
  //   this.cb = cb;
  //   Star.target = this
  // }
  // updateView () {
  //   let newVal = compileUtils.getVal(this.expr, this.vm);
  //   this.cb(newVal)
  // }
}


// class Watcher {
//   constructor() {

//   }
//   update() {

//   }
// }
