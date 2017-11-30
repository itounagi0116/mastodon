import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { IntlProvider, addLocaleData } from 'react-intl';
import store from '../../mastodon/store';
import { fetchStatusSuccess } from '../../mastodon/actions/statuses';
import { getLocale } from '../../mastodon/locales';
import EmbedMusicvideo from '../containers/embed_musicvideo';
import subscribeAsPlayer from '../player';


const { localeData, messages } = getLocale();
addLocaleData(localeData);

subscribeAsPlayer(store);

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
          <EmbedMusicvideo statusId={status.id} />
        </Provider>
      </IntlProvider>
    );
  }

}
