let compileUtils = {
  text(child, directiveName, value, vm) {
    child.textContent = this.getVal(value, vm.$data)
    child.removeAttribute('v-text')
   },
  html(child, directiveName, value, vm) {
    child.innerHTML = this.getVal(value, vm.$data)
    child.removeAttribute('v-html')
   },
  model(child, directiveName, value, vm) {
    child.value = this.getVal(value, vm.$data)
    child.removeAttribute('v-model')
  },
  bind(child, directiveName, value, vm) {
    child.removeAttribute(`v-bind:${directiveName}`)
    child.removeAttribute(`:${directiveName}`)
    child.setAttribute(directiveName, this.getVal(value, vm.$data))
  },
  on(child, directiveName, value, vm, eventName) {
    child.addEventListener(eventName, vm.$methods[value])
    child.removeAttribute(`v-on:${directiveName}`)
    child.removeAttribute(`@${directiveName}`)
  },
  getVal(value, data) {
    let values = value.split('.')
    let val = values.reduce((pre, cur, i) => {
      return i === 0 ? pre : pre[cur]
    }, data[values[0]])
    return val
  }
}
class XrVue {
  constructor(options) {
    this.$options = options
    this.$el = this.isHtmlNode(options.el) ? options.el : document.querySelector(options.el)
    this.$data = options.data || {}
    this.$methods = options.methods || {}
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
        let attrs = child.attributes
        Array.from(attrs).forEach(attr => {
          let { name, value } = attr
          if (this.isDirective(name)) {
            let [, directive] = name.split('-')
            let [directiveName, eventName] = directive.split(':')
            compileUtils[directiveName](child, eventName, value, vm, eventName)
          } else if (name.startsWith(':')) {
            let [, eventName] = name.split(':')
            compileUtils['bind'](child, eventName, value, vm)
          } else if (name.startsWith('@')) {
            let [, eventName] = name.split('@')
            compileUtils['on'](child, eventName, value, vm, 'click')
          }
        })
        let content = child.innerHTML
        if (/\{\{(.*)\}\}/.test(content)) {
          let newContent = content.replace(/\{\{(.*)\}\}/g, (...agrs) => {
            return compileUtils.getVal(agrs[1], vm.$data)
          })
          child.innerHTML = newContent
        }
        // if (child.childNodes && child.childNodes.length) this.compileFragment(child, vm)
      } else { // 如果是文本
      }
    })
    return f
  }
  isDirective(str) {
    return str.startsWith('v-')
  }
  node2Fragment(el) {
    // 因为文档片段存在于内存中，并不在DOM树中，所以将子元素插入到文档片段时不会引起页面回流（对元素位置和几何上的计算）。
    // 因此，使用文档片段通常会带来更好的性能。
    let f = document.createDocumentFragment();
    let firstChild = el.firstChild
    while(firstChild) {
      f.appendChild(firstChild)
      firstChild = el.firstChild
    }
    return f
  }
  isHtmlNode(el) {
    return el.nodeType === 1
  }
}
