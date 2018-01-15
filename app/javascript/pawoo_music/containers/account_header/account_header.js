import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { injectIntl, defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import { NavLink } from 'react-router-dom';
import emojify from '../../../mastodon/emoji';
import Avatar from '../../components/avatar';
import DisplayName from '../../components/display_name';
import DropdownMenu from '../../components/dropdown_menu';
import FollowButton from '../follow_button';
import {
  followAccount,
  unfollowAccount,
  blockAccount,
  unblockAccount,
  muteAccount,
  unmuteAccount,
} from '../../../mastodon/actions/accounts';
import { mentionCompose } from '../../../mastodon/actions/compose';
import { initReport } from '../../../mastodon/actions/reports';
import { openModal } from '../../../mastodon/actions/modal';
import { blockDomain, unblockDomain } from '../../../mastodon/actions/domain_blocks';
import Icon from '../../components/icon';

const messages = defineMessages({
  mention: { id: 'account.mention', defaultMessage: 'Mention @{name}' },
  edit_profile: { id: 'account.edit_profile', defaultMessage: 'Edit profile' },
  unblock: { id: 'account.unblock', defaultMessage: 'Unblock @{name}' },
  unfollow: { id: 'account.unfollow', defaultMessage: 'Unfollow' },
  unmute: { id: 'account.unmute', defaultMessage: 'Unmute @{name}' },
  block: { id: 'account.block', defaultMessage: 'Block @{name}' },
  mute: { id: 'account.mute', defaultMessage: 'Mute @{name}' },
  follow: { id: 'account.follow', defaultMessage: 'Follow' },
  report: { id: 'account.report', defaultMessage: 'Report @{name}' },
  media: { id: 'account.media', defaultMessage: 'Media' },
  more: { id: 'account.more', defaultMessage: 'More' },
  disclaimer: { id: 'account.disclaimer', defaultMessage: 'This user is from another instance. This number may be larger.' },
  blockDomain: { id: 'account.block_domain', defaultMessage: 'Hide everything from {domain}' },
  unblockDomain: { id: 'account.unblock_domain', defaultMessage: 'Unhide {domain}' },

  blockConfirm: { id: 'confirmations.block.confirm', defaultMessage: 'Block' },
  muteConfirm: { id: 'confirmations.mute.confirm', defaultMessage: 'Mute' },
  blockDomainConfirm: { id: 'confirmations.domain_block.confirm', defaultMessage: 'Hide entire domain' },
});


const mapStateToProps = (state) => ({
  me: state.getIn(['meta', 'me']),
  autoPlayGif: state.getIn(['meta', 'auto_play_gif']),
});

@injectIntl
@connect(mapStateToProps)
export default class AccountHeader extends ImmutablePureComponent {

  static propTypes = {
    account: ImmutablePropTypes.map.isRequired,
    me: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    autoPlayGif: PropTypes.bool,
  };

  handleFollowClick = () => {
    const { dispatch, account } = this.props;

    if (account.getIn(['relationship', 'following'])) {
      dispatch(unfollowAccount(account.get('id')));
    } else {
      dispatch(followAccount(account.get('id')));
    }
  }

  handleMentionClick = () => {
    const { dispatch, account } = this.props;
    dispatch(mentionCompose(account));
  }

  handleMuteClick = () => {
    const { dispatch, account, intl } = this.props;

    if (account.getIn(['relationship', 'muting'])) {
      dispatch(unmuteAccount(account.get('id')));
    } else {
      dispatch(openModal('CONFIRM', {
        message: <FormattedMessage id='confirmations.mute.message' defaultMessage='Are you sure you want to mute {name}?' values={{ name: <strong>@{account.get('acct')}</strong> }} />,
        confirm: intl.formatMessage(messages.muteConfirm),
        onConfirm: () => dispatch(muteAccount(account.get('id'))),
      }));
    }
  }

  handleBlockClick = () => {
    const { dispatch, account, intl } = this.props;

    if (account.getIn(['relationship', 'blocking'])) {
      dispatch(unblockAccount(account.get('id')));
    } else {
      dispatch(openModal('CONFIRM', {
        message: <FormattedMessage id='confirmations.block.message' defaultMessage='Are you sure you want to block {name}?' values={{ name: <strong>@{account.get('acct')}</strong> }} />,
        confirm: intl.formatMessage(messages.blockConfirm),
        onConfirm: () => dispatch(blockAccount(account.get('id'))),
      }));
    }
  }

  handleReport = () => {
    const { dispatch, account } = this.props;
    dispatch(initReport(account));
  }

  handleBlockDomain = () => {
    const { dispatch, account, intl } = this.props;
    const accountId = account.get('id');
    const domain = account.get('acct').split('@')[1];

    dispatch(openModal('CONFIRM', {
      message: <FormattedMessage id='confirmations.domain_block.message' defaultMessage='Are you really, really sure you want to block the entire {domain}? In most cases a few targeted blocks or mutes are sufficient and preferable.' values={{ domain: <strong>{domain}</strong> }} />,
      confirm: intl.formatMessage(messages.blockDomainConfirm),
      onConfirm: () => dispatch(blockDomain(domain, accountId)),
    }));
  }

  handleUnblockDomain = () => {
    const { dispatch, account } = this.props;
    const accountId = account.get('id');
    const domain = account.get('acct').split('@')[1];

    dispatch(unblockDomain(domain, accountId));
  }


  createMenu () {
    const { account, me, intl } = this.props;
    const menu = [];

    menu.push({ text: intl.formatMessage(messages.mention, { name: account.get('username') }), action: this.handleMentionClick });
    menu.push(null);

    if (!me) {
      return menu;
    } else if (me === account.get('id')) {
      menu.push({ text: intl.formatMessage(messages.edit_profile), href: '/settings/profile' });
    } else {
      if (account.getIn(['relationship', 'muting'])) {
        menu.push({ text: intl.formatMessage(messages.unmute, { name: account.get('username') }), action: this.handleMuteClick });
      } else {
        menu.push({ text: intl.formatMessage(messages.mute, { name: account.get('username') }), action: this.handleMuteClick });
      }

      if (account.getIn(['relationship', 'blocking'])) {
        menu.push({ text: intl.formatMessage(messages.unblock, { name: account.get('username') }), action: this.handleBlockClick });
      } else {
        menu.push({ text: intl.formatMessage(messages.block, { name: account.get('username') }), action: this.handleBlockClick });
      }

      menu.push({ text: intl.formatMessage(messages.report, { name: account.get('username') }), action: this.handleReport });

      if (account.get('acct') !== account.get('username')) {
        const domain = account.get('acct').split('@')[1];
        menu.push(null);

        if (account.getIn(['relationship', 'domain_blocking'])) {
          menu.push({ text: intl.formatMessage(messages.unblockDomain, { domain }), action: this.handleUnblockDomain });
        } else {
          menu.push({ text: intl.formatMessage(messages.blockDomain, { domain }), action: this.handleBlockDomain });
        }
      }
    }

    return menu;
  }

  renderProviderIcons () {
    const { account } = this.props;

    return account.getIn(['oauth_authentications'], new Immutable.List()).map(oauth_authentication => {
      const provider = oauth_authentication.get('provider');

      if (provider === 'pixiv') {
        return (
          <li key={provider}>
            <a href={`https://www.pixiv.net/member.php?id=${oauth_authentication.get('uid')}`} target='_blank' rel='noopener'>
              <div className='oauth-authentication pixiv' />
            </a>
          </li>
        );
      }

      return <div key={provider} />;
    });
  }

  render () {
    const { account, me, autoPlayGif, intl } = this.props;

    if (!account) {
      return null;
    }

    const menu = this.createMenu();
    const lockedIcon = account.get('locked') && <Icon icon='lock' />;
    const extraInfo = (account.get('acct') !== account.get('username')) && <abbr title={intl.formatMessage(messages.disclaimer)}>*</abbr>;
    const note = { __html: emojify(account.get('note')) };
    let followed = null;

    if (me && me !== account.get('id') && account.getIn(['relationship', 'followed_by'])) {
      followed = (
        <span className='account--follows-info'>
          <FormattedMessage id='account.follows_you' defaultMessage='Follows you' />
        </span>
      );
    }

    return (
      <div className='account-header-pm'>
        <div className='cover' style={{ backgroundImage: `url(${account.get('header')})` }}>
          <div className='cover-mask'>
            <Avatar className='size50' account={account} autoPlayGif={autoPlayGif} />
            <DisplayName account={account} />
            <span className='acct'>@{account.get('acct')} {lockedIcon}</span>
            {followed}
          </div>
        </div>
        <div className='content'>
          <div className='info'>
            <div className='action-buttons'>
              <FollowButton account={account} />
              <ul className='oauth-authentications'>
                {this.renderProviderIcons()}
              </ul>
            </div>
            <div className='note' dangerouslySetInnerHTML={note} />
          </div>
        </div>
        <div className='tabs'>
          <NavLink to={`/@${account.get('acct')}`} exact>
            <strong><FormattedNumber value={account.get('tracks_count')} /> </strong>
            <span><FormattedMessage id='account.tracks' defaultMessage='Tracks' /></span>
          </NavLink>
          <NavLink to={`/users/${account.get('acct')}/followers`} exact>
            <strong><FormattedNumber value={account.get('followers_count')} />{extraInfo} </strong>
            <span><FormattedMessage id='account.followers' defaultMessage='Followers' /></span>
          </NavLink>
          <NavLink to={`/users/${account.get('acct')}/following`} exact>
            <strong><FormattedNumber value={account.get('following_count')} />{extraInfo} </strong>
            <span><FormattedMessage id='account.follows' defaultMessage='Follows' /></span>
          </NavLink>
          {menu.length > 0 && <DropdownMenu title={intl.formatMessage(messages.more)} items={menu} icon='more-horizontal' />}
        </div>

      </div>
    );
  }

};
