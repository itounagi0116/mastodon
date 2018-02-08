import { refreshAccountTimeline, expandAccountTimeline, refreshPinnedStatusTimeline } from '../../mastodon/actions/timelines';
import api from '../../mastodon/api';
import { makeGetAccount } from '../../mastodon/selectors';
import { displayNameEllipsis } from '../util/displayname_ellipsis';
import { changeFooterType } from './footer';
import { updateTimelineTitle } from './timeline';

export const ACCOUNT_GALLERY_ACCOUNT_CHANGE = 'ACCOUNT_GALLERY_ACCOUNT_CHANGE';
export const ACCOUNT_GALLERY_ACCOUNTS_FETCH_SUCCESS = 'ACCOUNT_GALLERY_ACCOUNTS_FETCH_SUCCESS';
export const ACCOUNT_GALLERY_ACCOUNTS_FETCH_FAIL = 'ACCOUNT_GALLERY_ACCOUNTS_FETCH_FAIL';

function changeAccountGalleryIdentified(acct, id, onlyMusics) {
  return (dispatch, getState) => {
    const displayName = displayNameEllipsis(makeGetAccount()(getState(), id));

    dispatch(refreshPinnedStatusTimeline(id, { onlyMusics }));
    dispatch(refreshAccountTimeline(id, { onlyMusics }));
    dispatch(updateTimelineTitle(`${displayName} のタイムライン`)); // TODO: intl
    dispatch({ type: ACCOUNT_GALLERY_ACCOUNT_CHANGE, acct, id });
  };
}

function changeAccountGalleryNotFound(acct) {
  return { type: ACCOUNT_GALLERY_ACCOUNT_CHANGE, acct, id: null };
}

export function changeAccountGallery(acct, onlyMusics) {
  return (dispatch, getState) => {
    const state = getState();
    const id = state.getIn(['pawoo_music', 'acct_map', acct]);

    dispatch(updateTimelineTitle(`${acct} のタイムライン`)); // TODO: intl

    if (id) {
      dispatch(changeAccountGalleryIdentified(acct, id, onlyMusics));
    } else {
      api(getState).get('/api/v1/accounts/search', {
        params: {
          q: '@' + acct,
          resolve: false,
          limit: 1,
        },
      }).then(({ data }) => {
        dispatch({
          type: ACCOUNT_GALLERY_ACCOUNTS_FETCH_SUCCESS,
          accounts: data,
        });

        dispatch(data.length > 0 ?
          changeAccountGalleryIdentified(acct, data[0].id, onlyMusics) :
          changeAccountGalleryNotFound(acct));
      }, () => {
        dispatch({ type: ACCOUNT_GALLERY_ACCOUNTS_FETCH_FAIL });
        dispatch(changeAccountGalleryNotFound(acct));
      });
    }
  };
}

export function expandAccountGalleryTimeline(onlyMusics) {
  return (dispatch, getState) => dispatch(expandAccountTimeline(
    getState().getIn(['pawoo_music', 'account_gallery', 'id']), { onlyMusics }));
}

export function openAccountGallery() {
  return changeFooterType('lobby_gallery');
}
