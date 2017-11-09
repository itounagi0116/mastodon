import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import IconButton from '../../pawoo_music/components/icon_button';
import { injectIntl, FormattedMessage } from 'react-intl';
import { isIOS } from '../is_mobile';

@injectIntl
export default class VideoPlayer extends React.PureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    media: ImmutablePropTypes.map.isRequired,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.number,
    sensitive: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    autoplay: PropTypes.bool,
    onOpenVideo: PropTypes.func.isRequired,
  };

  static defaultProps = {
    width: 'auto',
    height: 239,
  };

  state = {
    visible: !this.props.sensitive,
    preview: true,
    muted: false,
    hasAudio: true,
    videoError: false,
    paused: false,
  };

  handleClick = () => {
    this.setState({ muted: !this.state.muted });
  }

  handleVideoClick = (e) => {
    e.stopPropagation();

    const node = this.video;

    if (node.paused) {
      node.play();
      this.setState({ paused: false });
    } else {
      node.pause();
      this.setState({ paused: true });
    }
  }

  handleOpen = () => {
    this.setState({ preview: !this.state.preview });
  }

  handleVisibility = () => {
    this.setState({
      visible: !this.state.visible,
      preview: true,
    });
  }

  handleExpand = (e) => {
    e.stopPropagation();
    let time = 0;
    if (this.video) {
      this.video.pause();
      time = this.video.currentTime;
    }

    this.props.onOpenVideo(this.props.media, time);
  }

  setRef = (c) => {
    this.video = c;
  }

  handleLoadedData = () => {
    if (('WebkitAppearance' in document.documentElement.style && this.video.audioTracks && this.video.audioTracks.length === 0) || this.video.mozHasAudio === false) {
      this.setState({ hasAudio: false });
    }
  }

  handleVideoError = () => {
    this.setState({ videoError: true });
  }

  componentDidMount () {
    if (!this.video) {
      return;
    }

    this.video.addEventListener('loadeddata', this.handleLoadedData);
    this.video.addEventListener('error', this.handleVideoError);
  }

  componentDidUpdate () {
    if (!this.video) {
      return;
    }

    this.video.addEventListener('loadeddata', this.handleLoadedData);
    this.video.addEventListener('error', this.handleVideoError);
  }

  componentWillUnmount () {
    if (!this.video) {
      return;
    }

    this.video.removeEventListener('loadeddata', this.handleLoadedData);
    this.video.removeEventListener('error', this.handleVideoError);
  }

  render () {
    const { media, width, height, sensitive, autoplay } = this.props;

    let spoilerButton = (
      <div className={`status__video-player-spoiler ${this.state.visible ? 'status__video-player-spoiler--visible' : ''}`}>
        <IconButton src={this.state.visible ? 'eye' : 'eye-off'} onClick={this.handleVisibility} />
      </div>
    );

    let expandButton = '';

    if (this.context.router) {
      expandButton = (
        <div className='status__video-player-expand'>
          <IconButton src='maximize-2' onClick={this.handleExpand} />
        </div>
      );
    }

    if (!this.state.visible) {
      if (sensitive) {
        return (
          <button style={{ width: `${width}px`, height: `${height}px`, marginTop: '8px' }} className='media-spoiler' onClick={this.handleVisibility}>
            {spoilerButton}
            <span className='media-spoiler__warning'><FormattedMessage id='status.sensitive_warning' defaultMessage='Sensitive content' /></span>
            <span className='media-spoiler__trigger'><FormattedMessage id='status.sensitive_toggle' defaultMessage='Click to view' /></span>
          </button>
        );
      } else {
        return (
          <button style={{ width: `${width}px`, height: `${height}px`, marginTop: '8px' }} className='media-spoiler' onClick={this.handleVisibility}>
            {spoilerButton}
            <span className='media-spoiler__warning'><FormattedMessage id='status.media_hidden' defaultMessage='Media hidden' /></span>
            <span className='media-spoiler__trigger'><FormattedMessage id='status.sensitive_toggle' defaultMessage='Click to view' /></span>
          </button>
        );
      }
    }

    if (this.state.preview && !autoplay) {
      return (
        <button className='media-spoiler-video' style={{ width: `${width}px`, height: `${height}px`, backgroundImage: `url(${media.get('preview_url')})` }} onClick={this.handleOpen}>
          {spoilerButton}
          <div className='media-spoiler-video-play-icon'><i className='fa fa-play' /></div>
          {expandButton}
        </button>
      );
    }

    if (this.state.videoError) {
      return (
        <div style={{ width: `${width}px`, height: `${height}px` }} className='video-error-cover' >
          <span className='media-spoiler__warning'><FormattedMessage id='video_player.video_error' defaultMessage='Video could not be played' /></span>
        </div>
      );
    }

    const videoOverlayElement = (
      <div className='video-overlay'>
        <div className='video-overlay-icon'>
          <i className={`fa ${this.video && this.state.paused ? 'fa-play' : 'fa-pause'}`} />
        </div>
      </div>
    );

    return (
      <div className={`status__video-player ${this.video && this.state.paused ? ' is-paused' : ''}`} style={{ width: `${width}px`, height: `${height}px` }} onClick={this.handleVideoClick}>
        {spoilerButton}
        {videoOverlayElement}
        {expandButton}
        <video
          className='status__video-player-video'
          role='button'
          tabIndex='0'
          ref={this.setRef}
          src={media.get('url')}
          autoPlay={!isIOS()}
          loop
          muted={this.state.muted}
        />
      </div>
    );
  }

}
