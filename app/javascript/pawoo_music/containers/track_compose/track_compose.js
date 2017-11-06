import classNames from 'classnames';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import React from 'react';
import { SketchPicker } from 'react-color';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import {
  changeTrackComposeTrackTitle,
  changeTrackComposeTrackArtist,
  changeTrackComposeTrackText,
  changeTrackComposeTrackMusic,
  changeTrackComposeTrackVideoBackgroundColor,
  changeTrackComposeTrackVideoImage,
  changeTrackComposeTrackVideoBlurVisibility,
  changeTrackComposeTrackVideoBlurMovementThreshold,
  changeTrackComposeTrackVideoBlurBlinkThreshold,
  changeTrackComposeTrackVideoParticleVisibility,
  changeTrackComposeTrackVideoParticleAlpha,
  changeTrackComposeTrackVideoParticleColor,
  changeTrackComposeTrackVideoParticleLimitThreshold,
  changeTrackComposeTrackVideoLightLeaksVisibility,
  changeTrackComposeTrackVideoLightLeaksAlpha,
  changeTrackComposeTrackVideoLightLeaksInterval,
  changeTrackComposeTrackVideoSpectrumVisiblity,
  changeTrackComposeTrackVideoSpectrumMode,
  changeTrackComposeTrackVideoSpectrumAlpha,
  changeTrackComposeTrackVideoSpectrumColor,
  changeTrackComposeTrackVideoTextVisibility,
  changeTrackComposeTrackVideoTextAlpha,
  changeTrackComposeTrackVideoTextColor,
  changeTrackComposeTrackVideoBannerVisibility,
  changeTrackComposeTrackVideoBannerAlpha,
  changeTrackComposePrivacy,
  submitTrackCompose,
} from '../../actions/track_compose';
import {
  stopTrack,
} from '../../actions/tracks';
import { makeGetAccount } from '../../../mastodon/selectors';
import IconButton from '../../components/icon_button';
import Musicvideo from '../../components/musicvideo';
import Delay from '../../components/delay';
import Slider from '../../components/slider';
import Checkbox from '../../components/checkbox';
import {
  constructRgbObject,
  constructRgbCode,
  extractRgbFromRgbObject,
  validateIsFileMp3,
  validateIsFileImage,
} from '../../util/musicvideo';
import PrivacyDropdown from '../../../mastodon/features/compose/components/privacy_dropdown';

const messages = defineMessages({
  preview: { id: 'pawoo_music.track_compose.preview', defaultMessage: 'Video preview' },
  privacy: { id: 'pawoo_music.track_compose.privacy', defaultMessage: 'Privacy' },
  select_genre: { id: 'pawoo_music.track_compose.select_genre', defaultMessage: 'Select genre tag' },
});

const allowedPrivacy = ['public', 'unlisted'];
const genreList = ['electronic', 'pop', 'rock', 'alternative', 'ambient', 'acoustic', 'world', 'hiphop', 'reggae', 'folk', 'jazz', 'funk', 'punk', 'metal', 'soundtrack'];

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();

  const mapStateToProps = (state) => ({
    tab: state.getIn(['pawoo_music', 'track_compose', 'tab']),
    track: state.getIn(['pawoo_music', 'track_compose', 'track']),
    error: state.getIn(['pawoo_music', 'track_compose', 'error']),
    isSubmitting: state.getIn(['pawoo_music', 'track_compose', 'is_submitting']),
    account: getAccount(state, state.getIn(['meta', 'me'])),
  });

  return mapStateToProps;
};


