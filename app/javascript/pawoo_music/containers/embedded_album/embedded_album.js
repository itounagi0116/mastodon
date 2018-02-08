import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { fetchRelationships } from '../../../mastodon/actions/accounts';
import Album from '../album';
import FollowButton from '../follow_button';
import AlbumTracksCount from '../../components/album_tracks_count';
import EmbeddedMeta from '../../components/embedded_meta';

const mapStateToProps = (state, { statusId }) => {
  const status = state.getIn(['statuses', statusId]);

  return {
    acct: state.getIn(['accounts', status.get('account'), 'acct']),
    status,
  };
};

@connect(mapStateToProps)
export default class EmbeddedAlbum extends ImmutablePureComponent {

  static propTypes = {
    acct: PropTypes.string,
    infoHidden: PropTypes.bool,
    preview: PropTypes.bool,
    status: ImmutablePropTypes.map.isRequired,
    dispatch: PropTypes.func.isRequired,
  }

  componentDidMount () {
    const { status } = this.props;
    const accountId = status.get('account');

    this.props.dispatch(fetchRelationships([accountId]));
  }

  render () {
    const { acct, infoHidden, preview, status } = this.props;
    const id = status.get('id');
    const album = status.get('album');

    return (
      <div className='app embedded-album'>
        <Album album={album} fitContain>
          {infoHidden ? null : (
            <div className='embedded-album-info'>
              <div className='meta'>
                <EmbeddedMeta acct={acct} statusId={id} artist={album.get('artist')} title={album.get('title')} />
              </div>
              <div className='actions'>
                <FollowButton id={status.get('account')} dummy={preview && 'follow'} onlyFollow embed />
                <AlbumTracksCount value={album.get('tracks_count')} />
              </div>
            </div>
          )}
        </Album>
      </div>
    );
  }

}
