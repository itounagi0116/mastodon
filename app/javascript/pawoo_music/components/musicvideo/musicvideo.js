import axios from 'axios';
import noop from 'lodash/noop';
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
   * The combination of FileReader, axios, AudioBuffer, and
   * AudioBufferSourceNode is used instead of HTMLAudioElement.
   * It is known that HTMLAudioElement causes noises on some environments such
   * as Apple Safari.
   */
  state = {
    audioBuffer: null,
    audioBufferSource: null,
    lastSeekDestinationOffsetToMusicTime: 0,
    loading: false,
  };

  cancelMusic = noop;
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
    this.image.source.crossOrigin = 'anonymous';
    this.updateImage(track);

    // オーディオ接続
    audioAnalyserNode.connect(audioAnalyserNode.context.destination);

    // キャンバス更新
    this.updateCanvas(track);

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
      this.updateCanvas(track);
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
      this.image.source.src = URL.createObjectURL(image);
    } else if (typeof image === 'string') {
      this.image.source.src = image;
    } else {
      this.image.source.src = defaultArtwork;
    }
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

    this.setState({ loading: true });

    /*
     * Promise based decodeAudioData is not supported by:
     * Mozilla/5.0 (iPhone; CPU iPhone OS 9_3_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13E238 Safari/601.1
     */
    arrayBufferPromise.then(
      arrayBuffer => context.decodeAudioData(arrayBuffer, audioBuffer => {
        if (this.props.track.get('id') === track.get('id') &&
            this.props.track.get('music') === track.get('music')) {
          this.setState({ audioBuffer, loading: false });

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
      lastSeekDestinationOffsetToMusicTime: this.state.audioBuffer.duration,
    });

    this.generator.stop();
  }

  handleLoadImage = () => {
    this.image.update();
    this.updateCanvas(this.props.track);
  }

  handleTogglePaused = () => {
    const { context } = this.generator.audioAnalyserNode;

    if (this.state.audioBufferSource === null) {
      if (this.state.audioBuffer !== null) {
        if (this.state.lastSeekDestinationOffsetToMusicTime < this.state.audioBuffer.duration) {
          this.offsetToAudioContextTime = this.state.lastSeekDestinationOffsetToMusicTime - context.currentTime;
        } else {
          this.offsetToAudioContextTime = -context.currentTime;
          this.generator.initialize();

          this.setState({ lastSeekDestinationOffsetToMusicTime: 0 });
        }

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

  handleBeforeChangeCurrentTime = () => {
    if (this.state.audioBufferSource !== null) {
      this.state.audioBufferSource.onended = null;
      this.state.audioBufferSource.stop();

      this.generator.stop();
    }
  };

  handleChangeCurrentTime = (lastSeekDestinationOffsetToMusicTime) => {
    this.offsetToAudioContextTime = lastSeekDestinationOffsetToMusicTime - this.generator.audioAnalyserNode.context.currentTime;
    this.setState({ lastSeekDestinationOffsetToMusicTime });
    this.generator.initialize();
  };

  handleAfterChangeCurrentTime = () => {
    if (this.state.audioBufferSource !== null) {
      this.createAudioBufferSource(this.state.audioBuffer);
    }
  }

  setCanvasContainerRef = (ref) => {
    this.canvasContainer = ref;
  }

  updateCanvas = (track) => {
    if (this.generator) {
      this.generator.changeParams(constructGeneratorOptions(track, this.image));
    }
  }

  generator = new Canvas(
    new AudioContext,
    constructGeneratorOptions(this.props.track, null),
    lightLeaks,
    this.calculateMusicCurrentTime
  );

  render() {
    const { intl, label } = this.props;
    const { audioBuffer, audioBufferSource } = this.state;

    return (
      <div className='musicvideo'>
        <div
          className='canvas-container'
          onClick={this.handleTogglePaused}
          role='button'
          tabIndex='0'
          aria-label={label}
        >
          {this.state.loading && <div className='loading' />}
          <div ref={this.setCanvasContainerRef} />
        </div>
        <div className={classNames('controls-container', { visible: audioBuffer !== null })}>
          <div className='controls'>
            <div className='toggle' onClick={this.handleTogglePaused} role='button' tabIndex='0' aria-pressed='false'>
              {audioBufferSource === null ? <IconButton src='play' title={intl.formatMessage(messages.play)} /> : <IconButton src='pause' title={intl.formatMessage(messages.pause)} />}
            </div>
            <Slider
              min={0}
              max={audioBuffer === null ? 1 : audioBuffer.duration}
              step={0.1}
              value={this.calculateMusicCurrentTime()}
              onBeforeChange={this.handleBeforeChangeCurrentTime}
              onChange={this.handleChangeCurrentTime}
              onAfterChange={this.handleAfterChangeCurrentTime}
              disabled={!audioBuffer}
            />
          </div>
        </div>
      </div>
    );
  }

}

export default Musicvideo;
