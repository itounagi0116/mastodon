import {
  TRACKS_ALBUMS_FETCH_SUCCESS,
} from '../actions/tracks_albums';
import Immutable from 'immutable';

export default function tracks(state = Immutable.Map(), action) {
  switch(action.type) {
  case TRACKS_ALBUMS_FETCH_SUCCESS:
    return state.set(action.id, Immutable.List(action.statuses.map((status) => status.id)));
  default:
    return state;
  }
}
