import createStream from '../../mastodon/stream';
import {
  updateTimeline,
  deleteFromTimelines,
  refreshHomeTimeline,
  refreshCommunityTimeline,
  refreshPublicTimeline,
  refreshHashtagTimeline,
  connectTimeline,
  disconnectTimeline,
} from '../../mastodon/actions/timelines';
import { updateNotifications, refreshNotifications } from '../../mastodon/actions/notifications';
import { getLocale } from '../../mastodon/locales';

const { messages } = getLocale();

export function connectTimelineStream (timelineId, path, { shouldUpdateTimeline = null, pollingRefresh = null } = {}) {
  return (dispatch, getState) => {
    const streamingAPIBaseURL = getState().getIn(['meta', 'streaming_api_base_url']);
    const accessToken = getState().getIn(['meta', 'access_token']);
    const locale = getState().getIn(['meta', 'locale']);
    let polling = null;
    let subscription = null;

    const setupPolling = () => {
      clearPolling();
      polling = setInterval(() => {
        pollingRefresh(dispatch);
      }, 20000);
    };

    const clearPolling = () => {
      if (polling) {
        clearInterval(polling);
        polling = null;
      }
    };

    if (accessToken) {
      const callbacks = {

        connected () {
          if (pollingRefresh) {
            clearPolling();
          }
          dispatch(connectTimeline(timelineId));
        },

        disconnected () {
          if (pollingRefresh && subscription) {
            setupPolling();
          }
          dispatch(disconnectTimeline(timelineId));
        },

        received (data) {
          switch(data.event) {
          case 'update':
            const status = JSON.parse(data.payload);
            if (!shouldUpdateTimeline || shouldUpdateTimeline(status)) {
              dispatch(updateTimeline(timelineId, status));
              if (status.track || status.album || (status.reblog && (status.reblog.track || status.reblog.album))) {
                dispatch(updateTimeline(`${timelineId}:music`, status));
              }
            }
            break;
          case 'delete':
            dispatch(deleteFromTimelines(data.payload));
            break;
          case 'notification':
            dispatch(updateNotifications(JSON.parse(data.payload), messages, locale));
            break;
          }
        },

        reconnected () {
          if (pollingRefresh) {
            clearPolling();
            pollingRefresh(dispatch);
          }
          dispatch(connectTimeline(timelineId));
        },

      };
      subscription = createStream(streamingAPIBaseURL, accessToken, path, callbacks);
    } else {
      setupPolling();
    }


    const disconnect = () => {
      if (subscription) {
        subscription.close();
        subscription = null;
      }
      clearPolling();
    };

    return disconnect;
  };
}

function refreshHomeTimelineAndNotification (dispatch) {
  dispatch(refreshHomeTimeline());
  dispatch(refreshNotifications());
}

function hasMediaAttachment (status) {
  return status.media_attachments.length > 0;
}

export const connectUserStream = () => connectTimelineStream('home', 'user', { pollingRefresh: refreshHomeTimelineAndNotification });
export const connectCommunityStream = () => connectTimelineStream('community', 'public:local', { pollingRefresh: (dispatch) => dispatch(refreshCommunityTimeline()) });
export const connectMediaStream = () => connectTimelineStream('community', 'public:local', { shouldUpdateTimeline: hasMediaAttachment });
export const connectPublicStream = () => connectTimelineStream('public', 'public', { pollingRefresh: (dispatch) => dispatch(refreshPublicTimeline()) });
export const connectHashtagStream = (hashtag) => connectTimelineStream(`hashtag:${hashtag}`, `hashtag&tag=${hashtag}`, { pollingRefresh: (dispatch) => dispatch(refreshHashtagTimeline(hashtag)) });
