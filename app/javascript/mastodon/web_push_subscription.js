import axios from 'axios';
import React from 'react';
import store from './store';
import { setBrowserSupport, setSubscription, clearSubscription } from './actions/push_notifications';
import { pushNotificationsSetting } from './settings';
import { openModalUnclosable } from './actions/modal';
import PushSettingsInitializerModal from '../pawoo_music/containers/push_settings_initializer_modal';

// Taken from https://www.npmjs.com/package/web-push
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const getApplicationServerKey = () => document.querySelector('[name="applicationServerKey"]').getAttribute('content');

const getRegistration = () => navigator.serviceWorker.ready;

const getPushSubscription = (registration) =>
  registration.pushManager.getSubscription()
    .then(subscription => ({ registration, subscription }));

const subscribe = (registration) =>
  registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(getApplicationServerKey()),
  });

const unsubscribe = ({ registration, subscription }) =>
  subscription ? subscription.unsubscribe().then(() => registration) : registration;

const sendSubscriptionToBackend = (params) => {
  return axios.post('/api/web/push_subscriptions', params).then(response => response.data);
};

const renewSubscription = (registration) => {
  const me = store.getState().getIn(['meta', 'me']);
  const localStorageData = pushNotificationsSetting.get(me);
  let initialData = null;

  return new Promise((resolve, reject) => {
    const notificationAvailable = typeof window.Notification !== 'undefined' && Notification.permission !== 'denied';
    if (!me) {
      reject();
      return;
    }

    if (localStorageData) {
      resolve(localStorageData);
    } else if (notificationAvailable) {
      store.dispatch(openModalUnclosable('UNIVERSAL', { children: <PushSettingsInitializerModal onResolve={resolve} onReject={reject} /> }));
    } else {
      resolve(null);
    }
  }).then((data) => {
    // localStorageにデータがない場合は、サブスクリプションの有無に関わらずデータをlocalStorageに書き込んで、2回目以降にモーダルが表示されないようにする
    if (!localStorageData && data) {
      pushNotificationsSetting.set(me, data);
    }
    initialData = data;

    return subscribe(registration);
  }).then((subscription) => {
    const params = { subscription };
    if (initialData) {
      params.data = initialData;
    }

    return sendSubscriptionToBackend(params);
  });
};

// Last one checks for payload support: https://web-push-book.gauntface.com/chapter-06/01-non-standards-browsers/#no-payload
const supportsPushNotifications = ('serviceWorker' in navigator && 'PushManager' in window && 'getKey' in PushSubscription.prototype);

export function register () {
  const me = store.getState().getIn(['meta', 'me']);

  if (!me) {
    return;
  }

  if (!pushNotificationsSetting.get(me)) {
    const alerts = store.getState().getIn(['push_notifications', 'alerts']);
    if (store.getState().getIn(['push_notifications', 'subscription']) && alerts) {
      pushNotificationsSetting.set(me, { alerts: alerts });
    }
  }

  store.dispatch(setBrowserSupport(supportsPushNotifications));

  if (supportsPushNotifications) {
    if (!getApplicationServerKey()) {
      console.error('The VAPID public key is not set. You will not be able to receive Web Push Notifications.');
      return;
    }

    getRegistration()
      .then(getPushSubscription)
      .then(({ registration, subscription }) => {
        if (subscription !== null) {
          // We have a subscription, check if it is still valid
          const currentServerKey = (new Uint8Array(subscription.options.applicationServerKey)).toString();
          const subscriptionServerKey = urlBase64ToUint8Array(getApplicationServerKey()).toString();
          const serverEndpoint = store.getState().getIn(['push_notifications', 'subscription', 'endpoint']);

          // If the VAPID public key did not change and the endpoint corresponds
          // to the endpoint saved in the backend, the subscription is valid
          if (subscriptionServerKey === currentServerKey && subscription.endpoint === serverEndpoint) {
            return subscription;
          } else {
            // Something went wrong, try to subscribe again
            return unsubscribe({ registration, subscription }).then(renewSubscription);
          }
        }

        // No subscription, try to subscribe
        return renewSubscription(registration);
      })
      .then(subscription => {
        // If we got a PushSubscription (and not a subscription object from the backend)
        // it means that the backend subscription is valid (and was set during hydration)
        if (!(subscription instanceof PushSubscription)) {
          store.dispatch(setSubscription(subscription));
          if (me) {
            pushNotificationsSetting.set(me, { alerts: subscription.alerts });
          }
        }
      })
      .catch(error => {
        if (error.code === 20 && error.name === 'AbortError') {
          console.warn('Your browser supports Web Push Notifications, but does not seem to implement the VAPID protocol.');
        } else if (error.code === 5 && error.name === 'InvalidCharacterError') {
          console.error('The VAPID public key seems to be invalid:', getApplicationServerKey());
        }

        // Clear alerts and hide UI settings
        store.dispatch(clearSubscription());
        if (me) {
          pushNotificationsSetting.remove(me);
        }

        try {
          getRegistration()
            .then(getPushSubscription)
            .then(unsubscribe);
        } catch (e) {

        }
      });
  } else {
    console.warn('Your browser does not support Web Push Notifications.');
  }
}
