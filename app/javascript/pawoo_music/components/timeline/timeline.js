import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import GlobalNaviContainer from '../../containers/global_navi';
import classNames from 'classnames';
import { isMobile } from '../../util/is_mobile';

const mapStateToProps = state => ({
  target: state.getIn(['pawoo_music', 'column', 'target']),
});

@connect(mapStateToProps)
export default class Timeline extends PureComponent {

  static propTypes = {
    target: PropTypes.string.isRequired,
    children: PropTypes.node,
    gallery: PropTypes.node,
    galleryStyle: PropTypes.object,
  }

  render () {
    const { target, children, gallery, galleryStyle } = this.props;
    const mobile = isMobile();

    return (
      <div className={classNames('timeline', { [target] : mobile })}>
        <div className='navigation-column'>
          <GlobalNaviContainer />
        </div>
        <div className={classNames('lobby-column', { 'with-gallery': gallery })}>
          {children}
        </div>
        {gallery && (
          <div className='gallery-column' style={galleryStyle}>
            {gallery}
          </div>
        )}
      </div>
    );
  }

}
