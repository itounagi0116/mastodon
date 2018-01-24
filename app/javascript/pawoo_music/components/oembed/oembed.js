import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';

export default class Oembed extends ImmutablePureComponent {

  static propTypes = {
    oembed: PropTypes.object,
  }

  componentDidMount () {
    this.loadIframe(this.props.oembed);
  }

  shouldComponentUpdate ({ oembed }) {
    this.loadIframe(oembed);
    return false;
  }

  loadIframe (oembed) {
    if (oembed) {
      const iframeDocument = this.iframe.contentWindow.document;

      iframeDocument.open();
      iframeDocument.write(oembed.html);
      iframeDocument.close();

      iframeDocument.body.style.margin = 0;
      this.iframe.width  = iframeDocument.body.scrollWidth;
      this.iframe.height = iframeDocument.body.scrollHeight;
    }
  }

  setIframeRef = c =>  {
    this.iframe = c;
  }

  render () {
    return <iframe frameBorder='0' ref={this.setIframeRef} title='preview' />;
  }

}
