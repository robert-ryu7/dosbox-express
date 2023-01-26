import { render } from "preact";

import "./main.scss";
import "./common/yup";

import App from "./app/App";

render(<App />, document.getElementById("app") as HTMLElement);
