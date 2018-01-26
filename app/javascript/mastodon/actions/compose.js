import api from '../api';
import PawooGA from '../../pawoo/actions/ga';

import { openModal } from './modal';
import { addScheduledStatuses } from '../../pawoo_music/actions/schedules';
import {
  updateTimeline,
  refreshHomeTimeline,
  refreshCommunityTimeline,
  refreshPublicTimeline,
} from './timelines';

const pawooGaCategory = 'Compose';

export const COMPOSE_CHANGE          = 'COMPOSE_CHANGE';
export const COMPOSE_SUBMIT_REQUEST  = 'COMPOSE_SUBMIT_REQUEST';
export const COMPOSE_SUBMIT_SUCCESS  = 'COMPOSE_SUBMIT_SUCCESS';
export const COMPOSE_SUBMIT_FAIL     = 'COMPOSE_SUBMIT_FAIL';
export const COMPOSE_REPLY           = 'COMPOSE_REPLY';
export const COMPOSE_REPLY_CANCEL    = 'COMPOSE_REPLY_CANCEL';
export const COMPOSE_MENTION         = 'COMPOSE_MENTION';
export const COMPOSE_UPLOAD_REQUEST  = 'COMPOSE_UPLOAD_REQUEST';
export const COMPOSE_UPLOAD_SUCCESS  = 'COMPOSE_UPLOAD_SUCCESS';
export const COMPOSE_UPLOAD_FAIL     = 'COMPOSE_UPLOAD_FAIL';
export const COMPOSE_UPLOAD_PROGRESS = 'COMPOSE_UPLOAD_PROGRESS';
export const COMPOSE_UPLOAD_UNDO     = 'COMPOSE_UPLOAD_UNDO';

export const COMPOSE_SUGGESTIONS_CLEAR = 'COMPOSE_SUGGESTIONS_CLEAR';
export const COMPOSE_SUGGESTIONS_READY = 'COMPOSE_SUGGESTIONS_READY';
export const COMPOSE_SUGGESTION_SELECT = 'COMPOSE_SUGGESTION_SELECT';

export const COMPOSE_HASH_TAG_CLEAR = 'COMPOSE_HASH_TAG_CLEAR';
export const COMPOSE_HASH_TAG_READY = 'COMPOSE_HASH_TAG_READY';
export const COMPOSE_HASH_TAG_SELECT = 'COMPOSE_HASH_TAG_SELECT';

export const COMPOSE_MOUNT   = 'COMPOSE_MOUNT';
export const COMPOSE_UNMOUNT = 'COMPOSE_UNMOUNT';

export const COMPOSE_DATE_TIME_CHANGE = 'COMPOSE_DATE_TIME_CHANGE';
export const COMPOSE_SENSITIVITY_CHANGE = 'COMPOSE_SENSITIVITY_CHANGE';
export const COMPOSE_SPOILERNESS_CHANGE = 'COMPOSE_SPOILERNESS_CHANGE';
export const COMPOSE_SPOILER_TEXT_CHANGE = 'COMPOSE_SPOILER_TEXT_CHANGE';
export const COMPOSE_VISIBILITY_CHANGE  = 'COMPOSE_VISIBILITY_CHANGE';
export const COMPOSE_LISTABILITY_CHANGE = 'COMPOSE_LISTABILITY_CHANGE';
export const COMPOSE_COMPOSING_CHANGE = 'COMPOSE_COMPOSING_CHANGE';

export const COMPOSE_EMOJI_INSERT = 'COMPOSE_EMOJI_INSERT';
export const COMPOSE_TAG_INSERT = 'COMPOSE_TAG_INSERT';

export const COMPOSE_FILE_KEY_RESET = 'COMPOSE_FILE_KEY_RESET';

export const COMPOSE_BACKUPDATA_SAVE = 'COMPOSE_BACKUPDATA_SAVE';
export const COMPOSE_BACKUPDATA_SAVE_AND_CLEAR = 'COMPOSE_BACKUPDATA_SAVE_AND_CLEAR';
export const COMPOSE_BACKUPDATA_RESTORE = 'COMPOSE_BACKUPDATA_RESTORE';
export const COMPOSE_BACKUPDATA_RESET = 'COMPOSE_BACKUPDATA_RESET';

export const SELECT_MUSIC_FILE_FAIL = 'SELECT_MUSIC_FILE_FAIL';

export function changeCompose(text) {
  return {
    type: COMPOSE_CHANGE,
    text: text,
  };
};

export function replyCompose(status) {
  return (dispatch) => {
    PawooGA.event({ category: pawooGaCategory, action: 'OpenReply' });

    dispatch({
      type: COMPOSE_REPLY,
      status: status,
    });
    dispatch(openModal('STATUS_FORM', {}));
  };
};

export function cancelReplyCompose() {
  return {
    type: COMPOSE_REPLY_CANCEL,
  };
};

