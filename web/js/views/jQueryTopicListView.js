/*global TopicsListDisplay */
"use strict";

function JQueryTopicListView (show_multiple_button, show_search_bar) {
  this.showMultipleButton = show_multiple_button;
  this.showSearchBar = show_search_bar;

  this.e = $('<div></div>').addClass('widget').attr('id', 'topics_wrapper').appendTo('#widgets');

  this.$header = $('<div>').attr('id', 'topiclist_header').appendTo(this.e);
  this.$actions = $('<div id="topics_actions"></div>').appendTo(this.e);
  this.$topics = $('<ul id="topics">' +
                   '  <li>Loading ...</li>' +
                   '</ul>').appendTo(this.e);

  this.$searchFilter = null;
  if (this.showSearchBar) {
    this.$header.append(this.createSearchHeader());
  }
}
JQueryTopicListView.prototype = new TopicsListDisplay();
JQueryTopicListView.prototype.constructor = JQueryTopicListView;

// Methods --------------------------------------------------------
JQueryTopicListView.prototype.createSearchHeader = function() {
  var that = this;
  var e = $('<div class="input_search_box"><input id="topiclist_search" type="text"></div>');
  this.$searchFilter = $('input', e).on('keydown', function(e) {
    if (e.keyCode != 13)
    {
      return;
    }
    e.preventDefault();
    var value = $(this).val();
    that.onSearch(value);
  });
  return e;
};
JQueryTopicListView.prototype.setSearchFilter = function(filter) {
  if (this.$searchFilter) {
    this.$searchFilter.val(filter);
  }
};
JQueryTopicListView.prototype.setActiveTopic = function(topicId) {
  $(">li.active", this.$topics).removeClass("active");
  $("#topic-" + topicId).addClass("active");
};
JQueryTopicListView.prototype.renderActionButtons = function(enableShowInbox, enableShowArchived) {
  this.$actions.empty();

  var that = this;
  $("<button>New</button>").click(function() {
    that.onCreateNewTopic();
  }).appendTo(this.$actions);

  if (this.showMultipleButton) {
    this.$actions.append($('<span></span>').css('width', '30px').css('display', 'inline-block'));
    this.$bShowInbox = $('<button>').text('Show Inbox').appendTo(this.$actions).click(function() {
      that.onShowInbox();
      that.renderActionButtons(false, true);
    });
    this.$bShowArchive = $('<button>').text('Show Archive').appendTo(this.$actions).click(function() {
      that.onShowArchived();
      that.renderActionButtons(true, false);
    });

    if (enableShowInbox) {
      this.$bShowInbox.removeAttr('disabled');
    } else {
      this.$bShowInbox.attr('disabled', 'disabled');
    }

    if (enableShowArchived) {
      this.$bShowArchive.removeAttr('disabled');
    } else {
      this.$bShowArchive.attr('disabled', 'disabled');
    }
  }
  else {
    var texts = ['Show archived', 'Show Inbox'];

    $('<button></button>').text(texts[enableShowInbox ? 1 : 0]).click(function() {
      var button = $(this);
      if (button.text() == texts[0]) {
        that.onShowArchived();
        button.text(texts[1]);
      } else {
        that.onShowInbox();
        button.text(texts[0]);
      }
    }).appendTo(this.$actions);
  }
};
JQueryTopicListView.prototype.renderTopicList = function renderTopicList(topics, prepend) {
  // Render to html list
  if (topics.length === 0) {
    this.renderText('No topics here. Try to create one :)');
  }
  for (var i = 0; i < topics.length; ++i) {
    this.renderTopic(topics[i], prepend);
  }
};
JQueryTopicListView.prototype.renderTopic = function renderTopic(topic, prepend) {
  var template = '<li id="{{id}}" class="topic_header">' +
           ' <div class="abstract">{{{abstract}}}</div>' +
           (topic.post_count_unread === 0 ?
              ' <div class="messages">{{total}} msgs</div>' :
              ' <div class="messages"><div class=unread>{{unread}}</div> of {{total}}</div>') +
           ' <div class="time">{{time}}</div>' +
           ' <div class="users">{{#users}}<img title="{{name}}" src="http://gravatar.com/avatar/{{img}}?s=32" width="32" height="32">{{/users}}</div>' +
           '</li>';
  var that = this;
  var $li = $(Mustache.to_html(template, {
    'id': 'topic-' + topic.id,
    'users': topic.users.slice(0,3) /* Make sure we only have 3 users */,
    'unread': topic.post_count_unread,
    'total': topic.post_count_total,
    'time': this.renderTopicTimestamp(topic.max_last_touch),
    'abstract': (topic.archived ? '<i>[Archive]</i> ' : '') + topic.abstract
  })).data('topic', topic);

  $li.on('click', function() {
    var topic = $(this).data('topic');
    if (topic) {
      that.onTopicClicked(topic.id);
    }
  });

  if (topic.post_count_unread > 0) {
    var $abstract = $(".abstract", $li);
    $abstract.css('font-weight', 'bold');
  }

  if (prepend) {
    $li.prependTo(this.$topics);
  } else {
    $li.appendTo(this.$topics);
  }
};
JQueryTopicListView.prototype.renderTopicTimestamp = function renderTopicTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }
  // NOTE: This format the date in the german way (localized): dd.mm.yyyy hh24:mi
  var createdAt = new Date(timestamp * 1000), now = new Date();
  var hours = createdAt.getHours();
  if (hours < 10) {
    hours = "0" + hours;
  }
  var minutes = createdAt.getMinutes();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  var time = hours + ":" + minutes;

  var month = createdAt.getMonth() + 1;
  if (month < 0){
    month = "0" + month;
  }

  if (createdAt.getYear() === now.getYear()) {
    if (createdAt.getMonth() === now.getMonth() &&
      createdAt.getDate() === now.getDate()) { // This post is from today, only show the time
      return time;
    } else {
      // this post is at least from this year, show day + month
      return createdAt.getDate() + "." + month + ".";
    }
  } else {
    return createdAt.getDate() + "." + month + "."+ (1900 + createdAt.getYear());
  }
};
JQueryTopicListView.prototype.clear = function clear() {
  this.$topics.empty();
};
JQueryTopicListView.prototype.showLoading = function showLoading() {
  this.renderText('Loading ...');
};
JQueryTopicListView.prototype.renderText = function renderText(text) {
  this.$topics.html('<li>' + text + '</li>');
};
