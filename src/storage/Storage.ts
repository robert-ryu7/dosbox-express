abstract class Storage<Value, SetReturnType = void> {
  private subscribers = new Set<(data: Value) => void>();

  abstract get(): Value;
  abstract set(data: Value): SetReturnType;

  protected callSubscribers(data: Value) {
    this.subscribers.forEach((cb) => cb(data));
  }

  public subscribe(callback: (data: Value) => void) {
    this.subscribers.add(callback);

    return () => this.subscribers.delete(callback);
  }
}

export default Storage;
