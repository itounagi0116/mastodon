import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import IconButton from '../../components/icon_button';
import DropdownMenuContainer from '../dropdown_menu';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { makeGetStatus } from '../../../mastodon/selectors';
import {
  replyCompose,
  mentionCompose,
} from '../../../mastodon/actions/compose';
import {
  reblog,
  favourite,
  unreblog,
  unfavourite,
} from '../../../mastodon/actions/interactions';
import {
  blockAccount,
  muteAccount,
} from '../../../mastodon/actions/accounts';
import { muteStatus, unmuteStatus, deleteStatus, pinStatus, unpinStatus } from '../../../mastodon/actions/statuses';
import { initReport } from '../../../mastodon/actions/reports';
import { openModal } from '../../../mastodon/actions/modal';
import { generateTrackMv } from '../../actions/tracks';
import { showTrackComposeModal, setTrackComposeData } from '../../actions/track_compose';
import { isMobile } from '../../util/is_mobile';

const messages = defineMessages({
  delete: { id: 'status.delete', defaultMessage: 'Delete' },
  mention: { id: 'status.mention', defaultMessage: 'Mention @{name}' },
  mute: { id: 'account.mute', defaultMessage: 'Mute @{name}' },
  block: { id: 'account.block', defaultMessage: 'Block @{name}' },
  reply: { id: 'status.reply', defaultMessage: 'Reply' },
  more: { id: 'status.more', defaultMessage: 'More' },
  replyAll: { id: 'status.replyAll', defaultMessage: 'Reply to thread' },
  reblog: { id: 'status.reblog', defaultMessage: 'Boost' },
  cannot_reblog: { id: 'status.cannot_reblog', defaultMessage: 'This post cannot be boosted' },
  favourite: { id: 'status.favourite', defaultMessage: 'Favourite' },
  cannot_favourite: { id: 'status.cannot_favourite', defaultMessage: 'This post cannot be favourited' },
  open: { id: 'status.open', defaultMessage: 'Expand this status' },
  report: { id: 'status.report', defaultMessage: 'Report @{name}' },
  muteConversation: { id: 'status.mute_conversation', defaultMessage: 'Mute conversation' },
  unmuteConversation: { id: 'status.unmute_conversation', defaultMessage: 'Unmute conversation' },
  pin: { id: 'status.pin', defaultMessage: 'Pin to account page' },
  unpin: { id: 'status.unpin', defaultMessage: 'Unpin from account page' },

  generate_mv: { id: 'status.generate_mv', defaultMessage: 'Generate the video' },
  regenerate_mv: { id: 'status.regenerate_mv', defaultMessage: 'Regenerate the video' },
  download_mv: { id: 'status.download_mv', defaultMessage: 'Download generated video' },
  editTrack: { id: 'status.edit_track', defaultMessage: 'Edit track' },

  deleteConfirm: { id: 'confirmations.delete.confirm', defaultMessage: 'Delete' },
  deleteMessage: { id: 'confirmations.delete.message', defaultMessage: 'Are you sure you want to delete this status?' },
  blockConfirm: { id: 'confirmations.block.confirm', defaultMessage: 'Block' },
  muteConfirm: { id: 'confirmations.mute.confirm', defaultMessage: 'Mute' },
  unpinConfirm: { id: 'confirmations.unpin.confirm', defaultMessage: 'Unpin' },
  pinConfirm: { id: 'confirmations.pin.confirm', defaultMessage: 'Pin' },
  generateMvConfirm: { id: 'confirmations.generate_mv.confirm', defaultMessage: 'Generate' },
});

const mobile = isMobile();

const makeMapStateToProps = () => {
  const getStatus = makeGetStatus();

  const mapStateToProps = (state, props) => {
    const status = props.status || getStatus(state, props.id);

    return {
      status,
      me: state.getIn(['meta', 'me']),
      boostModal: state.getIn(['meta', 'boost_modal']),
      deleteModal: state.getIn(['meta', 'delete_modal']),
      autoPlayGif: state.getIn(['meta', 'auto_play_gif']) || false,
    };
  };

  return mapStateToProps;
};

@injectIntl
@connect(makeMapStateToProps)
export default class StatusActionBar extends ImmutablePureComponent {

  static contextTypes = {
    schedule: PropTypes.bool,
  };

  static propTypes = {
    status: ImmutablePropTypes.map.isRequired,
    me: PropTypes.number,
    withDismiss: PropTypes.bool,
    boostModal: PropTypes.bool,
    deleteModal: PropTypes.bool,
    autoPlayGif: PropTypes.bool,
    intl: PropTypes.object.isRequired,
  };

  // Avoid checking props that are functions (and whose equality will always
  // evaluate to false. See react-immutable-pure-component for usage.
  updateOnProps = [
    'status',
    'me',
    'withDismiss',
  ]

