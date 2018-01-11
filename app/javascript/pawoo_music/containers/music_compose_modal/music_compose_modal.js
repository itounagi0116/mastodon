import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AlbumComposeContainer from '../../containers/album_compose';
import TrackComposeContainer from '../../containers/track_compose';
import Delay from '../../components/delay';
import { showAlbumComposeModal, hideAlbumComposeModal } from '../../actions/album_compose';
import { showTrackComposeModal, hideTrackComposeModal } from '../../actions/track_compose';

const mapStateToProps = (state) => {
  let Body = null;

  if (state.getIn(['pawoo_music', 'album_compose', 'modal'])) {
    Body = AlbumComposeContainer;
  } else if (state.getIn(['pawoo_music', 'track_compose', 'modal'])) {
    Body = TrackComposeContainer;
  }

  return { Body };
};

@connect(mapStateToProps)
export default class MusicComposeModal extends PureComponent {

  static propTypes = {
    Body: PropTypes.func,
    dispatch: PropTypes.func.isRequired,
  };

  handleIsActive = (match, location, to) => {
    switch (to) {
    case '/albums/new':
      return this.props.Body === AlbumComposeContainer;

    case '/tracks/new':
      return this.props.Body === TrackComposeContainer;

    default:
      return match;
    }
  }

  handleReplace = (event, to) => {
    event.preventDefault();

    switch (to) {
    case '/albums/new':
      this.props.dispatch(hideTrackComposeModal());
      this.props.dispatch(showAlbumComposeModal());
      break;

    case '/tracks/new':
      this.props.dispatch(hideAlbumComposeModal());
      this.props.dispatch(showTrackComposeModal());
      break;
    }
  };

  handleStopCompose = () => {
    switch (this.props.Body) {
    case AlbumComposeContainer:
      this.props.dispatch(hideAlbumComposeModal());
      break;

    case TrackComposeContainer:
      this.props.dispatch(hideTrackComposeModal());
      break;
    }
  };

  render () {
    const { Body } = this.props;

    return (
      <Delay className='music-compose-modal'>
        {Body && (
          <div className='music-compose-modal-body'>
            <Body isActive={this.handleIsActive} onClose={this.handleStopCompose} onReplace={this.handleReplace} />
          </div>
        )}
      </Delay>
    );
  }

}
