
/* ================================= Step 0 ================================= */

// const element = <h1 title="foo">Hello</h1>;

// const element = {
//   type: "h1",
//   props: {
//     title: "foo",
//     children: "Hello",
//   },
// }

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

/* =================== Step I: The createElement Function =================== */

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

/* ====================== Step II: The render Function ====================== */

// function render(element, container) {
//   const dom = element.type === 'TEXT_ELEMENT'
//     ? document.createTextNode('')
//     : document.createElement(element.type);

//   /**
//    * 下面的 render 方法方式有问题：
//    * 开始渲染后，直到渲染完完整的元素树后，我们才会停止。
//    * 如果元素树很大，则可能会阻塞主线程太长时间。
//    * 而且，如果浏览器需要执行高优先级的操作（例如处理用户输入或保持动画流畅），则它必须等到渲染完成为止。
//    */
//   element.props.children
//     .forEach(child => render(child, dom));

//   Object.keys(element.props)
//     .forEach(name => name !== 'children' && (dom[name] = element.props[name]));

//   container.appendChild(dom);

// }


function render(element, container) {
  // 在渲染函数中，我们将nextUnitOfWork设置为fiber tree的根。
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  }

}

/* ======================== Step III: Concurrent Mode ======================= */

/**
 * 我们将把工作分解成几个小单元，在完成每个单元后，如果需要执行其他任何操作，我们将让浏览器中断渲染。
 */
let nextUnitOfWork = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

/**
 * 我们使用requestIdleCallback进行循环。
 * 你可以将requestIdleCallback视为setTimeout，但是浏览器将在主线程空闲时运行回调，而不是告诉它何时运行。
 * React不再使用requestIdleCallback。 现在，它使用scheduler package。 但是对于此用例，它在概念上是相同的。
 */
requestIdleCallback(workLoop)

/**
 * 要开始使用循环，我们需要设置第一个工作单元，然后编写一个performUnitOfWork函数，
 * 该函数不仅执行工作，还返回下一个工作单元。
 * 所以我们需要一个数据结构：Fiber。里面包含下一个工作单元等信息。
 */
function performUnitOfWork(fiber) {
  /**
   * 需要做以下三件事
   * 1. 将元素添加到DOM
   * 2. 为元素的子代创建fiber
   * 3. 选择下一个工作单元
   */

  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = element[index];

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }

  /**
   * 渲染顺序：
   * 1. 如果Fiber有child则渲染child
   * 2. 如果没有child，则渲染sibling节点
   * 3. 如果既没有child也没有sibling，则回到parent，渲染parent的sibling
   * 4. 如果parent没有sibling，则继续往上找parent，直到根节点
   * 5. 如果到达根节点，则渲染完成
   */
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }


}

/* ============================= Step IV: Fibers ============================ */

/**
 * Fiber Tree
 *
 * Fiber中会包含：
 * 1. 第一个子节点（child）
 * 2. 下一个兄弟节点（sibling）
 * 3. 父节点（parent）
 *
 *     root
 *      ↓↑
 *     <div>
 *      ↓↑  ↖
 *     <h1> → <h2>
 *      ↓↑  ↖
 *     <p>  → <a>
 *
 */


function createDom(fiber) {
  const dom = element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  Object.keys(element.props).forEach(name => name !== 'children' && (dom[name] = element.props[name]));

  return dom;
}


/* ================================= render ================================= */

const FazReact = {
  createElement,
  render,
};

const container = document.getElementById("root");
FazReact.render(element, container);
