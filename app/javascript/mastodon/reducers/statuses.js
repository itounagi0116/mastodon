import {
  REBLOG_REQUEST,
  REBLOG_SUCCESS,
  REBLOG_FAIL,
  UNREBLOG_SUCCESS,
  FAVOURITE_REQUEST,
  FAVOURITE_SUCCESS,
  FAVOURITE_FAIL,
  UNFAVOURITE_SUCCESS,
  PIN_SUCCESS,
  UNPIN_SUCCESS,
} from '../actions/interactions';
import {
  STATUS_FETCH_SUCCESS,
  CONTEXT_FETCH_SUCCESS,
  STATUS_MUTE_SUCCESS,
  STATUS_UNMUTE_SUCCESS,
} from '../actions/statuses';
import {
  TIMELINE_REFRESH_SUCCESS,
  TIMELINE_UPDATE,
  TIMELINE_DELETE,
  TIMELINE_EXPAND_SUCCESS,
} from '../actions/timelines';
import {
  ACCOUNT_BLOCK_SUCCESS,
} from '../actions/accounts';
import {
  NOTIFICATIONS_UPDATE,
  NOTIFICATIONS_REFRESH_SUCCESS,
  NOTIFICATIONS_EXPAND_SUCCESS,
} from '../actions/notifications';
import {
  FAVOURITED_STATUSES_FETCH_SUCCESS,
  FAVOURITED_STATUSES_EXPAND_SUCCESS,
} from '../actions/favourites';
import {
  PINNED_STATUSES_FETCH_SUCCESS,
} from '../actions/pin_statuses';
import { SEARCH_FETCH_SUCCESS } from '../actions/search';
import {
  REACTION_REQUEST,
  REACTION_SUCCESS,
  REACTION_FAIL,
  UNREACTION_REQUEST,
  UNREACTION_SUCCESS,
  UNREACTION_FAIL,
} from '../../pawoo_music/actions/reaction';
import {
  SCHEDULED_STATUSES_FETCH_SUCCESS,
  SCHEDULED_STATUSES_EXPAND_SUCCESS,
  SCHEDULED_STATUSES_ADDITION,
} from '../../pawoo_music/actions/schedules';
import {
  ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_SUCCESS,
  ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_SUCCESS,
} from '../../pawoo_music/actions/album_compose';
import {
  ALBUMS_TRACKS_FETCH_SUCCESS,
} from '../../pawoo_music/actions/albums_tracks';
import {
  TRACKS_ALBUMS_FETCH_SUCCESS,
} from '../../pawoo_music/actions/tracks_albums';
import emojify from '../emoji';
import { Map as ImmutableMap, fromJS } from 'immutable';
import escapeTextContentForBrowser from 'escape-html';

const domParser = new DOMParser();

const normalizeStatus = (state, status) => {
  if (!status) {
    return state;
  }

  const normalStatus   = { ...status };
  normalStatus.account = status.account.id;

  if (status.reblog && status.reblog.id) {
    state               = normalizeStatus(state, status.reblog);
    normalStatus.reblog = status.reblog.id;
  }

  if (status.track) {
    normalStatus.track.id = status.id;
    normalStatus.track.contentHtml = emojify(normalStatus.track.content);
  }

  if (status.album) {
    normalStatus.album.id = status.id;
    normalStatus.album.contentHtml = emojify(normalStatus.album.content);
  }

  const searchContent = [status.spoiler_text, status.content].join(' ').replace(/<br \/>/g, '\n').replace(/<\/p><p>/g, '\n\n');
  normalStatus.search_index = domParser.parseFromString(searchContent, 'text/html').documentElement.textContent;
  normalStatus.contentHtml = emojify(normalStatus.content);
  normalStatus.spoilerHtml = emojify(escapeTextContentForBrowser(normalStatus.spoiler_text || ''));

  return state.update(status.id, ImmutableMap(), map => map.withMutations(mutable => {
    mutable.delete('track');
    mutable.mergeDeep(fromJS(normalStatus));
  }));
};

const normalizeStatuses = (state, statuses) => {
  statuses.forEach(status => {
    state = normalizeStatus(state, status);
  });

  return state;
};

const deleteStatus = (state, id, references) => {
  references.forEach(ref => {
    state = deleteStatus(state, ref[0], []);
  });

  return state.delete(id);
};

