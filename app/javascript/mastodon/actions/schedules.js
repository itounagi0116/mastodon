import api, { getLinks } from '../api';

export const SCHEDULED_STATUSES_FETCH_REQUEST = 'SCHEDULED_STATUSES_FETCH_REQUEST';
export const SCHEDULED_STATUSES_FETCH_SUCCESS = 'SCHEDULED_STATUSES_FETCH_SUCCESS';
export const SCHEDULED_STATUSES_FETCH_FAIL    = 'SCHEDULED_STATUSES_FETCH_FAIL';

export const SCHEDULED_STATUSES_EXPAND_REQUEST = 'SCHEDULED_STATUSES_EXPAND_REQUEST';
export const SCHEDULED_STATUSES_EXPAND_SUCCESS = 'SCHEDULED_STATUSES_EXPAND_SUCCESS';
export const SCHEDULED_STATUSES_EXPAND_FAIL    = 'SCHEDULED_STATUSES_EXPAND_FAIL';

export const SCHEDULED_STATUSES_ADDITION = 'SCHEDULED_STATUSES_ADDITION';

export function fetchScheduledStatuses() {
  return (dispatch, getState) => {
    dispatch(fetchScheduledStatusesRequest());

    api(getState).get('/api/v1/schedules').then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(fetchScheduledStatusesSuccess(response.data, next ? next.uri : null));
    }).catch(error => {
      dispatch(fetchScheduledStatusesFail(error));
    });
  };
};

export function fetchScheduledStatusesRequest() {
  return {
    type: SCHEDULED_STATUSES_FETCH_REQUEST,
  };
};

export function fetchScheduledStatusesSuccess(statuses, next) {
  return {
    type: SCHEDULED_STATUSES_FETCH_SUCCESS,
    statuses,
    next,
  };
};

export function fetchScheduledStatusesFail(error) {
  return {
    type: SCHEDULED_STATUSES_FETCH_FAIL,
    error,
  };
};

export function addScheduledStatuses(statuses) {
  return (dispatch, getState) => {
    dispatch({
      type: SCHEDULED_STATUSES_ADDITION,
      statuses,
      allStatuses: getState().get('statuses'),
    });
  };
};

export function expandScheduledStatuses() {
  return (dispatch, getState) => {
    const url = getState().getIn(['status_lists', 'schedules', 'next'], null);

    if (url === null) {
      return;
    }

    dispatch(expandScheduledStatusesRequest());

    api(getState).get(url).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(expandScheduledStatusesSuccess(response.data, next ? next.uri : null));
    }).catch(error => {
      dispatch(expandScheduledStatusesFail(error));
    });
  };
};

export function expandScheduledStatusesRequest() {
  return {
    type: SCHEDULED_STATUSES_EXPAND_REQUEST,
  };
};

export function expandScheduledStatusesSuccess(statuses, next) {
  return {
    type: SCHEDULED_STATUSES_EXPAND_SUCCESS,
    statuses,
    next,
  };
};

export function expandScheduledStatusesFail(error) {
  return {
    type: SCHEDULED_STATUSES_EXPAND_FAIL,
    error,
  };
};
