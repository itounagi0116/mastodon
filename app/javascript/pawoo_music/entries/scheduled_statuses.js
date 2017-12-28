import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider, addLocaleData } from 'react-intl';
import { ScrollContext } from 'react-router-scroll';

import { hydrateStore } from '../../mastodon/actions/store';
import store from '../../mastodon/store';
import { getLocale } from '../../mastodon/locales';
import ScheduledStatusesForm from '../components/scheduled_statuses_form';

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
          <BrowserRouter>
            <ScrollContext>
              <ScheduledStatusesForm />
            </ScrollContext>
          </BrowserRouter>
        </Provider>
      </IntlProvider>
    );
  }

}
