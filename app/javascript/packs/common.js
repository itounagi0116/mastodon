import { start } from 'rails-ujs';
import ready from '../mastodon/ready';
import PawooGA from '../pawoo/actions/ga';

// import default stylesheet with variables
require('font-awesome/css/font-awesome.css');
require('mastodon-application-style'); // eslint-disable-line import/no-unresolved

require.context('../images/', true);

start();
ready(() => {
  PawooGA.trackPage(window.location.pathname);
  PawooGA.startHeartbeat();
});
