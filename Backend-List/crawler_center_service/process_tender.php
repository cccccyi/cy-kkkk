<?php
function process_tender_data_list($data){
    foreach($data as $item){
        $site = $item['site'];
        $url = $item['url'];
        $postData = $item['postData'];
        $html = $item['html'];
        $urlMd5 = md5($url);
        $postDataMd5 = md5($postData);
        $info = array(
            'site'=> $site,
            'url'=> $url,
            'post_data'=> $postData,
            'url_md5'=> $urlMd5,
            'post_data_md5'=> $postDataMd5,
            'html'=> $html,
            'last_update_time'=> time()
        );
        $exists = db_select('dt_tender_crawler_page_data', 't')->fields('t', array('id'))->condition('url_md5', $urlMd5)->condition('post_data_md5', $postDataMd5)->execute()->fetchAssoc();
        if($exists) {
            db_update('dt_tender_crawler_page_data')->fields($info)->condition('id', $exists['id'])->execute();
        }else{
            $info['insert_time'] = time();
            db_insert('dt_tender_crawler_page_data')->fields($info)->execute();
        }
    }
}