export function mentionCompose(account) {
  return (dispatch) => {
    PawooGA.event({ category: pawooGaCategory, action: 'OpenMention' });

    dispatch({
      type: COMPOSE_MENTION,
      account: account,
    });
    dispatch(openModal('STATUS_FORM', {}));
  };
};

export function openModalFormCompose() {
  return (dispatch) => {
    PawooGA.event({ category: pawooGaCategory, action: 'OpenStatusFormModal' });

    dispatch(saveAndClearBackupData());
    dispatch(openModal('STATUS_FORM', {}));
  };
};

export function submitCompose() {
  return function (dispatch, getState) {
    const status = getState().getIn(['compose', 'text'], '');
    const published = getState().getIn(['compose', 'published']);

    if (!status || !status.length) {
      return;
    }

    dispatch(submitComposeRequest());

    PawooGA.event({ category: pawooGaCategory, action: 'Submit' });

    api(getState).post('/api/v1/statuses', {
      status,
      in_reply_to_id: getState().getIn(['compose', 'in_reply_to'], null),
      media_ids: getState().getIn(['compose', 'media_attachments']).map(item => item.get('id')),
      sensitive: getState().getIn(['compose', 'sensitive']),
      spoiler_text: getState().getIn(['compose', 'spoiler_text'], ''),
      visibility: getState().getIn(['compose', 'privacy']),
      published: published,
    }, {
      headers: {
        'Idempotency-Key': getState().getIn(['compose', 'idempotencyKey']),
      },
    }).then(function (response) {
      dispatch(submitComposeSuccess({ ...response.data }));

      // To make the app more responsive, immediately get the status into the columns

      const insertOrRefresh = (timelineId, refreshAction) => {
        if (getState().getIn(['timelines', timelineId, 'online'])) {
          dispatch(updateTimeline(timelineId, { ...response.data }));
        } else if (getState().getIn(['timelines', timelineId, 'loaded'])) {
          dispatch(refreshAction());
        }
      };

      insertOrRefresh('home', refreshHomeTimeline);

      // Make the schedule list responsive as well
      if (published) {
        dispatch(addScheduledStatuses([response.data]));
      }

      if (response.data.in_reply_to_id === null && response.data.visibility === 'public') {
        insertOrRefresh('community', refreshCommunityTimeline);
        insertOrRefresh('public', refreshPublicTimeline);
      }

      const statusTags = response.data.tags.map(it => it.name);
      let tags = JSON.parse(localStorage.getItem('hash_tag_history'));
      if (tags === null) {
        tags = statusTags;
      } else {
        tags = tags.filter(it => !statusTags.includes(it));
        tags.unshift(...statusTags);
      }
      const maxSize = 1000;
      tags = tags.slice(0, maxSize);

      const data = JSON.stringify(tags);
      try {
        localStorage.setItem('hash_tag_history', data);
      } catch (e) {
        //ignore
      }
    }).catch(function (error) {
      dispatch(submitComposeFail(error));
    });
  };
};

export function submitComposeRequest() {
  return {
    type: COMPOSE_SUBMIT_REQUEST,
  };
};

export function submitComposeSuccess(status) {
  return {
    type: COMPOSE_SUBMIT_SUCCESS,
    status: status,
  };
};

export function submitComposeFail(error) {
  return {
    type: COMPOSE_SUBMIT_FAIL,
    error: error,
  };
};

const requestedImageCaches = [];
export function requestImageCache(url) {
  return function (dispatch, getState) {
    // pixiv image cache
    if (requestedImageCaches.indexOf(url) === -1) {
      requestedImageCaches.push(url);
      const data = new FormData();
      data.append('url', url);
      api(getState).post('/api/v1/pixiv_twitter_images', data).catch(() => {
        requestedImageCaches.splice(requestedImageCaches.indexOf(url), 1);
      });
    }
  };
}

export function uploadCompose(files) {
  if (files.length === 1 && files[0].type === 'audio/mp3') {
    return selectMusicFile(files[0]);
  }

  return function (dispatch, getState) {
    if (getState().getIn(['compose', 'media_attachments']).size > 3) {
      return;
    }

    dispatch(uploadComposeRequest());

    PawooGA.event({ category: pawooGaCategory, action: 'Upload' });

    let data = new FormData();
    data.append('file', files[0]);

    api(getState).post('/api/v1/media', data, {
      onUploadProgress: function (e) {
        dispatch(uploadComposeProgress(e.loaded, e.total));
      },
    }).then(function (response) {
      dispatch(uploadComposeSuccess(response.data));
    }).catch(function (error) {
      dispatch(uploadComposeFail(error));
    });
  };
};

export function uploadMusicCompose(payload) {
  return function (dispatch, getState) {
    dispatch(uploadComposeRequest());

    const data = new FormData();
    Object.keys(payload).forEach((key) => data.append(key, payload[key]));

    api(getState).post('/api/v1/music', data, {
      onUploadProgress: function (e) {
        dispatch(uploadComposeProgress(e.loaded, e.total));
      },
    }).then(function (response) {
      dispatch(uploadComposeSuccess(response.data));
    }).catch(function (error) {
      dispatch(uploadComposeFail(error));
    });
  };
};

