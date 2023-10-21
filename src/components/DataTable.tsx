import clsx from "clsx";
import { useLayoutEffect, useRef, useState } from "preact/hooks";

type DragState = {
  index: number;
  width: number;
  start: number;
  offset: number;
};

export type DataTableColumn<T> = {
  key: string;
  heading: string;
  width: number;
  formatter: (item: T) => string;
};

type DataTableProps<T, K> = {
  id?: string;
  columns: DataTableColumn<T>[];
  items: T[];
  getItemKey: (item: T) => K;
  rowHeight: number;
  minColumnWidth: number;
  className?: string;
  style?: JSX.CSSProperties;
  overscan?: number;
  selection: K[];
  onSelection: (selection: K[]) => void;
  onActivation?: (key: K) => void;
  onColumnResize: (index: number, size: number) => void;
};

const getGripPosition = (
  columns: DataTableColumn<never>[],
  index: number,
  dragState: DragState | undefined,
  minColumnWidth: number,
) =>
  columns.slice(0, index + 1).reduce((acc, column, index) => {
    const offset = dragState?.index === index ? dragState.offset : 0;
    return acc + Math.max(column.width + offset, minColumnWidth);
  }, 0);

const DataTable = <T, K>({
  id,
  columns,
  items,
  getItemKey,
  rowHeight,
  className,
  style,
  minColumnWidth,
  overscan = 0,
  selection,
  onSelection,
  onActivation,
  onColumnResize,
}: DataTableProps<T, K>) => {
  const [dragState, setDragState] = useState<DragState>();
  const [virtualizationParams, setVirtualizationParams] = useState<{
    headHeight: number;
    index: number;
    count: number;
  }>();
  const tableRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const table = tableRef.current!;
    const head = headRef.current!;
    const callback = () => {
      const headHeight = head.clientHeight;
      const tableHeight = table.clientHeight;
      const scrollTop = table.scrollTop;

      const count = Math.ceil((tableHeight - headHeight) / rowHeight) + overscan * 2;
      const index = Math.floor(scrollTop / rowHeight) - overscan;

      setVirtualizationParams({ headHeight, index, count });
    };
    const resizeObserver = new ResizeObserver(() => callback());
    resizeObserver.observe(table);
    resizeObserver.observe(head);
    table.addEventListener("scroll", callback);

    return () => {
      resizeObserver.disconnect();
      table.removeEventListener("scroll", callback);
    };
  }, [rowHeight, overscan]);

  useLayoutEffect(() => {
    const moveCallback = (event: MouseEvent) =>
      setDragState((s) => {
        if (s !== undefined) {
          const offset = event.pageX - s.start;
          return { ...s, offset };
        }
        return s;
      });
    const upCallback = () => {
      setDragState((s) => {
        if (s !== undefined) {
          onColumnResize(s.index, Math.max(s.width + s.offset, minColumnWidth));
          return undefined;
        }
        return s;
      });
    };

    window.addEventListener("mousemove", moveCallback);
    window.addEventListener("mouseup", upCallback);

    return () => {
      window.removeEventListener("mouseup", upCallback);
      window.removeEventListener("mouseup", upCallback);
    };
  }, [onColumnResize, minColumnWidth]);

  return (
    <div
      id={id}
      className={clsx("data-table", className)}
      style={{
        ...style,
        cursor: dragState !== undefined ? "col-resize" : undefined,
      }}
    >
      <div
        className="data-table__table"
        ref={tableRef}
        style={{
          pointerEvents: dragState !== undefined ? "none" : undefined,
          userSelect: dragState !== undefined ? "none" : undefined,
          gridTemplateColumns: columns
            .map(
              (column, index) =>
                `${Math.max(column.width + (dragState?.index === index ? dragState.offset : 0), minColumnWidth)}px`,
            )
            .concat("1fr")
            .join(" "),
        }}
      >
        <div ref={headRef} className="data-table__head">
          <div className="data-table__row">
            {columns.map((column) => (
              <div key={column.key} className="data-table__cell">
                <div className="data-table__cell-content">{column.heading}</div>
              </div>
            ))}
            <div className="data-table__cell" />
          </div>
        </div>
        <div
          className="data-table__body"
          style={{
            flex: `0 0 ${rowHeight * items.length}px`,
            gridTemplateRows: `${rowHeight}px`,
          }}
        >
          {virtualizationParams &&
            items
              .slice(
                Math.max(virtualizationParams.index, 0),
                Math.max(virtualizationParams.index, 0) + virtualizationParams.count + 1,
              )
              .map((item, index) => {
                const key = getItemKey(item);
                return (
                  <div
                    key={key}
                    onClick={(event) => {
                      if (event.shiftKey) {
                        onSelection(
                          selection.some((k) => k === key) ? selection.filter((k) => k !== key) : [...selection, key],
                        );
                      } else {
                        onSelection([key]);
                      }
                    }}
                    onDblClick={
                      onActivation &&
                      (() => {
                        onSelection([key]);
                        onActivation(key);
                      })
                    }
                    className={clsx(
                      "data-table__row",
                      selection.some((id) => id === key) && "data-table__row--selected",
                    )}
                    style={{
                      position: "absolute",
                      top:
                        virtualizationParams.headHeight + (Math.max(virtualizationParams.index, 0) + index) * rowHeight,
                    }}
                  >
                    {columns.map((column) => (
                      <div key={column.key} className="data-table__cell">
                        <div className="data-table__cell-content">{column.formatter(item)}</div>
                      </div>
                    ))}
                    <div className="data-table__cell" />
                  </div>
                );
              })}
        </div>
        <div className="data-table__overlay">
          {virtualizationParams &&
            columns.map((column, index) => (
              <div
                key={column.key}
                className={clsx("data-table__grip", dragState?.index === index && "data-table__grip--gripping")}
                onMouseDown={(event) =>
                  setDragState({
                    index,
                    width: column.width,
                    start: event.pageX,
                    offset: 0,
                  })
                }
                style={{
                  height: virtualizationParams.headHeight + rowHeight * items.length,
                  left: getGripPosition(columns, index, dragState, minColumnWidth),
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default DataTable;
