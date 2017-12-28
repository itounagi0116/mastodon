export const PLAYER_AUDIO_CONTEXT_CHANGE = 'PLAYER_AUDIO_CONTEXT_CHANGE';
export const PLAYER_AUDIO_DESTINATION_NODE_CHANGE = 'PLAYER_AUDIO_DESTINATION_NODE_CHANGE';
export const PLAYER_AUDIO_SOURCE_NODE_CHANGE = 'PLAYER_AUDIO_SOURCE_NODE_CHANGE';
export const PLAYER_CURRENT_TIME_GETTER_CHANGE = 'PLAYER_CURRENT_TIME_GETTER_CHANGE';
export const PLAYER_DURATION_CHANGE = 'PLAYER_DURATION_CHANGE';
export const PLAYER_INITIALIZED_CHANGE = 'PLAYER_INITIALIZED_CHANGE';
export const PLAYER_LOADING_CHANGE = 'PLAYER_LOADING_CHANGE';
export const PLAYER_PAUSED_CHANGE = 'PLAYER_PAUSED_CHANGE';
export const PLAYER_SEEK_DESTINATION_CHANGE = 'PLAYER_SEEK_DESTINATION_CHANGE';
export const PLAYER_TRACK_PATH_CHANGE = 'PLAYER_TRACK_PATH_CHANGE';
export const PLAYER_ALBUM_PATH_CHANGE = 'PLAYER_ALBUM_PATH_CHANGE';
export const PLAYER_ALBUM_TRACK_INDEX_CHANGE = 'PLAYER_ALBUM_TRACK_INDEX_CHANGE';

export function changeAudioContext(audioContext) {
  return { type: PLAYER_AUDIO_CONTEXT_CHANGE, audioContext };
}

export function changeAudioDestinationNode(audioNode) {
  return { type: PLAYER_AUDIO_DESTINATION_NODE_CHANGE, audioNode };
}

export function changeAudioSourceNode(audioNode) {
  return { type: PLAYER_AUDIO_SOURCE_NODE_CHANGE, audioNode };
}

export function changeDuration(duration) {
  return { type: PLAYER_DURATION_CHANGE, duration };
}

export function changeCurrentTimeGetter(getCurrentTime) {
  return { type: PLAYER_CURRENT_TIME_GETTER_CHANGE, getCurrentTime };
}

export function changeInitialized(initialized) {
  return { type: PLAYER_INITIALIZED_CHANGE, initialized };
}

export function changeLoading(loading) {
  return { type: PLAYER_DURATION_CHANGE, loading };
}

export function changePaused(paused) {
  return (dispatch, getState) => {
    if (!paused) {
      const player = getState().getIn(['pawoo_music', 'player']);

      if (player.get('getCurrentTime')() >= player.get('duration')) {
        dispatch(changeSeekDestination(0));
      }
    }

    dispatch({ type: PLAYER_PAUSED_CHANGE, paused });
  };
}

export function changeSeekDestination(time) {
  return { type: PLAYER_SEEK_DESTINATION_CHANGE, time };
}

export function changeTrackPath(path) {
  return { type: PLAYER_TRACK_PATH_CHANGE, path };
}

export function changeAlbumId(id) {
  return { type: PLAYER_ALBUM_PATH_CHANGE, path: ['pawoo_music', 'albums_tracks', id] };
}

export function changeAlbumTrackIndex(index) {
  return (dispatch, getState) => {
    const state = getState();
    const path = state.getIn(['pawoo_music', 'player', 'album', 'path']);

    dispatch({
      type: PLAYER_ALBUM_TRACK_INDEX_CHANGE,
      path: ['statuses', state.getIn(path).get(index), 'track'],
      index,
    });
  };
}

export function end() {
  return (dispatch, getState) => {
    const state = getState();
    const album = state.getIn(['pawoo_music', 'player', 'album']);

    if (album === null) {
      dispatch(changePaused(true));
    } else {
      const trackIndex = album.get('trackIndex');
      const trackCount = state.getIn(album.get('path')).count();

      dispatch(changeAlbumTrackIndex((trackIndex + 1) % trackCount));
    }
  };
}
