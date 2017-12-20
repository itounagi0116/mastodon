import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { openModalFormCompose } from '../../../mastodon/actions/compose';
import Icon from '../../components/icon';
import { navigate } from '../../util/navigator';

const mapStateToProps = (state) => ({
  isLogin: !!state.getIn(['meta', 'me']),
});

@connect(mapStateToProps)
export default class StatusPostButton extends React.PureComponent {

  static propTypes = {
    fixed: PropTypes.bool,
    isLogin: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
  };

  handleClick = () => {
    const { dispatch } = this.props;
    dispatch(openModalFormCompose());
  }

  handleRedirectLoginPage = () => {
    navigate('/auth/sign_in');
  }

  render () {
    const { fixed, isLogin } = this.props;

    return (
      <Icon
        icon='plus'
        className={classNames('status-post-button', { fixed })}
        onClick={isLogin ? this.handleClick : this.handleRedirectLoginPage}
        strong
      />
    );
  }

}
