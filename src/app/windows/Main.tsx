import { useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";
import { message, confirm } from "@tauri-apps/api/dialog";

import gamesChangedSubscription from "../../subscription/gamesChangedSubscription";
import { Game, WindowProps } from "../../types";
import Button from "../../components/Button";
import useStorage from "../../hooks/useStorage";
import mainColumnsStorage from "../../storage/mainColumnsStorage";
import DataTable, { DataTableColumn } from "../../components/DataTable";
import AddGame from "../dialogs/AddGame";
import { useRunningGames } from "../providers/RunningGamesProvider";

const getGameKey = (game: Game) => game.id;

const Main = (_: WindowProps) => {
  const runningGames = useRunningGames();
  const addGameRef = useRef<HTMLDialogElement>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selection, setSelection] = useState<number[]>([]);
  const columnsConfig = useStorage(mainColumnsStorage);
  const columns = useMemo<DataTableColumn[]>(
    () => [
      { key: "id", heading: "#", width: 30, ...columnsConfig?.id },
      { key: "title", heading: "Title", width: 180, ...columnsConfig?.title },
      { key: "config_path", heading: "Config path", width: 320, ...columnsConfig?.config_path },
    ],
    [columnsConfig]
  );

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
          <Button onClick={() => addGameRef.current?.showModal?.()}>Add</Button>
          <Button
            disabled={selection.length !== 1 || runningGames.includes(selection[0])}
            onClick={async () => {
              try {
                await invoke("start_game", { gameId: selection[0] });
              } catch (err: unknown) {
                message(String(err), { type: "error" });
              }
            }}
          >
            Start
          </Button>
        </div>
      </div>
      <AddGame dialogRef={addGameRef} />
    </>
  );
};

export default Main;
