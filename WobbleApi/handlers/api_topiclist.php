<?php
  /** 
 * Return a list of topics the user can see. 
 *
 * The client must be authenticated.
 *
 * input = {}
 *
 * result = [MetaTopic]
 * MetaTopic = {'id': TopicId, 'abstract': string(), 'users': [User], 'max_last_touch': int(), 
 *              'post_count_unread': int(), 'post_count_total': int(), 'archived': bool()}
 */
function topics_list($params) {
  $self_user_id = ctx_getuserid();
  if (isset($params['archived']))
    $show_archived = $params['archived'];
  else
    $show_archived = false;

  ValidationService::validate_not_empty($self_user_id);
  ValidationService::validate_list($show_archived, array(true, false));

  $topics = TopicListService::getTopicList($self_user_id);
  return $topics;
}

/**
 * Creates a new topic for the current user.
 *
 * The client must be authenticated and a reader of the given topic.
 * 
 * input = {'id': TopicId}
 * result = TopicId
 *
 */
function topics_create($params) {
  $self_user_id = ctx_getuserid();
  $topic_id = @$params['id']; 

  ValidationService::validate_not_empty($self_user_id);
  ValidationService::validate_not_empty($topic_id);
  ValidationService::validate_topicid($topic_id);

  TopicRepository::createTopic($topic_id, $self_user_id);   
  
  return $topic_id;
}
