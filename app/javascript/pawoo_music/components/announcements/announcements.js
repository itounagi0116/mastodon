import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import Link from 'react-router-dom/Link';
import IconButton from '../icon_button';
import { injectIntl } from 'react-intl';

const storageKey = 'announcements_dismissed';

@injectIntl
class Announcements extends React.PureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
  };

  componentDidUpdate (prevProps, prevState) {
    if (prevState.dismissed !== this.state.dismissed) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(this.state.dismissed));
      } catch (e) {}
    }
  }

  componentWillMount () {
    try {
      const dismissed = JSON.parse(localStorage.getItem(storageKey));
      this.state = { dismissed: Array.isArray(dismissed) ? dismissed : [] };
    } catch (e) {
      this.state = { dismissed: [] };
    }

    const announcements = [];

    announcements.push(
      {
        id: 10,
        icon: '/announcements/icon_2x_360.png',
        body: this.props.intl.formatMessage({
          id: 'pawoo_music.announcements.10',
          defaultMessage: 'Pawoo Musicをリニューアル！ MVの自動生成機能などをはじめ、新しいPawoo Musicをお楽しみください！',
        }),
        link: [],
      },
      // NOTE: id: 10 まで使用した
    );

    this.announcements = Immutable.fromJS(announcements);
  }

  handleDismiss = (event) => {
    const id = +event.currentTarget.getAttribute('title');

    if (Number.isInteger(id)) {
      this.setState({ dismissed: [].concat(this.state.dismissed, id) });
    }
  }

  render () {
    return (
      <ul className='announcements' style={{ wordBreak: this.props.intl.locale === 'en' ? 'normal' : 'wrap-all' }}>
        {this.announcements.map(announcement => this.state.dismissed.indexOf(announcement.get('id')) === -1 && (
          <li key={announcement.get('id')}>
            <div className='announcements__body'>
              <p>{announcement.get('body')}</p>
              <p>
                {announcement.get('link').map((link) => {
                  const classNames = ['announcements__link'];
                  const action = link.get('action');

                  if (link.get('inline')) {
                    classNames.push('announcements__link-inline');
                  }

                  if (link.get('reactRouter')) {
                    return (
                      <Link key={link.get('href')} className={classNames.join(' ')} to={link.get('href')} onClick={action ? action : null}>
                        {link.get('body')}
                      </Link>
                    );
                  } else {
                    return (
                      <a className={classNames.join(' ')} key={link.get('href')} href={link.get('href')} target='_blank' onClick={action ? action : null}>
                        {link.get('body')}
                      </a>
                    );
                  }
                })}
              </p>
            </div>
            <div className='announcements__body__dismiss'>
              <IconButton title={`${announcement.get('id')}`} src='x-circle' role='button' tabIndex='0' aria-pressed='false' onClick={this.handleDismiss} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

};

export default Announcements;
