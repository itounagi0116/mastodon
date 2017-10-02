import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { makeGetStatus } from '../../../mastodon/selectors';
import Timestamp from '../../../mastodon/components/timestamp';
import StatusContent from '../../../mastodon/components/status_content';
import StatusActionBar from '../status_action_bar';
import AccountContainer from '../account';
import DisplayName from '../../components/display_name';
import StatusMedia from '../status_media';

const makeMapStateToProps = () => {
  const getStatus = makeGetStatus();

  const mapStateToProps = (state, props) => {
    const { id, status } = props;

    return {
      status: status || getStatus(state, id),
    };
  };

  return mapStateToProps;
};

@connect(makeMapStateToProps)
export default class Status extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object,
    displayPinned: PropTypes.bool,
    schedule: PropTypes.bool,
  };

  static propTypes = {
    status: ImmutablePropTypes.map,
    // fetchBoothItem: PropTypes.func,
    // boothItem: ImmutablePropTypes.map,
    dispatch: PropTypes.func.isRequired,
  };

  state = {
    isExpanded: false,
  }

  handleExpandedToggle = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  };

  handleClick = () => {
    let { status } = this.props;
    if (status.get('reblog')) {
      status = status.get('reblog');
    }

    this.context.router.history.push(`/@${status.getIn(['account', 'acct'])}/${status.get('id')}`);
  }

  render () {
    const { muted } = this.props;
    const { isExpanded } = this.state;
    const { displayPinned, schedule } = this.context;
    let { status } = this.props;
    let prepend = null;

    if (!status) {
      return null;
    }

    if (status.get('reblog', null) !== null && typeof status.get('reblog') === 'object') {
      const name = (
        <a
          onClick={this.handleAccountClick}
          data-id={status.getIn(['account', 'id'])}
          href={status.getIn(['account', 'url'])}
        >
          <DisplayName account={status.get('account')} />
        </a>
      );

      prepend = (
        <div className='prepend-inline'>
          <i className='fa fa-fw fa-retweet status__prepend-icon' />
          <FormattedMessage id='status.reblogged_by' defaultMessage='{name} boosted' values={{ name }} />
        </div>
      );
      status = status.get('reblog');
    } else if (displayPinned && status.get('pinned')) {
      prepend = (
        <div className='prepend-inline'>
          <i className='fa fa-fw fa-thumb-tack' />
          <FormattedMessage id='status.pinned' defaultMessage='Pinned Toot' className='status__display-name muted' />
        </div>
      );
    }

    return (
      <div className={classNames('status', { muted }, `status-${status.get('visibility')}`)} data-id={status.get('id')}>
        {prepend}
        <div className='status-head'>
          <AccountContainer account={status.get('account')} />
          <a href={status.get('url')} className='status-time' target='_blank' rel='noopener'>
            <Timestamp schedule={schedule} timestamp={status.get('created_at')} />
          </a>
        </div>
        <StatusContent status={status} onClick={this.handleClick} expanded={isExpanded} onExpandedToggle={this.handleExpandedToggle} />

        <StatusMedia status={status} />

        <StatusActionBar status={status} />
      </div>
    );
  }

}
