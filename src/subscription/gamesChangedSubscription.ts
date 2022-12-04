import { listen } from "@tauri-apps/api/event";
import Subscription from "./Subscription";

const gamesChangedSubscription = new Subscription<void>("games_changed");

listen("games_changed", (_event) => {
  // event.event is the event name (useful if you want to use a single callback fn for multiple event types)
  // event.payload is the payload object
  gamesChangedSubscription.dispatch();
});

export default gamesChangedSubscription;
