import clsx from "clsx";
import { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import ErrorMessage from "./ErrorMessage";
import InlineButton from "./InlineButton";

type ListProps<I, K> = {
  items: I[] | Error;
  selection: K | null;
  style?: string | JSX.CSSProperties;
  getKey: (item: I, index: number) => K;
  children: (item: I) => ComponentChildren;
  onSelect: (key: K | null) => void;
  onErrorClear?: () => void;
};

const List = <I, K>(props: ListProps<I, K>) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const handleKeyDown: JSX.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (props.items instanceof Error) return;

    if (props.items.length === 0) return;

    switch (event.code) {
      case "ArrowUp": {
        event.preventDefault();
        const currentIndex = props.items.findIndex((item, index) => props.getKey(item, index) === props.selection);
        const previousIndex = currentIndex - 1;
        if (props.items[previousIndex]) {
          props.onSelect(props.getKey(props.items[previousIndex], previousIndex));
        } else {
          props.onSelect(props.getKey(props.items[0], 0));
        }
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        const currentIndex = props.items.findIndex((item, index) => props.getKey(item, index) === props.selection);
        const nextIndex = currentIndex + 1;
        if (props.items[nextIndex]) {
          props.onSelect(props.getKey(props.items[nextIndex], nextIndex));
        }
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    if (rootRef.current && props.selection) {
      for (const child of rootRef.current.children) {
        if (!(child instanceof HTMLElement)) continue;
        if (child.dataset["key"] === props.selection) {
          child.scrollIntoView({ block: "nearest" });
          break;
        }
      }
    }
  }, [props.selection]);

  return (
    <div
      ref={rootRef}
      className={clsx("list", props.items instanceof Error && "list--has-error")}
      style={props.style}
      tabIndex={props.items instanceof Error ? undefined : 0}
      onKeyDown={handleKeyDown}
    >
      {props.items instanceof Error ? (
        <ErrorMessage>
          {props.items.message}
          {props.onErrorClear && (
            <>
              <br />
              <br />
              <InlineButton onClick={props.onErrorClear}>Clear error</InlineButton>
            </>
          )}
        </ErrorMessage>
      ) : (
        props.items.map((item, index) => {
          const key = props.getKey(item, index);

          return (
            <div
              data-key={key}
              key={key}
              className={clsx("list__item", props.selection === key && "list__item--selected")}
              onClick={() => props.onSelect(key)}
            >
              {props.children(item)}
            </div>
          );
        })
      )}
    </div>
  );
};

export default List;
