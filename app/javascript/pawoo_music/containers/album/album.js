import classNames from 'classnames';
import Immutable from 'immutable';
import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl } from 'react-intl';
import Musicvideo from '../musicvideo';
import StatusActionBar from '../status_action_bar';
import StatusMeta from '../status_meta';
import StatusReactions from '../status_reactions';
import AlbumTracksCount from '../../components/album_tracks_count';
import Icon from '../../components/icon';
import { fetchAndQueueAlbumTracks } from '../../actions/albums_tracks';
import { changePaused, changeAlbumTrackIndex, playDummy } from '../../actions/player';
import { isMobile } from '../../util/is_mobile';
import { makeGetStatus } from '../../../mastodon/selectors';

import playIcon from '../../../images/pawoo_music/play.png';
import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

const messages = defineMessages({
  pause: { id: 'pawoo_music.album.pause', defaultMessage: 'Pause' },
  play: { id: 'pawoo_music.album.play', defaultMessage: 'Play' },
  playbutton: { id: 'pawoo_music.album.playbutton', defaultMessage: 'Play button' },
  thumbnail: { id: 'pawoo_music.album.thumbnail', defaultMessage: 'Thumbnail' },
});

@injectIntl
class AlbumThumbnail extends ImmutablePureComponent {

  static propTypes = {
    album: ImmutablePropTypes.map.isRequired,
    children: PropTypes.node,
    fitContain: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    onClick: PropTypes.func,
  }

  render () {
    const image = this.props.album.get('image');

    return (
      <div className={classNames('album-thumbnail', { 'fit-contain': this.props.fitContain })}>
        <img
          src={image === null ? defaultArtwork : image}
          alt={this.props.intl.formatMessage(messages.thumbnail)}
        />
        <div className='playbutton' role='button' tabIndex='0' onClick={this.props.onClick}>
          <img src={playIcon} alt={this.props.intl.formatMessage(messages.playbutton)} />
        </div>
        <div className='info'>
          {this.props.children || (
            <div className='album-tracks-count-wrapper'>
              <AlbumTracksCount value={this.props.album.get('tracks_count')} />
            </div>
          )}
        </div>
      </div>
    );
  }

}

@injectIntl
class AlbumQueuedTrackItem extends ImmutablePureComponent {

  static propTypes = {
    intl: PropTypes.object,
    paused: PropTypes.bool,
    status: ImmutablePropTypes.map.isRequired,
    onReactionActive: PropTypes.func,
    onReactionInactive: PropTypes.func,
  }

  handleInfoClick = event => {
    event.stopPropagation();
  }

  render () {
    const {
      intl,
      paused,
      status,
      onReactionActive,
      onReactionInactive,
      ...props
    } = this.props;

    return (
      <li
        className='queued'
        key={status.get('id')}
        role='switch'
        aria-checked={!paused}
        {...props}
      >
        {
          // This behavior matches the icon in the musicvideo controller.
          paused ?
            <Icon icon='play' aria-label={intl.formatMessage(messages.play)} /> :
            <Icon icon='pause' aria-label={intl.formatMessage(messages.pause)} />
        }
        {status.getIn(['track', 'title'])}
        <div
          // eslint-disable-next-line jsx-a11y/onclick-has-role
          onClick={this.handleInfoClick}
        >
          <StatusReactions
            status={status}
            onActive={onReactionActive}
            onInactive={onReactionInactive}
          />
          <StatusActionBar status={status} />
          <StatusMeta status={status} />
        </div>
      </li>
    );
  }

}

class AlbumUnqueuedTrackItem extends ImmutablePureComponent {

  static propTypes = {
    onClick: PropTypes.func.isRequired,
    index: PropTypes.any,
    status: ImmutablePropTypes.map.isRequired,
  };

  handleClick = () => {
    this.props.onClick(this.props.index);
  }

  render () {
    return (
      <li
        role='switch'
        aria-checked='false'
        onClick={this.handleClick}
        tabIndex='0'
      ><Icon icon='music' /> {this.props.status.getIn(['track', 'title'])}</li>
    );
  }

}

class AlbumTrack extends ImmutablePureComponent {

  static propTypes = {
    children: PropTypes.node,
    fitContain: PropTypes.bool,
    indexBeingQueued: PropTypes.number,
    paused: PropTypes.bool,
    statuses: ImmutablePropTypes.list,
    onChangeIndex: PropTypes.func.isRequired,
    onTogglePaused: PropTypes.func,
  };

  state = {
    scrollbarsActive: false,
    reactionActive: false,
  };

  handleScrollbarsActive = () => {
    this.setState({ scrollbarsActive: true });
  }

