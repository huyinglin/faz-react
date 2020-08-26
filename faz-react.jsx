
/* ================================= Step 0 ================================= */

// const element = <h1 title="foo">Hello</h1>;

// const element = {
//   type: "h1",
//   props: {
//     title: "foo",
//     children: "Hello",
//   },
// }

// const element = (
//   <div id="foo">
//     <a>bar</a>
//     <br />
//     2323
//   </div>
// );

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

  // 为了避免混淆，我将使用“ element”来指代React元素，并使用“ node”来指代DOM元素。

  const isObject = value => typeof value === 'object' && value !== null;

  const element = {
    type,
    props: {
      ...props,
      children: children.map(child => isObject(child) ? child : createTextElement(child)),
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

const isEvent = key => key.startsWith('on'); // 处理原生事件
const isProperty = key => key !== 'children' && !isEvent(key); // 处理属性
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

function updateDom(dom, prevProps, nextProps) {
  //  移除 alternate 上的事件监听
  // TODO 优化这里逻辑，可以直接判断是否是元素事件 props
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  // TODO 使用 removeAttribute setAttribute
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => dom[name] = '');

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => dom[name] = nextProps[name]);

  // 增加事件监听
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });

}

function commitRoot() {
  // add nodes to dom
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.stateNode;

  if (fiber.effectTag === 'PLACEMENT' && fiber.stateNode !== null) {
    domParent.appendChild(fiber.stateNode);
  } else if (fiber.effectTag === 'UPDATE' && fiber.stateNode !== null) {
    updateDom(
      fiber.stateNode,
      fiber.alternate.props,
      fiber.props,
    );
  } else if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.stateNode);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  // 在渲染函数中，我们将nextUnitOfWork设置为fiber tree的根。
  wipRoot = {
    stateNode: container,
    props: {
      children: [element],
    },
    alternate: currentRoot, // 旧 fiber 的引用
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

/**
 * 我们将把工作分解成几个小单元，在完成每个单元后，如果需要执行其他任何操作，我们将让浏览器中断渲染。
 */

let nextUnitOfWork = null;
let currentRoot = null; // 提交给 DOM 的最后一个 fiber tree 的引用
let wipRoot = null;
let deletions = null; // 存放需要删除的节点

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    // 此时已经没有下一个工作单元，表明已循环结束，这时我们便将整个 fiber 提交给 DOM
    commitRoot();
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

  if (!fiber.stateNode) {
    fiber.stateNode = createDom(fiber);
  }

  reconcileChildren(fiber, fiber.props.children);

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

function reconcileChildren(fiber, children) {
  let index = 0;
  let oldFiber = fiber.alternate && fiber.alternate.child;
  let prevSibling = null;

  while (
    index < children.length ||
    oldFiber !== null
  ) {
      console.log('fiber: ', fiber);
    const element = children[index];
    let newFiber = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      // 如果旧的fiber和新的元素具有相同的类型，我们可以保留DOM节点并仅使用新的道具进行更新

      newFiber = {
        type: oldFiber.type,
        props: element.props,
        stateNode: oldFiber.stateNode,
        parent: fiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }

    if (element && !sameType) {
      // 如果类型不同并且有一个新元素，则意味着我们需要创建一个新的DOM节点

      newFiber = {
        type: element.type,
        props: element.props,
        stateNode: null,
        parent: fiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      }
    }

    if (oldFiber && !sameType) {
      // 如果类型不同且有旧光纤，则需要删除旧节点
      // delete the oldFiber's node

      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
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
  const dom = fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props)
  // Object.keys(element.props).forEach(name => name !== 'children' && (dom[name] = element.props[name]));

  return dom;
}


/* ================================= render ================================= */

const FazReact = {
  createElement,
  render,
};

/** @jsx FazReact.createElement */
const container = document.getElementById("root");
// FazReact.render(element, container);

const updateValue = e => {
  console.log('e.target.value: ', e.target.value);
  rerender(e.target.value)
}

const rerender = value => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} role="input"/>
      <h2>!Hello {value}</h2>
    </div>
  )
  FazReact.render(element, container)
}

rerender("World");
