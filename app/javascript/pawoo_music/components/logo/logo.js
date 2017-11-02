import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import logo from '../../../images/pawoo_music/pawoo_music.svg';

const messages = defineMessages({
  logo: {
    id: 'pawoo_music.logo',
    defaultMessage: 'Logo',
  },
});

@injectIntl
class Logo extends React.PureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
  }

  render () {
    const { intl, ...props } = this.props;

    return <img alt={intl.formatMessage(messages.logo)} src={logo} {...props} />;
  }

}

export default Logo;
