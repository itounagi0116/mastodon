import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { FormattedMessage } from 'react-intl';

export default class AlbumTracksCount extends ImmutablePureComponent {

  static propTypes = {
    value: PropTypes.number,
  }

  render () {
    return (
      <div className='album-tracks-count'>
        {this.props.value + ' '}
        <FormattedMessage id='album.tracks' defaultMessage='Tracks' />
      </div>
    );
  }

}
