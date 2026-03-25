<?php
function porcess_coinrank_longshort_ratio($data){
    foreach($data as $item){
        $longShortRatio = $item['longShortRatio'];
        $lastLongShortRatio = $item['lastLongShortRatio'];
        $longValue = $longShortRatio / (1 + $longShortRatio);
        $shortValue = 1 - $longValue;
        $info = array(
            'exchange_name'=> $item['exchangeName'],
            'base_coin'=> $item['baseCoin'],
            'interval_type'=> $item['interval'],
            'longshort_ratio'=> $longShortRatio,
            'last_longshort_ratio'=> $lastLongShortRatio,
            'long_value'=> $longValue,
            'short_value'=> $shortValue,
            'change_ratio'=> ($longShortRatio - $lastLongShortRatio) / $lastLongShortRatio
        );
        $exists = db_select('dt_coinank_longshort_ratio', 'r')->fields('r', array('id'))->condition('exchange_name', $item['exchangeName'])->condition('base_coin', $item['baseCoin'])->condition('interval_type', $item['interval'])->execute()->fetchAssoc();
        if($exists) {
            db_update('dt_coinank_longshort_ratio')->fields($info)->condition('id', $exists['id'])->execute();
        }else{
            db_insert('dt_coinank_longshort_ratio')->fields($info)->execute();
        }
        //
        $key = 'coinrank_longshort_' . $item['exchangeName'] . '_' . $item['baseCoin'] . '_' . $item['interval'];
        $update = array(
            'name'=> $key,
            'data'=> to_json($info)
        );
        try{
            db_insert('dt_crawl_data')->fields($update)->execute();
        }catch(Exception $e){
            db_update('dt_crawl_data')->fields($update)->condition('name', $key)->execute();
        }
    }
}

function process_coinrank_statistic_all($data){
    $key = 'coinrank_statistic_all';
    $item = array(
        'cnnValue'=> $data['cnnValue'],
        'cnnChange'=> $data['cnnChange'],
        'btcMarketCap'=> $data['btcMarketCap'],
        'marketCpaValue'=> $data['marketCpaValue']
    );
    $update = array(
        'name'=> $key,
        'data'=> to_json($item)
    );
    try{
        db_insert('dt_crawl_data')->fields($update)->execute();
    }catch(Exception $e){
        db_update('dt_crawl_data')->fields($update)->condition('name', $key)->execute();
    }
    $update = array(
        'status'=> 's',
        'crawler_finish_time'=> time()
    );
    db_update('tb_monitor_crawler_target')->fields($update)->condition('site', 'coinank')->execute();
}

function process_coinrank_turnover_data($data){
    foreach($data as $item){
        $ext = $item['ext'];
        $interval = $ext['interval'];
        $key = 'coinrank_turnover_' . $interval;
        $update = array(
            'name'=> $key,
            'data'=> to_json($item)
        );
        try{
            db_insert('dt_crawl_data')->fields($update)->execute();
        }catch(Exception $e){
            db_update('dt_crawl_data')->fields($update)->condition('name', $key)->execute();
        }
    }


}

function process_coinrank_altcoin_season($data){
    $key = 'coinrank_altcoin_season';
    $update = array(
        'name'=> $key,
        'data'=> to_json($data)
    );
    try{
        db_insert('dt_crawl_data')->fields($update)->execute();
    }catch(Exception $e){
        db_update('dt_crawl_data')->fields($update)->condition('name', $key)->execute();
    }
}

function process_funding_rate_data($data){
    $key = 'funding_rate_data';
    $update = array(
        'name'=> $key,
        'data'=> to_json($data)
    );
    try{
        db_insert('dt_crawl_data')->fields($update)->execute();
    }catch(Exception $e){
        db_update('dt_crawl_data')->fields($update)->condition('name', $key)->execute();
    }
    $update = array(
        'status'=> 's',
        'crawler_finish_time'=> time()
    );
    db_update('tb_monitor_crawler_target')->fields($update)->condition('site', 'botvsing')->execute();
}