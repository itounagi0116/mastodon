import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { debounce } from 'lodash';
import { FormattedMessage } from 'react-intl';

import api from '../../../api';
import createStream from '../../../../mastodon/stream';
import TweetButton from '../../../components/tweet_button';
import YouTubeArtwork from './youtube_artwork';
import SoundCloudArtwork from './soundcloud_artwork';
import AudioArtwork from './audio_artwork';

const PlatformHelp = () => {
  const platforms = [
    {
      icon: '/player/logos/pawoo-music.svg',
      title: 'Pawoo Music',
      url: 'https://music.pawoo.net/@[username]/[XXXXX…]',
    },
    {
      icon: '/player/logos/youtube.svg',
      title: 'YouTube',
      url: 'https://www.youtube.com/watch?v=[XXXXX……]',
    },
    {
      icon: '/player/logos/booth.svg',
      title: 'BOOTH',
      url: 'https://booth.pm/ja/items/[XXXXX……]',
    },
    {
      icon: '/player/logos/apollo.png',
      title: 'APOLLO',
      url: 'https://booth.pm/apollo/a06/item?id=[XXXXX……]',
    },
    {
      icon: '/player/logos/soundcloud.svg',
      title: 'SoundCloud',
      url: 'https://soundcloud.com/[username]/[trackname]',
    },
  ];

  return (
    <div className='deck__queue-add-form-help'>
      <i className='fa fa-question-circle deck__queue-add-form-help-icon' />
      <div className='deck__queue-add-form-help-popup'>
        <h3>対応プラットフォーム</h3>
        <ul>
          {platforms.map(({ icon, title, url }) => (
            <li key={title}>
              <img src={icon} />
              <div className='platform-info'>
                <div className='platform-info__title'>{title}</div>
                <div className='platform-info__url'>{url}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const LoadingArtwork = () => (
  <div className='queue-item__artwork'>
    <div className='loading' />
  </div>
);

class PlaylistController extends React.PureComponent {

  static propTypes = {
    offsetStartTime: PropTypes.number.isRequired,
    isTop: PropTypes.bool.isRequired,
    isAdmin: PropTypes.bool,
    isActive: PropTypes.bool.isRequired,
    isSeekbarActive: PropTypes.bool.isRequired,
    muted: PropTypes.bool.isRequired,
    volume: PropTypes.number.isRequired,
    duration: PropTypes.number,
    skipLimitTime: PropTypes.number,
    onSkip: PropTypes.func.isRequired,
    onToggleMute: PropTypes.func.isRequired,
    onChangeVolume: PropTypes.func.isRequired,
  };

  static defaultProps = {
    duration: 0,
    skipLimitTime: 0,
  };

  interval = null;

  timeOffset = 0;

  timeOffsetNode = null;

  playSeekbarNode = null;

  componentDidMount () {
    this.interval = setInterval(() => {
      const { offsetStartTime, duration } = this.props;
      const timeOffset = Math.floor(Date.now() / 1000 - offsetStartTime);
      if (timeOffset !== this.timeOffset) {
        this.timeOffset = timeOffset;
        if (this.timeOffsetNode) {
          this.timeOffsetNode.textContent = this.convertTimeFormat(Math.min(timeOffset, duration));
        }
        if (this.playSeekbarNode) {
          this.playSeekbarNode.style.width = `${(timeOffset / duration) * 100}%`;
        }
      }
    }, 1000);
  }

  componentWillUnmount () {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  isSkipEnable () {
    const { isActive, skipLimitTime, isAdmin } = this.props;
    return isAdmin || (isActive && skipLimitTime && this.timeOffset > skipLimitTime);
  }

  handleClickSkip = () => {
    if (this.isSkipEnable()) {
      this.props.onSkip();
    }
  }

  handleChangeVolume = (e) => {
    this.props.onChangeVolume(Number(e.target.value));
  }

  convertTimeFormat(time) {
    return `${Math.floor(time / 60)}:${('0' + (time % 60)).slice(-2)}`;
  }

  setPlaySeekbarNode = (playSeekbarNode) => {
    this.playSeekbarNode = playSeekbarNode;
  };

  setTimeOffsetNode = (timeOffsetNode) => {
    this.timeOffsetNode = timeOffsetNode;
  };

  render () {
    const { isTop, isActive, isSeekbarActive, duration, muted, volume } = this.props;

    return (
      <div className='control-bar__controller'>
        <div className='control-bar__controller-toggle-wrapper'>
          <div className={`control-bar__controller-toggle is-${muted ? 'pause' : 'playing'}`} onClick={this.props.onToggleMute}>
            <i className={`fa ${muted ? 'fa-play' : 'fa-volume-up'}`} />
          </div>
          <div className='control-bar__volume-slider'>
            <input className='vertical-slider' type='range' value={volume} min='0' max='100' step='1' onChange={this.handleChangeVolume} />
          </div>
        </div>

        {isActive && !isTop && (
          <div className='control-bar__controller-skip'>
            <span onClick={this.handleClickSkip}>SKIP</span>
          </div>
        )}

        {isActive && (
          <div className='control-bar__controller-info'>
            <span className='control-bar__controller-now' ref={this.setTimeOffsetNode}>--</span>
            <span className='control-bar__controller-separater'>/</span>
            <span className='control-bar__controller-time'>{this.convertTimeFormat(duration)}</span>
          </div>
        )}

        <div className={classNames('control-bar__controller-seek', { active: isSeekbarActive })} ref={this.setPlaySeekbarNode} />
      </div>
    );
  }

}

class PlayControl extends React.PureComponent {

  static contextTypes = {
    intl: PropTypes.object.isRequired,
  };

  static propTypes = {
    trackId: PropTypes.number,
    accessToken: PropTypes.string,
    streamingAPIBaseURL: PropTypes.string.isRequired,
    isAdmin: PropTypes.bool,
    isTop: PropTypes.bool.isRequired,
    onError: PropTypes.func.isRequired,
    onSkip: PropTypes.func.isRequired,
  };

  static defaultProps = {
    isAdmin: false,
  }

  interval = null;
  subscription = null;
  queues = [];
  defaultVolume = 80;
  state = {
    isOpen: false,
    isPlaying: false,
    isSp: window.innerWidth < 1024,
    targetDeck: null,
    playlist: this.createPlaylist(),
    deckList: [],
    deckSettings: null,
    timeOffset: 0,
    offsetStartTime: 0,
    isSeekbarActive: false,
    isLoadingArtwork: true,
    muted: true,
    volume: this.defaultVolume,
  };

  componentDidMount () {
    window.addEventListener('resize', this.handleResizeWindow);
    if (!this.state.isSp) {
      this.initDecks();
    }
  }

  componentWillReceiveProps = ({ trackId }) => {
    if (!this.state.muted && trackId !== this.props.trackId) {
      this.setState({ muted: true });
    }
  };

  componentDidUpdate (prevProps, prevState) {
    const { targetDeck } = this.state;
    if (prevState.targetDeck !== targetDeck) {
      if (targetDeck === null) {
        this.clearDecks();
      } else {
        this.fetchDeck(targetDeck);
        this.setSubscription(targetDeck);
        try {
          localStorage.setItem('LATEST_DECK', targetDeck);
        } catch (err) {}
      }
    }
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResizeWindow);
  }

  initDecks () {
    this.fetchDecks();
    this.interval = setInterval(() => {
      this.fetchDecks();
    }, 10 * 60 * 1000);
  }

  clearDecks () {
    if (this.subscription) {
      this.subscription.close();
      this.subscription = null;
    }
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.queues = [];
    this.setState({
      playlists: this.createPlaylist(),
    });
  }

  createPlaylist () {
    return this.queues.concat((new Array(10 - this.queues.length)).fill(null));
  }

  setSubscription (target) {
    // TODO: ソケットが正しくクローズされているかをしっかり調査する
    if(this.subscription) this.subscription.close();
    this.subscription = createStream(this.props.streamingAPIBaseURL, this.props.accessToken, `playlist&deck=${target}`, {
      received: (data) => {
        switch(data.event) {
        case 'add':
          {
            const payload = JSON.parse(data.payload);
            this.queues.push(payload);
            this.setState({
              playlist: this.createPlaylist(),
            });
          }
          break;
        case 'play':
          {
            if (this.queues.length >= 2) {
              this.queues.shift();
            }
            this.playNextQueueItem(0);
          }
          break;
        case 'end':
          {
            if (this.queues.length <= 1) {
              this.queues = [];
            }
            this.setState({
              playlist: this.createPlaylist(),
              timeOffset: 0,
              offsetStartTime: 0,
              isYoutubeLoadingDone: false,
              isPlaying: false,
            });
          }
          break;
        }
      },
    });
  }

  playNextQueueItem (timeOffset) {
    this.setState({
      playlist: this.createPlaylist(),
      isSeekbarActive: false,
      isLoadingArtwork: true,
      isPlaying: false,
      offsetStartTime: (new Date().getTime() / 1000) - timeOffset,
      timeOffset,
      isYoutubeLoadingDone: false,
    });

    // Animation用の遅延ローディング
    setTimeout(() => {
      this.setState({
        isSeekbarActive: true,
        isLoadingArtwork: false,
        isPlaying: this.isDeckActive(),
      });
    }, 20);
  }

  fetchDecks () {
    return api(this.getMockState).get('/api/v1/playlists')
      .then((response) => {
        const { decks, settings } = response.data;
        const newState = {
          deckList: decks,
          deckSettings: settings,
        };

        try {
          if (decks.length) {
            const targetDeck = Number(localStorage.getItem('LATEST_DECK'));
            newState.targetDeck = decks.find((deck) => deck.number === targetDeck) ? targetDeck : decks[0].number;
          } else {
            newState.targetDeck = null;
          }
        } catch (err) {}
        try {
          newState.volume = Number(localStorage.getItem('player_volume')) || this.defaultVolume;
        } catch (err) {}
        this.setState(newState);
      })
      .catch((error) => {
        this.props.onError(error);
      });
  }

  fetchDeck(id) {
    return api(this.getMockState).get(`/api/v1/playlists/${id}`)
      .then((response) => {
        const { time_offset: timeOffset, queues } = response.data.deck;
        this.queues = queues;
        this.playNextQueueItem(timeOffset);
      })
      .catch((error) => {
        this.props.onError(error);
      });
  }

  handleClickDeck = () => {
    this.setState({ isOpen: true });
  }

  handleClickOverlay = () => {
    this.setState({ isOpen: false });
  }

  handleClickDeckTab = (e) => {
    const number = Number(e.currentTarget.getAttribute('data-number'));
    if(number === this.state.targetDeck) return;
    if (this.isLoading()) return;

    this.setState({
      targetDeck: number,
      isSeekbarActive: false,
      isLoadingArtwork: true,
      isPlaying: false,
    });
  }

  handleSubmitAddForm = (e) => {
    e.preventDefault();
    return api(this.getMockState).post(`/api/v1/playlists/${this.state.targetDeck}/deck_queues`, { link: this.urlRef.value })
      .then(() => {
        this.urlRef.value = '';
      })
      .catch((error)=>{
        this.props.onError(error);
      });
  }

  handleClickToggleMute = () => {
    this.setState({ muted: (!this.state.muted) });
  }

  handleClickSkip = () => {
    const deckQueue = this.getDeckFirstQueue();
    if (deckQueue) {
      this.props.onSkip(this.state.targetDeck, deckQueue.id);
    }
  }

  handleChangeVolume = (volume) => {
    this.setState({ volume });
    try {
      localStorage.setItem('player_volume', volume);
    } catch (err) {}
  }

  handleCancelOpenDeck = (e) => {
    // クリック時にDeckが開かないように
    e.stopPropagation();
  }

  handleResizeWindow = debounce(() => {
    const isSp = window.innerWidth < 1024;
    if (this.state.isSp !== isSp) {
      this.setState({ isSp, targetDeck: null });
      if (!isSp) {
        this.initDecks();
      }
    }
  }, 200);

  getMockState = () => {
    return {
      getIn: () => this.props.accessToken,
    };
  }

  setURLRef = (c) => {
    this.urlRef = c;
  }

  getDeckFirstQueue() {
    return this.queues[0];
  }

  isDeckActive () {
    return Boolean(this.getDeckFirstQueue());
  }

  isLoading () {
    const { isLoadingArtwork, isYoutubeLoadingDone } = this.state;
    const deckQueue = this.getDeckFirstQueue();

    return isLoadingArtwork || (deckQueue && deckQueue.source_type === 'youtube' && !isYoutubeLoadingDone);
  }

  handleReadyYoutube = () => {
    this.setState({
      isYoutubeLoadingDone: true,
    });
  }

  renderDeckQueueCaption(text) {
    const queueItem = this.getDeckFirstQueue();
    const shareText = this.context.intl.formatMessage({
      id: 'pawoo_music.play_control.share_text',
      defaultMessage: 'Talking while listening to {info} with everyone♪ {link}',
    }, {
      info: queueItem ? (
        this.context.intl.formatMessage({ id: 'pawoo_music.play_control.share_text.info', defaultMessage: '"{info}"' }, { info: queueItem.info })
      ) : (
        this.context.intl.formatMessage({ id: 'pawoo_music.play_control.share_text.info_default', defaultMessage: 'music' })
      ),
      link: queueItem ? queueItem.link : '',
    });
    return (
      <div className='deck__queue-caption'>
        <span>- {text} -</span>
        <div onClick={this.handleCancelOpenDeck} style={{ display: 'inline-block', marginLeft: '3px', verticalAlign: 'bottom' }}>
          <TweetButton text={shareText} url='https://music.pawoo.net/' hashtags='PawooMusic' />
        </div>
      </div>
    );
  }

  renderQueueItem = (queue_item, i) => {
    return (
      <li key={queue_item ? queue_item.id : `empty-queue-item_${i}`} className='deck__queue-item'>
        <div className='queue-item__main'>
          <div>
            {!this.state.isOpen && i === 0 && this.renderDeckQueueCaption(<FormattedMessage
              id='pawoo_music.play_control.deck_queue_track'
              defaultMessage='Songs that people are listening now'
            />)}
            <div className='queue-item__metadata'>
              {this.queues.length === 0 && i === 0 ? (
                <FormattedMessage
                  id='pawoo_music.play_control.deck_queue_item-meta'
                  defaultMessage='Put your favorite songs in the playlist!'
                />
              ) : (queue_item && (
                <span className='queue-item__metadata-title'>{queue_item.info.length > 40 ? `${queue_item.info.slice(0, 40)}……` : queue_item.info}</span>
              ))}
            </div>
          </div>
        </div>
        <div className='queue-item__datasource'>
          {queue_item && (
            <a href={queue_item.link} target='_blank' onClick={this.handleCancelOpenDeck}>
              <img src={`/player/logos/${queue_item.source_type}.${queue_item.source_type === 'apollo' ? 'png' : 'svg'}`} />
            </a>
          )}
        </div>
      </li>
    );
  }

  renderArtwork () {
    const { isLoadingArtwork, isPlaying, timeOffset, muted, volume } = this.state;
    const deckQueue = this.getDeckFirstQueue();

    if (isLoadingArtwork) {
      return <LoadingArtwork />;
    }

    if (!deckQueue || !isPlaying) {
      return <div className='queue-item__artwork' />;
    }

    switch (deckQueue.source_type) {
    case 'youtube':
      return <YouTubeArtwork muted={muted} volume={volume} timeOffset={timeOffset} videoId={deckQueue.source_id} onReadyYoutube={this.handleReadyYoutube} />;
    case 'soundcloud':
      return <SoundCloudArtwork muted={muted} volume={volume} timeOffset={timeOffset} sourceId={deckQueue.source_id} />;
    case 'pawoo-music':
    case 'booth':
    case 'apollo':
      return <AudioArtwork muted={muted} volume={volume} timeOffset={timeOffset} musicUrl={deckQueue.music_url} thumbnailUrl={deckQueue.thumbnail_url} />;
    default:
      return <div className='queue-item__artwork' />;
    }
  }

  render () {
    const { isTop, isAdmin } = this.props;
    const { isSp, playlist, targetDeck, deckList, deckSettings, offsetStartTime, muted, volume, isSeekbarActive, isOpen } = this.state;
    if (isSp || !targetDeck) {
      return null;
    }

    const deckQueue = this.getDeckFirstQueue();
    const duration = deckQueue && deckQueue.duration;

    const index = deckList.findIndex((deck) => deck.number === targetDeck);
    const isApollo = deckList[index].type === 'apollo';
    const isWriteProtect = deckList[index].write_protect;
    const deckSelectorStyle = {
      transform: `translate(0, -${(this.state.isOpen) ? 0 : index * 56}px)`,
    };
    const playerClass = classNames('player-control', {
      'is-open': isOpen,
      'is-apollo': isApollo,
    });

    return (
      <div className={playerClass}>
        <div className='player-control__control-bar'>
          <PlaylistController
            offsetStartTime={offsetStartTime}
            isTop={isTop}
            isAdmin={isAdmin}
            isActive={this.isDeckActive()}
            isSeekbarActive={isSeekbarActive}
            muted={muted}
            duration={duration}
            volume={volume}
            skipLimitTime={deckSettings.skip_limit_time}
            onSkip={this.handleClickSkip}
            onToggleMute={this.handleClickToggleMute}
            onChangeVolume={this.handleChangeVolume}
          />
          <div className='control-bar__deck' onClick={this.handleClickDeck}>
            <ul className='control-bar__deck-selector'>
              {deckList.map((deck) => (
                <li
                  key={deck.number}
                  className={classNames('deck-selector__selector-body', {
                    active: deck.number === targetDeck,
                    'is-apollo': deck.type === 'apollo',
                    disabled: this.isLoading(),
                  })}
                  data-number={deck.number}
                  onClick={this.handleClickDeckTab}
                  style={deckSelectorStyle}
                >
                  <img alt={deck.type} src={deck.type === 'apollo' ? '/player/pawoo-music-playlist-apollo-icon.png' : '/player/pawoo-music-playlist-icon.svg'} />
                  <span>{deck.name}</span>
                </li>
              ))}
            </ul>
            <div className={classNames('deck_queue-wrapper', { 'is-apollo': isApollo })}>
              <div className='deck_queue-column'>
                {this.renderArtwork()}
                {isOpen && deckSettings && (
                  <div className='queue-item__restrictions'>
                    <div className='queue-item__restrictions-title'>
                      <i className='fa fa-fw fa-info-circle' />
                      <span>楽曲追加・SKIPについて（実験中）</span>
                    </div>
                    <ul className='queue-item__restrictions-list'>
                      <li>楽曲追加は<span className='queue-item__restrictions-num'>1時間に{deckSettings.max_add_count}回まで</span>です</li>
                      <li>SKIPの回数は<span className='queue-item__restrictions-num'>1時間に{deckSettings.max_skip_count}回まで</span>です</li>
                      <li>SKIPボタンは、<span className='queue-item__restrictions-num'>楽曲が始まってから<br />{deckSettings.skip_limit_time}秒後</span>に押せるようになります</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className='deck_queue-column deck__queue-column-list'>
                {this.state.isOpen && this.renderDeckQueueCaption(<FormattedMessage
                  id='pawoo_music.play_control.deck_queue_playlist'
                  defaultMessage='Playlist that people are listening now'
                />)}
                <ul className='deck__queue'>
                  {playlist.map(this.renderQueueItem)}
                  {!isTop && (
                    <li className='deck__queue-add-form'>
                      {isWriteProtect ? (
                        <div style={{ paddingTop: '20px' }}>Pawoo Musicに曲をアップロードすると、このプレイリストに曲が追加されます。</div>
                      ) : (
                        <form onSubmit={this.handleSubmitAddForm}>
                          <span>曲を追加</span>
                          <input ref={this.setURLRef} type='text' placeholder='URLを入力 (Pawoo Music, APOLLO(BOOTH), YouTube and SoundCloud URL)' required />
                          <PlatformHelp />
                          <input type='submit' value='追加' />
                        </form>
                      )}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className='player-control__overlay' onClick={this.handleClickOverlay} />
      </div>
    );
  }

}

export default PlayControl;
