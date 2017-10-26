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
import Track from '../track';
import FollowButton from '../follow_button';

const makeMapStateToProps = () => {
  const getStatus = makeGetStatus();

  const mapStateToProps = (state, props) => {
    const { id, status } = props;

    return {
      status: status || getStatus(state, id),
      trackId: state.getIn(['pawoo_music', 'tracks', 'trackId']),
    };
  };

  return mapStateToProps;
};

@connect(makeMapStateToProps)
export default class TrackStatus extends ImmutablePureComponent {

  static propTypes = {
    status: ImmutablePropTypes.map,
    muted: PropTypes.bool,
    prepend: PropTypes.node,
    hidden: PropTypes.bool,
    trackId: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
  };

  render () {
    const { muted, hidden, prepend, status: originalStatus, trackId } = this.props;

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

    if (hidden && trackId && trackId !== status.getIn(['track', 'music'])) {
      return (
        <div>
          {status.getIn(['account', 'display_name']) || status.getIn(['account', 'username'])}
          {status.getIn(['track', 'text'])}
          {status.getIn(['track', 'artist'])}
          {status.getIn(['track', 'title'])}
        </div>
      );
    }

    return (
      <div className={classNames('track-status', { muted })} data-id={status.get('id')}>
        {prepend || <StatusPrepend className='prepend-inline' status={originalStatus} />}
        <div className='status-head'>
          <AccountContainer account={status.get('account')} />
          <FollowButton id={status.getIn(['account', 'id'])} onlyFollow />
        </div>

        <Track track={status.get('track')} />

        <StatusContent status={status.set('content', status.getIn(['track', 'content']))} />

        <StatusActionBar status={status} />

        <StatusMeta status={status} />
      </div>
    );
  }

}
