import { Fragment } from "preact";
import { useState, useLayoutEffect } from "preact/hooks";
import { BaseDirectory, readTextFile } from "@tauri-apps/api/fs";
import attempt from "../common/attempt";
import { useSettings } from "./SettingsProvider";

function Styles() {
  const { settings } = useSettings();
  const [theme, setTheme] = useState<string>("");

  useLayoutEffect(() => {
    let mounted = true;

    if (settings.theme) {
      attempt(async () => {
        const theme = await readTextFile(`themes/${settings.theme}`, { dir: BaseDirectory.Resource });
        if (mounted) setTheme(theme);
      })();
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