const mapDispatchToProps = (dispatch) => ({
  onStopTrack (value) {
    dispatch(stopTrack(value));
  },

  onChangeTrackTitle (value) {
    dispatch(changeTrackComposeTrackTitle(value));
  },

  onChangeTrackArtist (value) {
    dispatch(changeTrackComposeTrackArtist(value));
  },

  onChangeTrackText (value) {
    dispatch(changeTrackComposeTrackText(value));
  },

  onChangeTrackMusic (value) {
    dispatch(changeTrackComposeTrackMusic(value));
  },

  onChangeTrackVideoBackgroundColor (value) {
    dispatch(changeTrackComposeTrackVideoBackgroundColor(value));
  },

  onChangeTrackVideoImage (value) {
    dispatch(changeTrackComposeTrackVideoImage(value));
  },

  onChangeTrackVideoBlurVisibility (value) {
    dispatch(changeTrackComposeTrackVideoBlurVisibility(value));
  },

  onChangeTrackVideoBlurMovementThreshold (value) {
    dispatch(changeTrackComposeTrackVideoBlurMovementThreshold(value));
  },

  onChangeTrackVideoBlurBlinkThreshold (value) {
    dispatch(changeTrackComposeTrackVideoBlurBlinkThreshold(value));
  },

  onChangeTrackVideoParticleVisibility (value) {
    dispatch(changeTrackComposeTrackVideoParticleVisibility(value));
  },

  onChangeTrackVideoParticleAlpha (value) {
    dispatch(changeTrackComposeTrackVideoParticleAlpha(value));
  },

  onChangeTrackVideoParticleColor (value) {
    dispatch(changeTrackComposeTrackVideoParticleColor(value));
  },

  onChangeTrackVideoParticleLimitThreshold (value) {
    dispatch(changeTrackComposeTrackVideoParticleLimitThreshold(value));
  },

  onChangeTrackVideoLightLeaksVisibility (value) {
    dispatch(changeTrackComposeTrackVideoLightLeaksVisibility(value));
  },

  onChangeTrackVideoLightLeaksAlpha (value) {
    dispatch(changeTrackComposeTrackVideoLightLeaksAlpha(value));
  },

  onChangeTrackVideoLightLeaksInterval (value) {
    dispatch(changeTrackComposeTrackVideoLightLeaksInterval(value));
  },

  onChangeTrackVideoSpectrumVisibility (value) {
    dispatch(changeTrackComposeTrackVideoSpectrumVisiblity(value));
  },

  onChangeTrackVideoSpectrumMode (value) {
    dispatch(changeTrackComposeTrackVideoSpectrumMode(value));
  },

  onChangeTrackVideoSpectrumAlpha (value) {
    dispatch(changeTrackComposeTrackVideoSpectrumAlpha(value));
  },

  onChangeTrackVideoSpectrumColor (value) {
    dispatch(changeTrackComposeTrackVideoSpectrumColor(value));
  },

  onChangeTrackVideoTextVisibility (value) {
    dispatch(changeTrackComposeTrackVideoTextVisibility(value));
  },

  onChangeTrackVideoTextAlpha (value) {
    dispatch(changeTrackComposeTrackVideoTextAlpha(value));
  },

  onChangeTrackVideoTextColor (value) {
    dispatch(changeTrackComposeTrackVideoTextColor(value));
  },

  onChangeTrackVideoBannerVisibility (value) {
    dispatch(changeTrackComposeTrackVideoBannerVisibility(value));
  },

  onChangeTrackVideoBannerAlpha (value) {
    dispatch(changeTrackComposeTrackVideoBannerAlpha(value));
  },

  onChangePrivacy (value) {
    dispatch(changeTrackComposePrivacy(value));
  },

  onSubmit () {
    dispatch(submitTrackCompose());
  },
});

class ColorTrigger extends ImmutablePureComponent {

  static propTypes = {
    alpha: PropTypes.number.isRequired,
    color: PropTypes.number.isRequired,
    onClick: PropTypes.func,
  }

  render () {
    const { alpha, color, onClick } = this.props;
    const depth = Math.round(((color & 0xff) + ((color >> 8) & 0xff) + ((color >> 16) & 0xff)) / 3);
    const borderDepth = depth < 0xb0 ? 0x58 + depth : Math.max(0x58, 0x108 - depth);
    const borderDepthHex = borderDepth.toString(16);

    return (
      <div
        className='track-compose-effect-color-trigger'
        onClick={onClick}
        role='button'
        style={{ borderColor: '#' + borderDepthHex.repeat(3) }}
        tabIndex='-1'
      >
        <div
          className='track-compose-effect-color-trigger-body'
          style={{ backgroundColor: constructRgbCode(color, alpha) }}
        />
      </div>
    );
  }

}

@injectIntl
@connect(makeMapStateToProps, mapDispatchToProps)
export default class TrackCompose extends ImmutablePureComponent {

