import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { closeModal } from '../../../mastodon/actions/modal';
import { changeAlerts, saveSettings } from '../../../mastodon/actions/push_notifications';
import { subscribeAndSet } from '../../../mastodon/web_push_subscription';
import SettingToggle from '../../../mastodon/features/notifications/components/setting_toggle';
import Button from '../../components/button';
import { isMobile } from '../../util/is_mobile';

const messages = defineMessages({
  mention: { id: 'account.mention', defaultMessage: 'Mention @{name}' },
  favourite: { id: 'pawoo_music.push_settings.preferences.toggle.favourite', defaultMessage: 'Favourites' },
  follow: { id: 'pawoo_music.push_settings.preferences.toggle.follow', defaultMessage: 'New followers' },
  mention: { id: 'pawoo_music.push_settings.preferences.toggle.mention', defaultMessage: 'Mentions' },
  newTrack: { id: 'pawoo_music.push_settings.preferences.toggle.new_track', defaultMessage: 'New tracks posted by those you follow' },
  reblog: { id: 'pawoo_music.push_settings.preferences.toggle.reblog', defaultMessage: 'Boosts' },
});

const mapStateToProps = state => ({
  settings: state.get('push_notifications'),
});

const mapDispatchToProps = dispatch => ({
  onChange(key, checked) {
    dispatch(changeAlerts(key, checked));
  },

  onClose() {
    dispatch(closeModal());
  },

  onSave() {
    dispatch(saveSettings());
  },
});

@connect(mapStateToProps, mapDispatchToProps)
@injectIntl
export default class PushSettingsInitializerModal extends ImmutablePureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    onSave: PropTypes.func.isRequired,
    registration: PropTypes.object.isRequired,
    settings: ImmutablePropTypes.map.isRequired,
  };

  state = {
    scene: 'Preferences',
  };

  handleSubscribe = () => {
    this.setState({ scene: 'Pending' });

    subscribeAndSet(this.props.registration).then(() => {
      this.props.onSave();
      this.setState({ scene: 'Success' });
    }, error => {
      this.setState({ scene: error.name === 'NotAllowedError' ? 'NotAllowed' : 'Error' });
    });
  }

  render () {
    switch (this.state.scene) {
    case 'Preferences':
      return (
        <div className='push-settings-initializer-modal'>
          <h1>
            <FormattedMessage
              id='pawoo_music.push_settings.preferences.title'
              defaultMessage='Push Notification Settings'
            />
          </h1>
          <div className='description'>
            <p>
              {isMobile() ? (
                <FormattedMessage
                  id='pawoo_music.push_settings.preferences.description.mobile'
                  defaultMessage='You can receive the latest information about new tracks and other activties anytime.'
                />
              ) : (
                <FormattedMessage
                  id='pawoo_music.push_settings.preferences.description.pc'
                  defaultMessage='You can receive the latest information about new tracks and other activties while your browser is open.'
                />
              )}</p>
            <p>
              <FormattedMessage
                id='pawoo_music.push_settings.preferences.description.toggle'
                defaultMessage='Please choose activities you would like to be notified about:'
              />
            </p>
          </div>
          <div className='body'>
            <div className='toggles'>
              <div className='toggle-column'>
                <div>
                  <SettingToggle prefix='notifications_push' settings={this.props.settings} settingKey={['alerts', 'follow']} onChange={this.props.onChange} label={this.props.intl.formatMessage(messages.follow)} />
                  <SettingToggle prefix='notifications_push' settings={this.props.settings} settingKey={['alerts', 'favourite']} onChange={this.props.onChange} label={this.props.intl.formatMessage(messages.favourite)} />
                </div>
                <div>
                  <SettingToggle prefix='notifications_push' settings={this.props.settings} settingKey={['alerts', 'mention']} onChange={this.props.onChange} label={this.props.intl.formatMessage(messages.mention)} />
                  <SettingToggle prefix='notifications_push' settings={this.props.settings} settingKey={['alerts', 'reblog']} onChange={this.props.onChange} label={this.props.intl.formatMessage(messages.reblog)} />
                </div>
              </div>
              <SettingToggle prefix='notifications_push' settings={this.props.settings} settingKey={['alerts', 'new_track']} onChange={this.props.onChange} label={this.props.intl.formatMessage(messages.newTrack)} />
            </div>
          </div>
          <div className='button-wrapper'>
            <Button onClick={this.handleSubscribe}>
              <FormattedMessage
                id='pawoo_music.push_settings.preferences.save'
                defaultMessage='Save'
              />
            </Button>
          </div>
        </div>
      );

    case 'Pending':
      return (
        <div className='push-settings-initializer-modal'>
          <h1>
            <FormattedMessage
              id='pawoo_music.push_settings.pending.title'
              defaultMessage='Enabling Notifications'
            />
          </h1>
          <div className='body description'>
            <p>
              <FormattedMessage
                id='pawoo_music.push_settings.pending.description'
                defaultMessage='Please check if there is a dialog window to confirm your notification preferences.'
              />
            </p>
          </div>
        </div>
      );

    case 'NotAllowed':
      return (
        <div className='push-settings-initializer-modal'>
          <h1>
            <FormattedMessage
              id='pawoo_music.push_settings.not_allowed.title'
              defaultMessage='Notification Configuration Has Been Canceled'
            />
          </h1>
          <div className='body description'>
            <p>
              <FormattedMessage
                id='pawoo_music.push_settings.generic_end.description'
                defaultMessage='You can change the notification configuration later by chosing "Timeline" in "Preferences" page.'
              />
            </p>
          </div>
          <div className='button-wrapper'>
            <Button onClick={this.props.onClose}>
              <FormattedMessage
                id='pawoo_music.push_settings.generic_end.button'
                defaultMessage='OK'
              />
            </Button>
          </div>
        </div>
      );

    case 'Error':
      return (
        <div className='push-settings-initializer-modal'>
          <h1>
            <FormattedMessage
              id='pawoo_music.push_settings.error.title'
              defaultMessage='Notification Configuration Has Been Failed'
            />
          </h1>
          <div className='body description'>
            <p>
              <FormattedMessage
                id='pawoo_music.push_settings.generic_end.description'
                defaultMessage='You can change the notification configuration later by chosing "Timeline" in "Preferences" page.'
              />
            </p>
          </div>
          <div className='button-wrapper'>
            <Button onClick={this.props.onClose}>
              <FormattedMessage
                id='pawoo_music.push_settings.generic_end.button'
                defaultMessage='OK'
              />
            </Button>
          </div>
        </div>
      );

    case 'Success':
      return (
        <div className='push-settings-initializer-modal'>
          <h1>
            <FormattedMessage
              id='pawoo_music.push_settings.success.title'
              defaultMessage='Notifications Have Been Configured'
            />
          </h1>
          <div className='body description'>
            <p>
              <FormattedMessage
                id='pawoo_music.push_settings.generic_end.description'
                defaultMessage='You can change the notification configuration later by chosing "Timeline" in "Preferences" page.'
              />
            </p>
          </div>
          <div className='button-wrapper'>
            <Button onClick={this.props.onClose}>
              <FormattedMessage
                id='pawoo_music.push_settings.generic_end.button'
                defaultMessage='OK'
              />
            </Button>
          </div>
        </div>
      );

    default:
      throw new Error;
    }
  }

}
