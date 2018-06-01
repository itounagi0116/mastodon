import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl } from 'react-intl';
import { Canvas } from 'musicvideo-generator';
import { BaseTexture } from 'pixi.js';
import noop from 'lodash/noop';
import { debounce } from 'lodash';
import { changePaused, changeSeekDestination } from '../../actions/player';
import Icon from '../../components/icon';
import Slider from '../../components/slider';
import { context, getCurrentTime } from '../../player/audio';
import { constructGeneratorOptions } from '../../util/musicvideo';
import { isMobile } from '../../util/is_mobile';

import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';
import lightLeaks from '../../../light_leaks.mp4';

const messages = defineMessages({
  play: { id: 'pawoo_music.musicvideo.play', defaultMessage: 'Play' },
  pause: { id: 'pawoo_music.musicvideo.pause', defaultMessage: 'Pause' },
});

@injectIntl
class PlayerControls extends ImmutablePureComponent {

  static propTypes = {
    duration: PropTypes.number,
    paused: PropTypes.bool,
    onSeekDestinationChange: PropTypes.func,
    onTogglePaused: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.timer = setInterval(() => this.forceUpdate(), 500);
  }

  componentWillUnmount () {
    clearInterval(this.timer);
  }

  render () {
    const { duration, intl, onSeekDestinationChange, onTogglePaused, paused } = this.props;

    return (
      <div className='player-controls'>
        <div className='toggle' onClick={onTogglePaused} role='button' tabIndex='0' aria-pressed='false'>
          {
            // This behavior matches one of the icon of the queued track of
            // album.
            paused ?
              <Icon icon='play' aria-label={intl.formatMessage(messages.play)} strong /> :
              <Icon icon='pause' aria-label={intl.formatMessage(messages.pause)} strong />
          }
        </div>
        <Slider
          min={0}
          max={duration}
          step={0.1}
          value={getCurrentTime()}
          onChange={onSeekDestinationChange}
          disabled={[Infinity, NaN].includes(duration)}
        />
      </div>
    );
  }

}

const mapStateToProps = (state) => ({
  audio: state.getIn(['pawoo_music', 'player', 'audio']),
  duration: state.getIn(['pawoo_music', 'player', 'duration']),
  lastSeekDestination: state.getIn(['pawoo_music', 'player', 'lastSeekDestination']),
  loading: state.getIn(['pawoo_music', 'player', 'loading']),
  paused: state.getIn(['pawoo_music', 'player', 'paused']),
  track: state.getIn(['pawoo_music', 'player', 'trackPath']) &&
         state.getIn(state.getIn(['pawoo_music', 'player', 'trackPath'])),
});

const mapDispatchToProps = (dispatch) => ({
  onPausedChange (paused) {
    dispatch(changePaused(paused));
  },

  onSeekDestinationChange (time) {
    dispatch(changeSeekDestination(time));
  },
});

const mobile = isMobile();

@connect(mapStateToProps, mapDispatchToProps)
class Musicvideo extends ImmutablePureComponent {

  static propTypes = {
    bannerHidden: PropTypes.bool,
    children: PropTypes.node,
    controlsActive: PropTypes.bool,
    fitContain: PropTypes.bool,
    label: PropTypes.string,
    lastSeekDestination: PropTypes.number.isRequired,
    onPausedChange: PropTypes.func.isRequired,
    onSeekDestinationChange: PropTypes.func,
    audio: ImmutablePropTypes.map.isRequired,
    loading: PropTypes.bool.isRequired,
    paused: PropTypes.bool.isRequired,
    track: ImmutablePropTypes.map.isRequired,
  };

  state = {
    initialized: false,
    showControls: false,
  };

  image = new BaseTexture(new Image());

  generator = new Canvas(
    context,
    constructGeneratorOptions(
      this.props.bannerHidden ?
        this.props.track.deleteIn(['video', 'banner']) : this.props.track,
        this.image
    ),
    lightLeaks,
    getCurrentTime
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
    const node = this.props.audio.get('node');
    const destination = node.get('destination');
    const source = node.get('source');

    if (destination !== null) {
      this.generator.audioAnalyserNode.connect(destination);
    }

    if (source !== null) {
      source.connect(this.generator.audioAnalyserNode);
    }

    // キャンバス更新
    this.updateCanvas();

    // キャンバス初期化
    this.generator.initialize();
    if (!this.props.paused) this.generator.start();

    // キャンバス接続
    const { view } = this.generator.getRenderer();
    const { parent } = view;

    if (parent) parent.removeChild(view);

    this.canvasContainer.appendChild(view);
  }

