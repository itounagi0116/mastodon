import {
  ALBUMS_TRACKS_SET,
} from '../actions/albums_tracks';
import {
  PLAYER_AUDIO_DESTINATION_NODE_CHANGE,
  PLAYER_AUDIO_SOURCE_NODE_CHANGE,
  PLAYER_DURATION_CHANGE,
  PLAYER_LOADING_CHANGE,
  PLAYER_PAUSED_CHANGE,
  PLAYER_SEEK_DESTINATION_CHANGE,
  PLAYER_TRACK_PATH_CHANGE,
  PLAYER_ALBUM_PATH_CHANGE,
  PLAYER_ALBUM_TRACK_INDEX_CHANGE,
} from '../actions/player';
import Immutable from 'immutable';

const initialState = Immutable.fromJS({
  audio: {
    node: {
      destination: null,
      source: null,
    },
  },
  album: null,
  loading: false,
  paused: true,
  lastSeekDestination: 0,
  time: 0,
  trackPath: null,
});

export default function player(state = initialState, action) {
  switch(action.type) {
  case ALBUMS_TRACKS_SET:
    return Immutable.List(['pawoo_music', 'albums_tracks', action.id]).equals(state.getIn(['album', 'path'])) ?
      initialState : state;
  case PLAYER_AUDIO_DESTINATION_NODE_CHANGE:
    return state.setIn(['audio', 'node', 'destination'], action.audioNode);
  case PLAYER_AUDIO_SOURCE_NODE_CHANGE:
    return state.setIn(['audio', 'node', 'source'], action.audioNode);
  case PLAYER_DURATION_CHANGE:
    return state.set('duration', action.duration);
  case PLAYER_LOADING_CHANGE:
    return state.set('loading', action.loading);
  case PLAYER_PAUSED_CHANGE:
    return state.set('paused', action.paused);
  case PLAYER_SEEK_DESTINATION_CHANGE:
    return state.set('lastSeekDestination', action.time);
  case PLAYER_TRACK_PATH_CHANGE:
    return state.merge({
      trackPath: Immutable.fromJS(action.path),
      album: null,
    });
  case PLAYER_ALBUM_PATH_CHANGE:
    return state.merge({
      trackPath: null,
      album: Immutable.fromJS({
        path: action.path,
        trackIndex: null,
      }),
    });
  case PLAYER_ALBUM_TRACK_INDEX_CHANGE:
    return state.mergeDeep({
      trackPath: Immutable.fromJS(action.path),
      album: { trackIndex: action.index },
    });
  default:
    return state;
  }
}
