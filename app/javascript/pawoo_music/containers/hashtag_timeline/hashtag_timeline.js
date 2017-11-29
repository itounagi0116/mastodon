import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { refreshHashtagTimeline, expandHashtagTimeline } from '../../../mastodon/actions/timelines';
import StatusTimelineContainer from '../../containers/status_timeline';
import { connectHashtagStream } from '../../actions/streaming';
import { updateTimelineTitle } from '../../actions/timeline';
import { changeFooterType } from '../../actions/footer';

@connect()
export default class HashtagTimeline extends PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    match: PropTypes.object.isRequired,
  };

  componentDidMount () {
    const { dispatch, match: { params: { id } } } = this.props;

    dispatch(refreshHashtagTimeline(id));
    dispatch(refreshHashtagTimeline(id, { onlyMusics: true }));
    dispatch(updateTimelineTitle(`#${id} タイムライン`)); /* TODO: intl */
    dispatch(changeFooterType('lobby_gallery'));
    this._subscribe(dispatch, id);
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.match.params.id !== this.props.match.params.id) {
      const { dispatch, match: { params: { id } } } = nextProps;
      dispatch(refreshHashtagTimeline(id));
      dispatch(refreshHashtagTimeline(id, { onlyMusics: true }));
      dispatch(updateTimelineTitle(`#${id} タイムライン`)); /* TODO: intl */
      this._unsubscribe();
      this._subscribe(this.props.dispatch, id);
    }
  }

  componentWillUnmount () {
    this._unsubscribe();
  }

  handleLoadMore = (options) => {
    this.props.dispatch(expandHashtagTimeline(this.props.match.params.id, options));
  }

  _subscribe (dispatch, id) {
    this.disconnect = dispatch(connectHashtagStream(id));
  }

  _unsubscribe () {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }
  }

  render () {
    return (
      <StatusTimelineContainer
        timelineId={`hashtag:${this.props.match.params.id}`}
        scrollKeyBase='hashtag_timeline'
        loadMore={this.handleLoadMore}
        emptyMessage={<FormattedMessage id='empty_column.hashtag' defaultMessage='There is nothing in this hashtag yet.' />}
        withComposeForm
      />
    );
  }

};
