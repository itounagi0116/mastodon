import * as OfflinePluginRuntime from 'offline-plugin/runtime';
import * as WebPushSubscription from './web_push_subscription';
import TimelineEntry from 'pawoo_music/entries/timeline'; // eslint-disable-line import/no-unresolved

import React from 'react';
import ReactDOM from 'react-dom';
import ready from './ready';

const perf = require('./performance');

function main() {
  perf.start('main()');

  require.context('../images/', true);

  ready(() => {
    const mountNode = document.getElementById('mastodon');
    const props = JSON.parse(mountNode.getAttribute('data-props'));

    ReactDOM.render(<TimelineEntry {...props} />, mountNode);
    if (process.env.NODE_ENV === 'production') {
      // avoid offline in dev mode because it's harder to debug
      OfflinePluginRuntime.install();
      WebPushSubscription.register();
    }
    perf.stop('main()');
  });
}

export default main;
