import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { BrowserRouter, Route } from 'react-router-dom';
import { IntlProvider, addLocaleData } from 'react-intl';
import { ScrollContext } from 'react-router-scroll';

import { hydrateStore } from '../../mastodon/actions/store';
import store from '../../mastodon/store';
import { getLocale } from '../../mastodon/locales';
import { changeNavigate } from '../actions/navigate';
import App from '../containers/app';
import subscribeAsPlayer from '../player';

const { localeData, messages } = getLocale();
addLocaleData(localeData);

const initialState = JSON.parse(document.getElementById('initial-state').textContent);
store.dispatch(changeNavigate(url => location.href = url));
store.dispatch(hydrateStore(initialState));
subscribeAsPlayer(store);

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
