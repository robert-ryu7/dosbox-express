import { useEffect, useState } from "preact/hooks";
import { Storage } from "../storage/types";

function useStorage<T>(storage: Storage<T>) {
  const [data, setData] = useState<T | null>(storage.get());

  useEffect(() => storage.subscribe(setData), [storage]);

  return data;
}

export default useStorage;
