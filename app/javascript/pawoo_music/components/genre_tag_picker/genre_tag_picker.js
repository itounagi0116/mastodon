import Immutable from 'immutable';
import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import Icon from '../../components/icon';
import events from '../../events';

const genreLists = Immutable.fromJS([
  [
    'electronic', 'pop', 'rock', 'alternative',
    'ambient', 'acoustic', 'world', 'hiphop',
    'reggae', 'folk', 'jazz', 'funk',
    'punk', 'metal', 'soundtrack',
  ],
  events.map(event => event.get('hashtag')),
]);

const messages = defineMessages({
  select_genre: { id: 'pawoo_music.music_compose.select_genre', defaultMessage: 'Select genre tag' },
});

@injectIntl
export default class GenreTagPicker extends React.PureComponent {

  static propTypes = {
    onSelectGenre: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  }

  handleClickGenre = (e) => {
    this.props.onSelectGenre(e.currentTarget.getAttribute('data-genre'));
  }

  render () {
    const { intl } = this.props;

    return (
      <div className='genre-tag-picker'>
        <Icon icon='plus-circle' strong title={intl.formatMessage(messages.select_genre)} />
        <div>
          {genreLists.map((list, listKey) => (
            <div className='genre-list' key={listKey}>
              {list.map(genre => (
                <div
                  key={genre}
                  data-genre={genre}
                  className='genre-item'
                  onClick={this.handleClickGenre}
                  role='button'
                  tabIndex={0}
                  aria-pressed='false'
                >
                  {genre}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

};
