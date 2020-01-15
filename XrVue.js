let compileUtils = {
  text(node, expr, vm) {
    new Fan((newVal) => {
      this.updateMap.updateText(node, newVal)
    });
    let value = this.getVal(expr, vm)
    this.updateMap.updateText(node, value)
   },
  html(node, expr, vm) {
    new Fan((newVal) => {
      this.updateMap.updateHtml(node, newVal)
    });
    // new Fan(vm, expr, (newVal) => {
    //   this.updateMap.updateHtml(node, newVal)
    // });
    let value = this.getVal(expr, vm)
    this.updateMap.updateHtml(node, value)
   },
  model(node, expr, vm) {
    new Fan((newVal) => {
      this.updateMap.updateModel(node, newVal)
    });
    let value = this.getVal(expr, vm)
    this.updateMap.updateModel(node, value)
  },
  bind(node, expr, vm, bindName) {
    new Fan((newVal) => {
      this.updateMap.updateBind(node, newVal, bindName)
    });
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
    this.$options = options;
    this.$el = this.isHtmlNode(options.el) ? options.el : document.querySelector(options.el);
    this.$data = options.data || {};
    // 第一步：数据劫持
    this.observeData(this.$data);
    // 第二步：编译
    this.compile(this.$el, this);
    // 第三步：代理数据
    this.proxyData(this.$data);
  }
  proxyData(data) {
    Object.keys(data).forEach(key => {
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: false,
        get() {
          return this.$data[key]
        },
        set(newVal) {
            this.$data[key] = newVal
        }
      })
    })
  }
  observeData(data) {
    if (!data || typeof data !== 'object') return
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key])
    });
  }
  defineReactive(obj, key, value) {
    let star = new Star()
    this.observeData(value)
    Object.defineProperty(obj, key, {
      // 1、Object.defineProperty 只能劫持对象的属性，只能重定义属性的读取（get）和设置（set）行为，我们需要对每个对象的每个属性进行递归遍历。2、无法监控到数组下标的变化（其实它本身可以，是 Vue 为了提高性能抛弃了它，并提供了几个数组 hack 方法）
      // 1、Proxy 可以劫持整个对象，并返回一个新对象。2、有13种劫持操作。3、可以重定义更多的行为，比如 in、delete、函数调用等更多行为
      // 为什么 Vue2 不使用 Proxy 呢？因为 Proxy 是 es6 提供的新特性，它最大问题在于浏览器支持度不够，兼容性不好，最主要的是这个属性无法用 polyfill 来兼容
      // 目前 Proxy 并没有有效的兼容方案，未来大概会是3.0和2.0并行，需要支持IE的选择2.0。
      enumerable: true, // 可枚举
      configurable: false, // 不能再设置
      get() {
        // Watcher实例在实例化过程中， 会读取data中的某个属性， 从而触发当前get方法
        Star.target && star.addFan(Star.target)
        Star.target = null
        console.log(obj, key, star)
        return value
      },
      set: (newValue) => { // 使得 this 指向 vm，相当于在 defineProperty 写个 let self = this
        if (newValue !== value) {
          console.log('新值', newValue, '旧值', value)
          value = newValue
          star.notify(newValue)
        }
        console.log(star)
        this.observeData(newValue) // 如果重新设置的值是对象，需要重新劫持
      }
    });
  }
  compile(el, vm) {
    // 如果直接对元素进行操作则性能低，所以先转换成文档碎片，对文档碎片进行操作
    let f = this.node2Fragment(el);
    this.compileFragment(f, vm);
    this.$el.appendChild(f);
  }
  compileFragment(f, vm) {
    Array.from(f.childNodes).forEach(child => {
      if (this.isHtmlNode(child)) {
        // 如果是标签
        this.compileHtml(child, vm);
      } else if (this.isTextNode(child)) {
        // 如果是文本
        this.compileText(child, vm);
      }
      if (child.childNodes && child.childNodes.length) this.compileFragment(child, vm);
    });
    return f;
  }
  compileHtml(node, vm) {
    let attrs = node.attributes;
    Array.from(attrs).forEach(attr => {
      let { name, value } = attr;
      if (this.isDirective(name)) {
        let [, directive] = name.split('-');
        let [directiveName, eventName] = directive.split(':');
        compileUtils[directiveName](node, value, vm, eventName);
        node.removeAttribute(name);
      } else if (this.isBindDirective(name)) {
        let [, bindName] = name.split(':');
        compileUtils['bind'](node, value, vm, bindName);
        node.removeAttribute(`:${bindName}`);
      } else if (this.isEventDirective(name)) {
        let [, eventName] = name.split('@');
        compileUtils['on'](node, value, vm, eventName);
        node.removeAttribute(`@${eventName}`);
      }
    });
  }
  compileText(node, vm) {
    let text = node.textContent;
    if (/\{\{(.+?)\}\}/.test(text)) {
      // .表示任意字符；+表示一次或多次；?表示非贪婪匹配
      let value = text.replace(/{{(.+?)}}/g, (...args) => {
        new Fan((newVal) => {
          compileUtils.updateMap.updateText(node, newVal)
        });
        return compileUtils.getVal(args[1], vm);
      });
      compileUtils.updateMap.updateText(node, value);
    }
  }
  isBindDirective(str) {
    return str.startsWith(':');
  }
  isEventDirective(str) {
    return str.startsWith('@');
  }
  isDirective(str) {
    return str.startsWith('v-');
  }
  node2Fragment(el) {
    // 因为文档片段存在于内存中，并不在DOM树中，所以将子元素插入到文档片段时不会引起页面回流（对元素位置和几何上的计算）。
    let f = document.createDocumentFragment();
    while (el.firstChild) {
      f.appendChild(el.firstChild);
    }
    return f;
  }
  isHtmlNode(el) {
    // 如果是标签
    return el.nodeType === 1;
  }
  isTextNode(el) {
    // 如果是标签
    return el.nodeType === 3;
  }
}
