<?php
function process_weibo($loc){
    global $combat_db_options;
    $sendTweetLoc = 'machine_hwy_001';
    $weiboAccount = 'weibo_hashnews';
    if($loc == $sendTweetLoc){
        $timeInterval = 1*60;
        $query = db_select('tb_twitter_tweet_post_task', 'n')->fields('n', array('id','twitter_title','twitter_tweet','twitter_img'));
        $query->condition('screen_name', 'hashnewsHK');
        $query->condition('weibo_status', 'i')->condition('twitter_tweet', null, 'is not');
        $query->condition('id', 7000, '>');
        $query->orderBy('id');
        $tweet = $query->execute()->fetchAssoc();
        if(!$tweet){
            return array('success'=> false);
        }
        $scriptContent = file_get_contents('./scripts/weibo/weibo_post.js');
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
            'account'=> 'weibo_account',
            'password'=> 'weibo_password',
            'screenName'=> $weiboAccount,
            'title'=> to_json($tweet['twitter_title']),
            'content'=> to_json($tweet['twitter_tweet']),
            'image1URL'=> $image,
            'image1Name'=> $imageName
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $updateTweet = array(
            'weibo_status'=> 'r',
            'weibo_fetch_time'=> time()
        );
        db_update('tb_twitter_tweet_post_task')->fields($updateTweet)->condition('id', $tweet['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'twitter',
            'account_cache'=> 'weibo_' . $weiboAccount,
            'script_content'=> $scriptContent
        );
    }
    return array('success'=> false);
}

function process_weibo_create_post($data){
    $data = $data[0];
    $tweetId = $data['mblogid'];
    $postTime = strtotime($data['created_at']);
    $userId = $data['user_id'];
    $text = $data['text_raw'];
    $url = 'https://weibo.com/' .$userId. '/' . $tweetId;

    $updateTweet = array(
        'weibo_status'=> 's',
        'weibo_url'=> $url,
        'weibo_post_time'=> $postTime,
        'weibo_finish_time'=> time()
    );
    $info = db_select('tb_twitter_tweet_post_task', 'p')->fields('p', array('id'))->condition('weibo_status', 'r')->orderBy('weibo_fetch_time', 'desc')->range(0, 1)->execute()->fetchAssoc();
    if($info){
        db_update('tb_twitter_tweet_post_task')->fields($updateTweet)->condition('id', $info['id'])->execute();
    }
}


















