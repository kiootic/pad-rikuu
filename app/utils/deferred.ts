import { observable, action, computed } from "mobx";

export const enum DeferredStatus {
  Pending = 'pending',
  Fulfilled = 'fulfilled',
  Rejected = 'rejected'
}

export class Deferred<T> {
  public readonly promise: Promise<T>;
  private _resolve: (value: T | PromiseLike<T>) => void;
  private _reject: (reason: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  @observable
  private _status = DeferredStatus.Pending;
  @observable.ref
  private _value: T;

  @computed
  public get status() { return this._status; }
  @computed
  public get result() {
    if (!this.fulfilled)
      throw new Error('result is not available');
    return this._value;
  }

  @computed
  public get fulfilled() { return this._status == DeferredStatus.Fulfilled; }

  @action.bound
  public resolve(value: T) {
    this._status = DeferredStatus.Fulfilled;
    this._value = value;
    return this._resolve(value);
  }
  @action.bound
  public reject(reason: any) {
    this._status = DeferredStatus.Rejected;
    return this._reject(reason);
  }

  public attach(promise: PromiseLike<T>) {
    promise.then(this.resolve, this.reject);
  }

  public static from<T>(promise: PromiseLike<T>) {
    const deferred = new Deferred<T>();
    deferred.attach(promise);
    return deferred;
  }

  public static resolve<T>(value: T) {
    const deferred = new Deferred<T>();
    deferred.resolve(value);
    return deferred;
  }
}