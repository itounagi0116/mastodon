import noop from 'lodash/noop';
import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { Canvas } from 'musicvideo-generator';
import { BaseTexture } from 'pixi.js';
import IconButton from '../icon_button';
import Slider from '../slider';
import { constructGeneratorOptions } from '../../util/musicvideo';
import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

const convertToURL = (file) => ((file instanceof File) ? URL.createObjectURL(file) : file);

class Musicvideo extends ImmutablePureComponent {

  static propTypes = {
    track: ImmutablePropTypes.map.isRequired,
    label: PropTypes.string,
    autoPlay: PropTypes.bool,
    onEnded: PropTypes.func,
  };

  static defaultProps = {
    autoPlay: true,
    onEnded: noop,
  };

  state = {
    time: 0,
    music: convertToURL(this.props.track.get('music')),
    paused: true,
    controls: false,
  };

  image = null;

  componentDidMount () {
    const { track, autoPlay } = this.props;

    // ジャケット画像
    // Using BaseTexture "constructor" is important to prevent from associating
    // the source URL and image element. The src attribute of the element is
    // dynamic.
    this.image = new BaseTexture(new Image());
    this.image.source.addEventListener('load', this.handleLoadImage, { once: false });
    this.image.source.crossOrigin = 'anonymous';
    this.image.source.src = convertToURL(track.getIn(['video', 'image'])) || defaultArtwork;

    // コンテキスト作成
    const audioContext = new AudioContext;
    this.generator = new Canvas(audioContext, constructGeneratorOptions(track, this.image), () => this.audioElement.currentTime);

    // オーディオ接続
    const { audioAnalyserNode } = this.generator;
    audioAnalyserNode.connect(audioContext.destination);
    this.audioAnalyser = audioAnalyserNode.context.createMediaElementSource(this.audioElement);
    this.audioAnalyser.connect(audioAnalyserNode);

    // 初期化
    this.generator.initialize();

    // キャンバス接続
    const { view } = this.generator.getRenderer();
    const { parent } = view;

    if (parent) parent.removeChild(view);

    this.canvasContainer.appendChild(view);

    this.timer = setInterval(this.updateCurrentTime, 500);
    this.audioElement.addEventListener('ended', this.handleEnded);

    if (autoPlay) {
      this.generator.start();
    }

    setTimeout(() => this.setState({ controls: true }), 240);
  }

  componentWillReceiveProps ({ track }) {
    const music = track.get('music');
    const image = track.getIn(['video', 'image']);

    if (music !== this.props.track.get('music')) {
      this.setState({ music: convertToURL(music) });
    }

    if (image !== this.props.track.getIn(['video', 'image'])) {
      if (track.getIn(['video', 'image']) instanceof File) {
        URL.revokeObjectURL(this.image.source.src);
      }
      this.image.source.src = convertToURL(image) || defaultArtwork;
    }
  }

  componentDidUpdate ({ track }, { music }) {
    if (music !== this.state.music) {
      if (track.get('music') instanceof File) {
        URL.revokeObjectURL(music);
      }

      this.generator.initialize();
    }

    if (track !== this.props.track) {
      this.updateCanvas();
    }
  }

  componentWillUnmount () {
    const { track } = this.props;
    const { music } = this.state;

    clearInterval(this.timer);

    if (this.image) {
      this.image.source.removeEventListener('load', this.handleLoadImage);
    }

    if (this.audioElement) {
      this.audioElement.removeEventListener('ended', this.handleEnded);
    }

    if (this.generator) {
      this.generator.stop();
      this.generator.audioAnalyserNode.context.close();
      this.generator._albumArt._root._children.forEach((child) => {
        child.component.displayObject.destroy();
      });
      this.generator._albumArt._root.displayObject.destroy();
      this.generator._albumArt.renderer.destroy();
    }

    if (this.audioAnalyser) {
      this.audioAnalyser.disconnect();
    }

    if ((track.get('music') instanceof File)) {
      URL.revokeObjectURL(music);
    }

    if ((track.getIn(['video', 'image']) instanceof File)) {
      URL.revokeObjectURL(this.image.source.src);
    }
  }

  handleEnded = () => {
    this.generator.stop();
    this.setState({ paused: true });
    this.props.onEnded();
  }

  handleLoadImage = () => {
    this.image.update();
    this.updateCanvas();
  }

  handleTogglePaused = () => {
    if (this.state.music) {
      const paused = this.audioElement.paused;
      this.setState({ paused: !paused });

      if (paused) {
        if (this.audioElement.ended) {
          this.audioElement.currentTime = 0;
        }

        this.audioElement.play();
        this.generator.start();
      } else {
        this.audioElement.pause();
        this.generator.stop();
      }
    }
  }

  handleChangeCurrentTime = (value) => {
    const time = this.audioElement.duration * value / 100;
    this.audioElement.currentTime = 0; // TODO: 過去にシークできなかった。今は消してもいいかも？
    this.audioElement.currentTime = time;
    this.generator.initialize();
    this.setState({ time: value });
  };

  setAudioRef = (ref) => {
    this.audioElement = ref;
  }

  setCanvasContainerRef = (ref) => {
    this.canvasContainer = ref;
  }

  updateCanvas = () => {
    if (this.generator) {
      this.generator.changeParams(constructGeneratorOptions(this.props.track, this.image));
    }
  }

  updateCurrentTime = () => {
    const audioElement = this.audioElement;

    if (audioElement) {
      if (!audioElement.paused  && !audioElement.seeking) {
        this.setState({ paused: audioElement.paused, time: 100 * this.audioElement.currentTime / this.audioElement.duration });
      }
    }
  }

  render() {
    const { autoPlay, label } = this.props;
    const { music, paused, controls, time } = this.state;

    return (
      <div className='musicvideo'>
        <div
          className='canvas-container'
          ref={this.setCanvasContainerRef}
          onClick={this.handleTogglePaused}
          role='button'
          tabIndex='0'
          aria-label={label}
        />
        <audio autoPlay={autoPlay} crossOrigin='anonymous' ref={this.setAudioRef} src={music} />
        <div className={classNames('controls-container', { visible: controls })}>
          <div className='controls'>
            <div className={classNames('toggle', { disabled: !music })} onClick={this.handleTogglePaused} role='button' tabIndex='0' aria-pressed='false'>
              {paused ? <IconButton src='play' /> : <IconButton src='pause' />}
            </div>
            <Slider
              min={0}
              max={100}
              step={0.1}
              value={time}
              onChange={this.handleChangeCurrentTime}
              disabled={!music}
              ref={this.setSeekbarRef}
            />
          </div>
        </div>
      </div>
    );
  }

}

export default Musicvideo;
