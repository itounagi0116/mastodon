import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import LoadingIndicator from '../../../mastodon/components/loading_indicator';
import { fetchScheduledStatuses, expandScheduledStatuses } from '../../actions/schedules';
import StatusList from '../../components/status_list';
import ImmutablePureComponent from 'react-immutable-pure-component';

const mapStateToProps = state => ({
  statusIds: state.getIn(['status_lists', 'schedules', 'items']),
  loaded: state.getIn(['status_lists', 'schedules', 'loaded']),
});

@connect(mapStateToProps)
export default class ScheduledStatuses extends ImmutablePureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    statusIds: ImmutablePropTypes.list.isRequired,
    loaded: PropTypes.bool,
  };

  static childContextTypes = {
    schedule: PropTypes.bool,
  };

  getChildContext() {
    return { schedule: true };
  }

  componentWillMount () {
    this.props.dispatch(fetchScheduledStatuses());
  }

  handleScrollToBottom = () => {
    this.props.dispatch(expandScheduledStatuses());
  }

  render () {
    const { loaded } = this.props;

    return loaded ?
            (<StatusList {...this.props} scrollKey='scheduledStatuses' onScrollToBottom={this.handleScrollToBottom} />) :
            (<LoadingIndicator />);
  }

}
