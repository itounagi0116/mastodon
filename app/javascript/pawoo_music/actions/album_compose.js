import { fetchAlbumTracks, setAlbumTracks } from './albums_tracks';
import api, { getLinks } from '../../mastodon/api';
import { updateTimeline } from '../../mastodon/actions/timelines';

export const ALBUM_COMPOSE_TRACK_REGISTER = 'ALBUM_COMPOSE_TRACK_REGISTER';
export const ALBUM_COMPOSE_TRACK_REGISTER_SUCCESS = 'ALBUM_COMPOSE_TRACK_REGISTER_SUCCESS';
export const ALBUM_COMPOSE_TRACK_REGISTER_FAIL = 'ALBUM_COMPOSE_TRACK_REGISTER_FAIL';
export const ALBUM_COMPOSE_REGISTERED_TRACK_REARRANGE = 'ALBUM_COMPOSE_REGISTERED_TRACK_REARRANGE';
export const ALBUM_COMPOSE_REGISTERED_TRACK_REARRANGE_SUCCESS = 'ALBUM_COMPOSE_REGISTERED_TRACK_REARRANGE_SUCCESS';
export const ALBUM_COMPOSE_REGISTERED_TRACK_REARRANGE_FAIL = 'ALBUM_COMPOSE_REGISTERED_TRACK_REARRANGE_FAIL';
export const ALBUM_COMPOSE_REGISTERED_TRACKS_SET = 'ALBUM_COMPOSE_REGISTERED_TRACKS_SET';
export const ALBUM_COMPOSE_TRACK_UNREGISTER = 'ALBUM_COMPOSE_TRACK_UNREGISTER';
export const ALBUM_COMPOSE_TRACK_UNREGISTER_SUCCESS = 'ALBUM_COMPOSE_TRACK_UNREGISTER_SUCCESS';
export const ALBUM_COMPOSE_TRACK_UNREGISTER_FAIL = 'ALBUM_COMPOSE_TRACK_UNREGISTER_FAIL';
export const ALBUM_COMPOSE_UNREGISTERED_TRACKS_REARRANGE = 'ALBUM_COMPOSE_UNREGISTERED_TRACKS_REARRANGE';
export const ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_REQUEST = 'ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_REQUEST';
export const ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_SUCCESS = 'ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_SUCCESS';
export const ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_FAIL = 'ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_FAIL';
export const ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_REQUEST = 'ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_REQUEST';
export const ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_SUCCESS = 'ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_SUCCESS';
export const ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_FAIL = 'ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_FAIL';
export const ALBUM_COMPOSE_ALBUM_TITLE_CHANGE = 'ALBUM_COMPOSE_ALBUM_TITLE_CHANGE';
export const ALBUM_COMPOSE_ALBUM_TEXT_CHANGE = 'ALBUM_COMPOSE_ALBUM_TEXT_CHANGE';
export const ALBUM_COMPOSE_ALBUM_IMAGE_CHANGE = 'ALBUM_COMPOSE_ALBUM_VIDEO_IMAGE_CHANGE';
export const ALBUM_COMPOSE_CHANGE_PRIVACY = 'ALBUM_COMPOSE_CHANGE_PRIVACY';
export const ALBUM_COMPOSE_SUBMIT_REQUEST = 'ALBUM_COMPOSE_SUBMIT_REQUEST';
export const ALBUM_COMPOSE_SUBMIT_SUCCESS = 'ALBUM_COMPOSE_SUBMIT_SUCCESS';
export const ALBUM_COMPOSE_SUBMIT_FAIL = 'ALBUM_COMPOSE_SUBMIT_FAIL';
export const ALBUM_COMPOSE_SHOW_MODAL = 'ALBUM_COMPOSE_SHOW_MODAL';
export const ALBUM_COMPOSE_HIDE_MODAL = 'ALBUM_COMPOSE_HIDE_MODAL';
export const ALBUM_COMPOSE_RESET_DATA = 'ALBUM_COMPOSE_RESET_DATA';
export const ALBUM_COMPOSE_SET_DATA = 'ALBUM_COMPOSE_SET_DATA';

