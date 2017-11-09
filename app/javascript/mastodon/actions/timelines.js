import api, { getLinks } from '../api';
import Immutable, { Map as ImmutableMap, List as ImmutableList } from 'immutable';
import { fetchRelationships } from './accounts';

export const TIMELINE_UPDATE  = 'TIMELINE_UPDATE';
export const TIMELINE_DELETE  = 'TIMELINE_DELETE';

export const TIMELINE_REFRESH_REQUEST = 'TIMELINE_REFRESH_REQUEST';
export const TIMELINE_REFRESH_SUCCESS = 'TIMELINE_REFRESH_SUCCESS';
export const TIMELINE_REFRESH_FAIL    = 'TIMELINE_REFRESH_FAIL';

export const TIMELINE_EXPAND_REQUEST = 'TIMELINE_EXPAND_REQUEST';
export const TIMELINE_EXPAND_SUCCESS = 'TIMELINE_EXPAND_SUCCESS';
export const TIMELINE_EXPAND_FAIL    = 'TIMELINE_EXPAND_FAIL';

export const TIMELINE_SCROLL_TOP = 'TIMELINE_SCROLL_TOP';

export const TIMELINE_CONNECT    = 'TIMELINE_CONNECT';
export const TIMELINE_DISCONNECT = 'TIMELINE_DISCONNECT';

export function refreshTimelineSuccess(timeline, statuses, skipLoading, next) {
  return {
    type: TIMELINE_REFRESH_SUCCESS,
    timeline,
    statuses,
    skipLoading,
    next,
  };
};

export function updateTimeline(timeline, status) {
  return (dispatch, getState) => {
    const references = status.reblog ? getState().get('statuses').filter((item, itemId) => (itemId === status.reblog.id || item.get('reblog') === status.reblog.id)).map((_, itemId) => itemId) : [];

    if (/.+:music$/.test(timeline)) {
      const accountId = status.reblog ? status.reblog.account.id : status.account.id;

      if (!getState().getIn(['relationships', accountId])) {
        dispatch(fetchRelationships([accountId]));
      }
    }

    dispatch({
      type: TIMELINE_UPDATE,
      timeline,
      status,
      references,
    });
  };
};

export function deleteFromTimelines(id) {
  return (dispatch, getState) => {
    const accountId  = getState().getIn(['statuses', id, 'account']);
    const references = getState().get('statuses').filter(status => status.get('reblog') === id).map(status => [status.get('id'), status.get('account')]);
    const reblogOf   = getState().getIn(['statuses', id, 'reblog'], null);

    dispatch({
      type: TIMELINE_DELETE,
      id,
      accountId,
      references,
      reblogOf,
    });
  };
};

export function refreshTimelineRequest(timeline, skipLoading) {
  return {
    type: TIMELINE_REFRESH_REQUEST,
    timeline,
    skipLoading,
  };
};

export function refreshTimeline(timelineId, path, onlyMusics, params = {}) {
  return function (dispatch, getState) {
    timelineId = onlyMusics ? `${timelineId}:music` : timelineId;
    const timeline = getState().getIn(['timelines', timelineId], ImmutableMap());

    if (timeline.get('isLoading') || timeline.get('online')) {
      return;
    }

    const ids      = timeline.get('items', ImmutableList());
    const newestId = ids.size > 0 ? ids.first() : null;

    let skipLoading = timeline.get('loaded');

    if (newestId !== null) {
      params.since_id = newestId;
    }

    if (onlyMusics) {
      params.only_musics = true;
    }

    dispatch(refreshTimelineRequest(timelineId, skipLoading));

    api(getState).get(path, { params }).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(refreshTimelineSuccess(timelineId, response.data, skipLoading, next ? next.uri : null));

      // ギャラリーではフォロー情報を表示するので一括で取得しておく
      if (onlyMusics) {
        fetchGarellyRelationships(dispatch, response.data, getState);
      }

      // PinnedStatusは表示のために例外的に全件取得する
      dispatchNextPinnedStatusesTimeline(dispatch, timelineId, next);
    }).catch(error => {
      dispatch(refreshTimelineFail(timelineId, error, skipLoading));
    });
  };
};

export const refreshHomeTimeline         = ({ onlyMusics = null } = {}) => refreshTimeline('home', '/api/v1/timelines/home', onlyMusics);
export const refreshPublicTimeline       = ({ onlyMusics = null } = {}) => refreshTimeline('public', '/api/v1/timelines/public', onlyMusics);
export const refreshCommunityTimeline    = ({ onlyMusics = null } = {}) => refreshTimeline('community', '/api/v1/timelines/public', onlyMusics, { local: true });
export const refreshMediaTimeline        = ({ onlyMusics = null } = {}) => refreshTimeline('media', '/api/v1/timelines/public', onlyMusics, { local: true, media: true });
export const refreshAccountTimeline      = (accountId, { onlyMusics = null } = {}) => refreshTimeline(`account:${accountId}`, `/api/v1/accounts/${accountId}/statuses`, onlyMusics);
export const refreshAccountMediaTimeline = (accountId, { onlyMusics = null } = {}) => refreshTimeline(`account:${accountId}:media`, `/api/v1/accounts/${accountId}/statuses`, onlyMusics, { only_media: true });
export const refreshHashtagTimeline      = (hashtag, { onlyMusics = null } = {}) => refreshTimeline(`hashtag:${hashtag}`, `/api/v1/timelines/tag/${hashtag}`, onlyMusics);
export const refreshPinnedStatusTimeline = (accountId, { onlyMusics = null } = {}) => refreshTimeline(`account:${accountId}:pinned_status`, `/api/v1/accounts/${accountId}/pinned_statuses`, onlyMusics);

