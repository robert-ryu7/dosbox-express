import Dialog from "../../components/Dialog";
import Outset from "../../components/Outset";
import Button from "../../components/Button";
import Input from "../../components/Input";
import OutsetHead from "../../components/OutsetHead";
import { message } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api";
import { useState } from "preact/hooks";
import Inset from "../../components/Inset";
import { useRunner } from "../contexts/runnerContext";

type ToolsProps = {
  show: boolean;
  onHide: () => void;
};

const Tools = (props: ToolsProps) => {
  const [running, setRunning] = useRunner();
  const [params, setParams] = useState<string>("");
  const [lastRunOutput, setLastRunOutput] = useState<string | null>(null);

  return (
    <Dialog show={props.show} onHide={props.onHide}>
      <div style="width: 540px; display: flex; flex-direction: column;">
        <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px;">
          <OutsetHead>DOSBox runner</OutsetHead>
          <Input
            id="arguments"
            label="Command line parameters (optional)"
            placeholder="--list-glshaders"
            value={params}
            onChange={(event) => {
              if (event.target instanceof HTMLInputElement) setParams(event.target.value);
            }}
          />
          <Button
            disabled={running}
            onClick={async () => {
              if (running) return;

              try {
                setRunning(true);
                const runOutput = await invoke<string>("run_dosbox", { params });
                setLastRunOutput(runOutput);
              } catch (err: unknown) {
                message(String(err), { type: "error" });
              } finally {
                setRunning(false);
              }
            }}
          >
            Run DOSBox
          </Button>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div>Last run output</div>
            <Inset style="height: 240px;">{lastRunOutput}</Inset>
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
