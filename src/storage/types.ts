export type StorageCallback<T> = (data: T | null) => void;

export interface Storage<T> {
  get(): T | null;
  set(data: T | null): void;
  subscribe(callback: StorageCallback<T>): () => void;
}
