import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { makeGetAccount } from '../../../mastodon/selectors';
import Button from '../../components/button';
import { followAccount, unfollowAccount } from '../../../mastodon/actions/accounts';
import { navigate } from '../../util/navigator';

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
    dummy: PropTypes.string,
    me: PropTypes.number,
    onlyFollow: PropTypes.bool,
    embed: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
  };

  state = {
    isChange: false,
    embed: false,
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

  handleLogin = () => {
    navigate('/auth/sign_in');
  }

  renderFollowMessage () {
    const { embed } = this.props;

    return embed ? (
      <FormattedMessage id='account.follow_for_embed' defaultMessage='Notify New Release' />
    ) : (
      <FormattedMessage id='account.follow' defaultMessage='Follow' />
    );
  }

  renderUnfollowMessage () {
    const { embed } = this.props;

    return embed ? (
      <FormattedMessage id='account.unfollow_for_embed' defaultMessage='Stop notifying new releases' />
    ) : (
      <FormattedMessage id='account.unfollow' defaultMessage='Unfollow' />
    );
  }

  renderMessage (type) {
    return type === 'follow' ? this.renderFollowMessage() : this.renderUnfollowMessage();
  }

  render () {
    const { account, me, dummy, onlyFollow } = this.props;
    const { isChange } = this.state;

    if (dummy) {
      return (
        <Button className={dummy}>
          {this.renderMessage(dummy)}
        </Button>
      );
    }

    if (!me) {
      return (
        <Button className='follow' onClick={this.handleLogin}>
          {this.renderFollowMessage()}
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
        return (
          <Button className={type} onClick={this.handleFollow}>
            {this.renderMessage(type)}
          </Button>
        );
      }
    }

    return null;
  }

};