export function refreshTimelineFail(timeline, error, skipLoading) {
  return {
    type: TIMELINE_REFRESH_FAIL,
    timeline,
    error,
    skipLoading,
    skipAlert: error.response && error.response.status === 404,
  };
};

export function expandTimeline(timelineId, path, onlyMusics, params = {}) {
  return (dispatch, getState) => {
    timelineId = onlyMusics ? `${timelineId}:music` : timelineId;
    const timeline = getState().getIn(['timelines', timelineId], ImmutableMap());
    const ids      = timeline.get('items', ImmutableList());

    if (timeline.get('isLoading') || ids.size === 0) {
      return;
    }

    // pinned_statusはソートがID順ではないので、nextを使う
    if (/account:\d+:pinned_status/.test(timelineId)) {
      const nextUrl = timeline.get('next');

      if (nextUrl) {
        path = nextUrl;
      }
    } else {
      params.max_id = ids.last();
      params.limit  = 10;
    }

    if (onlyMusics) {
      params.only_musics = true;
    }

    dispatch(expandTimelineRequest(timelineId));

    api(getState).get(path, { params }).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(expandTimelineSuccess(timelineId, response.data, next ? next.uri : null));

      // ギャラリーではフォロー情報を表示するので一括で取得しておく
      if (onlyMusics) {
        fetchGarellyRelationships(dispatch, response.data, getState);
      }

      // PinnedStatusは表示のために例外的に全件取得する
      dispatchNextPinnedStatusesTimeline(dispatch, timelineId, next);
    }).catch(error => {
      dispatch(expandTimelineFail(timelineId, error));
    });
  };
};

export const expandHomeTimeline         = ({ onlyMusics = null } = {}) => expandTimeline('home', '/api/v1/timelines/home', onlyMusics);
export const expandPublicTimeline       = ({ onlyMusics = null } = {}) => expandTimeline('public', '/api/v1/timelines/public', onlyMusics);
export const expandCommunityTimeline    = ({ onlyMusics = null } = {}) => expandTimeline('community', '/api/v1/timelines/public', onlyMusics, { local: true });
export const expandMediaTimeline        = ({ onlyMusics = null } = {}) => expandTimeline('media', '/api/v1/timelines/public', onlyMusics, { local: true, media: true });
export const expandAccountTimeline      = (accountId, { onlyMusics = null } = {}) => expandTimeline(`account:${accountId}`, `/api/v1/accounts/${accountId}/statuses`, onlyMusics);
export const expandAccountMediaTimeline = (accountId, { onlyMusics = null } = {}) => expandTimeline(`account:${accountId}:media`, `/api/v1/accounts/${accountId}/statuses`, onlyMusics, { only_media: true });
export const expandHashtagTimeline      = (hashtag, { onlyMusics = null } = {}) => expandTimeline(`hashtag:${hashtag}`, `/api/v1/timelines/tag/${hashtag}`, onlyMusics);
export const expandPinnedStatusesTimeline = (accountId, { onlyMusics = null } = {}) => expandTimeline(`account:${accountId}:pinned_status`, `/api/v1/accounts/${accountId}/pinned_statuses`, onlyMusics);

export function expandTimelineRequest(timeline) {
  return {
    type: TIMELINE_EXPAND_REQUEST,
    timeline,
  };
};

export function expandTimelineSuccess(timeline, statuses, next) {
  return {
    type: TIMELINE_EXPAND_SUCCESS,
    timeline,
    statuses,
    next,
  };
};

export function expandTimelineFail(timeline, error) {
  return {
    type: TIMELINE_EXPAND_FAIL,
    timeline,
    error,
  };
};

export function scrollTopTimeline(timeline, top) {
  return {
    type: TIMELINE_SCROLL_TOP,
    timeline,
    top,
  };
};

export function connectTimeline(timeline) {
  return {
    type: TIMELINE_CONNECT,
    timeline,
  };
};

export function disconnectTimeline(timeline) {
  return {
    type: TIMELINE_DISCONNECT,
    timeline,
  };
};

// PinnedStatusは表示のために例外的に全件取得する
// 数件のpinしか存在しないユーザーなら、1度目のリクエストで完了している。
// 今後、アクセスが多いかつ大量のPinnedStatusをもつアカウントが現れたら、実装方法を変えるかもしれない
function dispatchNextPinnedStatusesTimeline(dispatch, timelineId, next) {
  let matched = timelineId.match(/^account:(\d+):pinned_status$/);

  if (matched && next) {
    const accountId = matched[1];
    setTimeout(() => dispatch(expandPinnedStatusesTimeline(accountId)), 300);
  }
}

export function fetchGarellyRelationships(dispatch, statuses, getState) {
  const me = getState().getIn(['meta', 'me']);
  if (!me) {
    return;
  }

  const accountIds = Immutable.Set(statuses.map((status) => (status.reblog ? status.reblog.account.id : status.account.id)));
  const filteredAccountIds = accountIds.subtract(getState().get('relationships').keys()).delete(me);

  if (filteredAccountIds.size > 0) {
    dispatch(fetchRelationships(filteredAccountIds.toArray()));
  }
}
