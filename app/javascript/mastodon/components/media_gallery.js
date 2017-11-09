import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import IconButton from '../../pawoo_music/components/icon_button';
import { injectIntl, FormattedMessage } from 'react-intl';
import { isIOS } from '../is_mobile';

class Item extends React.PureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    attachment: ImmutablePropTypes.map.isRequired,
    index: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
    autoPlayGif: PropTypes.bool,
    expandMedia: PropTypes.bool.isRequired,
    lineMedia: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    autoPlayGif: false,
  };

  handleMouseEnter = (e) => {
    if (this.hoverToPlay()) {
      e.target.play();
    }
  }

  handleMouseLeave = (e) => {
    if (this.hoverToPlay()) {
      e.target.pause();
      e.target.currentTime = 0;
    }
  }

  hoverToPlay () {
    const { attachment, autoPlayGif } = this.props;
    return !autoPlayGif && attachment.get('type') === 'gifv';
  }

  handleClick = (e) => {
    const { index, onClick } = this.props;

    if (this.context.router && e.button === 0) {
      e.preventDefault();
      onClick(index);
    }

    e.stopPropagation();
  }

  render () {
    const { attachment, index, size, expandMedia, lineMedia } = this.props;

    let width  = 50;
    let height = 100;
    let top    = 'auto';
    let left   = 'auto';
    let bottom = 'auto';
    let right  = 'auto';

    if (size === 1 || expandMedia) {
      width = 100;
    } else if (lineMedia) {
      width = (100 - (size - 1)) / size;
      left = `${index}%`;
    }

    if (!expandMedia && !lineMedia) {
      if (size === 4 || (size === 3 && index > 0)) {
        height = 50;
      }

      if (size === 2) {
        if (index === 0) {
          right = '2px';
        } else {
          left = '2px';
        }
      } else if (size === 3) {
        if (index === 0) {
          right = '2px';
        } else if (index > 0) {
          left = '2px';
        }

        if (index === 1) {
          bottom = '2px';
        } else if (index > 1) {
          top = '2px';
        }
      } else if (size === 4) {
        if (index === 0 || index === 2) {
          right = '2px';
        }

        if (index === 1 || index === 3) {
          left = '2px';
        }

        if (index < 2) {
          bottom = '2px';
        } else {
          top = '2px';
        }
      }
    }

    let thumbnail = '';

    if (attachment.get('type') === 'image') {
      const previewUrl = attachment.get('preview_url');
      const previewWidth = attachment.getIn(['meta', 'small', 'width']);

      const originalUrl = attachment.get('url');
      const originalWidth = attachment.getIn(['meta', 'original', 'width']);

      const hasSize = typeof originalWidth === 'number' && typeof previewWidth === 'number';

      const srcSet = hasSize ? `${originalUrl} ${originalWidth}w, ${previewUrl} ${previewWidth}w` : null;
      const sizes = hasSize ? `(min-width: 1025px) ${320 * (width / 100)}px, ${width}vw` : null;

      thumbnail = (
        <a
          className={expandMedia ? null : 'media-gallery__item-thumbnail'}
          href={attachment.get('remote_url') || originalUrl}
          onClick={this.handleClick}
          target='_blank'
        >
          <img src={previewUrl} srcSet={srcSet} sizes={sizes} alt='' style={expandMedia ? { width: '100%' } : null} />
        </a>
      );
    } else if (attachment.get('type') === 'gifv') {
      const autoPlay = !isIOS() && this.props.autoPlayGif;

      thumbnail = (
        <div className={`media-gallery__gifv ${autoPlay ? 'autoplay' : ''}`}>
          <video
            className='media-gallery__item-gifv-thumbnail'
            role='application'
            src={attachment.get('url')}
            onClick={this.handleClick}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            autoPlay={autoPlay}
            loop
            muted
          />

          <span className='media-gallery__gifv__label'>GIF</span>
        </div>
      );
    }

    return (
      <div className='media-gallery__item' key={attachment.get('id')} style={{ left: left, top: top, right: right, bottom: bottom, width: `${width}%`, height: `${height}%` }}>
        {thumbnail}
      </div>
    );
  }

}

@injectIntl
export default class MediaGallery extends React.PureComponent {

  static propTypes = {
    sensitive: PropTypes.bool,
    media: ImmutablePropTypes.list.isRequired,
    height: PropTypes.number.isRequired,
    onOpenMedia: PropTypes.func.isRequired,
    autoPlayGif: PropTypes.bool.isRequired,
    expandMedia: PropTypes.bool,
    lineMedia: PropTypes.bool,
  };

  static defaultProps = {
    expandMedia: false,
    lineMedia: false,
    autoPlayGif: false,
  };

  state = {
    visible: !this.props.sensitive,
  };

  componentWillReceiveProps (nextProps) {
    if (nextProps.sensitive !== this.props.sensitive) {
      this.setState({ visible: !nextProps.sensitive });
    }
  }

  handleOpen = () => {
    this.setState({ visible: !this.state.visible });
  }

  handleClick = (index) => {
    this.props.onOpenMedia(this.props.media, index);
  }

  render () {
    const { media, sensitive, expandMedia, lineMedia } = this.props;

    let children;

    if (!this.state.visible) {
      let warning;

      if (sensitive) {
        warning = <FormattedMessage id='status.sensitive_warning' defaultMessage='Sensitive content' />;
      } else {
        warning = <FormattedMessage id='status.media_hidden' defaultMessage='Media hidden' />;
      }

      children = (
        <button className='media-spoiler' onClick={this.handleOpen}>
          <span className='media-spoiler__warning'>{warning}</span>
          <span className='media-spoiler__trigger'><FormattedMessage id='status.sensitive_toggle' defaultMessage='Click to view' /></span>
        </button>
      );
    } else {
      const size = media.take(4).size;
      children = media.take(4).map((attachment, i) =>
        <Item key={attachment.get('id')} onClick={this.handleClick} attachment={attachment} autoPlayGif={this.props.autoPlayGif} index={i} size={size} expandMedia={expandMedia} lineMedia={lineMedia} />
      );
    }

    return (
      <div className='media-gallery' style={{ height: (expandMedia && this.state.visible) ? 'auto' : `${this.props.height}px` }}>
        <div className={`spoiler-button ${this.state.visible ? 'spoiler-button--visible' : ''}`}>
          <IconButton src={this.state.visible ? 'eye' : 'eye-off'} onClick={this.handleOpen} />
        </div>

        {children}
      </div>
    );
  }

}
