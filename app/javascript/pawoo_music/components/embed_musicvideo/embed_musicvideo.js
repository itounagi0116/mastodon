import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import querystring from 'querystring';
import Track from '../../containers/track';

import '../../containers/app/app.scss';

export default class MusicvideoEntry extends React.PureComponent {

  static propTypes = {
    status: PropTypes.object.isRequired,
  }

  render () {
    const { status: { id, account, track } } = this.props;
    const params = location.search.length > 1 ? querystring.parse(location.search.substr(1)) : {};
    const showInfo = !params.hideinfo || Number(params.hideinfo) !== 1;

    return (
      <div className='app embed-musicvideo'>
        <Track track={Immutable.fromJS(track).set('id', id)} fitContain />
        {showInfo && (
          <div className='meta'>
            <a className='artist' href={`/@${account.acct}`}       target='_blank'>{track.artist}</a><br />
            <a className='title'  href={`/@${account.acct}/${id}`} target='_blank'>{track.title} </a>
          </div>
        )}
      </div>
    );
  }

}
