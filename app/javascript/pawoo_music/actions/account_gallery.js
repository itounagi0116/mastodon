import { refreshAccountTimeline, expandAccountTimeline, refreshPinnedStatusTimeline } from '../../mastodon/actions/timelines';
import api from '../../mastodon/api';
import { makeGetAccount } from '../../mastodon/selectors';
import { displayNameEllipsis } from '../util/displayname_ellipsis';
import { changeFooterType } from './footer';
import { updateTimelineTitle } from './timeline';

export const ACCOUNT_GALLERY_ACCOUNT_CHANGE = 'ACCOUNT_GALLERY_ACCOUNT_CHANGE';
export const ACCOUNT_GALLERY_ACCOUNTS_FETCH_SUCCESS = 'ACCOUNT_GALLERY_ACCOUNTS_FETCH_SUCCESS';
export const ACCOUNT_GALLERY_ACCOUNTS_FETCH_FAIL = 'ACCOUNT_GALLERY_ACCOUNTS_FETCH_FAIL';

function changeAccountGalleryAccountIdentified(acct, id) {
  return (dispatch, getState) => {
    const displayName = displayNameEllipsis(makeGetAccount()(getState(), id));

    dispatch(refreshPinnedStatusTimeline(id, { onlyMusics: true }));
    dispatch(refreshAccountTimeline(id, { onlyMusics: true }));
    dispatch(updateTimelineTitle(`${displayName} のタイムライン`)); // TODO: intl
    dispatch({ type: ACCOUNT_GALLERY_ACCOUNT_CHANGE, acct, id });
  };
}

function changeAccountGalleryAccountNotFound(acct) {
  return { type: ACCOUNT_GALLERY_ACCOUNT_CHANGE, acct, id: null };
}

export function changeAccountGalleryAccount(acct) {
  return (dispatch, getState) => {
    const state = getState();
    const id = state.getIn(['pawoo_music', 'acct_map', acct]);

    dispatch(updateTimelineTitle(`${acct} のタイムライン`)); // TODO: intl

    if (id) {
      dispatch(changeAccountGalleryAccountIdentified(acct, id));
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
          changeAccountGalleryAccountIdentified(acct, data[0].id) :
          changeAccountGalleryAccountNotFound(acct));
      }, () => {
        dispatch({ type: ACCOUNT_GALLERY_ACCOUNTS_FETCH_FAIL });
        dispatch(changeAccountGalleryAccountNotFound(acct));
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
