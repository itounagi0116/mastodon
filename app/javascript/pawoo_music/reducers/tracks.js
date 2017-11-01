import {
  TRACKS_PLAY,
  TRACKS_STOP,
} from '../actions/tracks';
import {
  ALBUMS_PLAY,
} from '../actions/albums';
import Immutable from 'immutable';

const initialState = Immutable.fromJS({
  trackId: null,
});

export default function tracks(state = initialState, action) {
  switch(action.type) {
  case TRACKS_PLAY:
    return state.set('trackId', action.value);
  case TRACKS_STOP:
  case ALBUMS_PLAY:
    return state.set('trackId', null);
  default:
    return state;
  }
}
