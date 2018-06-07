declare module 'react-jss' {
  import * as React from 'react';
  import jss from 'jss';

  export interface JssProviderProps {
    jss: typeof jss;
  }
  export class JssProvider extends React.Component<JssProviderProps> { }
}