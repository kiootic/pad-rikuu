import { Paper, Tab, Tabs } from '@material-ui/core';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { AppHeader } from 'src/components/app/AppHeader';
import { Data } from 'src/components/settings/Data';
import './Settings.css';

const pages: Array<React.ComponentType & { title: string }> = [
  Data
];

@observer
export class Settings extends React.Component {
  @observable
  private value = 0;

  public render() {
    return <>
      <AppHeader />
      <Tabs value={this.value} onChange={this.onChange} scrollable={true} scrollButtons="auto">
        {pages.map((page, i) => <Tab label={page.title} key={i} />)}
      </Tabs>
      <Paper className="Settings-content">
        {React.createElement(pages[this.value])}
      </Paper>
    </>;
  }

  @action.bound
  private onChange(e: React.ChangeEvent<any>, value: number) {
    this.value = value;
  }
}