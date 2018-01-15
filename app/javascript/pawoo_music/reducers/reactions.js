import Immutable from 'immutable';
import { STORE_HYDRATE } from '../../mastodon/actions/store';

export default function reactions(state = Immutable.List(), action) {
  switch (action.type) {
  case STORE_HYDRATE:
    return action.state.get('reactions');
  default:
    return state;
  }
}
