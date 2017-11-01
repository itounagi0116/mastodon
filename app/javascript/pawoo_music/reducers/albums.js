import {
  ALBUMS_PLAY,
  ALBUMS_STOP,
  ALBUMS_FETCH_TRACKS_SUCCESSS,
} from '../actions/albums';
import {
  TRACKS_PLAY,
} from '../actions/tracks';

import Immutable from 'immutable';

const initialState = Immutable.fromJS({
  albumId: null,
  tracks: {},
});

export default function tracks(state = initialState, action) {
  switch(action.type) {
  case ALBUMS_PLAY:
    return state.set('albumId', action.value);
  case ALBUMS_STOP:
  case TRACKS_PLAY:
    return state.set('albumId', null);
  case ALBUMS_FETCH_TRACKS_SUCCESSS:
    return state.setIn(['tracks', action.id], Immutable.List(action.statuses.map((status) => status.id)));
  default:
    return state;
  }
}