export function submitAlbumCompose() {
  return function (dispatch, getState) {
    const state = getState();
    const formData = new FormData;
    const album = state.getIn(['pawoo_music', 'album_compose', 'album']);
    const registeredTracks = state.getIn(['pawoo_music', 'album_compose', 'registeredTracks']);
    const image = album.get('image');
    const id = album.get('id');

    formData.append('title', album.get('title'));
    formData.append('text', album.get('text'));

    if (image instanceof File) {
      formData.append('image', image);
    }

    if (!id) {
      formData.append('visibility', album.get('visibility'));
      for (const trackId of registeredTracks) {
        formData.append('track_ids[]', trackId);
      }
    }

    dispatch(submitAlbumComposeRequest());

    const request = id ? (
      api(getState).put(`/api/v1/albums/${id}`, formData)
    ) : (
      api(getState).post('/api/v1/albums', formData)
    );

    request.then(function ({ data }) {
      dispatch(submitAlbumComposeSuccess());
      const status = data;

      // To make the app more responsive, immediately get the status into the columns
      dispatch(updateTimeline('home', status));
      dispatch(updateTimeline('home:music', status));

      if (status.in_reply_to_id === null && status.visibility === 'public') {
        if (getState().getIn(['timelines', 'community', 'loaded'])) {
          dispatch(updateTimeline('community', status));
          dispatch(updateTimeline('community:music', status));
        }

        if (getState().getIn(['timelines', 'public', 'loaded'])) {
          dispatch(updateTimeline('public', status));
          dispatch(updateTimeline('public:music', status));
        }

        const me = getState().getIn(['meta', 'me']);
        if (getState().getIn(['timelines', `account:${me}`, 'loaded'])) {
          dispatch(updateTimeline(`account:${me}`, status));
          dispatch(updateTimeline(`account:${me}:music`, status));
        }
      }
    }).catch(function (error) {
      dispatch(submitAlbumComposeFail(error));
    });
  };
};

export function submitAlbumComposeRequest() {
  return {
    type: ALBUM_COMPOSE_SUBMIT_REQUEST,
  };
};

export function submitAlbumComposeSuccess() {
  return {
    type: ALBUM_COMPOSE_SUBMIT_SUCCESS,
  };
};

export function submitAlbumComposeFail(error) {
  return {
    type: ALBUM_COMPOSE_SUBMIT_FAIL,
    error,
  };
};

export function showAlbumComposeModal() {
  return {
    type: ALBUM_COMPOSE_SHOW_MODAL,
  };
};

export function hideAlbumComposeModal() {
  return {
    type: ALBUM_COMPOSE_HIDE_MODAL,
  };
};

export function resetAlbumComposeData() {
  return {
    type: ALBUM_COMPOSE_RESET_DATA,
  };
}

export function setAlbumComposeData(album) {
  return {
    type: ALBUM_COMPOSE_SET_DATA,
    album,
  };
}

export function refreshTracks() {
  return dispatch => {
    dispatch(refreshRegisteredTracks());
    dispatch(refreshUnregisteredTracks());
  };
}

function registerTrackAction(source, destination) {
  return {
    type: ALBUM_COMPOSE_TRACK_REGISTER,
    source,
    destination,
  };
}

export function registerTrackSuccess() {
  return {
    type: ALBUM_COMPOSE_TRACK_REGISTER_SUCCESS,
  };
}

export function registerTrackFail(error) {
  return {
    type: ALBUM_COMPOSE_TRACK_REGISTER_FAIL,
    error,
  };
}

export function registerTrack(source, destination) {
  return function (dispatch, getState) {
    const state = getState();
    const albumId = state.getIn(['pawoo_music', 'album_compose', 'album', 'id']);

    if (albumId) {
      const unregisteredTracks = state.getIn(['pawoo_music', 'album_compose', 'unregisteredTracks']);
      const registeredTracks = state.getIn(['pawoo_music', 'album_compose', 'registeredTracks']);
      const trackId = unregisteredTracks.get(source);
      const relativeTo = registeredTracks.get(destination);
      const params = {};

      if (relativeTo) {
        params.relative_to = relativeTo;
        params.above = true;
      }

      api(getState).put(`/api/v1/albums/${albumId}/tracks/${trackId}`, params).then(() => {
        dispatch(registerTrackSuccess());
      }).catch(error => {
        dispatch(registerTrackFail(error));
        dispatch(unregisterAction(destination, source));
      });
    }

    dispatch(registerTrackAction(source, destination));
  };
}

function rearrangeRegisteredTracksAction(source, destination) {
  return (dispatch, getState) => {
    const albumCompose = getState().getIn(['pawoo_music', 'album_compose']);
    const id = albumCompose.getIn(['album', 'id']);
    const oldTracks = albumCompose.get('registeredTracks');
    const tracks = oldTracks.delete(source)
                            .insert(destination, oldTracks.get(source));

    if (id !== null) {
      dispatch(setAlbumTracks(id, tracks));
    }

    dispatch({ type: ALBUM_COMPOSE_REGISTERED_TRACKS_SET, tracks });
  };
}

export function rearrangeRegisteredTrackSuccess() {
  return {
    type: ALBUM_COMPOSE_REGISTERED_TRACK_REARRANGE_SUCCESS,
  };
}

export function rearrangeRegisteredTrackFail(error) {
  return {
    type: ALBUM_COMPOSE_REGISTERED_TRACK_REARRANGE_FAIL,
    error,
  };
}

