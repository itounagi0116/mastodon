import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import MediaPost from '../media_post';
import { showAlbumComposeModal } from '../../actions/album_compose';

@connect()
export default class AlbumPost extends React.PureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
  }

  handlePost = () => {
    this.props.dispatch(showAlbumComposeModal());
  }

  render () {
    return <MediaPost onPost={this.handlePost} to='/albums/new' />;
  }

}