  componentDidUpdate ({ audio, bannerHidden, lastSeekDestination, paused, track }) {
    const { audioAnalyserNode } = this.generator;
    const image = track.getIn(['video', 'image']);
    const newDestination = this.props.audio.getIn(['node', 'destination']);
    const destination = audio.getIn(['node', 'destination']);
    const newSource = this.props.audio.getIn(['node', 'source']);
    const source = audio.getIn(['node', 'source']);

    if (newDestination !== destination) {
      if (destination !== null) {
        audioAnalyserNode.disconnect(destination);
      }

      if (newDestination !== null) {
        audioAnalyserNode.connect(newDestination);
      }
    }

    if (newSource !== source) {
      if (source !== null) {
        source.disconnect(audioAnalyserNode);
      }

      newSource.connect(audioAnalyserNode);
    }

    if (![Infinity, NaN].includes(this.props.duration) &&
        !this.state.initialized) {
      this.setState({ initialized: true });
    }

    if (this.props.paused !== paused) {
      this.updatePaused();
    }

    if (this.props.track.get('id') !== track.get('id') ||
        this.props.track.get('music') !== track.get('music') ||
        this.props.lastSeekDestination !== lastSeekDestination) {
      this.generator.initialize();
    }

    if (this.props.track.getIn(['video', 'image']) !== image) {
      if (image instanceof Blob) {
        URL.revokeObjectURL(this.image.source.src);
      }
      this.updateImage();
    }

    if (this.props.track !== track || this.props.bannerHidden !== bannerHidden) {
      this.updateCanvas();
    }
  }

  componentWillUnmount () {
    const { track } = this.props;

    this.hideControlsDebounce.cancel();

    this.image.source.removeEventListener('load', this.handleLoadImage);

    this.generator.stop();
    this.generator.destroy();

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

  handleLoadImage = () => {
    this.image.update();
    this.updateCanvas();
  }

  handleTogglePaused = () => {
    this.props.onPausedChange(!this.props.paused);
    this.showControls();
  }

  handleClick = (e) => {
    const { showControls } = this.state;

    if (!showControls) {
      e.stopPropagation();
      this.showControls();
    }
  }

  handleMouseEnter = () => {
    this.showControls();
  }

  handleMouseMove = () => {
    this.showControls();
  }

  handleMouseLeave = () => {
    this.setState({ showControls: false });
  }

  hideControlsDebounce = debounce(() => {
    this.setState({ showControls: this.props.controlsActive });
  }, 3000);

  showControls () {
    this.setState({ showControls: true });
    this.hideControlsDebounce();
  }

  setCanvasContainerRef = (ref) => {
    this.canvasContainer = ref;
  }

  updateCanvas = () => {
    this.generator.changeParams(
      constructGeneratorOptions(
        this.props.bannerHidden ?
          this.props.track.deleteIn(['video', 'banner']) : this.props.track,
        this.image
      )
    );
  }

  updatePaused = () => {
    if (this.props.paused) {
      this.generator.stop();
    } else {
      this.generator.start();
    }
  }

  render() {
    const { children, duration, fitContain, label, loading, onSeekDestinationChange, paused } = this.props;
    const { initialized } = this.state;
    const canPlay = ![Infinity, NaN].includes(duration);
    const showControls = this.state.showControls;

    return (
      <div
        className={classNames('musicvideo', { 'fit-contain': fitContain })}
        onClickCapture={mobile ? this.handleClick : noop}
        onMouseEnter={mobile ? noop : this.handleMouseEnter}
        onMouseMove={mobile ? noop : this.handleMouseMove}
        onMouseLeave={mobile ? noop : this.handleMouseLeave}
      >
        <div
          className='canvas-container'
          onClick={canPlay ? this.handleTogglePaused : noop}
          role='button'
          style={{ cursor: canPlay && 'pointer' }}
          tabIndex='0'
          aria-pressed='false'
          aria-label={label}
        >
          {loading && <div className='loading' />}
          <div ref={this.setCanvasContainerRef} />
        </div>
        <div className={classNames('controls-container', { visible: initialized && showControls })}>
          <div className='misc-controls'>{children}</div>
          <PlayerControls
            duration={duration}
            paused={paused}
            onTogglePaused={this.handleTogglePaused}
            onSeekDestinationChange={onSeekDestinationChange}
          />
        </div>
      </div>
    );
  }

}

export default Musicvideo;
