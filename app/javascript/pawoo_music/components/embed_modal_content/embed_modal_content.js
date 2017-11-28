import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { FormattedMessage } from 'react-intl';
import axios from 'axios';
import Checkbox from '../../components/checkbox';

export default class EmbedModalContent extends ImmutablePureComponent {

  static propTypes = {
    url: PropTypes.string.isRequired,
    isTrack: PropTypes.bool,
  }

  state = {
    loading: false,
    oembed: null,
    showinfo: false,
  };

  componentDidMount () {
    this.loadIframe();
  }

  componentDidUpdate (prevProps, prevState) {
    const { showinfo } = this.state;

    if (prevState.showinfo !== showinfo) {
      this.loadIframe();
    }
  }

  loadIframe () {
    const { url, isTrack } = this.props;
    const { showinfo } = this.state;

    this.setState({ loading: true });

    axios.post('/api/web/embed', { url, hideinfo: Number(!showinfo) }).then(res => {
      this.setState({ loading: false, oembed: res.data });

      const iframeDocument = this.iframe.contentWindow.document;

      iframeDocument.open();
      iframeDocument.write(res.data.html);
      iframeDocument.close();

      iframeDocument.body.style.margin = 0;
      this.iframe.width  = iframeDocument.body.scrollWidth;
      this.iframe.height = isTrack ? this.iframe.width : iframeDocument.body.scrollHeight;
    });
  }

  setIframeRef = c =>  {
    this.iframe = c;
  }

  handleTextareaClick = (e) => {
    e.target.select();
  }

  handleChangeShowInfo = () => {
    const { showinfo } = this.state;

    this.setState({ showinfo: !showinfo });
  }

  render () {
    const { isTrack } = this.props;
    const { oembed, showinfo } = this.state;

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

          {isTrack && (
            <div className='options'>
              <p className='hint'>
                <FormattedMessage id='embed.options' defaultMessage='Options' />
              </p>

              <Checkbox checked={showinfo} onChange={this.handleChangeShowInfo}>
                <FormattedMessage
                  id='embed.showinfo'
                  defaultMessage='Show artist and title.'
                />
              </Checkbox>
            </div>
          )}

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
