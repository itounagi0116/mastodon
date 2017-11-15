import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { Provider } from 'react-redux';
import { IntlProvider, addLocaleData } from 'react-intl';
import querystring from 'querystring';
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
    const params = location.search.length > 1 ? querystring.parse(location.search.substr(1)) : {};
    const color = (params.textcolor && params.textcolor.match(/^#[0-9a-f]{3,6}$/)) ? params.textcolor : '#000000';
    const style = {
      color,
    };

    if (!params.disable_background_color) {
      const backgroundColor = (params.background_color && params.background_color.match(/^#[0-9a-f]{3,6}$/)) ? params.background_color : '#ffffff';
      style.backgroundColor = backgroundColor;
    }

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <div className='app embed app-musicvideo'>
            <Track track={Immutable.fromJS(track).set('id', id)} fitContain />
            <div className='meta' style={style}>
              <div className='credit'><p>{track.artist}</p><a href='/' target='_blank'><Logo /></a></div>
              <h1><a href={`/@${account.acct}/${id}`} target='_blank'>{track.title}</a></h1>
            </div>
          </div>
        </Provider>
      </IntlProvider>
    );
  }

}