const filterStatuses = (state, relationship) => {
  state.forEach(status => {
    if (status.get('account') !== relationship.id) {
      return;
    }

    state = deleteStatus(state, status.get('id'), state.filter(item => item.get('reblog') === status.get('id')));
  });

  return state;
};

function addReactionToStatus(state, status, text) {
  const id = status.get('id');
  const reactions = state.getIn([id, 'track', 'reactions']);
  const index = reactions.findIndex(reaction => reaction.get('text') === text);

  if (index < 0) {
    return state.setIn([id, 'track', 'reactions'],
      reactions.push(ImmutableMap({ text, accounts_count: 1, reacted: true })));
  }

  const reaction = reactions.get(index);

  return state.setIn([id, 'track', 'reactions', index], reaction.merge([
    ['accounts_count', reaction.get('accounts_count') + 1],
    ['reacted', true],
  ]));
}

function removeReactionFromStatus(state, status, text) {
  const id = status.get('id');
  const reactions = state.getIn([id, 'track', 'reactions']);
  const index = reactions.findIndex(reaction => reaction.get('text') === text);
  const reaction = reactions.get(index);
  const count = reaction.get('accounts_count');

  return count > 1 ? state.setIn([id, 'track', 'reactions', index], reaction.merge([
    ['accounts_count', count - 1],
    ['reacted', false],
  ])) : state.deleteIn([id, 'track', 'reactions', index]);
}

const initialState = ImmutableMap();

export default function statuses(state = initialState, action) {
  switch(action.type) {
  case TIMELINE_UPDATE:
  case STATUS_FETCH_SUCCESS:
  case NOTIFICATIONS_UPDATE:
    return normalizeStatus(state, action.status);
  case REBLOG_SUCCESS:
  case UNREBLOG_SUCCESS:
  case FAVOURITE_SUCCESS:
  case UNFAVOURITE_SUCCESS:
  case PIN_SUCCESS:
  case UNPIN_SUCCESS:
  case REACTION_SUCCESS:
  case UNREACTION_SUCCESS:
    return normalizeStatus(state, action.response);
  case FAVOURITE_REQUEST:
    return state.setIn([action.status.get('id'), 'favourited'], true);
  case FAVOURITE_FAIL:
    return state.setIn([action.status.get('id'), 'favourited'], false);
  case REACTION_REQUEST:
  case UNREACTION_FAIL:
    return addReactionToStatus(state, action.status, action.text);
  case REACTION_FAIL:
  case UNREACTION_REQUEST:
    return removeReactionFromStatus(state, action.status, action.text);
  case REBLOG_REQUEST:
    return state.setIn([action.status.get('id'), 'reblogged'], true);
  case REBLOG_FAIL:
    return state.setIn([action.status.get('id'), 'reblogged'], false);
  case STATUS_MUTE_SUCCESS:
    return state.setIn([action.id, 'muted'], true);
  case STATUS_UNMUTE_SUCCESS:
    return state.setIn([action.id, 'muted'], false);
  case TIMELINE_REFRESH_SUCCESS:
  case TIMELINE_EXPAND_SUCCESS:
  case CONTEXT_FETCH_SUCCESS:
  case NOTIFICATIONS_REFRESH_SUCCESS:
  case NOTIFICATIONS_EXPAND_SUCCESS:
  case FAVOURITED_STATUSES_FETCH_SUCCESS:
  case FAVOURITED_STATUSES_EXPAND_SUCCESS:
  case PINNED_STATUSES_FETCH_SUCCESS:
  case SEARCH_FETCH_SUCCESS:
  case SCHEDULED_STATUSES_FETCH_SUCCESS:
  case SCHEDULED_STATUSES_EXPAND_SUCCESS:
  case SCHEDULED_STATUSES_ADDITION:
  case ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_SUCCESS:
  case ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_SUCCESS:
  case ALBUMS_TRACKS_FETCH_SUCCESS:
  case TRACKS_ALBUMS_FETCH_SUCCESS:
    return normalizeStatuses(state, action.statuses);
  case TIMELINE_DELETE:
    return deleteStatus(state, action.id, action.references);
  case ACCOUNT_BLOCK_SUCCESS:
    return filterStatuses(state, action.relationship);
  default:
    return state;
  }
};
