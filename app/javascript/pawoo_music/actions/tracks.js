import api from '../../mastodon/api';

export const TRACKS_PLAY = 'TRACKS_PLAY';
export const TRACKS_STOP = 'TRACKS_STOP';
export const TRACKS_GENERATE_REQUEST = 'TRACKS_GENERATE_REQUEST';
export const TRACKS_GENERATE_SUCCESSS = 'TRACKS_GENERATE_SUCCESSS';
export const TRACKS_GENERATE_FAIL = 'TRACKS_GENERATE_FAIL';

export function playTrack(trackId) {
  return {
    type: TRACKS_PLAY,
    value: trackId,
  };
}

export function stopTrack() {
  return {
    type: TRACKS_STOP,
  };
}

export function generateTrackMv(statusId) {
  return function (dispatch, getState) {
    dispatch(generateTrackMvRequest());
    api(getState).post(`/api/v1/tracks/${statusId}/prepare_video`).then(() => {
      dispatch(generateTrackMvSuccess());
    }).catch(error => {
      dispatch(generateTrackMvFail(error));
    });
  };
}

export function generateTrackMvRequest() {
  return {
    type: TRACKS_GENERATE_REQUEST,
    skipLoading: true,
  };
}

export function generateTrackMvSuccess() {
  return {
    type: TRACKS_GENERATE_SUCCESSS,
    skipLoading: true,
  };
}

export function generateTrackMvFail(error) {
  return {
    type: TRACKS_GENERATE_FAIL,
    error,
    skipLoading: true,
  };
}
