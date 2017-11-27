import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import Link from 'react-router-dom/Link';
import Icon from '../icon';
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
        id: 11,
        body: this.props.intl.formatMessage({
          id: 'pawoo_music.announcements.11',
          defaultMessage: 'Pawoo Musicで、自分のプロフィールがカスタマイズできるようになりました！',
        }),
        link: [
          {
            reactRouter: false,
            inline: true,
            href: '/settings/custom_color',
            body: this.props.intl.formatMessage({
              id: 'pawoo_music.announcements.11.link.1',
              defaultMessage: '文字・背景色を変更',
            }),
          },
          {
            reactRouter: false,
            inline: true,
            href: '/settings/profile',
            body: this.props.intl.formatMessage({
              id: 'pawoo_music.announcements.11.link.2',
              defaultMessage: '好きな背景画像を設定',
            }),
          },
        ],
      },
      {
        id: 10,
        body: this.props.intl.formatMessage({
          id: 'pawoo_music.announcements.10',
          defaultMessage: 'Pawoo Musicをリニューアル！ MVの自動生成機能などをはじめ、新しいPawoo Musicをお楽しみください！',
        }),
        link: [],
      },
      // NOTE: id: 11 まで使用した
    );

    this.announcements = Immutable.fromJS(announcements);
  }

  handleDismiss = (event) => {
    const id = +event.currentTarget.getAttribute('data-id');

    if (Number.isInteger(id)) {
      this.setState({ dismissed: [].concat(this.state.dismissed, id) });
    }
  }

  render () {
    const { intl } = this.props;

    return (
      <ul className='announcements' style={{ wordBreak: intl.locale === 'en' ? 'normal' : 'break-all' }}>
        {this.announcements.map(announcement => this.state.dismissed.indexOf(announcement.get('id')) === -1 && (
          <li className='announcement-item' key={announcement.get('id')}>
            <div className='announcement-header'>
              <span className='header-text'>{intl.formatMessage({ id: 'pawoo_music.announcements.header', defaultMessage: 'News' })}</span>
              <Icon className='dismiss-button' title={intl.formatMessage({ id: 'pawoo_music.announcements.dismiss', defaultMessage: 'Dismiss' })} icon='x-circle'data-id={announcement.get('id')} onClick={this.handleDismiss} />
            </div>
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
          </li>
        ))}
      </ul>
    );
  }

};

export default Announcements;
