import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Icon from '../../components/icon';
import Link from '../../components/link_wrapper';
import { isMobile } from '../../util/is_mobile';
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
  navigate: state.getIn(['pawoo_music', 'navigate']),
});

@connect(mapStateToProps)
export default class DropdownMenu extends React.PureComponent {

  static propTypes = {
    strong: PropTypes.bool,
    scale: PropTypes.bool,
    icon: PropTypes.string.isRequired,
    items: PropTypes.array.isRequired,
    title: PropTypes.string,
    isLogin: PropTypes.bool,
    navigate: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  state = {
    expanded: false,
  };

  handleClose = () => {
    const { dispatch } = this.props;

    if (mobile) {
      dispatch(closeModal());
    }

    this.setState({ expanded: false });
  }

  handleClick = () => {
    if (mobile && !this.state.expanded) {
      const { dispatch } = this.props;

      const children = (
        <div className='modal-menu'>
          {this.renderMenuItems()}
        </div>
      );

      dispatch(openModal('UNIVERSAL', { children }));

      return;
    }

    this.setState({ expanded: !this.state.expanded });
  }

  handleItemClick = (e) => {
    const i = Number(e.currentTarget.getAttribute('data-index'));
    const { action } = this.props.items[i];

    this.handleClose();

    // Don't call e.preventDefault() when the item uses 'href' property.
    // ex. "Edit profile" on the account action bar

    if (typeof action === 'function') {
      e.preventDefault();
      action();
    }
  }

  handleRedirectLoginPage = () => {
    this.props.navigate('/auth/sign_in');
  }

  renderItem = (item, i) => {
    if (item === null) {
      return <li key={`sep-${i}`} className='dropdown-sep' />;
    }

    const { text, to, href, ...other } = item;

    return (
      <li className='menu-item' key={`${text}-${i}`}>
        {to ? (
          <Link to={to} onClick={this.handleItemClick} data-index={i} {...other}>{text}</Link>
        ) : (
          <a href={href} target='_blank' rel='noopener' onClick={this.handleItemClick} data-index={i} {...other}>{text}</a>
        )}
      </li>
    );
  }

  renderMenuItems = () => {
    const { items } = this.props;

    return (
      <ul className='menu-items'>
        {items.map(this.renderItem)}
      </ul>
    );
  }

  render () {
    const { strong, scale, icon, title, isLogin } = this.props;
    const { expanded } = this.state;

    return (
      <div className={classNames('dropdown-menu', { active: expanded })}>
        <Icon className='dropdown-trigger' icon={icon} title={title} onClick={isLogin ? this.handleClick : this.handleRedirectLoginPage} strong={strong} scale={scale} />
        {!mobile && expanded && (
          <DropdownContent onClose={this.handleClose}>
            {expanded && this.renderMenuItems()}
          </DropdownContent>
        )}
      </div>
    );
  }

}
