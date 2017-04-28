import Immutable from 'immutable';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Avatar from '../../../components/avatar';
import DisplayName from '../../../components/display_name';
import StatusContent from '../../../components/status_content';
import MediaGallery from '../../../components/media_gallery';
import VideoPlayer from '../../../components/video_player';
import AttachmentList from '../../../components/attachment_list';
import { Link } from 'react-router';
import { FormattedDate, FormattedNumber } from 'react-intl';
import CardContainer from '../containers/card_container';

const DetailedStatus = React.createClass({

  contextTypes: {
    router: React.PropTypes.object
  },

  propTypes: {
    status: ImmutablePropTypes.map.isRequired,
    onOpenMedia: React.PropTypes.func.isRequired,
    onOpenVideo: React.PropTypes.func.isRequired,
    autoPlayGif: React.PropTypes.bool,
  },

  mixins: [PureRenderMixin],

  handleAccountClick (e) {
    if (e.button === 0) {
      e.preventDefault();
      this.context.router.push(`/accounts/${this.props.status.getIn(['account', 'id'])}`);
    }

    e.stopPropagation();
  },

  render () {
    const status = this.props.status.get('reblog') ? this.props.status.get('reblog') : this.props.status;

    let media           = '';
    let applicationLink = '';

    let attachments = status.get('media_attachments');
    if (status.getIn(['pixiv_cards'], Immutable.List()).size > 0) {
      attachments = status.get('pixiv_cards').map(card => {
        const image_url = card.get('image_url').replace(/http:/, 'https:');
        return Immutable.fromJS({
          id: Math.random().toString(),
          preview_url: image_url,
          remote_url: '',
          text_url: card.get('url'),
          type: 'image',
          url: image_url
        });
      });
    }

    if (attachments.size > 0) {
      if (attachments.some(item => item.get('type') === 'unknown')) {
        media = <AttachmentList media={attachments} />;
      } else if (attachments.first().get('type') === 'video') {
        media = <VideoPlayer sensitive={status.get('sensitive')} media={attachments.first()} width={300} height={150} onOpenVideo={this.props.onOpenVideo} autoplay />;
      } else {
        media = <MediaGallery sensitive={status.get('sensitive')} media={attachments} height={300} onOpenMedia={this.props.onOpenMedia} autoPlayGif={this.props.autoPlayGif} />;
      }
    } else if (status.get('spoiler_text').length === 0) {
      media = <CardContainer statusId={status.get('id')} />;
    }

    if (status.get('application')) {
      applicationLink = <span> · <a className='detailed-status__application' style={{ color: 'inherit' }} href={status.getIn(['application', 'website'])} target='_blank' rel='nooopener'>{status.getIn(['application', 'name'])}</a></span>;
    }

    return (
      <div style={{ padding: '14px 10px' }} className='detailed-status'>
        <a href={status.getIn(['account', 'url'])} onClick={this.handleAccountClick} className='detailed-status__display-name' style={{ display: 'block', overflow: 'hidden', marginBottom: '15px' }}>
          <div style={{ float: 'left', marginRight: '10px' }}><Avatar src={status.getIn(['account', 'avatar'])} staticSrc={status.getIn(['account', 'avatar_static'])} size={48} /></div>
          <DisplayName account={status.get('account')} />
        </a>

        <StatusContent status={status} />

        {media}

        <div className='detailed-status__meta'>
          <a className='detailed-status__datetime' style={{ color: 'inherit' }} href={status.get('url')} target='_blank' rel='noopener'><FormattedDate value={new Date(status.get('created_at'))} hour12={false} year='numeric' month='short' day='2-digit' hour='2-digit' minute='2-digit' /></a>{applicationLink} · <Link to={`/statuses/${status.get('id')}/reblogs`} style={{ color: 'inherit', textDecoration: 'none' }}><i className='fa fa-retweet' /><span style={{ fontWeight: '500', fontSize: '12px', marginLeft: '6px', display: 'inline-block' }}><FormattedNumber value={status.get('reblogs_count')} /></span></Link> · <Link to={`/statuses/${status.get('id')}/favourites`} style={{ color: 'inherit', textDecoration: 'none' }}><i className='fa fa-star' /><span style={{ fontWeight: '500', fontSize: '12px', marginLeft: '6px', display: 'inline-block' }}><FormattedNumber value={status.get('favourites_count')} /></span></Link>
        </div>
      </div>
    );
  }

});

export default DetailedStatus;
