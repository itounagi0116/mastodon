import { combineReducers } from 'redux-immutable';
import acct_map from './acct_map';
import album_compose from './album_compose';
import track_compose from './track_compose';
import player from './player';
import account_tracks from './account_tracks';
import column from './column';
import timeline from './timeline';
import footer from './footer';

export default combineReducers({
  acct_map,
  album_compose,
  track_compose,
  player,
  account_tracks,
  column,
  timeline,
  footer,
});
