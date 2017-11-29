import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { throttle } from 'lodash';
import classNames from 'classnames';
import Icon from '../../../pawoo_music/components/icon';

const messages = defineMessages({
  play: { id: 'video.play', defaultMessage: 'Play' },
  pause: { id: 'video.pause', defaultMessage: 'Pause' },
  mute: { id: 'video.mute', defaultMessage: 'Mute sound' },
  unmute: { id: 'video.unmute', defaultMessage: 'Unmute sound' },
  hide: { id: 'video.hide', defaultMessage: 'Hide video' },
  expand: { id: 'video.expand', defaultMessage: 'Expand video' },
  close: { id: 'video.close', defaultMessage: 'Close video' },
  fullscreen: { id: 'video.fullscreen', defaultMessage: 'Full screen' },
  exit_fullscreen: { id: 'video.exit_fullscreen', defaultMessage: 'Exit full screen' },
});

const findElementPosition = el => {
  let box;

  if (el.getBoundingClientRect && el.parentNode) {
    box = el.getBoundingClientRect();
  }

  if (!box) {
    return {
      left: 0,
      top: 0,
    };
  }

  const docEl = document.documentElement;
  const body  = document.body;

  const clientLeft = docEl.clientLeft || body.clientLeft || 0;
  const scrollLeft = window.pageXOffset || body.scrollLeft;
  const left       = (box.left + scrollLeft) - clientLeft;

  const clientTop = docEl.clientTop || body.clientTop || 0;
  const scrollTop = window.pageYOffset || body.scrollTop;
  const top       = (box.top + scrollTop) - clientTop;

  return {
    left: Math.round(left),
    top: Math.round(top),
  };
};

const getPointerPosition = (el, event) => {
  const position = {};
  const box = findElementPosition(el);
  const boxW = el.offsetWidth;
  const boxH = el.offsetHeight;
  const boxY = box.top;
  const boxX = box.left;

  let pageY = event.pageY;
  let pageX = event.pageX;

  if (event.changedTouches) {
    pageX = event.changedTouches[0].pageX;
    pageY = event.changedTouches[0].pageY;
  }

  position.y = Math.max(0, Math.min(1, ((boxY - pageY) + boxH) / boxH));
  position.x = Math.max(0, Math.min(1, (pageX - boxX) / boxW));

  return position;
};

const isFullscreen = () => document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.mozFullScreenElement ||
  document.msFullscreenElement;

const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

const requestFullscreen = el => {
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
};

@injectIntl
export default class Video extends React.PureComponent {

