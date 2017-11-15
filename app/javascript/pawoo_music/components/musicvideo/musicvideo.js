import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl } from 'react-intl';
import { Canvas } from 'musicvideo-generator';
import { BaseTexture } from 'pixi.js';
import MusicvideoAudio from './audio';
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

  image = new BaseTexture(new Image());

  generator = new Canvas(
    new AudioContext,
    constructGeneratorOptions(this.props.track, this.image),
    lightLeaks,
    () => this.audio.getCurrentTime()
  );

  audio = new MusicvideoAudio({
    analyser: this.generator.audioAnalyserNode,
    onDurationChange: this.forceUpdate.bind(this),
    onSeeking: this.generator.initialize.bind(this.generator),
    onStart: () => {
      this.generator.start();
      this.forceUpdate();
    },
    onStop: () => {
      this.generator.stop();
      this.forceUpdate();
    },
  });

  componentDidMount () {
    // ジャケット画像
    // Using BaseTexture "constructor" is important to prevent from associating
    // the source URL and image element. The src attribute of the element is
    // dynamic.
    this.image.source.addEventListener('load', this.handleLoadImage, { once: false });
    this.image.source.crossOrigin = 'anonymous';
    this.updateImage();

    // 音声
    this.audio.autoPlay = this.props.autoPlay;

    this.updateMusic();

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

  componentDidUpdate ({ autoPlay, track }) {
    const id = track.get('id');
    const image = track.getIn(['video', 'image']);
    const music = track.get('music');

    if (this.props.track.get('id') !== id ||
        this.props.track.get('music') !== music) {
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

    this.audio.autoPlay = autoPlay;
  }

  componentWillUnmount () {
    const { track } = this.props;

    clearInterval(this.timer);

    this.image.source.removeEventListener('load', this.handleLoadImage);
    this.audio.destroy();

    this.generator.stop();
    this.generator.destroy();
    this.generator.audioAnalyserNode.context.close();

    if ((track.getIn(['video', 'image']) instanceof Blob)) {
      URL.revokeObjectURL(this.image.source.src);
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
      this.audio.changeSource(track.get('music'));
    } else if (track.has('id') && track.get('id') !== null) {
      this.audio.changeSource(`/api/v1/statuses/${track.get('id')}/music`);
    }
  }

  handleLoadImage = () => {
    this.image.update();
    this.updateCanvas();
  }

  handleTogglePaused = () => {
    if (this.audio.getPaused()) {
      this.audio.play();
    } else {
      this.audio.pause();
    }

    this.audioDidUpdate();
  }

  handleChangeCurrentTime = (value) => {
    this.audio.seek(value);
  }

  setCanvasContainerRef = (ref) => {
    this.canvasContainer = ref;
  }

  updateCanvas = () => {
    this.generator.changeParams(constructGeneratorOptions(this.props.track, this.image));
  }

  audioDidUpdate = () => {
    this.audio.update();
    this.forceUpdate();
  }

  render() {
    const { intl, label } = this.props;
    const initialized = this.audio.getInitialized();
    const canPlay = ![Infinity, NaN].includes(this.audio.duration);

    return (
      <div className='musicvideo'>
        <div
          className='canvas-container'
          onClick={canPlay && this.handleTogglePaused}
          role='button'
          style={{ cursor: canPlay && 'pointer' }}
          tabIndex='0'
          aria-label={label}
        >
          {this.audio.getLoading() && <div className='loading' />}
          <div ref={this.setCanvasContainerRef} />
        </div>
        <div className={classNames('controls-container', { visible: initialized })}>
          <div className='controls'>
            <div className='toggle' onClick={this.handleTogglePaused} role='button' tabIndex='0' aria-pressed='false'>
              {this.audio.getPaused() ? <IconButton src='play' title={intl.formatMessage(messages.play)} /> : <IconButton src='pause' title={intl.formatMessage(messages.pause)} />}
            </div>
            <Slider
              min={0}
              max={this.audio.duration}
              step={0.1}
              value={this.audio.getCurrentTime()}
              onChange={this.handleChangeCurrentTime}
              disabled={!initialized || !canPlay}
            />
          </div>
        </div>
      </div>
    );
  }

}

export default Musicvideo;
