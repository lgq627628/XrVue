class Star {
  constructor() {
    this.fans = []
  }
  addFan(fan) {
    this.fans.push(fan)
  }
  removeFan(fan) {
    let idx = this.fans.findIndex(f => f === fan)
    if (idx > -1) this.fans.splice(idx, 1)
  }
  notify(newVal) {
    this.fans.forEach(fan => {
      fan.updateView(newVal)
    })
  }
}

// 收集依赖，数据变化时通知依赖（这里的依赖就是指每个 watcher，watcher 就是数据更新视图的方法）
// class Dep {
//   constructor() {
//     this.subs = []
//   }
//   addSub(watcher) {
//     this.subs.push(watcher)
//   }
//   notify() {
//     this.subs.forEach(watcher => {
//       watcher.update()
//     })
//   }
// }
