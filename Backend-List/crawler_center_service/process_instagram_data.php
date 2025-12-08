<?php
ini_set('display_errors', 1);
require_once('bootstrap.php');
require_once('common.php');
require_once(PP_INC_ROOT . '/db.php');


function process_crawler_ins_account_yy($items){
    foreach($items as $item){
        $user = array(
            'username'=> $item['username'],
            'name'=> $item['name'],
            'user_id'=> $item['user_id'],
            'fbid'=> $item['fbid'],
            'biography'=> $item['biography'],
            'profile_pic_url'=> $item['profile_pic_url'],
            'follow_count'=> $item['edge_follow_count'],
            'followed_count'=> $item['followed_count'],
            'posts_count'=> $item['posts_count'],
            'is_verified'=> $item['is_verified']? 'y' : 'n',
            'is_private'=> $item['is_private']? 'y' : 'n',
            'crawl_available'=> 'y',
            'insert_time'=> time(),
            'last_update_time'=> time()
        );
        $exist = db_select('tb_ins_account_crawler_list', 'a')->fields('a', array('id'))->condition('username', $item['username'])->execute()->fetchAssoc();
        if($exist){
            db_update('tb_ins_account_crawler_list')->fields($user)->condition('username', $item['username'])->execute();
        }else{
            db_insert('tb_ins_account_crawler_list')->fields($user)->execute();
        }
    }
}

function instagram_seach_user($items){
    foreach($items as $item){
        $username = $item['user_name'];
        $exist = db_select('tb_ins_account_crawler_list', 'a')->fields('a', array('id'))->condition('username', $username)->execute()->fetchAssoc();
        if(!$exist){
            db_insert('tb_ins_account_crawler_list')->fields(array('username'=>$username))->execute();
        }
    }
}