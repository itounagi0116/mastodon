import { noop } from 'lodash';
import { changePaused, changeSeekDestination } from '../actions/player';
import defaultArtwork from '../../images/pawoo_music/default_artwork.png';

export default 'mediaSession' in navigator ? store => {
  navigator.mediaSession.setActionHandler('play',
    () => store.dispatch(changePaused(false)));

  navigator.mediaSession.setActionHandler('pause',
    () => store.dispatch(changePaused(true)));

  navigator.mediaSession.setActionHandler('seekbackward', () => {
    store.dispatch(
      changeSeekDestination(
        store.getState().getIn(['pawoo_music', 'player', 'getCurrentTime'])() - 1
      )
    );
  });

  navigator.mediaSession.setActionHandler('seekforward', () => {
    store.dispatch(
      changeSeekDestination(
        store.getState().getIn(['pawoo_music', 'player', 'getCurrentTime'])() - 1
      )
    );
  });

  store.subscribe(() => {
    const state = store.getState();
    const player = state.getIn(['pawoo_music', 'player']);
    const trackPath = player.getIn(['trackPath']);

    if (trackPath === null) {
      navigator.mediaSession.playback = 'none';
      return;
    }

    const track = state.getIn(trackPath);
    const title = track.get('title');
    const artist = track.get('artist');
    const image = track.getIn(['video', 'image']) || defaultArtwork;

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
