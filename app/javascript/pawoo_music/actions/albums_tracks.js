import api from '../../mastodon/api';
import { changeAlbumId, changeAlbumTrackIndex } from './player';

export const ALBUMS_TRACKS_FETCH_REQUEST = 'ALBUMS_TRACKS_FETCH_REQUEST';
export const ALBUMS_TRACKS_FETCH_SUCCESS = 'ALBUMS_TRACKS_FETCH_SUCCESS';
export const ALBUMS_TRACKS_FETCH_FAIL = 'ALBUMS_TRACKS_FETCH_FAIL';
export const ALBUMS_TRACKS_SET = 'ALBUMS_TRACKS_SET';

function fetchAlbumTracksPromise(dispatch, getState, id, { compose = false } = {}) {
  dispatch(fetchAlbumTracksRequest());

  const promise = api(getState).get(`/api/v1/albums/${id}/tracks`);

  promise.then((response) => {
    dispatch(fetchAlbumTracksSuccess(id, response.data, compose));
  }).catch(error => {
    dispatch(fetchAlbumTracksFail(error));
  });

  return promise;
}

export function fetchAlbumTracks(id, options) {
  return function (dispatch, getState) {
    fetchAlbumTracksPromise(dispatch, getState, id, options);
  };
}

export function fetchAndQueueAlbumTracks(id, trackIndex) {
  return function (dispatch, getState) {
    dispatch(changeAlbumId(id));
    fetchAlbumTracksPromise(dispatch, getState, id).then(() => {
      dispatch(changeAlbumTrackIndex(trackIndex));
    });
  };
}

export function fetchAlbumTracksRequest() {
  return {
    type: ALBUMS_TRACKS_FETCH_REQUEST,
  };
}

export function fetchAlbumTracksSuccess(id, statuses, compose) {
  return {
    type: ALBUMS_TRACKS_FETCH_SUCCESS,
    id,
    statuses,
    compose,
  };
}

export function fetchAlbumTracksFail(error) {
  return {
    type: ALBUMS_TRACKS_FETCH_FAIL,
    error,
  };
}

export function setAlbumTracks(id, tracks) {
  return {
    type: ALBUMS_TRACKS_SET,
    tracks,
  };
}
