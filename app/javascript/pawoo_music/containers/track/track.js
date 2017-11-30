import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Musicvideo from '../../components/musicvideo';
import classNames from 'classnames';
import { playTrack } from '../../actions/tracks';
import { constructRgbCode } from '../../util/musicvideo';

import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

const mapStateToProps = (state) => ({
  trackId: state.getIn(['pawoo_music', 'tracks', 'trackId']),
});

@connect(mapStateToProps)
class Track extends ImmutablePureComponent {

  static propTypes = {
    fitContain: PropTypes.bool,
    track:  ImmutablePropTypes.map,
    trackId: PropTypes.number,
    onPlayTrack: PropTypes.func,
    onStopTrack: PropTypes.func,
    dispatch: PropTypes.func.isRequired,
  };

  state = {
    thumbnailView: true,
  }

  componentWillReceiveProps = ({ trackId }) => {
    if (!this.state.thumbnailView && trackId !== this.props.track.get('id')) {
      this.setState({ thumbnailView: true });
      if (this.props.onStopTrack) {
        this.props.onStopTrack();
      }
    }
  };

  componentWillUnmount () {
    this.setState({ thumbnailView: true });
    if (this.props.onStopTrack) {
      this.props.onStopTrack();
    }
  }

  handlePlayClick = () => {
    const { onPlayTrack, track, dispatch } = this.props;
    const { thumbnailView } = this.state;

    this.setState({ thumbnailView: !thumbnailView });
    if (thumbnailView) {
      dispatch(playTrack(track.get('id')));
      if (onPlayTrack) {
        onPlayTrack();
      }
    }
  }

  render() {
    const { fitContain, track } = this.props;
    const { thumbnailView } = this.state;
    if (!track) {
      return null;
    }

    const thumbnailStyle = {
      backgroundColor: constructRgbCode(track.getIn(['video', 'backgroundcolor']), 1),
    };

    return (
      <div className={classNames('track', { 'fit-contain': fitContain })} style={thumbnailStyle}>
        {thumbnailView ? (
          <div className='thumbnail'>
            <img className='thumbnail-image' src={track.getIn(['video', 'image'], defaultArtwork)} alt='thumbnail' />
            <div className='playbutton' role='button' tabIndex='0' aria-pressed='false' onClick={this.handlePlayClick}>
              <span className='playbutton-icon' />
            </div>
          </div>
        ) : (
          <Musicvideo track={track.deleteIn(['video', 'banner'])} />
        )}
      </div>
    );
  }

}

export default Track;
