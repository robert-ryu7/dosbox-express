import { StorageCallback, Storage } from "./types";

class LocalStorage<T> implements Storage<T> {
  private subscribers = new Set<StorageCallback<T>>();
  private key: string;
  private snapshot: T | null;

  constructor(key: string) {
    this.key = key;

    const rawData = localStorage.getItem(this.key);
    this.snapshot = rawData ? JSON.parse(rawData) : null;

    window.addEventListener("storage", (event) => {
      if (event.key !== key || event.storageArea !== window.localStorage)
        return;

      this.snapshot =
        event.newValue === null ? null : JSON.parse(event.newValue);
      this.subscribers.forEach((cb) => cb(this.snapshot));
    });
  }

  get = () => this.snapshot;

  set = (data: T | null) => {
    if (data === null) {
      localStorage.removeItem(this.key);
    } else {
      const rawData = JSON.stringify(data);
      localStorage.setItem(this.key, rawData);
    }
    this.snapshot = data;
    this.subscribers.forEach((cb) => cb(this.snapshot));
  };

  subscribe = (callback: StorageCallback<T>) => {
    this.subscribers.add(callback);

    return () => this.subscribers.delete(callback);
  };
}

export default LocalStorage;
