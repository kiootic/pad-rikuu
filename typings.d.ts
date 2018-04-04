declare module '*.scss' {
  const classNames: Record<string, string>;
  export = classNames;
}

declare const process: NodeJS.Process & { browser: boolean };

declare interface Url {
  pathname: String;
  query: Record<string, string>;
  asPath: String;
}
