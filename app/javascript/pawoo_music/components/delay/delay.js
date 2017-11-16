import isEqual from 'lodash/isEqual';
import classnames from 'classnames';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class Delay extends PureComponent {

  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    duration: PropTypes.number,
    easing: PropTypes.string,
  };

  static defaultProps = {
    duration: 240,
    easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  };

  constructor(props, context) {
    super(props, context);
    this.mounted = true;
    this.state = { children: props.children, visible: !!props.children };
  }

  componentWillReceiveProps = (nextProps) => {
    if (!isEqual(this.props.children, nextProps.children)) {
      const { children, duration } = nextProps;
      if (!children) {
        this.setState({ visible: false });
        setTimeout(() => this.mounted && this.setState({ children }), duration);
      } else {
        this.setState({ visible: true, children });
      }
    }
  };

  componentWillUnmount = () => {
    this.mounted = false;
  };

  render = () => {
    const { duration, easing, className } = this.props;
    return (
      <div className={classnames('delay', { visible: this.state.visible }, className)} style={{ transition: `all ${duration}ms ${easing}` }}>
        {this.state.children}
      </div>
    );
  };

}
