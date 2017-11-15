import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { FormattedMessage } from 'react-intl';
import axios from 'axios';
import { SketchPicker } from 'react-color';
import ColorTrigger from '../../components/color_trigger';
import Delay from '../../components/delay';
import Checkbox from '../../components/checkbox';

export default class EmbedModalContent extends ImmutablePureComponent {

  static propTypes = {
    url: PropTypes.string.isRequired,
  }

  state = {
    loading: false,
    oembed: null,
    visibleColorPicker: null,
    textcolor: '#000000',
    backgroundcolor: '#ffffff',
    transparentBackgroundcolor: false,
  };

  componentDidMount () {
    document.addEventListener('click', this.handleColorPickerHide, false);
    this.loadIframe();
  }

  componentDidUpdate (prevProps, prevState) {
    const { textcolor, backgroundcolor, transparentBackgroundcolor } = this.state;

    if (prevState.textcolor !== textcolor || prevState.backgroundcolor !== backgroundcolor || prevState.transparentBackgroundcolor !== transparentBackgroundcolor) {
      this.loadIframe();
    }
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleColorPickerHide, false);
  }

  loadIframe () {
    const { url } = this.props;
    const { textcolor, backgroundcolor, transparentBackgroundcolor } = this.state;

    this.setState({ loading: true });

    const params = {
      url,
      textcolor,
      backgroundcolor: transparentBackgroundcolor ? 'transparent' : backgroundcolor,
    };

    axios.post('/api/web/embed', params).then(res => {
      this.setState({ loading: false, oembed: res.data });

      const iframeDocument = this.iframe.contentWindow.document;

      iframeDocument.open();
      iframeDocument.write(res.data.html);
      iframeDocument.close();

      iframeDocument.body.style.margin = 0;
      this.iframe.width  = iframeDocument.body.scrollWidth;
      this.iframe.height = iframeDocument.body.scrollHeight;
    });
  }

  setIframeRef = c =>  {
    this.iframe = c;
  }

  handleColorPickerHide = (event) => {
    let node = event.target;
    let inside = false;
    while (node && node.tagName !== 'BODY') {
      if (node.classList.contains('color-trigger') || node.classList.contains('sketch-picker') ) {
        inside = true;
        break;
      }
      node = node.parentNode;
    }
    if (!inside) {
      this.setState({ visibleColorPicker: null });
    }
  };

  handleTextareaClick = (e) => {
    e.target.select();
  }

  handleToggleTextColorPickerVisible = () => {
    const { visibleColorPicker } = this.state;

    if (visibleColorPicker === 'textcolor') {
      this.setState({ visibleColorPicker: null });
    } else {
      this.setState({ visibleColorPicker: 'textcolor' });
    }
  }

  handleToggleBackgroundColorPickerVisible = () => {
    const { visibleColorPicker } = this.state;

    if (visibleColorPicker === 'backgroundcolor') {
      this.setState({ visibleColorPicker: null });
    } else {
      this.setState({ visibleColorPicker: 'backgroundcolor' });
    }
  }

  handleChangeBackgroundcolorVisibility = () => {
    const { transparentBackgroundcolor } = this.state;

    this.setState({ transparentBackgroundcolor: !transparentBackgroundcolor });
  }

  handleChangeColor = (color) => {
    const { visibleColorPicker } = this.state;

    if (visibleColorPicker) {
      this.setState({ [visibleColorPicker]: color.hex });
    }
  }

  render () {
    const { oembed, visibleColorPicker, textcolor, backgroundcolor, transparentBackgroundcolor } = this.state;

    return (
      <div className='embed-modal-content'>
        <h4><FormattedMessage id='status.embed' defaultMessage='Embed' /></h4>

        <div className='embed-modal-container'>
          <p className='hint'>
            <FormattedMessage id='embed.instructions' defaultMessage='Embed this status on your website by copying the code below.' />
          </p>

          <input
            type='text'
            className='embed-modal-html'
            readOnly
            value={oembed && oembed.html || ''}
            onClick={this.handleTextareaClick}
          />

          <p className='hint'>
            <FormattedMessage id='embed.options' defaultMessage='Options' />
          </p>

          <div className='options'>
            <div className='embed-color-pickers'>
              <div className='embed-textcolor'>
                <FormattedMessage id='embed.textcolor' defaultMessage='Text color' />
                <ColorTrigger
                  alpha={1}
                  color={parseInt(textcolor.substr(1), 16)}
                  onClick={this.handleToggleTextColorPickerVisible}
                />
                <div className='embed-color-picker'>
                  <Delay>
                    {visibleColorPicker === 'textcolor' && (
                      <SketchPicker
                        color={{ hex: textcolor }}
                        disableAlpha
                        onChange={this.handleChangeColor}
                      />
                    )}
                  </Delay>
                </div>
              </div>

              <div className='embed-backgroundcolor'>
                <FormattedMessage id='embed.backgroundcolor' defaultMessage='Background color' />
                <ColorTrigger
                  alpha={1}
                  color={parseInt(backgroundcolor.substr(1), 16)}
                  onClick={this.handleToggleBackgroundColorPickerVisible}
                />
                <div className='embed-color-picker'>
                  <Delay>
                    {visibleColorPicker === 'backgroundcolor' && (
                      <SketchPicker
                        color={{ hex: backgroundcolor }}
                        disableAlpha
                        onChange={this.handleChangeColor}
                      />
                    )}
                  </Delay>
                </div>
              </div>
            </div>

            <Checkbox checked={transparentBackgroundcolor} onChange={this.handleChangeBackgroundcolorVisibility}>
              <FormattedMessage
                id='embed.transparent_backgroundcolor'
                defaultMessage='Make the background color transparent.'
              />
            </Checkbox>
          </div>

          <p className='hint'>
            <FormattedMessage id='embed.preview' defaultMessage='Here is what it will look like:' />
          </p>

          <iframe
            className='embed-modal-iframe'
            frameBorder='0'
            ref={this.setIframeRef}
            title='preview'
          />
        </div>
      </div>
    );
  }

}
