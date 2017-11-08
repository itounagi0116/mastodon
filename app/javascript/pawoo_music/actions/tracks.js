import api from '../../mastodon/api';

export const TRACKS_PLAY = 'TRACKS_PLAY';
export const TRACKS_STOP = 'TRACKS_STOP';
export const TRACKS_GENERATE_REQUEST = 'TRACKS_GENERATE_REQUEST';
export const TRACKS_GENERATE_SUCCESS = 'TRACKS_GENERATE_SUCCESS';
export const TRACKS_GENERATE_FAIL = 'TRACKS_GENERATE_FAIL';
export const TRACKS_FETCH_CONTAINED_ALBUMS_REQUEST = 'TRACKS_FETCH_CONTAINED_ALBUMS_REQUEST';
export const TRACKS_FETCH_CONTAINED_ALBUMS_SUCCESS = 'TRACKS_FETCH_CONTAINED_ALBUMS_SUCCESS';
export const TRACKS_FETCH_CONTAINED_ALBUMS_FAIL = 'TRACKS_FETCH_CONTAINED_ALBUMS_FAIL';

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

export function generateTrackMv(statusId, resolution) {
  return function (dispatch, getState) {
    dispatch(generateTrackMvRequest());
    api(getState).post(`/api/v1/tracks/${statusId}/prepare_video`, { resolution }).then(() => {
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
    type: TRACKS_GENERATE_SUCCESS,
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

export function fetchContainedAlbums(id) {
  return function (dispatch, getState) {
    dispatch(fetchContainedAlbumsRequest());
    api(getState).get(`/api/v1/tracks/${id}/albums`).then((response) => {
      dispatch(fetchContainedAlbumsSuccess(id, response.data));
    }).catch(error => {
      dispatch(fetchContainedAlbumsFail(error));
    });
  };
}

export function fetchContainedAlbumsRequest() {
  return {
    type: TRACKS_FETCH_CONTAINED_ALBUMS_REQUEST,
  };
}

export function fetchContainedAlbumsSuccess(id, statuses) {
  return {
    type: TRACKS_FETCH_CONTAINED_ALBUMS_SUCCESS,
    id,
    statuses,
  };
}

export function fetchContainedAlbumsFail(error) {
  return {
    type: TRACKS_FETCH_CONTAINED_ALBUMS_FAIL,
    error,
  };
}
