/* global document */
/* global requestAnimationFrame */
/* eslint-disable require-jsdoc */
/* eslint-disable no-negated-condition */

var React = {};
var compId = 0;

React.Component.prototype.render = function() {
  return null;
};

React.Component.prototype.forceUpdate = function() {
  if (this.id) {
    var mountId = document.getElementById(this.id);
    if (mountId !== undefined) {
      this.oldVersion = undefined;
      React.render(this, mountId);
    }
  }
};

React.Component.prototype.setProps = function(newProps) {
  Object.getOwnPropertyNames(newProps).forEach(function(el) {
    var prop = newProps[el];
    if (el.localeCompare("constructor") === 0) {
      return;
    }

    if (typeof prop === "function") {
      this[el] = prop.bind(this);
    } else {
      this[el] = prop;
    }
  }, this);

  this.forceUpdate();
};

React.class = function(def) {
  function constr() {
    Object.create(React.Component);
    React.Component.call(this);
    def.constructor.call(this);
    React.Component.prototype.setProps.call(this, def);
  }

  constr.prototype = Object.create(React.Component.prototype);
  return constr;
};

React.render = function(component, actualDOM) {
  var div;

  if (component.render() === null) {
    console.log("Define a render property");
  } else if (component.render().hasOwnProperty("render")) {
    React.render(component.render(), actualDOM);
  } else if (!component.id) {
    component.id = ++compId;
    div = document.createElement('div');
    div.id = component.id;
    actualDOM.appendChild(div);
    compToDOM(component.render(), div, component);
    Object.defineProperty(component, "oldVersion", {
      value: JSON.stringify(component),
      configurable: true,
      writable: true,
      enumerable: false
    });
  } else {
    var newVersion = JSON.stringify(component);
    div = document.getElementById(component.id);
    if (component.oldVersion.localeCompare(newVersion) === 0 &&
        component.children !== undefined) {
      compToDOM(component.children.render(), div, component);
    } else if (component.oldVersion.localeCompare(newVersion) !== 0) {
      component.oldVersion = newVersion;
      while (div.firstChild) {
        div.removeChild(div.firstChild);
      }
      compToDOM(component.render(), div, component);
    }
  }
};

function compToDOM(node, root, component) {
  var n = [].concat(node);

  n.forEach(function(el) {
    if ((typeof el === "string") || (typeof el !== "object")) {
      root.innerHTML += el;
    } else if (el.hasOwnProperty("render")) {
      React.render(el, root);
    } else {
      nodeToDOM(el, root, component);
    }
  });
}

function nodeToDOM(node, root, component) {
  var newNode = document.createElement(node.tag);

  if (node.attrs !== undefined) {
    Object.getOwnPropertyNames(node.attrs).forEach(function(el) {
      if (/^on[A-Z]/.test(el) && typeof node.attrs[el] === "function") {
        newNode.addEventListener(el.substring(2).toLowerCase(), component[el]);
      } else {
        newNode[el] = node.attrs[el];
      }
    });
  }

  if (node.children !== undefined) {
    compToDOM(node.children, newNode, component);
  }

  root.appendChild(newNode);
}

/** TEST */
function debug() {
  var Box = React.class({
    constructor: function() {
      this.height = 100;
    },
    render: function() {
      return [{
        tag: 'span', children: "box "
      }];
    }
  });

  var b = new Box();
  var Counter = React.class({
    constructor: function() {
      this.count = 0;
    },
    onClick: function() {
      this.count += 1;
    },
    render: function() {
      return [{
        tag: "span",
        children: this.count
      }, {
        tag: "button",
        attrs: {onClick: this.onClick},
        children: "Increment"
      }];
    }
  });

  var c = new Counter();

  function render() {
    React.render(c, document.body);
    requestAnimationFrame(render);
  }

  render();
}
