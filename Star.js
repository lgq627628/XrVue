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
  notify() {
    this.fans.forEach(fan => {
      fan.updateView()
    })
  }
}
