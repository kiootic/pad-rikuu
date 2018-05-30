import Button, { ButtonProps } from '@material-ui/core/Button';
import * as React from 'react';
import { Link, LinkProps } from 'react-router-dom';

export interface AppLinkProps extends LinkProps {
  disabled?: boolean;
}

export function AppLink(props: AppLinkProps) {
  const disabled = !!props.disabled;
  if (disabled) {
    const newProps = Object.assign({}, props, { to: undefined, href: undefined });
    return <a {...newProps} />;
  }
  else
    return <Link {...props} />;
}

export function AppLinkButton(props: ButtonProps & AppLinkProps) {
  return <Button component={AppLink} {...props as any} />;
}