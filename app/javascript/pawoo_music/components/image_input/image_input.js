import PropTypes from 'prop-types';
import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import ImmutablePureComponent from 'react-immutable-pure-component';
import FileInput from '../file_input';
import { validateIsFileImage } from '../../util/musicvideo';

const messages = defineMessages({
  placeholder: { id: 'pawoo_music.image_input.placeholder', defaultMessage: 'Select image file' },
});

@injectIntl
export default class ImageInput extends ImmutablePureComponent {

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    title: PropTypes.string,
  };

  handleChange = ({ target }) => {
    const file = target.files[0];
    if (file) {
      validateIsFileImage(file).then(
        (isImage) => isImage && this.props.onChange(file));
    }
  }

  render () {
    return (
      <FileInput
        icon='image'
        title={this.props.title ? this.props.title : this.props.intl.formatMessage(messages.placeholder)}
        accept='image/jpeg,image/png'
        onChange={this.handleChange}
        settled={!!this.props.title}
      />
    );
  }

}
