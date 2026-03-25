<?php
function process_uwants($loc, $check){
    //profile photo
    $query = db_select('tb_uwants_account_yy', 'a')->fields('a', array('id','uid','account','password','upload_photo'))->condition('available', 'y');
    $db_or = db_or()->condition('photo', '%noavatar%', 'like')->condition('photo', null, 'is');
    $query->condition($db_or);
    $query->condition('upload_photo', null, 'is not')->condition('upload_photo', '', '!=');
    $account = $query->orderBy('last_use_time')->execute()->fetchAssoc();
    if($account){
        db_update('tb_uwants_account_yy')->fields(array('last_use_time'=>time()))->condition('id', $account['id'])->execute();
        $script_content = file_get_contents('./scripts/uwants_profile.js');
        $params = array(
            'userName'=> $account['account'],
            'passWord'=> $account['password'],
            'uploadPhoto'=> $account['upload_photo']
        );
        foreach($params as $key=>$value){
            $script_content = str_replace('{{'.$key.'}}', $value, $script_content);
        }
        return array(
            'success'=> true,
            'site'=> 'uwants',
            'account_cache'=> md5($account['account'].'_901'),
            'script_content'=> $script_content
        );
    }
    //post
    $account = db_select('tb_uwants_account_yy', 'a')->fields('a', array('id','uid','account','password'))->condition('available', 'y')->condition('loc', $loc)->orderBy('last_use_time')->execute()->fetchAssoc();
    if(!$account){
        return array('success'=> false, 'msg'=>'not found account ...');
    }
    $query = db_select('tb_uwants_post_corpus_yy', 'p')->fields('p', array('id', 'title', 'text', 'images'));
    $query->condition('status', 'r');
    $query->orderBy('last_fetch_time');
    $post = $query->execute()->fetchAssoc();
    if($post){
        db_update('tb_uwants_account_yy')->fields(array('last_use_time'=>time()))->condition('id', $account['id'])->execute();
        $script_content = file_get_contents('./scripts/uwants_send.js');
        $update_item = array(
            'uid'=> $account['uid'],
            'status'=>'p',
            'last_fetch_time'=>time()
        );
        db_update('tb_uwants_post_corpus_yy')->fields($update_item)->condition('id', $post['id'])->execute();
        $images = array();
        $arr = json_from_string($post['images']);
        foreach($arr as $name){
            $images[] = array('name'=> $name);
        }
        $corpus_path = to_json($images);
        $corpus_path = str_replace('"', '\"', $corpus_path);
        $params = array(
            'userName'=> $account['account'],
            'passWord'=> $account['password'],
            'subject'=> $post['title'],
            'content'=> to_json($post['text']),
            'corpus_path'=> $corpus_path
        );
        foreach($params as $key=>$value){
            $script_content = str_replace('{{'.$key.'}}', $value, $script_content);
        }
        return array(
            'success'=> true,
            'site'=> 'uwants',
            'account_cache'=> md5($account['account'].'_901'),
            'script_content'=> $script_content
        );
    }
    //building
    $query = db_select('tb_uwants_building_corpus_yy', 'b')->fields('b', array('id', 'thread_url', 'text'));
    $query->condition('status', 'r');
    $query->orderBy('last_fetch_time');
    $building = $query->execute()->fetchAssoc();
    if($building){
        db_update('tb_uwants_account_yy')->fields(array('last_use_time'=>time()))->condition('id', $account['id'])->execute();
        $script_content = file_get_contents('./scripts/uwants_building.js');
        $update_item = array(
            'uid'=> $account['uid'],
            'status'=>'p',
            'last_fetch_time'=>time()
        );
        db_update('tb_uwants_building_corpus_yy')->fields($update_item)->condition('id', $building['id'])->execute();
        $params = array(
            'userName'=> $account['account'],
            'passWord'=> $account['password'],
            'operateUrl'=> $building['thread_url'],
            'content'=> $building['text']
        );
        foreach($params as $key=>$value){
            $script_content = str_replace('{{'.$key.'}}', $value, $script_content);
        }
        return array(
            'success'=> true,
            'site'=> 'uwants',
            'account_cache'=> md5($account['account'].'_901'),
            'script_content'=> $script_content
        );
    }
    return array('success'=> false);
}

