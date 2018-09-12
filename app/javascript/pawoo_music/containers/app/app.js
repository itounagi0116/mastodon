import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import classNames from 'classnames';
import { connectUserStream } from '../../actions/streaming';
import { changeTargetColumn } from '../../actions/column';
import { refreshHomeTimeline } from '../../../mastodon/actions/timelines';
import { refreshNotifications } from '../../../mastodon/actions/notifications';
import HomeTimelineContainer from '../home_timeline';
import NotificationTimelineContainer from '../notification_timeline';
import CommunityTimelineContainer from '../community_timeline';
import PublicTimelineContainer from '../public_timeline';
import HashtagTimelineContainer from '../hashtag_timeline';
import AccountTracksContainer from '../account_tracks';
import AccountAlbumsContainer from '../account_albums';
import FavouritedStatusesContainer from '../favourited_statuses';
import IntentContainer from '../../containers/intent';
import LoadingBarContainer from '../../../mastodon/features/ui/containers/loading_bar_container';
import NotificationsContainer from '../../../mastodon/features/ui/containers/notifications_container';
import AccountFollowersContainer from '../account_followers';
import AccountFollowingContainer from '../account_following';
import StatusThreadContainer from '../status_thread';
import { isMobile } from '../../util/is_mobile';
import { navigate } from '../../util/navigator';
import ModalContextContainer from '../modal_context';
import { openModalFormCompose } from '../../../mastodon/actions/compose';
import Link from '../../components/link_wrapper';
import Logo from '../../components/logo';
import Icon from '../../components/icon';

const mapStateToProps = state => ({
  isLogin: !!state.getIn(['meta', 'me']),
  target: state.getIn(['pawoo_music', 'column', 'target']),
  title: state.getIn(['pawoo_music', 'timeline', 'title']),
  footerType: state.getIn(['pawoo_music', 'footer', 'footerType']),
  backTo: state.getIn(['pawoo_music', 'footer', 'backTo']),
});

@connect(mapStateToProps)
export default class App extends PureComponent {

  static propTypes = {
    title: PropTypes.string.isRequired,
    target: PropTypes.string.isRequired,
    footerType: PropTypes.string.isRequired,
    backTo: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    isLogin: PropTypes.bool,
  }

  static contextTypes = {
    router: PropTypes.object,
  };

