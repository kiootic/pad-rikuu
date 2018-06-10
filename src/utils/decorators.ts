import { withWidth as muiwithWidth } from '@material-ui/core';
import { observable } from 'mobx';
import { createTransformer } from 'mobx-utils';
import { withRouter as reactWithRouter } from 'react-router-dom';

export function withRouter<T extends React.ComponentType>(component: T): T {
  return reactWithRouter(component as any) as any;
}

export function withWidth(options?: typeof muiwithWidth extends (options: infer Options) => any ? Options: any) {
  return muiwithWidth(options) as <T extends React.ComponentType>(component: T) => T;
}

export function prop(name: string) {
  return (target: object, propertyKey: string) => {
    Object.defineProperty(target, propertyKey, {
      configurable: true,
      get(this: any) {
        return this.props[name];
      }
    });
  };
}

export const history = prop('history');
export const store = prop('store');

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