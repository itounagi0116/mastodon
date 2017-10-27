import Immutable from 'immutable';
import api from '../../mastodon/api';
import { updateTimeline } from '../../mastodon/actions/timelines';

export const TRACK_COMPOSE_BASIC_TAB_FOCUS = 'TRACK_COMPOSE_BASIC_TAB_FOCUS';
export const TRACK_COMPOSE_VIDEO_TAB_FOCUS = 'TRACK_COMPOSE_VIDEO_TAB_FOCUS';
export const TRACK_COMPOSE_TRACK_TITLE_CHANGE = 'TRACK_COMPOSE_TRACK_TITLE_CHANGE';
export const TRACK_COMPOSE_TRACK_ARTIST_CHANGE = 'TRACK_COMPOSE_TRACK_ARTIST_CHANGE';
export const TRACK_COMPOSE_TRACK_TEXT_CHANGE = 'TRACK_COMPOSE_TRACK_TEXT_CHANGE';
export const TRACK_COMPOSE_TRACK_VISIBILITY_CHANGE = 'TRACK_COMPOSE_TRACK_VISIBILITY_CHANGE';
export const TRACK_COMPOSE_TRACK_MUSIC_CHANGE = 'TRACK_COMPOSE_TRACK_MUSIC_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_IMAGE_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_IMAGE_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_BLUR_VISIBLITY_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_BLUR_VISIBLITY_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_BLUR_MOVEMENT_THRESHOLD_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_BLUR_MOVEMENT_THRESHOLD_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_BLUR_BLINK_THRESHOLD_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_BLUR_BLINK_THRESHOLD_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_VISIBLITY_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_VISIBLITY_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_ALPHA_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_ALPHA_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_COLOR_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_COLOR_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_LIMIT_THRESHOLD_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_LIMIT_THRESHOLD_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_VISIBILITY_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_VISIBILITY_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_ALPHA_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_ALPHA_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_INTERVAL_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_INTERVAL_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_VISIBLITY_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_VISIBLITY_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_MODE_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_MODE_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_ALPHA_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_ALPHA_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_COLOR_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_COLOR_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_TEXT_VISIBILITY_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_TEXT_VISIBILITY_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_TEXT_ALPHA_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_TEXT_ALPHA_CHANGE';
export const TRACK_COMPOSE_TRACK_VIDEO_TEXT_COLOR_CHANGE = 'TRACK_COMPOSE_TRACK_VIDEO_TEXT_COLOR_CHANGE';
export const TRACK_COMPOSE_SUBMIT_REQUEST = 'TRACK_COMPOSE_SUBMIT_REQUEST';
export const TRACK_COMPOSE_SUBMIT_SUCCESS = 'TRACK_COMPOSE_SUBMIT_SUCCESS';
export const TRACK_COMPOSE_SUBMIT_FAIL = 'TRACK_COMPOSE_SUBMIT_FAIL';
export const TRACK_COMPOSE_SHOW_MODAL = 'TRACK_COMPOSE_SHOW_MODAL';
export const TRACK_COMPOSE_HIDE_MODAL = 'TRACK_COMPOSE_HIDE_MODAL';
export const TRACK_COMPOSE_SET_DATA = 'TRACK_COMPOSE_SET_DATA';

function appendMapToFormData(formData, prefix, value) {
  for (const [childKey, childValue] of value) {
    const childPrefix = `${prefix}[${childKey}]`;

    if (Immutable.Map.isMap(childValue)) {
      appendMapToFormData(formData, childPrefix, childValue);
    } else {
      formData.append(childPrefix, childValue);
    }
  }
}

function appendParamToFormData(formData, prefix, value) {
  if (!value.get('visible')) {
    // パラメータをオフにする
    formData.append(prefix, '');
    return;
  }

  for (const [childKey, childValue] of value) {
    if (childKey === 'visible') {
      continue;
    }

    const childPrefix = `${prefix}[${childKey}]`;

    if (Immutable.Map.isMap(childValue)) {
      appendMapToFormData(formData, childPrefix, childValue);
    } else {
      formData.append(childPrefix, childValue);
    }
  }
}

