import { listen } from "@tauri-apps/api/event";
import Subscription from "../Subscription";

const runningGamesChangedSubscription = new Subscription<number[]>("running_games_changed");

void listen<number[]>("running_games_changed", (event) => runningGamesChangedSubscription.dispatch(event.payload));

export default runningGamesChangedSubscription;
