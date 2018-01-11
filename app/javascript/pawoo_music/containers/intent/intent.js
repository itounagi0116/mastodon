import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import AccountContainer from '../account';
import StatusFormContainer from '../status_form';
import Timeline from '../../components/timeline';

const mapStateToProps = (state) => ({
  me: state.getIn(['meta', 'me']),
});

@connect(mapStateToProps)
export default class IntentContainer extends React.PureComponent {

  static propTypes = {
    me: PropTypes.number,
  };

  render () {
    return (
      <Timeline>
        <div className='intent'>
          <AccountContainer id={this.props.me} />
          <StatusFormContainer />
        </div>
      </Timeline>
    );
  }

}
