import { useLayoutEffect, useMemo, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";
import { WebviewWindow } from "@tauri-apps/api/window";
import { confirm } from "@tauri-apps/api/dialog";

import gamesChangedSubscription from "../subscription/gamesChangedSubscription";
import { Game, WindowProps } from "../types";
import Button from "../components/Button";
import useStorage from "../hooks/useStorage";
import mainColumnsStorage from "../storage/mainColumnsStorage";
import DataTable, { DataTableColumn } from "../components/DataTable";

const getGameKey = (game: Game) => game.id;

const Main = (props: WindowProps) => {
  const [games, setGames] = useState<Game[]>([]);
  const [selection, setSelection] = useState<number[]>([]);
  const columnsConfig = useStorage(mainColumnsStorage);
  const columns = useMemo<DataTableColumn[]>(
    () => [
      { key: "id", heading: "#", width: 50, ...columnsConfig?.id },
      { key: "title", heading: "Title", width: 150, ...columnsConfig?.title },
      { key: "config_path", heading: "Config path", width: 425, ...columnsConfig?.config_path },
    ],
    [columnsConfig]
  );

  const addGame = async () => {
    const webview = new WebviewWindow("addGame", {
      title: "DOSBox Express - Add Game",
      minWidth: 480,
      minHeight: 160,
      width: 480,
      height: 160,
      url: "add-game",
    });
  };

  useLayoutEffect(() => {
    const handler = async () => {
      setGames(await invoke("get_games"));
    };

    handler();

    return gamesChangedSubscription.subscribe(handler);
  }, []);

  return (
    <>
      <DataTable
        columns={columns}
        items={games}
        getItemKey={getGameKey}
        rowHeight={24}
        minColumnWidth={24}
        style={{ flex: "1 1 auto" }}
        overscan={2}
        selection={selection}
        onSelection={setSelection}
        onColumnResize={(index, size) => {
          mainColumnsStorage.set({
            ...columnsConfig,
            [columns[index].key]: { width: size },
          });
        }}
      />
      <div
        className="outset"
        style="flex: 0 0 auto; display: flex; gap: 2px; padding: 4px; border-width: var(--border-width) 0 0 0;"
      >
        <div
          style={{
            padding: "0 8px",
            flex: "1 1 auto",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            alignSelf: "center",
          }}
        >
          {selection.length === 0 && "No selection"}
          {selection.length === 1 &&
            `Selected "${games.find((game) => game.id === selection[0])?.title ?? selection[0]}"`}
          {selection.length > 1 && `Selected ${selection.length} entries`}
        </div>
        <div style="flex: 0 0 auto; display: flex; gap: 2px;">
          <Button
            disabled={selection.length === 0}
            onClick={async () => {
              const message =
                selection.length > 1
                  ? `Do you want to permanently delete ${selection.length} selected entries?`
                  : `Do you want to permanently delete ${
                      games.find((game) => game.id === selection[0])?.title ?? selection[0]
                    }?`;
              const confirmed = await confirm(message, { title: "Delete selected entries", type: "warning" });
              if (confirmed) {
                invoke("delete_games", { ids: selection });
                setSelection([]);
              }
            }}
          >
            Delete
          </Button>
          <Button disabled={selection.length !== 1}>Edit</Button>
          <Button onClick={() => addGame()}>Add</Button>
        </div>
      </div>
    </>
  );
};

export default Main;
