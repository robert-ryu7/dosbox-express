import { listen } from "@tauri-apps/api/event";
import Subscription from "../Subscription";

const errorSubscription = new Subscription<unknown>("error");

void listen<unknown>("error", (event) => errorSubscription.dispatch(event.payload));

export default errorSubscription;
