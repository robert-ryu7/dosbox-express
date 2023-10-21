import { listen } from "@tauri-apps/api/event";
import Subscription from "../Subscription";

const gamesChangedSubscription = new Subscription<void>("games_changed");

void listen("games_changed", () => gamesChangedSubscription.dispatch());

export default gamesChangedSubscription;
