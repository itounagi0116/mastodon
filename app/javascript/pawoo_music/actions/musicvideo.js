export const MUSICVIDEO_GENERATION_REQUEST = 'MUSICVIDEO_GENERATION_REQUEST';
export const MUSICVIDEO_GENERATION_SUCCESSS = 'MUSICVIDEO_GENERATION_SUCCESSS';
export const MUSICVIDEO_GENERATION_FAIL = 'MUSICVIDEO_GENERATION_FAIL';

import api from '../../mastodon/api';

export function generateMusicvideo(statusId, resolution) {
  return function (dispatch, getState) {
    dispatch(generateMusicvideoRequest());
    api(getState).post(`/api/v1/tracks/${statusId}/prepare_video`, { resolution }).then(() => {
      dispatch(generateMusicvideoSuccess());
    }).catch(error => {
      dispatch(generateMusicvideoFail(error));
    });
  };
}

export function generateMusicvideoRequest() {
  return {
    type: MUSICVIDEO_GENERATION_REQUEST,
    skipLoading: true,
  };
}

export function generateMusicvideoSuccess() {
  return {
    type: MUSICVIDEO_GENERATION_SUCCESSS,
    skipLoading: true,
  };
}

export function generateMusicvideoFail(error) {
  return {
    type: MUSICVIDEO_GENERATION_FAIL,
    error,
    skipLoading: true,
  };
}
