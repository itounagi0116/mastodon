import classNames from 'classnames';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import React from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import StatusMeta from '../status_meta';
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
import { openStatusModal } from '../../../mastodon/actions/statuses';
import { makeGetAccount, makeGetStatus } from '../../../mastodon/selectors';
import { isMobile } from '../../util/is_mobile';
import { constructRgbCode } from '../../util/musicvideo';

import defaultArtwork from '../../../images/pawoo_music/default_artwork.png';

const messages = defineMessages({
  privacy: { id: 'pawoo_music.music_compose.privacy', defaultMessage: 'Privacy' },
  select_genre: { id: 'pawoo_music.music_compose.select_genre', defaultMessage: 'Select genre tag' },
});
const allowedPrivacy = ['public', 'unlisted'];

class TrackInfo extends ImmutablePureComponent {

  static propTypes = {
    onClick: PropTypes.func.isRequired,
    status: ImmutablePropTypes.map.isRequired,
  }

  handleClick = event => {
    this.props.onClick(event, this.props.status);
  }

  render () {
    const { status } = this.props;
    const track = status.get('track');

    return (
      <div className='album-compose-track-info'>
        {`${track.get('artist')} - ${track.get('title')}`}
        <StatusMeta albumHidden onClick={this.handleClick} status={status} />
      </div>
    );
  }

}

class TrackList extends ImmutablePureComponent {

  static propTypes = {
    onClick: PropTypes.func.isRequired,
    statuses: ImmutablePropTypes.list.isRequired,
  }

  renderDraggable = (status, index) => {
    const id = status.get('id');
    const title = status.getIn(['track', 'title']);
    const backgroundColor = status.getIn(['track', 'video', 'backgroundcolor']);
    const image = status.getIn(['track', 'video', 'image'], defaultArtwork);
    const artworkStyle = {
      backgroundColor: constructRgbCode(backgroundColor, 1),
    };

    return (
      <Draggable key={id} draggableId={id} index={index}>
        {({ dragHandleProps, draggableProps, innerRef, placeholder }, { isDragging }) => (
          <div>
            <div
              className={classNames('album-compose-track', { 'is-dragging': isDragging })}
              ref={innerRef}
              {...dragHandleProps}
              {...draggableProps}
            >
              <img className='album-compose-track-artwork' src={image} alt={title} style={artworkStyle} />
              <TrackInfo onClick={this.props.onClick} status={status} />
              <div className='tint' />
            </div>
            {placeholder}
          </div>
        )}
      </Draggable>
    );
  }

  render () {
    const { statuses, onClick, ...props } = this.props;

    return (
      <ScrollableList {...props}>
        {statuses.map(this.renderDraggable)}
      </ScrollableList>
    );
  }

}

class RegisteredTrackList extends ImmutablePureComponent {

  static propTypes = {
    registereds: ImmutablePropTypes.list.isRequired,
    isLoading: PropTypes.bool,
    isDraggingOverUnregistereds: PropTypes.bool,
    onClick: PropTypes.func,
  }

  render () {
    const {
      registereds,
      isLoading,
      isDraggingOverUnregistereds,
      onClick,
    } = this.props;

    return (
      <Droppable droppableId='album_compose_registered'>
        {(registeredsProvided, registeredsSnapshot) => {
          const plusVisible = !registeredsSnapshot.isDraggingOver && registereds.isEmpty();

          return (
            <div
              className={classNames('droppable', { 'is-dragging-over-unregistereds': isDraggingOverUnregistereds })}
              ref={registeredsProvided.innerRef}
            >
              <TrackList
                isLoading={isLoading}
                onClick={onClick}
                scrollKey='album_compose_registered'
                statuses={registereds}
              />
              <p
                aria-hidden={!plusVisible}
                className={classNames('add', { visible: plusVisible })}
              >
                <Icon icon='plus' />
                <FormattedMessage
                  id='pawoo_music.album_compose.add'
                  defaultMessage='Drag a track here'
                />
              </p>
            </div>
          );
        }}
      </Droppable>
    );
  }

}

class TrackLists extends ImmutablePureComponent {