export function submitTrackCompose() {
  return function (dispatch, getState) {
    const state = getState();
    const formData = new FormData;
    const track = state.getIn(['pawoo_music', 'track_compose', 'track']);
    const music = track.get('music');
    const video = track.get('video');
    const image = video.get('image');
    const blur = video.get('blur');
    const particle = video.get('particle');
    const lightLeaks = video.get('lightleaks');
    const spectrum = video.get('spectrum');
    const text = video.get('text');
    const id = track.get('id');

    if (music instanceof File) {
      formData.append('music', music);
    }
    formData.append('title', track.get('title'));
    formData.append('artist', track.get('artist'));
    formData.append('text', track.get('text'));
    formData.append('visibility', track.get('visibility'));

    if (image instanceof File) {
      formData.append('video[image]', image);
    }

    appendParamToFormData(formData, 'video[blur]', blur);
    appendParamToFormData(formData, 'video[particle]', particle);
    appendParamToFormData(formData, 'video[lightleaks]', lightLeaks);
    appendParamToFormData(formData, 'video[spectrum]', spectrum);
    appendParamToFormData(formData, 'video[text]', text);

    dispatch(submitTrackComposeRequest());

    const request = id ? (
      api(getState).put(`/api/v1/tracks/${id}`, formData)
    ) : (
      api(getState).post('/api/v1/tracks', formData)
    );

    request.then(function ({ data }) {
      dispatch(submitTrackComposeSuccess());
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
      dispatch(submitTrackComposeFail(error));
    });
  };
};

export function focusTrackComposeBasicTab() {
  return {
    type: TRACK_COMPOSE_BASIC_TAB_FOCUS,
  };
};

export function focusTrackComposeVideoTab() {
  return {
    type: TRACK_COMPOSE_VIDEO_TAB_FOCUS,
  };
};

export function changeTrackComposeTrackMusic(value) {
  return {
    type: TRACK_COMPOSE_TRACK_MUSIC_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackTitle(value) {
  return {
    type: TRACK_COMPOSE_TRACK_TITLE_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackArtist(value) {
  return {
    type: TRACK_COMPOSE_TRACK_ARTIST_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackText(value) {
  return {
    type: TRACK_COMPOSE_TRACK_TEXT_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoImage(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_IMAGE_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoBlurVisibility(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_BLUR_VISIBLITY_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoBlurMovementThreshold(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_BLUR_MOVEMENT_THRESHOLD_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoBlurBlinkThreshold(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_BLUR_BLINK_THRESHOLD_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoParticleVisibility(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_VISIBLITY_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoParticleAlpha(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_ALPHA_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoParticleColor(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_COLOR_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoParticleLimitThreshold(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_LIMIT_THRESHOLD_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoLightLeaksVisibility(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_VISIBILITY_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoLightLeaksAlpha(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_ALPHA_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoLightLeaksInterval(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_INTERVAL_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoSpectrumVisiblity(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_VISIBLITY_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoSpectrumMode(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_MODE_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoSpectrumAlpha(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_ALPHA_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoSpectrumColor(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_COLOR_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoTextVisibility(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_TEXT_VISIBILITY_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoTextAlpha(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_TEXT_ALPHA_CHANGE,
    value,
  };
};

export function changeTrackComposeTrackVideoTextColor(value) {
  return {
    type: TRACK_COMPOSE_TRACK_VIDEO_TEXT_COLOR_CHANGE,
    value,
  };
};

export function submitTrackComposeRequest() {
  return {
    type: TRACK_COMPOSE_SUBMIT_REQUEST,
  };
};

export function submitTrackComposeSuccess() {
  return {
    type: TRACK_COMPOSE_SUBMIT_SUCCESS,
  };
};

export function submitTrackComposeFail(error) {
  return {
    type: TRACK_COMPOSE_SUBMIT_FAIL,
    error,
  };
};


export function showTrackComposeModal() {
  return {
    type: TRACK_COMPOSE_SHOW_MODAL,
  };
};

export function hideTrackComposeModal() {
  return {
    type: TRACK_COMPOSE_HIDE_MODAL,
  };
};

export function setTrackComposeData(id, track) {
  return {
    type: TRACK_COMPOSE_SET_DATA,
    id,
    track,
  };
}