  handleReplyClick = () => {
    const { dispatch, status } = this.props;
    dispatch(replyCompose(status));
  }

  handleFavouriteClick = () => {
    const { dispatch, status } = this.props;

    if (status.get('favourited')) {
      dispatch(unfavourite(status));
    } else {
      dispatch(favourite(status));
    }
  }

  handleReblogClick = (e) => {
    const { dispatch, status, boostModal } = this.props;

    if (status.get('reblogged')) {
      dispatch(unreblog(status));
    } else {
      if (e.shiftKey || !boostModal) {
        this.handleReblog(status);
      } else {
        dispatch(openModal('BOOST', { status, onReblog: this.handleReblog }));
      }
    }
  }

  handleDeleteClick = () => {
    const { dispatch, status, deleteModal, intl } = this.props;

    if (!deleteModal) {
      dispatch(deleteStatus(status.get('id')));
    } else {
      dispatch(openModal('CONFIRM', {
        message: intl.formatMessage(messages.deleteMessage),
        confirm: intl.formatMessage(messages.deleteConfirm),
        onConfirm: () => dispatch(deleteStatus(status.get('id'))),
      }));
    }
  }

  handlePinClick = () => {
    const { dispatch, status, intl } = this.props;
    if (status.get('pinned')) {
      dispatch(openModal('CONFIRM', {
        message: <FormattedMessage id='confirmations.unpin.message' defaultMessage='Unpin from your profile. Are you sure?' />,
        confirm: intl.formatMessage(messages.unpinConfirm),
        onConfirm: () => dispatch(unpinStatus(status.get('id'))),
      }));
    } else {
      dispatch(openModal('CONFIRM', {
        message: <FormattedMessage id='confirmations.pin.message' defaultMessage='This will prepend any previously pinned Toot. Are you sure?' />,
        confirm: intl.formatMessage(messages.pinConfirm),
        onConfirm: () => dispatch(pinStatus(status.get('id'))),
      }));
    }
  }

  handleMentionClick = () => {
    const { dispatch, status } = this.props;
    dispatch(mentionCompose(status.get('account')));
  }

  handleMuteClick = () => {
    const { dispatch, status, intl } = this.props;
    const account = status.get('account');

    dispatch(openModal('CONFIRM', {
      message: <FormattedMessage id='confirmations.mute.message' defaultMessage='Are you sure you want to mute {name}?' values={{ name: <strong>@{account.get('acct')}</strong> }} />,
      confirm: intl.formatMessage(messages.muteConfirm),
      onConfirm: () => dispatch(muteAccount(account.get('id'))),
    }));
  }

  handleBlockClick = () => {
    const { dispatch, status, intl } = this.props;
    const account = status.get('account');

    dispatch(openModal('CONFIRM', {
      message: <FormattedMessage id='confirmations.block.message' defaultMessage='Are you sure you want to block {name}?' values={{ name: <strong>@{account.get('acct')}</strong> }} />,
      confirm: intl.formatMessage(messages.blockConfirm),
      onConfirm: () => dispatch(blockAccount(account.get('id'))),
    }));
  }

  handleReport = () => {
    const { dispatch, status } = this.props;
    dispatch(initReport(status.get('account'), status));
  }

  handleConversationMuteClick = () => {
    const { dispatch, status } = this.props;

    if (status.get('muted')) {
      dispatch(unmuteStatus(status.get('id')));
    } else {
      dispatch(muteStatus(status.get('id')));
    }
  }

  handleReblog = (status) => {
    const { dispatch } = this.props;
    dispatch(reblog(status));
  }

  handleGenerateMvClick = () => {
    const { dispatch, status, intl } = this.props;
    dispatch(openModal('CONFIRM', {
      message: <FormattedMessage id='confirmations.generate_mv.message' defaultMessage='Generating animation takes time. When generation is completed, a notification is sent by e-mail.' />,
      confirm: intl.formatMessage(messages.generateMvConfirm),
      onConfirm: () => dispatch(generateTrackMv(status.get('id'))),
    }));
  }

  handleEditTrack = () => {
    const { dispatch, status } = this.props;

    if (mobile) {
      location.href = `/tracks/${status.get('id')}/edit`;
    } else {
      dispatch(setTrackComposeData(status.get('id'), status.get('track')));
      dispatch(showTrackComposeModal());
    }
  }

  handleRedirectLoginPage = () => {
    location.href = '/auth/sign_in';
  }

