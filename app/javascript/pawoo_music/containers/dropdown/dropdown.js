import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Icon from '../../components/icon';
import { isMobile } from '../../util/is_mobile';
import { navigate } from '../../util/navigator';
import { openModal, closeModal } from '../../../mastodon/actions/modal';

const mobile = isMobile();

class DropdownContent extends React.PureComponent {

  static propTypes = {
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node,
  };

  componentDidMount () {
    document.addEventListener('click', this.handleDocumentClick, false);
    document.addEventListener('touchend', this.handleDocumentClick, { passive: true });
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleDocumentClick, false);
    document.removeEventListener('touchend', this.handleDocumentClick, { passive: true });
  }

  setRef = (c) => {
    this.node = c;
  }

  handleDocumentClick = e => {
    if (this.node && !this.node.contains(e.target)) {
      this.props.onClose();
    }
  }

  render () {
    const { children } = this.props;

    return (
      <div className='dropdown-content' ref={this.setRef}>
        {children}
      </div>
    );
  }

}

const mapStateToProps = (state) => ({
  isLogin: !!state.getIn(['meta', 'me']),
});

@connect(mapStateToProps, null, null, { withRef: true })
export default class Dropdown extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node,
    strong: PropTypes.bool,
    scale: PropTypes.bool,
    icon: PropTypes.string.isRequired,
    title: PropTypes.string,
    isLogin: PropTypes.bool,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    dispatch: PropTypes.func.isRequired,
  };

  state = {
    expanded: false,
  };

  componentWillUpdate (props, { expanded }) {
    if (expanded !== this.state.expanded) {
      if (expanded) {
        if (this.props.onOpen) {
          this.props.onOpen();
        }
      } else {
        if (this.props.onClose) {
          this.props.onClose();
        }
      }
    }
  }

  handleClose = () => {
    const { dispatch } = this.props;

    if (mobile) {
      dispatch(closeModal());
    }

    this.hide();
  }

  handleClick = () => {
    if (mobile && !this.state.expanded) {
      const { children, dispatch } = this.props;

      dispatch(openModal('UNIVERSAL', { children }));

      return;
    }

    this.setState({ expanded: !this.state.expanded });
  }

  handleRedirectLoginPage = () => {
    navigate('/auth/sign_in');
  }

  hide () {
    this.setState({ expanded: false });
  }

  render () {
    const { children, strong, scale, icon, title, isLogin } = this.props;
    const { expanded } = this.state;

    return (
      <div className={classNames('dropdown', { active: expanded })}>
        <Icon className='dropdown-trigger' icon={icon} title={title} onClick={isLogin ? this.handleClick : this.handleRedirectLoginPage} strong={strong} scale={scale} />
        {!mobile && expanded && (
          <DropdownContent onClose={this.handleClose}>
            {expanded && children}
          </DropdownContent>
        )}
      </div>
    );
  }

}
