import { StyledComponentProps, Theme, withStyles } from '@material-ui/core';
import Select, { SelectProps } from '@material-ui/core/Select';
import * as React from 'react';

const styles = withStyles((theme: Theme) => ({
  root: {
    '@global option': {
      backgroundColor: theme.palette.background.paper
    }
  }
}));

type AppSelectProps = SelectProps & StyledComponentProps<'option'>;

// tslint:disable-next-line:no-shadowed-variable
export const AppSelect = styles<AppSelectProps>(function AppSelect(props: AppSelectProps) {
  return <Select native={true} {...props} className={(props.className || '') + props.classes!.root} />;
});