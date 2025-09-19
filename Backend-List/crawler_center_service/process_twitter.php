<?php
function process_twitter($loc, $ip){
    // profundity news list 基于采集到的新闻 - 发推
    $sendTweetLoc = 'machine_hwy_001';
    $response = null;
    if($loc == $sendTweetLoc && $ip=='154.219.101.126'){
        $response = process_twitter_post_summary($loc);
        if($response){
            return $response;
        }
    }
    if($loc == 'machine_tsj_hsx'){
        $response = process_twitter_post_summary_en($loc);
        if($response){
            return $response;
        }
    }
    // 持续任务
    $response = process_twitter_continue($loc);
    if($response){
        return $response;
    }
    // 推文评论
    $response = process_twitter_reply($loc);
    if($response){
        return $response;
    }
    // 推文采集
    $response = process_twitter_crawler($loc);
    if($response){
        return $response;
    }
    // 采集 X订阅 List
//    if($loc != $sendTweetLoc) {
//        $response = process_twitter_list_crawler($loc);
//        if ($response) {
//            return $response;
//        }
//    }
}
// HashNews 中文 X 账号
function process_twitter_post_summary($loc){
    $screenName = 'hashnewsHK';
    $timeInterval = 1*60;
    $query = db_select('tb_twitter_tweet_post_task', 'n')->fields('n', array('id','twitter_title','twitter_tweet','twitter_img'));
    $query->condition('screen_name', $screenName);
    $query->condition('status', 'i')->condition('twitter_tweet', null, 'is not');
    $query->condition('id', 782, '>');
    $query->orderBy('id');
    $tweet = $query->execute()->fetchAssoc();
    if(!$tweet){
        return false;
    }
    $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc'));
    $query->condition('screen_name', $screenName);
    $query->condition('loc', $loc)->condition('available', 'y');
    //$query->condition('last_use_time', time() - $timeInterval, '<');
    $query->orderBy('last_use_time');
    $account = $query->execute()->fetchAssoc();
    if($account){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_post.js');
        $image = '';
        $imageName = '';
        if($tweet['twitter_img']){
            $imgs = json_from_string($tweet['twitter_img']);
            if(!$imgs){
                $imgs = array($tweet['twitter_img']);
            }
            if($imgs){
                $img = $imgs[0];
                if(strpos($img, 'http') > -1){
                    $image = $img;
                    $imageName = 'tweet_image_1.png';
                }else{
                    $image = 'http://82.157.161.88/data/block_chain/twitter/corpus/' . $img;
                    $imageName = $img;
                }
            }
        }
        $params = array(
            'account'=> $account['account'],
            'password'=> $account['password'],
            'screenName'=> $account['screen_name'],
            'title'=> to_json($tweet['twitter_title']),
            'content'=> to_json($tweet['twitter_tweet']),
            'image1URL'=> $image,
            'image1Name'=> $imageName
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTweet = array(
            'status'=> 'r',
            'fetch_time'=> time()
        );
        db_update('tb_twitter_tweet_post_task')->fields($updateTweet)->condition('id', $tweet['id'])->execute();
        $updateAccount = array(
            'last_use_time'=> time()
        );
        //db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'account_cache'=> 'twitter_' . $account['screen_name'],
            'script_content'=> $scriptContent
        );
    }
    return false;
}
// HashNews 英文 X 账号
function process_twitter_post_summary_en($loc){
    $screenName = 'HashNews01';
    $query = db_select('tb_twitter_tweet_post_task', 'n')->fields('n', array('id','twitter_title','twitter_tweet','twitter_img'));
    $query->condition('screen_name', $screenName);
    $query->condition('status', 'i')->condition('twitter_tweet', null, 'is not');
    $query->orderBy('id');
    $tweet = $query->execute()->fetchAssoc();
    if(!$tweet){
        return false;
    }
    $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc'));
    $query->condition('screen_name', $screenName);
    $query->condition('loc', $loc)->condition('available', 'y');
    $query->orderBy('last_use_time');
    $account = $query->execute()->fetchAssoc();
    if($account){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_post.js');
        $image = '';
        $imageName = '';
        if($tweet['twitter_img']){
            $imgs = json_from_string($tweet['twitter_img']);
            if(!$imgs){
                $imgs = array($tweet['twitter_img']);
            }
            if($imgs){
                $img = $imgs[0];
                if(strpos($img, 'http') > -1){
                    $image = $img;
                    $imageName = 'tweet_image_1.png';
                }else{
                    $image = 'http://82.157.161.88/data/block_chain/twitter/corpus/' . $img;
                    $imageName = $img;
                }
            }
        }
        $params = array(
            'account'=> $account['account'],
            'password'=> $account['password'],
            'screenName'=> $account['screen_name'],
            'title'=> to_json($tweet['twitter_title']),
            'content'=> to_json($tweet['twitter_tweet']),
            'image1URL'=> $image,
            'image1Name'=> $imageName
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTweet = array(
            'status'=> 'r',
            'fetch_time'=> time()
        );
        db_update('tb_twitter_tweet_post_task')->fields($updateTweet)->condition('id', $tweet['id'])->execute();
        $updateAccount = array(
            'last_use_time'=> time()
        );
        //db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'account_cache'=> 'twitter_' . $account['screen_name'],
            'script_content'=> $scriptContent
        );
    }
    return false;
}
function process_twitter_post_news($loc){
    $timeInterval = 1*60;
    $query = db_select('dt_news_list', 'n')->fields('n', array('id','twitter_tweet','twitter_img'));
    $query->condition('twitter_status', 'i')->condition('twitter_tweet', null, 'is not');
    $query->orderBy('publish_time');
    $tweet = $query->execute()->fetchAssoc();
    if(!$tweet){
        //return array('success'=> false, 'msg'=>'not found send tweet info ...');
        return false;
    }
    $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc'));
    $query->condition('screen_name', 'hashnewsHK');
    $query->condition('loc', $loc)->condition('available', 'y');
    $query->condition('last_use_time', time() - $timeInterval, '<');
    $query->orderBy('last_use_time');
    $account = $query->execute()->fetchAssoc();
    if($account){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_post.js');
        $image = '';
        $imageName = '';
        if($tweet['twitter_img']){
            $imgs = json_from_string($tweet['twitter_img']);
            if($imgs){
                $img = $imgs[0];
                if(strpos($img, 'http') > -1){
                    $image = $img;
                    $imageName = 'tweet_image_1.png';
                }else{
                    $image = 'http://82.157.161.88/data/block_chain/twitter/corpus/' . $img;
                    $imageName = $img;
                }
            }
        }
        $params = array(
            'account'=> $account['account'],
            'password'=> $account['password'],
            'screenName'=> $account['screen_name'],
            'content'=> to_json($tweet['twitter_tweet']),
            'image1URL'=> $image,
            'image1Name'=> $imageName
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTweet = array(
            'twitter_status'=> 'r',
            'twitter_screen_name'=> $account['screen_name'],
            'twitter_fetch_time'=> time()
        );
        db_update('dt_news_list')->fields($updateTweet)->condition('id', $tweet['id'])->execute();
        $updateAccount = array(
            'last_use_time'=> time()
        );
        db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'account_cache'=> 'twitter_' . $account['screen_name'],
            'script_content'=> $scriptContent
        );
    }
    return false;
}

function process_twitter_reply($loc){
    $accountUseTimeInterval = 3*60;
    $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc'));
    $query->fields('r', array('id','screen_name','tweet_id','reply_tweet_text','retry_count'));
    $query->leftJoin('tb_twitter_tweet_reply_task', 'r', 'a.screen_name=r.reply_screen_name');
    $query->condition('a.loc', $loc)->condition('a.available', 'y');
    $query->condition('r.reply_status', 'i');
    $query->condition('a.last_use_time', time() - $accountUseTimeInterval, '<');
    $query->orderBy('a.last_use_time')->orderBy('r.id', 'desc');
    $account = $query->execute()->fetchAssoc();
    //SELECT a.id, a.account, a.password, a.loc, r.id, r.screen_name, r.tweet_id, r.reply_tweet_text from tb_twitter_guid_account a LEFT OUTER JOIN tb_twitter_tweet_reply_task r ON a.screen_name=r.reply_screen_name WHERE  (a.loc = 'machine_ytj_gongying') AND (a.loc != 'machine_hwy_001') AND (a.available = 'y') AND (r.reply_status = 'i') ORDER BY a.last_use_time , r.id desc limit 2;
    if(!$account){
        return false;
    }
    /**
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id','screen_name','tweet_id','reply_tweet_text'));
    $query->condition('reply_status', 'i')->condition('reply_tweet_text', null, 'is not');
    $query->orderBy('created_at', 'desc');
    $tweet = $query->execute()->fetchAssoc();
    if(!$tweet){
        return false;
    }
    **/
    $scriptContent = file_get_contents('./scripts/twitter/twitter_reply.js');
    $params = array(
        'account'=> $account['account'],
        'password'=> $account['password'],
        'screenName'=> $account['screen_name'],
        'tweetURL'=> 'https://x.com/' . $account['r_screen_name'] . '/status/' . $account['tweet_id'],
        'content'=> to_json($account['reply_tweet_text'])
    );
    foreach($params as $key=>$value){
        $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
    }
    $updateTweetReply = array(
        'reply_status'=> 'r',
        'reply_fetch_time'=> time(),
        'retry_count'=> $account['retry_count'] + 1
    );
    db_update('tb_twitter_tweet_reply_task')->fields($updateTweetReply)->condition('id', $account['r_id'])->execute();
    $updateAccount = array(
        'last_use_time'=> time()
    );
    db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
    return array(
        'success'=> true,
        'site'=> 'twitter',
        'account_cache'=> 'twitter_' . $account['screen_name'],
        'script_content'=> $scriptContent
    );
}

