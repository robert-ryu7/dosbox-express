import { message } from "@tauri-apps/api/dialog";

type AttemptResult = "fulfilled" | "rejected";

function attempt<T extends (...args: any) => Promise<any>>(tryFn: T, finallyFn?: (result: AttemptResult) => void) {
  return async (...args: Parameters<T>) => {
    let result: AttemptResult = "fulfilled";

    try {
      return await tryFn.call(null, ...args);
    } catch (err: unknown) {
      result = "rejected";
      message(String(err), { type: "error" });
    } finally {
      finallyFn?.(result);
    }
  };
}

export default attempt;
