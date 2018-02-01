import loadPolyfills from '../mastodon/load_polyfills';

function loaded() {
  const MusicvideoEntry = require('../pawoo_music/entries/musicvideo').default;
  const React = require('react');
  const ReactDOM = require('react-dom');
  const mountNode = document.getElementById('pawoo-music-musicvideo');
  const locale = JSON.parse(document.getElementById('pawoo-music-default-props').getAttribute('data-props')).locale;
  const status = JSON.parse(mountNode.getAttribute('data-props'));

  ReactDOM.render(<MusicvideoEntry {...{ locale, status }} />, mountNode);
}

function main() {
  const ready = require('../mastodon/ready').default;
  ready(loaded);
}

loadPolyfills().then(main).catch(e => {
  console.error(e);
});
