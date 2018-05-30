import { observable } from 'mobx';
import { createTransformer } from 'mobx-utils';

export function store(target: object, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    configurable: true,
    get(this: any) {
      return this.props.store;
    }
  });
}

export function uiState<T>(key: string, defaultFn: () => T) {
  return (target: object, propertyKey: string) => {
    Object.defineProperty(target, propertyKey, {
      configurable: true,
      get(this: any) {
        return this.props.store.ui[key] || (this.props.store.ui[key] = observable(defaultFn()));
      }
    });
  };
}

function replaceValueDecorator(key: string, replacer: (self: any) => any): PropertyDescriptor {
  let replacing = false;
  return {
    configurable: true,
    get() {
      if (replacing) return;
      const value = replacer(this);
      replacing = true;
      Object.defineProperty(this, key, { configurable: true, value });
      replacing = false;
      return value;
    }
  };
}

export function transformer(target: object, propertyKey: string, descriptor: PropertyDescriptor) {
  return replaceValueDecorator(
    propertyKey,
    (self) => createTransformer(descriptor.value.bind(self))
  );
}

export function bound(target: object, propertyKey: string, descriptor: PropertyDescriptor) {
  return replaceValueDecorator(
    propertyKey,
    (self) => descriptor.value.bind(self)
  );
}