type Handler<T> = (value: T) => void;

class Subscription<T> {
  private _lastValue?: T;
  private handlers: Handler<T>[];

  constructor(private name: string) {
    this.handlers = [];
  }

  public subscribe(handler: Handler<T>) {
    this.handlers.push(handler);

    return () => {
      this.handlers = this.handlers.filter((h) => h === handler);
    };
  }

  public dispatch(value: T) {
    this._lastValue = value;
    console.debug(
      `Subscription "${this.name}" is dispatching to ${this.handlers.length} handlers`
    );
    for (var i = 0; i < this.handlers.length; i++)
      this.handlers[i].apply(null, [value]);
  }

  public get lastValue() {
    return this._lastValue;
  }
}

export default Subscription;
