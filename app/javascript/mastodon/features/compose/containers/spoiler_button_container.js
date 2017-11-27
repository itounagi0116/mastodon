import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from '../../../../pawoo_music/components/icon';
import { changeComposeSpoilerness } from '../../../actions/compose';
import { injectIntl, defineMessages } from 'react-intl';
import { switchCompose } from '../../../selectors';

const messages = defineMessages({
  title: { id: 'compose_form.spoiler', defaultMessage: 'Hide text behind warning' },
});

const mapStateToProps = (state, props) => {
  state = switchCompose(state, props);
  const { intl } = props;

  return {
    title: intl.formatMessage(messages.title),
    active: state.getIn(['compose', 'spoiler']),
    ariaControls: 'cw-spoiler-input',
  };
};

const mapDispatchToProps = dispatch => ({

  onClick () {
    dispatch(changeComposeSpoilerness());
  },

});

class SpoilerButton extends React.PureComponent {

  static propTypes = {
    active: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  render () {
    const { active, onClick, intl } = this.props;
    const icon = 'alert-triangle';
    const className = classNames('compose-form__spoiler-button');

    return (
      <div className={className}>
        <Icon
          className='compose-form__spoiler-button__icon'
          title={intl.formatMessage(messages.title)}
          icon={icon}
          onClick={onClick}
          active={active}
          strong
          scale
        />
      </div>
    );
  }

}

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(SpoilerButton));
