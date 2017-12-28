import { combineReducers } from 'redux-immutable';
import acct_map from './acct_map';
import album_compose from './album_compose';
import track_compose from './track_compose';
import albums_tracks from './albums_tracks';
import tracks_albums from './tracks_albums';
import account_gallery from './account_gallery';
import player from './player';
import column from './column';
import timeline from './timeline';
import footer from './footer';

export default combineReducers({
  acct_map,
  album_compose,
  track_compose,
  albums_tracks,
  tracks_albums,
  account_gallery,
  player,
  column,
  timeline,
  footer,
});
