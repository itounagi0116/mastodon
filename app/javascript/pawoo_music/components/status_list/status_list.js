import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import StatusContainer from '../../containers/status';
import MusicStatusContainer from '../../containers/music_status';
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
    isGallery: PropTypes.bool,
    prepend: PropTypes.node,
    emptyMessage: PropTypes.node,
  };

  render () {
    const { statusIds, detail, isGallery, ...other } = this.props;
    const { isLoading } = other;
    const Component = isGallery ? MusicStatusContainer : StatusContainer;

    const scrollableContent = (isLoading || statusIds.size > 0) ? (
      statusIds.map((statusId) => <Component key={statusId} id={statusId} detail={detail} />)
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
