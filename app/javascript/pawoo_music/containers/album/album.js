import Immutable from 'immutable';
import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { FormattedMessage } from 'react-intl';
import Musicvideo from '../musicvideo';
import StatusActionBar from '../status_action_bar';
import StatusReactions from '../status_reactions';
import Icon from '../../components/icon';
import StatusMeta from '../../components/status_meta';
import { fetchAndQueueAlbumTracks } from '../../actions/albums_tracks';
import { changePaused, changeAlbumTrackIndex } from '../../actions/player';
import { isMobile } from '../../util/is_mobile';
import { makeGetStatus } from '../../../mastodon/selectors';

import playIcon from '../../../images/pawoo_music/play.png';
import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

class AlbumThumbnail extends ImmutablePureComponent {

  static propTypes = {
    album: ImmutablePropTypes.map.isRequired,
    onClick: PropTypes.func,
  }

  render () {
    return (
      <div
        className='album-thumbnail'
        style={{ backgroundImage: `url('${this.props.album.get('image', defaultArtwork)}')` }}
        role='button'
        tabIndex='0'
        aria-pressed='false'
        onClick={this.props.onClick}
      >
        <img className='playbutton' src={playIcon} alt='playbutton' />
        <span className='tracks-count'>
          {this.props.album.get('tracks_count') + ' '}
          <FormattedMessage id='album.tracks' defaultMessage='Tracks' />
        </span>
      </div>
    );
  }

}

class AlbumTrackBeingPlayedItem extends ImmutablePureComponent {

  static propTypes = {
    status: ImmutablePropTypes.map.isRequired,
    onReactionActive: PropTypes.func,
    onReactionInactive: PropTypes.func,
  }

  render () {
    return (
      <li className='playing' key={this.props.status.get('id')}>
        <Icon icon='play' /> {this.props.status.getIn(['track', 'title'])}
        <StatusReactions
          status={this.props.status}
          onActive={this.props.onReactionActive}
          onInactive={this.props.onReactionInactive}
        />
        <StatusActionBar status={this.props.status} />
        <StatusMeta status={this.props.status} />
      </li>
    );
  }

}

class AlbumPausedTrackItem extends ImmutablePureComponent {

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
      <li role='button' onClick={this.handleClick} tabIndex='0'>
        <Icon icon='pause' /> {this.props.status.getIn(['track', 'title'])}
      </li>
    );
  }

}

class AlbumTrack extends ImmutablePureComponent {

  static propTypes = {
    indexBeingQueued: PropTypes.number,
    statuses: ImmutablePropTypes.list,
    onChangeIndex: PropTypes.func.isRequired,
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
    const { indexBeingQueued, statuses, onChangeIndex } = this.props;
    const { scrollbarsActive, reactionActive } = this.state;
    const mobile = isMobile();

    return (
      <Musicvideo controlsActive={scrollbarsActive || reactionActive}>
        <div className='album-playlist'>
          <Scrollbars
            onScrollStart={mobile || this.handleScrollbarsActive}
            onScrollStop={mobile || this.handleScrollbarsInactive}
          >
            <ol>
              {statuses.map((status, index) => indexBeingQueued === index ? (
                <AlbumTrackBeingPlayedItem
                  key={status.get('id')}
                  onReactionActive={this.handleReactionActive}
                  onReactionInactive={this.handleReactionInactive}
                  status={status}
                />
              ) : (
                <AlbumPausedTrackItem
                  key={status.get('id')}
                  index={index}
                  status={status}
                  onClick={onChangeIndex}
                />
              ))}
            </ol>
          </Scrollbars>
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

    return {
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
});

@connect(makeMapStateToProps, mapDispatchToProps)
class Album extends ImmutablePureComponent {

  static propTypes = {
    album: ImmutablePropTypes.map.isRequired,
    trackIndexBeingQueued: PropTypes.number,
    trackStatuses: ImmutablePropTypes.list,
    onQueueAlbum: PropTypes.func.isRequired,
    onChangeAlbumTrackIndex: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
  };

  handleQueueClick = () => {
    this.props.onQueueAlbum();
    this.props.onPlay();
  }

  render() {
    const {
      album,
      trackIndexBeingQueued,
      trackStatuses,
      onChangeAlbumTrackIndex,
    } = this.props;

    return trackIndexBeingQueued === null || !trackStatuses ? (
      <AlbumThumbnail album={album} onClick={this.handleQueueClick} />
    ) : (
      <AlbumTrack
        indexBeingQueued={trackIndexBeingQueued}
        statuses={trackStatuses}
        onChangeIndex={onChangeAlbumTrackIndex}
      />
    );
  }

}

export default Album;
