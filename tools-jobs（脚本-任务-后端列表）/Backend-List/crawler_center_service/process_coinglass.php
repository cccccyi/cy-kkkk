<?php
function crawl_coinglass($loc){
    // new detail
    // PANews新闻详情采集 new_type 1为深度新闻， 2为快讯，快讯不需要采集详情页
    // Binance 币安公告详情信息采集
    $query = db_select('dt_news_list', 'n')->fields('n', array('id', 'new_url'));
    $query->condition('status', 'i')->condition('new_type', array('1', 'announce'), 'in');
    $query->orderBy('crawler_finish_time');
    $info = $query->execute()->fetchAssoc();
    if($info){
        $scriptContent = file_get_contents('./scripts/open_single_url.js');
        $params = array(
            'url'=> $info['new_url']
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        $update = array(
            'status'=> 'r',
            'crawler_fetch_time'=> time()
        );
        db_update('dt_news_list')->fields($update)->condition('id', $info['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'panews',
            'account_cache'=> 'panews_account_001',
            'script_content'=> $scriptContent
        );
    }
    // profundity news list 深度新闻列表
    $newsListCrawlerInterval = 20;
    if($loc == 'machine_hwy_001'){
        $newsListCrawlerInterval = 300;
    }
    $query = db_select('tb_monitor_crawler_target', 'm')->fields('m', array('id','url'));
    $query->condition('site', array('panews'));
    $db_or = db_or()->condition('status', array('i', 's'))->condition('last_crawler_time', time()-300, '<');
    $query->condition($db_or);
    $query->condition('last_crawler_time', time() - $newsListCrawlerInterval, '<');
    $query->orderBy('last_crawler_time');
    $info = $query->execute()->fetchAssoc();
    if($info){
        $scriptContent = file_get_contents('./scripts/panews/script_news_list.js');
        $params = array(
            'url'=> $info['url']
        );
        foreach($params as $key=>$value){
            $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
        }
        db_update('tb_monitor_crawler_target')->fields(array('status'=>'r'))->condition('id', $info['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'panews',
            'account_cache'=> 'panews_account_001',
            'script_content'=> $scriptContent
        );
    }
    return array('success'=> false);
}

function process_save_hyperliquidTopPosition($data){
    db_update('tb_monitor_crawler_target')->fields(array('crawler_finish_time'=>time()))->condition('id', 3)->execute();
    if(count($data) > 1000){
        db_update('dt_hyperliquid_list')->fields(array('del_flag'=> 1))->execute();
    }
    foreach($data as $item){
        $new = array(
            'id'=> $item['id'],
            'coin'=> $item['coin'],
            'create_timestamp'=> $item['createTime'] / 1000,
            'entry_price'=> $item['entryPrice'],
            'funding_fee'=> $item['fundingFee'],
            'leverage'=> $item['leverage'],
            'liquidation_price'=> get_value_from_array($item, 'liquidationPrice', null),
            'margin'=> $item['margin'],
            'position_type'=> $item['positionType'],
            'position_usd'=> $item['positionUsd'],
            'price'=> $item['price'],
            'size'=> $item['size'],
            'type'=> $item['type'],
            'unrealized_pnl'=> $item['unrealizedPnl'],
            'update_time_api'=> $item['updateTime'] / 1000,
            'user_id'=> $item['userId'],
            'del_flag'=> 0
        );
        $exists = db_select('dt_hyperliquid_list', 'l')->fields('l', array('id'))->condition('id', $item['id'])->execute()->fetchAssoc();
        if($exists) {
            db_update('dt_hyperliquid_list')->fields($new)->condition('id', $exists['id'])->execute();
        }else{
            db_insert('dt_hyperliquid_list')->fields($new)->execute();
        }
    }
}

function process_save_hyperliquidTopPositionAction($data){
    foreach($data as $item){
        $new = array(
            'coin'=> $item['coin'],
            'create_timestamp'=> $item['createTime'] / 1000,
            'entry_price'=> $item['entryPrice'],
            'liquidation_price'=> get_value_from_array($item, 'liquidationPrice', null),
            'position_usd'=> $item['positionUsd'],
            'size'=> $item['size'],
            'state'=> $item['state'],
            'user_id'=> $item['userId']
        );
        $exists = db_select('dt_hyperliquid_action', 'a')->fields('a', array('id'))->condition('create_timestamp', $new['create_timestamp'])->condition('user_id', $new['user_id'])->execute()->fetchAssoc();
        if($exists) {
            db_update('dt_hyperliquid_action')->fields($new)->condition('id', $exists['id'])->execute();
        }else{
            db_insert('dt_hyperliquid_action')->fields($new)->execute();
        }
    }
}

function process_save_hyperliquidUserFills($data){
    $userId = $data['user_id'];
    $items = $data['data'];
    foreach($items as $item){
        $hash =  $item['hash'];
        $tid = $item['tid'];
        $info = array(
            'coin'=> $item['coin'],
            'px'=> $item['px'],
            'sz'=> $item['sz'],
            'side'=> $item['side'],
            'time'=> $item['time'] / 1000,
            'start_position'=> $item['startPosition'],
            'dir'=> $item['dir'],
            'close_pnl'=> get_value_from_array($item, 'closePnl', null),
            'hash'=> $hash,
            'oid'=> $item['oid'],
            'crossed'=> $item['crossed'],
            'fee'=> $item['fee'],
            'tid'=> $tid,
            'fee_token'=> $item['feeToken'],
            'user_id'=> $userId
        );
        $exists = db_select('dt_hyperliquid_user_fills', 'f')->fields('f', array('id'))->condition('tid', $tid)->execute()->fetchAssoc();
        if($exists) {
            db_update('dt_hyperliquid_user_fills')->fields($info)->condition('id', $exists['id'])->execute();
        }else{
            db_insert('dt_hyperliquid_user_fills')->fields($info)->execute();
        }
    }
}