import React from 'react';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { connect }   from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineMessages, injectIntl } from 'react-intl';
import HashtagLink from '../../components/hashtag_link';
import TagBox from '../../components/tag_box';
import IconButton from '../../components/icon_button';
import { changeTargetColumn } from '../../actions/column';
import { addColumn, removeColumn } from '../../../mastodon/actions/columns';

const messages = defineMessages({
  title: { id: 'pinned_tags.title', defaultMessage: 'Pinned tags' },
  pin: { id: 'pinned_tags.pin', defaultMessage: 'Pin' },
  unpin: { id: 'pinned_tags.unpin', defaultMessage: 'Unpin' },
});

const mapStateToProps = state => ({
  tags: state.getIn(['settings', 'columns'], Immutable.List()).filter((column) => column.get('id') === 'HASHTAG'),
  isLogin: !!state.getIn(['meta', 'me']),
});

@injectIntl
@connect(mapStateToProps)
export default class PinnedTags extends ImmutablePureComponent {

  static propTypes = {
    tags: ImmutablePropTypes.list.isRequired,
    isLogin: PropTypes.bool,
    currentTag: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  handleClick = () => {
    const { dispatch } = this.props;
    dispatch(changeTargetColumn('lobby'));
  }

  handlePinClick = () => {
    const { dispatch, currentTag } = this.props;

    dispatch(addColumn('HASHTAG', { id: currentTag }));
  }

  handleCloseClick = (e) => {
    const { dispatch } = this.props;
    const uuid = e.currentTarget.getAttribute('data-id');

    dispatch(removeColumn(uuid));
  }

  render () {
    const { tags, isLogin, currentTag, intl } = this.props;

    return (
      <TagBox className='pinned-tag' heading={intl.formatMessage(messages.title)}>
        <ul className='rows'>
          {currentTag && tags.every(tag => tag.getIn(['params', 'id']) !== currentTag) && (
            <li key={currentTag} className={classNames('hashtag active')}>
              <HashtagLink hashtag={currentTag} onClick={this.handleClick} />
              {isLogin && (
                <div className='right-box'>
                  <IconButton src='map-pin' onClick={this.handlePinClick} title={intl.formatMessage(messages.pin)} />
                </div>
              )}
            </li>
          )}
          {tags.reverse().map(tag => {
            const id = tag.getIn(['params', 'id']);
            return (
              <li key={id} className={classNames('hashtag', { active: id === currentTag })}>
                <HashtagLink hashtag={id} onClick={this.handleClick} />
                <div className='right-box'>
                  <IconButton src='x-circle' data-id={tag.get('uuid')} onClick={this.handleCloseClick} title={intl.formatMessage(messages.unpin)} />
                </div>
              </li>
            );
          })}
        </ul>
      </TagBox>
    );
  }

};
