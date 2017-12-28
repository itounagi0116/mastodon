import {
  ALBUMS_TRACKS_FETCH_SUCCESS,
} from '../actions/albums_tracks';

import Immutable from 'immutable';

export default function album_tracks(state = Immutable.Map(), action) {
  switch(action.type) {
  case ALBUMS_TRACKS_FETCH_SUCCESS:
    return state.set(action.id, Immutable.List(action.statuses.map((status) => status.id)));
  default:
    return state;
  }
}
