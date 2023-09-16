import { useEffect, useState } from "preact/hooks";
import Storage from "../storage/Storage";

function useStorage<T>(storage: Storage<T>) {
  const [data, setData] = useState<T>(storage.get());

  useEffect(() => storage.subscribe(setData), [storage]);

  return data;
}

export default useStorage;
