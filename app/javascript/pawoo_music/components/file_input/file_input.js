import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Icon from '../icon';

export default class FileInput extends ImmutablePureComponent {

  static propTypes = {
    icon: PropTypes.string.isRequired,
    settled: PropTypes.bool,
    title: PropTypes.node,
  }

  ref = null;

  componentWillReceiveProps({ settled }) {
    if (settled === null && this.ref !== null) {
      this.ref.value = '';
    }
  }

  setRef = (ref) => {
    this.ref = ref;
  }

  render () {
    const { icon, settled, title, ...props } = this.props;

    return (
      <div className={classNames('file-input', { settled })}>
        <div className='file-input-body'>
          <Icon icon={this.props.icon} />
          <span className='text'>{this.props.title}</span>
          <input {...props} ref={this.setRef} type='file' />
        </div>
      </div>
    );
  }

}
