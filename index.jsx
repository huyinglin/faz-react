

const element = <h1 title="foo">Hello</h1>

// const element = {
//   type: "h1",
//   props: {
//     title: "foo",
//     children: "Hello",
//   },
// }


function createElement(type, props, ...children) {

  // console.log('type: ', type);
  // console.log('props: ', props);
  // console.log('children: ', children);

  const element = {
    type,
    props: {
      ...props,
      children,
    }
  }
  console.log('element: ', element);

  const node = document.createElement(element.type);

  const text = document.createTextNode('');

  for (let prop in element.props) {
    node[prop] = element.props[prop];
  }

  children.forEach((child, index) => {
    if (!child) {
      return;
    }
    if (typeof child === 'string') {
      text['nodeValue'] = child;
    }
  });

  const container = document.getElementById('root');

  node.appendChild(text);

  container.appendChild(node);

}
