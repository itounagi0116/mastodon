import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { connect } from 'react-redux';
import MusicStatusContainer from '../music_status';
import { fetchContainedAlbums } from '../../actions/tracks';
import { closeModal } from '../../../mastodon/actions/modal';

const mapStateToProps = (state, { id }) => ({
  containedAlbums: state.getIn(['pawoo_music', 'tracks', 'containedAlbums', id]),
});

@connect(mapStateToProps)
export default class ContainedAlbumsModalContent extends ImmutablePureComponent {

  static propTypes = {
    id: PropTypes.number.isRequired,
    containedAlbums: ImmutablePropTypes.list,
    dispatch: PropTypes.func.isRequired,
  };

  static contextTypes = {
    router: PropTypes.object,
  };

  componentDidMount = () => {
    const { id, dispatch } = this.props;

    dispatch(fetchContainedAlbums(id));
    this.unlisten = this.context.router.history.listen(() => {
      dispatch(closeModal());
    });
  };

  componentWillUnmount = () => {
    if (this.unlisten) {
      this.unlisten();
    }
  };

  render () {
    const { containedAlbums } = this.props;

    const content = containedAlbums && containedAlbums.map((id) => (
      <MusicStatusContainer id={id} key={id} />
    ));

    return (
      <div className='contained-albums gallery-column'>
        {content}
      </div>
    );
  }

}