export function uploadComposeRequest() {
  return {
    type: COMPOSE_UPLOAD_REQUEST,
    skipLoading: true,
  };
};

export function uploadComposeProgress(loaded, total) {
  return {
    type: COMPOSE_UPLOAD_PROGRESS,
    loaded: loaded,
    total: total,
  };
};

export function uploadComposeSuccess(media) {
  return {
    type: COMPOSE_UPLOAD_SUCCESS,
    media: media,
    skipLoading: true,
  };
};

export function uploadComposeFail(error) {
  return {
    type: COMPOSE_UPLOAD_FAIL,
    error: error,
    skipLoading: true,
  };
};

export function undoUploadCompose(media_id) {
  return {
    type: COMPOSE_UPLOAD_UNDO,
    media_id: media_id,
  };
};

export function clearComposeSuggestions() {
  return {
    type: COMPOSE_SUGGESTIONS_CLEAR,
  };
};

export function clearComposeHashTagSuggestions() {
  return {
    type: COMPOSE_HASH_TAG_CLEAR,
  };
};

export function fetchComposeSuggestions(token) {
  return (dispatch, getState) => {
    api(getState).get('/api/v1/accounts/search', {
      params: {
        q: token,
        resolve: false,
        limit: 4,
      },
    }).then(response => {
      dispatch(readyComposeSuggestions(token, response.data));
    });
  };
};

export function fetchComposeHashTagSuggestions(token) {
  return (dispatch) => {
    const tags = JSON.parse(localStorage.getItem('hash_tag_history')) || [];
    const suggestionMaxSize = 4;
    const suggestions = tags.filter(it => it.startsWith(token)).slice(0, suggestionMaxSize);
    dispatch(readyComposeHashTagSuggestions(token, suggestions));
  };
};

export function readyComposeSuggestions(token, accounts) {
  return {
    type: COMPOSE_SUGGESTIONS_READY,
    token,
    accounts,
  };
};

export function readyComposeHashTagSuggestions(token, tags) {
  return {
    type: COMPOSE_HASH_TAG_READY,
    token,
    tags,
  };
}

export function selectComposeSuggestion(position, token, accountId) {
  return (dispatch, getState) => {
    const completion = getState().getIn(['accounts', accountId, 'acct']);

    dispatch({
      type: COMPOSE_SUGGESTION_SELECT,
      position,
      token,
      completion,
    });
  };
};

export function selectComposeHashTagSuggestion(position, token, tag) {
  return {
    type: COMPOSE_HASH_TAG_SELECT,
    position,
    token,
    completion: tag,
  };
}

export function mountCompose() {
  return {
    type: COMPOSE_MOUNT,
  };
};

export function unmountCompose() {
  return {
    type: COMPOSE_UNMOUNT,
  };
};

export function changeComposeDateTime(value) {
  return {
    type: COMPOSE_DATE_TIME_CHANGE,
    value,
  };
};

export function changeComposeSensitivity() {
  return {
    type: COMPOSE_SENSITIVITY_CHANGE,
  };
};

export function changeComposeSpoilerness() {
  return {
    type: COMPOSE_SPOILERNESS_CHANGE,
  };
};

export function changeComposeSpoilerText(text) {
  return {
    type: COMPOSE_SPOILER_TEXT_CHANGE,
    text,
  };
};

export function changeComposeVisibility(value) {
  return {
    type: COMPOSE_VISIBILITY_CHANGE,
    value,
  };
};

export function insertEmojiCompose(position, emoji) {
  return {
    type: COMPOSE_EMOJI_INSERT,
    position,
    emoji,
  };
};

export function insertTagCompose(tag) {
  return {
    type: COMPOSE_TAG_INSERT,
    tag,
  };
}

export function resetFileKeyCompose() {
  return {
    type: COMPOSE_FILE_KEY_RESET,
  };
}

export function selectMusicFile(file) {
  return (dispatch) => {
    dispatch(openModal('MUSIC', {
      music: file,
      onUpload(payload) {
        dispatch(uploadMusicCompose(payload));
      },
      onResetFileKey() {
        dispatch(resetFileKeyCompose());
      },
    }));
  };
};

export function selectMusicFileFail(error) {
  return {
    type: SELECT_MUSIC_FILE_FAIL,
    error: error,
  };
};

export function saveBackupData() {
  return {
    type: COMPOSE_BACKUPDATA_SAVE,
  };
};

export function saveAndClearBackupData() {
  return {
    type: COMPOSE_BACKUPDATA_SAVE_AND_CLEAR,
  };
};

export function restoreBackupData() {
  return {
    type: COMPOSE_BACKUPDATA_RESTORE,
  };
};

export function resetBackupData() {
  return {
    type: COMPOSE_BACKUPDATA_RESET,
  };
};

export function changeComposing(value) {
  return {
    type: COMPOSE_COMPOSING_CHANGE,
    value,
  };
}
