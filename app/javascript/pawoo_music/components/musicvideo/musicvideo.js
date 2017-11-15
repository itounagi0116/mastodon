import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl } from 'react-intl';
import { Canvas } from 'musicvideo-generator';
import { BaseTexture } from 'pixi.js';
import IconButton from '../icon_button';
import Slider from '../slider';
import { constructGeneratorOptions } from '../../util/musicvideo';
import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';
import lightLeaks from '../../../light_leaks.mp4';

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

const messages = defineMessages({
  play: { id: 'pawoo_music.musicvideo.play', defaultMessage: 'Play' },
  pause: { id: 'pawoo_music.musicvideo.pause', defaultMessage: 'Pause' },
});

/*
 * Note about duration estimation:
 * When their sources are blobs, durations of some musics are not available
 * from duration property of HTMLAudioElement on:
 * Mozilla/5.0 (X11; Linux x86_64; rv:56.0) Gecko/20100101 Firefox/56.0
 * When duration is not available, a workaround will be performed.
 */

@injectIntl
class Musicvideo extends ImmutablePureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    track: ImmutablePropTypes.map.isRequired,
    label: PropTypes.string,
    autoPlay: PropTypes.bool,
  };

  static defaultProps = {
    autoPlay: true,
  };

  /*
   * It is known that HTMLAudioElement causes small interruptions on some
   * environments such as Apple Safari when it is used for
   * MediaElementSourceNode. Do not use audioForAnalysis for output.
   */
  audioForAnalysis = new Audio();
  audioForOutput = new Audio();
  image = new BaseTexture(new Image());

  state = {
    duration: Infinity,
  };

  generator = new Canvas(
    new AudioContext,
    constructGeneratorOptions(this.props.track, this.image),
    lightLeaks,
    () => this.audioForOutput.currentTime
  );

  componentDidMount () {
    // ジャケット画像
    // Using BaseTexture "constructor" is important to prevent from associating
    // the source URL and image element. The src attribute of the element is
    // dynamic.
    this.image.source.addEventListener('load', this.handleLoadImage, { once: false });
    this.image.source.crossOrigin = 'anonymous';
    this.updateImage();

    // 音声
    this.audioForAnalysis.crossOrigin = 'anonymous';
    this.audioForOutput.crossOrigin = 'anonymous';

    /*
     * Events listed here can be fired by builtin controls provided in some
     * environments, including Google Chromium on Android and Apple Safari on
     * iOS.
     */
    this.audioForOutput.addEventListener('loadedmetadata', this.audioDidLoadMetadata);
    this.audioForOutput.addEventListener('playing', this.audioDidStart);
    this.audioForOutput.addEventListener('pause', this.audioDidStop);
    this.audioForOutput.addEventListener('seeking', this.audioWillSeek);
    this.audioForOutput.addEventListener('seeked', this.audioDidSeek);
    this.audioForOutput.addEventListener('waiting', this.audioDidStop);
    this.audioForOutput.addEventListener('ended', this.audioDidEnd);

    this.updateMusic();

    // オーディオ接続
    const { audioAnalyserNode } = this.generator;
    const audioSource = audioAnalyserNode.context.createMediaElementSource(this.audioForAnalysis);
    audioSource.connect(audioAnalyserNode);

    // キャンバス更新
    this.updateCanvas();

    // キャンバス初期化
    this.generator.initialize();

    // キャンバス接続
    const { view } = this.generator.getRenderer();
    const { parent } = view;

    if (parent) parent.removeChild(view);

    this.canvasContainer.appendChild(view);

    this.timer = setInterval(this.audioDidUpdate, 500);
  }

  componentDidUpdate ({ track }) {
    const id = track.get('id');
    const image = track.getIn(['video', 'image']);
    const music = track.get('music');

    if (this.props.track.get('id') !== id ||
        this.props.track.get('music') !== music) {
      if (music instanceof Blob) {
        URL.revokeObjectURL(this.audioForOutput.src);
      }

      this.updateMusic();
      this.generator.initialize();
    }

    if (this.props.track.getIn(['video', 'image']) !== image) {
      if (image instanceof Blob) {
        URL.revokeObjectURL(this.image.source.src);
      }
      this.updateImage();
    }

    if (this.props.track !== track) {
      this.updateCanvas();
    }
  }

  componentWillUnmount () {
    const { track } = this.props;

    clearInterval(this.timer);

    this.image.source.removeEventListener('load', this.handleLoadImage);

    this.audioForAnalysis.pause();
    this.audioForOutput.pause();
    this.audioForOutput.removeEventListener('loadedmetadata', this.audioDidLoadMetadata);
    this.audioForOutput.removeEventListener('playing', this.audioDidStart);
    this.audioForOutput.removeEventListener('pause', this.audioDidStop);
    this.audioForOutput.removeEventListener('seeking', this.audioWillSeek);
    this.audioForOutput.removeEventListener('seeked', this.audioDidSeek);
    this.audioForOutput.removeEventListener('waiting', this.audioDidStop);

    this.generator.audioAnalyserNode.context.close();
    this.generator.stop();
    this.generator.destroy();

    if ((track.getIn(['video', 'image']) instanceof Blob)) {
      URL.revokeObjectURL(this.image.source.src);
    }

    if ((this.props.track.get('music') instanceof Blob)) {
      URL.revokeObjectURL(this.audioForOutput.src);
    }
  }

  updateImage = () => {
    const image = this.props.track.getIn(['video', 'image']);

    if (image instanceof Blob) {
      this.image.source.src = URL.createObjectURL(image);
    } else if (typeof image === 'string') {
      this.image.source.src = image;
    } else {
      this.image.source.src = defaultArtwork;
    }
  }

  updateMusic = () => {
    const { track } = this.props;

    if (track.has('music') && track.get('music') !== null) {
      this.audioForAnalysis.src = URL.createObjectURL(track.get('music'));
    } else if (track.has('id') && track.get('id') !== null) {
      this.audioForAnalysis.src = `/api/v1/statuses/${track.get('id')}/music`;
    } else {
      return;
    }

    this.audioForOutput.src = this.audioForAnalysis.src;
    this.audioDidStop();
    this.setState({ duration: Infinity });
  }

  handleLoadImage = () => {
    this.image.update();
    this.updateCanvas();
  }

  handleTogglePaused = () => {
    if (this.audioForOutput.paused) {
      if (this.audioForOutput.ended) {
        this.audioForAnalysis.currentTime = 0;
        this.audioForOutput.currentTime = 0;
      }

      this.audioForOutput.play();
    } else {
      this.audioForOutput.pause();
    }

    this.audioDidUpdate();
  }

  handleChangeCurrentTime = (value) => {
    this.audioForAnalysis.currentTime = value;
    this.audioForOutput.currentTime = value;
  }

  setCanvasContainerRef = (ref) => {
    this.canvasContainer = ref;
  }

  updateCanvas = () => {
    this.generator.changeParams(constructGeneratorOptions(this.props.track, this.image));
  }

  audioDidLoadMetadata = () => {
    if (this.audioForOutput.duration === Infinity) {
      this.audioForOutput.currentTime = 9e9;
    } else {
      this.setState({ duration: this.audioForOutput.duration });

      if (this.props.autoPlay) {
        this.audioForOutput.play();
      }
    }
  }

  audioDidStart = () => {
    this.audioForAnalysis.play();
    this.generator.start();
    this.forceUpdate();
  }

  audioWillSeek = () => {
    this.audioDidStop();
    this.generator.initialize();
  }

  audioDidSeek = () => {
    if (this.state.duration === Infinity) {
      this.setState({ duration: this.audioForOutput.currentTime });
      this.audioForOutput.currentTime = 0;

      if (this.props.autoPlay) {
        this.audioForOutput.play();
      }
    }
  }

  audioDidUpdate = () => {
    /*
     * HTMLAudioElement suddenly aborts, making noise on some environments such
     * as Apple Safari when it is used for MediaElementSourceNode. Seeking
     * it somehow resolves the issue.
     */
    this.audioForAnalysis.currentTime = this.audioForOutput.currentTime;

    this.forceUpdate();
  }

  audioDidStop = () => {
    this.audioForAnalysis.pause();
    this.generator.stop();
    this.forceUpdate();
  }

  render() {
    const { intl, label } = this.props;
    const controlDisabled = this.audioForOutput.readyState === this.audioForOutput.HAVE_NOTHING;

    return (
      <div className='musicvideo'>
        <div
          className='canvas-container'
          onClick={this.handleTogglePaused}
          role='button'
          tabIndex='0'
          aria-label={label}
        >
          {[this.audioForOutput.NETWORK_IDLE, this.audioForOutput.NETWORK_LOADING].includes(this.audioForOutput.networkState) && [this.audioForOutput.HAVE_NOTHING, this.audioForOutput.HAVE_METADATA].includes(this.audioForOutput.readyState) && <div className='loading' />}
          <div ref={this.setCanvasContainerRef} />
        </div>
        <div className={classNames('controls-container', { visible: !controlDisabled })}>
          <div className='controls'>
            <div className='toggle' onClick={this.handleTogglePaused} role='button' tabIndex='0' aria-pressed='false'>
              {this.audioForOutput.paused ? <IconButton src='play' title={intl.formatMessage(messages.play)} /> : <IconButton src='pause' title={intl.formatMessage(messages.pause)} />}
            </div>
            <Slider
              min={0}
              max={this.state.duration}
              step={0.1}
              value={this.audioForOutput.currentTime}
              onChange={this.handleChangeCurrentTime}
              disabled={controlDisabled || this.state.duration === Infinity}
            />
          </div>
        </div>
      </div>
    );
  }

}

export default Musicvideo;
