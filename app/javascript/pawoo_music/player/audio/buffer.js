import axios from 'axios';
import noop from 'lodash/noop';

export default class BufferAudio {

  _buffer = null;
  _bufferSource = null;
  _lastSeekDestinationOffsetToMusicTime = 0;

  constructor ({ context, onEnded, onLoadStart, onLoadEnd, onDestinationNodeChange, onSourceNodeChange, onDurationChange }) {
    this._cancelMusic = noop;
    this._context = context;
    this._onEnded = onEnded;
    this._onLoadStart = onLoadStart;
    this._onLoadEnd = onLoadEnd;
    this._onSourceNodeChange = onSourceNodeChange;
    this._onDurationChange = onDurationChange;

    onDestinationNodeChange(context.destination);
  }

  changeSource (source) {
    let promise;

    this._cancelMusic();

    this._buffer = null;

    if (this._bufferSource !== null) {
      this._bufferSource.onended = null;
      this._bufferSource.stop();
    }

    this._onLoadStart();
    this._onDurationChange(Infinity);

    if (source instanceof Blob) {
      promise = new Promise((resolve, reject) => {
        const reader = new FileReader;

        reader.onload = ({ target }) => target.result !== null ?
          resolve(target.result) : reject(target.error);

        reader.readAsArrayBuffer(source);

        this._cancelMusic = () => reader.abort();
      });
    } else {
      const tokenSource = axios.CancelToken.source();

      promise = axios.get(
        source,
        { responseType: 'arraybuffer', cancelToken: source.token }
      ).then(({ data }) => data);

      this._cancelMusic = () => tokenSource.cancel();
    }

    promise.then(arrayBuffer => {
      this._cancelMusic = () => promise = null;

      /*
       * Promise based decodeAudioData is not supported by:
       * Mozilla/5.0 (iPhone; CPU iPhone OS 10_2_1 like Mac OS X) AppleWebKit/602.4.46 (KHTML, like Gecko) Version/10.0 Mobile/14D27 Safari/602.1
       */
      this._context.decodeAudioData(arrayBuffer, buffer => {
        if (promise !== null) {
          this._buffer = buffer;
          this._lastSeekDestinationOffsetToMusicTime = 0;

          this._onLoadEnd();
          this._onDurationChange(buffer.duration);
        }
      });
    });
  }

  _createBufferSource () {
    this._bufferSource = this._context.createBufferSource();
    this._bufferSource.buffer = this._buffer;
    this._bufferSource.onended = () => {
      this._bufferSource = null;
      this._lastSeekDestinationOffsetToMusicTime = this._buffer.duration;
      this._onEnded();
    };
    this._bufferSource.start(0, this.getCurrentTime());

    this._onSourceNodeChange(this._bufferSource);
  }

  getCurrentTime () {
    return this._bufferSource === null ?
      this._lastSeekDestinationOffsetToMusicTime :
      this._context.currentTime + this._offsetToContextTime;
  }

  pause () {
    if (this._bufferSource !== null) {
      this._lastSeekDestinationOffsetToMusicTime = this.getCurrentTime();
      this._bufferSource.onended = null;
      this._bufferSource.stop();
      this._bufferSource = null;
    }
  }

  play () {
    if (this._buffer !== null) {
      if (this._lastSeekDestinationOffsetToMusicTime < this._buffer.duration) {
        this._offsetToContextTime = this._lastSeekDestinationOffsetToMusicTime - this._context.currentTime;
      } else {
        this._offsetToContextTime = -this._context.currentTime;
        this._lastSeekDestinationOffsetToMusicTime = 0;
      }

      this._createBufferSource(this._buffer);
    }
  }

  seek (time) {
    if (this._bufferSource !== null) {
      this._bufferSource.onended = null;
      this._bufferSource.stop();
    }

    this._offsetToContextTime = time - this._context.currentTime;
    this._lastSeekDestinationOffsetToMusicTime = time;

    if (this._bufferSource !== null) {
      this._createBufferSource(this._buffer);
    }
  }

  update () {
  }

}
