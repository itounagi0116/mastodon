import BufferAudio from './buffer';
import HTMLAudio from './html';

const match = navigator.userAgent.match(/AppleWebKit\/(\d+)/);

export default match && match[1] < 603 &&
                 !navigator.userAgent.includes('Chrome') ?
                    BufferAudio : HTMLAudio;
