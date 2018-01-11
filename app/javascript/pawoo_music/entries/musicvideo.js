import React from 'react';
import PropTypes from 'prop-types';
import querystring from 'querystring';
import { Provider } from 'react-redux';
import { IntlProvider, addLocaleData } from 'react-intl';
import store from '../../mastodon/store';
import { fetchStatusSuccess } from '../../mastodon/actions/statuses';
import { hydrateStore } from '../../mastodon/actions/store';
import { getLocale } from '../../mastodon/locales';
import EmbedMusicvideo from '../containers/embed_musicvideo';
import subscribeAsPlayer from '../player';
import { setNavigate } from '../util/navigator';

const { localeData, messages } = getLocale();
addLocaleData(localeData);

const params = location.search.length > 1 ? querystring.parse(location.search.substr(1)) : {};
const hideInfo = params.hideinfo && Number(params.hideinfo) === 1;

const initialState = JSON.parse(document.getElementById('initial-state').textContent);
store.dispatch(hydrateStore(initialState));
subscribeAsPlayer(store);

setNavigate(open);

export default class MusicvideoEntry extends React.PureComponent {

  static propTypes = {
    status: PropTypes.object.isRequired,
    locale: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    store.dispatch(fetchStatusSuccess(props.status, true));
  }

  render () {
    const { locale, status } = this.props;

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <EmbedMusicvideo infoHidden={hideInfo} statusId={status.id} />
        </Provider>
      </IntlProvider>
    );
  }

}
