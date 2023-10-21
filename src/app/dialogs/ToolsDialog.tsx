import { useState } from "preact/hooks";
import * as api from "../../common/api";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Input from "../../components/Input";
import Inset from "../../components/Inset";
import Outset from "../../components/Outset";
import OutsetHead from "../../components/OutsetHead";
import { useRunner } from "../contexts/runnerContext";

type ToolsDialogProps = {
  onHide: () => void;
};

const ToolsDialog = (props: ToolsDialogProps) => {
  const [running, setRunning] = useRunner();
  const [params, setParams] = useState<string>("");
  const [lastRunOutput, setLastRunOutput] = useState<string | null>(null);

  const handleParamsChange = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    setParams(event.currentTarget.value);
  };

  const handleRun = async () => {
    try {
      setRunning(true);
      const runOutput = await api.runDosbox(params);
      setLastRunOutput(runOutput);
    } catch (error) {
      await api.error(error);
    } finally {
      setRunning(false);
    }
  };

  const handleOpenBaseConfig = async () => {
    try {
      await api.openBaseConfig();
    } catch (error) {
      await api.error(error);
    }
  };

  return (
    <Dialog show onHide={props.onHide}>
      <div style="width: 540px; display: flex; flex-direction: column;">
        <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 8px;">
          <OutsetHead>DOSBox runner</OutsetHead>
          <Input
            inputId="params"
            label="Command line parameters (optional)"
            placeholder="--list-glshaders"
            value={params}
            onChange={handleParamsChange}
            after={
              <Button disabled={running} onClick={handleRun}>
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
            <Button onClick={handleOpenBaseConfig}>Open base config</Button>
          </div>
        </Outset>
        <Outset style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
          <Button onClick={props.onHide}>Close</Button>
        </Outset>
      </div>
    </Dialog>
  );
};

export default ToolsDialog;
