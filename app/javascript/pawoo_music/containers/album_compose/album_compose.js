import classNames from 'classnames';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import React from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import IconButton from '../../components/icon_button';
import PrivacyDropdown from '../../../mastodon/features/compose/components/privacy_dropdown';
import GenreTagPicker from '../../components/genre_tag_picker';
import {
  refreshTracks,
  register,
  rearrangeRegisteredTracks,
  unregister,
  rearrangeUnregisteredTracks,
  changeAlbumComposeAlbumTitle,
  changeAlbumComposeAlbumText,
  changeAlbumComposeAlbumImage,
  changeAlbumComposePrivacy,
  submitAlbumCompose,
} from '../../actions/album_compose';
import { validateIsFileImage } from '../../util/musicvideo';
import { makeGetAccount } from '../../../mastodon/selectors';

import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

const messages = defineMessages({
  privacy: { id: 'pawoo_music.track_compose.privacy', defaultMessage: 'Privacy' },
  select_genre: { id: 'pawoo_music.track_compose.select_genre', defaultMessage: 'Select genre tag' },
});
const allowedPrivacy = ['public', 'unlisted'];

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();

  const mapStateToProps = (state) => {
    const me = state.getIn(['meta', 'me']);
    return {
      me,
      tracks: state.getIn(['pawoo_music', 'album_compose', 'tracks'], Immutable.Map()),
      registeredTracks: state.getIn(['pawoo_music', 'album_compose', 'registeredTracks']),
      unregisteredTracks: state.getIn(['pawoo_music', 'album_compose', 'unregisteredTracks']),
      album: state.getIn(['pawoo_music', 'album_compose', 'album']),
      error: state.getIn(['pawoo_music', 'album_compose', 'error']),
      isSubmitting: state.getIn(['pawoo_music', 'album_compose', 'is_submitting']),
      account: getAccount(state, me),
    };
  };

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch) => ({
  onMapId (id) {
    dispatch(refreshTracks(id));
  },

  onRegister (source, destination) {
    dispatch(register(source, destination));
  },

  onRegisteredTracksRearrange (source, destination) {
    dispatch(rearrangeRegisteredTracks(source, destination));
  },

  onUnregister (source, destination) {
    dispatch(unregister(source, destination));
  },

  onUnregisteredTracksRearrange (source, destination) {
    dispatch(rearrangeUnregisteredTracks(source, destination));
  },

  onChangeAlbumTitle (value) {
    dispatch(changeAlbumComposeAlbumTitle(value));
  },

  onChangeAlbumText (value) {
    dispatch(changeAlbumComposeAlbumText(value));
  },

  onChangeAlbumImage (value) {
    dispatch(changeAlbumComposeAlbumImage(value));
  },

  onChangePrivacy (value) {
    dispatch(changeAlbumComposePrivacy(value));
  },

  onSubmit () {
    dispatch(submitAlbumCompose());
  },
});

@injectIntl
@connect(makeMapStateToProps, mapDispatchToProps)
export default class AlbumCompose extends ImmutablePureComponent {

  static propTypes = {
    me: PropTypes.number.isRequired,
    album: ImmutablePropTypes.map.isRequired,
    onMapId: PropTypes.func.isRequired,
    tracks: ImmutablePropTypes.map.isRequired,
    error: PropTypes.any,
    isSubmitting: PropTypes.bool.isRequired,
    registeredTracks: ImmutablePropTypes.list.isRequired,
    unregisteredTracks: ImmutablePropTypes.list.isRequired,
    onChangeAlbumTitle: PropTypes.func.isRequired,
    onChangeAlbumText: PropTypes.func.isRequired,
    onChangeAlbumImage: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    onClose: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  }

  static defaultProps = {
    onClose: false,
  }

  state = {
    albumImageTitle: '',
  };

  albumImageRef = null;
  image = null;

  componentDidMount () {
    this.props.onMapId(this.props.me);
    this.updateImage(this.props.album);
  }

