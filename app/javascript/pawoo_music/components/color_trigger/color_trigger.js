import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { constructRgbCode } from '../../util/musicvideo';

export default class ColorTrigger extends ImmutablePureComponent {

  static propTypes = {
    alpha: PropTypes.number.isRequired,
    color: PropTypes.number.isRequired,
    onClick: PropTypes.func,
  }

  render () {
    const { alpha, color, onClick } = this.props;
    const depth = Math.round(((color & 0xff) + ((color >> 8) & 0xff) + ((color >> 16) & 0xff)) / 3);
    const borderDepth = depth < 0xb0 ? 0x58 + depth : Math.max(0x58, 0x108 - depth);
    const borderDepthHex = borderDepth.toString(16);

    return (
      <div
        className='color-trigger'
        onClick={onClick}
        role='button'
        style={{ borderColor: '#' + borderDepthHex.repeat(3) }}
        tabIndex='-1'
      >
        <div
          className='color-trigger-body'
          style={{ backgroundColor: constructRgbCode(color, alpha) }}
        />
      </div>
    );
  }

}
