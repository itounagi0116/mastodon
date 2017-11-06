import React from 'react';
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
    }
  }

  renderChildren (list) {
    return list.map(id => <StatusContainer key={id} id={id} />);
  }

  render () {
    const { status, accountId, account, ancestorsIds, descendantsIds } = this.props;

    if (!status) {
      return null;
    }

    const ancestors = this.renderChildren(ancestorsIds);
    const descendants = this.renderChildren(descendantsIds);
    const Component = (status.has('track') || status.has('album')) ? MusicStatusContainer : StatusContainer;

    const content = ancestors.push(
      <Component detail key={`detail-${status.get('id')}`} id={status.get('id')} />
    ).concat(descendants);

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
