import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { createSelector } from 'reselect';
import { debounce } from 'lodash';
import Timeline from '../../components/timeline';
import StatusList from '../../components/status_list';
import { scrollTopTimeline } from '../../../mastodon/actions/timelines';
import StatusFormContainer from '../status_form';
import AccountContainer from '../account';

const makeGetStatusIds = () => createSelector([
  (state, { type }) => state.getIn(['settings', type], Immutable.Map()),
  (state, { type }) => state.getIn(['timelines', type, 'items'], Immutable.List()),
  (state)           => state.get('statuses'),
  (state)           => state.getIn(['meta', 'me']),
], (columnSettings, statusIds, statuses, me) => {
  const showReblog = columnSettings.getIn(['shows', 'reblog']);
  const showReply =  columnSettings.getIn(['shows', 'reply']);
  const regexText =  columnSettings.getIn(['regex', 'body']);
  let regex = null;

  try {
    if (regexText) {
      const trimmedRegexText = regexText.trim();
      regex = trimmedRegexText ? new RegExp(trimmedRegexText, 'i') : null;
    }
  } catch(e) {
    // Bad regex, don't affect filters
  }

  return statusIds.filter(id => {
    const statusForId = statuses.get(id);
    let showStatus    = true;

    if (showReblog === false) {
      showStatus = showStatus && statusForId.get('reblog') === null;
    }

    if (showReply === false) {
      showStatus = showStatus && (statusForId.get('in_reply_to_id') === null || statusForId.get('in_reply_to_account_id') === me);
    }

    if (regex && showStatus) {
      showStatus = !regex.test(statusForId.get('reblog') ? statuses.getIn([statusForId.get('reblog'), 'search_index']) : statusForId.get('search_index'));
    }

    return showStatus;
  });
});

const makeMapStateToProps = () => {
  const getStatusIds = makeGetStatusIds();

  const mapStateToProps = (state, { timelineId }) => ({
    statusIds: getStatusIds(state, { type: timelineId }),
    galleryStatusIds: getStatusIds(state, { type: `${timelineId}:music` }),
    isLoading: state.getIn(['timelines', timelineId, 'isLoading'], true),
    galleryIsLoading: state.getIn(['timelines', `${timelineId}:music`, 'isLoading'], true),
    hasMore: !!state.getIn(['timelines', timelineId, 'next']),
    galleryHasMore: !!state.getIn(['timelines', `${timelineId}:music`, 'next']),
    me: state.getIn(['meta', 'me']),
  });

  return mapStateToProps;
};

@connect(makeMapStateToProps)
export default class StatusTimeline extends ImmutablePureComponent {

  static propTypes = {
    timelineId: PropTypes.string.isRequired,
    statusIds: ImmutablePropTypes.list.isRequired,
    galleryStatusIds: ImmutablePropTypes.list.isRequired,
    loadMore: PropTypes.func,
    isLoading: PropTypes.bool,
    galleryIsLoading: PropTypes.bool,
    hasMore: PropTypes.bool,
    galleryHasMore: PropTypes.bool,
    emptyMessage: PropTypes.node,
    galleryPrepend: PropTypes.node,
    withComposeForm: PropTypes.bool,
    scrollKeyBase: PropTypes.string,
    me: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
  }

  static defaultProps = {
    withComposeForm: false,
  }

  handleGalleryLoadMore = debounce(() => {
    const { loadMore } = this.props;
    if (loadMore) {
      loadMore({ onlyMusics: true });
    }
  }, 300, { leading: true })

  handleScrollToBottom = debounce(() => {
    const { dispatch, timelineId, loadMore } = this.props;
    dispatch(scrollTopTimeline(timelineId, false));
    if (loadMore) {
      loadMore();
    }
  }, 300, { leading: true })

  handleScrollToTop = debounce(() => {
    const { dispatch, timelineId } = this.props;
    dispatch(scrollTopTimeline(timelineId, true));
  }, 100)

  handleScroll = debounce(() => {
    const { dispatch, timelineId } = this.props;
    dispatch(scrollTopTimeline(timelineId, false));
  }, 100)

  render () {
    const { timelineId, scrollKeyBase, galleryStatusIds, withComposeForm, me, galleryPrepend, galleryIsLoading, galleryHasMore, ...other } = this.props;

    const gallery = (
      <StatusList
        scrollKey={`${scrollKeyBase || timelineId}_gallery`}
        statusIds={galleryStatusIds}
        hasMore={galleryHasMore}
        isLoading={galleryIsLoading}
        isGallery
        prepend={galleryPrepend}
        onScrollToBottom={this.handleGalleryLoadMore}
      />
    );

    const prepend = withComposeForm && me && (
      <div className='prepend'>
        <AccountContainer id={me} />
        <StatusFormContainer />
      </div>
    );

    return (
      <Timeline gallery={gallery}>
        <StatusList
          scrollKey={`${scrollKeyBase || timelineId}_timeline`}
          prepend={prepend}
          onScrollToBottom={this.handleScrollToBottom}
          onScrollToTop={this.handleScrollToTop}
          onScroll={this.handleScroll}
          {...other}
        />
      </Timeline>
    );
  }

}
