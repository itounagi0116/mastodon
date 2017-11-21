import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import Icon from '../../components/icon';
import AccountContainer from '../account';
import StatusContainer from '../..//containers/status';
import HashtagLink from '../../components/hashtag_link/';
import { changeSearch, clearSearch, submitSearch } from '../../../mastodon/actions/search';


const messages = defineMessages({
  placeholder: { id: 'search.placeholder', defaultMessage: 'Search' },
});

const mapStateToProps = state => ({
  value: state.getIn(['search', 'value']),
  submitted: state.getIn(['search', 'submitted']),
  results: state.getIn(['search', 'results']),
  searchKeyword: state.getIn(['search', 'value']),
});

@injectIntl
@connect(mapStateToProps)
export default class Searchbox extends ImmutablePureComponent {

  static propTypes = {
    value: PropTypes.string.isRequired,
    submitted: PropTypes.bool,
    results: ImmutablePropTypes.map.isRequired,
    searchKeyword: PropTypes.string,
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  handleChange = (e) => {
    const { dispatch } = this.props;

    dispatch(changeSearch(e.target.value));
  }

  handleClear = (e) => {
    const { dispatch, value, submitted } = this.props;
    e.preventDefault();

    if (value.length > 0 || submitted) {
      dispatch(clearSearch());
    }
  }

  handleKeyDown = (e) => {
    const { dispatch } = this.props;

    if (e.key === 'Enter') {
      e.preventDefault();
      dispatch(submitSearch());
    }
  }

  render() {
    const { value, submitted, results, intl } = this.props;
    let accounts, statuses, hashtags;
    let count = 0;

    if (results.get('accounts') && results.get('accounts').size > 0) {
      count += results.get('accounts').size;
      accounts = (
        <ul>
          {results.get('accounts').map(accountId => <li key={accountId}><AccountContainer id={accountId} /></li>)}
        </ul>
      );
    }

    if (results.get('statuses') && results.get('statuses').size > 0) {
      count += results.get('statuses').size;
      statuses = (
        <ul>
          {results.get('statuses').map(statusId => <li key={statusId}><StatusContainer id={statusId} /></li>)}
        </ul>
      );
    }

    if (results.get('hashtags') && results.get('hashtags').size > 0) {
      count += results.get('hashtags').size;
      hashtags = (
        <ul>
          {results.get('hashtags').map(hashtag => <li key={hashtag}><HashtagLink hashtag={hashtag} /></li>)}
        </ul>
      );
    }

    return (
      <div className='search-box'>
        <Icon icon='search' />
        <input
          type='text'
          placeholder={intl.formatMessage(messages.placeholder)}
          value={value}
          onChange={this.handleChange}
          onKeyUp={this.handleKeyDown}
        />
        {submitted && (
          <div className='search-result'>
            <b>
              <FormattedMessage id='search_results.total' defaultMessage='{count, number} {count, plural, one {result} other {results}}' values={{ count }} />
            </b>
            {accounts}
            {statuses}
            {hashtags}
            <a className='close' onClick={this.handleClear}>[とじる]</a>
          </div>
        )}
      </div>
    );
  }

}
