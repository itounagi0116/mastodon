import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Link from '../link_wrapper';
import Dropdown from '../../containers/dropdown';

export default class DropdownMenu extends ImmutablePureComponent {

  static propTypes = {
    items: PropTypes.array.isRequired,
  };

  handleItemClick = (e) => {
    const i = Number(e.currentTarget.getAttribute('data-index'));
    const { action } = this.props.items[i];

    this.dropdown.hide();

    // Don't call e.preventDefault() when the item uses 'href' property.
    // ex. "Edit profile" on the account action bar

    if (typeof action === 'function') {
      e.preventDefault();
      action();
    }
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

  setRef = dropdown => {
    if (dropdown !== null) {
      this.dropdown = dropdown.getWrappedInstance();
    }
  }

  render () {
    const { items, ...props } = this.props;

    return (
      <Dropdown ref={this.setRef} {...props}>
        <ul className='dropdown-menu'>
          {items.map(this.renderItem)}
        </ul>
      </Dropdown>
    );
  }

}
