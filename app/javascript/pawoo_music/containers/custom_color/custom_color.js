import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ImmutablePureComponent from 'react-immutable-pure-component';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { SketchPicker } from 'react-color';
import { defineMessages, injectIntl } from 'react-intl';
import ColorTrigger from '../../components/color_trigger';
import Delay from '../../components/delay/delay';
import AccountHeaderContainer from '../account_header';
import StatusContainer from '../status';
import { refreshAccountTimeline } from '../../../mastodon/actions/timelines';
import { makeGetAccount } from '../../../mastodon/selectors';
import { constructRgbCode, constructRgbObject, extractRgbFromRgbObject } from '../../util/musicvideo';

const messages = defineMessages({
  textcolor: { id: 'custom_color.textcolor', defaultMessage: 'Text color' },
  linkcolor: { id: 'custom_color.linkcolor', defaultMessage: 'Link color 1' },
  linkcolor2: { id: 'custom_color.linkcolor2', defaultMessage: 'Link color 2' },
  strong1: { id: 'custom_color.strong1', defaultMessage: 'Strong color 1' },
  strong2: { id: 'custom_color.strong2', defaultMessage: 'Strong color 2' },
  color1: { id: 'custom_color.color1', defaultMessage: 'Background color 1' },
  color2: { id: 'custom_color.color2', defaultMessage: 'Background color 2' },
  color3: { id: 'custom_color.color3', defaultMessage: 'Background color 3' },

  preview: { id: 'custom_color.preview', defaultMessage: 'Preview' },
});

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();

  const mapStateToProps = (state) => {
    const accountId = state.getIn(['meta', 'me']);

    return {
      account: getAccount(state, accountId),
      statusId: state.getIn(['timelines', `account:${accountId}`, 'items', 0]),
    };
  };

  return mapStateToProps;
};

const colorKeys = ['textcolor', 'linkcolor', 'linkcolor2', 'strong1', 'strong2', 'color1', 'color2', 'color3'];

function getCustomColorFromInputTag() {
  return colorKeys.reduce((map, key) => (
    map.set(key, Number(document.getElementById(`account_custom_color_${key}`).value))
  ), Immutable.Map());
}

function setCustomColorToInputTag(key, value) {
  document.getElementById(`account_custom_color_${key}`).value = value;
}

@injectIntl
@connect(makeMapStateToProps)
export default class CustomColor extends ImmutablePureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    account: ImmutablePropTypes.map.isRequired,
    statusId: PropTypes.number,
    intl: PropTypes.object.isRequired,
  };

  state = {
    customColor: getCustomColorFromInputTag(),
    visibleColorPicker: null,
  }

  componentDidMount () {
    const { dispatch, account } = this.props;

    document.addEventListener('click', this.handleColorPickerHide, false);
    this.appendStyle();
    dispatch(refreshAccountTimeline(account.get('id')));
  }

  componentDidUpdate (prevProps, prevState) {
    if (!Immutable.is(prevState.customColor, this.state.customColor)) {
      this.removeStyle();
      this.appendStyle();
    }
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleColorPickerHide, false);
    this.removeStyle();
  }

  appendStyle () {
    const { customColor } = this.state;

    const customStyles = customColor.entrySeq().map(([key, value]) => `--${key}:${constructRgbCode(value, 1)};`);
    const css = `body {${customStyles.join('')}}`;

    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');

    style.type = 'text/css';
    style.id = 'user-style-setting';

    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  }

  removeStyle () {
    const style = document.getElementById('user-style-setting');

    if (style) {
      const head = document.head || document.getElementsByTagName('head')[0];
      head.removeChild(style);
    }
  }

  handleColorPickerHide = (event) => {
    let node = event.target;
    let inside = false;
    while (node && node.tagName !== 'BODY') {
      if (node.classList.contains('color-trigger') || node.classList.contains('sketch-picker') ) {
        inside = true;
        break;
      }
      node = node.parentNode;
    }
    if (!inside) {
      this.setState({ visibleColorPicker: null });
    }
  };

  handleToggleColorPickerVisible = colorKeys.reduce((obj, key) => {
    obj[key] = () => {
      const { visibleColorPicker } = this.state;
      this.setState({ visibleColorPicker: visibleColorPicker === key ? null : key });
    };
    return obj;
  }, {})

  handleChangeColor = ({ rgb }) => {
    const { customColor, visibleColorPicker: key } = this.state;
    if (key) {
      const value = extractRgbFromRgbObject(rgb);
      this.setState({ customColor: customColor.set(key, value) });
      setCustomColorToInputTag(key, value);
    }
  }

  renderColorSelector = ([key, color]) => {
    const { intl } = this.props;

    return (
      <label className='color-selector' key={key}>
        <div className='text'>{intl.formatMessage(messages[key])}</div>
        <input type='hidden' name={`custom_color[${key}]`} value={color} />
        <ColorTrigger
          alpha={1}
          color={color}
          onClick={this.handleToggleColorPickerVisible[key]}
        />
      </label>
    );
  }

  render () {
    const { account, statusId, intl } = this.props;
    const { customColor, visibleColorPicker } = this.state;

    return (
      <div className='custom-color'>
        <div className='form-content'>
          <div className='color-selectors'>
            {customColor.entrySeq().map(this.renderColorSelector)}
          </div>
          <Delay>
            {visibleColorPicker && (
              <SketchPicker
                color={constructRgbObject(customColor.get(visibleColorPicker), 1)}
                disableAlpha
                onChange={this.handleChangeColor}
              />
            )}
          </Delay>
        </div>
        <hr />
        <h6>{intl.formatMessage(messages.preview)}</h6>
        <div className='preview'>
          <AccountHeaderContainer account={account} />
          {statusId && <StatusContainer id={statusId} />}
        </div>
      </div>
    );
  }

}
