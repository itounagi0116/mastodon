import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { Provider } from 'react-redux';
import { IntlProvider, addLocaleData } from 'react-intl';
import configureStore from '../../../mastodon/store/configureStore';
import { getLocale } from '../../../mastodon/locales';
import Logo from '../../components/logo';
import Track from '../../containers/track';

import '../../containers/app/app.scss';

const { localeData, messages } = getLocale();
addLocaleData(localeData);

const store = configureStore();

export default class MusicvideoEntry extends React.PureComponent {

  static propTypes = {
    status: PropTypes.object.isRequired,
    locale: PropTypes.string.isRequired,
  }

  render () {
    const { locale, status: { id, account, track } } = this.props;

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <div className='app embed app-musicvideo'>
            <Track track={Immutable.fromJS(track).set('id', id)} fitContain />
            <div className='meta'>
              <div className='credit'><p>{track.artist}</p><a href='/' target='_blank'><Logo /></a></div>
              <h1><a href={`/@${account.acct}/${id}`} target='_blank'>{track.title}</a></h1>
            </div>
          </div>
        </Provider>
      </IntlProvider>

    );
  }

}
