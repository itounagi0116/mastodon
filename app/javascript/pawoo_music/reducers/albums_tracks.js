import {
  ALBUMS_TRACKS_FETCH_SUCCESS,
  ALBUMS_TRACKS_SET,
} from '../actions/albums_tracks';

import Immutable from 'immutable';

export default function album_tracks(state = Immutable.Map(), action) {
  switch(action.type) {
  case ALBUMS_TRACKS_FETCH_SUCCESS:
    return state.set(action.id, Immutable.List(action.statuses.map((status) => status.id)));
  case ALBUMS_TRACKS_SET:
    return state.set(action.id, action.tracks);
  default:
    return state;
  }
}