function process_twitter_crawler($loc){
    $mainScreenName = 'hashnewsHK';
    $sendTweetLoc = 'machine_hwy_001';
    $accountUseTimeInterval = 1*60;
    $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc'));
    $query->condition('loc', $loc)->condition('available', 'y');
    $query->condition('last_use_time', time() - $accountUseTimeInterval, '<');
    $query->orderBy('last_use_time');
    $account = $query->execute()->fetchAssoc();
    if(!$account){
        return false;
    }
    if($loc == $sendTweetLoc){
        $query = db_select('tb_twitter_monitor_account', 't')->fields('t', array('id', 'screen_name', 'crawl_interval_time', 'last_update_time', 'last_crawl_time'));
        $query->condition('screen_name', $mainScreenName);
        $query->condition('insert_time', time() - 3600, '<');
        $query->orderBy('insert_time');
        $target = $query->execute()->fetchAssoc();
        if($target){
            $scriptContent = file_get_contents('./scripts/twitter/twitter_crawler_following.js');
            $targetUrl = 'https://x.com/' . $target['screen_name'] . '/with_replies';
            $params = array(
                'account'=> $account['account'],
                'password'=> $account['password'],
                'screenName'=> $account['screen_name'],
                'targetScreenName'=> $target['screen_name'],
                'url'=>$targetUrl
            );
            foreach($params as $key=>$value){
                $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
            }
            $updateAccount = array(
                'last_use_time'=> time()
            );
            db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
            $updateTarget = array(
                'insert_time'=> time()
            );
            db_update('tb_twitter_monitor_account')->fields($updateTarget)->condition('id', $target['id'])->execute();
            return array(
                'success'=> true,
                'site'=> 'twitter',
                'account_cache'=> 'twitter_' . $account['screen_name'],
                'script_content'=> $scriptContent
            );
        }
        return false;
    }
    $query = db_select('tb_twitter_monitor_account', 't')->fields('t', array('id', 'screen_name', 'crawl_interval_time', 'last_update_time', 'last_crawl_time'));
    $query->condition('crawl_available', 'y');
    $query->condition('last_crawl_time', 0);
    //$query->condition('last_update_time', time() - 3600, '<');
    $query->orderBy('last_update_time');
    $result = $query->execute();
    while($target = $result->fetchAssoc()){
        if(time() - $target['last_update_time'] > $target['crawl_interval_time']){
            $scriptContent = file_get_contents('./scripts/twitter/twitter_crawler_tweet.js');
            $targetUrl = 'https://x.com/' . $target['screen_name'] . '/with_replies';
            $params = array(
                'account'=> $account['account'],
                'password'=> $account['password'],
                'screenName'=> $account['screen_name'],
                'targetScreenName'=> $target['screen_name'],
                'url'=>$targetUrl
            );
            foreach($params as $key=>$value){
                $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
            }
            $updateAccount = array(
                'last_use_time'=> time()
            );
            db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
            $updateTarget = array(
                'last_update_time'=> time()
            );
            db_update('tb_twitter_monitor_account')->fields($updateTarget)->condition('id', $target['id'])->execute();
            return array(
                'success'=> true,
                'site'=> 'twitter',
                'account_cache'=> 'twitter_' . $account['screen_name'],
                'script_content'=> $scriptContent
            );
        }
    }
    return false;
}

function process_twitter_list_crawler($loc){
    $sendTweetLoc = 'machine_hwy_001';
    $useTimeInterval = 10*60;
    $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc','crawl_list_url'));
    $query->condition('loc', $loc)->condition('loc', $sendTweetLoc, '!=')->condition('available', 'y');
    $query->condition('crawl_list_url', null, 'is not');
    $query->condition('last_crawl_list_time', time() - $useTimeInterval, '<');
    $query->orderBy('last_crawl_list_time');
    $account = $query->execute()->fetchAssoc();
    if(!$account){
        return false;
    }
    $scriptContent = file_get_contents('./scripts/twitter/twitter_crawler_tweet.js');
    $targetUrl = $account['crawl_list_url'];
    $params = array(
        'account'=> $account['account'],
        'password'=> $account['password'],
        'screenName'=> $account['screen_name'],
        'targetScreenName'=> $account['screen_name'],
        'url'=>$targetUrl
    );
    foreach($params as $key=>$value){
        $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
    }
    $updateAccount = array(
        'last_crawl_list_time'=> time()
    );
    db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
    return array(
        'success'=> true,
        'site'=> 'twitter',
        'account_cache'=> 'twitter_' . $account['screen_name'],
        'script_content'=> $scriptContent
    );
}

function process_twitter_continue($loc){
    $continueScreenNames = array('omekalanganyar', 'NancyChao367', 'ochi_tok', 'OhBoysOfficial', 'Radenmashotib', 'HashNewsHK');
    $sendTweetLoc = 'machine_hwy_001';
    $useTimeInterval = 1*60;
    $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc','crawl_list_url'));
    $query->condition('loc', $loc);
    //$query->condition('loc', $sendTweetLoc, '!=');
    $query->condition('available', 'y');
    //$query->condition('screen_name', $continueScreenNames);
    //$query->condition('last_use_time', time() - $useTimeInterval, '<');
    $query->orderBy('last_use_time');
    $account = $query->execute()->fetchAssoc();
    if(!$account){
        return false;
    }
    $scriptContent = file_get_contents('./scripts/twitter/twitter_continue.js');
    $params = array(
        'account'=> $account['account'],
        'password'=> $account['password'],
        'screenName'=> $account['screen_name']
    );
    foreach($params as $key=>$value){
        $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
    }
    $updateAccount = array(
        'last_use_time'=> time()
    );
    db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
    return array(
        'success'=> true,
        'site'=> 'twitter',
        'account_cache'=> 'twitter_' . $account['screen_name'],
        'script_content'=> $scriptContent
    );
}

