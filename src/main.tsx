import { PATH } from "./common/path";
import { render } from "preact";

import "./main.scss";

import App from "./app/App";

const app = document.getElementById("app") as HTMLElement;
Object.entries(PATH).forEach(([key, value]) => app.setAttribute(`data-path-${key}`, value));
render(<App />, app);
