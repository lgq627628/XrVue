let compileUtils = {
  text(node, expr, vm) {
    let value = this.getVal(expr, vm)
    this.updateMap.updateText(node, value)
   },
  html(node, expr, vm) {
    let value = this.getVal(expr, vm)
    this.updateMap.updateHtml(node, value)
   },
  model(node, expr, vm) {
    let value = this.getVal(expr, vm)
    this.updateMap.updateModel(node, value)
  },
  bind(node, expr, vm, bindName) {
    let value = this.getVal(expr, vm)
    this.updateMap.updateBind(node, value, bindName)
  },
  on(node, expr, vm, eventName) {
    let f = vm.$options.methods && vm.$options.methods[expr]
    node.addEventListener(eventName, f.bind(vm), false)
  },
  getVal(expr, vm) {
    return expr.split('.').reduce((pre, cur) => {
      return pre[cur]
    }, vm.$data)
  },
  updateMap: {
    updateText(node, value){
      node.textContent = value
    },
    updateHtml(node, value){
      node.innerHTML = value
    },
    updateModel(node, value){
      node.value = value
    },
    updateBind(node, value, bindName){
      node.setAttribute(bindName, value)
    }
  }
}
class XrVue {
  constructor(options) {
    this.$options = options
    this.$el = this.isHtmlNode(options.el) ? options.el : document.querySelector(options.el)
    this.$data = options.data || {}
    // 第一步：数据劫持
    this.handleReactiveData()
    // 第二步：编译
    this.compile(this.$el, this)
  }
  handleReactiveData() {}
  compile(el, vm) {
    // 如果直接对元素进行操作则性能低，所以先转换成文档碎片，对文档碎片进行操作
    let f = this.node2Fragment(el)
    f = this.compileFragment(f, vm)
    this.$el.appendChild(f)
  }
  compileFragment(f, vm) {
    Array.from(f.childNodes).forEach(child => {
      if (this.isHtmlNode(child)) { // 如果是标签
        this.compileHtml(child, vm)
      } else { // 如果是文本
        this.compileText(child, vm)
      }
      if (child.childNodes && child.childNodes.length) this.compileFragment(child, vm)
    })
    return f
  }
  compileHtml(node, vm) {
    let attrs = node.attributes
    Array.from(attrs).forEach(attr => {
      let { name, value } = attr
      if (this.isDirective(name)) {
        let [, directive] = name.split('-')
        let [directiveName, eventName] = directive.split(':')
        compileUtils[directiveName](node, value, vm, eventName)
        node.removeAttribute(name)
      } else if (this.isBindDirective(name)) {
        let [, bindName] = name.split(':')
        compileUtils['bind'](node, value, vm, bindName)
        node.removeAttribute(`:${bindName}`)
      } else if (this.isEventDirective(name)) {
        let [, eventName] = name.split('@')
        compileUtils['on'](node, value, vm, eventName)
        node.removeAttribute(`@${eventName}`)
      }
    })
  }
  compileText(node, vm) {
    let text = node.textContent
    if (/{{(.*)}}/.test(text)) {
      let value = text.replace(/{{(.*)}}/g, (...args) => {
        return compileUtils.getVal(args[1], vm)
      })
      compileUtils.updateMap.updateText(node, value)
    }
  }
  isBindDirective(str) {
    return str.startsWith(':')
  }
  isEventDirective(str) {
    return str.startsWith('@')
  }
  isDirective(str) {
    return str.startsWith('v-')
  }
  node2Fragment(el) {
    // 因为文档片段存在于内存中，并不在DOM树中，所以将子元素插入到文档片段时不会引起页面回流（对元素位置和几何上的计算）。
    let f = document.createDocumentFragment();
    while(el.firstChild) {
      f.appendChild(el.firstChild)
    }
    return f
  }
  isHtmlNode(el) { // 如果是标签
    return el.nodeType === 1
  }
}
