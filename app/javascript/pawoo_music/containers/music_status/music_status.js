import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { makeGetStatus } from '../../../mastodon/selectors';
import StatusContent from '../../../mastodon/components/status_content';
import StatusActionBar from '../status_action_bar';
import AccountContainer from '../account';
import StatusMeta from '../../components/status_meta';
import StatusPrepend from '../../components/status_prepend';
import TrackContainer from '../track';
import AlbumContainer from '../album';
import FollowButton from '../follow_button';
import { openModal } from '../../../mastodon/actions/modal';
import ContainedAlbumsModalContentContainer from '../contained_albums_modal_content';

const makeMapStateToProps = () => {
  const getStatus = makeGetStatus();

  const mapStateToProps = (state, props) => {
    const { id, status } = props;

    return {
      status: status || getStatus(state, id),
      trackId: state.getIn(['pawoo_music', 'tracks', 'trackId']),
      albumId: state.getIn(['pawoo_music', 'albums', 'albumId']),
    };
  };

  return mapStateToProps;
};

@connect(makeMapStateToProps)
export default class MusicStatus extends ImmutablePureComponent {

  static propTypes = {
    status: ImmutablePropTypes.map,
    muted: PropTypes.bool,
    prepend: PropTypes.node,
    hidden: PropTypes.bool,
    trackId: PropTypes.number,
    albumId: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
  };

  handleClickContainedAlbums = () => {
    const { status, dispatch } = this.props;
    const id = status.getIn(['track', 'id']);

    if (id) {
      dispatch(openModal('UNIVERSAL', { children: <ContainedAlbumsModalContentContainer id={id} /> }));
    }
  }

  render () {
    const { muted, hidden, prepend, status: originalStatus, trackId, albumId } = this.props;

    if (!originalStatus) {
      return null;
    }

    let status = originalStatus;
    if (originalStatus.get('reblog', null) !== null && typeof originalStatus.get('reblog') === 'object') {
      status = originalStatus.get('reblog');
    }

    if (!status.has('track') && !status.has('album')) {
      return null;
    }

    if (hidden) {
      if (status.has('track') && trackId !== status.getIn(['track', 'id'])) {
        return (
          <div>
            {status.getIn(['account', 'display_name']) || status.getIn(['account', 'username'])}
            {status.getIn(['track', 'text'])}
            {status.getIn(['track', 'artist'])}
            {status.getIn(['track', 'title'])}
          </div>
        );
      }

      if (status.has('album') && albumId !== status.getIn(['album', 'id'])) {
        return (
          <div>
            {status.getIn(['account', 'display_name']) || status.getIn(['account', 'username'])}
            {status.getIn(['album', 'text'])}
            {status.getIn(['album', 'title'])}
          </div>
        );
      }
    }

    let credit = null;
    let content = null;
    let albumsButton = null;

    if (status.has('track')) {
      credit = `${status.getIn(['track', 'artist'])} - ${status.getIn(['track', 'title'])}`;
      content = status.getIn(['track', 'content']);

      const albumsCount = status.getIn(['track', 'albums_count']);
      if (albumsCount > 0) {
        albumsButton = (
          <div className='contained-albums-button' role='button' tabIndex='0' aria-pressed='false' onClick={this.handleClickContainedAlbums}>
            収録アルバム
            {albumsCount > 1 && <span className='albums-count'>{albumsCount}</span>}
          </div>
        );
      }
    }

    if (status.has('album')) {
      credit = status.getIn(['album', 'title']);
      content = status.getIn(['album', 'content']);
    }

    return (
      <div className={classNames('music-status', { muted })} data-id={status.get('id')}>
        {prepend || <StatusPrepend className='prepend-inline' status={originalStatus} />}
        <div className='status-head'>
          <AccountContainer account={status.get('account')} />
          <FollowButton id={status.getIn(['account', 'id'])} onlyFollow />
        </div>

        {status.has('track') && <TrackContainer track={status.get('track')} />}
        {status.has('album') && <AlbumContainer album={status.get('album')} />}

        <div className='credit'>{credit}</div>
        <StatusContent status={status.set('content', content)} />

        <StatusActionBar status={status} />
        {albumsButton}
        <StatusMeta status={status} />
      </div>
    );
  }

}
