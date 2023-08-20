import Button from "../../components/Button";
import DataTable, { DataTableColumn } from "../../components/DataTable";
import Divider from "../../components/Divider";
import Input from "../../components/Input";
import Outset from "../../components/Outset";
import fetchBaseConfig from "../../fetchers/fetchBaseConfig";
import fetchGameConfig from "../../fetchers/fetchGameConfig";
import useStorage from "../../hooks/useStorage";
import mainColumnsStorage from "../../storage/mainColumnsStorage";
import gamesChangedSubscription from "../../subscription/gamesChangedSubscription";
import { Game, WindowProps } from "../../types";
import { useRunningGames } from "../contexts/runningGamesContext";
import AddOrEditGame from "../dialogs/AddOrEditGame";
import ConfigureGame from "../dialogs/ConfigureGame";
import Settings from "../dialogs/Settings";
import Tools from "../dialogs/Tools";

import { invoke } from "@tauri-apps/api";
import { confirm } from "@tauri-apps/api/dialog";
import { useLayoutEffect, useMemo, useState } from "preact/hooks";
import { useDebounce } from "@uidotdev/usehooks";
import attempt from "../../common/attempt";

const getGameKey = (game: Game) => game.id;

const Main = (_: WindowProps) => {
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const runningGames = useRunningGames();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showTools, setShowTools] = useState<boolean>(false);
  const [gameDialogTarget, setGameDialogTarget] = useState<[number | null, Omit<Game, "id">] | null>(null);
  const [configureGameDialogTarget, setConfigureGameDialogTarget] = useState<{
    id: number;
    baseConfig: string;
    gameConfig: string;
  } | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selection, setSelection] = useState<number[]>([]);
  const columnsConfig = useStorage(mainColumnsStorage);
  const columns = useMemo<DataTableColumn[]>(
    () => [
      { key: "id", heading: "#", width: 30, ...columnsConfig?.id },
      { key: "title", heading: "Title", width: 180, ...columnsConfig?.title },
      { key: "config_path", heading: "Config path", width: 570, ...columnsConfig?.config_path },
    ],
    [columnsConfig]
  );

  useLayoutEffect(() => {
    const handler = async () => {
      setGames(await invoke("get_games", { search: debouncedSearch === "" ? undefined : debouncedSearch.trim() }));
    };

    handler();

    return gamesChangedSubscription.subscribe(handler);
  }, [debouncedSearch]);

  return (
    <>
      <Input
        id="search"
        placeholder="Search by title"
        style="flex: 0 0 auto;"
        padding="big"
        border="none"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />
      <Outset style="flex: 0 0 auto; border-width: 2px 0; padding: 0;" />
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
        onActivation={attempt(async (key) => {
          if (!runningGames.includes(key)) await invoke("run_game", { id: key });
        })}
        onColumnResize={(index, size) => {
          mainColumnsStorage.set({
            ...columnsConfig,
            [columns[index].key]: { width: size },
          });
        }}
      />
      <Outset style="flex: 0 0 auto; display: flex; gap: 2px; border-width: 2px 0 0 0;">
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
            onClick={attempt(async () => {
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
            })}
          >
            Delete
          </Button>
          <Button
            disabled={selection.length !== 1}
            onClick={() => {
              const game = games.find((game) => game.id === selection[0]);
              if (game) setGameDialogTarget([game.id, game]);
            }}
          >
            Edit
          </Button>
          <Button
            disabled={selection.length !== 1}
            onClick={attempt(async () => {
              const id = selection[0];
              const baseConfig = await fetchBaseConfig();
              const gameConfig = await fetchGameConfig(id);
              setConfigureGameDialogTarget({ id, baseConfig, gameConfig });
            })}
          >
            Config
          </Button>
          <Button
            disabled={selection.length !== 1 || runningGames.includes(selection[0])}
            onClick={attempt(() => invoke("run_game", { id: selection[0] }))}
          >
            Start
          </Button>
          <Divider />
          <Button onClick={() => setGameDialogTarget([null, { title: "", config_path: "" }])}>Add</Button>
          <Button onClick={() => setShowTools(true)}>Tools</Button>
          <Button onClick={() => setShowSettings(true)}>Settings</Button>
        </div>
      </Outset>
      {showSettings && <Settings show onHide={() => setShowSettings(false)} />}
      {showTools && <Tools show onHide={() => setShowTools(false)} />}
      {gameDialogTarget && (
        <AddOrEditGame
          id={gameDialogTarget[0]}
          initialValues={gameDialogTarget[1]}
          onHide={() => setGameDialogTarget(null)}
        />
      )}
      {configureGameDialogTarget && (
        <ConfigureGame {...configureGameDialogTarget} onHide={() => setConfigureGameDialogTarget(null)} />
      )}
    </>
  );
};

export default Main;
