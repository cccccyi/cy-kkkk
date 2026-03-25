<?php
function process_mewe($loc, $check){
    global $combat_db_options;
    //post
    $account = db_select('tb_mewe_account_yy', 'a', $combat_db_options)->fields('a', array('id','email','password','screen_name'))->condition('available', 'y')->condition('loc', $loc)->orderBy('last_use_time')->execute()->fetchAssoc();
    if(!$account){
        return array('success'=> false, 'msg'=>'not found account ...');
    }
    $query = db_select('tb_mewe_post_corpus_yy', 'p', $combat_db_options)->fields('p', array('id', 'text', 'images'));
    $query->condition('status', 'r');
    $query->orderBy('last_fetch_time');
    $post = $query->execute()->fetchAssoc();
    if($post){
        db_update('tb_mewe_account_yy', $combat_db_options)->fields(array('last_use_time'=>time()))->condition('id', $account['id'])->execute();
        $script_content = file_get_contents('./scripts/mewe_post.js');
        $update_item = array(
            'email'=> $account['email'],
            'uscreen_name'=> $account['screen_name'],
            'status'=>'p',
            'last_fetch_time'=>time()
        );
        db_update('tb_mewe_post_corpus_yy', $combat_db_options)->fields($update_item)->condition('id', $post['id'])->execute();
        $images = array();
        $arr = json_from_string($post['images']);
        foreach($arr as $name){
            $images[] = array('name'=> $name);
        }
        $corpus_path = to_json($images);
        $corpus_path = str_replace('"', '\"', $corpus_path);
        $params = array(
            'userName'=> $account['email'],
            'passWord'=> $account['password'],
            'content'=> to_json($post['text']),
            'corpus_path'=> $corpus_path
        );
        foreach($params as $key=>$value){
            $script_content = str_replace('{{'.$key.'}}', $value, $script_content);
        }
        return array(
            'success'=> true,
            'site'=> 'mewe',
            'account_cache'=> 'mewe_'. $account['id'] . '_' . md5($account['email'].'_903'),
            'script_content'=> $script_content
        );
    }
    return array('success'=> false);
}

function mewe_save_create_post($post, $data){
    global $combat_db_options;
    $post_id = $post['post_id'];
    $screen_name = $post['uscreen_name'];
    $query = db_select('tb_mewe_post_corpus_yy', 'p', $combat_db_options)->fields('p', array('id'))->condition('post_id', null, 'is');
    $query->condition('status', 'p')->condition('uscreen_name', $screen_name);
    $query->orderBy('last_fetch_time', 'desc');
    $task = $query->execute()->fetchAssoc();
    if($task){
        $update_item = array(
            'status'=> 's',
            'post_id'=> $post_id,
            'uid'=> $post['uid'],
            'uname'=> $post['uname'],
            'post_time'=> $post['post_time'],
            'post_text'=> $post['post_text']
        );
        if(isset($data['dataEx']['network_crawler']['mewe_post_screenshot'])){
            $image_content = str_replace('data:image/jpg;base64,', '', $data['dataEx']['network_crawler']['mewe_post_screenshot']);
            $image_content = base64_decode($image_content);
            file_put_contents('/data/mewe_images/mewe_post_screenshot_' . $post_id . '.jpg', $image_content);
            $update_item['screenshot_image'] = 'mewe_post_screenshot_' . $post_id . '.jpg';
        }
        db_update('tb_mewe_post_corpus_yy', $combat_db_options)->fields($update_item)->condition('id', $task['id'])->execute();
    }
}


















