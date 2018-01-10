import qs from 'querystring';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DateTime from 'react-datetime';
import { debounce } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { length } from 'stringz';
import EmojiPickerDropdown from '../../components/emoji_picker_dropdown';
import Icon from '../../components/icon';
import CharacterCounter from '../../../mastodon/features/compose/components/character_counter';
import Button from '../../../mastodon/components/button';
import ReplyIndicatorContainer from '../../../mastodon/features/compose/containers/reply_indicator_container';
import AutosuggestTextarea from '../../../mastodon/components/autosuggest_textarea';
import UploadButtonContainer from '../../../mastodon/features/compose/containers/upload_button_container';
import Collapsable from '../../../mastodon/components/collapsable';
import SpoilerButtonContainer from '../../../mastodon/features/compose/containers/spoiler_button_container';
import PrivacyDropdownContainer from '../../../mastodon/features/compose/containers/privacy_dropdown_container';
import SensitiveButtonContainer from '../../../mastodon/features/compose/containers/sensitive_button_container';
import SensitiveGuideContainer from '../../../mastodon/features/compose/containers/sensitive_guide_container';
import TimeLimitDropdown from '../../../mastodon/features/compose/components/time_limit_dropdown';
import UploadFormContainer from '../../../mastodon/features/compose/containers/upload_form_container';
import WarningContainer from '../../../mastodon/features/compose/containers/warning_container';
import { uploadCompose } from '../../../mastodon/actions/compose';
import {
  changeCompose,
  submitCompose,
  clearComposeSuggestions,
  fetchComposeSuggestions,
  selectComposeSuggestion,
  changeComposeDateTime,
  changeComposeSpoilerText,
  insertEmojiCompose,
  requestImageCache,
  insertTagCompose,
  clearComposeHashTagSuggestions,
  fetchComposeHashTagSuggestions,
  selectComposeHashTagSuggestion,
} from '../../../mastodon/actions/compose';
import { switchCompose } from '../../../mastodon/selectors';

// TODO: i18n
// Moment is used by react-datetime, which is imported only by this module.
// Fix the setting to ja for now because the default display is confusing for
// Japanese people.
import 'moment/locale/ja';

const messages = defineMessages({
  placeholder: { id: 'compose_form.placeholder', defaultMessage: 'What is on your mind?' },
  spoiler_placeholder: { id: 'compose_form.spoiler_placeholder', defaultMessage: 'Content warning' },
  schedule_placeholder: { id: 'compose_form.schedule_placeholder', defaultMessage: 'Time to post' },
  publish: { id: 'compose_form.publish', defaultMessage: 'Toot' },
  publishLoud: { id: 'compose_form.publish_loud', defaultMessage: '{publish}!' },
});

const mapStateToProps = (state, props) => {
  state = switchCompose(state, props);

  return {
    text: state.getIn(['compose', 'text']),
    published: state.getIn(['compose', 'published']),
    suggestion_token: state.getIn(['compose', 'suggestion_token']),
    suggestions: state.getIn(['compose', 'suggestions']),
    spoiler: state.getIn(['compose', 'spoiler']),
    spoiler_text: state.getIn(['compose', 'spoiler_text']),
    privacy: state.getIn(['compose', 'privacy']),
    focusDate: state.getIn(['compose', 'focusDate']),
    preselectDate: state.getIn(['compose', 'preselectDate']),
    is_submitting: state.getIn(['compose', 'is_submitting']),
    is_uploading: state.getIn(['compose', 'is_uploading']),
    me: state.getIn(['compose', 'me']),
    hash_tag_suggestions: state.getIn(['compose', 'hash_tag_suggestions']),
    hash_tag_token: state.getIn(['compose', 'hash_tag_token']),
  };
};

const mapDispatchToProps = (dispatch) => ({

  onChange (text) {
    dispatch(changeCompose(text));
    const pattern = /(https?:\/\/(?:www|touch)\.pixiv\.net\/(?:member|member_illust|novel\/show|novel\/member)\.php[^\n\s]+)/gm;
    if (pattern.test(text)) {
      text.match(pattern).forEach(url => {
        dispatch(requestImageCache(url));
      });
    }
  },

  onSubmit () {
    dispatch(submitCompose());
  },

  onClearSuggestions () {
    dispatch(clearComposeSuggestions());
  },

  onFetchSuggestions (token) {
    dispatch(fetchComposeSuggestions(token));
  },

  onSuggestionSelected (position, token, accountId) {
    dispatch(selectComposeSuggestion(position, token, accountId));
  },

  onHashTagSuggestionsClearRequested() {
    dispatch(clearComposeHashTagSuggestions());
  },

  onHashTagSuggestionsFetchRequested(token) {
    dispatch(fetchComposeHashTagSuggestions(token));
  },

  onHashTagSuggestionsSelected(tokenStart, token, value) {
    dispatch(selectComposeHashTagSuggestion(tokenStart, token, value));
  },

  onChangeDateTime (dateTime) {
    dispatch(changeComposeDateTime(dateTime));
  },

  onChangeSpoilerText (checked) {
    dispatch(changeComposeSpoilerText(checked));
  },

  onPaste (files) {
    dispatch(uploadCompose(files));
  },

  onPickEmoji (position, data) {
    dispatch(insertEmojiCompose(position, data));
  },

  onSelectTimeLimit (tag) {
    dispatch(insertTagCompose(tag));
  },

});