  componentWillReceiveProps ({ error, isSubmitting, album }) {
    if (album.get('image') === null &&
        this.props.album.get('image') !== null &&
        this.albumImageRef !== null) {
      this.albumImageRef.value = '';
    }

    if (album.get('image') !== this.props.album.get('image')) {
      if (this.props.album.get('image') instanceof Blob) {
        URL.revokeObjectURL(this.image);
      }
      this.updateImage(album);
    }

    // アップロードに成功した
    // TODO: isSubmitting
    if (this.props.isSubmitting && !isSubmitting && !error) {
      this.handleCancel();
    }
  }

  componentWillUnmount () {
    if (this.props.album.get('image') instanceof Blob) {
      URL.revokeObjectURL(this.image);
    }
  }

  handleCancel = () => {
    const { account, album, onClose } = this.props;

    if (typeof onClose === 'function') {
      onClose();
    } else {
      const id = album.get('id');

      if (id) {
        location.href = `/@${account.get('acct')}/${id}`;
      } else {
        location.href = '/';
      }
    }
  }

  handleDragEnd = ({ source, destination }) => {
    if (!source || !destination) {
      return;
    }

    if (source.droppableId === 'album_compose_unregistered' && destination.droppableId === 'album_compose_unregistered') {
      this.props.onUnregisteredTracksRearrange(source.index, destination.index);
    } else if (source.droppableId === 'album_compose_unregistered' && destination.droppableId === 'album_compose_registered') {
      this.props.onRegister(source.index, destination.index);
    } else if (source.droppableId === 'album_compose_registered' && destination.droppableId === 'album_compose_unregistered') {
      this.props.onUnregister(source.index, destination.index);
    } else if (source.droppableId === 'album_compose_registered' && destination.droppableId === 'album_compose_registered') {
      this.props.onRegisteredTracksRearrange(source.index, destination.index);
    }
  }

  handleChangeAlbumImage = ({ target }) => {
    const file = target.files[0];
    if (file) {
      validateIsFileImage(file).then((isImage) => {
        if (isImage) {
          this.setState({ albumImageTitle: file.name }, () => {
            this.props.onChangeAlbumImage(file);
          });
        }
      });
    }
  }

  handleChangeAlbumTitle = ({ target }) => {
    this.props.onChangeAlbumTitle(target.value);
  }

  handleChangeAlbumText = ({ target }) => {
    this.props.onChangeAlbumText(target.value);
  }

  handleChangePrivacy = (value) => {
    this.props.onChangePrivacy(value);
  }

  handleSelectGenre = (genre) => {
    this.props.onChangeAlbumText(`${this.props.album.get('text')} #${genre}`);
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.onSubmit();
  }

  setAlbumImageRef = (ref) => {
    this.albumImageRef = ref;
  }

  updateImage = (album) => {
    const image = album.get('image');

    if (image instanceof Blob) {
      this.image = URL.createObjectURL(image);
    } else if (typeof image === 'string') {
      this.image = image;
    } else {
      this.image = defaultArtwork;
    }
  }

  renderDraggable = (item) => {
    const { tracks } = this.props;
    const track = tracks.getIn([item, 'track']);

    return (
      <Draggable key={item} draggableId={item}>
        {(provided) => (
          <div className='draggable-item'>
            <div
              className='album-compose-track'
              ref={provided.innerRef}
              style={provided.draggableStyle}
              {...provided.dragHandleProps}
            >
              <img className='album-compose-track-artwork' src={track.getIn(['video', 'image'], defaultArtwork)} alt={track.get('title')} />
              <div className='album-compose-track-info'>{`${track.get('artist')} - ${track.get('title')}`}</div>
            </div>
            {provided.placeholder}
          </div>
        )}
      </Draggable>
    );
  }

