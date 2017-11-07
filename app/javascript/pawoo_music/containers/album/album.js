import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Musicvideo from '../../components/musicvideo';
import StatusActionBar from '../status_action_bar';
import StatusMeta from '../../components/status_meta';
import { playAlbum, stopAlbum, fetchAlbumTracks } from '../../actions/albums';
import { makeGetStatus } from '../../../mastodon/selectors';

import playIcon from '../../../images/pawoo_music/play.png';
import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

const makeMapStateToProps = () => {
  const getStatus = makeGetStatus();

  const mapStateToProps = (state, props) => {
    const id = props.album.get('id');
    const trackIds = state.getIn(['pawoo_music', 'albums', 'tracks', id]);
    const trackStatuses = trackIds ? trackIds.map((trackId) => getStatus(state, trackId)) : null;

    return {
      albumId: state.getIn(['pawoo_music', 'albums', 'albumId']),
      trackStatuses,
    };
  };

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch) => ({
  onPlayAlbum (value) {
    dispatch(playAlbum(value));
  },

  onStopAlbum (value) {
    dispatch(stopAlbum(value));
  },

  onFetchAlbumTracks (id) {
    dispatch(fetchAlbumTracks(id));
  },
});

@connect(makeMapStateToProps, mapDispatchToProps)
class Album extends ImmutablePureComponent {

  static propTypes = {
    album: ImmutablePropTypes.map.isRequired,
    trackStatuses: ImmutablePropTypes.list,
    albumId: PropTypes.number,
    onPlayAlbum: PropTypes.func.isRequired,
    onStopAlbum: PropTypes.func.isRequired,
    onFetchAlbumTracks: PropTypes.func.isRequired,
  };

  state = {
    thumbnailView: true,
    index: 0,
  }

  componentWillReceiveProps = ({ albumId }) => {
    if (!this.state.thumbnailView && albumId !== this.props.album.get('id')) {
      this.setState({ thumbnailView: true });
    }
  };

  componentWillUnmount () {
    this.setState({ thumbnailView: true });
  }

  handlePlayClick = () => {
    const { trackStatuses, album } = this.props;
    const { thumbnailView } = this.state;

    if (!trackStatuses) {
      this.props.onFetchAlbumTracks(album.get('id'));
    }

    this.setState({ thumbnailView: !thumbnailView });
    if (thumbnailView) {
      this.props.onPlayAlbum(this.props.album.get('id'));
    } else {
      this.props.onStopAlbum();
    }
  }

  handleEndTrack = () => {
    const { album } = this.props;
    const { index } = this.state;
    const newIndex = index + 1;

    if (newIndex < album.get('tracks_count')) {
      this.setState({ index: newIndex });
    }
  };

  handleClickTrack = (e) => {
    const { index } = this.state;
    const clickedIndex = Number(e.currentTarget.getAttribute('data-index'));

    if (clickedIndex === index) {
      if (this.musicvideo) {
        this.musicvideo.togglePaused();
      }
    } else {
      this.setState({ index: clickedIndex });
    }
  }

  setRef = (c) => {
    this.musicvideo = c && c.getWrappedInstance();
  }

  renderTrack = (status, i) => {
    const { index } = this.state;

    return (
      <div className='album-track' key={status.get('id')}>
        <div className={classNames('album-track-info', { active: index === i })} data-index={i} role='button' tabIndex='0' aria-pressed='false' onClick={this.handleClickTrack}>
          {`${i + 1}. ${status.getIn(['track', 'artist'])} - ${status.getIn(['track', 'title'])}`}
        </div>
        {index === i && (
          <div>
            <StatusActionBar status={status} />
            <StatusMeta status={status} />
          </div>
        )}
      </div>
    );
  }

  render() {
    const { album, trackStatuses } = this.props;
    const { thumbnailView, index } = this.state;

    const thumbnailStyle = {
      backgroundImage: thumbnailView && `url('${album.get('image', defaultArtwork)}')`,
    };

    return (
      <div className='album'>
        <div className='musicvideo-wrapper' style={thumbnailStyle}>
          {(thumbnailView || !trackStatuses) ? (
            <div className='thumbnail' role='button' tabIndex='0' aria-pressed='false' onClick={this.handlePlayClick}>
              <img className='playbutton' src={playIcon} alt='playbutton' />
            </div>
          ) : (
            <Musicvideo ref={this.setRef} track={trackStatuses.getIn([index, 'track'])} onEnded={this.handleEndTrack} />
          )}
        </div>
        {!thumbnailView && trackStatuses && (
          <div className='album-track-list'>
            {trackStatuses.map(this.renderTrack)}
          </div>
        )}
      </div>
    );
  }

}

export default Album;
