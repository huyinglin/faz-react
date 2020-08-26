export const FunctionComponent = 0;
export const ClassComponent = 1;
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;

const TextElementTag = "TEXT_ELEMENT";

export const Placement = /*                */ 0b00000000000010; // DOM需要插入到页面中
export const Update = /*                   */ 0b00000000000100; // DOM需要更新
export const PlacementAndUpdate = /*       */ 0b00000000000110; // DOM需要插入到页面中并更新
export const Deletion = /*                 */ 0b00000000001000; // DOM需要删除

const EffectTag = {
  Placement,
  Update,
  PlacementAndUpdate,
  Deletion,
};

function createElement(type, props, ...children) {
  const isObject = (value) => typeof value === "object" && value !== null;

  const element = {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        isObject(child) ? child : createTextElement(child)
      ),
    },
  };

  return element;
}

function createTextElement(text) {
  return {
    type: TextElementTag,
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createDom(fiber) {
  const stateNode =
    fiber.type == TextElementTag
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(stateNode, {}, fiber.props);

  return stateNode;
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);

// 处理节点的 props 和事件监听
function updateDom(dom, prevProps, nextProps) {

  for (const prop in prevProps) {
    const isGoneProp = !(prop in nextProps);
    const isNewProp = prevProps[prop] !== nextProps[prop];

    if (isEvent(prop) && (isGoneProp || isNewProp)) {
      // 移除不存在的事件监听

      const type = prop.toLowerCase().substring(2);
      const listener = prevProps[prop];

      dom.removeEventListener(type, listener);
    }

    if (isProperty(prop) && isGoneProp) {
      // 移除更新后删除了的 props
      dom[name] = "";
    }
  }

  for (const prop in nextProps) {
    const isNewProp = prevProps[prop] !== nextProps[prop];

    if (isEvent(prop) && isNewProp) {
      // 添加原生元素事件监听
      const type = prop.toLowerCase().substring(2);
      const listener = nextProps[prop];

      dom.addEventListener(type, listener);
    }

    if (isProperty(prop) && isNewProp) {
      dom[prop] = nextProps[prop];
    }
  }
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

// 根据 effectTag 操纵 DOM
function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;

  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }

  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === 'function';

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

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

let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState(initial) {
  const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];

  const initialValue = typeof initial === 'function' ? initial() : initial;
  const hook = {
    state: oldHook ? oldHook.state : initialValue,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  });

  const setState = action => {
    hook.queue.push(action);

    // 我们执行与render函数中类似的操作，将新的进行中的工作根设置为下一个工作单元，以便工作循环可以开始新的渲染阶段。
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  }

  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState]
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber, childrens) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < childrens.length || oldFiber != null) {
    const children = childrens[index];
    let newFiber = null;

    const sameType = oldFiber && children && children.type == oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: children.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (children && !sameType) {
      newFiber = {
        type: children.type,
        props: children.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (children) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

const FazReact = {
  createElement,
  render,
  useState,
};

const container = document.getElementById("root");

// const updateValue = (e) => {
//   rerender(e.target.value);
// };

// const rerender = (value) => {
//   const element = (
//     <div>
//       <input onInput={updateValue} value={value} />
//       <h2 style={{ color: "red" }}>Hello {value}</h2>
//       {/* {value.split('').map(it => (
//         <div>{it}</div>
//       ))} */}
//     </div>
//   );
//   FazReact.render(element, container);
// };

// rerender("World");

// function Home(props) {
//   return <div>This Home {props.name}</div>;
// }

// function App(props) {
//   return <h1>Hi {props.name} <Home name="ll"/><Home name="ll"/></h1>;
// }
// const element = <App name="foo" />

function Counter() {
  const [state, setState] = FazReact.useState(1);
  const [value, setValue] = FazReact.useState(0);

  function onClick() {
    setState(state + 1);
    setValue(state * 2);
  }

  return (
    <div>
      <button onClick={onClick}>click</button>
      <h1>
        Count: {state}
        Value: {value}
      </h1>
    </div>
  )
}
const element = <Counter />

FazReact.render(element, container);