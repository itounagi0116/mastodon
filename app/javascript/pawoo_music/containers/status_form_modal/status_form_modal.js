import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { matchPath } from 'react-router';
import AccountContainer from '../account';
import StatusFormContainer from '../status_form';
import { restoreBackupData } from '../../../mastodon/actions/compose';
import { closeModal } from '../../../mastodon/actions/modal';
import { fetchContext } from '../../../mastodon/actions/statuses';

const mapStateToProps = (state) => ({
  hasBackup: !!state.getIn(['compose', 'backup']),
  me: state.getIn(['meta', 'me']),
});

@connect(mapStateToProps)
export default class StatusFormModal extends React.PureComponent {

  static propTypes = {
    hasBackup: PropTypes.bool,
    me: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
  };

  static contextTypes = {
    router: PropTypes.object,
  }

  componentWillReceiveProps(nextProps) {
    const { dispatch, hasBackup } = this.props;

    // 送信完了
    if (hasBackup === true && nextProps.hasBackup === false) {
      dispatch(closeModal());

      const pathname = this.context.router.history.location.pathname;
      const match = matchPath(pathname, { path: '/@:acct/:id' });
      if (match) {
        dispatch(fetchContext(Number(match.params.id)));
      }
    }
  }

  componentWillUnmount () {
    const { dispatch } = this.props;
    dispatch(restoreBackupData());
  }


  render () {
    return (
      <div className='modal-root__modal status-form-modal'>
        <AccountContainer id={this.props.me} />
        <StatusFormContainer useModal />
      </div>
    );
  }

}