  static propTypes = {
    onStopTrack: PropTypes.func.isRequired,
    onChangeTrackTitle: PropTypes.func.isRequired,
    onChangeTrackArtist: PropTypes.func.isRequired,
    onChangeTrackText: PropTypes.func.isRequired,
    onChangeTrackMusic: PropTypes.func.isRequired,
    onChangeTrackVideoBackgroundColor: PropTypes.func.isRequired,
    onChangeTrackVideoImage: PropTypes.func.isRequired,
    onChangeTrackVideoBlurVisibility: PropTypes.func.isRequired,
    onChangeTrackVideoBlurMovementThreshold: PropTypes.func.isRequired,
    onChangeTrackVideoBlurBlinkThreshold: PropTypes.func.isRequired,
    onChangeTrackVideoParticleVisibility: PropTypes.func.isRequired,
    onChangeTrackVideoParticleAlpha: PropTypes.func.isRequired,
    onChangeTrackVideoParticleColor: PropTypes.func.isRequired,
    onChangeTrackVideoParticleLimitThreshold: PropTypes.func.isRequired,
    onChangeTrackVideoLightLeaksVisibility: PropTypes.func.isRequired,
    onChangeTrackVideoLightLeaksAlpha: PropTypes.func.isRequired,
    onChangeTrackVideoLightLeaksInterval: PropTypes.func.isRequired,
    onChangeTrackVideoSpectrumVisibility: PropTypes.func.isRequired,
    onChangeTrackVideoSpectrumMode: PropTypes.func.isRequired,
    onChangeTrackVideoSpectrumAlpha: PropTypes.func.isRequired,
    onChangeTrackVideoSpectrumColor: PropTypes.func.isRequired,
    onChangeTrackVideoTextVisibility: PropTypes.func.isRequired,
    onChangeTrackVideoTextAlpha: PropTypes.func.isRequired,
    onChangeTrackVideoTextColor: PropTypes.func.isRequired,
    onChangeTrackVideoBannerVisibility: PropTypes.func.isRequired,
    onChangeTrackVideoBannerAlpha: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    tab: PropTypes.string.isRequired,
    track: ImmutablePropTypes.map.isRequired,
    error: PropTypes.any,
    isSubmitting: PropTypes.bool.isRequired,
    intl: PropTypes.object.isRequired,
    onClose: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  }

  static defaultProps = {
    onClose: false,
  }

  state = {
    trackMusicTitle: '',
    trackVideoImageTitle: '',
    visibleColorPicker: null,
  };

  trackMusicRef = null;
  trackVideoImageRef = null;

  componentDidMount = () => {
    this.props.onStopTrack();
  };

  componentWillReceiveProps ({ error, isSubmitting, track }) {
    if (track.get('music') === null && this.props.track.get('music') !== null &&
        this.trackMusicRef !== null) {
      this.trackMusicRef.value = '';
    }

    if (track.getIn(['video', 'image']) === null &&
        this.props.track.getIn(['video', 'image']) !== null &&
        this.trackVideoImageRef !== null) {
      this.trackVideoImageRef.value = '';
    }

    // アップロードに成功した
    if (this.props.isSubmitting && !isSubmitting && !error) {
      this.handleCancel();
    }
  }

  handleChangeTrackMusic = ({ target }) => {
    const file = target.files[0];
    if (file) {
      validateIsFileMp3(file).then((isMp3) => {
        if (isMp3) {
          this.setState({ trackMusicTitle: file.name }, () => {
            this.props.onChangeTrackMusic(file);
          });
        }
      });
    }
  };

  handleChangeTrackTitle = ({ target }) => {
    this.props.onChangeTrackTitle(target.value);
  }

  handleChangeTrackArtist = ({ target }) => {
    this.props.onChangeTrackArtist(target.value);
  }

  handleChangeTrackText = ({ target }) => {
    this.props.onChangeTrackText(target.value);
  }

  handleChangeTrackVideoImage = ({ target }) => {
    const file = target.files[0];
    if (file) {
      validateIsFileImage(file).then((isImage) => {
        if (isImage) {
          this.setState({ trackVideoImageTitle: file.name }, () => {
            this.props.onChangeTrackVideoImage(file);
          });
        }
      });
    }
  }

  handleToggleBackgroundColorPickerVisible = () => {
    this.setState({ visibleColorPicker: 'background' }, this.handleBindColorPickerHide);
  }

  handleChangeTrackVideoBackgroundColor = ({ rgb }) => {
    this.props.onChangeTrackVideoBackgroundColor(extractRgbFromRgbObject(rgb));
  }

  handleChangeTrackVideoBlurVisibility = ({ target }) => {
    this.props.onChangeTrackVideoBlurVisibility(target.checked);
  }

  handleChangeTrackBlurMovementThreshold = (value) => {
    this.props.onChangeTrackVideoBlurMovementThreshold(value);
  }

  handleChangeTrackVideoBlurBlinkThreshold = (value) => {
    this.props.onChangeTrackVideoBlurBlinkThreshold(value);
  }

  handleChangeTrackVideoParticleVisibility = ({ target }) => {
    this.props.onChangeTrackVideoParticleVisibility(target.checked);
  }

