import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Input from "../../components/Input";
import Inset from "../../components/Inset";
import Outset from "../../components/Outset";
import OutsetHead from "../../components/OutsetHead";
import { useRunner } from "../contexts/runnerContext";

import { resolveResource } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/shell";
import { useState } from "preact/hooks";
import attempt from "../../common/attempt";

type ToolsProps = {
  onHide: () => void;
};

const Tools = (props: ToolsProps) => {
  const [running, setRunning] = useRunner();
  const [params, setParams] = useState<string>("");
  const [lastRunOutput, setLastRunOutput] = useState<string | null>(null);

  return (
    <Dialog show onHide={props.onHide}>
      <div style="width: 540px; display: flex; flex-direction: column;">
        <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 8px;">
          <OutsetHead>DOSBox runner</OutsetHead>
          <Input
            inputId="arguments"
            label="Command line parameters (optional)"
            placeholder="--list-glshaders"
            value={params}
            onChange={(event) => {
              if (event.target instanceof HTMLInputElement) setParams(event.target.value);
            }}
            after={
              <Button
                disabled={running}
                onClick={attempt(
                  async () => {
                    setRunning(true);
                    const runOutput = await invoke<string>("run_dosbox", { params });
                    setLastRunOutput(runOutput);
                  },
                  () => setRunning(false)
                )}
              >
                Run DOSBox
              </Button>
            }
          />
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div>Last run output</div>
            <Inset style="height: 200px;">{lastRunOutput}</Inset>
          </div>
        </Outset>
        <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
          <OutsetHead>Miscellaneous</OutsetHead>
          <div style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
            <Button
              onClick={attempt(async () => {
                const path = await resolveResource("base.conf");
                await open(path);
              })}
            >
              Open base config
            </Button>
          </div>
        </Outset>
        <Outset style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
          <Button type="button" onClick={() => props.onHide()}>
            Close
          </Button>
        </Outset>
      </div>
    </Dialog>
  );
};

export default Tools;
