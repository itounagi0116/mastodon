import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import ContainedAlbumsModalContentContainer from '../contained_albums_modal_content';
import { openModal } from '../../../mastodon/actions/modal';
import Timestamp from '../../../mastodon/components/timestamp';
import Icon from '../../components/icon';
import Link from '../../components/link_wrapper';

@connect()
export default class StatusMeta extends ImmutablePureComponent {

  static propTypes = {
    albumHidden: PropTypes.bool,
    onClick: PropTypes.func,
    status: ImmutablePropTypes.map.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  handleClickAlbums = () => {
    const { status, dispatch } = this.props;
    const id = status.getIn(['track', 'id']);

    if (id) {
      dispatch(openModal('UNIVERSAL', { children: <ContainedAlbumsModalContentContainer id={id} /> }));
    }
  }

  render () {
    const { albumHidden, onClick, status } = this.props;
    let applicationLink = null;
    let albumsLink = null;

    if (status.get('application')) {
      const website = status.getIn(['application', 'website']);
      const name = status.getIn(['application', 'name']);

      applicationLink = (
        <span>
          {' \u00A0 '}
          {website ? (
            <a className='application' href={website} target='_blank' rel='noopener'>
              {name}
            </a>
          ) : (
            name
          )}
        </span>
      );
    }

    if (!albumHidden && status.has('track')) {
      const count = status.getIn(['track', 'albums_count']);
      const disabled = count <= 0;

      albumsLink = (
        <div
          className={disabled ? null : 'albums'}
          role='button'
          tabIndex='0'
          aria-disabled={disabled}
          aria-pressed='false'
          onClick={disabled ? null : this.handleClickAlbums}
        >
          <FormattedMessage
            id='pawoo_music.status_meta.albums'
            values={{ number: <FormattedNumber value={count} /> }}
          />
        </div>
      );
    }

    const timestamp = <Timestamp absolute timestamp={status.get('created_at')} />;

    return (
      <div className='status-meta'>
        {(status.getIn(['account', 'acct']).indexOf('@') === -1) ? (
          <Link className='absolute-time' onClick={onClick} to={`/@${status.getIn(['account', 'acct'])}/${status.get('id')}`}>
            {timestamp}
          </Link>
        ) : (
          <a className='absolute-time' href={status.get('url')} onClick={onClick} target='_blank' rel='noopener'>
            {timestamp}
          </a>
        )}
        {applicationLink}
        {' \u00A0 '}
        {albumsLink}
        {' \u00A0 '}
        <span className='engagement'>
          <Icon icon='repeat' strong />
          <FormattedNumber value={status.get('reblogs_count')} />
        </span>
        {' \u00A0 '}
        <span className='engagement'>
          <Icon icon='heart' strong />
          <FormattedNumber value={status.get('favourites_count')} />
        </span>
      </div>
    );
  }

}
