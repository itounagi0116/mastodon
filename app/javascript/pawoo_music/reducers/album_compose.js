import Immutable from 'immutable';
import {
  ALBUM_COMPOSE_TRACK_REGISTER,
  ALBUM_COMPOSE_REGISTERED_TRACKS_SET,
  ALBUM_COMPOSE_TRACK_UNREGISTER,
  ALBUM_COMPOSE_UNREGISTERED_TRACKS_REARRANGE,
  ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_REQUEST,
  ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_SUCCESS,
  ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_FAIL,
  ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_REQUEST,
  ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_SUCCESS,
  ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_FAIL,
  ALBUM_COMPOSE_ALBUM_TITLE_CHANGE,
  ALBUM_COMPOSE_ALBUM_TEXT_CHANGE,
  ALBUM_COMPOSE_ALBUM_IMAGE_CHANGE,
  ALBUM_COMPOSE_CHANGE_PRIVACY,
  ALBUM_COMPOSE_SUBMIT_REQUEST,
  ALBUM_COMPOSE_SUBMIT_SUCCESS,
  ALBUM_COMPOSE_SUBMIT_FAIL,
  ALBUM_COMPOSE_SHOW_MODAL,
  ALBUM_COMPOSE_HIDE_MODAL,
  ALBUM_COMPOSE_RESET_DATA,
  ALBUM_COMPOSE_SET_DATA,
} from '../actions/album_compose';
import {
  ALBUMS_TRACKS_FETCH_REQUEST,
  ALBUMS_TRACKS_FETCH_SUCCESS,
  ALBUMS_TRACKS_FETCH_FAIL,
} from '../actions/albums_tracks';

const initialState = Immutable.fromJS({
  error: null,
  is_submitting: false,
  modal: false,
  registeredTracks: [],
  isLoadingRegisteredTracks: false,
  unregisteredTracks: [],
  unregisteredTracksNext: null,
  isLoadingUnregisteredTracks: false,
  album: {
    id: null,
    image: null,
    title: '',
    text: '',
    visibility: 'public',
  },
});

function setAlbumData(state, album) {
  return state.withMutations((map) => {
    return ['id', 'image', 'title', 'text'].reduce((base, key) => {
      return album.get(key) ? base.setIn(['album', key], album.get(key)) : base;
    }, map);
  });
}

function setAlbumRegisteredTracks(state, registeredTracks) {
  return state.merge([
    [
      'registeredTracks',
      registeredTracks,
    ], [
      'unregisteredTracks',
      state.get('unregisteredTracks').filter(id => !registeredTracks.includes(id)),
    ],
  ]);
}

function setAlbumUnregisteredTracks(state, unregisteredTracks) {
  return state.merge([
    [
      'registeredTracks',
      state.get('registeredTracks').filter(id => !unregisteredTracks.includes(id)),
    ], [
      'unregisteredTracks',
      unregisteredTracks,
    ],
  ]);
}

export default function album_compose(state = initialState, action) {
  switch (action.type) {
  case ALBUM_COMPOSE_TRACK_REGISTER:
    return state.merge([
      [
        'registeredTracks',
        state.get('registeredTracks')
             .insert(action.destination, state.getIn(['unregisteredTracks', action.source])),
      ], [
        'unregisteredTracks',
        state.get('unregisteredTracks').delete(action.source),
      ],
    ]);
  case ALBUM_COMPOSE_REGISTERED_TRACKS_SET:
    return setAlbumRegisteredTracks(state, action.tracks);
  case ALBUM_COMPOSE_TRACK_UNREGISTER:
    return state.merge([
      [
        'unregisteredTracks',
        state.get('unregisteredTracks')
             .insert(action.destination, state.getIn(['registeredTracks', action.source])),
      ], [
        'registeredTracks',
        state.get('registeredTracks').delete(action.source),
      ],
    ]);
  case ALBUM_COMPOSE_UNREGISTERED_TRACKS_REARRANGE:
    return state.update('unregisteredTracks',
      tracks => tracks.delete(action.source)
                      .insert(action.destination, tracks.get(action.source))
    );
  case ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_REQUEST:
  case ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_REQUEST:
    return state.set('isLoadingUnregisteredTracks', true);
  case ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_FAIL:
  case ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_FAIL:
    return state.set('isLoadingUnregisteredTracks', false);
  case ALBUM_COMPOSE_UNREGISTERED_TRACKS_REFRESH_SUCCESS:
    return setAlbumUnregisteredTracks(
      state.merge({
        unregisteredTracksNext: action.next,
        isLoadingUnregisteredTracks: false,
      }),
      Immutable.List(action.statuses.map((status) => status.id))
    );
  case ALBUM_COMPOSE_UNREGISTERED_TRACKS_EXPAND_SUCCESS:
    return state.merge({
      unregisteredTracks: state.get('unregisteredTracks').concat(
        Immutable.List(action.statuses.map((status) => status.id))
      ),
      unregisteredTracksNext: action.next,
      isLoadingUnregisteredTracks: false,
    });
  case ALBUM_COMPOSE_ALBUM_TITLE_CHANGE:
    return state.setIn(['album', 'title'], action.value);
  case ALBUM_COMPOSE_ALBUM_TEXT_CHANGE:
    return state.setIn(['album', 'text'], action.value);
  case ALBUM_COMPOSE_ALBUM_IMAGE_CHANGE:
    return state.setIn(['album', 'image'], action.value);
  case ALBUM_COMPOSE_CHANGE_PRIVACY:
    return state.setIn(['album', 'visibility'], action.value);
  case ALBUM_COMPOSE_SUBMIT_REQUEST:
    return state.set('is_submitting', true).set('error', initialState.get('error'));
  case ALBUM_COMPOSE_SUBMIT_SUCCESS:
    return initialState;
  case ALBUM_COMPOSE_SUBMIT_FAIL:
    return state.set('is_submitting', false).set('error', action.error);
  case ALBUM_COMPOSE_SHOW_MODAL:
    return state.set('modal', true);
  case ALBUM_COMPOSE_HIDE_MODAL:
    return state.set('modal', false);
  case ALBUM_COMPOSE_RESET_DATA:
    return state.set('album', initialState.get('album'));
  case ALBUM_COMPOSE_SET_DATA:
    return setAlbumData(state, action.album);
  case ALBUMS_TRACKS_FETCH_REQUEST:
    return action.id === state.getIn(['album', 'id']) ?
      state.set('isLoadingRegisteredTracks', true) : state;
  case ALBUMS_TRACKS_FETCH_SUCCESS:
    return action.id === state.getIn(['album', 'id']) ? setAlbumRegisteredTracks(
      state.set('isLoadingRegisteredTracks', false),
      Immutable.List(action.statuses.map((status) => status.id))
    ) : state;
  case ALBUMS_TRACKS_FETCH_FAIL:
    return action.id === state.getIn(['album', 'id']) ?
      state.set('isLoadingRegisteredTracks', false) : state;
  default:
    return state;
  }
}
