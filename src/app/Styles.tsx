import { Fragment } from "preact";
import { useLayoutEffect, useState } from "preact/hooks";
import * as api from "../common/api";
import { useSettings } from "./SettingsProvider";

function Styles() {
  const { settings } = useSettings();
  const [theme, setTheme] = useState<string>("");

  useLayoutEffect(() => {
    let mounted = true;

    if (settings.theme) {
      api
        .getTheme(settings.theme)
        .then((theme) => mounted && setTheme(theme))
        .catch(api.error);
    }

    return () => {
      mounted = false;
      setTheme("");
    };
  }, [settings.theme]);

  return (
    <Fragment>
      <style type="text/css">{theme}</style>
      <style type="text/css">{settings.inlineCss}</style>
    </Fragment>
  );
}

export default Styles;