@injectIntl
@connect(mapStateToProps, mapDispatchToProps)
export default class StatusForm extends ImmutablePureComponent {

  static propTypes = {
    scheduling: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    text: PropTypes.string.isRequired,
    published: PropTypes.any,
    suggestion_token: PropTypes.string,
    suggestions: ImmutablePropTypes.list,
    spoiler: PropTypes.bool,
    privacy: PropTypes.string,
    spoiler_text: PropTypes.string,
    focusDate: PropTypes.instanceOf(Date),
    preselectDate: PropTypes.instanceOf(Date),
    is_submitting: PropTypes.bool,
    is_uploading: PropTypes.bool,
    me: PropTypes.number,
    useModal: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onClearSuggestions: PropTypes.func.isRequired,
    onFetchSuggestions: PropTypes.func.isRequired,
    onSuggestionSelected: PropTypes.func.isRequired,
    onChangeDateTime: PropTypes.func.isRequired,
    onChangeSpoilerText: PropTypes.func.isRequired,
    onPaste: PropTypes.func.isRequired,
    onPickEmoji: PropTypes.func.isRequired,
    hash_tag_suggestions: ImmutablePropTypes.list,
    hash_tag_token: PropTypes.string,
    onHashTagSuggestionsClearRequested: PropTypes.func.isRequired,
    onHashTagSuggestionsFetchRequested: PropTypes.func.isRequired,
    onHashTagSuggestionsSelected: PropTypes.func.isRequired,
    onSelectTimeLimit: PropTypes.func.isRequired,
  };

  _restoreCaret = null;

  componentDidMount () {
    const rawQuery = location.search.replace(/^\?/, '');
    if (rawQuery.length > 0) {
      window.history.replaceState(window.history.state, null, location.pathname);
      const query = qs.parse(rawQuery);
      this.props.onChange(query.text);
    }
  }

