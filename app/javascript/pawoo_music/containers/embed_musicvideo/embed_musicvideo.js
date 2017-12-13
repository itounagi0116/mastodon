import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import querystring from 'querystring';
import { connect } from 'react-redux';
import StatusReactions from '../status_reactions';
import Track from '../track';
import Icon from '../../components/icon';
import { isMobile } from '../../util/is_mobile';

import '../app/app.scss';

const params = location.search.length > 1 ? querystring.parse(location.search.substr(1)) : {};
const hideInfo = params.hideinfo && Number(params.hideinfo) === 1;
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
    status: ImmutablePropTypes.map.isRequired,
    trackIsMounted: PropTypes.bool.isRequired,
  }

  renderUIs () {
    const { acct, status } = this.props;
    const id = status.get('id');
    const track = status.get('track');

    return (
      <div className='embed-ui'>
        <div className='info'>
          <div className='meta'>
            <a className='playlist_toggle' href='hogehoge'><b>10</b>tracks<Icon icon='chevron-down' /></a><br />
            <a className='artist' href={`/@${acct}`}       target='_blank'>{track.get('artist')}</a><br />
            <a className='title'  href={`/@${acct}/${id}`} target='_blank'>{track.get('title')} </a>
          </div>
          <div className='actions'>
            <div className='follow'>新作情報を自動受信</div>
            <Icon className='share' icon='share-2' />
          </div>
        </div>
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


  render () {
    const { status, trackIsMounted } = this.props;
    const showUIs = !hideInfo && (mobile || trackIsMounted);

    return (
      <div
        className='app embed-musicvideo'
        onMouseEnter={this.handleMouseEnter}
        onMouseMove={this.handleMouseMove}
        onMouseLeave={this.handleMouseLeave}
      >
        <Track track={status.get('track')} fitContain />
        {showUIs && this.renderUIs()}
        {showUIs && <StatusReactions status={status} />}
      </div>
    );
  }

}
