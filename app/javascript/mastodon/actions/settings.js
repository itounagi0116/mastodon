import api from '../api';

export const SETTING_CHANGE = 'SETTING_CHANGE';

export function changeSetting(key, value) {
  return dispatch => {
    dispatch({
      type: SETTING_CHANGE,
      key,
      value,
    });

    if (key.length === 3 && key[0] === 'notifications' && key[1] === 'alerts' && value) {
      Notification.requestPermission().then(result => dispatch(result === 'granted' ? saveSettings() : {
        type: SETTING_CHANGE,
        key,
        value: false,
      }));
    } else {
      dispatch(saveSettings());
    }
  };
};

export function saveSettings() {
  return (_, getState) => {
    api().put('/api/web/settings', {
      data: getState().get('settings').toJS(),
    });
  };
};