  handleChangeTrackVideoParticleLimitThreshold = (value) => {
    this.props.onChangeTrackVideoParticleLimitThreshold(value);
  }

  handleChangeTrackVideoParticleColor = ({ rgb }) => {
    this.props.onChangeTrackVideoParticleAlpha(rgb.a);
    this.props.onChangeTrackVideoParticleColor(extractRgbFromRgbObject(rgb));
  }

  handleChangeTrackVideoLightLeaksVisibility = ({ target }) => {
    this.props.onChangeTrackVideoLightLeaksVisibility(target.checked);
  }

  handleChangeTrackVideoLightLeaksAlpha = (value) => {
    this.props.onChangeTrackVideoLightLeaksAlpha(value);
  }

  handleChangeTrackVideoLightLeaksInterval = (value) => {
    this.props.onChangeTrackVideoLightLeaksInterval(value);
  }

  handleChangeTrackVideoLightLeaksColor = ({ rgb }) => {
    this.props.onChangeTrackVideoLightLeaksAlpha(rgb.a);
  }

  handleChangeTrackVideoSpectrumVisibility = ({ target }) => {
    this.props.onChangeTrackVideoSpectrumVisibility(target.checked);
  }

  handleChangeTrackVideoSpectrumMode = ({ target }) => {
    if (target.checked) {
      this.props.onChangeTrackVideoSpectrumMode(Number(target.value));
    }
  }

  handleChangeTrackVideoSpectrumColor = ({ rgb }) => {
    this.props.onChangeTrackVideoSpectrumAlpha(rgb.a);
    this.props.onChangeTrackVideoSpectrumColor(extractRgbFromRgbObject(rgb));
  }

  handleChangeTrackComposeTrackVideoTextVisibility = ({ target }) => {
    this.props.onChangeTrackVideoTextVisibility(target.checked);
  }

  handleChangeTrackComposeTrackVideoTextColor = ({ rgb }) => {
    this.props.onChangeTrackVideoTextAlpha(rgb.a);
    this.props.onChangeTrackVideoTextColor(extractRgbFromRgbObject(rgb));
  }

  handleChangeTrackVideoBannerVisibility = ({ target }) => {
    this.props.onChangeTrackVideoBannerVisibility(target.checked);
  }

  handleChangeTrackVideoBannerAlpha = (value) => {
    this.props.onChangeTrackVideoBannerAlpha(value);
  }

  handleBindColorPickerHide = () => {
    document.addEventListener('click', this.handleColorPickerHide, false);
  };

  handleUnbindColorPickerHide = () => {
    document.removeEventListener('click', this.handleColorPickerHide, false);
  };

  handleColorPickerHide = (event) => {
    let node = event.target;
    let inside = false;
    while (node.tagName !== 'BODY') {
      if (/track-compose-effect-color-wrap/.test(node.className)) {
        inside = true;
        break;
      }
      node = node.parentNode;
    }
    if (!inside) {
      this.setState({ visibleColorPicker: null }, this.handleUnbindColorPickerHide);
    }
  };

  handleToggleParticleColorPickerVisible = () => {
    this.setState({ visibleColorPicker: 'particle' }, this.handleBindColorPickerHide);
  };

  handleToggleSpectrumColorPickerVisible = () => {
    this.setState({ visibleColorPicker: 'spectrum' }, this.handleBindColorPickerHide);
  };

  handleToggleTextColorPickerVisible = () => {
    this.setState({ visibleColorPicker: 'text' }, this.handleBindColorPickerHide);
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.onSubmit();
  }

  handleCancel = () => {
    const { account, track, onClose } = this.props;

    if (typeof onClose === 'function') {
      onClose();
    } else {
      const id = track.get('id');

      if (id) {
        location.href = `/@${account.get('acct')}/${id}`;
      } else {
        location.href = '/';
      }
    }
  }

  handleChangePrivacy = (value) => {
    this.props.onChangePrivacy(value);
  }

  handleClickGenre = (e) => {
    const index = e.currentTarget.getAttribute('data-index');
    const genre = genreList[index];

    this.props.onChangeTrackText(`${this.props.track.get('text')} #${genre}`);
  }

  setTrackMusicRef = (ref) => {
    this.trackMusicRef = ref;
  }

  setTrackVideoImageRef = (ref) => {
    this.trackVideoImageRef = ref;
  }

