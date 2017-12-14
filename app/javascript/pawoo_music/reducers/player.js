import {
  PLAYER_AUDIO_CONTEXT_CHANGE,
  PLAYER_AUDIO_DESTINATION_NODE_CHANGE,
  PLAYER_AUDIO_SOURCE_NODE_CHANGE,
  PLAYER_CURRENT_TIME_GETTER_CHANGE,
  PLAYER_DURATION_CHANGE,
  PLAYER_LOADING_CHANGE,
  PLAYER_PAUSED_CHANGE,
  PLAYER_SEEK_DESTINATION_CHANGE,
  PLAYER_TRACK_PATH_CHANGE,
} from '../actions/player';
import Immutable from 'immutable';

const initialState = Immutable.fromJS({
  audio: {
    context: null,
    node: {
      destination: null,
      source: null,
    },
  },
  getCurrentTime: null,
  loading: false,
  paused: true,
  lastSeekDestination: 0,
  time: 0,
  trackPath: null,
});

export default function player(state = initialState, action) {
  switch(action.type) {
  case PLAYER_AUDIO_CONTEXT_CHANGE:
    return state.setIn(['audio', 'context'], action.audioContext);
  case PLAYER_AUDIO_DESTINATION_NODE_CHANGE:
    return state.setIn(['audio', 'node', 'destination'], action.audioNode);
  case PLAYER_AUDIO_SOURCE_NODE_CHANGE:
    return state.setIn(['audio', 'node', 'source'], action.audioNode);
  case PLAYER_CURRENT_TIME_GETTER_CHANGE:
    return state.set('getCurrentTime', action.getCurrentTime);
  case PLAYER_DURATION_CHANGE:
    return state.set('duration', action.duration);
  case PLAYER_LOADING_CHANGE:
    return state.set('loading', action.loading);
  case PLAYER_PAUSED_CHANGE:
    return state.set('paused', action.paused);
  case PLAYER_SEEK_DESTINATION_CHANGE:
    return state.set('lastSeekDestination', action.time);
  case PLAYER_TRACK_PATH_CHANGE:
    return state.set('trackPath', Immutable.fromJS(action.path));
  default:
    return state;
  }
}
