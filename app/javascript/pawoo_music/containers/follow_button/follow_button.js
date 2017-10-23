import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { makeGetAccount } from '../../../mastodon/selectors';
import Button from '../../components/button';
import { followAccount, unfollowAccount } from '../../../mastodon/actions/accounts';

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();

  const mapStateToProps = (state, props) => {
    const { id, account } = props;

    // propsにidを渡すとフォロー関係も取ってこれる
    return {
      account: account || getAccount(state, id),
      me: state.getIn(['meta', 'me']),
    };
  };

  return mapStateToProps;
};

@connect(makeMapStateToProps)
export default class FollowButton extends ImmutablePureComponent {

  static propTypes = {
    account: ImmutablePropTypes.map.isRequired,
    me: PropTypes.number,
    onlyFollow: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
  };

  state = {
    isChange: false,
  }

  handleFollow = () => {
    const { dispatch, account } = this.props;

    if (account.getIn(['relationship', 'following'])) {
      dispatch(unfollowAccount(account.get('id')));
    } else {
      dispatch(followAccount(account.get('id')));
    }
    this.setState({ isChange: true });
  }

  render () {
    const { account, me, onlyFollow } = this.props;
    const { isChange } = this.state;

    if (!me) {
      return (
        <Button className='follow' href={`/users/${account.get('acct')}/remote_follow`}>
          <FormattedMessage id='account.remote_follow' defaultMessage='Remote follow' />
        </Button>
      );
    }

    if (me !== account.get('id') && account.get('relationship') && !account.getIn(['relationship', 'blocking'])) {
      const type = (account.getIn(['relationship', 'following'])) ? 'unfollow' : 'follow';
      const requested = account.getIn(['relationship', 'requested']);

      if (onlyFollow && !(type === 'follow' && !requested) && !isChange) {
        return null;
      }

      if (requested) {
        return (
          <Button className='follow' disabled>
            <FormattedMessage id='account.requested' defaultMessage='Awaiting approval' />
          </Button>
        );
      } else {
        const message = type === 'follow' ? (
          <FormattedMessage id='account.follow' defaultMessage='Follow' />
        ) : (
          <FormattedMessage id='account.unfollow' defaultMessage='Unfollow' />
        );

        return (
          <Button className={type} onClick={this.handleFollow}>
            {message}
          </Button>
        );
      }
    }

    return null;
  }

};