  render () {
    const { status, me, intl, withDismiss } = this.props;
    const { schedule } = this.context;
    const favouriteDisabled = schedule;
    const reblogDisabled = status.get('visibility') === 'private' || status.get('visibility') === 'direct' || schedule;
    const mutingConversation = status.get('muted');

    let menu = [];
    // TODO: アイコンの設定
    let reblogIcon = 'repeat';
    // let replyIcon;
    let replyTitle;

    let editButton     = null;
    let downloadButton = null;
    let downloadFilename = null;

    if (status.getIn(['account', 'id']) === me  &&  status.get('track')) {
      const url = status.getIn(['track', 'video', 'url']);
      if (url) {
        downloadFilename = `${status.getIn(['track', 'artist'])} - ${status.getIn(['track', 'title'])}.mp4`;
      }

      downloadButton = (
        <li>
          {(url) ? (
            <a href={url} download={downloadFilename}>
              <IconButton className='clickable strong' src='download' />
            </a>
          ) : (
            <IconButton className='strong' src='download' onClick={this.handleGenerateMvClick} />
          )}
        </li>
      );
      editButton = <li><IconButton className='strong' src='edit' onClick={this.handleEditTrack} /></li>;
    }


    menu.push({ text: intl.formatMessage(messages.open), to: `/@${status.getIn(['account', 'acct'])}/${status.get('id')}` });
    menu.push(null);

    if (withDismiss) {
      menu.push({ text: intl.formatMessage(mutingConversation ? messages.unmuteConversation : messages.muteConversation), action: this.handleConversationMuteClick });
      menu.push(null);
    }

    if (status.getIn(['account', 'id']) === me) {
      if (['public', 'unlisted', 'private'].includes(status.get('visibility'))) {
        if (status.get('pinned')) {
          menu.push({ text: intl.formatMessage(messages.unpin), action: this.handlePinClick });
        } else {
          menu.push({ text: intl.formatMessage(messages.pin), action: this.handlePinClick });
        }
      }

      menu.push({ text: intl.formatMessage(messages.delete), action: this.handleDeleteClick });

      if (status.get('track')) {
        const url = status.getIn(['track', 'video', 'url']);

        menu.push(null);
        menu.push({ text: intl.formatMessage(messages.editTrack), action: this.handleEditTrack });

        if (url) {
          menu.push({ text: intl.formatMessage(messages.download_mv), href: url, download: downloadFilename });
          menu.push({ text: intl.formatMessage(messages.regenerate_mv), action: this.handleGenerateMvClick });
        } else {
          menu.push({ text: intl.formatMessage(messages.generate_mv), action: this.handleGenerateMvClick });
        }
      }
    } else {
      menu.push({ text: intl.formatMessage(messages.mention, { name: status.getIn(['account', 'username']) }), action: this.handleMentionClick });
      menu.push(null);
      menu.push({ text: intl.formatMessage(messages.mute, { name: status.getIn(['account', 'username']) }), action: this.handleMuteClick });
      menu.push({ text: intl.formatMessage(messages.block, { name: status.getIn(['account', 'username']) }), action: this.handleBlockClick });
      menu.push({ text: intl.formatMessage(messages.report, { name: status.getIn(['account', 'username']) }), action: this.handleReport });
    }

    if (status.get('visibility') === 'direct') {
      reblogIcon = 'mail';
    } else if (status.get('visibility') === 'private') {
      reblogIcon = 'lock';
    }

    if (status.get('in_reply_to_id', null) === null) {
      // replyIcon = 'reply';
      replyTitle = intl.formatMessage(messages.reply);
    } else {
      // replyIcon = 'reply-all';
      replyTitle = intl.formatMessage(messages.replyAll);
    }

    const reblogTitle = reblogDisabled ? intl.formatMessage(messages.cannot_reblog) : intl.formatMessage(messages.reblog);
    const favouriteTitle = favouriteDisabled ? intl.formatMessage(messages.cannot_favourite) : intl.formatMessage(messages.favourite);
    const moreTitle = intl.formatMessage(messages.more);

    const reblogged = status.get('reblogged');
    const favourited = status.get('favourited');

    return (
      <ul className='status-action-bar'>
        <li><IconButton title={replyTitle} src='message-square' onClick={me ? this.handleReplyClick : this.handleRedirectLoginPage} /></li>
        <li><IconButton title={reblogTitle} src={reblogIcon} onClick={me ? this.handleReblogClick : this.handleRedirectLoginPage} disabled={reblogDisabled} active={reblogged} strokeWidth={reblogged ? 2 : 1} /></li>
        <li><IconButton title={favouriteTitle} src='heart' onClick={me ? this.handleFavouriteClick : this.handleRedirectLoginPage} disabled={favouriteDisabled} active={favourited} strokeWidth={favourited ? 2 : 1} /></li>
        <li><DropdownMenuContainer items={menu} src='more-horizontal' title={moreTitle} /></li>
        {editButton}
        {downloadButton}
      </ul>
    );
  }

}
