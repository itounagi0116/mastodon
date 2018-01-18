import PropTypes from 'prop-types';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { isMobile } from '../../util/is_mobile';

class Item extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node,
    isActive: PropTypes.func,
    onClick: PropTypes.func,
    to: PropTypes.string,
  }

  handleClick = event => {
    this.props.onClick(event, this.props.to);
  }

  handleIsActive = (match, location) => {
    return this.props.isActive(match, location, this.props.to);
  }

  render () {
    const { children, isActive, onClick, to } = this.props;

    return (
      <li>
        <NavLink
          isActive={isActive && this.handleIsActive}
          onClick={onClick && this.handleClick}
          replace
          to={to}
        >
          {children}
        </NavLink>
      </li>
    );
  }

}

export default class MusicCompose extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node,
    isActive: PropTypes.func,
    onReplace: PropTypes.func,
  }

  render () {
    return (
      <div className='music-compose'>
        <div className={isMobile() ? 'mobile' : null}>
          <nav>
            <ul>
              <Item isActive={this.props.isActive} onClick={this.props.onReplace} to='/albums/new'>Album</Item>
              <Item isActive={this.props.isActive} onClick={this.props.onReplace} to='/tracks/new'>Track</Item>
            </ul>
          </nav>
          {this.props.children}
        </div>
      </div>
    );
  }

}
