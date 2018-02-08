import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import MissingIndicator from '../../../mastodon/components/missing_indicator';
import AccountHeaderContainer from '../account_header';
import AccountTimelineContainer from '../account_timeline';
import StatusList from '../../components/status_list';
import Timeline from '../../components/timeline';
import { makeGetAccount } from '../../../mastodon/selectors';
import AlbumPostContainer from '../album_post';
import {
  openAccountGallery,
  changeAccountGallery,
  expandAccountGalleryTimeline,
} from '../../actions/account_gallery';

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();

  const mapStateToProps = (state) => {
    const accountAcct = state.getIn(['pawoo_music', 'account_gallery', 'acct']);
    const accountId = state.getIn(['pawoo_music', 'account_gallery', 'id']);

    return {
      accountAcct,
      accountId,
      account: getAccount(state, accountId),
      statusIds: state.getIn(['timelines', `account:${accountId}:album`, 'items'], Immutable.List()),
      me: state.getIn(['meta', 'me']),
      isLoading: state.getIn(['timelines', `account:${accountId}:album`, 'isLoading']),
      hasMore: !!state.getIn(['timelines', `account:${accountId}:album`, 'next']),
      pinnedStatusIds: state.getIn(['timelines', `account:${accountId}:pinned_status:album`, 'items'], Immutable.List()),
    };
  };

  return mapStateToProps;
};

@connect(makeMapStateToProps)
export default class AccountAlbums extends PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    accountAcct: PropTypes.string,
    accountId: PropTypes.number,
    account: ImmutablePropTypes.map,
    statusIds: ImmutablePropTypes.list.isRequired,
    match: PropTypes.object.isRequired,
    me: PropTypes.number,
    isLoading: PropTypes.bool,
    hasMore: PropTypes.bool,
    gallery: PropTypes.node,
    pinnedStatusIds: ImmutablePropTypes.list,
  };

  static childContextTypes = {
    displayPinned: PropTypes.bool,
  };

  getChildContext() {
    return { displayPinned: true };
  }

  componentWillMount () {
    const { dispatch, match } = this.props;

    dispatch(changeAccountGallery(match.params.acct, 'album'));
    dispatch(openAccountGallery());
  }

  componentWillReceiveProps ({ match }) {
    if (this.props.match.params.acct !== match.params.acct) {
      this.props.dispatch(changeAccountGallery(match.params.acct, 'album'));
    }
  }

  handleScrollToBottom = debounce(() => {
    const { dispatch, isLoading, hasMore } = this.props;
    if (!isLoading && hasMore) {
      dispatch(expandAccountGalleryTimeline('album'));
    }
  }, 300, { leading: true })

  render () {
    const { accountAcct, accountId, account, statusIds, me, pinnedStatusIds, isLoading, hasMore } = this.props;
    const uniqueStatusIds = pinnedStatusIds.concat(statusIds).toOrderedSet().toList();

    if (accountAcct) {
      if (accountId) {
        const prepend = account && (
          <div className='prepend'>
            <AccountHeaderContainer account={account} />
            {me === accountId && <AlbumPostContainer />}
          </div>
        );

        const gallery = (
          <StatusList
            scrollKey='account_gallery'
            statusIds={uniqueStatusIds}
            hasMore={hasMore}
            isLoading={isLoading}
            isGallery
            prepend={prepend}
            onScrollToBottom={this.handleScrollToBottom}
          />
        );

        return (
          <AccountTimelineContainer accountId={accountId} gallery={gallery} />
        );
      } else {
        return <Timeline gallery={<MissingIndicator />} />;
      }
    } else {
      return null;
    }
  }

};
