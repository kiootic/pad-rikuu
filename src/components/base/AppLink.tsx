import Button, { ButtonProps } from '@material-ui/core/Button';
import * as React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import './AppLink.css';

export interface AppLinkProps extends NavLinkProps {
  disabled?: boolean;
}

export function AppLink(props: AppLinkProps) {
  const disabled = !!props.disabled;
  if (disabled) {
    const newProps = Object.assign({}, props, { to: undefined, href: undefined });
    return <a {...newProps} />;
  }
  else {
    return <NavLink {...props} activeClassName="AppLink-active" />;
  }
}

export function AppLinkButton(props: ButtonProps & AppLinkProps) {
  return <Button component={AppLink} {...props as any} disableRipple={true} />;
}