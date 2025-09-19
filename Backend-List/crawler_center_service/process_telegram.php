<?php
function process_telegram($username){
    $query = db_select('dt_telegram_messages', 'm')->fields('m', array('id', 'chat_id', 'topic_id', 'reply_text'));
    $query->condition('reply_flag', 'y')->condition('reply_status', 'i');
    $query->condition('username', $username, '!=');
    $query->orderBy('id');
    $task = $query->execute()->fetchAssoc();
    if($task){
        $scriptContent = file_get_contents('./scripts/telegram/telegram_continue.js');
        $topicId = $task['topic_id']? $task['topic_id'] : 1;
        $params = array(
            'tg_url'=> 'https://web.telegram.org/a/#' . $task['chat_id'] . '_' . $topicId,
            'user_name'=> $username,
            'text'=> to_json($task['reply_text'])
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateReply = array(
            'reply_status'=> 'r',
            'reply_fetch_time'=> time(),
        );
        db_update('dt_telegram_messages')->fields($updateReply)->condition('id', $task['id'])->execute();
        return array(
            'success'=> true,
            'task_id'=> $task['id'],
            'task_type'=> 'telegram_message',
            'site'=> 'telegram',
            'account_cache'=> 'telegram_'. $username,
            'script_content'=> $scriptContent
        );
    }
    return array('success'=> false);
}

function process_telegram_account($username){
    $query = db_select('dt_telegram_messages', 'm')->fields('m', array('id', 'chat_id', 'topic_id', 'reply_text'));
    $query->condition('reply_flag', 'y')->condition('reply_status', 'i');
    $query->condition('username', $username, '!=');
    $query->orderBy('id');
    $task = $query->execute()->fetchAssoc();
    if($task){
        $scriptContent = file_get_contents('./scripts/telegram/telegram_segment_message.js');
        $topicId = $task['topic_id']? $task['topic_id'] : 1;
        $params = array(
            'tg_url'=> 'https://web.telegram.org/a/#' . $task['chat_id'] . '_' . $topicId,
            'text'=> to_json($task['reply_text'])
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateReply = array(
            'reply_status'=> 'r',
            'reply_fetch_time'=> time(),
        );
        db_update('dt_telegram_messages')->fields($updateReply)->condition('id', $task['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'telegram',
            'type'=> 'twitter_reply',
            'account_cache'=> 'telegram_'. $username,
            'script_content'=> $scriptContent
        );
    }else{
        $scriptContent = file_get_contents('./scripts/telegram/telegram_segment_wait.js');
        return array(
            'success'=> true,
            'site'=> 'telegram',
            'type'=> 'twitter_reply',
            'account_cache'=> 'telegram_'. $username,
            'script_content'=> $scriptContent
        );
    }
    return array('success'=> false);
}