// 单个账号处理
function process_twitter_account($screenName, $loc){
    $ip = get_remote_client_address();

    // 主账号，若当前有待发帖任务，终止当前持续任务
    if($screenName == 'hashnewsHK' && $ip=='154.219.101.126'){
        $query = db_select('tb_twitter_tweet_post_task', 'n')->fields('n', array('id','twitter_title','twitter_tweet','twitter_img'));
        $query->condition('status', 'i')->condition('twitter_tweet', null, 'is not');
        $query->condition('screen_name', 'hashnewsHK');
        $query->condition('id', 782, '>');
        $query->orderBy('id');
        $tweet = $query->execute()->fetchAssoc();
        if($tweet){
            return false;
        }
    }
    // 英文版主账号
    // loc: machine_tsj_hsx
    if($ip=='182.35.67.0'){
        $query = db_select('tb_twitter_tweet_post_task', 'n')->fields('n', array('id','twitter_title','twitter_tweet','twitter_img'));
        $query->condition('status', 'i')->condition('twitter_tweet', null, 'is not');
        $query->condition('screen_name', 'HashNews01');
        $query->condition('id', 782, '>');
        $query->orderBy('id');
        $tweet = $query->execute()->fetchAssoc();
        if($tweet){
            return false;
        }
    }

    // X List 采集
    $response = process_twitter_crawler_list($screenName);
    if($response){
        return $response;
    }
    // X List 操作，管理
    $response = process_twitter_account_list($screenName);
    if($response){
        return $response;
    }
    //if($ip == '123.128.68.29'){
    if(in_array($screenName, array('ochi_tok', 'NancyChao367'))){
        $response = process_search_keyword();
        if($response){
            return $response;
        }
        // 采集社群成员
        $response = process_community_members();
        if($response){
            return $response;
        }
        // 采集账号信息
        $response = process_twitter_account_crawler($screenName);
        if($response){
            return $response;
        }
        // 采集最新推文
        $response = process_twitter_crawler_tweet();
        if($response){
            return $response;
        }
        $response = process_twitter_crawler_following_follower($screenName);
        if($response){
            return $response;
        }
    }
    if($screenName == 'hashnewsHK' && $ip=='27.200.94.183'){
        // 帖子评论 - 主账号盖楼
        $response = process_main_account_reply($screenName);
        if ($response) {
            return $response;
        }
        // 主账号发私信
        $response = process_send_dm();
        if ($response) {
            return $response;
        }
        $response = process_search_keyword();
        if($response){
            return $response;
        }
        // 采集账号与主账号 - 关系
        //$response = process_twitter_main_account_relationship_crawler($screenName);
        //if($response){
        //    return $response;
        //}
        //$response = process_search_keyword();
        //if($response){
        //    return $response;
        //}
    }
    //if($screenName == 'hashnewsHK' && $ip!='154.219.101.126'){
    if($screenName == 'hashnewsHK'){
        // 帖子评论 - 主账号盖楼
        $response = process_main_account_reply($screenName);
        if ($response) {
            return $response;
        }
        // 主账号发私信
        if(mt_rand(0, 2) == 1) {
            $response = process_send_dm();
            if ($response) {
                return $response;
            }
        }
        // 关注账号
        if(mt_rand(0, 2) == 1) {
            $response = process_twitter_following_account($screenName);
            if ($response) {
                return $response;
            }
        }
        // 取消关注账号
        if(mt_rand(0, 2) == 1) {
            $response = process_twitter_cancel_following_account($screenName);
            if($response){
                return $response;
            }
        }
        // 采集社群成员
        $response = process_community_members();
        if($response){
            return $response;
        }
    }

    $currentMinute = date('i');
    if($currentMinute==1 || $currentMinute==30){
        $response = process_search_keyword();
        if($response){
            return $response;
        }
    }
    // 评论任务
    $suspendAccounts = array('ochi_tok', 'racingshop_11', 'gasem_99', 'lapikuda69', 'paulalbarto', 'ashleyortega161', 'iman_vitha', 'OhBoysOfficial');
    if($screenName == 'hashnewsHK'){
        $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc'));
        $query->fields('r', array('id','screen_name','tweet_id','reply_tweet_text','retry_count'));
        $query->leftJoin('tb_twitter_tweet_reply_task', 'r', 'a.screen_name=r.reply_screen_name');
        $query->condition('a.screen_name', $screenName)->condition('a.available', 'y');
        $query->condition('r.reply_status', 'i');
        $query->condition('r.in_reply_to_status_id', null, 'is');
        $query->orderBy('a.last_use_time');
        //$query->orderBy('r.id', 'desc');
        $query->orderRandom();
        $account = $query->execute()->fetchAssoc();
        if($account){
            $scriptContent = file_get_contents('./scripts/twitter/twitter_reply_segament.js');
            $params = array(
                'account'=> $account['account'],
                'password'=> $account['password'],
                'screenName'=> $account['screen_name'],
                'tweetURL'=> 'https://x.com/' . $account['r_screen_name'] . '/status/' . $account['tweet_id'],
                'content'=> to_json($account['reply_tweet_text'])
            );
            foreach($params as $key=>$value){
                $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
            }
            $updateTweetReply = array(
                'reply_status'=> 'r',
                'reply_fetch_time'=> time(),
                'retry_count'=> $account['retry_count'] + 1
            );
            db_update('tb_twitter_tweet_reply_task')->fields($updateTweetReply)->condition('id', $account['r_id'])->execute();
            $updateAccount = array(
                'last_use_time'=> time()
            );
            //db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
            return array(
                'success'=> true,
                'site'=> 'twitter',
                'type'=> 'twitter_reply',
                'account_cache'=> 'twitter_' . $account['screen_name'],
                'script_content'=> $scriptContent
            );
        }
    }elseif(!in_array($screenName, $suspendAccounts)){
        $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc'));
        $query->condition('a.screen_name', $screenName)->condition('a.available', 'y');
        $query->orderBy('a.last_use_time');
        $account = $query->execute()->fetchAssoc();
        $queryTask = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id','screen_name','tweet_id','reply_tweet_text','retry_count'));
        $queryTask->condition('r.reply_status', 'i');
        $queryTask->condition('r.reply_screen_name', 'hashnewsHK', '!=');
        //$task = $queryTask->orderBy('id', 'desc')->execute()->fetchAssoc();
        $task = $queryTask->orderRandom()->execute()->fetchAssoc();
        if($account && $task){
            $scriptContent = file_get_contents('./scripts/twitter/twitter_reply_segament.js');
            $params = array(
                'account'=> $account['account'],
                'password'=> $account['password'],
                'screenName'=> $account['screen_name'],
                'tweetURL'=> 'https://x.com/' . $task['screen_name'] . '/status/' . $task['tweet_id'],
                'content'=> to_json($task['reply_tweet_text'])
            );
            foreach($params as $key=>$value){
                $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
            }
            $updateTweetReply = array(
                'reply_screen_name'=> $account['screen_name'],
                'reply_status'=> 'r',
                'reply_fetch_time'=> time(),
                'retry_count'=> $task['retry_count'] + 1
            );
            db_update('tb_twitter_tweet_reply_task')->fields($updateTweetReply)->condition('id', $task['id'])->execute();
            $updateAccount = array(
                'last_use_time'=> time()
            );
            db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
            return array(
                'success'=> true,
                'site'=> 'twitter',
                'type'=> 'twitter_reply',
                'account_cache'=> 'twitter_' . $account['screen_name'],
                'script_content'=> $scriptContent
            );
        }
    }
    // 主账号
    if($screenName == 'hashnewsHK'){
        // 帖子评论 - 主账号盖楼
        $response = process_main_account_reply($screenName);
        if ($response) {
            return $response;
        }
        // 关注账号
        $response = process_twitter_following_account($screenName);
        if($response){
            return $response;
        }
        // 取消关注账号
        //$response = process_twitter_cancel_following_account($screenName);
        //if($response){
        //    return $response;
        //}
        // 主账号发私信
        $response = process_send_dm();
        if ($response) {
            return $response;
        }
    }
    // 采集最新推文
    $response = process_twitter_crawler_tweet();
    if($response){
        return $response;
    }
    // 采集账号信息
    $response = process_twitter_account_crawler($screenName);
    if($response){
        return $response;
    }
    // 采集账号 following followers 列表
    //if ($screenName != 'hashnewsHK' && in_array($screenName, array('NancyChao367', 'ochi_tok'))){
    if($screenName != 'hashnewsHK'){
        $response = process_twitter_crawler_following_follower($screenName);
        if($response){
            return $response;
        }
    }
    // 主账号删除评论
    if(false && $screenName == 'hashnewsHK'){
        $checkTime = time() - 7 * 24 * 3600;
        $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'tweet_id'));
        $query->condition('screen_name', 'HashNewsHK')->condition('in_reply_to_status_id', null, 'is not');
        $query->condition('crawl_available', 'y')->condition('retweet_count', 0)->condition('favorite_count', 0)->condition('reply_count', 0);
        $query->condition('created_at', $checkTime, '<')->condition('created_at', strtotime('2025-03-08'), '>');
        $query->orderBy('last_crawl_time');
        $tweet = $query->execute()->fetchAssoc();
        // select id,tweet_id from dt_twitter_crawler_tweet where screen_name='HashNewsHK' and crawl_available='y' and in_reply_to_status_id is not null and created_at < unix_timestamp()-7*24*3600 and created_at > unix_timestamp('2025-03-08');
        if($tweet){
            $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_delete_reply.js');
            $url = 'https://www.x.com/HashNewsHK/status/' . $tweet['tweet_id'];
            $params = array(
                'url'=> $url
            );
            foreach($params as $key=>$value){
                $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
            }
            $updateTweet = array(
                'crawl_available'=> 'n',
                'last_crawl_time'=> time()
            );
            db_update('dt_twitter_crawler_tweet')->fields($updateTweet)->condition('id', $tweet['id'])->execute();
            return array(
                'success'=> true,
                'site'=> 'twitter',
                'type'=> 'twitter_reply',
                'account_cache'=> 'twitter_' . $account['screen_name'],
                'script_content'=> $scriptContent
            );
        }
    }
    return false;
}