  render () {
    const { track, intl } = this.props;
    const { trackMusicTitle, trackVideoImageTitle } = this.state;
    const caution = {
      height: '100px',
      overflowY: 'scroll',
      marginTop: '24px',
      fontSize: 'var(--text10-font)',
      backgroundColor: 'var(--textcolor)',
      padding: 'var(--padding10)',
      borderRadius: 'var(--radius)',
    };

    return (
      <div className='track-compose'>
        <div className='content'>
          <Musicvideo track={track} label={intl.formatMessage(messages.preview)} autoPlay={false} />
          <div className='form-content'>
            <form>

              {/* 音楽選択から画像選択まで */}
              <fieldset>
                <legend>
                  <div className={classNames('track-compose-file-upload', { settled: track.get('music') instanceof File })}>
                    <div className='track-compose-file-upload-body'>
                      <IconButton src='music' />
                      <span className='text'>
                        {trackMusicTitle ? trackMusicTitle : (
                          <FormattedMessage
                            id='pawoo_music.track_compose.basic.music'
                            defaultMessage='Select audio'
                          />
                        )}
                      </span>
                      <input
                        accept='audio/mpeg'
                        onChange={this.handleChangeTrackMusic}
                        ref={this.setTrackMusicRef}
                        required
                        type='file'
                      />
                    </div>
                  </div>
                </legend>

                <legend>
                  <div className='track-compose-text-input'>
                    <label className=''>
                      {this.props.track.get('title').length === 0 && (
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.track_compose.basic.title'
                            defaultMessage='Title'
                          />
                        </span>
                      )}
                      <input
                        maxLength='128'
                        onChange={this.handleChangeTrackTitle}
                        required
                        size='32'
                        type='text'
                        value={this.props.track.get('title')}
                      />
                    </label>
                  </div>
                </legend>

                <legend>
                  <div className='track-compose-text-input'>
                    <label className=''>
                      {this.props.track.get('artist').length === 0 && (
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.track_compose.basic.artist'
                            defaultMessage='Artist'
                          />
                        </span>
                      )}
                      <input
                        maxLength='128'
                        onChange={this.handleChangeTrackArtist}
                        required
                        size='32'
                        type='text'
                        value={this.props.track.get('artist')}
                      />
                    </label>
                  </div>
                </legend>

                <legend>
                  <div className='track-compose-text-textarea'>
                    <label className=''>
                      {this.props.track.get('text').length === 0 && (
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.track_compose.basic.details'
                            defaultMessage='Details'
                          />
                        </span>
                      )}
                      <textarea
                        maxLength='500'
                        onChange={this.handleChangeTrackText}
                        value={this.props.track.get('text')}
                      />
                    </label>
                  </div>
                  <div className='genre-selector'>
                    <IconButton src='plus-circle' strokeWidth={2} title={intl.formatMessage(messages.select_genre)} />
                    <div className='genre-list'>
                      {genreList.map((genre, i) => (
                        <div key={genre} data-index={i} className='genre-item' onClick={this.handleClickGenre} role='button' tabIndex={0} aria-pressed='false'>
                          {genre}
                        </div>
                      ))}
                    </div>
                  </div>
                </legend>

                <legend>
                  <div className={classNames('track-compose-file-upload', { settled: track.getIn(['video', 'image']) instanceof File })}>
                    <div className='track-compose-file-upload-body'>
                      <IconButton src='image' />
                      <span className='text'>
                        {trackVideoImageTitle ? trackVideoImageTitle : (
                          <FormattedMessage
                            id='pawoo_music.track_compose.video.image'
                            defaultMessage='Image'
                          />
                        )}
                      </span>
                      <input
                        accept='image/jpeg,image/png'
                        onChange={this.handleChangeTrackVideoImage}
                        ref={this.setTrackVideoImageRef}
                        type='file'
                      />
                    </div>
                  </div>
                </legend>
              </fieldset>

              <label className='track-compose-effect-color'>
                <div className='horizontal'>
                  <span className='text'>
                    <FormattedMessage
                      id='pawoo_music.track_compose.video.background_color'
                      defaultMessage='Background color'
                    />
                  </span>
                  <div className='track-compose-effect-color-wrap'>
                    <ColorTrigger
                      alpha={1}
                      color={this.props.track.getIn(['video', 'backgroundcolor'])}
                      onClick={this.handleToggleBackgroundColorPickerVisible}
                    />
                    <Delay>
                      {this.state.visibleColorPicker === 'background' && (
                        <div className='track-compose-effect-color-content'>
                          <SketchPicker
                            color={constructRgbObject(this.props.track.getIn(['video', 'backgroundcolor']), 1)}
                            disableAlpha
                            onChange={this.handleChangeTrackVideoBackgroundColor}
                          />
                        </div>
                      )}
                    </Delay>
                  </div>
                </div>
              </label>

              {/* Spectrum */}
              <fieldset>
                <legend>
                  <label className='horizontal'>
                    <Checkbox checked={this.props.track.getIn(['video', 'spectrum', 'visible'])} onChange={this.handleChangeTrackVideoSpectrumVisibility}>
                      <FormattedMessage
                        id='pawoo_music.track_compose.video.spectrum'
                        defaultMessage='Spectrum'
                      />
                    </Checkbox>
                  </label>
                </legend>

                <Delay duration={480} className='legend'>
                  {this.props.track.getIn(['video', 'spectrum', 'visible']) && (
                    <legend className='track-compose-effect'>
                      <div className='horizontal'>
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.track_compose.video.spectrum_form'
                            defaultMessage='Form'
                          />
                        </span>
                        <div className='horizontal track-compose-radio'>
                          <Checkbox circled value='1' checked={this.props.track.getIn(['video', 'spectrum', 'mode']) === 1} onChange={this.handleChangeTrackVideoSpectrumMode}>
                            <FormattedMessage
                              id='pawoo_music.track_compose.video.circle_columns'
                              defaultMessage='Columns around circle'
                            />
                          </Checkbox>
                          <Checkbox circled value='2' checked={this.props.track.getIn(['video', 'spectrum', 'mode']) === 2} onChange={this.handleChangeTrackVideoSpectrumMode}>
                            <FormattedMessage
                              id='pawoo_music.track_compose.video.circle'
                              defaultMessage='Circle'
                            />
                          </Checkbox>
                          <Checkbox circled value='0' checked={this.props.track.getIn(['video', 'spectrum', 'mode']) === 0} onChange={this.handleChangeTrackVideoSpectrumMode}>
                            <FormattedMessage
                              id='pawoo_music.track_compose.video.bottom_columns'
                              defaultMessage='Columns at the bottom'
                            />
                          </Checkbox>
                          <Checkbox circled value='3' checked={this.props.track.getIn(['video', 'spectrum', 'mode']) === 3} onChange={this.handleChangeTrackVideoSpectrumMode}>
                            <FormattedMessage
                              id='pawoo_music.track_compose.video.bottom_fill'
                              defaultMessage='Filled graph at the bottom'
                            />
                          </Checkbox>
                        </div>
                      </div>

                      <div className='track-compose-effect-color'>
                        <label className='horizontal'>
                          <span className='text'>
                            <FormattedMessage
                              id='pawoo_music.track_compose.video.color'
                              defaultMessage='Color'
                            />
                          </span>
                          <div className='track-compose-effect-color-wrap'>
                            <ColorTrigger
                              alpha={this.props.track.getIn(['video', 'spectrum', 'alpha'])}
                              color={this.props.track.getIn(['video', 'spectrum', 'color'])}
                              onClick={this.handleToggleSpectrumColorPickerVisible}
                            />
                            <Delay>
                              {this.state.visibleColorPicker === 'spectrum' && (
                                <div className='track-compose-effect-color-content'>
                                  <SketchPicker
                                    color={constructRgbObject(this.props.track.getIn(['video', 'spectrum', 'color']), this.props.track.getIn(['video', 'spectrum', 'alpha']))}
                                    onChange={this.handleChangeTrackVideoSpectrumColor}
                                  />
                                </div>
                              )}
                            </Delay>
                          </div>
                        </label>
                      </div>
                    </legend>
                  )}
                </Delay>
              </fieldset>

              {/* Blur */}
              <fieldset>
                <legend>
                  <label className='horizontal'>
                    <Checkbox checked={this.props.track.getIn(['video', 'blur', 'visible'])} onChange={this.handleChangeTrackVideoBlurVisibility}>
                      <FormattedMessage
                        id='pawoo_music.track_compose.video.blur'
                        defaultMessage='Blur'
                      />
                    </Checkbox>
                  </label>
                </legend>

                <Delay duration={480} className='legend'>
                  {this.props.track.getIn(['video', 'blur', 'visible']) && (
                    <legend className='track-compose-effect'>
                      <label className='horizontal'>
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.track_compose.video.movement_threshold'
                            defaultMessage='Movement'
                          />
                        </span>
                        <Slider
                          min={128}
                          max={256}
                          value={this.props.track.getIn(['video', 'blur', 'movement', 'threshold'])}
                          onChange={this.handleChangeTrackBlurMovementThreshold}
                        />
                      </label>
                      <label className='horizontal'>
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.track_compose.video.blink_threshold'
                            defaultMessage='Blink'
                          />
                        </span>
                        <Slider
                          min={128}
                          max={256}
                          value={this.props.track.getIn(['video', 'blur', 'blink', 'threshold'])}
                          onChange={this.handleChangeTrackVideoBlurBlinkThreshold}
                        />
                      </label>
                    </legend>
                  )}
                </Delay>
              </fieldset>

              {/* Particle */}
              <fieldset>
                <legend>
                  <label className='horizontal'>
                    <Checkbox checked={this.props.track.getIn(['video', 'particle', 'visible'])} onChange={this.handleChangeTrackVideoParticleVisibility}>
                      <FormattedMessage
                        id='pawoo_music.track_compose.video.particle'
                        defaultMessage='Particle'
                      />
                    </Checkbox>
                  </label>
                </legend>

                <Delay duration={480} className='legend'>
                  {this.props.track.getIn(['video', 'particle', 'visible']) && (
                    <legend className='track-compose-effect'>
                      <label className='horizontal'>
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.track_compose.video.limit_threshold'
                            defaultMessage='Limit'
                          />
                        </span>
                        <Slider
                          min={128}
                          max={256}
                          value={this.props.track.getIn(['video', 'particle', 'limit', 'threshold'])}
                          onChange={this.handleChangeTrackVideoParticleLimitThreshold}
                        />
                      </label>
                      <label className='track-compose-effect-color'>
                        <div className='horizontal'>
                          <span className='text'>
                            <FormattedMessage
                              id='pawoo_music.track_compose.video.color'
                              defaultMessage='Color'
                            />
                          </span>
                          <div className='track-compose-effect-color-wrap'>
                            <ColorTrigger
                              alpha={this.props.track.getIn(['video', 'particle', 'alpha'])}
                              color={this.props.track.getIn(['video', 'particle', 'color'])}
                              onClick={this.handleToggleParticleColorPickerVisible}
                            />
                            <Delay>
                              {this.state.visibleColorPicker === 'particle' && (
                                <div className='track-compose-effect-color-content'>
                                  <SketchPicker
                                    color={constructRgbObject(this.props.track.getIn(['video', 'particle', 'color']), this.props.track.getIn(['video', 'particle', 'alpha']))}
                                    onChange={this.handleChangeTrackVideoParticleColor}
                                  />
                                </div>
                              )}
                            </Delay>
                          </div>
                        </div>
                      </label>
                    </legend>
                  )}
                </Delay>
              </fieldset>

              {/* LightLeak */}
              <fieldset>
                <legend>
                  <label className='horizontal'>
                    <Checkbox checked={this.props.track.getIn(['video', 'lightleaks', 'visible'])} onChange={this.handleChangeTrackVideoLightLeaksVisibility}>
                      <FormattedMessage
                        id='pawoo_music.track_compose.video.lightleaks'
                        defaultMessage='Light leaks'
                      />
                    </Checkbox>
                  </label>
                </legend>

                <Delay duration={480} className='legend'>
                  {this.props.track.getIn(['video', 'lightleaks', 'visible']) && (
                    <legend className='track-compose-effect'>
                      <label className='horizontal'>
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.track_compose.video.lightleaks_alpha'
                            defaultMessage='Opacity'
                          />
                        </span>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={this.props.track.getIn(['video', 'lightleaks', 'alpha'])}
                          onChange={this.handleChangeTrackVideoLightLeaksAlpha}
                        />
                      </label>

                      <label className='horizontal'>
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.track_compose.video.interval'
                            defaultMessage='Interval'
                          />
                        </span>
                        <Slider
                          min={0}
                          max={60}
                          step={0.1}
                          value={this.props.track.getIn(['video', 'lightleaks', 'interval'])}
                          onChange={this.handleChangeTrackVideoLightLeaksInterval}
                        />
                      </label>
                    </legend>
                  )}
                </Delay>
              </fieldset>

              {/* Text */}
              <fieldset>
                <legend>
                  <label className='horizontal'>
                    <Checkbox checked={this.props.track.getIn(['video', 'text', 'visible'])} onChange={this.handleChangeTrackComposeTrackVideoTextVisibility}>
                      <FormattedMessage
                        id='pawoo_music.track_compose.video.text'
                        defaultMessage='Text'
                      />
                    </Checkbox>
                  </label>
                </legend>

                <Delay duration={480} className='legend'>
                  {this.props.track.getIn(['video', 'text', 'visible']) && (
                    <legend className='track-compose-effect'>
                      <div className='track-compose-effect-color'>
                        <div className='horizontal'>
                          <span className='text'>
                            <FormattedMessage
                              id='pawoo_music.track_compose.video.color'
                              defaultMessage='Color'
                            />
                          </span>
                          <div className='track-compose-effect-color-wrap'>
                            <ColorTrigger
                              alpha={this.props.track.getIn(['video', 'text', 'alpha'])}
                              color={this.props.track.getIn(['video', 'text', 'color'])}
                              onClick={this.handleToggleTextColorPickerVisible}
                            />
                            <Delay>
                              {this.state.visibleColorPicker === 'text' && (
                                <div className='track-compose-effect-color-content'>
                                  <SketchPicker
                                    color={constructRgbObject(this.props.track.getIn(['video', 'text', 'color']), this.props.track.getIn(['video', 'text', 'alpha']))}
                                    onChange={this.handleChangeTrackComposeTrackVideoTextColor}
                                  />
                                </div>
                              )}
                            </Delay>
                          </div>
                        </div>
                      </div>
                    </legend>
                  )}
                </Delay>
              </fieldset>

              {/* Banner */}
              <fieldset>
                <legend>
                  <label className='horizontal'>
                    <Checkbox checked={this.props.track.getIn(['video', 'banner', 'visible'])} onChange={this.handleChangeTrackVideoBannerVisibility}>
                      <FormattedMessage
                        id='pawoo_music.track_compose.video.banner'
                        defaultMessage='"made with Pawoo Music" banner (only for exported video)'
                      />
                    </Checkbox>
                  </label>
                </legend>

                <Delay duration={480}>
                  {this.props.track.getIn(['video', 'banner', 'visible']) && (
                    <div>
                      <p>
                        <FormattedMessage
                          id='pawoo_music.track_compose.video.banner_note'
                          defaultMessage='The banner will be shown only at the beginning of the video.'
                        />
                      </p>
                      <label className='horizontal'>
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.track_compose.video.banner_alpha'
                            defaultMessage='Opacity'
                          />
                        </span>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={this.props.track.getIn(['video', 'banner', 'alpha'])}
                          onChange={this.handleChangeTrackVideoBannerAlpha}
                        />
                      </label>
                    </div>
                  )}
                </Delay>
              </fieldset>

              <div style={caution}>
                <b>作品（画像、音源、楽曲、テキスト等を含む）のアップロードにおいて、下記の注意事項を守ることを誓います。</b><br />
                <br />
                １．この作品をインターネットで配信することが、第三者のいかなる権利も侵害しないこと。<br />
                <br />
                ２．マストドンというソフトウェアの仕様上、この作品が自動で他の様々なマストドンインスタンスにも複製され、配信されることに同意すること。<br />
                （前提として、マストドンのソフトウェアの規約上、複製された作品を第三者が商用利用する行為は禁止されています。権利を侵害する行為は関連法令により罰せられることがあります。）<br />
                <br />
                ３．この楽曲のインターネットでの配信（インタラクティブ配信）に係る権利について、著作権等管理団体に管理委託または信託していないこと。<br />
                <br />
                ４．楽曲のアップロード後に、当該楽曲のインターネットでの配信（インタラクティブ配信）に係る権利の管理を第三者に委託した場合は、管理委託・信託契約の効力発生日前に、当サービスからアップロードした作品を削除すること。<br />
                <br />
                ５．他人の作品を許可なくアップロードしたことにより、当サービスまたは第三者に損害を与えたときは、当該アップロード者が一切の責任を負うものとし、当社はその一切の責任を負いません。
              </div>
            </form>

            <div className='actions'>
              <button className='cancel' onClick={this.handleCancel}>
                <FormattedMessage id='pawoo_music.track_compose.cancel' defaultMessage='Cancel' />
              </button>
              {!track.get('id') && <PrivacyDropdown buttonClassName='privacy-toggle' value={track.get('visibility')} onChange={this.handleChangePrivacy} text={intl.formatMessage(messages.privacy)} allowedPrivacy={allowedPrivacy} />}
              <button className={classNames('submit', { disabled: this.props.isSubmitting })} disabled={this.props.isSubmitting} onClick={this.handleSubmit}>
                {track.get('id') ? (
                  <FormattedMessage id='pawoo_music.track_compose.save' defaultMessage='Save' />
                ) : (
                  <FormattedMessage id='pawoo_music.track_compose.submit' defaultMessage='Submit' />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

}