  static propTypes = {
    hasMoreUnregistered: PropTypes.bool,
    registereds: ImmutablePropTypes.list.isRequired,
    isLoadingRegistereds: PropTypes.bool,
    unregistereds: ImmutablePropTypes.list.isRequired,
    isLoadingUnregistereds: PropTypes.bool,
    onUnregisteredsScrollToBottom: PropTypes.func,
    registeredIsBeingDragged: PropTypes.bool,
    onClick: PropTypes.func,
  }

  render () {
    const {
      hasMoreUnregistered,
      registereds,
      isLoadingRegistereds,
      unregistereds,
      isLoadingUnregistereds,
      onUnregisteredsScrollToBottom,
      registeredIsBeingDragged,
      onClick,
    } = this.props;

    return (
      <Droppable droppableId='album_compose_unregistered'>
        {({ innerRef }, { isDraggingOver }) => (
          <div className='track-lists'>
            <section className='droppable-section registered'>
              <h1>
                <FormattedMessage
                  id='pawoo_music.album_compose.tracks.registered'
                  defaultMessage='Tracks in the album'
                />
              </h1>
              <RegisteredTrackList
                registereds={registereds}
                isLoading={isLoadingRegistereds}
                isDraggingOverUnregistereds={isDraggingOver}
                onClick={onClick}
              />
            </section>
            <section className='droppable-section unregistered'>
              <h1>
                <FormattedMessage
                  id='pawoo_music.album_compose.tracks.unregistered'
                  defaultMessage='Tracks to add'
                />
              </h1>
              <div className='droppable' ref={innerRef}>
                <TrackList
                  hasMore={hasMoreUnregistered}
                  isLoading={isLoadingUnregistereds}
                  onClick={onClick}
                  onScrollToBottom={onUnregisteredsScrollToBottom}
                  scrollKey='album_compose_unregistered'
                  statuses={unregistereds}
                />
              </div>
              <p
                aria-hidden={!registeredIsBeingDragged}
                className={classNames('remove', { active: isDraggingOver, visible: registeredIsBeingDragged })}
              >
                <Icon icon='trash' />
                <FormattedMessage
                  id='pawoo_music.album_compose.remove'
                  defaultMessage='Remove from the album'
                />
              </p>
            </section>
          </div>
        )}
      </Droppable>
    );
  }

}

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();
  const getStatus = makeGetStatus();

  const mapStateToProps = (state) => ({
    registeredStatuses: state.getIn(['pawoo_music', 'album_compose', 'registeredTracks'])
                             .map(id => getStatus(state, id)),
    isLoadingRegisteredStatuses: state.getIn(['pawoo_music', 'album_compose', 'isLoadingRegisteredTracks']),
    unregisteredStatuses: state.getIn(['pawoo_music', 'album_compose', 'unregisteredTracks'])
                               .map(id => getStatus(state, id)),
    hasMoreUnregisteredStatuses: state.getIn(['pawoo_music', 'album_compose', 'unregisteredTracksNext']) !== null,
    isLoadingUnregisteredStatuses: state.getIn(['pawoo_music', 'album_compose', 'isLoadingUnregisteredTracks']),
    album: state.getIn(['pawoo_music', 'album_compose', 'album']),
    error: state.getIn(['pawoo_music', 'album_compose', 'error']),
    isSubmitting: state.getIn(['pawoo_music', 'album_compose', 'is_submitting']),
    account: getAccount(state, state.getIn(['meta', 'me'])).get('acct'),
  });

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch) => ({
  onRefreshStatuses () {
    dispatch(refreshTracks());
  },

  onExpandUnregisteredStatuses () {
    dispatch(expandUnregisteredTracks());
  },

  onRegisterStatus (source, destination) {
    dispatch(registerTrack(source, destination));
  },

  onRegisteredStatusesRearrange (source, destination) {
    dispatch(rearrangeRegisteredTracks(source, destination));
  },

  onUnregisterStatus (source, destination) {
    dispatch(unregisterTrack(source, destination));
  },

  onUnregisteredStatusesRearrange (source, destination) {
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

  onOpenStatus (status) {
    dispatch(openStatusModal({ id: status.get('id'), status }));
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
    onRefreshStatuses: PropTypes.func.isRequired,
    onExpandUnregisteredStatuses: PropTypes.func.isRequired,
    error: PropTypes.any,
    isSubmitting: PropTypes.bool.isRequired,
    hasMoreUnregisteredStatuses: PropTypes.bool,
    registeredStatuses: ImmutablePropTypes.list.isRequired,
    isLoadingRegisteredStatuses: PropTypes.bool,
    unregisteredStatuses: ImmutablePropTypes.list.isRequired,
    isLoadingUnregisteredStatuses: PropTypes.bool,
    onChangeAlbumTitle: PropTypes.func.isRequired,
    onChangeAlbumText: PropTypes.func.isRequired,
    onChangeAlbumImage: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onOpenStatus: PropTypes.func.isRequired,
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

    this.props.onRefreshStatuses();
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
    if (!source) {
      return;
    }

    if (source.droppableId === 'album_compose_unregistered') {
      if (destination) {
        if (destination.droppableId === 'album_compose_unregistered') {
          this.props.onUnregisteredStatusesRearrange(source.index, destination.index);
        } else if (destination.droppableId === 'album_compose_registered') {
          this.props.onRegisterStatus(source.index, destination.index);
        }
      }
    } else if (source.droppableId === 'album_compose_registered') {
      this.setState({ registeredsBeingDragged: this.state.registeredsBeingDragged - 1 });

      if (destination) {
        if (destination.droppableId === 'album_compose_unregistered') {
          const sourceId = this.props.registeredStatuses.getIn([source.index, 'id']);
          const foundIndex = this.props.unregisteredStatuses.findIndex(status => status.get('id') < sourceId);
          const destinationIndex = foundIndex || this.props.unregisteredStatuses.count() - 1;

          this.props.onUnregisterStatus(source.index, destinationIndex);
        } else if (destination.droppableId === 'album_compose_registered') {
          this.props.onRegisteredStatusesRearrange(source.index, destination.index);
        }
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

  handleClickStatus = (e, status) => {
    if (!isMobile()) {
      this.props.onOpenStatus(status);
      e.preventDefault();
    }
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

  render () {
    const {
      isActive,
      onReplace,
      hasMoreUnregisteredStatuses,
      registeredStatuses,
      isLoadingRegisteredStatuses,
      unregisteredStatuses,
      isLoadingUnregisteredStatuses,
      onExpandUnregisteredStatuses,
      album,
      intl,
    } = this.props;
    const { albumImageTitle, registeredsBeingDragged } = this.state;

    return (
      <MusicCompose isActive={isActive} onReplace={onReplace}>
        <div className='album-compose-content'>
          <form className='column'>
            <div className='thumbnail'>
              <img src={this.image} alt='album thumbnail' />
            </div>
            {/* 画像選択、タイトル、説明 */}
            <div className='form-content'>
              <ImageInput
                onChange={this.handleChangeAlbumImage}
                title={albumImageTitle}
              />

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
                <GenreTagPicker onSelectGenre={this.handleSelectGenre} />
              </div>
            </div>
          </form>

          <DragDropContext onDragStart={this.handleDragStart} onDragEnd={this.handleDragEnd}>
            <TrackLists
              hasMoreUnregistered={hasMoreUnregisteredStatuses}
              registereds={registeredStatuses}
              isLoadingRegistereds={isLoadingRegisteredStatuses}
              unregistereds={unregisteredStatuses}
              isLoadingUnregistereds={isLoadingUnregisteredStatuses}
              onUnregisteredsScrollToBottom={onExpandUnregisteredStatuses}
              registeredIsBeingDragged={registeredsBeingDragged > 0}
              onClick={this.handleClickStatus}
            />
          </DragDropContext>

          <div className='actions'>
            <button className='cancel' onClick={this.handleCancel}>
              <FormattedMessage id='pawoo_music.music_compose.cancel' defaultMessage='Cancel' />
            </button>
            <div className='submit'>
              {!album.get('id') && <PrivacyDropdown buttonClassName='privacy-toggle' value={album.get('visibility')} onChange={this.handleChangePrivacy} text={intl.formatMessage(messages.privacy)} allowedPrivacy={allowedPrivacy} />}
              <button className={classNames('submit', { disabled: this.props.isSubmitting })} disabled={this.props.isSubmitting} onClick={this.handleSubmit}>
                {album.get('id') ? (
                  <FormattedMessage id='pawoo_music.music_compose.save' defaultMessage='Save' />
                ) : (
                  <FormattedMessage id='pawoo_music.music_compose.submit' defaultMessage='Submit' />
                )}
              </button>
            </div>
          </div>
        </div>
      </MusicCompose>
    );
  }

};