function process_main_account_reply($screenName){
    $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc'));
    $query->fields('r', array('id','screen_name','tweet_id','reply_tweet_text','retry_count'));
    $query->leftJoin('tb_twitter_tweet_reply_task', 'r', 'a.screen_name=r.reply_screen_name');
    $query->condition('a.screen_name', $screenName)->condition('a.available', 'y');
    $query->condition('r.reply_status', 'i');
    $query->condition('r.in_reply_to_status_id', null, 'is not');
    $query->orderBy('a.last_use_time');
    //$query->orderBy('r.id', 'desc');
    $query->orderRandom();
    $account = $query->execute()->fetchAssoc();
    if($account){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_reply_reply_segament.js');
        $params = array(
            'account'=> $account['account'],
            'password'=> $account['password'],
            'screenName'=> $account['screen_name'],
            'tweetURL'=> 'https://x.com/' . $account['r_screen_name'] . '/status/' . $account['tweet_id'],
            'content'=> to_json($account['reply_tweet_text'])
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTweetReply = array(
            'reply_status'=> 'r',
            'reply_fetch_time'=> time(),
            'retry_count'=> $account['retry_count'] + 1
        );
        db_update('tb_twitter_tweet_reply_task')->fields($updateTweetReply)->condition('id', $account['r_id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_main_account_reply',
            'script_content'=> $scriptContent
        );
    }
    // 近 3天的帖子， 有评论的6小时采集一次
    // select id,tweet_id,from_unixtime(created_at),from_unixtime(insert_time) from dt_twitter_crawler_tweet where id>4200000 and screen_name='HashNewsHK' and created_at > unix_timestamp()-3*24*3600 and in_reply_to_status_id is null and reply_count > 0;
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'tweet_id'));
    $query->condition('id', 4500000, '>')->condition('screen_name', 'HashNewsHK');
    $query->condition('created_at', time()-12*3600, '>');
    $query->condition('in_reply_to_status_id', null);
    $query->condition('reply_count', 0, '>');
    //$query->condition('last_crawl_time', time()-6*3600, '<');
    $query->condition('update_time', time()-1800, '<');
    $query->orderBy('update_time');
    $tweet = $query->execute()->fetchAssoc();
    if($tweet){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_crawler.js');
        $targetUrl = 'https://x.com/HashNewsHK/status/' . $tweet['tweet_id'];
        $params = array(
            'url'=>$targetUrl
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'update_time'=> time()
        );
        db_update('dt_twitter_crawler_tweet')->fields($updateTarget)->condition('id', $tweet['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_twitter_crawler_tweet',
            'script_content'=> $scriptContent
        );
    }
}

function process_twitter_crawler_list($screenName){
    // X List
    // https://x.com/i/lists/1899406652807500141  List 5分钟采集一次
    $useTimeInterval = 10*60;
    $query = db_select('tb_twitter_monitor_list', 'l')->fields('l', array('id','x_list_id'));
    $query->condition('last_update_time', time() - $useTimeInterval, '<');
    $query->orderBy('last_update_time');
    $account = $query->execute()->fetchAssoc();
    if($account){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_crawler.js');
        $targetUrl = 'https://x.com/i/lists/' . $account['x_list_id'];
        $params = array(
            'url'=>$targetUrl
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateAccount = array(
            'last_update_time'=> time()
        );
        db_update('tb_twitter_monitor_list')->fields($updateAccount)->condition('id', $account['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'twitter_' . $account['x_list_id'],
            'script_content'=> $scriptContent
        );
    }
}
// 主账号发私信
function process_send_dm(){
    //$count = db_select('tb_twitter_processing_account', 'p')->fields('p', array('id'))->condition('dm_time', time()-3600, '>')->execute()->rowCount();
    //if($count >= 15){
    //    return;
    //}
    $emotions = json_from_file('./emotion.json');
    // select p.id,p.screen_name,p.name from tb_twitter_processing_account p left join tb_twitter_monitor_account a on a.screen_name=p.screen_name where dm_flag='y' and dm_time=0 and followed_by is null;
    $query = db_select('tb_twitter_processing_account', 'p')->fields('p', array('id', 'screen_name', 'name'));
    $query->leftJoin('tb_twitter_monitor_account', 'a', 'a.screen_name=p.screen_name');
    //$db_or = db_or()->condition('a.can_dm', null, 'is')->condition('a.can_dm', 'y');
    //$query->condition($db_or);
    $query->condition('dm_flag', 'y')->condition('dm_time', 0);
    $query->condition('followed_by', null, 'is');
    $query->orderRandom();
    $info = $query->execute()->fetchAssoc();
    if($info){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_dm.js');
        $targetUrl = 'https://x.com/' . $info['screen_name'] . '/with_replies';
        $name = preg_replace('/[^\x{4e00}-\x{9fa5}a-zA-Z]/u', '', $info['name']);
        if(!$name){
            $name = $info['name'];
        }
        //$content = "你好 ${name} 老师，我非常喜欢你的推文，可以给个关注吗，祝大赚，财运爆棚。期待(*❦ω❦)互动，必回，感谢了！我们会分享第一手的加密货币资讯和行情！";
        //$content = "你好老师，我非常喜欢你的推文，可以给个关注吗，祝大赚，财运爆棚。期待(*❦ω❦)互动，必回，感谢了！我们会分享第一手的加密货币资讯和行情！";
        $content = "你好老师   我一直很喜欢你的推文风格，所以关注了你。欢迎回关一下我的账号，我们互相交流！" . $emotions['handshock'];
        $params = array(
            'url'=> $targetUrl,
            'content'=> to_json($content)
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'dm_time'=> time()
        );
        db_update('tb_twitter_processing_account')->fields($updateTarget)->condition('id', $info['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_send_dm',
            'script_content'=> $scriptContent
        );
    }
    // 二次发私信
    $query = db_select('tb_twitter_processing_account', 'p')->fields('p', array('id', 'screen_name', 'name'));
    $query->leftJoin('tb_twitter_monitor_account', 'a', 'a.screen_name=p.screen_name');
    $query->condition('dm_status', 'y')->condition('dm_time', 0, '>');
    $query->condition('second_dm_time', 0);
    $query->condition('followed_by', null, 'is');
    $query->condition('dm_time', time()-3*24*3600, '<');
    //$query->orderBy('dm_time', 'asc');
    $query->orderRandom();
    $info = $query->execute()->fetchAssoc();
    if($info){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_dm.js');
        $targetUrl = 'https://x.com/' . $info['screen_name'] . '/with_replies';
        $name = preg_replace('/[^\x{4e00}-\x{9fa5}a-zA-Z]/u', '', $info['name']);
        if(!$name){
            $name = $info['name'];
        }
        //$content = "你好 ${name} 老师，我非常喜欢你的推文，可以给个关注吗，祝大赚，财运爆棚。期待(*❦ω❦)互动，必回，感谢了！我们会分享第一手的加密货币资讯和行情！";
        //$content = "祝你抓住牛市行情、锁定热点爆款、买啥啥暴涨！ 期待大佬回关支持，在币圈浪起来，笑傲加密江湖！";
        //$content = "你好老师，很喜欢你的推文，关注了，也希望回关一下  感谢";
        $content = "你好老师   我一直很喜欢你的推文风格，所以关注了你。欢迎回关一下我的账号，我们互相交流！" . $emotions['handshock'];
        $params = array(
            'url'=> $targetUrl,
            'content'=> to_json($content)
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'second_dm_time'=> time()
        );
        db_update('tb_twitter_processing_account')->fields($updateTarget)->condition('id', $info['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_send_dm',
            'script_content'=> $scriptContent
        );
    }
}
// 关键字采集
function process_search_keyword(){
    $query = db_select('tb_search_x_keywords', 'w')->fields('w', array('id', 'word'));
    $query->condition('del_flag', 0);
    //$query->condition('last_update_time', time()-4*3600, '<');
    $query->condition('last_update_time', 0);
    $query->orderBy('last_update_time');
    $word = $query->execute()->fetchAssoc();
    if($word){
        $keyWord = $word['word'];
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_community_crawler.js');
        //$targetUrl = 'https://x.com/search?q=' . $keyWord . '&src=typed_query&f=live';
        //$targetUrl = 'https://x.com/search?q=' . urlencode($keyWord) . '%20lang%3Azh-cn&src=typed_query&f=live';
        $targetUrl = 'https://x.com/search?q=' . urlencode($keyWord) . '&src=typed_query&f=user';
        $params = array(
            'url'=>$targetUrl
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'last_update_time'=> time()
        );
        db_update('tb_search_x_keywords')->fields($updateTarget)->condition('id', $word['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_search_keyword',
            'script_content'=> $scriptContent
        );
    }
}
// 采集社群 成员列表
function process_community_members(){
    $sql = "select id,rest_id,member_count,topic_name,status,s.*,name,l.last_crawl_time from tb_twitter_community_list l left join ( select community_id,count(*) all_num,sum(if(is_blue_verified='1',1,0)) blue_num from tb_twitter_community_members group by community_id) s on l.rest_id=s.community_id where status='y' and last_crawl_time=0 order by last_crawl_time;";
    $group = db_query($sql, array())->fetchAssoc();
    if($group){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_community_crawler.js');
        $targetUrl = 'https://x.com/i/communities/' . $group['rest_id'] . '/members';
        $params = array(
            'url'=>$targetUrl
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'last_crawl_time'=> time()
        );
        db_update('tb_twitter_community_list')->fields($updateTarget)->condition('id', $group['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_community_members',
            'script_content'=> $scriptContent
        );
    }
}

function process_twitter_crawler_tweet(){
    // 采集已关注但还未评论过的账号帖子列表
    $sql = "select p.screen_name,t.task_num from tb_twitter_processing_account p left join (select screen_name,count(*) task_num from tb_twitter_tweet_reply_task where reply_screen_name='hashnewsHK' group by screen_name) t on p.screen_name=t.screen_name where status='y' and followed_by is null and (task_num is null or task_num<2)";
    $result = db_query($sql, array());
    $targets = array();
    while($row = $result->fetchAssoc()){
        $targets[] = $row['screen_name'];
    }
    $query = db_select('tb_twitter_monitor_account', 't')->fields('t', array('id', 'screen_name', 'crawl_interval_time', 'last_update_time', 'last_crawl_time'));
    $query->condition('crawl_available', 'y');
    //$query->condition('is_blue_verified', null, 'is');
    $query->condition('screen_name', $targets);
    //$query->condition('last_crawl_time', 0);
    $query->condition('last_update_time', time() - 3*24*3600, '<');
    //$query->orderBy('last_update_time');
    $query->orderRandom();
    $result = $query->execute();
    while($target = $result->fetchAssoc()){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_following_crawler.js');
        $targetUrl = 'https://x.com/' . $target['screen_name'] . '/with_replies';
        $params = array(
            'url'=>$targetUrl,
            'targetScreenName'=> $target['screen_name']
        );
        //$scriptContent = file_get_contents('./scripts/twitter/twitter_segament_crawler.js');
        //$targetUrl = 'https://x.com/' . $target['screen_name'];
        //$params = array(
        //    'url'=>$targetUrl
        //);
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'crawl_interval_time'=> 11111,
            'last_update_time'=> time()
        );
        db_update('tb_twitter_monitor_account')->fields($updateTarget)->condition('id', $target['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_twitter_crawler_tweet',
            'script_content'=> $scriptContent
        );
    }
    // 采集 top 1000 账号最新帖子
    // select id,screen_name,crawl_interval_time,last_update_time,last_crawl_time from tb_twitter_monitor_account where crawl_available='y' and reply_flag='y' and last_update_time < unix_timestamp()-12*3600 order by last_update_time;
    $query = db_select('tb_twitter_monitor_account', 't')->fields('t', array('id', 'screen_name', 'crawl_interval_time', 'last_update_time', 'last_crawl_time'));
    $query->condition('crawl_available', 'y');
    $query->condition('reply_flag', 'y');
    $query->condition('last_update_time', time() - 6*3600, '<');
    //$query->orderBy('last_update_time');
    $query->orderRandom();
    $result = $query->execute();
    while($target = $result->fetchAssoc()){
        //$scriptContent = file_get_contents('./scripts/twitter/twitter_segament_following_crawler.js');
        //$targetUrl = 'https://x.com/' . $target['screen_name'] . '/with_replies';
        //$params = array(
        //    'url'=>$targetUrl,
        //    'targetScreenName'=> $target['screen_name']
        //);
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_crawler.js');
        $targetUrl = 'https://x.com/' . $target['screen_name'] . '/with_replies';
        $params = array(
            'url'=>$targetUrl
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'last_update_time'=> time()
        );
        db_update('tb_twitter_monitor_account')->fields($updateTarget)->condition('id', $target['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_twitter_crawler_tweet_1000',
            'script_content'=> $scriptContent
        );
    }
}

function process_twitter_crawler_following_follower(){
    // 采集符合要求账号的 following follower 列表
    $query = db_select('tb_twitter_monitor_account', 't')->fields('t', array('id', 'screen_name', 'crawl_interval_time', 'last_update_time', 'last_crawl_time'));
    //$query->condition('is_blue_verified', '1');
    $query->condition('crawl_available', 'y')->condition('ai_judge_industry', '加密货币')->condition('ai_judge_lang', '中文');
    $query->condition('crawl_interval_time', 11111, '!=');
    //$query->orderBy('followers_count', 'desc');
    $query->orderRandom();
    $account= $query->execute()->fetchAssoc();
    if($account){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_following_crawler.js');
        $targetUrl = 'https://x.com/' . $account['screen_name'] . '/with_replies';
        $params = array(
            'url'=>$targetUrl,
            'targetScreenName'=> $account['screen_name']
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $item = array(
            'crawl_interval_time'=> 11111
        );
        db_update('tb_twitter_monitor_account')->fields($item)->condition('id', $account['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_twitter_crawler_following_follower',
            'script_content'=> $scriptContent
        );
    }
    return false;
}

function process_twitter_account_list($screenName){
    // X List 操作
    $continueScreenNames = array('ochi_tok');
    //$continueScreenNames = array('ochi_tok', 'NancyChao367');
    if(in_array($screenName, $continueScreenNames)){
        $monitorListMap = array(
            //'NancyChao367'=> 'https://x.com/i/lists/1899406652807500141',
//            'NancyChao367'=> 'https://x.com/i/lists/1927620406816747548',   // KOL - 001
            //'NancyChao367'=> 'https://x.com/i/lists/1927620307852177752',
            'ochi_tok'=> 'https://x.com/i/lists/1927619694665896114',
            //'omekalanganyar'=> 'https://x.com/i/lists/1899695317895012558',
            //'Radenmashotib'=> 'https://x.com/i/lists/1899698071942127826'
        );
        $monitorList = $monitorListMap[$screenName];
        if(in_array($screenName, array('ochi_tok'))){
            $query = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('screen_name'));
            $query->leftJoin('tb_twitter_processing_account', 'p', 'p.screen_name=a.screen_name');
            $query->condition('p.status', 'y')->condition('p.following', '1')->condition('p.followed_by', null, 'is');
            $query->condition('a.crawl_available', 'y');
            //$query->condition('reply_flag', 'y');
            $query->condition('a.x_list_id', null, 'is');
            $query->condition('a.ai_judge_industry', array('加密货币', '金融'));
            $query->condition('a.ai_judge_lang', '中文');
            $query->condition('a.is_blue_verified', 1);
            //$query->orderBy('a.followers_count', 'desc');
            $query->orderRandom();
            $account = $query->execute()->fetchAssoc();
            if(!$account){
                $query = db_select('tb_twitter_kol_account', 'k')->fields('k', array('screen_name'));
                $query->leftJoin('tb_twitter_monitor_account', 'a', 'k.screen_name=a.screen_name');
                $query->condition('x_list_id', null, 'is');
                $query->orderBy('followers_count', 'desc');
                $account = $query->execute()->fetchAssoc();
            }
            if($account){
                $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_list.js');
                $params = array(
                    'screenName'=> '@' . $account['screen_name'],
                    'listURL'=> $monitorList
                );
                foreach($params as $key=>$value){
                    $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
                }
                $updateAccount = array(
                    'last_crawl_list_time'=> time()
                );
                db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('screen_name', $screenName)->execute();
                return array(
                    'success'=> true,
                    'site'=> 'twitter',
                    'type'=> 'twitter_reply',
                    'account_cache'=> 'twitter_' . $account['screen_name'],
                    'script_content'=> $scriptContent
                );
            }
        }
        /**
        $useTimeInterval = 10*60;
        $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('id','account','password','screen_name','loc','crawl_list_url'));
        $query->condition('available', 'y');
        $query->condition('screen_name', $screenName);
        $query->condition('last_crawl_list_time', time() - $useTimeInterval, '<');
        $query->orderBy('last_crawl_list_time');
        $account = $query->execute()->fetchAssoc();
        if($account){
            $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_crawler.js');
            $params = array(
                'url'=> $monitorList
            );
            foreach($params as $key=>$value){
                $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
            }
            $updateAccount = array(
                'last_crawl_list_time'=> time()
            );
            db_update('tb_twitter_guid_account')->fields($updateAccount)->condition('id', $account['id'])->execute();
            return array(
                'success'=> true,
                'site'=> 'twitter',
                'type'=> 'twitter_reply',
                'account_cache'=> 'twitter_' . $account['screen_name'],
                'script_content'=> $scriptContent
            );
        }
        **/
    }
    return false;
}

function process_twitter_account_crawler($screenName){
    // 采集账号
    // select id,screen_name,name from tb_twitter_monitor_account where crawl_available='y' and last_crawl_time=0 and crawl_interval_time=11111 and ai_judge_lang is null;
    //$names = array('0xSilver_Time', 'trn81383164', 'devilcatbtc', 'Aurora_Lashao', 'ytsai_realtor', 'moonkimtan', 'Pussy53154105', '0rQdwNnLHRlPk9k', 'fififilin', 'met_lparmy', 'zhenFUO', 'ChintinB', 'chuhaiqu', 'yiboyun613', 'chuchu_isme', 'liang1387316', 'yaoyaogm', 'jwei1003', 'Khaos_DS', 'EVE88_X', 'MelaniaTrumpo', 'ashiikesnow', 'nocta_mvp');
    $query = db_select('tb_twitter_monitor_account', 't')->fields('t', array('id', 'screen_name', 'crawl_interval_time', 'last_update_time', 'last_crawl_time'));
    $query->condition('crawl_available', 'y');
    //$query->condition('is_blue_verified', '1');
    //$query->condition('is_blue_verified', null, 'is');
    //$query->condition('name', null, 'is');
    $query->condition('last_crawl_time', 0);
    //$query->condition('last_update_time', time() - 3600, '<');
    $query->condition('crawl_interval_time', 11111, '!=');
    $query->condition('ai_judge_lang', null, 'is');
    //$query->orderBy('last_update_time');
    $query->orderRandom();
    $result = $query->execute();
    while($target = $result->fetchAssoc()){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_crawler.js');
        $targetUrl = 'https://x.com/' . $target['screen_name'] . '/with_replies';
        $params = array(
            'url'=>$targetUrl
        );
        //$scriptContent = file_get_contents('./scripts/twitter/twitter_segament_following_crawler.js');
        //$targetUrl = 'https://x.com/' . $target['screen_name'];
        //$params = array(
        //    'url'=>$targetUrl,
        //    'targetScreenName'=> $target['screen_name']
        //);
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            //'crawl_interval_time'=> 11111,
            'last_update_time'=> time()
        );
        db_update('tb_twitter_monitor_account')->fields($updateTarget)->condition('id', $target['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_twitter_account_crawler',
            'script_content'=> $scriptContent
        );
    }
    return false;
}

function process_twitter_main_account_relationship_crawler(){
    $query = db_select('tb_twitter_monitor_account', 't')->fields('t', array('id', 'screen_name', 'crawl_interval_time', 'last_update_time', 'last_crawl_time'));
    $query->leftJoin('tb_twitter_processing_account', 'p', 'p.screen_name=t.screen_name');
    $query->condition('crawl_available', 'y')->condition('can_dm', 'y');
    $query->condition('p.status', 'y')->condition('dm_flag', 'y');
    //$query->condition('dm_status', 'n');
    $query->condition('followed_by', null, 'is')->condition('blocked_by', null, 'is');
    $query->condition('t.last_update_time', strtotime('2025-07-10'), '<');
    $query->orderBy('p.id');
    //$query->orderBy('t.last_update_time');
    //$query->orderRandom();
    $result = $query->execute();
    while($target = $result->fetchAssoc()){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_crawler.js');
        $targetUrl = 'https://x.com/' . $target['screen_name'] . '/with_replies';
        $params = array(
            'url'=>$targetUrl
        );
        //$scriptContent = file_get_contents('./scripts/twitter/twitter_segament_following_crawler.js');
        //$targetUrl = 'https://x.com/' . $target['screen_name'];
        //$params = array(
        //    'url'=>$targetUrl,
        //    'targetScreenName'=> $target['screen_name']
        //);
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'last_update_time'=> time()
        );
        db_update('tb_twitter_monitor_account')->fields($updateTarget)->condition('id', $target['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_twitter_main_account_relationship_crawler',
            'script_content'=> $scriptContent
        );
    }
    return false;
}

// 关注账号
function process_twitter_following_account($screenName){
    // select id,screen_name from tb_twitter_processing_account where status='y' and blocked_by is null and followed_by is null and following is null and last_following_time=0 and cancel_follow_flag='n';
    $query = db_select('tb_twitter_processing_account', 'a')->fields('a', array('id', 'screen_name'));
    $query->condition('status', 'y');
    $query->condition('blocked_by', null, 'is')->condition('followed_by', null, 'is')->condition('following', null, 'is');
    $query->condition('cancel_follow_flag', 'n');
    $query->condition('last_following_time', 0);
    //$query->orderBy('last_following_time');
    $query->orderRandom();
    $result = $query->execute();
    while($target = $result->fetchAssoc()){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_following.js');
        $targetUrl = 'https://x.com/' . $target['screen_name'] . '/with_replies';
        $params = array(
            'url'=>$targetUrl
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'last_following_time'=> time()
        );
        db_update('tb_twitter_processing_account')->fields($updateTarget)->condition('id', $target['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_twitter_following_account',
            'script_content'=> $scriptContent
        );
    }

    // 二次关注
    $query = db_select('tb_twitter_processing_account', 'a')->fields('a', array('id', 'screen_name'));
    $query->condition('followed_by', null, 'is');
    $query->condition('status', 'y');
    $query->condition('dm_status', 'n');
    $query->condition('second_following_time', 0);
    $query->condition('cancel_following_time', time()-7*24*3600, '>');
    //$query->orderBy('last_following_time');
    $query->orderRandom();
    $result = $query->execute();
    while($target = $result->fetchAssoc()){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_following.js');
        $targetUrl = 'https://x.com/' . $target['screen_name'] . '/with_replies';
        $params = array(
            'url'=>$targetUrl
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'second_following_time'=> time()
        );
        db_update('tb_twitter_processing_account')->fields($updateTarget)->condition('id', $target['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'process_twitter_following_account_second' ,
            'script_content'=> $scriptContent
        );
    }
    return false;
}
// 取消关注账号
function process_twitter_cancel_following_account($screenName){
    // 采集已关注 评论超过5次  还未关注的账号列表
    //$sql = "select p.id,p.screen_name,t.task_num from tb_twitter_processing_account p left join (select screen_name,count(*) task_num from tb_twitter_tweet_reply_task where reply_screen_name='hashnewsHK' group by screen_name) t on p.screen_name=t.screen_name where status='y' and following='1' and followed_by is null and cancel_following_time=0 and task_num>=5 order by task_num desc limit 1";
    // 查询取关标志
    $sql = "select id,screen_name from tb_twitter_processing_account where followed_by is null and cancel_follow_flag = 'y' and cancel_following_time=0 and id in (37,59,132,136,223,473,598,715,732,800,806,821,947,1513,1556,1805,1970,2186,2322,2423,2759,2914,3197,3218,3269,3306,3378,3481,3600,3720,3741,3823,3928,3980,4166,4246,4276,4305,4413,4492,4573,4583,4627,4638,4652,4723,4748,4829,4897,4933,4941,5025,5116,5146,5361,5388,5503,5553,5610,5644,5652,5697,5706,5746,5749,6046,6053,6183,6311,6444,6451,6558,6632,6653,6693,6698,6748,6811,6854,6898,6929,6932,6959,7054,7081,7090,7108,7129,7170,7359,7496,7542,7553,7594,7946,8006,8036,8064,8071,8136,8161,8223,8234,8244,8248,8306,8593,8620,8641,8647,8669,8702,8743,8756,8773,8787,8908,9087,9119,9218,9235,9499,9521,9545,9574,9661,9734,9810,9827,9837,9852,10007,10093,10095,10192,10227,10322,10345,10394,10406,10409,10420,10438,10482,10540,10541,10624,10697,10727,10731,10864,10873,10971,11083,11121,11130,11133,11158,11166,11171,11172,11229,11252,11295,11300,11309,11312,11369,11410,11451,11457,11466,11540,11549,11603,11610,11620,11648,11702,11712,11742,11758,11879,11919,11945,12026,12043,12057,12066,12209,12326,12327,12403,12450,12511,12515,12564,12589,12605,12635) order by rand() limit 1";
    $result = db_query($sql, array());
    $target = $result->fetchAssoc();
    if($target){
        $scriptContent = file_get_contents('./scripts/twitter/twitter_segament_cancel_following.js');
        $targetUrl = 'https://x.com/' . $target['screen_name'] . '/with_replies';
        $params = array(
            'url'=>$targetUrl
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTarget = array(
            'cancel_following_time'=> time()
        );
        db_update('tb_twitter_processing_account')->fields($updateTarget)->condition('id', $target['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'type'=> 'twitter_reply',
            'account_cache'=> 'twitter_' . $screenName,
            'script_content'=> $scriptContent
        );
    }
    return false;
}
// 新发帖处理
function twitter_save_create_tweet($data){
    $data = $data[0];
    $tweetId = $data['id_str'];
    $postTime = strtotime($data['created_at']);
    $screenName = $data['user']['screen_name'];
    if(isset($data['in_reply_to_status_id_str']) && $data['in_reply_to_status_id_str']){
        $updateReply = array(
            'reply_status'=> 's',
            'reply_tweet_id'=> $tweetId,
            'reply_tweet_post_time'=> $postTime,
            'reply_finish_time'=> time()
        );
        $reply = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id'))->condition('reply_status', 'r')->condition('reply_screen_name', $screenName)->condition('tweet_id', $data['in_reply_to_status_id_str'])->orderBy('reply_fetch_time', 'desc')->range(0, 1)->execute()->fetchAssoc();
        if($reply){
            db_update('tb_twitter_tweet_reply_task')->fields($updateReply)->condition('id', $reply['id'])->execute();
        }
    }else{
        $updateTweet = array(
            'status'=> 's',
            'tweet_id'=> $tweetId,
            'tweet_post_time'=> $postTime,
            'finish_time'=> time()
        );
        $info = db_select('tb_twitter_tweet_post_task', 'p')->fields('p', array('id'))->condition('status', 'r')->condition('screen_name', $screenName)->orderBy('fetch_time', 'desc')->range(0, 1)->execute()->fetchAssoc();
        if($info){
            db_update('tb_twitter_tweet_post_task')->fields($updateTweet)->condition('id', $info['id'])->execute();
        }
    }
    /*
     $updateTweet = array(
         'twitter_status'=> 's',
         'twitter_tweet_id'=> $tweetId,
         'twitter_tweet_post_time'=> $postTime,
         'twitter_finish_time'=> time()
     );
     $info = db_select('dt_news_list', 'n')->fields('n', array('id'))->condition('twitter_status', 'r')->condition('twitter_screen_name', $screenName)->orderBy('twitter_fetch_time', 'desc')->range(0, 1)->execute()->fetchAssoc();
     if($info){
         db_update('dt_news_list')->fields($updateTweet)->condition('id', $info['id'])->execute();
     }
     */
}

// 保存列表添加账号
function twitter_save_list_add_member($items){
    foreach($items as $item){
        $listId = $item['listId'];
        $twitterId = $item['userId'];
        $update = array(
            'x_list_id'=> $listId
        );
        db_update('tb_twitter_monitor_account')->fields($update)->condition('tweet_id', $twitterId)->execute();
    }
}

// 账号被验证
function twitter_save_locked_user($screenNames){
    $screenName = $screenNames[0];
    $updateItem = array(
        'available'=> 'n'
    );
    db_update('tb_twitter_guid_account')->fields($updateItem)->condition('screen_name', $screenName)->execute();
}

// 保存采集到的账号信息
function process_save_twitter_user($items){
    foreach($items as $item){
        $screenName = $item['screen_name'];
        if(isset($item['crawl_available']) && $item['crawl_available']=='n'){
            $info = array(
                'crawl_available'=> 'n'
            );
            db_update('tb_twitter_monitor_account')->fields($info)->condition('screen_name', $screenName)->execute();
            continue;
        }
        $info = array(
            'tweet_id'=> $item['id_str'],
            'screen_name'=> $screenName,
            'name'=> $item['name'],
            'profile_picture'=> $item['profile_image_url_https'],
            'profile_banner_url'=> get_value_from_array($item, 'profile_banner_url'),
            'location'=> get_value_from_array($item, 'location', ''),
            'description'=> $item['description'],
            'followers_count'=> $item['followers_count'],
            'friends_count'=> $item['friends_count'],
            'statuses_count'=> $item['statuses_count'],
            'media_count'=> $item['media_count'],
            'like_count'=> $item['like_count'],
            'created_at'=> isset($item['created_at'])? strtotime($item['created_at']) : null,
            'geo_enabled'=> $item['geo_enabled'],
            'lang'=> $item['lang'],
            'can_dm'=> get_value_from_array($item, 'can_dm', null),
            'is_blue_verified'=> get_value_from_array($item, 'is_blue_verified', 0),
            'profile_image_shape'=> get_value_from_array($item, 'profile_image_shape', null),
            'last_crawl_time'=> time()
        );
        $exists = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id'))->condition('screen_name',  $screenName)->execute()->fetchAssoc();
        if($exists){
            db_update('tb_twitter_monitor_account')->fields($info)->condition('screen_name', $screenName)->execute();
        }else{
            db_insert('tb_twitter_monitor_account')->fields($info)->execute();
        }

    }
}
// 通过关键词收集X账号信息
function process_save_twitter_search_user($items){
    foreach($items as $item){
        $screenName = $item['screen_name'];
        $info = array(
            'tweet_id'=> $item['id_str'],
            'name'=> $item['name'],
            'screen_name'=> $screenName,
            'profile_picture'=> $item['profile_image_url_https'],
            'profile_banner_url'=> get_value_from_array($item, 'profile_banner_url'),
            'location'=> get_value_from_array($item, 'location', ''),
            'description'=> $item['description'],
            'followers_count'=> $item['followers_count'],
            'friends_count'=> $item['friends_count'],
            'statuses_count'=> $item['statuses_count'],
            'media_count'=> $item['media_count'],
            'like_count'=> $item['like_count'],
            'created_at'=> isset($item['created_at'])? strtotime($item['created_at']) : null,
            'geo_enabled'=> $item['geo_enabled'],
            'lang'=> $item['lang'],
            'can_dm'=> get_value_from_array($item, 'can_dm', null),
            'is_blue_verified'=> get_value_from_array($item, 'is_blue_verified', 0),
            'profile_image_shape'=> get_value_from_array($item, 'profile_image_shape', null),
            'last_update_time'=> time()
        );
        $exists = db_select('tb_twitter_search_collect_account', 'a')->fields('a', array('id'))->condition('screen_name', $screenName)->execute()->fetchAssoc();
        if($exists){
            db_update('tb_twitter_search_collect_account')->fields($info)->condition('id', $exists['id'])->execute();
        }else{
            $info['insert_time'] = time();
            db_insert('tb_twitter_search_collect_account')->fields($info)->execute();
        }
    }
}
// 主账号关系
function process_twitter_main_account_relationship($items){
    foreach($items as $item){
        $screenName = $item['screen_name'];
        $account = array(
            'followed_by'=> get_value_from_array($item, 'followed_by', null),
            'following'=> get_value_from_array($item, 'following', null),
            'blocked_by'=> get_value_from_array($item, 'blocked_by', null)
        );
        db_update('tb_twitter_processing_account')->fields($account)->condition('screen_name', $screenName)->execute();
    }
}
// 保存采集到的贴文信息
function process_save_twitter_tweet($items, $data){
    $typeFlag = false;
    if(isset($data['dataEx']['network_crawler']['twitter_user']) && 'HashNewsHK' === $data['dataEx']['network_crawler']['twitter_user'][0]['screen_name']){
        $typeFlag = true;
    }
    $screenName = array();
    foreach($items as $item){
        $media_url_https = '';
        $media_url_https_json = '';
        if(isset($item['entities']) && isset($item['entities']['media'])){
            if(isset($item['entities']['media'][0]) && isset($item['entities']['media'][0]['media_url_https'])){
                $media_url_https = $item['entities']['media'][0]['media_url_https'];
            }
            $urls = array();
            foreach($item['entities']['media'] as $media){
                $urls[] = $media['media_url_https'];
            }
            $media_url_https_json = to_json($urls);
        }
        $screenName = $item['user']['screen_name'];
        $info = array(
            'tweet_id'=> $item['id_str'],
            'user_id'=> $item['user']['id'],
            'screen_name'=> $item['user']['screen_name'],
            'name'=> $item['user']['name'],
            'description'=> $item['user']['description'],
            'profile_picture'=> $item['user']['profile_image_url_https'],
            'is_blue_verified'=> $item['user']['is_blue_verified'],
            'profile_image_shape'=> $item['user']['profile_image_shape'],
            'created_at'=> strtotime($item['created_at']),
            'in_reply_to_status_id'=> get_value_from_array($item, 'in_reply_to_status_id_str', null),
            'in_reply_to_user_id'=> $item['in_reply_to_user_id'],
            'retweet_count'=> $item['retweet_count'],
            'favorite_count'=> $item['favorite_count'],
            'reply_count'=> $item['reply_count'],
            'views'=> get_value_from_array($item, 'views', 0),
            'media_url_https'=> $media_url_https,
            'media_url_https_json'=> $media_url_https_json,
            'crawl_available'=> 'y',
            'last_crawl_time'=> time()
        );
        if($typeFlag){
            $info['tweet_show_type'] = get_value_from_array($item, 'tweetShowType', null);
            $info['followed_by'] = get_value_from_array($item['user'], 'followed_by', null);
            $info['following'] = get_value_from_array($item['user'], 'following', null);
            if(isset($item['user']['followed_by']) && $item['user']['followed_by']){
                db_update('tb_twitter_processing_account')->fields(array('followed_by'=>$item['user']['followed_by']))->condition('screen_name', $item['user']['screen_name'])->execute();
            }
            if(isset($item['user']['following']) && $item['user']['following']){
                db_update('tb_twitter_processing_account')->fields(array('following'=>$item['user']['following']))->condition('screen_name', $item['user']['screen_name'])->execute();
            }
        }
        $exists = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id'))->condition('tweet_id', $item['id_str'])->execute()->fetchAssoc();
        if($exists){
            db_update('dt_twitter_crawler_tweet')->fields($info)->condition('id', $exists['id'])->execute();
        }else{
            $info['full_text'] = $item['full_text'];
            $info['insert_time'] = time();
            db_insert('dt_twitter_crawler_tweet')->fields($info)->execute();
        }
    }
    if($screenName){
        $accountInfo = array(
            'last_crawl_time'=> time()
        );
        db_update('tb_twitter_monitor_account')->fields($accountInfo)->condition('screen_name', $screenName)->execute();
    }
}
// twitter 编辑过的帖子状态设置为删除
function process_save_twitter_edit_tweet_ids($ids){
    if($ids){
        db_update('dt_twitter_crawler_tweet')->fields(array('del_flag'=> 1))->condition('tweet_id', $ids)->execute();
    }
}

// 保存采集到的关注列表信息
function process_save_twitter_followings($items, $user){
    $belongScreenName = $user['screen_name'];
    foreach($items as $item){
        $belongsUserId = $item['belongs_user_id'];
        $screenName = $item['screen_name'];
        $info = array(
            'belongs_screen_name'=> $belongScreenName,
            'belongs_user_id'=> $belongsUserId,
            'screen_name'=> $screenName,
            'name'=> $item['name'],
            'profile_picture'=> $item['profile_image_url_https'],
            'profile_banner_url'=> get_value_from_array($item, 'profile_banner_url'),
            'location'=> get_value_from_array($item, 'location', ''),
            'description'=> $item['description'],
            'followers_count'=> $item['followers_count'],
            'friends_count'=> $item['friends_count'],
            'statuses_count'=> $item['statuses_count'],
            'media_count'=> $item['media_count'],
            'like_count'=> $item['like_count'],
            'created_at'=> isset($item['created_at'])? strtotime($item['created_at']) : 0,
            'geo_enabled'=> $item['geo_enabled'],
            'lang'=> $item['lang'],
            'can_dm'=> get_value_from_array($item, 'can_dm', null),
            'is_blue_verified'=> get_value_from_array($item, 'is_blue_verified', null),
            'profile_image_shape'=> get_value_from_array($item, 'profile_image_shape', null),
            'last_update_time'=> time()
        );
        if($belongScreenName == 'HashNewsHK'){
            $info['followed_by'] = get_value_from_array($item, 'followed_by', null);
            $info['following'] = get_value_from_array($item, 'following', null);
        }
        $exists = db_select('tb_twitter_followings_account', 't')->fields('t', array('id'))->condition('belongs_screen_name', $belongScreenName)->condition('screen_name', $screenName)->execute()->fetchAssoc();
        if($exists){
            db_update('tb_twitter_followings_account')->fields($info)->condition('id', $exists['id'])->execute();
        }else{
            $info['insert_time'] = time();
            db_insert('tb_twitter_followings_account')->fields($info)->execute();
        }
    }
}
// 保存采集到的粉丝列表
function process_save_twitter_followers($items, $user){
    $belongScreenName = $user['screen_name'];
    foreach($items as $item){
        $belongsUserId = $item['belongs_user_id'];
        $screenName = $item['screen_name'];
        $info = array(
            'belongs_screen_name'=> $belongScreenName,
            'belongs_user_id'=> $belongsUserId,
            'screen_name'=> $screenName,
            'name'=> $item['name'],
            'profile_picture'=> $item['profile_image_url_https'],
            'profile_banner_url'=> get_value_from_array($item, 'profile_banner_url'),
            'location'=> get_value_from_array($item,'location', ''),
            'description'=> $item['description'],
            'followers_count'=> $item['followers_count'],
            'friends_count'=> $item['friends_count'],
            'statuses_count'=> $item['statuses_count'],
            'media_count'=> $item['media_count'],
            'like_count'=> $item['like_count'],
            'created_at'=> isset($item['created_at'])? strtotime($item['created_at']) : 0,
            'geo_enabled'=> $item['geo_enabled'],
            'lang'=> $item['lang'],
            'can_dm'=> get_value_from_array($item, 'can_dm', null),
            'is_blue_verified'=> get_value_from_array($item, 'is_blue_verified', null),
            'profile_image_shape'=> get_value_from_array($item, 'profile_image_shape', null),
            'last_update_time'=> time()
        );
        $exists = db_select('tb_twitter_followers_account', 't')->fields('t', array('id'))->condition('belongs_screen_name', $belongScreenName)->condition('screen_name', $screenName)->execute()->fetchAssoc();
        if($exists){
            db_update('tb_twitter_followers_account')->fields($info)->condition('id', $exists['id'])->execute();
        }else{
            $info['insert_time'] = time();
            db_insert('tb_twitter_followers_account')->fields($info)->execute();
        }
        if($belongScreenName == 'HashNewsHK'){
            $update = array(
                'followed_by'=> get_value_from_array($item, 'followed_by', null),
                'following'=> get_value_from_array($item, 'following', null)
            );
            db_update('tb_twitter_followings_account')->fields($update)->condition('belongs_screen_name', $belongScreenName)->condition('screen_name', $screenName)->execute();
        }
    }
}

// 账号已发过私信标记
function process_save_tw_dm_msgs($tweetIds){
    $names = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('screen_name'))->condition('tweet_id', $tweetIds, 'in')->execute()->fetchCol();
    if($names){
        $updateCount = db_update('tb_twitter_processing_account')->fields(array('dm_status'=> 'y'))->condition('screen_name', $names)->execute();
        echo "all count: " . count($tweetIds) . ', updateCount: ' . $updateCount;
    }
}

// X 社群列表
function process_tb_twitter_community_list($items){
    foreach($items as $item){
        $info = array(
            'rest_id'=> $item['rest_id'],
            'name'=> $item['name'],
            'member_count'=> $item['member_count'],
            'topic_name'=> get_value_from_array($item, 'topic_name'),
            'last_update_time'=> time()
        );
        $exists = db_select('tb_twitter_community_list', 'l')->fields('l', array('id'))->condition('rest_id', $item['rest_id'])->execute()->fetchAssoc();
        if($exists){
            db_update('tb_twitter_community_list')->fields($info)->condition('id', $exists['id'])->execute();
        }else{
            $info['insert_time'] = time();
            db_insert('tb_twitter_community_list')->fields($info)->execute();
        }
    }
}

function process_save_twitter_community_members($items){
    $totalCount = count($items);
    $blueCount = 0;
    $addCount = 0;
    $updateCount = 0;
    foreach($items as $item){
        $screenName = $item['screen_name'];
        $isBlueVerified = $item['is_blue_verified'];
        if($isBlueVerified){
            $blueCount++;
            $account = array(
                'name'=> $item['name'],
                'screen_name'=> $screenName,
                'is_blue_verified'=> $isBlueVerified
            );
            $exists = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id', 'is_blue_verified'))->condition('screen_name',  $screenName)->execute()->fetchAssoc();
            if(!$exists){
                $addCount++;
                $account['insert_time'] = time();
                db_insert('tb_twitter_monitor_account')->fields($account)->execute();
            }else{
                if(!$exists['is_blue_verified']){
                    $updateCount++;
                    db_update('tb_twitter_monitor_account')->fields($account)->condition('screen_name', $screenName)->execute();
                }
            }
        }
        // 社群成员
        $member = array(
            'community_id'=> $item['community_id'],
            'screen_name'=> $screenName,
            'name'=> $item['name'],
            'is_blue_verified'=> $isBlueVerified,
            'update_time'=> time()
        );
        $exists = db_select('tb_twitter_community_members', 'm')->fields('m', array('id'))->condition('community_id', $item['community_id'])->condition('screen_name',  $screenName)->execute()->fetchAssoc();
        if(!$exists){
            $member['insert_time'] = time();
            db_insert('tb_twitter_community_members')->fields($member)->execute();
        }else{
            db_update('tb_twitter_community_members')->fields($member)->condition('id', $exists['id'])->execute();
        }
    }
    echo "\ntotalCount: ${totalCount}, blueCount:${blueCount}, addCount: ${addCount}, updateCount: ${updateCount}\n";
}