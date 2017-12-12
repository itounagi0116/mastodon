import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import querystring from 'querystring';
import { debounce } from 'lodash';
import { connect } from 'react-redux';
import classNames from 'classnames';
import StatusReactions from '../status_reactions';
import Track from '../track';
import Icon from '../../components/icon';

import pawooIcon from '../../../images/pawoo_music/pawoo_icon.svg';

import '../app/app.scss';

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
    status: ImmutablePropTypes.map.isRequired,
    trackIsMounted: PropTypes.bool.isRequired,
  }

  state = {
    showIcon: false,
  };

  handleMouseEnter = () => {
    this.setState({ showIcon: true });
    this.hideLogoDebounce();
  }

  handleMouseMove = () => {
    this.setState({ showIcon: true });
    this.hideLogoDebounce();
  }

  handleMouseLeave = () => {
    this.setState({ showIcon: false });
  }

  hideLogoDebounce = debounce(() => {
    this.setState({ showIcon: false });
  }, 3000);

  renderUIs () {
    const { acct, status, trackIsMounted } = this.props;
    const { showIcon } = this.state;
    const id = status.get('id');
    const track = status.get('track');
    const params = location.search.length > 1 ? querystring.parse(location.search.substr(1)) : {};
    const hideInfo = params.hideinfo && Number(params.hideinfo) === 1;

    if (trackIsMounted) {
      return (
        <div className='meta'>
          <a className={classNames('icon-link', { visible: showIcon })} href={`/@${acct}/${id}`} target='_blank'>
            <img src={pawooIcon} alt='Pawoo Music' />
          </a>
        </div>
      );
    }

    if (!hideInfo) {
      return (
        <div className='embed-ui'>
          <div className='info'>
            <div className='meta'>
              <a className='playlist_toggle' href='hogehoge'>ALBUM PLAYLIST <Icon icon='chevron-down' /></a><br />
              <a className='artist' href={`/@${acct}`}       target='_blank'>{track.get('artist')}</a><br />
              <a className='title'  href={`/@${acct}/${id}`} target='_blank'>{track.get('title')} </a>
            </div>
            <div className='actions'>
              <div className='follow'>作家の新作を自動受信</div>
              <Icon className='share' icon='share-2' />
            </div>
          </div>

          <StatusReactions status={status} />

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
        </div>
      );
    }

    return (
      <div />
    );
  }


  render () {
    const { status } = this.props;

    return (
      <div
        className='app embed-musicvideo'
        onMouseEnter={this.handleMouseEnter}
        onMouseMove={this.handleMouseMove}
        onMouseLeave={this.handleMouseLeave}
      >
        <Track track={status.get('track')} fitContain />
        {this.renderUIs()}
      </div>
    );
  }

}