function uwants_save_thread_list($threads){
    foreach($threads as $item) {
        $uid = $item['uid'];
        $thread = array(
            'tid'=> $item['tid'],
            'uid'=> $uid,
            'uname'=> $item['uname'],
            'post_time'=> strtotime($item['post_time']),
            'url'=> $item['url'],
            'title'=> $item['title'],
            'description'=> $item['description'],
            'image'=> $item['image'],
            'level1'=> $item['level1'],
            'level2'=> $item['level2'],
            'last_update_time'=> time()
        );
        $exists = db_select('tb_uwants_thread_list_yy', 't')->fields('t', array('id'))->condition('tid', $item['tid'])->execute()->fetchAssoc();
        if($exists) {
            db_update('tb_uwants_thread_list_yy')->fields($thread)->condition('id', $exists['id'])->execute();
        }else{
            $thread['insert_time'] = time();
            db_insert('tb_uwants_thread_list_yy')->fields($thread)->execute();
            $query = db_select('tb_uwants_post_corpus_yy', 'p')->fields('p', array('id'))->condition('uid', $uid)->condition('tid', null, 'is');
            $query->condition('title', $item['title']);
            $task = $query->execute()->fetchAssoc();
            if($task){
                $tid = $item['tid'];
                $update_item = array(
                    'status'=> 's',
                    'tid'=> $tid
                );
                if(isset($item['screenshot'])){
                    $image_content = str_replace('data:image/jpg;base64,', '', $item['screenshot']);
                    $image_content = base64_decode($image_content);
                    file_put_contents('/data/uwants_images/thread_screenshot_'.$tid.'.jpg', $image_content);
                    $update_item['screenshot_image'] = 'thread_screenshot_'.$tid.'.jpg';
                }
                db_update('tb_uwants_post_corpus_yy')->fields($update_item)->condition('id', $task['id'])->execute();
            }
        }
    }
}

function uwants_save_post_list($posts, $data){
    foreach($posts as $item) {
        $uid = $item['uid'];
        $postTime = strtotime($item['post_time']);
        $post = array(
            'tid'=> $item['tid'],
            'pid'=> $item['pid'],
            'uid'=> $uid,
            'uname'=> $item['uname'],
            'post_time'=> $postTime,
            'text'=> $item['text'],
            'last_update_time'=> time()
        );
        $exists = db_select('tb_uwants_post_list_yy', 'p')->fields('p', array('id'))->condition('pid', $item['pid'])->execute()->fetchAssoc();
        if($exists) {
            db_update('tb_uwants_post_list_yy')->fields($post)->condition('id', $exists['id'])->execute();
        }else{
            $post['insert_time'] = time();
            db_insert('tb_uwants_post_list_yy')->fields($post)->execute();
            $query = db_select('tb_uwants_building_corpus_yy', 'b')->fields('b', array('id'))->condition('uid', $uid)->condition('pid', null, 'is');
            $query->condition('text', $item['text']);
            $task = $query->execute()->fetchAssoc();
            if($task){
                $pid = $item['pid'];
                $update_item = array(
                    'status'=> 's',
                    'tid'=> $item['tid'],
                    'pid'=> $pid,
                    'post_time'=> $postTime
                );
                if(isset($data['dataEx']['network_crawler']['uwants_post_screenshot'])){
                    $image_content = str_replace('data:image/jpg;base64,', '', $data['dataEx']['network_crawler']['uwants_post_screenshot']);
                    $image_content = base64_decode($image_content);
                    file_put_contents('/data/uwants_images/post_screenshot_'.$pid.'.jpg', $image_content);
                    $update_item['screenshot_image'] = 'post_screenshot_'.$pid.'.jpg';
                }
                db_update('tb_uwants_building_corpus_yy')->fields($update_item)->condition('id', $task['id'])->execute();
            }
        }
    }
}

function uwants_save_profile_list($profiles){
    foreach($profiles as $item) {
        $uid = $item['uid'];
        $profile = array(
            'uid'=> $uid,
            'username'=> $item['username'],
            'position'=> $item['position'],
            'photo'=> $item['photo'],
            'thread_count'=> $item['threadCount'],
            'follow_thread_count'=> $item['followThreadCount'],
            'follower_count'=> $item['followerCount']
        );
        $exists = db_select('tb_uwants_account_yy', 'a')->fields('a', array('id'))->condition('uid', $uid)->execute()->fetchAssoc();
        if($exists){
            db_update('tb_uwants_account_yy')->fields($profile)->condition('uid', $uid)->execute();
        }
    }
}

















