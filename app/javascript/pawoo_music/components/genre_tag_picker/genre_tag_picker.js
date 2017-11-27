import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import Icon from '../../components/icon';

const genreList = ['electronic', 'pop', 'rock', 'alternative', 'ambient', 'acoustic', 'world', 'hiphop', 'reggae', 'folk', 'jazz', 'funk', 'punk', 'metal', 'soundtrack'];
const messages = defineMessages({
  select_genre: { id: 'pawoo_music.track_compose.select_genre', defaultMessage: 'Select genre tag' },
});

@injectIntl
export default class GenreTagPicker extends React.PureComponent {

  static propTypes = {
    onSelectGenre: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  }

  handleClickGenre = (e) => {
    const index = e.currentTarget.getAttribute('data-index');
    const genre = genreList[index];

    this.props.onSelectGenre(genre);
  }

  render () {
    const { intl } = this.props;

    return (
      <div className='genre-tag-picker'>
        <Icon icon='plus-circle' strong title={intl.formatMessage(messages.select_genre)} />
        <div className='genre-list'>
          {genreList.map((genre, i) => (
            <div key={genre} data-index={i} className='genre-item' onClick={this.handleClickGenre} role='button' tabIndex={0} aria-pressed='false'>
              {genre}
            </div>
          ))}
        </div>
      </div>
    );
  }

};
