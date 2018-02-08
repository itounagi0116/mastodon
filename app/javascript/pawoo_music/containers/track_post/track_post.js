import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import MediaPost from '../media_post';
import { resetAlbumComposeData } from '../../actions/album_compose';
import { showTrackComposeModal, resetTrackComposeData } from '../../actions/track_compose';

@connect()
export default class TrackPost extends React.PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
  }

  handlePost = () => {
    this.props.dispatch(resetAlbumComposeData());
    this.props.dispatch(resetTrackComposeData());
    this.props.dispatch(showTrackComposeModal());
  }

  render () {
    return <MediaPost href='/tracks/new' onPost={this.handlePost} />;
  }

}
