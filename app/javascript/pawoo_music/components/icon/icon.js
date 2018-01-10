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
    disabled: PropTypes.bool,
  }

  isClickable = () => {
    const { onClick, disabled } = this.props;
    return !disabled && !!onClick;
  }

  render () {
    const { icon, title, active, className, onClick, scale, strong, ...other } = this.props;
    const clickable = this.isClickable();
    const iconClassNames = [className];
    let innerHTML;

    if (icon.startsWith('fa-')) {
      iconClassNames.push('fa', icon);
    } else {
      const svg = feather.toSvg(icon);
      innerHTML = { __html: svg };
    }

    return (
      <span
        dangerouslySetInnerHTML={innerHTML}
        className={classNames('icon', `icon-${icon}`, { clickable, active, scale, strong }, iconClassNames)}
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
