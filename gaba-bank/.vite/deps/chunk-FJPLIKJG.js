import { createContextScope } from "./chunk-LKZQ3BAU.js";
import { Primitive } from "./chunk-LYY7VACZ.js";
import {
  createSlot,
  require_jsx_runtime,
  useComposedRefs,
} from "./chunk-YGFQIOVT.js";
import { require_react } from "./chunk-TVFQMRVC.js";
import { __toESM } from "./chunk-G3PMV62Z.js";

// node_modules/@radix-ui/react-direction/dist/index.mjs
var React = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var DirectionContext = React.createContext(void 0);
function useDirection(localDir) {
  const globalDir = React.useContext(DirectionContext);
  return localDir || globalDir || "ltr";
}

// node_modules/@radix-ui/react-collection/dist/index.mjs
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var import_react2 = __toESM(require_react(), 1);
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
function createCollection(name) {
  const PROVIDER_NAME = name + "CollectionProvider";
  const [createCollectionContext, createCollectionScope] =
    createContextScope(PROVIDER_NAME);
  const [CollectionProviderImpl, useCollectionContext] =
    createCollectionContext(PROVIDER_NAME, {
      collectionRef: { current: null },
      itemMap: /* @__PURE__ */ new Map(),
    });
  const CollectionProvider = (props) => {
    const { scope, children } = props;
    const ref = import_react.default.useRef(null);
    const itemMap = import_react.default.useRef(
      /* @__PURE__ */ new Map(),
    ).current;
    return (0, import_jsx_runtime2.jsx)(CollectionProviderImpl, {
      scope,
      itemMap,
      collectionRef: ref,
      children,
    });
  };
  CollectionProvider.displayName = PROVIDER_NAME;
  const COLLECTION_SLOT_NAME = name + "CollectionSlot";
  const CollectionSlotImpl = createSlot(COLLECTION_SLOT_NAME);
  const CollectionSlot = import_react.default.forwardRef(
    (props, forwardedRef) => {
      const { scope, children } = props;
      const context = useCollectionContext(COLLECTION_SLOT_NAME, scope);
      const composedRefs = useComposedRefs(forwardedRef, context.collectionRef);
      return (0, import_jsx_runtime2.jsx)(CollectionSlotImpl, {
        ref: composedRefs,
        children,
      });
    },
  );
  CollectionSlot.displayName = COLLECTION_SLOT_NAME;
  const ITEM_SLOT_NAME = name + "CollectionItemSlot";
  const ITEM_DATA_ATTR = "data-radix-collection-item";
  const CollectionItemSlotImpl = createSlot(ITEM_SLOT_NAME);
  const CollectionItemSlot = import_react.default.forwardRef(
    (props, forwardedRef) => {
      const { scope, children, ...itemData } = props;
      const ref = import_react.default.useRef(null);
      const composedRefs = useComposedRefs(forwardedRef, ref);
      const context = useCollectionContext(ITEM_SLOT_NAME, scope);
      import_react.default.useEffect(() => {
        context.itemMap.set(ref, { ref, ...itemData });
        return () => void context.itemMap.delete(ref);
      });
      return (0, import_jsx_runtime2.jsx)(CollectionItemSlotImpl, {
        ...{ [ITEM_DATA_ATTR]: "" },
        ref: composedRefs,
        children,
      });
    },
  );
  CollectionItemSlot.displayName = ITEM_SLOT_NAME;
  function useCollection(scope) {
    const context = useCollectionContext(name + "CollectionConsumer", scope);
    const getItems = import_react.default.useCallback(() => {
      const collectionNode = context.collectionRef.current;
      if (!collectionNode) return [];
      const orderedNodes = Array.from(
        collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`),
      );
      const items = Array.from(context.itemMap.values());
      const orderedItems = items.sort(
        (a, b) =>
          orderedNodes.indexOf(a.ref.current) -
          orderedNodes.indexOf(b.ref.current),
      );
      return orderedItems;
    }, [context.collectionRef, context.itemMap]);
    return getItems;
  }
  return [
    {
      Provider: CollectionProvider,
      Slot: CollectionSlot,
      ItemSlot: CollectionItemSlot,
    },
    useCollection,
    createCollectionScope,
  ];
}

// node_modules/@radix-ui/react-use-previous/dist/index.mjs
var React3 = __toESM(require_react(), 1);
function usePrevious(value) {
  const ref = React3.useRef({ value, previous: value });
  return React3.useMemo(() => {
    if (ref.current.value !== value) {
      ref.current.previous = ref.current.value;
      ref.current.value = value;
    }
    return ref.current.previous;
  }, [value]);
}

// node_modules/@radix-ui/react-visually-hidden/dist/index.mjs
var React4 = __toESM(require_react(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var VISUALLY_HIDDEN_STYLES = Object.freeze({
  // See: https://github.com/twbs/bootstrap/blob/main/scss/mixins/_visually-hidden.scss
  position: "absolute",
  border: 0,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  wordWrap: "normal",
});
var NAME = "VisuallyHidden";
var VisuallyHidden = React4.forwardRef((props, forwardedRef) => {
  return (0, import_jsx_runtime4.jsx)(Primitive.span, {
    ...props,
    ref: forwardedRef,
    style: { ...VISUALLY_HIDDEN_STYLES, ...props.style },
  });
});
VisuallyHidden.displayName = NAME;
var Root = VisuallyHidden;

export {
  useDirection,
  createCollection,
  usePrevious,
  VISUALLY_HIDDEN_STYLES,
  Root,
};
//# sourceMappingURL=chunk-FJPLIKJG.js.map