  render () {
    const { registeredTracks, unregisteredTracks, album, intl } = this.props;
    const { albumImageTitle } = this.state;

    return (
      <div className='album-compose'>
        <div className='content'>
          <div className='form-content'>
            <img className='thumbnail' src={this.image} alt='album thumbnail' />
            <form>
              {/* 画像選択、タイトル、説明 */}
              <fieldset>
                <legend>
                  <div className={classNames('album-compose-file-upload', { settled: album.get('image') instanceof File })}>
                    <div className='album-compose-file-upload-body'>
                      <IconButton src='image' />
                      <span className='text'>
                        {albumImageTitle ? albumImageTitle : (
                          <FormattedMessage
                            id='pawoo_music.album_compose.video.image'
                            defaultMessage='Image'
                          />
                        )}
                      </span>
                      <input
                        accept='image/jpeg,image/png'
                        onChange={this.handleChangeAlbumImage}
                        ref={this.setAlbumImageRef}
                        type='file'
                      />
                    </div>
                  </div>
                </legend>

                <legend>
                  <div className='album-compose-text-input'>
                    <label className=''>
                      {this.props.album.get('title').length === 0 && (
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.album_compose.basic.title'
                            defaultMessage='Title'
                          />
                        </span>
                      )}
                      <input
                        maxLength='128'
                        onChange={this.handleChangeAlbumTitle}
                        required
                        size='32'
                        type='text'
                        value={this.props.album.get('title')}
                      />
                    </label>
                  </div>
                </legend>

                <legend>
                  <div className='album-compose-text-textarea'>
                    <label className=''>
                      {this.props.album.get('text').length === 0 && (
                        <span className='text'>
                          <FormattedMessage
                            id='pawoo_music.album_compose.basic.details'
                            defaultMessage='Details'
                          />
                        </span>
                      )}
                      <textarea
                        maxLength='500'
                        onChange={this.handleChangeAlbumText}
                        value={this.props.album.get('text')}
                      />
                    </label>
                  </div>
                  <GenreTagPicker onSelectGenre={this.handleSelectGenre} />
                </legend>
              </fieldset>
            </form>
            <div className='actions'>
              <button className='cancel' onClick={this.handleCancel}>
                <FormattedMessage id='pawoo_music.track_compose.cancel' defaultMessage='Cancel' />
              </button>
              {!album.get('id') && <PrivacyDropdown buttonClassName='privacy-toggle' value={album.get('visibility')} onChange={this.handleChangePrivacy} text={intl.formatMessage(messages.privacy)} allowedPrivacy={allowedPrivacy} />}
              <button className={classNames('submit', { disabled: this.props.isSubmitting })} disabled={this.props.isSubmitting} onClick={this.handleSubmit}>
                {album.get('id') ? (
                  <FormattedMessage id='pawoo_music.track_compose.save' defaultMessage='Save' />
                ) : (
                  <FormattedMessage id='pawoo_music.track_compose.submit' defaultMessage='Submit' />
                )}
              </button>
            </div>
          </div>

          <DragDropContext onDragEnd={this.handleDragEnd}>
            <div className='album-items-wrapper'>
              <div className='album-items'>
                <section>
                  <h1>Registered</h1>
                  <Droppable droppableId='album_compose_registered'>
                    {(provided) => (
                      <div className='draggable-items' ref={provided.innerRef}>
                        <Scrollbars>
                          {registeredTracks.map(this.renderDraggable)}
                        </Scrollbars>
                      </div>
                    )}
                  </Droppable>
                </section>
                <section>
                  <h1>Unregistered</h1>
                  <Droppable droppableId='album_compose_unregistered'>
                    {(provided) => (
                      <div className='draggable-items' ref={provided.innerRef}>
                        <Scrollbars>
                          {unregisteredTracks.map(this.renderDraggable)}
                        </Scrollbars>
                      </div>
                    )}
                  </Droppable>
                </section>
              </div>
            </div>
          </DragDropContext>
        </div>
      </div>
    );
  }

};
