<?php
function process_telegram($loc, $check){
    global $combat_db_options;
    // message
    $account = db_select('tb_telegram_account_yy', 'a', $combat_db_options)->fields('a', array('id','phone','password','account'))->condition('available', 'y')->condition('loc', $loc)->orderBy('last_use_time')->execute()->fetchAssoc();
    if(!$account){
        return array('success'=> false, 'msg'=>'not found account ...');
    }
    $query = db_select('tb_telegram_message_task_yy', 'm', $combat_db_options)->fields('m', array('id', 'text', 'images', 'targets'));
    $query->condition('status', 'r');
    $query->orderBy('fetch_time');
    $task = $query->execute()->fetchAssoc();
    if($task){
        db_update('tb_telegram_account_yy', $combat_db_options)->fields(array('last_use_time'=>time()))->condition('id', $account['id'])->execute();
        $script_content = file_get_contents('./scripts/telegram_message.js');
        $targets = array();
        $target_arr = json_from_string($task['targets']);
        foreach($target_arr as $name){
            $targets[] = array('name'=> $name);
        }
        $update_item = array(
            'status'=> 'p',
            'account_id'=> $account['id'],
            'fetch_time'=> time()
        );
        db_update('tb_telegram_message_task_yy', $combat_db_options)->fields($update_item)->condition('id', $task['id'])->execute();
        $images = array();
        $arr = json_from_string($task['images']);
        if($arr){
            foreach($arr as $name){
                $images[] = array('name'=> $name);
            }
        }
        $corpus_path = to_json($images);
        $corpus_path = str_replace('"', '\"', $corpus_path);
        $params = array(
            'tgTargets'=> to_json($targets),
            'text'=> to_json($task['text']),
            'corpusPath'=> $corpus_path
        );
        foreach($params as $key=>$value){
            $script_content = str_replace('{{'.$key.'}}', $value, $script_content);
        }
        return array(
            'success'=> true,
            'task_id'=> $task['id'],
            'task_type'=> 'telegram_message',
            'site'=> 'telegram',
            'account_cache'=> 'telegram_'. $account['phone'],
            'script_content'=> $script_content
        );
    }
    return array('success'=> false);
}

function process_task_telegram_message($params){
    global $combat_db_options;
    $task_id = $params['task_id'];
    $ret = $params['result']==0? 's' : 'f';
    $last_step_image = null;
    $snapshots = array();
    if(isset($params['last_step_image']) && $params['last_step_image']){
        $image_content = str_replace('data:image/jpg;base64,', '', $params['last_step_image']);
        $image_content = base64_decode($image_content);
        $last_step_image = 'last_step_' . $task_id . '_' . uniqid() . '.jpg';
        file_put_contents('/data/yyweihai/telegram/task/' . $last_step_image, $image_content);
    }
    if(isset($params['snapshots']) && $params['snapshots']){
        foreach($params['snapshots'] as $image){
            $image_content = str_replace('data:image/jpg;base64,', '', $image);
            $image_content = base64_decode($image_content);
            $snapshot_image = 'snapshot_' . $task_id . '_' . uniqid() . '.jpg';
            file_put_contents('/data/yyweihai/telegram/task/' . $snapshot_image, $image_content);
            $snapshots[] = $snapshot_image;
        }
    }
    $item = array(
        'status'=> $ret,
        'finish_time'=> time(),
        'last_step_image'=> $last_step_image,
        'screenshot_images'=> to_json($snapshots)
    );
    db_update('tb_telegram_message_task_yy', $combat_db_options)->fields($item)->condition('id', $task_id)->execute();
}