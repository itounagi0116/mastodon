import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { debounce } from 'lodash';
import { connect } from 'react-redux';
import classNames from 'classnames';
import noop from 'lodash/noop';
import StatusReactions from '../status_reactions';
import Track from '../track';
import Icon from '../../components/icon';
import FollowButton from '../follow_button';
import { fetchRelationships } from '../../../mastodon/actions/accounts';
import { isMobile } from '../../util/is_mobile';

import '../app/app.scss';

const mobile = isMobile();

const mapStateToProps = (state, { statusId }) => {
  const status = state.getIn(['statuses', statusId]);

  return {
    acct: state.getIn(['accounts', status.get('account'), 'acct']),
    status,
    trackIsMounted: Immutable.List(['statuses', statusId, 'track']).equals(
      state.getIn(['pawoo_music', 'player', 'trackPath'])),
  };
};

@connect(mapStateToProps)
export default class EmbedMusicvideo extends React.PureComponent {

  static propTypes = {
    acct: PropTypes.string,
    infoHidden: PropTypes.bool,
    preview: PropTypes.bool,
    status: ImmutablePropTypes.map.isRequired,
    trackIsMounted: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
  }

  state = {
    visibleControls: false,
  };

  componentDidMount () {
    const { status } = this.props;
    const accountId = status.get('account');

    this.props.dispatch(fetchRelationships([accountId]));
  }

  handleClick = () => {
    const { visibleInfo } = this.state;

    if (!visibleInfo) {
      // クリックした瞬間に、非表示だった要素もクリックしないように少し遅らせる
      // stopPropagationはTrackまでイベントが伝搬されなくなるので使わない
      setTimeout(() => {
        this.changeVisibleControls();
      }, 10);
    }
  }

  handleMouseEnter = () => {
    this.changeVisibleControls();
  }

  handleMouseMove = () => {
    this.changeVisibleControls();
  }

  handleMouseLeave = () => {
    this.active = false;
    this.setState({ visibleControls: false });
  }

  hideLogoDebounce = debounce(() => {
    this.setState({ visibleControls: this.active });
  }, 3000);

  changeVisibleControls () {
    this.setState({ visibleControls: true });
    this.hideLogoDebounce();
  }

  handleActive = () => {
    this.active = true;
  }

  handleInactive = () => {
    this.active = false;
  }

  renderInfo () {
    const { acct, infoHidden, preview, status, trackIsMounted } = this.props;
    const { visibleControls } = this.state;
    const id = status.get('id');
    const track = status.get('track');
    const visible = !trackIsMounted || visibleControls;

    if (!trackIsMounted && infoHidden) {
      return (
        <div className='embed-ui' />
      );
    }

    return (
      <div className={classNames('embed-ui', { visible })}>
        {visible && (
          <div className='info'>
            <div className='meta'>
              <a className='artist' href={`/@${acct}`} target='_blank'>{track.get('artist')}</a><br />
              <a className='title' href={`/@${acct}/${id}`} target='_blank'>{track.get('title')}</a>
            </div>
            <div className='actions'>
              <FollowButton id={status.get('account')} dummy={preview && 'follow'} onlyFollow embed />
              <StatusReactions
                onActive={this.handleActive}
                onInactive={this.handleInactive}
                status={status}
              />
            </div>
          </div>
        )}
        {null &&
        <ul className='album_playlist'>
          <li><Icon icon='pause' /> 01. hogehogesong</li>
          <li className='playing'><Icon icon='play' /> 02. hogehogesong</li>
          <li><Icon icon='pause' /> 03. hogehogesongasdfasdfasdfasdfasdfasdfasdfasdfasdf</li>
          <li><Icon icon='pause' /> 04. hoge hoge hoge hoge hoge hoge hoge hoge hoge hoge hoge hoge hoge hoge hoge hoge</li>
          <li><Icon icon='pause' /> 05. hogehogesong</li>
          <li><Icon icon='pause' /> 06. hogehogesongasdfasdfasdfasdfasdfasdfngasdfasdfasdfasdfasdfasdfngasdfasdfasdfasdfasdfasdfasdfasdfasdf</li>
          <li><Icon icon='pause' /> 07. あああああああああああああああああああああああああああああああああああああああ</li>
          <li><Icon icon='pause' /> 08. 負け犬の歌</li>
          <li><Icon icon='pause' /> 09. hogehogesongasdfasdfasdfasdfasdfasdfasdfasdfasdf</li>
          <li><Icon icon='pause' /> 10. hoge hoge hoge hoge hoge hoge hoge hoge</li>
          <li><Icon icon='pause' /> 11. hogehogesong</li>
          <li><Icon icon='pause' /> 12. hogehogesongasdfasdfasdfasdfasdfasdfasdfasdfasdf</li>
          <li><Icon icon='pause' /> 13. hoge hoge hoge hoge hoge hoge hoge hoge</li>
          <li><Icon icon='pause' /> 14. hogehogesong</li>
        </ul>
        }
      </div>
    );
  }


  render () {
    const { status } = this.props;
    const { visibleControls } = this.state;

    return (
      <div
        className='app embed-musicvideo'
        onClickCapture={mobile ? this.handleClick : noop}
        role='button'
        aria-pressed='false'
        onMouseEnter={mobile ? noop : this.handleMouseEnter}
        onMouseMove={mobile ? noop : this.handleMouseMove}
        onMouseLeave={mobile ? noop : this.handleMouseLeave}
      >
        <Track overriddenControlVisibility={visibleControls} track={status.get('track')} fitContain />
        {this.renderInfo()}
      </div>
    );
  }

}
