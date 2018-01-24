import loadPolyfills from '../mastodon/load_polyfills';

function onDomContentLoaded(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

function loaded() {
  const AlbumEntry = require('../pawoo_music/entries/album').default;
  const React = require('react');
  const ReactDOM = require('react-dom');
  const mountNode = document.getElementById('pawoo-music-album');
  const locale = JSON.parse(document.getElementById('pawoo-music-default-props').getAttribute('data-props')).locale;
  const status = JSON.parse(mountNode.getAttribute('data-props'));

  ReactDOM.render(<AlbumEntry {...{ locale, status }} />, mountNode);
}

function main() {
  onDomContentLoaded(loaded);
}

loadPolyfills().then(main).catch(e => {
  console.error(e);
});
