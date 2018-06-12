import { Typography } from '@material-ui/core';
import * as React from 'react';
import { AppHeader } from 'src/components/app/AppHeader';
import './NotFound.css';

export class NotFound extends React.Component {
  public render() {
    return <>
      <AppHeader />
      <div className="NotFound-root">
        <Typography variant="display1">Page not found</Typography>
      </div>
    </>;
  }
}