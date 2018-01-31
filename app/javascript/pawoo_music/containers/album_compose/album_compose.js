import classNames from 'classnames';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import React from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import Icon from '../../components/icon';
import ImageInput from '../../components/image_input';
import ScrollableList from '../../components/scrollable_list';
import PrivacyDropdown from '../../../mastodon/features/compose/components/privacy_dropdown';
import GenreTagPicker from '../../components/genre_tag_picker';
import MusicCompose from '../../components/music_compose';
import {
  refreshTracks,
  registerTrack,
  rearrangeRegisteredTracks,
  unregisterTrack,
  rearrangeUnregisteredTracks,
  expandUnregisteredTracks,
  changeAlbumComposeAlbumTitle,
  changeAlbumComposeAlbumText,
  changeAlbumComposeAlbumImage,
  changeAlbumComposePrivacy,
  submitAlbumCompose,
} from '../../actions/album_compose';
import { makeGetAccount } from '../../../mastodon/selectors';
import { constructRgbCode } from '../../util/musicvideo';
import { isMobile } from '../../util/is_mobile';

import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

const messages = defineMessages({
  privacy: { id: 'pawoo_music.track_compose.privacy', defaultMessage: 'Privacy' },
  select_genre: { id: 'pawoo_music.track_compose.select_genre', defaultMessage: 'Select genre tag' },
});
const allowedPrivacy = ['public', 'unlisted'];

class TrackList extends ImmutablePureComponent {

  static propTypes = {
    tracks: ImmutablePropTypes.list.isRequired,
  }

  renderDraggable = (track, index) => {
    const artworkStyle = {
      backgroundColor: constructRgbCode(track.getIn(['video', 'backgroundcolor']), 1),
    };

    return (
      <Draggable key={track.get('id')} draggableId={track.get('id')} index={index}>
        {({ dragHandleProps, draggableProps, innerRef, placeholder }, { isDragging }) => (
          <div className='draggable-item'>
            <div
              className='album-compose-track'
              ref={innerRef}
              {...dragHandleProps}
              {...draggableProps}
            >
              <img className='album-compose-track-artwork' src={track.getIn(['video', 'image'], defaultArtwork)} alt={track.get('title')} style={artworkStyle} />
              <div className='album-compose-track-info'>{`${track.get('artist')} - ${track.get('title')}`}</div>
              {isDragging ? <div className='tint' /> : null}
            </div>
            {placeholder}
          </div>
        )}
      </Draggable>
    );
  }

