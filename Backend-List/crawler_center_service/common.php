<?php
function dataBatchInsertES($esKey, $items){
    global $logger, $es_client, $es_index_config;
    $len = count($items);
    if($len == 0){
        return;
    }
    $bulk = array(
        'index' => $es_index_config[$esKey]['index'],
        'type' => $es_index_config[$esKey]['type']
    );
    foreach($items as $item){
        if(!$item){
            continue;
        }
        $bulk['body'][] = array('index'=>array('_id'=>$item['id']));
        $bulk['body'][] = $item;
    }
    $response = $es_client->bulk($bulk);
    if((isset($response['errors']) && $response['errors']) || isset($response['error'])){
        $logger->info(to_json($response));
    }
}

function dataBatchUpdateES($esKey, $items){
    global $logger, $es_client, $es_index_config;
    $len = count($items);
    if($len == 0){
        return;
    }
    $bulk = array(
        'index'=> $es_index_config[$esKey]['index'],
        'type'=> $es_index_config[$esKey]['type']
    );
    foreach($items as $item){
        if(!$item){
            continue;
        }
        $bulk['body'][] = array('update'=>array('_id'=>$item['id']));
        unset($item['id']);
        $bulk['body'][] = array('doc'=>$item);
    }
    $response = $es_client->bulk($bulk);
    if(isset($response['errors']) && $response['errors']){
        //$logger->info(to_json($response));
	print_r($response);
    }
}

function dataUpdateES($esKey, $id, $item){
    global $logger, $es_client, $es_index_config;
    $params = array(
        'index'=> $es_index_config[$esKey]['index'],
        'type'=> $es_index_config[$esKey]['type'],
        'id'=> $id,
        'body'=> array(
            'doc'=> $item
        )
    );
    $response = $es_client->update($params);
    if(isset($response['errors']) && $response['errors']){
        $logger->info(to_json($response));
    }
}

function dataBulkUpdateEs($esKey, $items){
    global $logger, $es_client, $es_index_config;
    $ids = array();
    $existsItems = array();
    $newItems = array();
    foreach($items as $item){
        if(!$item['id'] || !$item['id']){
            return false;
        }
        $ids[] = $item['id'];
    }
    $params = array(
        'size'=> count($items),
        'index'=> $es_index_config[$esKey]['index'],
        'type'=> $es_index_config[$esKey]['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('terms'=> array('_id'=>$ids))
                    )
                )
            )
        )
    );
    $es_results = $es_client->search($params);
    $results = get_es_results($es_results);
    foreach($results['data'] as $item){
        $existsItems[$item['id']] = $item;
    }
    foreach($items as $item){
        if(array_key_exists($item['id'], $existsItems)){
            if(isset($item['insert_time'])){
                unset($item['insert_time']);
            }
            $existsItems[$item['id']] = array_merge($existsItems[$item['id']], $item);
        }else{
            $newItems[] = $item;
        }
    }
    if($existsItems){
        $existsItems = array_values($existsItems);
        dataBatchUpdateES($esKey, $existsItems);
    }
    if($newItems){
        dataBatchInsertES($esKey, $newItems);
    }
}

function imgToBase64($img_file){
    global $logger;
    $img_base64 = '';
    if(file_exists($img_file)){
        $app_img_file = $img_file; // 图片路径
        $img_info = getimagesize($app_img_file); // 取得图片的大小，类型等
        $fp = fopen($app_img_file, "r"); // 图片是否可读权限
        if($fp){
            $filesize = filesize($app_img_file);
            $content = fread($fp, $filesize);
            $file_content = chunk_split(base64_encode($content)); // base64编码
            switch ($img_info[2]) {           //判读图片类型
                case 1:
                    $img_type = "gif";
                    break;
                case 2:
                    $img_type = "jpg";
                    break;
                case 3:
                    $img_type = "png";
                    break;
            }
            $img_base64 = 'data:image/' . $img_type . ';base64,' . $file_content; //合成图片的base64编码
        }
        fclose($fp);
    }
    return $img_base64; //返回图片的base64
}