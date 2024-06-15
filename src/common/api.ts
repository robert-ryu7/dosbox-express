import { invoke } from "@tauri-apps/api";
import { confirm, message, open } from "@tauri-apps/api/dialog";
import { extname } from "@tauri-apps/api/path";
import { exit } from "@tauri-apps/api/process";
import * as Yup from "yup";
import { AppError, Game } from "../types";

const APP_ERROR_SCHEMA: Yup.ObjectSchema<{ type: string }> = Yup.object({
  type: Yup.string().required(),
});

export const ADDON_SCHEMA = Yup.object({
  type: Yup.string().oneOf(["override"]).required(),
  title: Yup.string().required(),
  config_path: Yup.string().required(),
});

export type Addon = Yup.InferType<typeof ADDON_SCHEMA>;

export type ExtendedGame = Game & { addons: Addon[] | null };

export { confirm, exit };

export const isAppError = (error: unknown): error is AppError => APP_ERROR_SCHEMA.isType(error);

export const error = async (error: unknown) => {
  let msg = String(error);
  if (isAppError(error)) {
    switch (error.type) {
      case "IO":
      case "Database":
      case "Tauri":
      case "TauriApi":
      case "Poison":
      case "DatabaseConnection":
        msg = error.message;
        break;
      case "DOSBoxExeNotFound":
        msg = "DOSBox executable not found.";
        break;
      case "InvalidConfigPath":
        msg = "Given config path is invalid.";
        break;
      case "FailedResolvingMountPath":
        msg = "Failed resolving mount path.";
        break;
      case "FailedToCalculateGameRunTime":
        msg = "Failed to calculate run time.";
        break;
      case "FailedToRemoveGameFromRunningGames":
        msg = `Failed to remove "${error.id}" from running games collection.`;
        break;
      case "GameAlreadyStarted":
        msg = `Game with id "${error.id}" has already started.`;
        break;
      case "DOSBoxRunFailed": {
        msg = `DOSBox run finished with status "${error.exit_status}".`;
        if (error.stderr) {
          msg += `\n\nCaptured output:\n${error.stderr}`;
        }
        break;
      }
      case "GameRunFailed": {
        msg = `Game run finished with status "${error.exit_status}".`;
        if (error.stderr) {
          msg += `\n\nCaptured output:\n${error.stderr}`;
        }
        break;
      }
    }
  }

  return message(msg, { type: "error" });
};

export const getRunningGames = () => invoke<number[]>("get_running_games");

export const createGame = (title: string, configPath: string) => invoke("create_game", { title, configPath });

export const getConfig = (id: number) => invoke<string>("get_config", { id });

export const getBaseConfig = () => invoke<string>("get_base_config");

export const getGames = async (search?: string): Promise<ExtendedGame[]> => {
  const games = await invoke<Game[]>("get_games", { search });

  return games.map((game, index) => {
    let addons: Addon[] | null;
    try {
      addons = Yup.array(ADDON_SCHEMA).json().required().validateSync(game.raw_addons);
    } catch (cause) {
      const error = new Error(`Validation failed for Game#${index + 1}`);
      error.cause = cause;
      console.error(error);
      addons = null;
    }

    return { ...game, addons };
  });
};

export const getSettings = () => invoke<string | null>("get_settings");

export const getTheme = (filename: string) => invoke<string>("get_theme", { filename });

export const getThemeFilenames = () => invoke<string[]>("get_theme_filenames");

export const openBaseConfig = async () => invoke<void>("open_base_config");

export const runDosbox = (params: string) => invoke<string>("run_dosbox", { params });

export const setSettings = (text: string) => invoke("set_settings", { text });

export const runGame = (id: number) => invoke("run_game", { id });

export const deleteGames = async (games: Game[]) => {
  const message =
    games.length === 1
      ? `Do you want to permanently delete ${games[0].title}?`
      : `Do you want to permanently delete ${games.length} selected entries?`;
  const confirmed = await confirm(message, { title: "Delete selected entries", type: "warning" });
  if (confirmed) {
    await invoke("delete_games", { ids: games.map((game) => game.id) });
    return true;
  }

  return false;
};

type UpdateGamePayload = { id: number; title: string; configPath: string; resetRunTime: boolean };

export const updateGame = (payload: UpdateGamePayload) => invoke("update_game", payload);

export const updateGameConfig = (id: number, config: string) => invoke("update_game_config", { id, config });

export const selectConfigPath = async (useRelativeConfigPathsWhenPossible: boolean) => {
  let path = await open({
    defaultPath: await invoke<string>("get_games_directory_path"),
    multiple: false,
    filters: [
      {
        name: "All files",
        extensions: ["*"],
      },
      {
        name: "DOSBox configuration file",
        extensions: ["conf"],
      },
      {
        name: "MS-DOS executable file",
        extensions: ["EXE", "COM", "exe", "com"],
      },
    ],
  });
  if (Array.isArray(path)) path = null;

  if (path !== null) {
    switch (await extname(path)) {
      case "EXE":
      case "COM":
      case "exe":
      case "com": {
        if (
          await confirm(
            "You have selected an executable file, do you want to generate a basic DOSBox configuration for it if it doesn't exist?",
            {
              title: "Generate configuration file",
              type: "warning",
            },
          )
        ) {
          path = await invoke<string | null>("generate_game_config", { executablePath: path });
        } else {
          path = null;
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  if (path !== null && useRelativeConfigPathsWhenPossible) {
    const relativePath = await invoke<string | null>("make_relative_path", { path });
    path = relativePath;
  }

  return path;
};
