/*
 * Note about duration estimation:
 * When their sources are blobs, durations of some musics are not available
 * from duration property of HTMLAudioElement on:
 * Mozilla/5.0 (X11; Linux x86_64; rv:56.0) Gecko/20100101 Firefox/56.0
 * When duration is not available, a workaround will be performed.
 */

export default class HTMLAudio {

  _duration = NaN;

  /*
   * It is known that HTMLAudioElement causes small interruptions on some
   * environments such as Apple Safari when it is used for
   * MediaElementSourceNode. Do not use _forAnalysis for output.
   */
  _forAnalysis = new Audio();
  _forOutput = new Audio();

  constructor ({ context, onSourceNodeChange, onDurationChange, onEnded }) {
    this._forAnalysis.crossOrigin = 'anonymous';
    this._forOutput.crossOrigin = 'anonymous';

    this._forOutput.addEventListener('ended', onEnded);
    this._forOutput.addEventListener('loadedmetadata', this._handleLoadMetadata);
    this._forOutput.addEventListener('seeked', this._handleSeeked);

    this._onDurationChange = onDurationChange;

    onSourceNodeChange(context.createMediaElementSource(this._forAnalysis));
  }

  _handleLoadMetadata = () => {
    if (this._forOutput._duration === Infinity) {
      this._forOutput.currentTime = 9e9;
    } else {
      this._duration = this._forOutput.duration;
      this._onDurationChange(this._duration);
    }
  }

  _handleSeeked = () => {
    if (this._forOutput.paused) {
      if (this._duration !== Infinity) {
        return;
      }

      this._duration = this._forOutput.currentTime;
      this._onDurationChange(this._duration);
      this._forOutput.currentTime = 0;
      this._forAnalysis.play();
      this._forOutput.play();
    }
  }

  changeSource (source) {
    if (this._forOutput.src.startsWith('blob:')) {
      URL.revokeObjectURL(this._forOutput.src);
    }

    if (source instanceof Blob) {
      this._forAnalysis.src = URL.createObjectURL(source);
    } else {
      this._forAnalysis.src = source;
    }

    this._forOutput.src = this._forAnalysis.src;

    this._duration = Infinity;
    this._onDurationChange(Infinity);
  }

  getCurrentTime () {
    return this._forOutput.currentTime;
  }

  pause () {
    this._forAnalysis.pause();
    this._forOutput.pause();
  }

  play () {
    this._forAnalysis.play();
    this._forOutput.play();
  }

  seek (value) {
    this._forAnalysis.currentTime = value;
    this._forOutput.currentTime = value;
  }

  update () {
    /*
     * HTMLAudioElement suddenly aborts, making noise on some environments such
     * as Apple Safari when it is used for MediaElementSourceNode. Seeking
     * it somehow resolves the issue.
     */
    this._forAnalysis.currentTime = this._forOutput.currentTime;
  }

  playDummy () {
    if (this._forOutput.src.startsWith('blob:')) {
      URL.revokeObjectURL(this._forOutput.src);
    }

    this._forAnalysis.src = '';
    this._forOutput.src = this._forAnalysis.src;

    const analysisPromise = this._forAnalysis.play();
    const outputPromise = this._forOutput.play();

    if (analysisPromise instanceof Promise) {
      analysisPromise.catch(() => {});
    }

    if (outputPromise instanceof Promise) {
      outputPromise.catch(() => {});
    }
  }

  stopDummy () {
  }

}
