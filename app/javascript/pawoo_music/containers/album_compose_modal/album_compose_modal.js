import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AlbumComposeContainer from '../album_compose';
import Delay from '../../components/delay';
import { hideAlbumComposeModal } from '../../actions/album_compose';

const mapStateToProps = (state) => ({
  modal: !!state.getIn(['pawoo_music', 'album_compose', 'modal']),
});

@connect(mapStateToProps)
export default class AlbumComposeModal extends PureComponent {

  static propTypes = {
    modal: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  handleStopCompose = () => {
    this.props.dispatch(hideAlbumComposeModal());
  };

  render () {
    const { modal } = this.props;

    return (
      <Delay className='album-compose-modal'>
        {modal && (
          <div className='album-compose-modal-body'>
            <AlbumComposeContainer onClose={this.handleStopCompose} />
          </div>
        )}
      </Delay>
    );
  }

}
