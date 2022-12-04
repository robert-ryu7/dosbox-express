import { render } from "preact";
import App from "./app/App";

import "./main.scss";

render(<App />, document.getElementById("app") as HTMLElement);