  handleScrollbarsInactive = () => {
    this.setState({ scrollbarsActive: false });
  }

  handleReactionActive = () => {
    this.setState({ reactionActive: true });
  }

  handleReactionInactive = () => {
    this.setState({ reactionActive: false });
  }

  render () {
    const {
      children,
      fitContain,
      indexBeingQueued,
      paused,
      statuses,
      onChangeIndex,
      onTogglePaused,
    } = this.props;
    const { scrollbarsActive, reactionActive } = this.state;
    const mobile = isMobile();

    return (
      <Musicvideo controlsActive={scrollbarsActive || reactionActive} fitContain={fitContain}>
        <div className='album-full-info'>
          <div>{children}</div>
          <div className='playlist'>
            <Scrollbars
              onScrollStart={mobile ? null : this.handleScrollbarsActive}
              onScrollStop={mobile ? null : this.handleScrollbarsInactive}
            >
              <ol>
                {statuses.map((status, index) => indexBeingQueued === index ? (
                  <AlbumQueuedTrackItem
                    key={status.get('id')}
                    onClick={onTogglePaused}
                    onReactionActive={this.handleReactionActive}
                    onReactionInactive={this.handleReactionInactive}
                    paused={paused}
                    status={status}
                  />
                ) : (
                  <AlbumUnqueuedTrackItem
                    key={status.get('id')}
                    index={index}
                    status={status}
                    onClick={onChangeIndex}
                  />
                ))}
              </ol>
            </Scrollbars>
          </div>
        </div>
      </Musicvideo>
    );
  }

}

const makeMapStateToProps = () => {
  const getStatus = makeGetStatus();

  const mapStateToProps = (state, props) => {
    const id = props.album.get('id');
    const albumPath = Immutable.List(['pawoo_music', 'albums_tracks', id]);
    const albumPathBeingQueued = state.getIn(['pawoo_music', 'player', 'album', 'path']);
    const album = state.getIn(albumPath);
    const trackIndexBeingQueued = albumPath.equals(albumPathBeingQueued) ?
        state.getIn(['pawoo_music', 'player', 'album', 'trackIndex']) : null;
    const trackStatuses = album ? album.map((trackId) => getStatus(state, trackId)) : null;
    const paused = state.getIn(['pawoo_music', 'player', 'paused']);

    return {
      paused,
      trackIndexBeingQueued,
      trackStatuses,
    };
  };

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch, { album }) => ({
  onQueueAlbum () {
    dispatch(fetchAndQueueAlbumTracks(album.get('id'), 0));
  },

  onChangeAlbumTrackIndex (index) {
    dispatch(changeAlbumTrackIndex(index));
  },

  onPlay () {
    dispatch(changePaused(false));
  },

  onPlayDummy () {
    dispatch(playDummy());
  },

  onTogglePaused () {
    dispatch(
      (newDispatch, getState) => newDispatch(
        changePaused(
          !getState().getIn(['pawoo_music', 'player', 'paused'])
        )
      )
    );
  },
});

@connect(makeMapStateToProps, mapDispatchToProps)
class Album extends ImmutablePureComponent {

  static propTypes = {
    album: ImmutablePropTypes.map.isRequired,
    children: PropTypes.node,
    fitContain: PropTypes.bool,
    paused: PropTypes.bool,
    trackIndexBeingQueued: PropTypes.number,
    trackStatuses: ImmutablePropTypes.list,
    onPlayDummy: PropTypes.func.isRequired,
    onQueueAlbum: PropTypes.func.isRequired,
    onChangeAlbumTrackIndex: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onTogglePaused: PropTypes.func,
  };

  handleQueueClick = () => {
    this.props.onPlayDummy();
    this.props.onQueueAlbum();
    this.props.onPlay();
  }

  render() {
    const {
      album,
      children,
      fitContain,
      trackIndexBeingQueued,
      paused,
      trackStatuses,
      onChangeAlbumTrackIndex,
      onTogglePaused,
    } = this.props;

    return trackIndexBeingQueued === null || !trackStatuses ? (
      <AlbumThumbnail album={album} fitContain={fitContain} onClick={this.handleQueueClick}>
        {children}
      </AlbumThumbnail>
    ) : (
      <AlbumTrack
        fitContain={fitContain}
        indexBeingQueued={trackIndexBeingQueued}
        paused={paused}
        statuses={trackStatuses}
        onChangeIndex={onChangeAlbumTrackIndex}
        onTogglePaused={onTogglePaused}
      >{children}</AlbumTrack>
    );
  }

}

export default Album;
