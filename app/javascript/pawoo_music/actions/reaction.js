import api from '../../mastodon/api';

export const REACTION_REQUEST = 'REACTION_REQUEST';
export const REACTION_SUCCESS = 'REACTION_SUCCESS';
export const REACTION_FAIL = 'REACTION_FAIL';

export const UNREACTION_REQUEST = 'UNREACTION_REQUEST';
export const UNREACTION_SUCCESS = 'UNREACTION_SUCCESS';
export const UNREACTION_FAIL = 'UNREACTION_FAIL';

export function react(status, text) {
  return function (dispatch, getState) {
    dispatch(reactionRequest(status, text));

    api(getState).post(`/api/v1/statuses/${status.get('id')}/react`, { text }).then(({ data }) => {
      dispatch(reactionSuccess(status, text, data));
    }).catch(error => {
      dispatch(reactionFail(status, text, error));
    });
  };
};

export function reactionRequest(status, text) {
  return {
    type: REACTION_REQUEST,
    status,
    text,
  };
};

export function reactionSuccess(status, text, response) {
  return {
    type: REACTION_SUCCESS,
    status,
    text,
    response,
  };
};

export function reactionFail(status, text, error) {
  return {
    type: REACTION_FAIL,
    status,
    text,
    error,
  };
};

export function unreact(status, text) {
  return function (dispatch, getState) {
    dispatch(unreactionRequest(status, text));

    api(getState).post(`/api/v1/statuses/${status.get('id')}/unreact`, { text }).then(({ data }) => {
      dispatch(unreactionSuccess(status, text, data));
    }).catch(error => {
      dispatch(unreactionFail(status, text, error));
    });
  };
};

export function unreactionRequest(status, text) {
  return {
    type: UNREACTION_REQUEST,
    status,
    text,
  };
};

export function unreactionSuccess(status, text, response) {
  return {
    type: UNREACTION_SUCCESS,
    status,
    text,
    response,
  };
};

export function unreactionFail(status, text, error) {
  return {
    type: UNREACTION_FAIL,
    status,
    text,
    error,
  };
};
