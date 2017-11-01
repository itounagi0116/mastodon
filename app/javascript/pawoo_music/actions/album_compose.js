import api from '../../mastodon/api';
import { updateTimeline } from '../../mastodon/actions/timelines';

export const ALBUM_COMPOSE_TRACKS_REFRESH_REQUEST = 'ALBUM_COMPOSE_TRACKS_REFRESH_REQUEST';
export const ALBUM_COMPOSE_TRACKS_REFRESH_SUCCESS = 'ALBUM_COMPOSE_TRACKS_REFRESH_SUCCESS';
export const ALBUM_COMPOSE_TRACKS_REFRESH_FAIL = 'ALBUM_COMPOSE_TRACKS_REFRESH_FAIL';
export const ALBUM_COMPOSE_REGISTER = 'ALBUM_COMPOSE_REGISTER';
export const ALBUM_COMPOSE_REGISTERED_TRACKS_REARRANGE = 'ALBUM_COMPOSE_REGISTERED_TRACKS_REARRANGE';
export const ALBUM_COMPOSE_UNREGISTER = 'ALBUM_COMPOSE_UNREGISTER';
export const ALBUM_COMPOSE_UNREGISTERED_TRACKS_REARRANGE = 'ALBUM_COMPOSE_UNREGISTERED_TRACKS_REARRANGE';
export const ALBUM_COMPOSE_ALBUM_TITLE_CHANGE = 'ALBUM_COMPOSE_ALBUM_TITLE_CHANGE';
export const ALBUM_COMPOSE_ALBUM_TEXT_CHANGE = 'ALBUM_COMPOSE_ALBUM_TEXT_CHANGE';
export const ALBUM_COMPOSE_ALBUM_IMAGE_CHANGE = 'ALBUM_COMPOSE_ALBUM_VIDEO_IMAGE_CHANGE';
export const ALBUM_COMPOSE_CHANGE_PRIVACY = 'ALBUM_COMPOSE_CHANGE_PRIVACY';
export const ALBUM_COMPOSE_SUBMIT_REQUEST = 'ALBUM_COMPOSE_SUBMIT_REQUEST';
export const ALBUM_COMPOSE_SUBMIT_SUCCESS = 'ALBUM_COMPOSE_SUBMIT_SUCCESS';
export const ALBUM_COMPOSE_SUBMIT_FAIL = 'ALBUM_COMPOSE_SUBMIT_FAIL';
export const ALBUM_COMPOSE_SHOW_MODAL = 'ALBUM_COMPOSE_SHOW_MODAL';
export const ALBUM_COMPOSE_HIDE_MODAL = 'ALBUM_COMPOSE_HIDE_MODAL';
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

export function setAlbumComposeData(album) {
  return {
    type: ALBUM_COMPOSE_SET_DATA,
    album,
  };
}

export function refreshTracks(accountId) {
  return function (dispatch, getState) {
    if (getState().getIn(['pawoo_music', 'album_compose', 'isTracksLoading'])) {
      return;
    }

    dispatch(refreshTracksRequest(accountId));
    api(getState).get(`/api/v1/accounts/${accountId}/statuses`, { params: { only_tracks: true } }).then(({ data }) => {
      dispatch(refreshTracksSuccess(accountId, data));
    }).catch(error => {
      dispatch(refreshTracksFail(accountId, error));
    });
  };
}

export function refreshTracksRequest(account) {
  return {
    type: ALBUM_COMPOSE_TRACKS_REFRESH_REQUEST,
    account,
  };
}

export function refreshTracksSuccess(account, tracks) {
  return {
    type: ALBUM_COMPOSE_TRACKS_REFRESH_SUCCESS,
    account,
    tracks,
  };
}

export function refreshTracksFail(account, error) {
  return {
    type: ALBUM_COMPOSE_TRACKS_REFRESH_FAIL,
    account,
    error,
  };
}


export function register(source, destination) {
  return {
    type: ALBUM_COMPOSE_REGISTER,
    source,
    destination,
  };
}

export function rearrangeRegisteredTracks(source, destination) {
  return {
    type: ALBUM_COMPOSE_REGISTERED_TRACKS_REARRANGE,
    source,
    destination,
  };
}

export function unregister(source, destination) {
  return {
    type: ALBUM_COMPOSE_UNREGISTER,
    source,
    destination,
  };
}

export function rearrangeUnregisteredTracks(source, destination) {
  return {
    type: ALBUM_COMPOSE_UNREGISTERED_TRACKS_REARRANGE,
    source,
    destination,
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
