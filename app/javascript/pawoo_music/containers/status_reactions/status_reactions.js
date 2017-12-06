import classNames from 'classnames';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { unicodeMapping } from '../../../mastodon/emojione_light';
import { makeGetStatus } from '../../../mastodon/selectors';
import { react, unreact } from '../../actions/reaction';
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

function logIn () {
  top.location.href = '/auth/sign_in';
}

const mapStateToProps = (state, { status, id }) => ({
  loggedOut: !state.getIn(['meta', 'me']),
  permittedTexts: state.getIn(['pawoo_music', 'reactions']),
  reactions: (status || makeGetStatus()(state, id)).get('reactions'),
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

  setReactionHandlers ({ loggedOut, onUnreact, onReact, permittedTexts, status }) {
    this.setState({
      reactionHandlers: Immutable.Map(permittedTexts.map(text => {
        if (loggedOut) {
          return [text, logIn];
        }

        for (const reaction of status.get('reactions')) {
          if (reaction.get('text') === text) {
            const handle = reaction.get('reacted') ? onUnreact : onReact;

            return [text, handle.bind(undefined, status, text)];
          }
        }

        return [text, onReact.bind(undefined, status, text)];
      })),
    });
  }

  componentWillMount () {
    this.setReactionHandlers(this.props);
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.loggedOut !== this.props.loggedOut ||
        nextProps.onUnreact !== this.props.onReact ||
        nextProps.permittedTexts !== this.props.permittedTexts ||
        !nextProps.reactions.is(this.props.reactions)) {
      this.setReactionHandlers(nextProps);
    }
  }

  render () {
    const dropdownTexts = this.props.permittedTexts.toArray().filter(
      text => this.props.reactions.every(
        reaction => reaction.get('text') !== text));

    return (
      <ul className='status-reactions'>
        {this.props.reactions.map(reaction => {
          const count = reaction.get('accounts_count');
          const reacted = reaction.get('reacted');
          const text = reaction.get('text');

          return (
            <li
              className={classNames({ reacted })}
              onClick={this.state.reactionHandlers.get(text)}
              key={text}
            ><Emoji text={text} />{count}</li>
          );
        })}
        {dropdownTexts.length > 0 && (
          <li className='add'>
            <DropdownMenuContainer
              icon='plus'
              items={dropdownTexts.map(text => ({
                action: this.state.reactionHandlers.get(text),
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
