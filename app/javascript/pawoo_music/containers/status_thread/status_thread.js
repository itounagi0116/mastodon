import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { connect } from 'react-redux';
import { fetchStatus } from '../../../mastodon/actions/statuses';
import AccountHeaderContainer from '../account_header';
import { makeGetAccount, makeGetStatus } from '../../../mastodon/selectors';
import StatusContainer from '../status';
import MusicStatusContainer from '../music_status';
import AccountTimelineContainer from '../account_timeline';
import ScrollableList from '../../components/scrollable_list';
import { updateTimelineTitle } from '../../actions/timeline';
import { changeFooterType } from '../../actions/footer';
import { changeTargetColumn } from '../../actions/column';
import { displayNameEllipsis } from '../../util/displayname_ellipsis';

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();
  const getStatus = makeGetStatus();

  const mapStateToProps = (state, props) => {
    const acct = props.match.params.acct;
    const statusId = Number(props.match.params.id);
    const accountId = Number(state.getIn(['pawoo_music', 'acct_map', acct]));

    return {
      statusId,
      accountId,
      account: getAccount(state, accountId),
      status: getStatus(state, statusId),
      ancestorsIds: state.getIn(['contexts', 'ancestors', statusId], Immutable.List()),
      descendantsIds: state.getIn(['contexts', 'descendants', statusId], Immutable.List()),
      me: state.getIn(['meta', 'me']),
      boostModal: state.getIn(['meta', 'boost_modal']),
      deleteModal: state.getIn(['meta', 'delete_modal']),
      autoPlayGif: state.getIn(['meta', 'auto_play_gif']),
    };
  };

  return mapStateToProps;
};

@connect(makeMapStateToProps)
export default class StatusThread extends ImmutablePureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    accountId: PropTypes.number.isRequired,
    account: ImmutablePropTypes.map.isRequired,
    statusId: PropTypes.number.isRequired,
    status: ImmutablePropTypes.map,
    ancestorsIds: ImmutablePropTypes.list,
    descendantsIds: ImmutablePropTypes.list,
  };

  state = {
    deleted: false,
  };

  componentDidMount () {
    const { dispatch, statusId, account } = this.props;
    const displayName = displayNameEllipsis(account);

    dispatch(fetchStatus(statusId));
    dispatch(changeTargetColumn('gallery'));
    dispatch(updateTimelineTitle(`${displayName} のトゥート`)); /* TODO: intl */
    dispatch(changeFooterType('history_back'));
  }

  componentWillReceiveProps (nextProps) {
    const { dispatch } = this.props;

    if (nextProps.statusId !== this.props.statusId && nextProps.statusId) {
      const statusId = nextProps.statusId;

      dispatch(fetchStatus(statusId));
      this.setState({ deleted: false });
    } else if (!nextProps.status && this.props.status) {
      this.setState({ deleted: true });
    }
  }

  renderChildren (list) {
    return list.map(id => <StatusContainer key={id} id={id} />);
  }

  render () {
    const { status, accountId, account, ancestorsIds, descendantsIds } = this.props;
    const { deleted } = this.state;
    let content = null;

    if (status) {
      const ancestors = this.renderChildren(ancestorsIds);
      const descendants = this.renderChildren(descendantsIds);
      const Component = (status.has('track') || status.has('album')) ? MusicStatusContainer : StatusContainer;

      content = ancestors.push(
        <Component detail key={`detail-${status.get('id')}`} id={status.get('id')} />
      ).concat(descendants);
    } else if (deleted) {
      content = (
        <p className='status-thread-deleted'>
          <FormattedMessage
            id='pawoo_music.status_thread.deleted'
            defaultMessage='This toot was deleted.'
          />
        </p>
      );
    }

    const gallery = (
      <ScrollableList scrollKey='thread' prepend={<div className='prepend'><AccountHeaderContainer account={account} /></div>} >
        {content}
      </ScrollableList>
    );

    return (
      <AccountTimelineContainer accountId={accountId} gallery={gallery} />
    );
  }

};
