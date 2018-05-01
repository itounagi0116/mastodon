import {
  changeAudioDestinationNode,
  changeAudioSourceNode,
  changeDuration,
  changeLoading,
  end,
} from '../../actions/player';
import BufferAudio from './buffer';
import HTMLAudio from './html';

const userAgentMatch = navigator.userAgent.match(/AppleWebKit\/(\d+)/);

const PlayerAudio = userAgentMatch && userAgentMatch[1] < 604 &&
                      !navigator.userAgent.includes('Chrome') ?
                        BufferAudio : HTMLAudio;

export const context = new (window.AudioContext || window.webkitAudioContext);
let playerAudio;

export default store => {
  let lastId = null;
  let lastMusic = null;
  let lastSeekDestination = null;
  let lastPaused = null;
  let lastDummy = null;

  playerAudio = new PlayerAudio({
    context,

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
      store.dispatch(end());
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

  store.subscribe(() => {
    const state = store.getState();
    const newPlayer = state.getIn(['pawoo_music', 'player']);
    const newTrackPath = newPlayer.get('trackPath');
    const newDummy = newPlayer.get('dummy');

    if (newDummy !== lastDummy) {
      lastDummy = newDummy;

      if (newDummy) {
        playerAudio.playDummy();
        return;
      } else {
        playerAudio.stopDummy();
      }
    }

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

    if (oldPaused !== newPaused) {
      if (newPaused) {
        playerAudio.pause();
      } else {
        playerAudio.play();
      }
    }
  });

  setInterval(playerAudio.update.bind(playerAudio), 32768);
};

export function getCurrentTime() {
  return playerAudio.getCurrentTime();
}
