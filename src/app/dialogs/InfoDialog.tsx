import { REPO_URL, TAURI_URL } from "../../common/constants";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Link from "../../components/Link";
import Outset from "../../components/Outset";
import OutsetHead from "../../components/OutsetHead";

type InfoDialogProps = {
  appName: string;
  appVersion: string;
  archName: string;
  onHide: () => void;
};

const InfoDialog = (props: InfoDialogProps) => {
  const baseUrl = `${REPO_URL}/blob/v${props.appVersion}`;

  return (
    <Dialog show onHide={props.onHide}>
      <div style="width: 540px; display: flex; flex-direction: column;">
        <Outset style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 8px;">
          <OutsetHead>About DOSBox Express</OutsetHead>
          <div style="display: flex; flex-direction: column; gap: 8px; text-align: center; padding: 16px;">
            <div>
              Version {props.appVersion} ({props.archName})
            </div>
            <div>Copyright (c) 2023 SolidDEV Robert Balcerowicz</div>
            <div>
              Built using <Link href={TAURI_URL}>Tauri</Link>
            </div>
            <div>
              <Link href={`${baseUrl}/README.md`}>Readme</Link>
              {" | "}
              <Link href={`${baseUrl}/LICENSE.txt`}>License</Link>
            </div>
          </div>
        </Outset>
        <Outset style="flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 2px;">
          <Button onClick={props.onHide}>Close</Button>
        </Outset>
      </div>
    </Dialog>
  );
};

export default InfoDialog;
