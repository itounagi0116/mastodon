import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { BrowserRouter, Route } from 'react-router-dom';
import { IntlProvider, addLocaleData } from 'react-intl';
import { ScrollContext } from 'react-router-scroll';

import { hydrateStore } from '../../mastodon/actions/store';
import configureStore from '../../mastodon/store/configureStore';
import { getLocale } from '../../mastodon/locales';
import App from '../containers/app';

const { localeData, messages } = getLocale();
addLocaleData(localeData);

export const store = configureStore();
const initialState = JSON.parse(document.getElementById('initial-state').textContent);
store.dispatch(hydrateStore(initialState));

export default class TimelineEntry extends React.PureComponent {

  static propTypes = {
    locale: PropTypes.string.isRequired,
  };

  render () {
    const { locale } = this.props;

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <BrowserRouter basename='/'>
            <ScrollContext>
              <Route path='/' component={App} />
            </ScrollContext>
          </BrowserRouter>
        </Provider>
      </IntlProvider>
    );
  }

}
