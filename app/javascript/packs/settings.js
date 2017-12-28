import loadPolyfills from '../mastodon/load_polyfills';
import * as OfflinePluginRuntime from 'offline-plugin/runtime';
import * as WebPushSubscription from '../mastodon/web_push_subscription';

function onDomContentLoaded(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

function loaded() {
  const SettingsEntry = require('../pawoo_music/entries/settings').default;
  const React = require('react');
  const ReactDOM = require('react-dom');
  const mountNode = document.getElementById('pawoo-music-settings');
  const props = JSON.parse(mountNode.getAttribute('data-props'));

  ReactDOM.render(<SettingsEntry {...props} />, mountNode);
  if (process.env.NODE_ENV === 'production') {
    // avoid offline in dev mode because it's harder to debug
    OfflinePluginRuntime.install();
    WebPushSubscription.register();
  }
}

function main() {
  onDomContentLoaded(loaded);
}

loadPolyfills().then(main).catch(e => {
  console.error(e);
});
