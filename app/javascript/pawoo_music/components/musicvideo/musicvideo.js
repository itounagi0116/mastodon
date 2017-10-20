import axios from 'axios';
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
import lightLeaks from '../../../light_leaks.mp4';

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

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

  /*
   * The combination of FileReader, axios, AudioBuffer, and
   * AudioBufferSourceNode is used instead of HTMLAudioElement.
   * It is known that HTMLAudioElement causes noises on some environments such
   * as Apple Safari.
   */
  state = {
    audioBuffer: null,
    audioBufferSource: null,
    lastSeekDestinationOffsetToMusicTime: 0,
  };

  cancelMusic = noop;
  generator = new Canvas(
    new AudioContext,
    constructGeneratorOptions(this.props.track, null),
    lightLeaks,
    this.calculateMusicCurrentTime
  );
  image = new BaseTexture(new Image());
  offsetToAudioContextTime = 0;

  componentDidMount () {
    const { audioAnalyserNode } = this.generator;
    const { track } = this.props;

    // ジャケット画像
    // Using BaseTexture "constructor" is important to prevent from associating
    // the source URL and image element. The src attribute of the element is
    // dynamic.
    this.image.source.addEventListener('load', this.handleLoadImage, { once: false });
    this.updateImage(track);

    // オーディオ接続
    audioAnalyserNode.connect(audioAnalyserNode.context.destination);

    // キャンバス更新
    this.updateCanvas();

    // キャンバス初期化
    this.generator.initialize();

    // キャンバス接続
    const { view } = this.generator.getRenderer();
    const { parent } = view;

    if (parent) parent.removeChild(view);

    this.canvasContainer.appendChild(view);

    // 楽曲更新
    this.updateMusic(track);

    this.timer = setInterval(() => this.forceUpdate(), 500);
  }

  componentWillReceiveProps ({ track }) {
    const id = track.get('id');
    const image = track.getIn(['video', 'image']);
    const music = track.get('music');
    const oldId = this.props.track.get('id');
    const oldImage = this.props.track.getIn(['video', 'image']);
    const oldMusic = this.props.track.get('music');

    if (image !== oldImage) {
      if (oldImage instanceof Blob) {
        URL.revokeObjectURL(this.image.source.src);
      }

      this.updateImage(track);
    }

    if (id !== oldId || music !== oldMusic) {
      this.updateMusic(track);
    }

    if (track !== this.props.track) {
      this.updateCanvas();
    }
  }

  componentWillUnmount () {
    const { track } = this.props;

    this.cancelMusic();
    clearInterval(this.timer);

    if (this.image) {
      this.image.source.removeEventListener('load', this.handleLoadImage);
    }

    if (this.state.audioBufferSource) {
      this.state.audioBufferSource.stop();
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

    if ((track.getIn(['video', 'image']) instanceof Blob)) {
      URL.revokeObjectURL(this.image.source.src);
    }
  }

  updateImage = (track) => {
    const image = track.getIn(['video', 'image']);

    if (image instanceof Blob) {
      return URL.createObjectURL(image);
    }

    if (typeof image === 'string') {
      return image;
    }

    return defaultArtwork;
  }

  updateMusic = (track) => {
    const { context } = this.generator.audioAnalyserNode;
    let arrayBufferPromise;

    this.cancelMusic();

    if (track.has('music') && track.get('music') !== null) {
      arrayBufferPromise = new Promise((resolve, reject) => {
        const reader = new FileReader;

        reader.onload = ({ target }) => target.result !== null ?
          resolve(target.result) : reject(target.error);

        reader.readAsArrayBuffer(track.get('music'));

        this.cancelMusic = () => reader.abort();
      });
    } else if (track.has('id') && track.get('id') !== null) {
      const source = axios.CancelToken.source();

      arrayBufferPromise = axios.get(
        `/api/v1/statuses/${track.get('id')}/music`,
        { responseType: 'arraybuffer', cancelToken: source.token }
      ).then(({ data }) => data);

      this.cancelMusic = () => source.cancel();
    } else {
      return;
    }

    /*
     * Promise based decodeAudioData is not supported by:
     * Mozilla/5.0 (iPhone; CPU iPhone OS 9_3_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13E238 Safari/601.1
     */
    arrayBufferPromise.then(
      arrayBuffer => context.decodeAudioData(arrayBuffer, audioBuffer => {
        if (this.props.track.get('id') === track.get('id') &&
            this.props.track.get('music') === track.get('music')) {
          this.setState({ audioBuffer });

          if (this.state.audioBufferSource !== null) {
            this.state.audioBufferSource.stop();
          }

          this.offsetToAudioContextTime = -context.currentTime;
          this.generator.initialize();

          if (this.state.audioBufferSource !== null || this.props.autoPlay) {
            this.createAudioBufferSource(audioBuffer);
            this.setState({ lastSeekDestinationOffsetToMusicTime: 0 });
          }
        }
      })
    );
  }

  createAudioBufferSource = (audioBuffer) => {
    const { audioAnalyserNode } = this.generator;
    const audioBufferSource = audioAnalyserNode.context.createBufferSource();

    audioBufferSource.onended = this.handleEnded;
    audioBufferSource.buffer = audioBuffer;
    audioBufferSource.connect(audioAnalyserNode);
    audioBufferSource.start(0, this.calculateMusicCurrentTime());

    this.generator.start();

    this.setState({ audioBufferSource });
  }

  calculateMusicCurrentTime = () => {
    return this.state.audioBufferSource === null ?
      this.state.lastSeekDestinationOffsetToMusicTime :
      this.generator.audioAnalyserNode.context.currentTime + this.offsetToAudioContextTime;
  }

  handleEnded = () => {
    if (this.state.audioBufferSource === null) {
      return;
    }

    this.state.audioBufferSource.stop();
    this.setState({
      audioBufferSource: null,
      lastSeekDestinationOffsetToMusicTime: this.calculateMusicCurrentTime(),
    });

    this.generator.stop();

    this.props.onEnded();
  }

  handleLoadImage = () => {
    this.image.update();
    this.updateCanvas();
  }

  handleTogglePaused = () => {
    const { context } = this.generator.audioAnalyserNode;

    if (this.state.audioBufferSource === null) {
      if (this.state.audioBuffer !== null) {
        this.offsetToAudioContextTime = this.state.lastSeekDestinationOffsetToMusicTime - context.currentTime;
        this.createAudioBufferSource(this.state.audioBuffer);
      }
    } else {
      this.setState({
        audioBufferSource: null,
        lastSeekDestinationOffsetToMusicTime: this.calculateMusicCurrentTime(),
      });

      this.state.audioBufferSource.stop();
      this.generator.stop();
    }
  }

  handleChangeCurrentTime = (lastSeekDestinationOffsetToMusicTime) => {
    this.offsetToAudioContextTime = lastSeekDestinationOffsetToMusicTime - this.generator.audioAnalyserNode.context.currentTime;
    this.generator.initialize();

    if (this.state.audioBufferSource !== null) {
      this.state.audioBufferSource.stop();

      this.createAudioBufferSource(this.state.audioBuffer);
    }

    this.setState({ lastSeekDestinationOffsetToMusicTime });
  }

  setCanvasContainerRef = (ref) => {
    this.canvasContainer = ref;
  }

  updateCanvas = () => {
    if (this.generator) {
      this.generator.changeParams(constructGeneratorOptions(this.props.track, this.image));
    }
  }

  render() {
    const { label } = this.props;
    const { audioBuffer, audioBufferSource } = this.state;

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
        <div className={classNames('controls-container', { visible: audioBuffer !== null })}>
          <div className='controls'>
            <div className='toggle' onClick={this.handleTogglePaused} role='button' tabIndex='0' aria-pressed='false'>
              {audioBufferSource === null ? <IconButton src='play' /> : <IconButton src='pause' />}
            </div>
            <Slider
              min={0}
              max={audioBuffer === null ? 1 : audioBuffer.duration}
              step={0.1}
              value={this.calculateMusicCurrentTime()}
              onChange={this.handleChangeCurrentTime}
              disabled={!audioBuffer}
              ref={this.setSeekbarRef}
            />
          </div>
        </div>
      </div>
    );
  }

}

export default Musicvideo;
