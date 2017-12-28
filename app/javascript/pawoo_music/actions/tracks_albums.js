import api from '../../mastodon/api';

export const TRACKS_ALBUMS_FETCH_REQUEST = 'TRACKS_ALBUMS_FETCH_REQUEST';
export const TRACKS_ALBUMS_FETCH_SUCCESS = 'TRACKS_ALBUMS_FETCH_SUCCESS';
export const TRACKS_ALBUMS_FETCH_FAIL = 'TRACKS_ALBUMS_FETCH_FAIL';

export function fetchTrackAlbums(id) {
  return function (dispatch, getState) {
    dispatch(fetchTrackAlbumsRequest());
    api(getState).get(`/api/v1/tracks/${id}/albums`).then((response) => {
      dispatch(fetchTrackAlbumsSuccess(id, response.data));
    }).catch(error => {
      dispatch(fetchTrackAlbumsFail(error));
    });
  };
}

export function fetchTrackAlbumsRequest() {
  return {
    type: TRACKS_ALBUMS_FETCH_REQUEST,
  };
}

export function fetchTrackAlbumsSuccess(id, statuses) {
  return {
    type: TRACKS_ALBUMS_FETCH_SUCCESS,
    id,
    statuses,
  };
}

export function fetchTrackAlbumsFail(error) {
  return {
    type: TRACKS_ALBUMS_FETCH_FAIL,
    error,
  };
}
