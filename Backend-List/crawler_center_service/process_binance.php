<?php
function binance_save_announcement_list($news){
    foreach($news as $item){
        $url = $item['new_url'];
        $urlMd5 = md5($url);
        $new = array(
            'site'=> $item['site'],
            'new_id'=> $item['new_id'],
            'new_type'=> $item['new_type'],
            'new_url'=> $url,
            'new_url_md5'=> $urlMd5,
            'title'=> $item['title'],
            'publish_time'=> $item['publish_time'],
            'primary_category'=> $item['primary_category'],
            'last_update_time'=> time()
        );
        $exists = db_select('dt_news_list', 'n')->fields('n', array('id'))->condition('new_url_md5', $urlMd5)->execute()->fetchAssoc();
        if($exists) {
            db_update('dt_news_list')->fields($new)->condition('id', $exists['id'])->execute();
        }else{
            $new['insert_time'] = time();
            db_insert('dt_news_list')->fields($new)->execute();
        }
    }
    $update = array(
        'status'=> 's',
        'crawler_finish_time'=> time()
    );
    db_update('tb_monitor_crawler_target')->fields($update)->condition('id', 9)->execute();
}

function binance_save_announcement_detail($new){
    $newId = $new['id'];
    $content = $new['content'];
    $update = array(
        'content'=> $content,
        'last_crawler_time'=> time(),
        'status'=> 's',
        'crawler_finish_time'=> time()
    );
    db_update('dt_news_list')->fields($update)->condition('new_id', $newId)->execute();
}

function binance_save_binanceFearAndGreedIndex($info){
    $hourTimestamp = strtotime(date('Y-m-d H:00:00'));
    $item = array(
        'create_timestamp'=> $hourTimestamp,
        'current_value'=> $info['currentValue'],
        'yesterday_value'=> $info['yesterdayValue'],
        'last_week_value'=> $info['lastWeekValue'],
        'bearish_value'=> $info['bearishValue'],
        'bullish_value'=> $info['bullishValue']
    );
    $exists = db_select('dt_fear_greed_index', 'f')->fields('f', array('id'))->condition('create_timestamp', $hourTimestamp)->execute()->fetchAssoc();
    if($exists){
        db_update('dt_fear_greed_index')->fields($item)->condition('id', $exists['id'])->execute();
    }else{
        db_insert('dt_fear_greed_index')->fields($item)->execute();
    }
    db_update('tb_monitor_crawler_target')->fields(array('crawler_finish_time'=>time()))->condition('id', 4)->execute();
}