  render () {
    const { tracks, ...props } = this.props;

    return (
      <ScrollableList {...props}>
        {tracks.map(this.renderDraggable)}
      </ScrollableList>
    );
  }

}

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();

  const mapStateToProps = (state) => {
    return {
      registeredTracks: state.getIn(['pawoo_music', 'album_compose', 'registeredTracks'])
                             .map(id => state.getIn(['statuses', id, 'track'])),
      isLoadingRegisteredTracks: state.getIn(['pawoo_music', 'album_compose', 'isLoadingRegisteredTracks']),
      unregisteredTracks: state.getIn(['pawoo_music', 'album_compose', 'unregisteredTracks'])
                               .map(id => state.getIn(['statuses', id, 'track'])),
      hasMoreUnregisteredTracks: state.getIn(['pawoo_music', 'album_compose', 'unregisteredTracksNext']) !== null,
      isLoadingUnregisteredTracks: state.getIn(['pawoo_music', 'album_compose', 'isLoadingUnregisteredTracks']),
      album: state.getIn(['pawoo_music', 'album_compose', 'album']),
      error: state.getIn(['pawoo_music', 'album_compose', 'error']),
      isSubmitting: state.getIn(['pawoo_music', 'album_compose', 'is_submitting']),
      account: getAccount(state, state.getIn(['meta', 'me'])).get('acct'),
    };
  };

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch) => ({
  onRefreshTracks () {
    dispatch(refreshTracks());
  },

  onExpandUnregisteredTracks () {
    dispatch(expandUnregisteredTracks());
  },

  onRegisterTrack (source, destination) {
    dispatch(registerTrack(source, destination));
  },

  onRegisteredTracksRearrange (source, destination) {
    dispatch(rearrangeRegisteredTracks(source, destination));
  },

  onUnregisterTrack (source, destination) {
    dispatch(unregisterTrack(source, destination));
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
    acct: PropTypes.string,
    album: ImmutablePropTypes.map.isRequired,
    isActive: PropTypes.func,
    onReplace: PropTypes.func,
    onRefreshTracks: PropTypes.func.isRequired,
    onExpandUnregisteredTracks: PropTypes.func.isRequired,
    error: PropTypes.any,
    isSubmitting: PropTypes.bool.isRequired,
    hasMoreUnregisteredTracks: PropTypes.bool,
    registeredTracks: ImmutablePropTypes.list.isRequired,
    isLoadingRegisteredTracks: PropTypes.bool,
    unregisteredTracks: ImmutablePropTypes.list.isRequired,
    isLoadingUnregisteredTracks: PropTypes.bool,
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
    registeredsBeingDragged: 0,
  };

  image = null;

  componentDidMount () {
    const { album } = this.props;

    this.props.onRefreshTracks();
    this.updateImage(album);
  }

  componentWillReceiveProps ({ error, isSubmitting, album }) {
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
    const { acct, album, onClose } = this.props;

    if (typeof onClose === 'function') {
      onClose();
    } else {
      const id = album.get('id');

      if (id) {
        location.href = `/@${acct}/${id}`;
      } else {
        location.href = '/';
      }
    }
  }

  handleDragStart = ({ source }) => {
    if (source && source.droppableId === 'album_compose_registered') {
      this.setState({ registeredsBeingDragged: this.state.registeredsBeingDragged + 1 });
    }
  }

  handleDragEnd = ({ source, destination }) => {
    if (!source || !destination) {
      return;
    }

    if (source.droppableId === 'album_compose_unregistered') {
      if (destination.droppableId === 'album_compose_unregistered') {
        this.props.onUnregisteredTracksRearrange(source.index, destination.index);
      } else if (destination.droppableId === 'album_compose_registered') {
        this.props.onRegisterTrack(source.index, destination.index);
      }
    } else if (source.droppableId === 'album_compose_registered') {
      this.setState({ registeredsBeingDragged: this.state.registeredsBeingDragged - 1 });

      if (destination.droppableId === 'album_compose_unregistered') {
        const sourceId = this.props.registeredTracks.getIn(['source.index', 'id']);
        const foundIndex = this.props.unregisteredTracks.findIndex(track => track.get('id') < sourceId);
        const destinationIndex = foundIndex || this.props.unregisteredTracks.count() - 1;

        this.props.onUnregisterTrack(source.index, destinationIndex);
      } else if (destination.droppableId === 'album_compose_registered') {
        this.props.onRegisteredTracksRearrange(source.index, destination.index);
      }
    }
  }

  handleChangeAlbumImage = (file) => {
    this.setState({ albumImageTitle: file.name }, () => {
      this.props.onChangeAlbumImage(file);
    });
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

  handleUnregisteredTracksScrollToBottom = () => {
    this.props.onExpandUnregisteredTracks();
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

  setRegisteredRef = ref => {
    this.registeredRef = ref;
    this.registeredInnerRef(ref);
  }

  render () {
    const {
      isActive,
      onReplace,
      hasMoreUnregisteredTracks,
      registeredTracks,
      isLoadingRegisteredTracks,
      unregisteredTracks,
      isLoadingUnregisteredTracks,
      album,
      intl,
    } = this.props;
    const { albumImageTitle, registeredsBeingDragged } = this.state;

    return (
      <MusicCompose isActive={isActive} onReplace={onReplace}>
        <div className={classNames('album-compose-content', { mobile: isMobile() })}>
          <div className='form-content'>
            <img className='thumbnail' src={this.image} alt='album thumbnail' />
            <form>
              {/* 画像選択、タイトル、説明 */}
              <fieldset>
                <legend>
                  <ImageInput
                    onChange={this.handleChangeAlbumImage}
                    title={albumImageTitle}
                  />
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

          <DragDropContext onDragStart={this.handleDragStart} onDragEnd={this.handleDragEnd}>
            <div className='album-items-wrapper'>
              <div className='album-items'>
                <section>
                  <h1>Registered</h1>
                  <Droppable droppableId='album_compose_registered'>
                    {({ innerRef }) => {
                      this.registeredInnerRef = innerRef;

                      return (
                        <div
                          className={classNames('draggable-items', { 'is-dragging-over-unregistered': this.isDraggingOverUnregistered })}
                          ref={this.setRegisteredRef}
                        >
                          <TrackList
                            isLoading={isLoadingRegisteredTracks}
                            scrollKey='album_compose_registered'
                            tracks={registeredTracks}
                          />
                        </div>
                      );
                    }}
                  </Droppable>
                </section>
                <section>
                  <h1>Unregistered</h1>
                  <Droppable droppableId='album_compose_unregistered'>
                    {({ innerRef }, { isDraggingOver }) => {
                      this.isDraggingOverUnregistered = isDraggingOver;

                      if (this.registeredRef) {
                        if (isDraggingOver) {
                          this.registeredRef.classList.add('is-dragging-over-unregistered');
                        } else {
                          this.registeredRef.classList.remove('is-dragging-over-unregistered');
                        }
                      }

                      return (
                        <div className='draggable-items' ref={innerRef}>
                          <TrackList
                            hasMore={hasMoreUnregisteredTracks}
                            isLoading={isLoadingUnregisteredTracks}
                            onScrollToBottom={this.handleUnregisteredTracksScrollToBottom}
                            scrollKey='album_compose_unregistered'
                            tracks={unregisteredTracks}
                          />
                          <p className={classNames('remove', { visible: isDraggingOver && registeredsBeingDragged > 0 })}>
                            <Icon icon='trash' />
                            <FormattedMessage
                              id='pawoo_music.album_compose.remove'
                              defaultMessage='Remove from the album'
                            />
                          </p>
                        </div>
                      );
                    }}
                  </Droppable>
                </section>
              </div>
            </div>
          </DragDropContext>
        </div>
      </MusicCompose>
    );
  }

};
