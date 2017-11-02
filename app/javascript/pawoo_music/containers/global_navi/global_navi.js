import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { defineMessages, injectIntl } from 'react-intl';
import { Scrollbars } from 'react-custom-scrollbars';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';
import SearchBox from '../search_box';
import LoginBox from '../../components/login_box';
import IconButton from '../../components/icon_button';
import EventCalendar from '../../components/event_calendar';
import PinnedTagsContainer from '../pinned_tags';
import TrendTagsContainer from '../trend_tags';
import { isMobile } from '../../util/is_mobile';
import { changeTargetColumn } from '../../actions/column';
import Link from '../../components/link_wrapper';
import Logo from '../../components/logo';
import Announcements from '../../components/announcements';

const icons = {
  home: 'home',
  notifications: 'bell',
  local_timeline: 'users',
  federated_timeline: 'globe',
  favourites: 'heart',
  preferences: 'settings',
};

const messages = defineMessages({
  home: { id: 'tabs_bar.home', defaultMessage: 'Home' },
  notifications: { id: 'tabs_bar.notifications', defaultMessage: 'Notifications' },
  local_timeline: { id: 'tabs_bar.local_timeline', defaultMessage: 'Local' },
  federated_timeline: { id: 'tabs_bar.federated_timeline', defaultMessage: 'Federated' },
  favourites: { id: 'navigation_bar.favourites', defaultMessage: 'Favourites' },
  preferences: { id: 'navigation_bar.preferences', defaultMessage: 'Preferences' },
  help: { id: 'navigation_bar.help', defaultMessage: 'Help' },
});

const navLinkParams = [
  { to: '/', messageKey: 'home', requireLogin: true, exact: true },
  { to: '/timelines/public/local', messageKey: 'local_timeline', exact: true },
  { to: '/timelines/public', messageKey: 'federated_timeline', exact: true },
  { to: '/notifications', messageKey: 'notifications', requireLogin: true },
  { to: '/favourites', messageKey: 'favourites', requireLogin: true },
];

const filteredNavLinkParams = navLinkParams.filter(({ requireLogin }) => !requireLogin);

const mapStateToProps = state => ({
  unread: state.getIn(['notifications', 'unread']) || 0,
  isLogin: !!state.getIn(['meta', 'me']),
});

@injectIntl
@withRouter
@connect(mapStateToProps)
export default class GlobalNavi extends PureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    unread: PropTypes.number,
    isLogin: PropTypes.bool,
  }

  static contextTypes = {
    router: PropTypes.object,
  };

  handleClick = () => {
    const { dispatch } = this.props;
    dispatch(changeTargetColumn('lobby'));
  }

  renderNavLink = (param) => {
    const { intl, unread } = this.props;
    const { requireLogin, messageKey, ...other } = param;
    return (
      <li key={other.to}>
        <NavLink {...other} onClick={this.handleClick}>
          <div className='menu'>
            <IconButton src={icons[messageKey]} strokeWidth={2} />
            <span>{intl.formatMessage(messages[messageKey])}</span>
            {(messageKey === 'notifications') && (unread > 0) && (
              <span className='unread'>{unread}</span>
            )}
          </div>
        </NavLink>
      </li>
    );
  };

  renderNavLinks () {
    const { isLogin } = this.props;
    const params = isLogin ? navLinkParams : filteredNavLinkParams;
    return <ul>{params.map(this.renderNavLink)}</ul>;
  }

  render () {
    const { intl, isLogin, match } = this.props;
    const mobile = isMobile();
    const currentTag = (match && match.path === '/tags/:id') ? match.params.id : null;

    const globalNavi = (
      <div className='global-navi'>
        <div className='global-navi-center'>
          {!mobile && (
            <Link to='/timelines/public/local'><Logo className='logo' /></Link>
          )}
          <SearchBox />
          {!isLogin && <LoginBox />}
          <div className='global-navi-links'>
            {this.renderNavLinks()}
          </div>

          <h2>
            <FormattedMessage
              id='pawoo_music.global_navi.tag_timeline'
              defaultMessage='Tag timeline'
            />
          </h2>

          <EventCalendar />
          <PinnedTagsContainer currentTag={currentTag} />
          <TrendTagsContainer />
          <Announcements />
        </div>
        <div className='global-navi-bottom'>
          {isLogin && (
            <a target='_blank' href='/settings/preferences'>
              <IconButton src='settings' className='clickable' strokeWidth={2} /> &nbsp;
              <div className='link-text'>
                {intl.formatMessage(messages.preferences)}
              </div>
            </a>
          )}
          <a target='_blank' href='https://pawoo.zendesk.com/hc/ja/'>
            <IconButton src='help-circle' className='clickable' strokeWidth={2} /> &nbsp;
            <div className='link-text'>
              {intl.formatMessage(messages.help)}
            </div>
          </a>
        </div>
      </div>
    );

    return mobile ? (
      globalNavi
    ) : (
      <Scrollbars className='scrollable'>{globalNavi}</Scrollbars>
    );
  }

};
