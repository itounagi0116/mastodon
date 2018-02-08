import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { refreshCommunityTimeline, expandCommunityTimeline } from '../../../mastodon/actions/timelines';
import StatusTimelineContainer from '../../containers/status_timeline';
import { connectCommunityStream } from '../../actions/streaming';
import { updateTimelineTitle } from '../../actions/timeline';
import { changeFooterType } from '../../actions/footer';
import TrackPostContainer from '../track_post';

@connect()
export default class CommunityTimelineContainer extends PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
  };

  componentDidMount () {
    const { dispatch } = this.props;
    dispatch(updateTimelineTitle('ローカル タイムライン')); /* TODO: intl */
    dispatch(changeFooterType('lobby_gallery'));
    dispatch(refreshCommunityTimeline());
    dispatch(refreshCommunityTimeline({ onlyMusics: true }));
    this.disconnect = dispatch(connectCommunityStream());
  }

  componentWillUnmount () {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }
  }

  handleLoadMore = (options) => {
    this.props.dispatch(expandCommunityTimeline(options));
  }

  render () {
    return (
      <StatusTimelineContainer
        timelineId='community'
        loadMore={this.handleLoadMore}
        emptyMessage={<FormattedMessage id='empty_column.community' defaultMessage='The local timeline is empty. Write something publicly to get the ball rolling!' />}
        galleryPrepend={<TrackPostContainer />}
        withComposeForm
      />
    );
  }

};
