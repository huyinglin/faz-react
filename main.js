class Div {
  constructor(config) {
    this.children = [];
    this.root = document.createElement('div');
  }

  setAttribute(name, value) { // attribute
    this.root.setAttribute(name, value);
  }

  appendChild(child) {
    this.children.push(child);
  }

  mountTo(parent) {
    parent.appendChild(this.root);
    for(let child of this.children) {
      child.mountTo(this.root);
    }
  }
}

class Wrapper {
  constructor(type) {
    this.children = [];
    this.root = document.createElement(type);
  }

  setAttribute(name, value) { // attribute
    this.root.setAttribute(name, value);
  }

  appendChild(child) {
    this.children.push(child);
  }

  mountTo(parent) {
    parent.appendChild(this.root);
    for(let child of this.children) {
      child.mountTo(this.root);
    }
  }
}

class Text {
  constructor(text) {
    this.children = [];
    this.root = document.createTextNode(text);
  }

  mountTo(parent) {
    parent.appendChild(this.root);
  }
}


class MyComponent {
  constructor(type) {
    this.children = [];
    this.attribute = new Map();
  }

  setAttribute(name, value) { // attribute
    this.attribute.set(name, value);
  }

  appendChild(child) {
    this.children.push(child);
  }

  render() {
    return (
      <article>
        <header>I'm a header</header>
        {this.slot}
        <footer>I'm a footer</footer>
      </article>
    )
  }

  mountTo(parent) {
    this.slot = <div></div>

    for(let child of this.children) {
      this.slot.appendChild(child);
    }

    this.render().mountTo(parent);
  }
}

// const component = (
//   <Div id="a" class="b" style="width: 100;height: 100;background: green;">
//     2323
//     <p>323</p>
//     <div></div>
//     <div></div>
//   </Div>
// );

const component = (
  <MyComponent style="width: 100;height: 100;background: green;">
    <div>text text</div>
  </MyComponent>
);

component.mountTo(document.getElementById('root'));

console.log('component: ', component);

function create(Cls, attributes, ...children) {
  let o;
  if (typeof Cls === 'string') {
    o = new Wrapper(Cls);
  } else {
    o = new Cls();
  }


  for (let name in attributes) {
    o.setAttribute(name, attributes[name]);
  }

  for (let child of children) {
    if (typeof child === 'string') {
      child = new Text(child);
    }
    o.appendChild(child);
  }

  return o;
}
