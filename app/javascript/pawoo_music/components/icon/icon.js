import noop from 'lodash/noop';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import feather from 'feather-icons';

export default class IconButton extends PureComponent {

  static propTypes = {
    icon: PropTypes.string.isRequired,
    className: PropTypes.string,
    active: PropTypes.bool,
    scale: PropTypes.bool,
    strong: PropTypes.bool,
    onClick: PropTypes.func,
    title: PropTypes.string,
    strokeWidth: PropTypes.number,
    disabled: PropTypes.bool,
  }

  static defaultProps = {
    strokeWidth: 1,
  };

  isClickable = () => {
    const { onClick, disabled } = this.props;
    return !disabled && !!onClick;
  }

  render () {
    const { icon, title, active, className, onClick, strokeWidth, scale, strong, ...other } = this.props;
    const svg = feather.toSvg(icon, { 'stroke-width': strokeWidth });
    const clickable = this.isClickable();

    return (
      <span
        dangerouslySetInnerHTML={{ __html: svg }}
        className={classNames('icon', `icon-${icon}`, { clickable, active, scale, strong }, className)}
        onClick={clickable ? onClick : noop}
        title={title}
        role={clickable ? 'button' : 'presentation'}
        tabIndex={clickable ? 0 : -1}
        aria-pressed='false'
        {...other}
      />
    );
  }

};
