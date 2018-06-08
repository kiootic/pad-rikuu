import { Typography } from '@material-ui/core';
import * as React from 'react';
import { AppSearch } from 'src/components/app/AppSearch';
import './MainPage.css';

export class MainPage extends React.Component {
  public render() {
    return (
      <div className="MainPage-root">
        <div className="MainPage-image-container">
          <div className="MainPage-image" />
        </div>
        <Typography variant="caption">lookup the information you need!</Typography>
        <AppSearch className="MainPage-search" popupClassName="MainPage-search-popup" />
      </div>
    );
  }
}