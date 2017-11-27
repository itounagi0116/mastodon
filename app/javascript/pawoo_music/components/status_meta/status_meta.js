import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { FormattedNumber } from 'react-intl';
import Timestamp from '../../../mastodon/components/timestamp';
import Icon from '../icon';
import Link from '../link_wrapper';

export default class StatusMeta extends ImmutablePureComponent {

  static propTypes = {
    status: ImmutablePropTypes.map.isRequired,
  };

  render () {
    const { status } = this.props;
    let applicationLink = null;

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

    const timestamp = <Timestamp absolute timestamp={status.get('created_at')} />;

    return (
      <div className='status-meta'>
        {(status.getIn(['account', 'acct']).indexOf('@') === -1) ? (
          <Link className='absolute-time' to={`/@${status.getIn(['account', 'acct'])}/${status.get('id')}`}>
            {timestamp}
          </Link>
        ) : (
          <a className='absolute-time' href={status.get('url')} target='_blank' rel='noopener'>
            {timestamp}
          </a>
        )}
        {applicationLink}
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
