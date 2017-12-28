import { connect } from 'react-redux';
import PrivacyDropdown from '../components/privacy_dropdown';
import { changeComposeVisibility } from '../../../actions/compose';
import { openModal, closeModal } from '../../../actions/modal';
import { isUserTouching } from '../../../is_mobile';
import { switchCompose } from '../../../selectors';

const mapStateToProps = (state, props) => {
  state = switchCompose(state, props);

  return {
    isModalOpen: state.get('modal').modalType === 'ACTIONS',
    value: state.getIn(['compose', 'privacy']),
  };
};

const mapDispatchToProps = dispatch => ({

  onChange (value) {
    dispatch(changeComposeVisibility(value));
  },

  isUserTouching,
  onModalOpen: props => dispatch(openModal('ACTIONS', props)),
  onModalClose: () => dispatch(closeModal()),

});

export default connect(mapStateToProps, mapDispatchToProps)(PrivacyDropdown);
