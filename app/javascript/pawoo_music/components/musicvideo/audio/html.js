/*
 * Note about duration estimation:
 * When their sources are blobs, durations of some musics are not available
 * from duration property of HTMLAudioElement on:
 * Mozilla/5.0 (X11; Linux x86_64; rv:56.0) Gecko/20100101 Firefox/56.0
 * When duration is not available, a workaround will be performed.
 */

export default class HTMLAudio {

  /*
   * It is known that HTMLAudioElement causes small interruptions on some
   * environments such as Apple Safari when it is used for
   * MediaElementSourceNode. Do not use _forAnalysis for output.
   */
  _forAnalysis = new Audio();
  _forOutput = new Audio();

  duration = NaN;

  constructor ({ analyser, onDurationChange, onSeeking, onStart, onStop }) {
    this._forAnalysis.crossOrigin = 'anonymous';
    this._forOutput.crossOrigin = 'anonymous';

    /*
     * Events listed here can be fired by builtin controls provided in some
     * environments, including Google Chromium on Android and Apple Safari on
     * iOS.
     */
    this._forOutput.addEventListener('loadedmetadata', this._handleLoadMetadata);
    this._forOutput.addEventListener('playing', onStart);
    this._forOutput.addEventListener('pause', onStop);
    this._forOutput.addEventListener('seeking', this._handleSeeking);
    this._forOutput.addEventListener('seeked', this._handleSeeked);
    this._forOutput.addEventListener('waiting', onStop);

    this._onDurationChange = onDurationChange;
    this._onSeeking = onSeeking;
    this._onStart = onStart;
    this._onStop = onStop;

    analyser.context
            .createMediaElementSource(this._forAnalysis)
            .connect(analyser);
  }

  _handleLoadMetadata = () => {
    if (this._forOutput.duration === Infinity) {
      this._forOutput.currentTime = 9e9;
    } else {
      this.duration = this._forOutput.duration;
      this._onDurationChange();
    }
  }

  _handleSeeking = () => {
    this._onStop();
    this._onSeeking();
  }

  _handleSeeked = () => {
    if (this._forOutput.paused) {
      if (this.duration !== Infinity) {
        return;
      }

      this.duration = this._forOutput.currentTime;
      this._forOutput.currentTime = 0;
      this._forAnalysis.play();
      this._forOutput.play();
    }

    this._onStart();
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
    this._onStop();

    if (this.autoPlay) {
      this._forAnalysis.play();
      this._forOutput.play();
    }

    this.duration = Infinity;
    this._onDurationChange();
  }

  destroy() {
    this._forAnalysis.pause();
    this._forOutput.pause();
    this._forOutput.removeEventListener('loadedmetadata', this._handleLoadMetadata);
    this._forOutput.removeEventListener('playing', this._onStart);
    this._forOutput.removeEventListener('pause', this._onStop);
    this._forOutput.removeEventListener('seeking', this._handleSeeking);
    this._forOutput.removeEventListener('seeked', this._handleSeeked);
    this._forOutput.removeEventListener('waiting', this._onStop);

    if (this._forOutput.src.startsWith('blob:')) {
      URL.revokeObjectURL(this._forOutput.src);
    }
  }

  getCurrentTime () {
    return this._forOutput.currentTime;
  }

  getInitialized() {
    return this._forOutput.readyState !== this._forOutput.HAVE_NOTHING;
  }

  getLoading() {
    return [
      this._forOutput.NETWORK_IDLE,
      this._forOutput.NETWORK_LOADING,
    ].includes(this._forOutput.networkState) && [
      this._forOutput.HAVE_NOTHING,
      this._forOutput.HAVE_METADATA,
    ].includes(this._forOutput.readyState);
  }

  getPaused() {
    return this._forOutput.paused;
  }

  pause () {
    this._forOutput.pause();
  }

  play () {
    if (this._forOutput.ended) {
      this._forAnalysis.currentTime = 0;
      this._forOutput.currentTime = 0;
    }

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

}
