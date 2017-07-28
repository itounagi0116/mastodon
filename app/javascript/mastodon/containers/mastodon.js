import React from 'react';
import { connect, Provider } from 'react-redux';
import PropTypes from 'prop-types';
import configureStore from '../store/configureStore';
import {
  updateTimeline,
  deleteFromTimelines,
  refreshHomeTimeline,
  connectTimeline,
  disconnectTimeline,
} from '../actions/timelines';
import { showOnboardingOnce } from '../actions/onboarding';
import { updateNotifications, refreshNotifications } from '../actions/notifications';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import Route from 'react-router-dom/Route';
import ScrollContext from 'react-router-scroll/lib/ScrollBehaviorContext';
import CommunityTimeline from '../features/community_timeline';
import ScheduledStatuses from '../features/scheduled_statuses';
import Compose from '../features/compose';
import UI from '../features/ui';
import { hydrateStore } from '../actions/store';
import createStream from '../stream';
import { IntlProvider, addLocaleData } from 'react-intl';
import { getLocale } from '../locales';
const { localeData, messages } = getLocale();
addLocaleData(localeData);

const store = configureStore();
const initialState = JSON.parse(document.getElementById('initial-state').textContent);
store.dispatch(hydrateStore(initialState));

export default class Mastodon extends React.PureComponent {

  static propTypes = {
    locale: PropTypes.string.isRequired,
  };

  componentWillMount() {
    this.appmode = store.getState().getIn(['meta', 'appmode']);
  }

  componentDidMount() {
    const { locale }  = this.props;
    if (this.appmode !== 'default') return;

    const streamingAPIBaseURL = store.getState().getIn(['meta', 'streaming_api_base_url']);
    const accessToken = store.getState().getIn(['meta', 'access_token']);

    const setupPolling = () => {
      this.polling = setInterval(() => {
        store.dispatch(refreshHomeTimeline());
        store.dispatch(refreshNotifications());
      }, 20000);
    };

    const clearPolling = () => {
      clearInterval(this.polling);
      this.polling = undefined;
    };

    this.subscription = createStream(streamingAPIBaseURL, accessToken, 'user', {

      connected () {
        clearPolling();
        store.dispatch(connectTimeline('home'));
      },

      disconnected () {
        setupPolling();
        store.dispatch(disconnectTimeline('home'));
      },

      received (data) {
        switch(data.event) {
        case 'update':
          store.dispatch(updateTimeline('home', JSON.parse(data.payload)));
          break;
        case 'delete':
          store.dispatch(deleteFromTimelines(data.payload));
          break;
        case 'notification':
          store.dispatch(updateNotifications(JSON.parse(data.payload), messages, locale));
          break;
        }
      },

      reconnected () {
        clearPolling();
        store.dispatch(connectTimeline('home'));
        store.dispatch(refreshHomeTimeline());
        store.dispatch(refreshNotifications());
      },

    });

    // Desktop notifications
    if (typeof window.Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    store.dispatch(showOnboardingOnce());
  }

  componentWillUnmount () {
    if (typeof this.subscription !== 'undefined') {
      this.subscription.close();
      this.subscription = null;
    }

    if (typeof this.polling !== 'undefined') {
      clearInterval(this.polling);
      this.polling = null;
    }
  }

  render () {
    const { locale } = this.props;

    if (this.appmode === 'intent') {
      return (
        <IntlProvider locale={locale} messages={messages}>
          <Provider store={store}>
            <UI className='compose-form__intent' intent>
              <Compose intent />
            </UI>
          </Provider>
        </IntlProvider>
      );
    }

    if (this.appmode === 'scheduledStatuses') {
      return (
        <IntlProvider locale={locale} messages={messages}>
          <Provider store={store}>
            <BrowserRouter basename='/admin/scheduled_statuses'>
              <ScrollContext>
                <UI className='scheduled_statuses__container' intent>
                  <Route path='*' component={connect(() => ({ standalone: true }))(ScheduledStatuses)} />
                  <Compose schedule />
                </UI>
              </ScrollContext>
            </BrowserRouter>
          </Provider>
        </IntlProvider>
      );
    }

    if (this.appmode === 'about') {
      return (
        <IntlProvider locale={locale} messages={messages}>
          <Provider store={store}>
            <BrowserRouter basename='/about'>
              <ScrollContext>
                <UI intent>
                  <Route path='*' component={connect(() => ({ standalone: true }))(CommunityTimeline)} />
                </UI>
              </ScrollContext>
            </BrowserRouter>
          </Provider>
        </IntlProvider>
      );
    }

    if (this.appmode === 'default') {
      return (
        <IntlProvider locale={locale} messages={messages}>
          <Provider store={store}>
            <BrowserRouter basename='/web'>
              <ScrollContext>
                <Route path='/' component={UI} />
              </ScrollContext>
            </BrowserRouter>
          </Provider>
        </IntlProvider>
      );
    }

    return <div />;
  }

}
