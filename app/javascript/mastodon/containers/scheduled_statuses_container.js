import React from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import configureStore from '../store/configureStore';
import { hydrateStore } from '../actions/store';
import { IntlProvider, addLocaleData } from 'react-intl';
import { getLocale } from '../locales';
import ScheduledStatuses from '../features/standalone/scheduled_statuses';

const { localeData, messages } = getLocale();
addLocaleData(localeData);

const store = configureStore();
const initialStateContainer = document.getElementById('initial-state');

if (initialStateContainer !== null) {
  const initialState = JSON.parse(initialStateContainer.textContent);
  store.dispatch(hydrateStore(initialState));
}

export default class ScheduledStatusesContainer extends React.PureComponent {

  static propTypes = {
    locale: PropTypes.string.isRequired,
  };

  render () {
    const { locale } = this.props;

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <ScheduledStatuses />
        </Provider>
      </IntlProvider>
    );
  }

}
