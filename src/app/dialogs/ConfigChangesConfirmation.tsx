import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Outset from "../../components/Outset";
import { diffLines } from "diff";
import { useMemo } from "preact/hooks";
import Inset from "../../components/Inset";
import OutsetHead from "../../components/OutsetHead";

type ConfigChangesConfirmationProps = {
  left: string;
  right: string;
  onHide: () => void;
  onConfirm: () => void;
};

const ConfigChangesConfirmation = (props: ConfigChangesConfirmationProps) => {
  const diff = useMemo(() => diffLines(props.left, props.right), [props.left, props.right]);

  return (
    <Dialog show onHide={props.onHide}>
      <div style="width: calc(100vw - 64px); height: calc(100vh - 64px); display: flex; flex-direction: column;">
        <Outset style="flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden; gap: 4px;">
          <OutsetHead>Confirm changes</OutsetHead>
          <Inset style="flex: 1 1 auto; overflow: auto; display: grid; white-space: pre;">
            {diff.map((part, index) => (
              <div
                key={index}
                style={{
                  color: part.added ? "#000" : part.removed ? "#000" : "var(--color-front-alt)",
                  background: part.added ? "#4c0" : part.removed ? "#c40" : "transparent",
                }}
              >
                {part.value}
              </div>
            ))}
          </Inset>
        </Outset>
        <Outset style="flex: 0 0 auto; display: flex; gap: 2px;">
          <div
            style={{
              padding: "0 8px",
              flex: "1 1 auto",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              alignSelf: "center",
            }}
          >
            {`${diff.filter((part) => part.added).reduce((acc, part) => acc + (part.count ?? 0), 0)} line(s) added`}
            {", "}
            {`${diff.filter((part) => part.removed).reduce((acc, part) => acc + (part.count ?? 0), 0)} line(s) removed`}
          </div>
          <div style="flex: 0 0 auto; display: flex; gap: 2px;">
            <Button type="button" onClick={() => props.onHide()}>
              Cancel
            </Button>
            <Button type="button" onClick={props.onConfirm}>
              OK
            </Button>
          </div>
        </Outset>
      </div>
    </Dialog>
  );
};

export default ConfigChangesConfirmation;
