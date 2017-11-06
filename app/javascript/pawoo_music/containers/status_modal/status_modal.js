import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import StatusContainer from '../status';
import MusicStatusContainer from '../music_status';
import { fetchStatus } from '../../../mastodon/actions/statuses';
import { makeGetStatus } from '../../../mastodon/selectors';

const makeMapStateToProps = () => {
  const getStatus = makeGetStatus();

  const mapStateToProps = (state, props) => {
    const { id, status } = props;
    return {
      ancestorsIds: state.getIn(['contexts', 'ancestors', id], Immutable.List()),
      descendantsIds: state.getIn(['contexts', 'descendants', id], Immutable.List()),
      status: status || getStatus(state, id),
      statusId: id,
    };
  };

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch) => ({
  fetchStatus (statusId) {
    dispatch(fetchStatus(statusId));
  },
});

@connect(makeMapStateToProps, mapDispatchToProps)
export default class StatusModal extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    status: ImmutablePropTypes.map.isRequired,
    statusId: PropTypes.number.isRequired,
    fetchStatus: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
  };

  componentDidMount = () => {
    this.props.fetchStatus(this.props.statusId);
    this.unlisten = this.context.router.history.listen(() => {
      this.props.onClose();
    });
  };

  componentWillUnmount = () => {
    if (this.unlisten) {
      this.unlisten();
    }
  };

  getChildren = (list) => (
    list.map(id => <StatusContainer key={id} id={id} />)
  );

  render = () => {
    const { status } = this.props;

    const ancestors = this.getChildren(this.props.ancestorsIds);
    const descendants = this.getChildren(this.props.descendantsIds);
    const Component = (status.has('track') || status.has('album')) ? MusicStatusContainer : StatusContainer;
    const content = ancestors.push(
      <Component detail key={status.get('id')} id={status.get('id')} />
    ).concat(descendants);
    return (
      <div className='status-modal'>
        <div className='gallery-column'>
          {content}
        </div>
      </div>
    );
  };

}
