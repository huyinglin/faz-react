
/* ================================= Step 0 ================================= */

// const element = <h1 title="foo">Hello</h1>;

// const element = {
//   type: "h1",
//   props: {
//     title: "foo",
//     children: "Hello",
//   },
// }

/* =================== Step I: The createElement Function =================== */

const element = (
  <div id="foo">
    <a>bar</a>
    <br />
    2323
  </div>
);

// const element = createElement(
//   'div',
//   { id: 'foo' },
//   createElement('a', null, 'bar'),
//   createElement('a', null, []),
// );

// const element = {
//   type: 'div',
//   props: {
//     id: 'foo',
//     children: [
//       {
//         type: 'a',
//         props: {
//           children: ['bar'],
//         },
//       },
//       {
//         type: 'br',
//         props: {
//           children: [],
//         },
//       },
//     ],
//   },
// };

/* ====================== Step II: The render Function ====================== */

/* ============================== createElement ============================= */

function createElement(type, props, ...children) {

  // console.log('type: ', type);
  // console.log('props: ', props);
  // console.log('children: ', children);
  const element = {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextElement(child)),
    }
  };
  console.log('element: ', element);

  return element;
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function render(element, container) {
  const dom = element.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(element.type);

  element.props.children
    .forEach(child => render(child, dom));

  Object.keys(element.props)
    .forEach(name => name !== 'children' && (dom[name] = element.props[name]));

  container.appendChild(dom);

}

const FazReact = {
  createElement,
  render,
};

const container = document.getElementById("root");
FazReact.render(element, container);
