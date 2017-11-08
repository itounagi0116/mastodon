import api from '../../mastodon/api';

export const ALBUMS_PLAY = 'ALBUMS_PLAY';
export const ALBUMS_STOP = 'ALBUMS_STOP';
export const ALBUMS_FETCH_TRACKS_REQUEST = 'ALBUMS_FETCH_TRACKS_REQUEST';
export const ALBUMS_FETCH_TRACKS_SUCCESS = 'ALBUMS_FETCH_TRACKS_SUCCESS';
export const ALBUMS_FETCH_TRACKS_FAIL = 'ALBUMS_FETCH_TRACKS_FAIL';


export function playAlbum(id) {
  return {
    type: ALBUMS_PLAY,
    value: id,
  };
}

export function stopAlbum() {
  return {
    type: ALBUMS_STOP,
  };
}

export function fetchAlbumTracks(id, { compose = false } = {}) {
  return function (dispatch, getState) {
    dispatch(fetchAlbumTracksRequest());
    api(getState).get(`/api/v1/albums/${id}/tracks`).then((response) => {
      dispatch(fetchAlbumTracksSuccess(id, response.data, compose));
    }).catch(error => {
      dispatch(fetchAlbumTracksFail(error));
    });
  };
}

export function fetchAlbumTracksRequest() {
  return {
    type: ALBUMS_FETCH_TRACKS_REQUEST,
  };
}

export function fetchAlbumTracksSuccess(id, statuses, compose) {
  return {
    type: ALBUMS_FETCH_TRACKS_SUCCESS,
    id,
    statuses,
    compose,
  };
}

export function fetchAlbumTracksFail(error) {
  return {
    type: ALBUMS_FETCH_TRACKS_FAIL,
    error,
  };
}
