import api, { getLinks } from '../api';
import { fetchGarellyRelationships } from './timelines';

export const FAVOURITED_STATUSES_FETCH_REQUEST = 'FAVOURITED_STATUSES_FETCH_REQUEST';
export const FAVOURITED_STATUSES_FETCH_SUCCESS = 'FAVOURITED_STATUSES_FETCH_SUCCESS';
export const FAVOURITED_STATUSES_FETCH_FAIL    = 'FAVOURITED_STATUSES_FETCH_FAIL';

export const FAVOURITED_STATUSES_EXPAND_REQUEST = 'FAVOURITED_STATUSES_EXPAND_REQUEST';
export const FAVOURITED_STATUSES_EXPAND_SUCCESS = 'FAVOURITED_STATUSES_EXPAND_SUCCESS';
export const FAVOURITED_STATUSES_EXPAND_FAIL    = 'FAVOURITED_STATUSES_EXPAND_FAIL';

export function fetchFavouritedStatuses({ onlyMusics = null } = {}) {
  return (dispatch, getState) => {
    dispatch(fetchFavouritedStatusesRequest(onlyMusics));

    const params = {};
    if (onlyMusics) {
      params.only_musics = true;
    }

    api(getState).get('/api/v1/favourites', { params }).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(fetchFavouritedStatusesSuccess(response.data, next ? next.uri : null, onlyMusics));

      // ギャラリーではフォロー情報を表示するので一括で取得しておく
      if (onlyMusics) {
        fetchGarellyRelationships(dispatch, response.data, getState);
      }
    }).catch(error => {
      dispatch(fetchFavouritedStatusesFail(error, onlyMusics));
    });
  };
};

export function fetchFavouritedStatusesRequest(onlyMusics) {
  return {
    type: FAVOURITED_STATUSES_FETCH_REQUEST,
    onlyMusics,
  };
};

export function fetchFavouritedStatusesSuccess(statuses, next, onlyMusics) {
  return {
    type: FAVOURITED_STATUSES_FETCH_SUCCESS,
    statuses,
    next,
    onlyMusics,
  };
};

export function fetchFavouritedStatusesFail(error, onlyMusics) {
  return {
    type: FAVOURITED_STATUSES_FETCH_FAIL,
    error,
    onlyMusics,
  };
};

export function expandFavouritedStatuses({ onlyMusics = null } = {}) {
  return (dispatch, getState) => {
    const url = getState().getIn(['status_lists', (onlyMusics ? 'favourites:music' : 'favourites'), 'next'], null);

    if (url === null) {
      return;
    }

    dispatch(expandFavouritedStatusesRequest(onlyMusics));

    api(getState).get(url).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(expandFavouritedStatusesSuccess(response.data, next ? next.uri : null, onlyMusics));

      // ギャラリーではフォロー情報を表示するので一括で取得しておく
      if (onlyMusics) {
        fetchGarellyRelationships(dispatch, response.data, getState);
      }
    }).catch(error => {
      dispatch(expandFavouritedStatusesFail(error, onlyMusics));
    });
  };
};

export function expandFavouritedStatusesRequest(onlyMusics) {
  return {
    type: FAVOURITED_STATUSES_EXPAND_REQUEST,
    onlyMusics,
  };
};

export function expandFavouritedStatusesSuccess(statuses, next, onlyMusics) {
  return {
    type: FAVOURITED_STATUSES_EXPAND_SUCCESS,
    statuses,
    next,
    onlyMusics,
  };
};

export function expandFavouritedStatusesFail(error, onlyMusics) {
  return {
    type: FAVOURITED_STATUSES_EXPAND_FAIL,
    error,
    onlyMusics,
  };
};
