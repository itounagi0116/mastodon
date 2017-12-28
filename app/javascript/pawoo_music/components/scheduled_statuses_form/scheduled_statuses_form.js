import React from 'react';
import ImmutablePureComponent from 'react-immutable-pure-component';
import ScheduledStatusesContainer from '../../containers/scheduled_statuses';
import StatusFormContainer from '../../containers/status_form';

export default class ScheduledStatusesForm extends ImmutablePureComponent {

  render () {
    return (
      <div className='scheduled-statuses-form'>
        <StatusFormContainer scheduling />
        <div className='statuses'><ScheduledStatusesContainer /></div>
      </div>
    );
  }

}
