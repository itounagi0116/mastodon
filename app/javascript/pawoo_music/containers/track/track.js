import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import Musicvideo from '../musicvideo';
import classNames from 'classnames';
import { changePaused, changeTrackPath } from '../../actions/player';
import { constructRgbCode } from '../../util/musicvideo';

import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

const mapStateToProps = (state, { track }) => ({
  beingQueued: state.getIn(['pawoo_music', 'player', 'album']) === null &&
    Immutable.List(['statuses', track.get('id'), 'track']).equals(state.getIn(['pawoo_music', 'player', 'trackPath'])),
});

@connect(mapStateToProps)
class Track extends ImmutablePureComponent {

  static propTypes = {
    beingQueued: PropTypes.bool,
    children: PropTypes.node,
    controlsActive: PropTypes.bool,
    fitContain: PropTypes.bool,
    track: ImmutablePropTypes.map.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  componentWillUnmount () {
    const { dispatch, beingQueued } = this.props;

    if (beingQueued) {
      dispatch(changePaused(true));
      dispatch(changeTrackPath(null));
    }
  }

  handlePlayClick = () => {
    const { dispatch, track } = this.props;

    dispatch(changeTrackPath(['statuses', track.get('id'), 'track']));
    dispatch(changePaused(false));
  }

  render() {
    const { beingQueued, children, controlsActive, fitContain, track } = this.props;
    if (!track) {
      return null;
    }

    const thumbnailStyle = {
      backgroundColor: constructRgbCode(track.getIn(['video', 'backgroundcolor']), 1),
    };

    return (
      <div className={classNames('track', { 'fit-contain': fitContain })} style={thumbnailStyle}>
        {beingQueued ? (
          <Musicvideo bannerHidden controlsActive={controlsActive}>{children}</Musicvideo>
        ) : (
          <div className='thumbnail'>
            <img className='thumbnail-image' src={track.getIn(['video', 'image'], defaultArtwork)} alt='thumbnail' />
            <div className='playbutton' role='button' tabIndex='0' aria-pressed='false' onClick={this.handlePlayClick}>
              <span className='playbutton-icon' />
            </div>
          </div>
        )}
      </div>
    );
  }

}

export default Track;
