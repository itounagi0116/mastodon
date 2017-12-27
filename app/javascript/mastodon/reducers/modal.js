import { MODAL_OPEN, MODAL_CLOSE } from '../actions/modal';

const initialState = {
  modalClosable: null,
  modalType: null,
  modalProps: {},
};

export default function modal(state = initialState, action) {
  switch(action.type) {
  case MODAL_OPEN:
    return { modalClosable: action.modalClosable, modalType: action.modalType, modalProps: action.modalProps };
  case MODAL_CLOSE:
    return initialState;
  default:
    return state;
  }
};
