import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import Immutable from 'immutable';
import { BrowserRouter, Route } from 'react-router-dom';
import { IntlProvider, addLocaleData } from 'react-intl';
import { ScrollContext } from 'react-router-scroll';

import { hydrateStore } from '../../mastodon/actions/store';
import store from '../../mastodon/store';
import { getLocale } from '../../mastodon/locales';
import Upload from '../components/upload';
import { setTrackComposeData } from '../actions/track_compose';

const { localeData, messages } = getLocale();
addLocaleData(localeData);

const initialState = JSON.parse(document.getElementById('initial-state').textContent);
store.dispatch(hydrateStore(initialState));

const editNode = document.getElementById('pawoo-music-edit-track');
if (editNode) {
  const editProps = JSON.parse(editNode.getAttribute('data-props'));
  const track = Immutable.fromJS(editProps.track);
  store.dispatch(setTrackComposeData(track.set('id', editProps.id)));
}

export default class UploadEntry extends React.PureComponent {

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
              <Route path='/' component={Upload} />
            </ScrollContext>
          </BrowserRouter>
        </Provider>
      </IntlProvider>
    );
  }

}
