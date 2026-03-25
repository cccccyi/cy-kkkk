<?php
function theblock_save_news_list($news){
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
            'description'=> $item['description'],
            'publish_time'=> strtotime($item['publish_time']),
            'primary_category'=> $item['primary_category'],
            'categories'=> to_json($item['categories']),
            'tags'=> to_json($item['tags']),
            'related_tokens'=> to_json($item['related_tokens']),
            'author_id'=> $item['author_id'],
            'author_name'=> $item['author_name'],
            'author_img'=> $item['author_img'],
            'author_url'=> $item['author_url'],
            'content'=> $item['content'],
            'img'=> $item['img'],
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
}

