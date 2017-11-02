import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Musicvideo from '../../components/musicvideo';
import classNames from 'classnames';
import { playTrack, stopTrack } from '../../actions/tracks';
import { constructRgbCode } from '../../util/musicvideo';

import playIcon from '../../../images/pawoo_music/play.png';
import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

const mapStateToProps = (state) => ({
  trackId: state.getIn(['pawoo_music', 'tracks', 'trackId']),
});

const mapDispatchToProps = (dispatch) => ({
  onPlayTrack (value) {
    dispatch(playTrack(value));
  },

  onStopTrack (value) {
    dispatch(stopTrack(value));
  },
});

@connect(mapStateToProps, mapDispatchToProps)
class Track extends ImmutablePureComponent {

  static propTypes = {
    fitContain: PropTypes.bool,
    track:  ImmutablePropTypes.map,
    trackId: PropTypes.number,
    onPlayTrack: PropTypes.func.isRequired,
    onStopTrack: PropTypes.func.isRequired,
  };

  state = {
    thumbnailView: true,
  }

  componentWillReceiveProps = ({ trackId }) => {
    if (!this.state.thumbnailView && trackId !== this.props.track.get('id')) {
      this.setState({ thumbnailView: true });
    }
  };

  componentWillUnmount () {
    this.setState({ thumbnailView: true });
  }

  handlePlayClick = () => {
    const { thumbnailView } = this.state;

    this.setState({ thumbnailView: !thumbnailView });
    if (thumbnailView) {
      this.props.onPlayTrack(this.props.track.get('id'));
    } else {
      this.props.onStopTrack(this.props.track.get('id'));
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
      backgroundImage: thumbnailView && `url('${track.getIn(['video', 'image'], defaultArtwork)}')`,
    };

    return (
      <div className={classNames('track', { 'fit-contain': fitContain })} style={thumbnailStyle}>
        {thumbnailView ? (
          <div className='thumbnail' role='button' tabIndex='0' aria-pressed='false' onClick={this.handlePlayClick}>
            <img className='playbutton' src={playIcon} alt='playbutton' />
          </div>
        ) : (
          <Musicvideo track={track.deleteIn(['video', 'banner'])} />
        )}
      </div>
    );
  }

}

export default Track;
