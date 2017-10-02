import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import StatusContainer from '../../containers/status';
import DetailedStatusContainer from '../../containers/detailed_status';
import ScrollableList from '../../components/scrollable_list';

export default class StatusList extends ImmutablePureComponent {

  static propTypes = {
    scrollKey: PropTypes.string.isRequired,
    statusIds: ImmutablePropTypes.list.isRequired,
    onScrollToBottom: PropTypes.func,
    onScrollToTop: PropTypes.func,
    onScroll: PropTypes.func,
    isLoading: PropTypes.bool,
    hasMore: PropTypes.bool,
    detail: PropTypes.bool,
    prepend: PropTypes.node,
    emptyMessage: PropTypes.node,
  };

  render () {
    const { statusIds, detail, ...other } = this.props;
    const { isLoading } = other;

    const scrollableContent = (isLoading || statusIds.size > 0) ? (
      statusIds.map((statusId) => (detail ? (
        <DetailedStatusContainer key={statusId} id={statusId} />
      ) : (
        <StatusContainer key={statusId} id={statusId} />
      )))
    ) : (
      null
    );

    return (
      <ScrollableList {...other}>
        {scrollableContent}
      </ScrollableList>
    );
  }

}
