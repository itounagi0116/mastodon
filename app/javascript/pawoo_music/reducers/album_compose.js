import Immutable from 'immutable';
import {
  ALBUM_COMPOSE_TRACKS_REFRESH_REQUEST,
  ALBUM_COMPOSE_TRACKS_REFRESH_SUCCESS,
  ALBUM_COMPOSE_TRACKS_REFRESH_FAIL,
  ALBUM_COMPOSE_REGISTER,
  ALBUM_COMPOSE_REGISTERED_TRACKS_REARRANGE,
  ALBUM_COMPOSE_UNREGISTER,
  ALBUM_COMPOSE_UNREGISTERED_TRACKS_REARRANGE,
  ALBUM_COMPOSE_ALBUM_TITLE_CHANGE,
  ALBUM_COMPOSE_ALBUM_TEXT_CHANGE,
  ALBUM_COMPOSE_ALBUM_IMAGE_CHANGE,
  ALBUM_COMPOSE_CHANGE_PRIVACY,
  ALBUM_COMPOSE_SUBMIT_REQUEST,
  ALBUM_COMPOSE_SUBMIT_SUCCESS,
  ALBUM_COMPOSE_SUBMIT_FAIL,
  ALBUM_COMPOSE_SHOW_MODAL,
  ALBUM_COMPOSE_HIDE_MODAL,
  ALBUM_COMPOSE_SET_DATA,
} from '../actions/album_compose';
import { ALBUMS_TRACKS_FETCH_SUCCESS } from '../actions/albums_tracks';

const initialState = Immutable.fromJS({
  error: null,
  is_submitting: false,
  modal: false,
  registeredTracks: [],
  unregisteredTracks: [],
  isTracksLoading: false,
  tracks: Immutable.Map(),
  album: {
    image: null,
    title: '',
    text: '',
    visibility: 'public',
  },
});

const maegeTracks = (state, tracks) => {
  return state.get('tracks').withMutations(mutable => {
    return tracks.reduce((map, track) => map.set(track.id, Immutable.fromJS(track)), mutable);
  });
};

function setAlbumData(state, album) {
  return state.withMutations((map) => {
    return ['id', 'image', 'title', 'text'].reduce((base, key) => {
      return album.get(key) ? base.setIn(['album', key], album.get(key)) : base;
    }, map);
  });
}

export default function album_compose(state = initialState, action) {
  switch (action.type) {
  case ALBUM_COMPOSE_TRACKS_REFRESH_REQUEST:
    return state.set('isTracksLoading', true);
  case ALBUM_COMPOSE_TRACKS_REFRESH_FAIL:
    return state.set('isTracksLoading', false);
  case ALBUM_COMPOSE_TRACKS_REFRESH_SUCCESS:
    return state.merge([
      ['isTracksLoading', false],
      ['tracks', maegeTracks(state, action.tracks)],
      [
        'registeredTracks',
        state.get('registeredTracks').filter(
          id => action.tracks.find(
            track => track.id === id
          )
        ),
      ], [
        'unregisteredTracks',
        state.get('unregisteredTracks').withMutations(
          mutable => action.tracks.reduce((map, track) => {
            if (!map.includes(track.id) && !state.get('registeredTracks').includes(track.id)) {
              return map.push(track.id);
            }
            return map;
          }, mutable)
        ),
      ],
    ]);
  case ALBUM_COMPOSE_REGISTER:
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
  case ALBUM_COMPOSE_REGISTERED_TRACKS_REARRANGE:
    return state.update('registeredTracks',
      tracks => tracks.delete(action.source)
                     .insert(action.destination, tracks.get(action.source))
    );
  case ALBUM_COMPOSE_UNREGISTER:
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
  case ALBUM_COMPOSE_SET_DATA:
    return setAlbumData(state, action.album);
  case ALBUMS_TRACKS_FETCH_SUCCESS:
    const registeredTracks = Immutable.List(action.statuses.map((status) => status.id));
    return state.merge([
      [
        'registeredTracks',
        registeredTracks,
      ], [
        'unregisteredTracks',
        state.get('unregisteredTracks').filter(id => !registeredTracks.includes(id)),
      ],
    ]);
  default:
    return state;
  }
}
