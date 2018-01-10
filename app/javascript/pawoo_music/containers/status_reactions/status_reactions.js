import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { connect } from 'react-redux';
import EmojiPickerDropdown from '../../components/emoji_picker_dropdown';
import { unicodeMapping } from '../../../mastodon/emojione_light';
import { react, unreact } from '../../actions/reaction';
import { navigate } from '../../util/navigator';

class Emoji extends ImmutablePureComponent {

  static propTypes = {
    text: PropTypes.string.isRequired,
  }

  render () {
    return (
      <img
        className='emojione'
        alt={this.props.text}
        src={`/emoji/${unicodeMapping[this.props.text][0]}.svg`}
      />
    );
  }

}

class EmojiItem extends ImmutablePureComponent {

  static propTypes = {
    reaction: ImmutablePropTypes.map.isRequired,
  }

  handleClick = () => {
    this.props.onClick(this.props.reaction);
  }

  render () {
    const count = this.props.reaction.get('accounts_count');
    const reacted = this.props.reaction.get('reacted');
    const text = this.props.reaction.get('text');

    return (
      <li
        className={classNames({ reacted })}
        onClick={this.handleClick}
        role='button'
      ><Emoji text={text} />{count}</li>
    );
  }

}

const mapStateToProps = (state) => ({
  loggedOut: !state.getIn(['meta', 'me']),
});

const mapDispatchToProps = dispatch => ({
  onReact(status, text) {
    dispatch(react(status, text));
  },

  onUnreact(status, text) {
    dispatch(unreact(status, text));
  },
});

@connect(mapStateToProps, mapDispatchToProps)
export default class StatusReactions extends ImmutablePureComponent {

  static propTypes = {
    loggedOut: PropTypes.bool.isRequired,
    onReact: PropTypes.func.isRequired,
    onUnreact: PropTypes.func.isRequired,
    status: ImmutablePropTypes.map.isRequired,
  }

  handlePick = ({ unicode }) => {
    const text = unicode.split('-').map(code => String.fromCodePoint(parseInt(code, 16))).join('');
    this.props.onReact(this.props.status, text);
  }

  handleEmojiClick = reaction => {
    if (this.props.loggedOut) {
      navigate('/auth/sign_in');
    } else if (reaction.get('reacted')) {
      this.props.onUnreact(this.props.status, reaction.get('text'));
    } else {
      this.props.onReact(this.props.status, reaction.get('text'));
    }
  }

  render () {
    const reactions = this.props.status.getIn(['track', 'reactions']);

    if (reactions === undefined) {
      return null;
    }

    return (
      <ul className='status-reactions'>
        {reactions.map(reaction => (
          <EmojiItem
            key={reaction.get('text')}
            onClick={this.handleEmojiClick}
            reaction={reaction}
          />
        ))}
        <li className='add'>
          <EmojiPickerDropdown icon='plus' onPickEmoji={this.handlePick} />
        </li>
      </ul>
    );
  }

}
