import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';

let id = 0;

export default class Oembed extends ImmutablePureComponent {

  static propTypes = {
    oembed: PropTypes.object,
  }

  componentDidMount () {
    addEventListener('message', this.handleMessage);
    this.post();
  }

  componentWillUnmount () {
    removeEventListener('message', this.handleMessage);
  }

  componentDidUpdate () {
    this.post();
  }

  post () {
    this.id = id;
    this.iframes = [];

    [].forEach.call(this.ref.querySelectorAll('iframe.mastodon-embed'), iframe => {
      const message = { type: 'setHeight', id };

      this.iframes.push(iframe);

      iframe.scrolling      = 'no';
      iframe.style.overflow = 'hidden';
      iframe.onload = () => iframe.contentWindow.postMessage(message, '*');

      id++;
      iframe.onload();
    });
  }

  handleMessage = ({ data = {} }) => {
    const index = data.id - this.id;

    if (data.type !== 'setHeight' || !this.iframes[index]) {
      return;
    }

    this.iframes[index].height = data.height;
  }

  setRef = ref => {
    this.ref = ref;
  }

  render () {
    return (
      <div
        ref={this.setRef}
        dangerouslySetInnerHTML={this.props.oembed && { __html: this.props.oembed.html }}
      />
    );
  }

}
