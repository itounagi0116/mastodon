import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import StatusReactions from '../status_reactions';
import Track from '../track';
import FollowButton from '../follow_button';
import EmbeddedMeta from '../../components/embedded_meta';
import { fetchRelationships } from '../../../mastodon/actions/accounts';

import '../app/app.scss';

const mapStateToProps = (state, { statusId }) => {
  const status = state.getIn(['statuses', statusId]);

  return {
    acct: state.getIn(['accounts', status.get('account'), 'acct']),
    status,
  };
};

@connect(mapStateToProps)
export default class EmbeddedTrack extends React.PureComponent {

  static propTypes = {
    acct: PropTypes.string,
    infoHidden: PropTypes.bool,
    preview: PropTypes.bool,
    status: ImmutablePropTypes.map.isRequired,
    dispatch: PropTypes.func.isRequired,
  }

  state = {
    controlsActive: false,
  };

  componentDidMount () {
    const { status } = this.props;
    const accountId = status.get('account');

    this.props.dispatch(fetchRelationships([accountId]));
  }

  handleActive = () => {
    this.setState({ controlsActive: true });
  }

  handleInactive = () => {
    this.setState({ controlsActive: false });
  }

  render () {
    const { acct, infoHidden, preview, status } = this.props;
    const { controlsActive } = this.state;
    const id = status.get('id');
    const track = status.get('track');

    return (
      <div className='app embedded-track'>
        <Track controlsActive={controlsActive} track={track} fitContain>
          {infoHidden || (
            <div className='info'>
              <EmbeddedMeta acct={acct} statusId={id} artist={track.get('artist')} title={track.get('title')} />
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
        </Track>
      </div>
    );
  }

}
