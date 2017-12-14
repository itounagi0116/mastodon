import classNames from 'classnames';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { unicodeMapping } from '../../../mastodon/emojione_light';
import { react, unreact } from '../../actions/reaction';
import { navigate } from '../../util/navigator';
import DropdownMenuContainer from '../dropdown_menu';

const messages = defineMessages({
  add: { id: 'pawoo_music.add_reaction', defaultMessage: 'Add reaction' },
});

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

const mapStateToProps = (state) => ({
  loggedOut: !state.getIn(['meta', 'me']),
  permittedTexts: state.getIn(['pawoo_music', 'reactions']),
});

const mapDispatchToProps = dispatch => ({
  onReact(status, text) {
    dispatch(react(status, text));
  },

  onUnreact(status, text) {
    dispatch(unreact(status, text));
  },
});

@injectIntl
@connect(mapStateToProps, mapDispatchToProps)
export default class StatusReactions extends ImmutablePureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    loggedOut: PropTypes.bool.isRequired,
    onReact: PropTypes.func.isRequired,
    onUnreact: PropTypes.func.isRequired,
    permittedTexts: ImmutablePropTypes.list.isRequired,
    status: ImmutablePropTypes.map.isRequired,
  }

  reactionHandlers = Immutable.Map(this.props.permittedTexts.map(
    text => [text, this.handleReaction.bind(this, text)]));

  handleReaction (text) {
    if (this.props.loggedOut) {
      return navigate('/auth/sign_in');
    }

    for (const reaction of this.props.status.getIn(['track', 'reactions'])) {
      if (reaction.get('text') === text) {
        const handle = reaction.get('reacted') ?
          this.props.onUnreact : this.props.onReact;

        return handle(this.props.status, text);
      }
    }

    return this.props.onReact(this.props.status, text);
  }

  render () {
    const reactions = this.props.status.getIn(['track', 'reactions']);

    if (reactions === undefined) {
      return null;
    }

    const dropdownTexts = this.props.permittedTexts.toArray().filter(
      text => reactions.every(reaction => reaction.get('text') !== text));

    return (
      <ul className='status-reactions'>
        {reactions.map(reaction => {
          const count = reaction.get('accounts_count');
          const reacted = reaction.get('reacted');
          const text = reaction.get('text');

          return (
            <li
              className={classNames({ reacted })}
              onClick={this.reactionHandlers.get(text)}
              key={text}
            ><Emoji text={text} />{count}</li>
          );
        })}
        {dropdownTexts.length > 0 && (
          <li className='add'>
            <DropdownMenuContainer
              icon='plus'
              items={dropdownTexts.map(text => ({
                action: this.reactionHandlers.get(text),
                text: <Emoji text={text} />,
              }))}
              title={this.props.intl.formatMessage(messages.add)}
            />
          </li>
        )}
      </ul>
    );
  }

}
