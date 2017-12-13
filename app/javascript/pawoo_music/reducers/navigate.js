import { CHANGE_NAVIGATE } from '../actions/navigate';

export default function navigate(state = null, action) {
  switch (action.type) {
  case CHANGE_NAVIGATE:
    return action.navigate;
  default:
    return state;
  }
}
