
function createElement(type, props, ...children) {

  // console.log('type: ', type);
  // console.log('props: ', props);
  // console.log('children: ', children);

  // const node = document.createElement(element.type);

  // const text = document.createTextNode('');

  // Object.keys(element.props).forEach(prop => {
  //   if (prop) {
  //     node[prop] = element.props[prop];
  //   }
  // });

  // children.forEach((child, index) => {
  //   if (!child) {
  //     return;
  //   }
  //   if (typeof child === 'string') {
  //     text['nodeValue'] = child;
  //   }
  // });

  // const container = document.getElementById('root');

  // node.appendChild(text);

  // container.appendChild(node);

  const element = {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextElement(child)),
    }
  }
  console.log('element: ', element);

  return element;
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    }
  };
}

const FazReact = {
  createElement,
};

export default FazReact;
