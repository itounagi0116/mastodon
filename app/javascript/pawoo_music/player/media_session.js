import { noop } from 'lodash';
import {
  changeAlbumTrackIndex,
  changePaused,
  changeSeekDestination,
} from '../actions/player';
import defaultArtwork from '../../images/pawoo_music/default_artwork.png';

export default 'mediaSession' in navigator ? store => {
  function handlePlay() {
    store.dispatch(changePaused(false));
  }

  function handlePause() {
    store.dispatch(changePaused(true));
  }

  function handleSeekBakward() {
    store.dispatch(
      changeSeekDestination(
        store.getState().getIn(['pawoo_music', 'player', 'getCurrentTime'])() - 1
      )
    );
  }

  function handleSeekForward() {
    store.dispatch(
      changeSeekDestination(
        store.getState().getIn(['pawoo_music', 'player', 'getCurrentTime'])() - 1
      )
    );
  }

  function handlePreviousTrack() {
    const state = store.getState();
    const trackIndex = state.getIn(['pawoo_music', 'player', 'album', 'trackIndex']);

    store.dispatch(changeAlbumTrackIndex(trackIndex - 1));
  }

  function handleNextTrack() {
    const state = store.getState();
    const trackIndex = state.getIn(['pawoo_music', 'player', 'album', 'trackIndex']);

    store.dispatch(changeAlbumTrackIndex(trackIndex + 1));
  }

  navigator.mediaSession.setActionHandler('play', handlePlay);
  navigator.mediaSession.setActionHandler('pause', handlePause);
  navigator.mediaSession.setActionHandler('seekbackward', handleSeekBakward);
  navigator.mediaSession.setActionHandler('seekforward', handleSeekForward);

  store.subscribe(() => {
    const state = store.getState();
    const player = state.getIn(['pawoo_music', 'player']);
    const playerAlbum = player.get('album');
    const trackPath = player.getIn(['trackPath']);

    if (trackPath === null) {
      navigator.mediaSession.playback = 'none';
      return;
    }

    const track = state.getIn(trackPath);
    const title = track.get('title');
    const artist = track.get('artist');
    const image = track.getIn(['video', 'image']) || defaultArtwork;

    if (playerAlbum) {
      const albumTracks = state.getIn(playerAlbum.get('path'));
      const albumTrackIndex = playerAlbum.get('trackIndex');

      navigator.mediaSession.setActionHandler(
        'previoustrack',
         albumTrackIndex > 0 ? handlePreviousTrack : null
      );

      navigator.mediaSession.setActionHandler(
        'nexttrack',
        albumTrackIndex + 1 < albumTracks.count() ? handleNextTrack : null
      );
    } else {
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    }

    if (navigator.mediaSession.metadata === null) {
      navigator.mediaSession.metadata = new MediaMetadata(
        { title, artist, artwork: [{ src: image }] });
    } else {
      navigator.mediaSession.metadata.title = title;
      navigator.mediaSession.metadata.artist = artist;
      navigator.mediaSession.metadata.artwork = [{ src: image }];
    }
  });
} : noop;