  handleChange = (e) => {
    this.props.onChange(e.target.value);
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 13 && (e.ctrlKey || e.metaKey)) {
      this.handleSubmit();
    }
  }

  handleSubmit = () => {
    if (this.props.text !== this.autosuggestTextarea.textarea.value) {
      // Something changed the text inside the textarea (e.g. browser extensions like Grammarly)
      // Update the state to match the current text
      this.props.onChange(this.autosuggestTextarea.textarea.value);
    }

    if (!this.props.scheduling || this.props.published !== null) {
      this.props.onSubmit();
    }
  }

  onSuggestionsClearRequested = () => {
    this.props.onClearSuggestions();
  }

  onSuggestionsFetchRequested = debounce((token) => {
    this.props.onFetchSuggestions(token);
  }, 500, { trailing: true })

  onSuggestionSelected = (tokenStart, token, value) => {
    this._restoreCaret = 'suggestion';
    this.props.onSuggestionSelected(tokenStart, token, value);
  }

  onHashTagSuggestionsClearRequested = () => {
    this.props.onHashTagSuggestionsClearRequested();
  }

  onHashTagSuggestionsFetchRequested = (token) => {
    this.props.onHashTagSuggestionsFetchRequested(token);
  }

  onHashTagSuggestionsSelected = (tokenStart, token, value) => {
    this._restoreCaret = 'suggestion';
    this.props.onHashTagSuggestionsSelected(tokenStart, token, value);
  }

  handleChangeSpoilerText = (e) => {
    this.props.onChangeSpoilerText(e.target.value);
  }

  componentWillReceiveProps (nextProps) {
    // If this is the update where we've finished uploading,
    // save the last caret position so we can restore it below!
    if ((!nextProps.is_uploading && this.props.is_uploading) || this._restoreCaret === null) {
      this._restoreCaret = this.autosuggestTextarea.textarea.selectionStart;
    } else if (this._restoreCaret === 'suggestion') {
      const diff = nextProps.text.length - this.props.text.length;
      this._restoreCaret = this.autosuggestTextarea.textarea.selectionStart + diff;
    }
  }

  componentDidUpdate (prevProps) {
    // This statement does several things:
    // - If we're beginning a reply, and,
    //     - Replying to zero or one users, places the cursor at the end of the textbox.
    //     - Replying to more than one user, selects any usernames past the first;
    //       this provides a convenient shortcut to drop everyone else from the conversation.
    // - If we've just finished uploading an image, and have a saved caret position,
    //   restores the cursor to that position after the text changes!
    if (this.props.focusDate !== prevProps.focusDate || (prevProps.is_uploading && !this.props.is_uploading && typeof this._restoreCaret === 'number')) {
      let selectionEnd, selectionStart;

      if (this.props.preselectDate !== prevProps.preselectDate) {
        selectionEnd   = this.props.text.length;
        selectionStart = this.props.text.search(/\s/) + 1;
      } else if (typeof this._restoreCaret === 'number') {
        selectionStart = this._restoreCaret;
        selectionEnd   = this._restoreCaret;
      } else {
        selectionEnd   = this.props.text.length;
        selectionStart = selectionEnd;
      }

      this.autosuggestTextarea.textarea.setSelectionRange(selectionStart, selectionEnd);
      this.autosuggestTextarea.textarea.focus();
    } else if(prevProps.is_submitting && !this.props.is_submitting) {
      this.autosuggestTextarea.textarea.focus();
    }
    this._restoreCaret = null;
  }

  setAutosuggestTextarea = (c) => {
    this.autosuggestTextarea = c;
  }

  handleEmojiPick = (data) => {
    const position     = this.autosuggestTextarea.textarea.selectionStart;
    this._restoreCaret = position + data.shortname.length + 1;
    this.props.onPickEmoji(position, data);
  }

  handleSelectTimeLimit = (data) => {
    this._restoreCaret = this.autosuggestTextarea.textarea.selectionStart;
    this.props.onSelectTimeLimit(data);
  }

  render () {
    const { scheduling, intl, onPaste, useModal } = this.props;
    const disabled = this.props.is_submitting;
    const text = [this.props.spoiler_text, this.props.text].join('');

    let publishText    = '';

    if (this.props.privacy === 'direct') {
      publishText = <span className='compose-form__toot-button'><Icon icon='mail' /> <div>{intl.formatMessage(messages.publish)}</div></span>;

    } else if (this.props.privacy === 'private') {
      publishText = <span className='compose-form__toot-button'><Icon icon='lock' /> <div>{intl.formatMessage(messages.publish)}</div></span>;

    } else if (this.props.privacy === 'unlisted') {
      publishText = <span className='compose-form__toot-button'><Icon icon='home' /> <div>{intl.formatMessage(messages.publish)}</div></span>;

    } else {
      publishText = <span className='compose-form__toot-button'>{intl.formatMessage(messages.publishLoud, { publish: intl.formatMessage(messages.publish) })}</span>;
    }


    return (
      <div className='status-form'>
        <Collapsable isVisible={this.props.spoiler} fullHeight={36}>
          <div className='spoiler-input'>
            <input placeholder={intl.formatMessage(messages.spoiler_placeholder)} value={this.props.spoiler_text} onChange={this.handleChangeSpoilerText} onKeyDown={this.handleKeyDown} type='text' className='spoiler-input__input'  id='cw-spoiler-input' />
          </div>
        </Collapsable>

        <WarningContainer useModal={useModal} />

        <ReplyIndicatorContainer useModal={useModal} />

        <div className='compose-form__autosuggest-wrapper'>
          <AutosuggestTextarea
            ref={this.setAutosuggestTextarea}
            placeholder={intl.formatMessage(messages.placeholder)}
            disabled={disabled}
            value={this.props.text}
            onChange={this.handleChange}
            suggestions={this.props.suggestions}
            onKeyDown={this.handleKeyDown}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            onSuggestionSelected={this.onSuggestionSelected}
            onPaste={onPaste}
            autoFocus={useModal}
            hash_tag_suggestions={this.props.hash_tag_suggestions}
            onHashTagSuggestionsFetchRequested={this.onHashTagSuggestionsFetchRequested}
            onHashTagSuggestionsClearRequested={this.onHashTagSuggestionsClearRequested}
            onHashTagSuggestionsSelected={this.onHashTagSuggestionsSelected}
          />

          <div className='compose-form__pickers'>
            <EmojiPickerDropdown icon='fa-smile-o' onPickEmoji={this.handleEmojiPick} />
            <TimeLimitDropdown onSelectTimeLimit={this.handleSelectTimeLimit} />
          </div>
        </div>

        <div className='compose-form__modifiers'>
          <UploadFormContainer useModal={useModal} />
        </div>

        <div className='compose-form__buttons-wrapper'>
          <div className='compose-form__buttons'>
            <UploadButtonContainer useModal={useModal} />
            <PrivacyDropdownContainer useModal={useModal} />
            <SensitiveButtonContainer useModal={useModal} />
            <SpoilerButtonContainer useModal={useModal} />
          </div>

          {
            scheduling && (
              <DateTime
                className='compose-form__datetime'
                inputProps={{
                  className: 'compose-form__datetime-input',
                  placeholder: intl.formatMessage(messages.schedule_placeholder),
                }}
                onChange={this.props.onChangeDateTime}
                value={this.props.published}
              />
            )
          }

          <div className='compose-form__publish'>
            <div className='character-counter__wrapper'><CharacterCounter max={500} text={text} /></div>
            <div className='compose-form__publish-button-wrapper'><Button text={publishText} onClick={this.handleSubmit} disabled={disabled || this.props.is_uploading || typeof this.props.published === 'string' || length(text) > 500 || (text.length !==0 && text.trim().length === 0)} block /></div>
          </div>
        </div>

        <SensitiveGuideContainer useModal={useModal} />
      </div>
    );
  }

}
