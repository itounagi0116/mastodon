import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import Dropdown from '../../containers/dropdown';

const messages = defineMessages({
  emoji: { id: 'emoji_button.label', defaultMessage: 'Insert emoji' },
  emoji_search: { id: 'emoji_button.search', defaultMessage: 'Search...' },
  people: { id: 'emoji_button.people', defaultMessage: 'People' },
  nature: { id: 'emoji_button.nature', defaultMessage: 'Nature' },
  food: { id: 'emoji_button.food', defaultMessage: 'Food & Drink' },
  activity: { id: 'emoji_button.activity', defaultMessage: 'Activity' },
  travel: { id: 'emoji_button.travel', defaultMessage: 'Travel & Places' },
  objects: { id: 'emoji_button.objects', defaultMessage: 'Objects' },
  symbols: { id: 'emoji_button.symbols', defaultMessage: 'Symbols' },
  flags: { id: 'emoji_button.flags', defaultMessage: 'Flags' },
});

const settings = {
  imageType: 'png',
  sprites: false,
  imagePathPNG: '/emoji/',
};

@injectIntl
export default class EmojiPickerDropdown extends React.PureComponent {

  static propTypes = {
    icon: PropTypes.string,
    intl: PropTypes.object.isRequired,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onPickEmoji: PropTypes.func.isRequired,
  };

  state = {
    EmojiPicker: null,
  };

  setRef = (c) => {
    if (c !== null) {
      this.dropdown = c.getWrappedInstance();
    }
  }

  componentWillMount () {
    import('emojione-picker').then(module => this.setState({ EmojiPicker: module.default }));
  }

  handleChange = (data) => {
    this.dropdown.hide();
    this.props.onPickEmoji(data);
  }

  render () {
    const { icon, intl, onOpen, onClose } = this.props;

    const categories = {
      people: {
        title: intl.formatMessage(messages.people),
        emoji: 'smile',
      },
      nature: {
        title: intl.formatMessage(messages.nature),
        emoji: 'hamster',
      },
      food: {
        title: intl.formatMessage(messages.food),
        emoji: 'pizza',
      },
      activity: {
        title: intl.formatMessage(messages.activity),
        emoji: 'soccer',
      },
      travel: {
        title: intl.formatMessage(messages.travel),
        emoji: 'earth_americas',
      },
      objects: {
        title: intl.formatMessage(messages.objects),
        emoji: 'bulb',
      },
      symbols: {
        title: intl.formatMessage(messages.symbols),
        emoji: 'clock9',
      },
      flags: {
        title: intl.formatMessage(messages.flags),
        emoji: 'flag_gb',
      },
    };

    const { EmojiPicker } = this.state;

    return (
      <div className='emoji-picker-dropdown'>
        <Dropdown icon={icon} onOpen={onOpen} onClose={onClose} ref={this.setRef} title={intl.formatMessage(messages.emoji)}>
          {EmojiPicker &&
            (<EmojiPicker emojione={settings} onChange={this.handleChange} searchPlaceholder={intl.formatMessage(messages.emoji_search)} categories={categories} search />)
          }
        </Dropdown>
      </div>
    );
  }

}
