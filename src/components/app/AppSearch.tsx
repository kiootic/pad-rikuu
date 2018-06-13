import { Icon, Input, InputAdornment, MenuItem, Paper } from '@material-ui/core';
import Downshift, { ControllerStateAndHelpers, StateChangeOptions } from 'downshift';
import { History } from 'history';
import { action, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Card, Dungeon, Floor } from 'src/models';
import { Store } from 'src/store';
import { SearchEntry } from 'src/store/SearchIndexStore';
import { history, store, transformer, withRouter } from 'src/utils';
import './AppSearch.css';

function makeDummyEntry(text: string) {
  return {
    key: 'input',
    text,
    type: null,
    item: text
  };
}

export interface AppSearchProps {
  className?: string;
  popupClassName?: string;
  showAdornment?: boolean;
  autoFocus?: boolean;
  onNavigate?: () => void;
}

@withRouter
@inject('store')
@observer
export class AppSearch extends React.Component<AppSearchProps> {
  @store
  private readonly store: Store;

  @history
  private readonly history: History;

  @observable
  private highlightedIndex = 0;

  @observable
  private inputValue = '';

  @observable
  private selectedItem?: SearchEntry;

  public render() {
    this.store.toString();
    return (
      <Downshift
        itemToString={this.getText} defaultHighlightedIndex={0}
        onStateChange={this.onStateChange}
        highlightedIndex={this.highlightedIndex} inputValue={this.inputValue} selectedItem={this.selectedItem}
      >{
          ({ isOpen, getInputProps, getItemProps, inputValue, highlightedIndex }) => {
            return (
              <div className={`AppSearch-root ${this.props.className || ''}`}>
                <Input type="text" className="AppSearch-field" fullWidth={true}
                  inputProps={getInputProps()} autoFocus={this.props.autoFocus}
                  disableUnderline={this.props.showAdornment === false}
                  startAdornment={
                    <InputAdornment position="start" className="AppSearch-adornment">
                      {this.props.showAdornment !== false && <Icon>search</Icon>}
                    </InputAdornment>
                  }
                />
                {isOpen && (
                  <Paper className={`AppSearch-dropdown ${this.props.popupClassName || ''}`} square={true}>{
                    this.getCandidates(inputValue || '').map((entry, i) => {
                      const props = getItemProps({ item: entry });
                      return (
                        <MenuItem key={entry.key} {...props} selected={highlightedIndex === i}>
                          {entry.text}
                        </MenuItem>
                      );
                    })
                  }</Paper>
                )}
              </div>
            );
          }
        }</Downshift>
    );
  }

  private getText(item?: SearchEntry) {
    return item && item.text || '';
  }

  @transformer
  private getCandidates(input: string) {
    const candidates: SearchEntry[] = [];

    for (const entry of this.store.searchIndex.entries) {
      if (!entry.text.toLowerCase().includes(input.toLowerCase()))
        continue;

      candidates.push(entry);

      if (candidates.length >= 5)
        break;
    }
    return candidates;
  }

  @action.bound
  private onStateChange(changes: StateChangeOptions, helpers: ControllerStateAndHelpers) {
    if (typeof changes.isOpen === 'boolean' && !changes.isOpen) {
      if (!this.selectedItem || this.selectedItem.text !== this.inputValue) {
        this.selectedItem = makeDummyEntry(this.inputValue);
      }
    }
    if (typeof changes.highlightedIndex === 'number')
      this.highlightedIndex = changes.highlightedIndex;
    if (typeof changes.inputValue === 'string')
      this.inputValue = changes.inputValue;
    if (typeof changes.selectedItem === 'object') {
      if (this.navigate(changes.selectedItem))
        this.selectedItem = makeDummyEntry('');
      else
        this.selectedItem = changes.selectedItem;
    }
  }

  private navigate(entry: SearchEntry) {
    if (!entry.type) return false;

    switch (entry.type) {
      case 'card': {
        const card = entry.item as Card;
        this.history.push(`/cards/${card.id}`);
        break;
      }
      case 'dungeon': {
        const { dungeon, floor } = entry.item as { dungeon: Dungeon, floor: Floor };
        this.history.push(`/dungeons/${dungeon.id}/${floor.id}`);
        break;
      }
    }
    if (this.props.onNavigate)
      this.props.onNavigate();
    return true;
  }
}