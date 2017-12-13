import {
  changeAudioContext,
  changeAudioDestinationNode,
  changeAudioSourceNode,
  changeCurrentTimeGetter,
  changeDuration,
  changeLoading,
  changePaused,
} from '../../actions/player';
import BufferAudio from './buffer';
import HTMLAudio from './html';

const userAgentMatch = navigator.userAgent.match(/AppleWebKit\/(\d+)/);

const PlayerAudio = userAgentMatch && userAgentMatch[1] < 603 &&
                      !navigator.userAgent.includes('Chrome') ?
                        BufferAudio : HTMLAudio;

const PlayerAudioContext = window.AudioContext || window.webkitAudioContext;

export default store => {
  let lastId = null;
  let lastMusic = null;
  let lastSeekDestination = null;
  let lastPaused = null;

  const audioContext = new PlayerAudioContext;

  const playerAudio = new PlayerAudio({
    context: audioContext,

    onLoadStart() {
      store.dispatch(changeLoading(true));
    },

    onLoadEnd() {
      store.dispatch(changeLoading(false));
    },

    onDestinationNodeChange(audioNode) {
      store.dispatch(changeAudioDestinationNode(audioNode));
    },

    onEnded() {
      store.dispatch(changePaused(true));
    },

    onSourceNodeChange(audioNode) {
      store.dispatch(changeAudioSourceNode(audioNode));
    },

    onDurationChange(duration) {
      if (duration !== Infinity && !lastPaused) {
        playerAudio.play();
      }

      store.dispatch(changeDuration(duration));
    },
  });

  store.dispatch(changeAudioContext(audioContext));
  store.dispatch(changeCurrentTimeGetter(() => playerAudio.getCurrentTime()));

  store.subscribe(() => {
    const state = store.getState();
    const newPlayer = state.getIn(['pawoo_music', 'player']);
    const newTrackPath = newPlayer.get('trackPath');

    if (newTrackPath === null) {
      if (lastId !== null || lastMusic !== null) {
        playerAudio.pause();
        lastId = null;
        lastMusic = null;
      }

      return;
    }

    const newTrack = state.getIn(newTrackPath);
    const newId = newTrack.get('id');
    const newMusic = newTrack.get('music');
    const newDuration = newPlayer.get('duration');
    const newSeekDestination = newPlayer.get('lastSeekDestination');
    const newPaused = newPlayer.get('paused');
    const oldId = lastId;
    const oldMusic = lastMusic;
    const oldSeekDestination = lastSeekDestination;
    const oldPaused = lastPaused;

    lastMusic = newMusic;
    lastId = newId;
    lastSeekDestination = newSeekDestination;
    lastPaused = newPaused;

    if (oldMusic !== newMusic || oldId !== newId) {
      lastSeekDestination = 0;

      if (![null, undefined].includes(newMusic)) {
        playerAudio.changeSource(newMusic);
      } else if (![null, undefined].includes(newId)) {
        playerAudio.changeSource(`/api/v1/statuses/${newId}/music`);
      } else {
        playerAudio.pause();
        store.dispatch(changeDuration(NaN));
      }
    } else if (newDuration !== Infinity && oldSeekDestination !== newSeekDestination) {
      playerAudio.seek(newSeekDestination);
    }

    if (playerAudio.canQueuePlayback && oldPaused !== newPaused) {
      if (newPaused) {
        playerAudio.pause();
      } else {
        playerAudio.play();
      }
    }
  });

  setInterval(playerAudio.update.bind(playerAudio), 32768);
};
