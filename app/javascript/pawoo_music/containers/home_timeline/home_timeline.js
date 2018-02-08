import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import Link from '../../components/link_wrapper';
import { expandHomeTimeline } from '../../../mastodon/actions/timelines';
import StatusTimelineContainer from '../../containers/status_timeline';
import TrackPostContainer from '../track_post';
import { updateTimelineTitle } from '../../actions/timeline';
import { changeFooterType } from '../../actions/footer';

const mapStateToProps = state => ({
  hasFollows: state.getIn(['accounts_counters', state.getIn(['meta', 'me']), 'following_count']) > 0,
});

@connect(mapStateToProps)
export default class HomeTimeline extends PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    hasFollows: PropTypes.bool.isRequired,
  };

  componentDidMount () {
    const { dispatch } = this.props;
    dispatch(updateTimelineTitle('ホーム タイムライン')); /* TODO: intl */
    dispatch(changeFooterType('lobby_gallery'));
  }

  handleLoadMore = (options) => {
    this.props.dispatch(expandHomeTimeline(options));
  }

  render () {
    const { hasFollows } = this.props;

    const emptyMessage = hasFollows ? (
      <FormattedMessage id='empty_column.home.inactivity' defaultMessage='Your home feed is empty. If you have been inactive for a while, it will be regenerated for you soon.' />
    ) : (
      <FormattedMessage
        id='empty_column.home'
        defaultMessage="You aren't following anyone yet. Visit {public} or use search to get started and meet other users."
        values={{ public: <Link to='/timelines/public'><FormattedMessage id='empty_column.home.public_timeline' defaultMessage='the public timeline' /></Link> }}
      />
    );

    return (
      <StatusTimelineContainer
        timelineId='home'
        loadMore={this.handleLoadMore}
        emptyMessage={emptyMessage}
        galleryPrepend={<TrackPostContainer />}
        withComposeForm
      />
    );
  }

};
