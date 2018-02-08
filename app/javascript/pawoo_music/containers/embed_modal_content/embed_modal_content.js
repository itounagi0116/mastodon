import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import api from '../../../mastodon/api';
import EmbeddedTrack from '../embedded_track';
import EmbeddedAlbum from '../embedded_album';
import { changePaused, changeTrackPath } from '../../actions/player';
import Checkbox from '../../components/checkbox';
import Oembed from '../../components/oembed';
import TweetButton from '../../../mastodon/components/tweet_button';

const mapDispatchToProps = dispatch => ({
  onTrackUnmount () {
    dispatch(changePaused(true));
    dispatch(changeTrackPath(null));
  },
});

@connect(null, mapDispatchToProps)
export default class EmbedModalContent extends ImmutablePureComponent {

  static propTypes = {
    onTrackUnmount: PropTypes.func.isRequired,
    status: ImmutablePropTypes.map.isRequired,
  }

  state = {
    loading: true,
    oembed: null,
    showinfo: true,
  };

  componentDidMount () {
    this.loadOembed();
  }

  componentDidUpdate (prevProps, prevState) {
    const { showinfo } = this.state;

    if (prevState.showinfo !== showinfo) {
      this.loadOembed();
    }
  }

  loadOembed () {
    const { status } = this.props;
    const { showinfo } = this.state;

    this.setState({ loading: true });

    api().post('/api/web/embed', { url: status.get('url'), hideinfo: Number(!showinfo) }).then(res => {
      this.setState({ loading: false, oembed: res.data });
    });
  }

  handleTextareaClick = (e) => {
    e.target.select();
  }

  handleChangeShowInfo = () => {
    const { onTrackUnmount } = this.props;
    const { showinfo } = this.state;

    onTrackUnmount();
    this.setState({ showinfo: !showinfo });
  }

  render () {
    const { status } = this.props;
    const { oembed, showinfo } = this.state;
    let content;

    if (status.has('album')) {
      content = <EmbeddedAlbum infoHidden={!showinfo} preview statusId={status.get('id')} />;
    } else if (status.has('track')) {
      content = <EmbeddedTrack infoHidden={!showinfo} preview statusId={status.get('id')} />;
    } else {
      content = <Oembed oembed={oembed} />;
    }

    return (
      <div className='embed-modal-content'>
        <h4><FormattedMessage id='status.share' defaultMessage='Share' /></h4>

        <div className='embed-modal-container'>
          <p className='hint'>
            <FormattedMessage id='embed.instructions.share' defaultMessage='Share the link below.' />
          </p>

          <div className='embed-modal-share-box'>
            <input
              type='text'
              className='embed-modal-html'
              readOnly
              value={status.get('url')}
              onClick={this.handleTextareaClick}
            />
            {status.has('track') && <TweetButton text={`${status.getIn(['track', 'artist'])} - ${status.getIn(['track', 'title'])}`} url={status.get('url')} hashtags='PawooMusic' />}
          </div>
        </div>

        <h4><FormattedMessage id='status.embed' defaultMessage='Embed' /></h4>

        <div className='embed-modal-container'>
          <p className='hint'>
            <FormattedMessage id='embed.instructions' defaultMessage='Embed this status on your website by copying the code below.' />
          </p>

          <input
            type='text'
            className='embed-modal-html'
            readOnly
            value={oembed && oembed.html || ''}
            onClick={this.handleTextareaClick}
          />

          {(status.has('album') || status.has('track')) && (
            <div className='options'>
              <p className='hint'>
                <FormattedMessage id='embed.options' defaultMessage='Options' />
              </p>

              <Checkbox checked={showinfo} onChange={this.handleChangeShowInfo}>
                <FormattedMessage
                  id='embed.showinfo'
                  defaultMessage='Show artist and title.'
                />
              </Checkbox>
            </div>
          )}

          <p className='hint'>
            <FormattedMessage id='embed.preview' defaultMessage='Here is what it will look like:' />
          </p>

          <div className='content'>{content}</div>
        </div>
      </div>
    );
  }

}
