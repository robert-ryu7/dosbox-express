import { useLayoutEffect, useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./app.css";
import { gamesChangedSubscription } from "./subscriptions";

export function App<FC>() {
  const [games, setGames] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  const createGame = async () => {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    await invoke("create_game", { title, configPath: "./" });
  };

  useLayoutEffect(() => {
    const handler = async () => {
      setGames(await invoke("get_games"));
    };

    handler();

    return gamesChangedSubscription.subscribe(handler);
  }, []);

  return (
    <div class="container">
      <h1>Welcome to Tauri!</h1>
      <div class="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" class="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" class="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://preactjs.com" target="_blank">
          <img src={preactLogo} class="logo preact" alt="Preact logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and Preact logos to learn more.</p>

      <div class="row">
        <div>
          <input
            id="create-game-input"
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="Enter game title..."
          />
          <button type="button" onClick={() => createGame()}>
            Create Game
          </button>
        </div>
      </div>
      <pre>{games ? JSON.stringify(games, null, 2) : "\u00A0"}</pre>
    </div>
  );
}
