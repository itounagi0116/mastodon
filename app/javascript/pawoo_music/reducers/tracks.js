import {
  TRACKS_PLAY,
  TRACKS_STOP,
  TRACKS_FETCH_CONTAINED_ALBUMS_SUCCESS,
} from '../actions/tracks';
import {
  ALBUMS_PLAY,
} from '../actions/albums';
import Immutable from 'immutable';

const initialState = Immutable.fromJS({
  trackId: null,
  containedAlbums: {},
});

export default function tracks(state = initialState, action) {
  switch(action.type) {
  case TRACKS_PLAY:
    return state.set('trackId', action.value);
  case TRACKS_STOP:
  case ALBUMS_PLAY:
    return state.set('trackId', null);
  case TRACKS_FETCH_CONTAINED_ALBUMS_SUCCESS:
    return state.setIn(['containedAlbums', action.id], Immutable.List(action.statuses.map((status) => status.id)));
  default:
    return state;
  }
}
