/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Storage from "./Storage";

class LocalStorage<T> extends Storage<T | null> {
  private key: string;
  private snapshot: T | null;

  constructor(key: string) {
    super();
    this.key = key;

    const rawData = localStorage.getItem(this.key);
    this.snapshot = rawData ? JSON.parse(rawData) : null;

    window.addEventListener("storage", (event) => {
      if (event.key !== key || event.storageArea !== window.localStorage) return;

      this.snapshot = event.newValue === null ? null : JSON.parse(event.newValue);
      this.callSubscribers(this.snapshot);
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
    this.callSubscribers(this.snapshot);
  };
}

export default LocalStorage;
