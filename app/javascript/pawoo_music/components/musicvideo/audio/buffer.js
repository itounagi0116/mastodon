import axios from 'axios';
import noop from 'lodash/noop';

export default class BufferAudio {

  _buffer = null;
  _bufferSource = null;
  _lastSeekDestinationOffsetToMusicTime = 0;
  duration = NaN;

  constructor ({ analyser, onDurationChange, onSeeking, onStart, onStop }) {
    analyser.connect(analyser.context.destination);

    this._analyser = analyser;
    this._cancelMusic = noop;
    this._onDurationChange = onDurationChange;
    this._onSeeking = onSeeking;
    this._onStart = onStart;
    this._onStop = onStop;
  }

  changeSource (source) {
    let promise;

    this._cancelMusic();

    this.duration = Infinity;
    this._onDurationChange();

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
      this._analyser.context.decodeAudioData(arrayBuffer, buffer => {
        if (promise !== null) {
          if (this._bufferSource !== null) {
            this._bufferSource.stop();
          }

          this._buffer = buffer;

          this.duration = buffer.duration;
          this._onDurationChange();

          this._offsetToContextTime = -this._analyser.context.currentTime;

          if (this._bufferSource !== null || this.autoPlay) {
            this._createBufferSource();
            this.lastSeekDestinationOffsetToMusicTime = 0;
          }
        }
      });
    });
  }

  _createBufferSource () {
    this._bufferSource = this._analyser.context.createBufferSource();
    this._bufferSource.buffer = this._buffer;
    this._bufferSource.onended = () => {
      this._bufferSource = null;
      this._lastSeekDestinationOffsetToMusicTime = this.duration;
      this._onStop();
    };
    this._bufferSource.connect(this._analyser);
    this._bufferSource.start(0, this.getCurrentTime());

    this._onStart();
  }

  destroy () {
    if (this._bufferSource !== null) {
      this._bufferSource.stop();
    }
  }

  getCurrentTime () {
    return this._bufferSource === null ?
      this._lastSeekDestinationOffsetToMusicTime :
      this._analyser.context.currentTime + this._offsetToContextTime;
  }

  getInitialized () {
    return this._buffer !== null;
  }

  getLoading () {
    return this.duration === Infinity;
  }

  getPaused () {
    return this._bufferSource === null;
  }

  pause () {
    this._lastSeekDestinationOffsetToMusicTime = this.getCurrentTime();
    this._bufferSource.onended = null;
    this._bufferSource.stop();
    this._bufferSource = null;
    this._onStop();
  }

  play () {
    if (this._lastSeekDestinationOffsetToMusicTime < this.duration) {
      this._offsetToContextTime = this._lastSeekDestinationOffsetToMusicTime - this._analyser.context.currentTime;
    } else {
      this._offsetToContextTime = -this._analyser.context.currentTime;
      this._lastSeekDestinationOffsetToMusicTime = 0;
    }

    this._createBufferSource(this._buffer);
  }

  seek (time) {
    if (this._bufferSource !== null) {
      this._bufferSource.onended = null;
      this._bufferSource.stop();
      this._onStop();
    }

    this._offsetToContextTime = time - this._analyser.context.currentTime;
    this._lastSeekDestinationOffsetToMusicTime = time;

    this._onSeeking();

    if (this._bufferSource !== null) {
      this._createBufferSource(this._buffer);
    }
  }

  update () {
  }

}