export function rearrangeRegisteredTracks(source, destination) {
  return (dispatch, getState) => {
    const state = getState();
    const albumId = state.getIn(['pawoo_music', 'album_compose', 'album', 'id']);

    if (albumId) {
      const registeredTracks = state.getIn(['pawoo_music', 'album_compose', 'registeredTracks']);
      const trackId = registeredTracks.get(source);
      const relativeTo = registeredTracks.get(destination);
      const params = {};

      if (relativeTo) {
        params.relative_to = relativeTo;
        if (source > destination) {
          params.above = true;
        }
      }

      api(getState).patch(`/api/v1/albums/${albumId}/tracks/${trackId}`, params).then(() => {
        dispatch(rearrangeRegisteredTrackSuccess());
      }).catch(error => {
        dispatch(rearrangeRegisteredTrackFail(error));
        dispatch(rearrangeRegisteredTracksAction(destination, source));
      });
    }

    dispatch(rearrangeRegisteredTracksAction(source, destination));
  };
}

export function refreshRegisteredTracks() {
  return (dispatch, getState) => {
    const id = getState().getIn(['pawoo_music', 'album_compose', 'album', 'id']);

    if (id !== null) {
      dispatch(fetchAlbumTracks(id));
    }
  };
}

function unregisterAction(source, destination) {
  return {
    type: ALBUM_COMPOSE_TRACK_UNREGISTER,
    source,
    destination,
  };
}

export function unregisterTrackSuccess() {
  return {
    type: ALBUM_COMPOSE_TRACK_UNREGISTER_SUCCESS,
  };
}

export function unregisterTrackFail(error) {
  return {
    type: ALBUM_COMPOSE_TRACK_UNREGISTER_FAIL,
    error,
  };
}

export function unregisterTrack(source, destination) {
  return function (dispatch, getState) {
    const state = getState();
    const albumId = state.getIn(['pawoo_music', 'album_compose', 'album', 'id']);

    if (albumId) {
      const registeredTracks = state.getIn(['pawoo_music', 'album_compose', 'registeredTracks']);
      const trackId = registeredTracks.get(source);

      api(getState).delete(`/api/v1/albums/${albumId}/tracks/${trackId}`).then(() => {
        dispatch(unregisterTrackSuccess());
      }).catch(error => {
        dispatch(unregisterTrackFail(error));
        dispatch(unregisterAction(destination, source));
      });
    }

    dispatch(unregisterAction(source, destination));
  };
}

export function rearrangeUnregisteredTracks(source, destination) {
  return {
    type: ALBUM_COMPOSE_UNREGISTERED_TRACKS_REARRANGE,
    source,
    destination,
  };
}

export function refreshUnregisteredTracksRequest() {
  return {
    type: ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_REQUEST,
  };
}

export function refreshUnregisteredTracksSuccess(statuses, next) {
  return {
    type: ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_SUCCESS,
    statuses,
    next,
  };
}

export function refreshUnregisteredTracksFail(error) {
  return {
    type: ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_FAIL,
    error,
  };
}

export function refreshUnregisteredTracks() {
  return (dispatch, getState) => {
    const accountId = getState().getIn(['meta', 'me']);
    const params = {
      only_tracks: true,
      excluded_album: getState().getIn(['pawoo_music', 'album_compose', 'album', 'id']),
    };

    dispatch(refreshUnregisteredTracksRequest());
    api(getState).get(`/api/v1/accounts/${accountId}/statuses`, { params }).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(refreshUnregisteredTracksSuccess(response.data, next ? next.uri : null));
    }).catch(error => {
      dispatch(refreshUnregisteredTracksFail(error));
    });
  };
}

export function expandUnregisteredTracksRequest() {
  return {
    type: ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_REQUEST,
  };
}

export function expandUnregisteredTracksSuccess(statuses, next) {
  return {
    type: ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_SUCCESS,
    statuses,
    next,
  };
}

export function expandUnregisteredTracksFail(error) {
  return {
    type: ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_FAIL,
    error,
  };
}

export function expandUnregisteredTracks() {
  return (dispatch, getState) => {
    const next = getState().getIn(['pawoo_music', 'album_compose', 'unregisteredTracksNext']);

    dispatch(expandUnregisteredTracksRequest());

    api(getState).get(next).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(expandUnregisteredTracksSuccess(response.data, next ? next.uri : null));
    }).catch(error => {
      dispatch(expandUnregisteredTracksFail(error));
    });
  };
}

export function changeAlbumComposeAlbumTitle(value) {
  return {
    type: ALBUM_COMPOSE_ALBUM_TITLE_CHANGE,
    value,
  };
};

export function changeAlbumComposeAlbumText(value) {
  return {
    type: ALBUM_COMPOSE_ALBUM_TEXT_CHANGE,
    value,
  };
};

export function changeAlbumComposeAlbumImage(value) {
  return {
    type: ALBUM_COMPOSE_ALBUM_IMAGE_CHANGE,
    value,
  };
};

export function changeAlbumComposePrivacy(value) {
  return {
    type: ALBUM_COMPOSE_CHANGE_PRIVACY,
    value,
  };
}
