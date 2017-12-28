import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { BrowserRouter, Route } from 'react-router-dom';
import { IntlProvider, addLocaleData } from 'react-intl';
import { ScrollContext } from 'react-router-scroll';

import { hydrateStore } from '../../mastodon/actions/store';
import store from '../../mastodon/store';
import { getLocale } from '../../mastodon/locales';
import ScheduledStatusesContainer from '../containers/scheduled_statuses';
import Compose from '../../mastodon/features/compose';
import UI from '../../mastodon/features/ui';

const { localeData, messages } = getLocale();
addLocaleData(localeData);

const initialState = JSON.parse(document.getElementById('initial-state').textContent);
store.dispatch(hydrateStore(initialState));

export default class ScheduledStatusesEntry extends React.PureComponent {

  static propTypes = {
    locale: PropTypes.string.isRequired,
  };

  static childContextTypes = {
    disableReactRouterLnik: PropTypes.bool,
  };

  getChildContext() {
    return { disableReactRouterLnik: true };
  }

  render () {
    const { locale } = this.props;

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <BrowserRouter basename='/'>
            <ScrollContext>
              <UI className='scheduled_statuses__container' intent>
                <Compose schedule />
                <Route path='/admin/scheduled_statuses' component={ScheduledStatusesContainer} />
              </UI>
            </ScrollContext>
          </BrowserRouter>
        </Provider>
      </IntlProvider>
    );
  }

}
