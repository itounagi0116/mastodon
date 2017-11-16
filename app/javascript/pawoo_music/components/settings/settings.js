import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { Route, Switch } from 'react-router-dom';
import TimelineSettings from '../timeline_settings';
import FollowRequestsContainer from '../../containers/follow_requests';
import MutedUsersContainer from '../../containers/muted_users';
import BlockedUsersContainer from '../../containers/blocked_users';
import CustomColorContainer from '../../containers/custom_color';
import LoadingBarContainer from '../../../mastodon/features/ui/containers/loading_bar_container';
import NotificationsContainer from '../../../mastodon/features/ui/containers/notifications_container';
import ModalContainer from '../../containers/modal_container';

export default class Settings extends ImmutablePureComponent {

  render () {
    return (
      <div className='settings app'>
        <Switch>
          <Route path='/settings/timeline' component={TimelineSettings} />
          <Route path='/settings/follow_requests' exact component={FollowRequestsContainer} />
          <Route path='/settings/blocks' exact component={BlockedUsersContainer} />
          <Route path='/settings/mutes' exact component={MutedUsersContainer} />
          <Route path='/settings/custom_color' exact component={CustomColorContainer} />
        </Switch>
        <NotificationsContainer />
        <LoadingBarContainer className='loading-bar' />
        <ModalContainer />
      </div>
    );
  }

}
