import { listen } from "@tauri-apps/api/event";
import { Setting } from "../types";
import Subscription from "./Subscription";

const settingsChangedSubscription = new Subscription<Setting[]>("settings_changed");

listen<Setting[]>("settings_changed", (event) => {
  settingsChangedSubscription.dispatch(event.payload);
});

export default settingsChangedSubscription;
