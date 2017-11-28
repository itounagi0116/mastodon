import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import querystring from 'querystring';
import { debounce } from 'lodash';
import classNames from 'classnames';
import Track from '../../containers/track';

import pawooIcon from '../../../images/pawoo_music/pawoo_icon.svg';

import '../../containers/app/app.scss';

export default class EmbedMusicvideo extends React.PureComponent {

  static propTypes = {
    status: PropTypes.object.isRequired,
  }

  state = {
    isPlay: false,
    showIcon: false,
  };

  handlePlayTrack = () => {
    this.setState({ isPlay: true });
  }

  handleStopTrack = () => {
    this.setState({ isPlay: false });
  }

  handleMouseEnter = () => {
    this.setState({ showIcon: true });
    this.hideLogoDebounce();
  }

  handleMouseMove = () => {
    this.setState({ showIcon: true });
    this.hideLogoDebounce();
  }

  handleMouseLeave = () => {
    this.setState({ showIcon: false });
  }

  hideLogoDebounce = debounce(() => {
    this.setState({ showIcon: false });
  }, 3000);

  renderInfo () {
    const { status: { id, account, track } } = this.props;
    const { isPlay, showIcon } = this.state;
    const params = location.search.length > 1 ? querystring.parse(location.search.substr(1)) : {};
    const hideInfo = params.hideinfo && Number(params.hideinfo) === 1;

    if (isPlay) {
      return (
        <div className='meta'>
          <a className={classNames('icon-link', { visible: showIcon })} href={`/@${account.acct}/${id}`} target='_blank'>
            <img src={pawooIcon} alt='Pawoo Music' />
          </a>
        </div>
      );
    }

    if (!isPlay && !hideInfo) {
      return (
        <div className='meta'>
          <a className='artist' href={`/@${account.acct}`}       target='_blank'>{track.artist}</a><br />
          <a className='title'  href={`/@${account.acct}/${id}`} target='_blank'>{track.title} </a>
        </div>
      );
    }

    return (
      <div className='meta' />
    );
  }

  render () {
    const { status: { id, track } } = this.props;

    return (
      <div
        className='app embed-musicvideo'
        onMouseEnter={this.handleMouseEnter}
        onMouseMove={this.handleMouseMove}
        onMouseLeave={this.handleMouseLeave}
      >
        <Track track={Immutable.fromJS(track).set('id', id)} fitContain onPlayTrack={this.handlePlayTrack} onStopTrack={this.handleStopTrack} />
        {this.renderInfo()}
      </div>
    );
  }

}