  componentDidMount () {
    const { dispatch, isLogin } = this.props;

    if (isLogin) {
      this.disconnect = dispatch(connectUserStream());
      dispatch(refreshHomeTimeline());
      dispatch(refreshHomeTimeline({ onlyMusics: true }));
      dispatch(refreshNotifications());

      // Desktop notifications
      // Ask after 1 minute
      if (typeof window.Notification !== 'undefined' && Notification.permission === 'default') {
        window.setTimeout(() => Notification.requestPermission(), 60 * 1000);
      }

      // Protocol handler
      // Ask after 5 minutes
      if (typeof navigator.registerProtocolHandler !== 'undefined') {
        const handlerUrl = window.location.protocol + '//' + window.location.host + '/intent?uri=%s';
        window.setTimeout(() => navigator.registerProtocolHandler('web+mastodon', handlerUrl, 'Mastodon'), 5 * 60 * 1000);
      }

      if ('serviceWorker' in  navigator) {
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerPostMessage);
      }
    }
  }

  componentWillUnmount () {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }
  }

  handleServiceWorkerPostMessage = ({ data }) => {
    if (data.type === 'navigate') {
      this.context.router.history.push(data.path);
    } else {
      console.warn('Unknown message type:', data.type);
    }
  }

  handleClickGlobalNaviButton = () => {
    const { dispatch, target } = this.props;
    if(target === 'lobby') {
      dispatch(changeTargetColumn('global_navi'));

    } else {
      dispatch(changeTargetColumn('lobby'));
    }
  }

  handleClickLobbyButton = () => {
    const { dispatch } = this.props;
    dispatch(changeTargetColumn('lobby'));
  }

  handleClickGalleryButton = () => {
    const { dispatch } = this.props;
    dispatch(changeTargetColumn('gallery'));
  }

  handleClickHistoryBackButton = () => {
    const { dispatch } = this.props;
    if (window.history && window.history.length === 1) this.context.router.history.push('/');
    else this.context.router.history.goBack();
    dispatch(changeTargetColumn('lobby'));
  }

  handleClickStatusPostButton = () => {
    const { dispatch } = this.props;
    dispatch(openModalFormCompose());
  }

  handleRedirectLoginPage = (e) => {
    const { isLogin } = this.props;
    if (!isLogin) {
      navigate('/auth/sign_in');
      e.preventDefault();
    }
  }

  render () {
    const mobile = isMobile();
    const { title, target, footerType, isLogin, backTo } = this.props;

    const routes = (
      <Switch>
        <Route path='/' exact component={HomeTimelineContainer} />
        <Route path='/share' exact component={IntentContainer} />
        <Route path='/notifications' component={NotificationTimelineContainer} />
        <Route path='/timelines/public/local' component={CommunityTimelineContainer} />
        <Route path='/timelines/public' exact component={PublicTimelineContainer} />
        <Route path='/tags/:id' exact component={HashtagTimelineContainer} />
        <Route path='/favourites' component={FavouritedStatusesContainer} />
        <Route path='/@:acct' exact component={AccountTracksContainer} />
        <Route path='/@:acct/albums' exact component={AccountAlbumsContainer} />
        <Route path='/@:acct/:id' exact component={StatusThreadContainer} />
        <Route path='/users/:acct/followers' exact component={AccountFollowersContainer} />
        <Route path='/users/:acct/following' exact component={AccountFollowingContainer} />
      </Switch>
    );

    let buttons = null;

    if(mobile) {
      if(footerType === 'lobby_gallery') {
        buttons = (
          <div className='buttons'>
            <div role='button' tabIndex='0' className={classNames('app-bottom_button', { 'selected': target === 'lobby'   })} onClick={this.handleClickLobbyButton}  >チャット</div>
            <div role='button' tabIndex='0' className={classNames('app-bottom_button', { 'selected': target === 'gallery' })} onClick={this.handleClickGalleryButton}>作品</div>
          </div>
        );

      } else if(footerType === 'back_to_user') {
        buttons = (
          <div className='buttons'>
            <Link className='app-bottom_button selected' to={backTo} >戻る</Link>
          </div>
        );

      } else { // Do same action as (footerType === 'history_back')
        buttons = (
          <div className='buttons'>
            <div className='app-bottom_button selected' role='button' tabIndex='0' onClick={this.handleClickHistoryBackButton}>戻る</div>
          </div>
        );
      }
    }

    return (
      mobile ? (
        <ModalContextContainer className={classNames('app', 'sp')}>
          <div className='app-center'>{routes}</div>

          <div className='app-top'>
            <Icon icon='menu' className={classNames('to_global_navi', { 'selected': target === 'global_navi' })} strong onClick={this.handleClickGlobalNaviButton} />
            <div className='blank' />
            <div className='logo'>
              <Logo />
              <div className='timeline_title'>{title}</div>
            </div>
            <Icon icon='edit-2' className='post_status' strong onClick={isLogin ? this.handleClickStatusPostButton : this.handleRedirectLoginPage} />
            <a className='post_track' href='/tracks/new' onClick={this.handleRedirectLoginPage}><Icon icon='music' className='clickable' strong /></a>
          </div>

          <div className='app-bottom'>{buttons}</div>

          <NotificationsContainer />
          <LoadingBarContainer className='loading-bar' />
        </ModalContextContainer>
      ) : (
        <ModalContextContainer className='app'>
          <div className='app-center'>
            {routes}
          </div>
          <NotificationsContainer />
          <LoadingBarContainer className='loading-bar' />
        </ModalContextContainer>
      )
    );
  }

}
