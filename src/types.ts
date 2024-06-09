export type Settings = {
  theme: string;
  inlineCss: string;
  useRelativeConfigPathsWhenPossible: boolean;
  confirmConfigChanges: boolean;
  saveEmptyConfigValues: "none" | "settings" | "all";
  showBaseCategoryCommentsByDefault: "always" | "never" | "auto";
};

export type Game = { id: number; title: string; config_path: string; run_time: number; raw_addons: string };

export type NewGame = { title: string; config_path: string };

export type AppError =
  | ({
      type: "IO";
    } & {
      message: string;
    })
  | ({
      type: "Database";
    } & {
      message: string;
    })
  | ({
      type: "Tauri";
    } & {
      message: string;
    })
  | ({
      type: "TauriApi";
    } & {
      message: string;
    })
  | ({
      type: "Poison";
    } & {
      message: string;
    })
  | ({
      type: "DatabaseConnection";
    } & {
      message: string;
    })
  | {
      type: "DOSBoxExeNotFound";
    }
  | {
      type: "InvalidConfigPath";
    }
  | {
      type: "FailedResolvingMountPath";
    }
  | {
      type: "FailedToCalculateGameRunTime";
    }
  | ({
      type: "FailedToRemoveGameFromRunningGames";
    } & {
      id: number;
    })
  | ({
      type: "GameAlreadyStarted";
    } & {
      id: number;
    })
  | ({
      type: "DOSBoxRunFailed";
    } & {
      exit_status: string;
      stderr: string | null;
    })
  | ({
      type: "GameRunFailed";
    } & {
      exit_status: string;
      stderr: string | null;
    });
