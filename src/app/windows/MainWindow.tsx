import { getName, getVersion } from "@tauri-apps/api/app";
import { arch } from "@tauri-apps/api/os";
import { useDebounce } from "@uidotdev/usehooks";
import { useLayoutEffect, useMemo, useState } from "preact/hooks";
import * as api from "../../common/api";
import secondsToHours from "../../common/secondsToHours";
import gamesChangedSubscription from "../../common/subscriptions/gamesChangedSubscription";
import Button from "../../components/Button";
import DataTable, { DataTableColumn } from "../../components/DataTable";
import Divider from "../../components/Divider";
import Error from "../../components/Error";
import Input from "../../components/Input";
import Outset from "../../components/Outset";
import useStorage from "../../hooks/useStorage";
import mainColumnsStorage from "../../storage/mainColumnsStorage";
import { Game } from "../../types";
import { useRunningGames } from "../contexts/runningGamesContext";
import AddGameDialog from "../dialogs/AddGameDialog";
import ConfigDialog from "../dialogs/ConfigDialog";
import EditGameDialog from "../dialogs/EditGameDialog";
import InfoDialog from "../dialogs/InfoDialog";
import SettingsDialog from "../dialogs/SettingsDialog";
import ToolsDialog from "../dialogs/ToolsDialog";

const getGameKey = (game: Game) => game.id;

const MainWindow = () => {
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const runningGames = useRunningGames();
  const [infoDialog, setInfoDialog] = useState<{ appName: string; appVersion: string; archName: string } | null>(null);
  const [settingsDialog, setSettingsDialog] = useState<{ themes: string[] } | null>(null);
  const [toolsDialog, setToolsDialog] = useState<boolean>(false);
  const [addGameDialog, setAddGameDialog] = useState<boolean>(false);
  const [editGameDialog, setEditGameDialog] = useState<Game | null>(null);
  const [configGameDialog, setConfigGameDialog] = useState<{ id: number; cfg: string; baseCfg: string } | null>(null);
  const [games, setGames] = useState<api.ExtendedGame[]>([]);
  const [selection, setSelection] = useState<number[]>([]);
  const columnsConfig = useStorage(mainColumnsStorage);
  const columns = useMemo<DataTableColumn<api.ExtendedGame>[]>(
    () => [
      { key: "id", heading: "#", width: 30, formatter: (game) => String(game.id), ...columnsConfig?.id },
      { key: "title", heading: "Title", width: 180, formatter: (game) => game.title, ...columnsConfig?.title },
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
      {
        key: "config_path",
        heading: "Config path",
        width: 320,
        formatter: (game) => game.config_path,
        ...columnsConfig?.config_path,
      },
      {
        key: "addons",
        heading: "Addons",
        width: 320,
        formatter: (game) => {
          if (game.addons.success) {
            return game.addons.data.map((addon) => addon.title).join(", ");
          }

          return <Error>Malformed data</Error>;
        },
        ...columnsConfig?.addons,
      },
    ],
    [columnsConfig],
  );

  useLayoutEffect(() => {
    const handler = async () => {
      try {
        const search = debouncedSearch === "" ? undefined : debouncedSearch.trim();
        const games = await api.getGames(search);
        setGames(games);
        const keys = games.map((game) => game.id);
        setSelection((s) => s.filter((key) => keys.includes(key)));
      } catch (error) {
        await api.error(error);
      }
    };

    void handler();

    return gamesChangedSubscription.subscribe(handler);
  }, [debouncedSearch]);

  const handleActivation = async (key: number) => {
    try {
      if (!runningGames.includes(key)) await api.runGame(key);
    } catch (error) {
      await api.error(error);
    }
  };

  const handleColumnResize = (index: number, size: number) => {
    mainColumnsStorage.set({
      ...columnsConfig,
      [columns[index].key]: { width: size },
    });
  };

  const handleDelete = async () => {
    try {
      const gamesToDelete = games.filter((game) => selection.includes(game.id));
      const confirmed = await api.deleteGames(gamesToDelete);
      if (confirmed) setSelection([]);
    } catch (error) {
      await api.error(error);
    }
  };

  const handleEdit = () => {
    const game = games.find((game) => game.id === selection[0]);
    if (game) setEditGameDialog(game);
  };

  const handleConfig = async () => {
    try {
      const id = selection[0];
      const cfg = await api.getConfig(id);
      const baseCfg = await api.getBaseConfig();
      setConfigGameDialog({ id, cfg, baseCfg });
    } catch (error) {
      await api.error(error);
    }
  };

  const handleStart = async () => {
    try {
      await api.runGame(selection[0]);
    } catch (error) {
      await api.error(error);
    }
  };

  const handleSettings = async () => {
    try {
      const themes = await api.getThemeFilenames();
      setSettingsDialog({ themes });
    } catch (error) {
      await api.error(error);
      setSettingsDialog({ themes: [] });
    }
  };

  const handleInfo = async () => {
    try {
      const appName = await getName();
      const appVersion = await getVersion();
      const archName = await arch();
      setInfoDialog({ appName, appVersion, archName });
    } catch (error) {
      await api.error(error);
    }
  };

  return (
    <>
      <Input
        id="search"
        componentId="main-search"
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
        onActivation={handleActivation}
        onColumnResize={handleColumnResize}
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
          <Button disabled={selection.length === 0} onClick={handleDelete}>
            Delete
          </Button>
          <Button disabled={selection.length !== 1} onClick={handleEdit}>
            Edit
          </Button>
          <Button disabled={selection.length !== 1} onClick={handleConfig}>
            Config
          </Button>
          <Button disabled={selection.length !== 1 || runningGames.includes(selection[0])} onClick={handleStart}>
            Start
          </Button>
          <Divider />
          <Button onClick={() => setAddGameDialog(true)}>Add</Button>
          <Button onClick={() => setToolsDialog(true)}>Tools</Button>
          <Button onClick={handleSettings}>Settings</Button>
          <Button onClick={handleInfo}>&#x2139;</Button>
        </div>
      </Outset>
      {settingsDialog && <SettingsDialog {...settingsDialog} onHide={() => setSettingsDialog(null)} />}
      {toolsDialog && <ToolsDialog onHide={() => setToolsDialog(false)} />}
      {addGameDialog && <AddGameDialog onHide={() => setAddGameDialog(false)} />}
      {editGameDialog && <EditGameDialog {...editGameDialog} onHide={() => setEditGameDialog(null)} />}
      {configGameDialog && <ConfigDialog {...configGameDialog} onHide={() => setConfigGameDialog(null)} />}
      {infoDialog && <InfoDialog {...infoDialog} onHide={() => setInfoDialog(null)} />}
    </>
  );
};

export default MainWindow;
