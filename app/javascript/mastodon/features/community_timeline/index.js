import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import StatusListContainer from '../ui/containers/status_list_container';
import Column from '../../components/column';
import ColumnHeader from '../../components/column_header';
import {
  refreshCommunityTimeline,
  expandCommunityTimeline,
} from '../../actions/timelines';
import { addColumn, removeColumn, moveColumn } from '../../actions/columns';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import ColumnSettingsContainer from './containers/column_settings_container';
import { connectCommunityStream } from '../../actions/streaming';

const messages = defineMessages({
  title: { id: 'column.community', defaultMessage: 'Local timeline' },
});

const mapStateToProps = state => ({
  hasUnread: state.getIn(['timelines', 'community', 'unread']) > 0,
});

@connect(mapStateToProps)
@injectIntl
export default class CommunityTimeline extends React.PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    columnId: PropTypes.string,
    intl: PropTypes.object.isRequired,
    hasUnread: PropTypes.bool,
    multiColumn: PropTypes.bool,
    standalone: PropTypes.bool,
  };

  static defaultProps = {
    standalone: false,
  };

  handlePin = () => {
    const { columnId, dispatch } = this.props;

    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('COMMUNITY', {}));
    }
  }

  handleMove = (dir) => {
    const { columnId, dispatch } = this.props;
    dispatch(moveColumn(columnId, dir));
  }

  handleHeaderClick = () => {
    this.column.scrollTop();
  }

  componentDidMount () {
    const { dispatch, standalone } = this.props;

    if (!standalone) {
      dispatch(refreshCommunityTimeline());
      this.disconnect = dispatch(connectCommunityStream());
    } else {
      this.interval = setInterval(() => {
        dispatch(refreshCommunityTimeline());
      }, 2000);
    }
  }

  componentWillUnmount () {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }

    clearInterval(this.interval);
  }

  setRef = c => {
    this.column = c;
  }

  handleLoadMore = () => {
    this.props.dispatch(expandCommunityTimeline());
  }

  render () {
    let heading;
    const { intl, hasUnread, columnId, multiColumn, standalone } = this.props;
    const pinned = !!columnId;

    if (standalone) {
      heading = (
        <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
          <div>Pawoo Musicのローカルタイムライン</div>
          <div style={{ fontSize: '12px' }}>投稿をリアルタイムに流しています</div>
        </div>
      );
    } else {
      heading = intl.formatMessage(messages.title);
    }

    return (
      <Column ref={this.setRef}>
        <ColumnHeader
          icon='users'
          active={hasUnread}
          title={heading}
          onPin={this.handlePin}
          onMove={this.handleMove}
          onClick={this.handleHeaderClick}
          pinned={pinned}
          multiColumn={multiColumn}
          showBackButton={!standalone}
        >
          {!standalone && <ColumnSettingsContainer />}
        </ColumnHeader>

        <StatusListContainer
          trackScroll={!pinned}
          scrollKey={`community_timeline-${columnId}`}
          timelineId='community'
          loadMore={this.handleLoadMore}
          emptyMessage={<FormattedMessage id='empty_column.community' defaultMessage='The local timeline is empty. Write something publicly to get the ball rolling!' />}
          standalone={standalone}
        />
      </Column>
    );
  }

}
