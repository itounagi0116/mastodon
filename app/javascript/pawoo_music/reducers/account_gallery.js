import { ACCOUNT_GALLERY_ACCOUNT_CHANGE } from '../actions/account_gallery';
import Immutable from 'immutable';

const initialState = Immutable.Map({ acct: null, id: null });

export default function accountGallery(state = initialState, action) {
  switch (action.type) {
  case ACCOUNT_GALLERY_ACCOUNT_CHANGE:
    return state.merge([['acct', action.acct], ['id', action.id]]);
  default:
    return state;
  }
}
