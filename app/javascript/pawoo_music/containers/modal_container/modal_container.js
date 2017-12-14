import { connect } from 'react-redux';
import { closeModal } from '../../../mastodon/actions/modal';

import ModalRoot from '../../components/modal_root';

const mapStateToProps = state => ({
  closable: state.get('modal').modalClosable,
  type: state.get('modal').modalType,
  props: state.get('modal').modalProps,
});

const mapDispatchToProps = dispatch => ({
  onClose () {
    dispatch(closeModal());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ModalRoot);
