<?php
function crawl_panews($loc){
    // new detail
    // PANews新闻详情采集 new_type 1为深度新闻， 2为快讯，快讯不需要采集详情页
    // Binance 币安公告详情信息采集
    $query = db_select('dt_news_list', 'n')->fields('n', array('id', 'new_url'));
    $query->condition('status', 'i');
    //$query->condition('new_type', array('1', 'announce'), 'in');
    $query->condition('new_type', array('announce'), 'in');
    $query->orderBy('publish_time', 'desc');
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
    return array('success'=> false);
    // profundity news list 深度新闻列表
    $newsListCrawlerInterval = 20;
    if($loc == 'machine_hwy_001'){
        $newsListCrawlerInterval = 300;
    }
    $query = db_select('tb_monitor_crawler_target', 'm')->fields('m', array('id','url'));
    $query->condition('site', array('panews'));
    $db_or = db_or()->condition('status', array('i', 's'))->condition('crawler_fetch_time', time()-300, '<');
    $query->condition($db_or);
    $query->condition('crawler_fetch_time', time() - $newsListCrawlerInterval, '<');
    $query->orderBy('crawler_fetch_time');
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

function crawl_monitor($loc){
    // coinglass
    $target = db_select('tb_monitor_crawler_target', 'm')->fields('m', array('id','site','url'))->condition('del_flag', 0)->condition('site', 'coinglass')->condition('crawler_fetch_time', time()-600, '<')->orderBy('crawler_fetch_time', 'asc')->execute()->fetchAssoc();
    if($target){
        db_update('tb_monitor_crawler_target')->fields(array('crawler_fetch_time'=>time()))->condition('id', $target['id'])->execute();
        $scriptContent = file_get_contents('./scripts/panews/script_monitor_coinglass.js');
        return array(
            'success'=> true,
            'site'=> 'coinglass',
            'account_cache'=> 'monitor_account_001',
            'script_content'=> $scriptContent
        );
    }

    $scriptContent = file_get_contents('./scripts/panews/script_monitor.js');
    return array(
        'success'=> true,
        'site'=> 'panews',
        'account_cache'=> 'monitor_account_001',
        'script_content'=> $scriptContent
    );
}

function process_monitor_single(){
    // 币安公告详情
    // select * from dt_news_list where site='binance' and content is not null order by id desc limit 1\G;
    $query = db_select('dt_news_list', 'n')->fields('n', array('id', 'new_url'));
    $query->condition('status', 'i')->condition('site', 'binance')->condition('content', null, 'is');
    $query->condition('publish_time', time()-24*3600, '>');
    $query->orderBy('crawler_finish_time');
    $info = $query->execute()->fetchAssoc();
    if($info){
        $scriptContent = file_get_contents('./scripts/panews/script_monitor_segament.js');
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
            'site'=> 'monitor',
            'type'=> 'monitor',
            'account_cache'=> 'monitor_account_001',
            'script_content'=> $scriptContent
        );
    }
    // cointelegraph 采集新闻详情
    $query = db_select('dt_news_list', 'n')->fields('n', array('id', 'new_url'));
    $query->condition('status', 'i')->condition('site', 'cointelegraph');
    $query->orderBy('crawler_finish_time');
    $info = $query->execute()->fetchAssoc();
    if($info){
        $scriptContent = file_get_contents('./scripts/panews/script_monitor_segament.js');
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
            'site'=> 'monitor',
            'type'=> 'monitor',
            'account_cache'=> 'monitor_account_001',
            'script_content'=> $scriptContent
        );
    }
    // 采集监控目标
    $target = db_select('tb_monitor_crawler_target', 'm')->fields('m', array('id','site','url'))->condition('site', 'coinglass', '!=')->condition('del_flag', 0)->orderBy('crawler_fetch_time', 'asc')->execute()->fetchAssoc();
    if($target['site'] == 'coinank'){
        $scriptContent = file_get_contents('./scripts/panews/script_monitor_segament_coinank.js');
    }else{
        $scriptContent = file_get_contents('./scripts/panews/script_monitor_segament.js');
    }
    $targetUrl = $target['url'];
    $params = array(
        'url'=>$targetUrl
    );
    foreach($params as $key=>$value){
        $scriptContent = str_replace('{{'.$key.'}}', $value, $scriptContent);
    }
    db_update('tb_monitor_crawler_target')->fields(array('crawler_fetch_time'=>time()))->condition('id', $target['id'])->execute();
    $accountCache = 'monitor_account_001';
    if($target['site'] == 'botvsing'){
        $accountCache = 'funding_001';
    }
    return array(
        'success'=> true,
        'site'=> 'monitor',
        'type'=> 'monitor',
        'account_cache'=> $accountCache,
        'script_content'=> $scriptContent
    );
}

function panews_save_news_list($news){
    $site = null;
    $newType = null;
    foreach($news as $item){
        $url = $item['new_url'];
        $urlMd5 = md5($url);
        $site = $item['site'];
        $newType = $item['new_type'];
        $new = array(
            'site'=> $item['site'],
            'new_id'=> $item['new_id'],
            'new_type'=> $item['new_type'],
            'new_url'=> $url,
            'new_url_md5'=> $urlMd5,
            'title'=> $item['title'],
            'description'=> $item['description'],
            'publish_time'=> $item['publish_time'],
            'tags'=> get_value_from_array($item, 'tags', ''),
            'read_count'=> get_value_from_array($item, 'read_count', ''),
            'collection_count'=> get_value_from_array($item, 'collection_count', 0),
            'love_count'=> get_value_from_array($item, 'love_count', 0),
            'author_id'=> get_value_from_array($item, 'author_id', ''),
            'author_name'=> get_value_from_array($item, 'author_name', ''),
            'author_img'=> get_value_from_array($item, 'author_img', ''),
            'img'=> get_value_from_array($item, 'img', ''),
            'push_flag'=> get_value_from_array($item, 'push_flag', 'n'),
            'last_update_time'=> time()
        );
        $exists = db_select('dt_news_list', 'n')->fields('n', array('id'))->condition('new_url_md5', $urlMd5)->execute()->fetchAssoc();
        if($exists) {
            db_update('dt_news_list')->fields($new)->condition('id', $exists['id'])->execute();
            if(isset($item['push_flag']) && $item['push_flag'] == 'y'){
                db_update('dt_hash_news_list')->fields(array('push_flag'=>'y'))->condition('source_id', $exists['id'])->execute();
            }
        }else{
            $new['insert_time'] = time();
            db_insert('dt_news_list')->fields($new)->execute();
        }
    }
    if($site){
        $update = array(
            'status'=> 's',
            'crawler_finish_time'=> time()
        );
        if($newType == 1){
            db_update('tb_monitor_crawler_target')->fields($update)->condition('id', 2)->execute();
        }elseif($newType == 2){
            db_update('tb_monitor_crawler_target')->fields($update)->condition('id', 1)->execute();
        }else{
            db_update('tb_monitor_crawler_target')->fields($update)->condition('site', $site)->execute();
        }
    }
}

function panews_save_new_detail($new){
    $newId = $new['id'];
    $content = $new['content'];
    $update = array(
        'content'=> $content,
        'last_crawler_time'=> time(),
        'status'=> 's',
        'crawler_finish_time'=> time()
    );
    if(isset($new['tags'])){
        $tags = array();
        foreach($new['tags'] as $tag){
            $tags[] = $tag['title'];
        }
        $update['tags'] = to_json($tags);
    }
    db_update('dt_news_list')->fields($update)->condition('new_id', $newId)->execute();
}