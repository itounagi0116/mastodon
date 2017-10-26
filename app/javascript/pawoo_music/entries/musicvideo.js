import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { Provider } from 'react-redux';
import { IntlProvider, addLocaleData } from 'react-intl';
import configureStore from '../../mastodon/store/configureStore';
import { getLocale } from '../../mastodon/locales';
import Track from '../containers/track';

import '../containers/app/app.scss';

const { localeData, messages } = getLocale();
addLocaleData(localeData);

const store = configureStore();

export default class MusicvideoEntry extends React.PureComponent {

  static propTypes = {
    statusId: PropTypes.number.isRequired,
    track: PropTypes.object.isRequired,
    locale: PropTypes.string.isRequired,
  }

  render () {
    const { locale, track, statusId } = this.props;

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <div className='app'>
            <Track track={Immutable.fromJS(track).set('id', statusId)} fitContain />
          </div>
        </Provider>
      </IntlProvider>

    );
  }

}
