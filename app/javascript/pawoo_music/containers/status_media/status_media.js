import React from 'react';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { openModal } from '../../../mastodon/actions/modal';
import MediaGallery from '../../../mastodon/components/media_gallery';
import Video from '../../../mastodon/features/video';
import CardContainer from '../../../mastodon/features/status/containers/card_container';
import BoothWidget from '../../../mastodon/components/booth_widget';
import SCWidget from '../../../mastodon/components/sc_widget';
import YTWidget from '../../../mastodon/components/yt_widget';
import { fetchBoothItem } from '../../../mastodon/actions/booth_items';

const mapStateToProps = (state, { status }) => ({
  autoPlayGif: state.getIn(['meta', 'auto_play_gif']) || false,
  boothItem: state.getIn(['booth_items', status.get('booth_item_id')]),
});

@connect(mapStateToProps)
export default class StatusMedia extends ImmutablePureComponent {

  static propTypes = {
    status: ImmutablePropTypes.map,
    autoPlayGif: PropTypes.bool,
    detail: PropTypes.bool,
    boothItem: ImmutablePropTypes.map,
    dispatch: PropTypes.func.isRequired,
  };

  static defaultProps = {
    detail: false,
  }

  componentDidMount () {
    const { status, boothItem, dispatch } = this.props;
    const boothItemId = status.get('booth_item_id');

    if (!boothItem && boothItemId) {
      dispatch(fetchBoothItem(boothItemId));
    }
  }

  handleOpenMedia = (media, index) => {
    const { dispatch } = this.props;
    dispatch(openModal('MEDIA', { media, index }));
  }

  handleOpenVideo = (time) => {
    const { dispatch, status } = this.props;
    const media = status.getIn(['media_attachments', 0]);

    dispatch(openModal('VIDEO', { media, time }));
  }

  render () {
    const { status, detail } = this.props;
    let media = null;

    if (!status) {
      return null;
    }

    let attachments = status.get('media_attachments');
    if (attachments.size === 0 && status.getIn(['pixiv_cards'], Immutable.List()).size > 0) {
      attachments = status.get('pixiv_cards').map(card => {
        return Immutable.fromJS({
          id: Math.random().toString(),
          preview_url: card.get('image_url'),
          remote_url: '',
          text_url: card.get('url'),
          type: 'image',
          url: card.get('image_url'),
        });
      });
    }

    if (attachments.size > 0) {
      if (attachments.some(item => item.get('type') === 'unknown')) {

      } else if (attachments.first().get('type') === 'video') {
        const video = attachments.first();
        const height = detail ? 300 : 239;

        media = (
          <Video
            preview={video.get('preview_url')}
            src={video.get('url')}
            width={'100%'}
            height={height}
            sensitive={status.get('sensitive')}
            onOpenVideo={this.handleOpenVideo}
          />
        );
      } else {
        const height = detail ? 300 : 132;
        media = <MediaGallery media={attachments} sensitive={status.get('sensitive')} height={height} onOpenMedia={this.handleOpenMedia} autoPlayGif={this.props.autoPlayGif} expandMedia={detail} />;
      }
    }

    const youtube_pattern = /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\/?\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/;
    const soundcloud_pattern = /soundcloud\.com\/([a-zA-Z0-9\-\_\.]+)\/([a-zA-Z0-9\-\_\.]+)(|\/)/;
    if (!media) {
      if (this.props.boothItem) {
        const boothItemUrl = status.get('booth_item_url');
        const boothItemId = status.get('booth_item_id');

        media = <BoothWidget url={boothItemUrl} itemId={boothItemId} boothItem={this.props.boothItem} />;
      } else if (status.get('content').match(youtube_pattern)) {
        const videoId = status.get('content').match(youtube_pattern)[1];
        media = <YTWidget videoId={videoId} detail={detail} />;
      } else if (status.get('content').match(soundcloud_pattern)) {
        const url = 'https://' + status.get('content').match(soundcloud_pattern)[0];
        media = <SCWidget url={url} detail={detail} />;
      }
    }

    if (detail && !media) {
      if (status.get('spoiler_text').length === 0) {
        media = <CardContainer statusId={status.get('id')} />;
      }
    }

    if (!media) {
      return null;
    }

    return (
      <div className='status-media'>
        {media}
      </div>
    );
  }

}
