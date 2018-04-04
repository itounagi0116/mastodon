import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';

export default class EmbeddedMeta extends ImmutablePureComponent {

  static propTypes = {
    acct: PropTypes.string,
    artist: PropTypes.string,
    statusId: PropTypes.number,
    title: PropTypes.string,
  }

  render () {
    return (
      <div className='embedded-meta'>
        {this.props.artist && (
          <div className='artist'>
            <a href={`/@${this.props.acct}`} target='_blank'>
              {this.props.artist}
            </a>
          </div>
        )}
        {this.props.title && (
          <div className='title'>
            <a href={`/@${this.props.acct}/${this.props.statusId}`} target='_blank'>
              {this.props.title}
            </a>
          </div>
        )}
      </div>
    );
  }

}
