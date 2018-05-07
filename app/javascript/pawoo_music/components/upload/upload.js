import React, { PureComponent } from 'react';
import { Route, Switch } from 'react-router-dom';
import classNames from 'classnames';
import AlbumComposeContainer from '../../containers/album_compose';
import TrackComposeContainer from '../../containers/track_compose';
import LoadingBarContainer from '../../../mastodon/features/ui/containers/loading_bar_container';
import NotificationsContainer from '../../../mastodon/features/ui/containers/notifications_container';
import ModalContainer from '../../containers/modal_container';
import { isMobile } from '../../util/is_mobile';

export default class Upload extends PureComponent {

  render () {
    const mobile = isMobile();
    return (
      <div className={classNames('app upload', { sp: mobile })}>
        <Switch>
          <Route path='/tracks/new' exact component={TrackComposeContainer} />
          <Route path='/tracks/:id/edit' exact component={TrackComposeContainer} />
          <Route path='/albums/new' exact component={AlbumComposeContainer} />
          <Route path='/albums/:id/edit' exact component={AlbumComposeContainer} />
        </Switch>
        <NotificationsContainer />
        <LoadingBarContainer className='loading-bar' />
        <ModalContainer />
      </div>
    );
  }

}
