import Immutable from 'immutable';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { FormattedMessage } from 'react-intl';
import Musicvideo from '../musicvideo';
import StatusActionBar from '../status_action_bar';
import StatusMeta from '../../components/status_meta';
import { fetchAndQueueAlbumTracks } from '../../actions/albums_tracks';
import { changePaused, changeAlbumTrackIndex } from '../../actions/player';
import { makeGetStatus } from '../../../mastodon/selectors';

import playIcon from '../../../images/pawoo_music/play.png';
import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

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

  onPause () {
    dispatch(changePaused(true));
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
    onPause: PropTypes.func.isRequired,
  };

  handleQueueClick = () => {
    this.props.onQueueAlbum();
    this.props.onPlay();
  }

  handleClickTrack = (e) => {
    const { trackIndexBeingQueued } = this.props;
    const clickedTrackIndex = Number(e.currentTarget.getAttribute('data-index'));

    if (clickedTrackIndex === trackIndexBeingQueued) {
      this.props.onPause();
    } else {
      this.props.onChangeAlbumTrackIndex(clickedTrackIndex);
    }
  }

  renderTrack = (status, i) => {
    const { trackIndexBeingQueued } = this.props;

    return (
      <div className='album-track' key={status.get('id')}>
        <div className={classNames('album-track-info', { active: trackIndexBeingQueued === i })} data-index={i} role='button' tabIndex='0' aria-pressed='false' onClick={this.handleClickTrack}>
          {`${i + 1}. ${status.getIn(['track', 'artist'])} - ${status.getIn(['track', 'title'])}`}
        </div>
        {trackIndexBeingQueued === i && (
          <div>
            <StatusActionBar status={status} />
            <StatusMeta status={status} />
          </div>
        )}
      </div>
    );
  }

  render() {
    const { album, trackIndexBeingQueued, trackStatuses } = this.props;

    const thumbnailStyle = {
      backgroundImage: trackIndexBeingQueued || `url('${album.get('image', defaultArtwork)}')`,
    };

    return (
      <div className='album'>
        <div className='musicvideo-wrapper' style={thumbnailStyle}>
          {(trackIndexBeingQueued === null || !trackStatuses) ? (
            <div className='thumbnail' role='button' tabIndex='0' aria-pressed='false' onClick={this.handleQueueClick}>
              <img className='playbutton' src={playIcon} alt='playbutton' />
              <span className='tracks-count'>
                {album.get('tracks_count')}
                <FormattedMessage id='album.tracks' defaultMessage='Tracks' />
              </span>
            </div>
          ) : (
            <Musicvideo />
          )}
        </div>
        {trackIndexBeingQueued !== null && trackStatuses && (
          <div className='album-track-list'>
            {trackStatuses.map(this.renderTrack)}
          </div>
        )}
      </div>
    );
  }

}

export default Album;
