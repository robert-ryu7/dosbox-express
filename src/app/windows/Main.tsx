import Button from "../../components/Button";
import DataTable, { DataTableColumn } from "../../components/DataTable";
import Divider from "../../components/Divider";
import Input from "../../components/Input";
import Outset from "../../components/Outset";
import fetchGameConfig from "../../fetchers/fetchGameConfig";
import useStorage from "../../hooks/useStorage";
import mainColumnsStorage from "../../storage/mainColumnsStorage";
import gamesChangedSubscription from "../../subscription/gamesChangedSubscription";
import { Game } from "../../types";
import { useRunningGames } from "../contexts/runningGamesContext";
import AddGame from "../dialogs/AddGame";
import EditGame from "../dialogs/EditGame";
import ConfigGame from "../dialogs/ConfigGame";
import Settings from "../dialogs/Settings";
import Tools from "../dialogs/Tools";

import { invoke } from "@tauri-apps/api";
import { confirm } from "@tauri-apps/api/dialog";
import { useLayoutEffect, useMemo, useState } from "preact/hooks";
import { useDebounce } from "@uidotdev/usehooks";
import attempt from "../../common/attempt";
import { BaseDirectory, readTextFile } from "@tauri-apps/api/fs";
import secondsToHours from "../../common/secondsToHours";

const getGameKey = (game: Game) => game.id;

const Main = () => {
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const runningGames = useRunningGames();
  const [settingsDialog, setSettingsDialog] = useState<boolean>(false);
  const [toolsDialog, setToolsDialog] = useState<boolean>(false);
  const [addGameDialog, setAddGameDialog] = useState<boolean>(false);
  const [editGameDialog, setEditGameDialog] = useState<Game | null>(null);
  const [configGameDialog, setConfigGameDialog] = useState<{ id: number; cfg: string; baseCfg: string } | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selection, setSelection] = useState<number[]>([]);
  const columnsConfig = useStorage(mainColumnsStorage);
  const columns = useMemo<DataTableColumn<Game>[]>(
    () => [
      { key: "id", heading: "#", width: 30, ...columnsConfig?.id },
      { key: "title", heading: "Title", width: 180, ...columnsConfig?.title },
      {
        key: "run_time",
        heading: "Run time",
        width: 90,
        formatter: (game) => {
          const duration = secondsToHours(game.run_time);
          return `${duration.hours}h ${duration.minutes}m ${duration.seconds}s`;
        },
        ...columnsConfig?.run_time,
      },
      { key: "config_path", heading: "Config path", width: 320, ...columnsConfig?.config_path },
    ],
    [columnsConfig]
  );

  useLayoutEffect(() => {
    const handler = async () => {
      const games = await invoke<Game[]>("get_games", {
        search: debouncedSearch === "" ? undefined : debouncedSearch.trim(),
      });
      setGames(games);
      const keys = games.map((game) => game.id);
      setSelection((s) => s.filter((key) => keys.includes(key)));
    };

    handler();

    return gamesChangedSubscription.subscribe(handler);
  }, [debouncedSearch]);

  return (
    <>
      <Input
        id="main-search"
        inputId="search"
        placeholder="Search by title"
        padding="big"
        border="none"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        autoFocus
      />
      <Outset id="main-search-separator" />
      <DataTable
        id="main-data-table"
        columns={columns}
        items={games}
        getItemKey={getGameKey}
        rowHeight={24}
        minColumnWidth={24}
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
      <Outset id="main-toolbar-separator" />
      <Outset id="main-toolbar">
        <div id="main-toolbar__summary">
          {selection.length === 0 && "No selection"}
          {selection.length === 1 &&
            `Selected "${games.find((game) => game.id === selection[0])?.title ?? selection[0]}"`}
          {selection.length > 1 && `Selected ${selection.length} entries`}
        </div>
        <div id="main-toolbar__actions">
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
              if (game) setEditGameDialog(game);
            }}
          >
            Edit
          </Button>
          <Button
            disabled={selection.length !== 1}
            onClick={attempt(async () => {
              const id = selection[0];
              const cfg = await fetchGameConfig(id);
              const baseCfg = await readTextFile("base.conf", { dir: BaseDirectory.Resource });
              setConfigGameDialog({ id, cfg, baseCfg });
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
          <Button onClick={() => setAddGameDialog(true)}>Add</Button>
          <Button onClick={() => setToolsDialog(true)}>Tools</Button>
          <Button onClick={() => setSettingsDialog(true)}>Settings</Button>
        </div>
      </Outset>
      {settingsDialog && <Settings onHide={() => setSettingsDialog(false)} />}
      {toolsDialog && <Tools onHide={() => setToolsDialog(false)} />}
      {addGameDialog && <AddGame onHide={() => setAddGameDialog(false)} />}
      {editGameDialog && <EditGame {...editGameDialog} onHide={() => setEditGameDialog(null)} />}
      {configGameDialog && <ConfigGame {...configGameDialog} onHide={() => setConfigGameDialog(null)} />}
    </>
  );
};

export default Main;
