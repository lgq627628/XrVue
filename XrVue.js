class XrVue {
  constructor(options) {
    this.$options = options
    this.$el = this.isHtmlNode(options.el) ? options.el : document.querySelector(options.el)
    this.$data = options.data || {}
  }
}