  static propTypes = {
    preview: PropTypes.string,
    src: PropTypes.string.isRequired,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.number,
    sensitive: PropTypes.bool,
    startTime: PropTypes.number,
    onOpenVideo: PropTypes.func,
    onCloseVideo: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  state = {
    progress: 0,
    paused: true,
    dragging: false,
    fullscreen: false,
    hovered: false,
    muted: false,
    revealed: !this.props.sensitive,
  };

  setPlayerRef = c => {
    this.player = c;
  }

  setVideoRef = c => {
    this.video = c;
  }

  setSeekRef = c => {
    this.seek = c;
  }

  handlePlay = () => {
    this.setState({ paused: false });
  }

  handlePause = () => {
    this.setState({ paused: true });
  }

  handleTimeUpdate = () => {
    this.setState({ progress: 100 * (this.video.currentTime / this.video.duration) });
  }

  handleMouseDown = e => {
    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('mouseup', this.handleMouseUp, true);
    document.addEventListener('touchmove', this.handleMouseMove, true);
    document.addEventListener('touchend', this.handleMouseUp, true);

    this.setState({ dragging: true });
    this.video.pause();
    this.handleMouseMove(e);
  }

  handleMouseUp = () => {
    document.removeEventListener('mousemove', this.handleMouseMove, true);
    document.removeEventListener('mouseup', this.handleMouseUp, true);
    document.removeEventListener('touchmove', this.handleMouseMove, true);
    document.removeEventListener('touchend', this.handleMouseUp, true);

    this.setState({ dragging: false });
    this.video.play();
  }

  handleMouseMove = throttle(e => {
    const { x } = getPointerPosition(this.seek, e);
    this.video.currentTime = this.video.duration * x;
    this.setState({ progress: x * 100 });
  }, 60);

  togglePlay = () => {
    if (this.state.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }

  toggleFullscreen = () => {
    if (isFullscreen()) {
      exitFullscreen();
    } else {
      requestFullscreen(this.player);
    }
  }

  componentDidMount () {
    document.addEventListener('fullscreenchange', this.handleFullscreenChange, true);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange, true);
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange, true);
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange, true);
  }

  componentWillUnmount () {
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange, true);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange, true);
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange, true);
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange, true);
  }

  handleFullscreenChange = () => {
    this.setState({ fullscreen: isFullscreen() });
  }

  handleMouseEnter = () => {
    this.setState({ hovered: true });
  }

  handleMouseLeave = () => {
    this.setState({ hovered: false });
  }

  toggleMute = () => {
    this.video.muted = !this.video.muted;
    this.setState({ muted: this.video.muted });
  }

  toggleReveal = () => {
    if (this.state.revealed) {
      this.video.pause();
    }

    this.setState({ revealed: !this.state.revealed });
  }

  handleLoadedData = () => {
    if (this.props.startTime) {
      this.video.currentTime = this.props.startTime;
      this.video.play();
    }
  }

  handleOpenVideo = () => {
    this.video.pause();
    this.props.onOpenVideo(this.video.currentTime);
  }

  handleCloseVideo = () => {
    this.video.pause();
    this.props.onCloseVideo();
  }

  render () {
    const { preview, src, width, height, startTime, onOpenVideo, onCloseVideo, intl } = this.props;
    const { progress, dragging, paused, fullscreen, hovered, muted, revealed } = this.state;

    return (
      <div className={classNames('video-player', { inactive: !revealed, inline: width && height && !fullscreen, fullscreen })} style={{ width, height }} ref={this.setPlayerRef} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
        <video
          ref={this.setVideoRef}
          src={src}
          poster={preview}
          preload={!!startTime}
          loop
          role='button'
          tabIndex='0'
          width={width}
          height={height}
          onClick={this.togglePlay}
          onPlay={this.handlePlay}
          onPause={this.handlePause}
          onTimeUpdate={this.handleTimeUpdate}
          onLoadedData={this.handleLoadedData}
        />

        <button className={classNames('video-player__spoiler', { active: !revealed })} onClick={this.toggleReveal}>
          <span className='video-player__spoiler__title'><FormattedMessage id='status.sensitive_warning' defaultMessage='Sensitive content' /></span>
          <span className='video-player__spoiler__subtitle'><FormattedMessage id='status.sensitive_toggle' defaultMessage='Click to view' /></span>
        </button>

        <div className={classNames('video-player__controls', { active: paused || hovered })}>
          <div className='video-player__seek' onMouseDown={this.handleMouseDown} ref={this.setSeekRef}>
            <div className='video-player__seek__progress' style={{ width: `${progress}%` }} />

            <span
              className={classNames('video-player__seek__handle', { active: dragging })}
              tabIndex='0'
              style={{ left: `${progress}%` }}
            />
          </div>

          <div className='video-player__buttons left'>
            <Icon aria-label={intl.formatMessage(paused ? messages.play : messages.pause)} onClick={this.togglePlay} icon={paused ? 'play' : 'pause'} strong />
            <Icon aria-label={intl.formatMessage(muted ? messages.unmute : messages.mute)} onClick={this.toggleMute} icon={muted ? 'volume-x' : 'volume-2'} strong />
            {!onCloseVideo && <Icon aria-label={intl.formatMessage(messages.hide)} onClick={this.toggleReveal} icon='eye' strong />}
          </div>

          <div className='video-player__buttons right'>
            {(!fullscreen && onOpenVideo) && <Icon aria-label={intl.formatMessage(messages.expand)} onClick={this.handleOpenVideo} icon='maximize-2' strong />}
            {onCloseVideo && <Icon aria-label={intl.formatMessage(messages.close)} onClick={this.handleCloseVideo} icon='x' strong />}
            <Icon aria-label={intl.formatMessage(fullscreen ? messages.exit_fullscreen : messages.fullscreen)} onClick={this.toggleFullscreen} icon={fullscreen ? 'minimize' : 'maximize'} strong />
          </div>
        </div>
      </div>
    );
  }

}
