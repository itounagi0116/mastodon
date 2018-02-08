import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { NavLink } from 'react-router-dom';

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
        <div>
          <nav>
            <ul>
              <Item isActive={this.props.isActive} onClick={this.props.onReplace} to='/albums/new'>
                <FormattedMessage
                  id='pawoo_music.album_compose.title'
                  defaultMessage='Album'
                />
              </Item>
              <Item isActive={this.props.isActive} onClick={this.props.onReplace} to='/tracks/new'>
                <FormattedMessage
                  id='pawoo_music.track_compose.title'
                  defaultMessage='Track'
                />
              </Item>
            </ul>
          </nav>
          {this.props.children}
        </div>
      </div>
    );
  }

}
