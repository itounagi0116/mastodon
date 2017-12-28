import { combineReducers } from 'redux-immutable';
import timelines from './timelines';
import meta from './meta';
import alerts from './alerts';
import { loadingBarReducer } from 'react-redux-loading-bar';
import modal from './modal';
import user_lists from './user_lists';
import accounts from './accounts';
import accounts_counters from './accounts_counters';
import statuses from './statuses';
import relationships from './relationships';
import settings from './settings';
import push_notifications from './push_notifications';
import status_lists from './status_lists';
import cards from './cards';
import reports from './reports';
import trend_tags from './trend_tags';
import suggestion_tags from './suggestion_tags';
import contexts from './contexts';
import compose from './compose';
import search from './search';
import media_attachments from './media_attachments';
import notifications from './notifications';
import height_cache from './height_cache';
import booth_items from './booth_items';
import tips_balloon from './tips_balloon';
import pawoo_music from '../../pawoo_music/reducers';

const reducers = {
  timelines,
  meta,
  alerts,
  loadingBar: loadingBarReducer,
  modal,
  user_lists,
  status_lists,
  accounts,
  accounts_counters,
  statuses,
  relationships,
  settings,
  push_notifications,
  cards,
  reports,
  contexts,
  compose,
  search,
  media_attachments,
  notifications,
  height_cache,
  trend_tags,
  suggestion_tags,
  booth_items,
  tips_balloon,
  pawoo_music,
};

export default combineReducers(reducers);
