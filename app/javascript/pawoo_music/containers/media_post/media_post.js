import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import Icon from '../../components/icon';
import { isMobile } from '../../util/is_mobile';
import { showTrackComposeModal, resetTrackComposeData } from '../../actions/track_compose';
import TipsBalloonContainer from '../../../mastodon/containers/tips_balloon_container';

const mapStateToProps = (state) => ({
  isLogin: !!state.getIn(['meta', 'me']),
});

@connect(mapStateToProps)
export default class MediaPost extends PureComponent {

  static propTypes = {
    isLogin: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.mobile = isMobile();
  }

  handleMediaPost = () => {
    const { isLogin, dispatch } = this.props;
    if (!isLogin) {
      location.href = '/auth/sign_in';
      return;
    }

    if (this.mobile) {
      location.href = '/tracks/new';
    } else {
      dispatch(resetTrackComposeData());
      dispatch(showTrackComposeModal());
    }
  };

  render () {
    return (
      <div className='media-post'>
        <div className='media-post-body' role='button' tabIndex='-1' onClick={this.handleMediaPost}>
          <Icon icon='plus' title='Post Your Music!' strong />
        </div>
        <div className='media-post-tips-baloon'>
          <TipsBalloonContainer id={4} style={{ left: '35px', top: '5px' }} direction='top'>
            <FormattedMessage
              id='pawoo_music.media_post.tips_balloon'
              defaultMessage="Let's submit your track!"
            />
          </TipsBalloonContainer>
        </div>
        <div className='media-post-tips-baloon-gallery'>
          <TipsBalloonContainer id={5} style={{ top: '95px' }} direction='bottom' position='center'>
            <FormattedMessage
              id='pawoo_music.gallery.tips_balloon'
              defaultMessage='Enjoy tracks on the media gallery timeline!'
            />
          </TipsBalloonContainer>
        </div>
      </div>
    );
  }

}
