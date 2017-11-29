import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Link from '../../components/link_wrapper';
import Avatar from '../../components/avatar';
import DisplayName from '../../components/display_name';
import { makeGetAccount } from '../../../mastodon/selectors';
import Icon from '../../components/icon';

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();

  const mapStateToProps = (state, props) => {
    const { id, account } = props;

    return {
      account: account || getAccount(state, id),
      autoPlayGif: state.getIn(['meta', 'auto_play_gif']),
    };
  };

  return mapStateToProps;
};

@connect(makeMapStateToProps)
export default class Account extends ImmutablePureComponent {

  static propTypes = {
    account: ImmutablePropTypes.map,
    autoPlayGif: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
  };

  render () {
    const { account, autoPlayGif } = this.props;

    if (!account) {
      return null;
    }

    const lockedIcon = account.get('locked') && <Icon icon='lock' />;

    return (
      <div className='account'>
        <Avatar className='thumb' account={account} autoPlayGif={autoPlayGif} />
        <Link className='account-link' to={`/@${account.get('acct')}`}>
          <DisplayName account={account} />
          <span className='acct'>@{account.get('acct')} {lockedIcon}</span>
        </Link>
      </div>
    );
  }

}
