import subscribeAsAudio from './audio';
import subscribeAsMediaSession from './media_session';

export default state => {
  subscribeAsAudio(state);
  subscribeAsMediaSession(state);
};
