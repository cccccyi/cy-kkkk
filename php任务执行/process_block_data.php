<?php
ini_set('display_errors', 1);
define('IN_DEBUG', false);
require_once('bootstrap.php');
require_once('common.php');
require_once('crazysmmApi.php');
require_once(PP_INC_ROOT . '/db.php');
require_once(PP_COMMON_ROOT . '/common.php');
require_once(PP_INC_ROOT . '/PHPExcel.php');
require_once(PP_INC_ROOT . '/PHPExcel/IOFactory.php');
require_once(PP_INC_ROOT . '/PHPExcel/Reader/Excel5.php');
require_once(PP_INC_ROOT . '/PHPExcel/Reader/Excel2007.php');
require_once(PP_INC_ROOT . '/backend.php');

function get_system_name(){
    return basename(__FILE__, '.php') . get_log_file_suffix();
}

function get_system_dirs(){

}

function initialize_system(){
    global $mainScreenName;
    $mainScreenName = 'hashnewsHK';
    db_query('set names utf8mb4');
    return true;
}

function sendChatGPTCurl($url, $data, $apiKey=''){
    if(!$apiKey){
        $apiKey = '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';
    }
    $ch = curl_init();
    $headers = array(
        'Content-Type: application/json',
        'Authorization: Bearer '. $apiKey
    );
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); // return don't print
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);
    curl_setopt($ch, CURLOPT_POSTFIELDS, to_json($data));
    $content = curl_exec($ch);
    curl_close($ch);
    return array('cmd'=>$data, 'content'=>$content);
}

function generateTextByChatGPT($system, $prompt, $apiKey=''){
    global $logger;
    $url = 'https://api.openai.com/v1/chat/completions';
    $curlData = array(
        'model'=> 'gpt-4o',
        'messages'=> array(
            array(
                'role'=> 'system',
                'content'=> $system
            ),
            array(
                'role'=> 'user',
                'content'=> $prompt
            )
        )
    );
    //$logger->info($curlData);
    $data = sendChatGPTCurl($url, $curlData, $apiKey);
    //$logger->info($data);
    $info = json_from_string($data['content']);
    if(isset($info['choices'])) {
        foreach ($info['choices'] as $item) {
            //$logger->info($item['message']);
            $text = $item['message']['content'];
            //$logger->info($text);
            if($text){
                $info = processMardownJSON($text);
                if($info){
                    return to_json($info);
                }
                return $text;
            }
        }
    }
    $logger->info('ChatGPT generate text error ...');
    $logger->info($data);
    return false;
}

function processMardownJSON($text){
    $info = json_from_string($text);
    if($info){
        return $info;
    }
    preg_match('/```json\n([\s\S]*?)\n```/', $text, $matches);
    if($matches && $matches[1]){
        $info = json_from_string($matches[1]);
        return $info;
    }
    preg_match('/```plaintext\n([\s\S]*?)\n```/', $text, $matches);
    if($matches && $matches[1]){
        $info = json_from_string($matches[1]);
        return $info;
    }
    return '';
}

function shrinkImage($source, $destination, $maxWidth, $maxHeight) {
    // 获取原始图片的宽度和高度
    list($width, $height) = getimagesize($source);
    // 计算缩小比例
    $scale = min($maxWidth / $width, $maxHeight / $height);
    // 计算缩小后的大小
    $newWidth = $width * $scale;
    $newHeight = $height * $scale;
    // 创建缩小后的图片资源
    $newImage = imagecreatetruecolor($newWidth, $newHeight);
    // 读取原始图片
    $sourceImage = imagecreatefrompng($source);
    // 执行缩小操作
    imagecopyresampled($newImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    // 保存缩小后的图片
    imagepng($newImage, $destination);
    // 释放图片资源
    imagedestroy($sourceImage);
    imagedestroy($newImage);
}

function generateImageByChatGPT($prompt){
    global $logger;
    $url = 'https://api.openai.com/v1/images/generations';
    $curlData = array(
        'model'=> 'dall-e-3',
        'prompt'=> $prompt,
        'n'=> 1,
        'size'=> '1024x1024'
    );
    $data = sendChatGPTCurl($url, $curlData);
    $logger->info($data);
    $info = json_from_string($data['content']);
    $logger->info('ChatGPT generate image ...');
    if(!isset($info['data'])){
        return false;
    }
    $info = $info['data'][0];
    $logger->info($info);
    if(isset($info['url'])){
        $imageURL = $info['url'];
        //$image_content = file_get_contents($imageURL);
        //file_put_contents($new_pic, $image_content);
        $name = time() . '_' . uniqid() . '.png';
        $destination = '/data/website_images/' . $name;
        $maxWidth = 256;
        $maxHeight = 256;
        shrinkImage($imageURL, $destination, $maxWidth, $maxHeight);
        return '/website_images/' . $name;
    }
    return false;
}

function generateRandomCode($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return substr(str_shuffle(str_repeat($characters, ceil($length / strlen($characters)))), 0, $length);
}
// 处理成快讯
function generateXtweetByGPT($row){
    global $logger;
    $emotions = json_from_file('./emotion.json');
    $id = $row['id'];
    $title = $row['title'];
    $description = $row['description'];
    $content = strip_tags($row['content']);
    $promptInfo = array(
        'title'=> $title,
        'description'=> $description,
        'content'=> $content
    );
    $prompt = to_json($promptInfo);
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'GENERATE_NEWS_PROMPT')->execute()->fetchField();
    if(!$system){
        $logger->info('生成快讯generateXtweetByGPT, not found prompt');
        return;
    }

    $apiKey = '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';
    $text = generateTextByChatGPT($system, $prompt, $apiKey);
    //$logger->info("\n\n第一版： ". $text);
    $info = json_from_string($text);
    $logger->info($info);
    if($info && isset($info['content'])){
        if(isset($row['force_title'])){
            $info['title'] = $row['force_title'];
        }
        if(isset($row['force_content'])){
            $info['content'] = $row['force_content'];
        }
        if(is_array($info['tags'])){
            $info['tags'] = implode(' ', $info['tags']);
        }
        $uniqueCode = generateRandomCode(10);
        //$url = 'https://hashnews.pro/news?code=' . $uniqueCode;
        //$tweet = $info['content'] . "\n\n" . $emotions['finger'] . " "  . $url;
        if(strpos($info['title'], '昨夜今晨重要资讯') !== false){
            $tweet = '哈世链闻消息，' . $info['rewrite_content'];
        }else{
            $tweet = '哈世链闻消息，' . $info['content'];
        }
        if(isset($row['primary_category']) && in_array($row['primary_category'], array('数字货币及交易对上新', '下架讯息'))){
            $siteMaps = array(
                'binance'=> '币安',
                'okx'=> 'OKX',
                'bybit'=> 'Bybit',
                'bitget'=> 'Bitget',
                'gate'=> 'Gate'
            );
            $info['title'] = $siteMaps[$row['site']] . '交易所实时公告： ' . $info['title'];
        }
        $update = array(
            'twitter_title'=> $info['title'],
            'twitter_tweet'=> $tweet,
            //'gpt_prompt_info'=> $prompt,
            //'gpt_prompt_system'=> $system
        );
        //$imagePrompt = '在X平台发布一条推文，根据推文内容生成一个合适的图片，图片内容简洁明了，偏向于加密数字货币、财经方向。推文内容：' . $text;
        //$imageURL = generateImageByChatGPT($imagePrompt);
        //if($imageURL){
        //    $update['twitter_img'] = to_json(array($imageURL));
        //}
        if($row['img']){
            $update['twitter_img'] = to_json(array($row['img']));
        }
        $logger->info('update news info for tweet ...' . $id);
        $logger->info($update);
        db_update('dt_news_list')->fields($update)->condition('id', $id)->execute();
        // HashNews 快讯
        $newsItem = array(
            'unique_code'=> $uniqueCode,
            'source_id'=> $row['id'],
            'title'=> $info['title'],
            'content'=> $tweet,
            'detail_content'=> '哈世链闻消息，' . $info['rewrite_content'],
            'publish_time'=> $row['publish_time'] - mt_rand(30, 60),
            'primary_category'=> $info['category'],
            'categories'=> '',
            'tags'=> $info['tags'],
            'push_flag'=> $row['push_flag']
        );
        // 翻译为英文
        $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'SEND_X_TWEET_TRANSLATE_EN')->execute()->fetchField();
        if(!$system){
            $logger->info('发推生成英文版内容, not found prompt');
            return;
        }
        $promptInfo = array(
            'title'=> $info['title'],
            'content'=> $tweet
        );
        $prompt = to_json($promptInfo);
        $apiKeyEn = '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';
        $text = generateTextByChatGPT($system, $prompt, $apiKeyEn);
        $logger->info($text);
        $info = json_from_string($text);
        if($info && isset($info['title']) && isset($info['content'])) {
            $newsItem['title_en'] = $info['title'];
            $newsItem['content_en'] = $info['content'];
        }

        $logger->info('insert hash news:');
        $logger->info($newsItem);
        $newId = db_insert('dt_hash_news_list')->fields($newsItem)->execute();
        $logger->info('new id: ' . $newId);
    }
}

// 处理成文章
function generateArticleByGPT($row){
    global $logger;
    $id = $row['id'];
    $title = $row['title'];
    $description = $row['description'];
    $content = strip_tags($row['content']);
    $promptInfo = array(
        'title'=> $title,
        'description'=> $description,
        'content'=> $content
    );
    $prompt = to_json($promptInfo);
    // 对新闻内容进行 整理
    // 要求： 去掉新闻出处
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'GENERATE_ARTICLE_PROMPT')->execute()->fetchField();
    if(!$system){
        $logger->info('生成快讯generateXtweetByGPT, not found prompt');
        return;
    }
    $text = generateTextByChatGPT($system, $prompt);
    $logger->info("\n\nArticle： ". $text);
    $info = json_from_string($text);
    if($info && isset($info['category']) && isset($info['tags'])){
        $uniqueCode = generateRandomCode(10);
        $update = array(
            'twitter_status'=> 's',
            //'gpt_prompt_info'=> $prompt,
            //'gpt_prompt_system'=> $system
        );
        $logger->info('update news info for article ...' . $id);
        $logger->info($update);
        db_update('dt_news_list')->fields($update)->condition('id', $id)->execute();
        // HashNews 文章
        $articleItem = array(
            'unique_code'=> $uniqueCode,
            'title'=> $info['title'],
            'description'=> $info['description'],
            'content'=> $info['content'],
            'publish_time'=> $row['publish_time'] - mt_rand(30, 60),
            'primary_category'=> $info['category'],
            'categories'=> '',
            'tags'=> $info['tags'],
            'img'=> $row['img'],
            'source_id'=> $row['id']
        );
        //db_insert('dt_hash_article_list')->fields($articleItem)->execute();
    }
}

function process_PANews_generate_tweet(){
    global $logger;
    $query = db_select('dt_news_list', 'n')->fields('n', array('id','site','new_type','title','description','content','img','push_flag','publish_time'));
    $query->condition('site', 'panews')->condition('status', 'd', '!=');
    $dbAnd = db_and()->condition('new_type', 1)->condition('content', null, 'is not');
    $dbOr = db_or()->condition('new_type', 2)->condition($dbAnd);
    $query->condition($dbOr);
    //$query->condition('new_type', 2);
    $query->condition('twitter_status', array('i'))->condition('twitter_tweet', null, 'is');
    $query->condition('publish_time', time()-12*3600, '>');
    //$query->condition('id', 458, '>');
    $query->orderBy('publish_time', 'asc');
    $result = $query->execute();
    $checkKeywords = array('PANews', '火星财经');
    while($row = $result->fetchAssoc()){
        $logger->info($row);
        if(checkDuplicationNews($row)){
            $logger->info('Duplidate ...');
            continue;
        }
        $row['description'] = preg_replace('/PANews\s*\d+月\d+日消息，/', '', $row['description']);
        $row['content'] = preg_replace('/<p.*?>作者：.*?<\/p>/', '', $row['content']);
        $row['content'] = preg_replace('/<p>原文标题：.*?<\/p>/', '', $row['content']);
        $row['content'] = preg_replace('/<p>原文作者：.*?<\/p>/', '', $row['content']);
        $row['content'] = preg_replace('/<p>原文来源：.*?<\/p>/', '', $row['content']);
        $row['content'] = preg_replace('/<p>编译：.*?<\/p>/', '', $row['content']);
        $id = $row['id'];
        $description = $row['description'];
        $content = strip_tags($row['content']);
        // content filter, 若内容中出现了媒体名称如：PANews  火星财经等，过滤掉此消息
        $checkFlag = false;
        if($row['new_type'] == 1){ // 深度文章
            foreach($checkKeywords as $word){
                if(strpos($content, $word) > -1){
                    $checkFlag = true;
                }
            }
        }else{
            foreach($checkKeywords as $word){
                if(strpos($description, $word) > -1){
                    $checkFlag = true;
                }
            }
        }
        if(strpos($row['title'], '昨夜今晨重要资讯') !== false){
            $checkFlag = true;
        }
        if($checkFlag){
            $logger->info('消息被过滤掉...');
            db_update('dt_news_list')->fields(array('status'=>'d', 'twitter_status'=>'d'))->condition('id', $id)->execute();
            continue;
        }
        if($row['new_type'] == 2){
            // 快讯
            $messageLen = mb_strlen($description, "UTF-8");
            $logger->info('$messageLen: ' . $messageLen);
            if($messageLen <= 150){
                $row['force_title'] = $row['title'];
                $row['force_content'] = $description;
            }
            generateXtweetByGPT($row);
        }else{
            // 文章
            generateArticleByGPT($row);
        }
    }
}

function process_Cointelegraph_generate_article(){
    global $logger;
    $query = db_select('dt_news_list', 'n')->fields('n', array('id','site','new_type','title','description','content','img','push_flag','publish_time'));
    $query->condition('site', 'cointelegraph');
    $query->condition('status', 's');
    $query->condition('content', null, 'is not');
    $query->condition('twitter_status', 's', '!=');
    $query->orderBy('publish_time', 'asc');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info($row);
        $id = $row['id'];
        $title = $row['title'];
        $description = $row['description'];
        $content = $row['content'];
        $promptInfo = array(
            'title'=> $title,
            'description'=> $description,
            'content'=> $content
        );
        $prompt = to_json($promptInfo);
        $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'GENERATE_ARTICLE_PROMPT_COINTELEGRAPH')->execute()->fetchField();
        if(!$system){
            $logger->info('cointelegraph 生成文章 generateXtweetByGPT, not found prompt');
            return;
        }
        $text = generateTextByChatGPT($system, $prompt);
        $logger->info("\n\nArticle： ". $text);
        $info = json_from_string($text);
        if($info && isset($info['category']) && isset($info['tags'])){
            $img = $row['img'];
            $text = strip_tags($info['content']);
            $imagePrompt = '根据文章内容生成一张合适的图片，图片内容简洁明了，偏向于加密数字货币、财经方向。文本内容：' . $text;
            $imageURL = generateImageByChatGPT($imagePrompt);
            if($imageURL){
                $img = $imageURL;
            }
            $uniqueCode = generateRandomCode(10);
            $update = array(
                'twitter_status'=> 's',
            );
            $logger->info('update news info for article ...' . $id);
            $logger->info($update);
            db_update('dt_news_list')->fields($update)->condition('id', $id)->execute();
            // HashNews 文章
            $articleItem = array(
                'unique_code'=> $uniqueCode,
                'title'=> $info['title'],
                'description'=> $info['description'],
                'content'=> $info['content'],
                'publish_time'=> $row['publish_time'] - mt_rand(30, 60),
                'primary_category'=> $info['category'],
                'categories'=> '',
                'tags'=> $info['tags'],
                'img'=> $img,
                'source_id'=> $row['id']
            );
            db_insert('dt_hash_article_list')->fields($articleItem)->execute();
        }
    }
}

function process_TheBlock_generate_tweet(){
    global $logger;
    $query = db_select('dt_news_list', 'n')->fields('n', array('id','site','new_type','title','description','content','img','push_flag','publish_time'));
    $query->condition('site', 'theblock');
    $query->condition('twitter_status', 'i')->condition('twitter_tweet', null, 'is');
    $query->condition('publish_time', time()-12*3600, '>');
    //$query->condition('id', 458, '>');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info($row);
        if(checkDuplicationNews($row)){
            $logger->info('Duplidate ...');
            continue;
        }
        generateXtweetByGPT($row);
    }
}

// 交易所公告 币安 OKX bybit
function process_Biance_generate_tweet(){
    global $logger;
    $query = db_select('dt_news_list', 'n')->fields('n', array('id','site','new_type','title','description','content','img','push_flag','publish_time', 'primary_category'));
    $query->condition('site', array('binance', 'okx', 'bybit', 'bitget', 'gate'), 'in');
    $query->condition('content', null, 'is not');
    $query->condition('twitter_status', 'i')->condition('twitter_tweet', null, 'is');
    $query->condition('publish_time', time()-24*3600, '>');
    //$query->condition('id', 458, '>');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info($row);
        //if(checkDuplicationNews($row)){
        //    $logger->info('Duplidate ...');
        //    continue;
        //}
        if(in_array($row['primary_category'], array('数字货币及交易对上新', '下架讯息'))){
            db_update('dt_news_list')->fields(array('push_flag'=> 'y', 'description'=>''))->condition('id', $row['id'])->execute();
            $row['push_flag'] = 'y';
        }
        generateXtweetByGPT($row);

    }
}
// 重新生成相关推文，作为调试提示词
function process_tweet_re_generate_tweet(){
    global $logger;
    $query = db_select('dt_news_list', 'n')->fields('n', array('id','site','new_type','title','description','content','gpt_prompt_system','publish_time'));
    $query->condition('twitter_tweet_re', 're_generate...');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info($row);
        $id = $row['id'];
        $title = $row['title'];
        $description = $row['description'];
        $content = strip_tags($row['content']);
        $promptInfo = array(
            'title'=> $title,
            'description'=> $description,
            'content'=> $content
        );
        $prompt = to_json($promptInfo);
        $logger->info($prompt);
        /**
         * 2.尽量分条目输出内容，且插入恰当的小图标；
         */
        $system = $row['gpt_prompt_system'];
        $text = generateTextByChatGPT($system, $prompt);
        $logger->info($text);
        $info = json_from_string($text);
        if($info){
            $update = array(
                'twitter_tweet_re'=> $info['title'] . "\n\n" . $info['content']
            );
            $logger->info('reset update news info for tweet ...' . $id);
            $logger->info($update);
            db_update('dt_news_list')->fields($update)->condition('id', $id)->execute();
        }
    }
}

// 生成 twitter 推文内容 根据一段时间内的新闻总结
function process_tweet_generate_tweet_by_hour(){
    global $logger, $mainScreenName;
    $screenName = $mainScreenName;
    if((int)date('i') <= 5){
        return;
    }
    $news = array();
    $lastHourStart = strtotime(date('Y-m-d H:00:00', strtotime('-1 hour')));
    $lastHourEnd = strtotime(date('Y-m-d H:59:59', strtotime('-1 hour')));
    // 检查是否已处理
    $exists = db_select('tb_twitter_tweet_post_task', 'p')->fields('p', array('id'))->condition('summary_timestamp', $lastHourStart)->execute()->fetchAssoc();
    if($exists){
        return;
    }
    $logger->info('Summary last hour news generate tweet ...');
    $query = db_select('dt_news_list', 'n')->fields('n', array('id','site','new_type','title','description','content'));
    $query->condition('publish_time', $lastHourStart, '>=')->condition('publish_time', $lastHourEnd, '<=');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $news[] = array(
            'title'=> $row['title'],
            'description'=> $row['description'],
            'content'=> strip_tags($row['content'])
        );
    }
    if(!$news){
        return;
    }
    $newsJson = to_json($news);
    // 1.第一行为标题内容，告知读者消息是币安交易所公告信息，不要输出文字标题且标题与内容间隔一行；
    $system = <<<here
        请根据以下提供的新闻数据（JSON 格式），为每条新闻生成摘要，适合在 X 平台（Twitter）发布，并将所有新闻摘要作为一条推文发布。
        要求：
        1. 每条新闻摘要应占据一行，每行之间空一行，按顺序列出；
        2. 确保每条新闻摘要突出其核心信息，关键信息要全面、清楚；
        3. 可适当加入恰当的，符合主题的表情符号;
        4. 按照华语输出。
        输入格式（JSON）：
        [
            {
                "title": "",
                "description": "",
                "content": ""
            }
        ]
        输出格式：
        {
            "tweet": "1. ...\n2. ..."
        }
here;
    $prompt = <<<here
        新闻列表: ${newsJson}
here;
    $text = generateTextByChatGPT($system, $prompt);
    $info = json_from_string($text);
    $logger->info($info);
    $tweet = $info['tweet'];
    if($tweet){
        $title = date("Y年m月d日H点 #加密圈 要闻");
        $content = "\n\n" . $tweet;
        $item = array(
            'screen_name'=> $screenName,
            'twitter_title'=> $title,
            'twitter_tweet'=> $content,
            'summary_timestamp'=> $lastHourStart,
            'insert_time'=> time(),
            'update_time'=> time()
        );
        $logger->info($item);
        //db_insert('tb_twitter_tweet_post_task')->fields($item)->execute();
    }
}
// 生成 twitter 推文内容 根据一段时间内的新闻总结
function process_tweet_generate_tweet_by_num(){
    global $logger, $mainScreenName;
    $screenName = $mainScreenName;
    // 检查上次时间间隔
    $exists = db_select('tb_twitter_tweet_post_task', 'p')->fields('p', array('insert_time'))->orderBy('id', 'desc')->execute()->fetchAssoc();
    $timeout = 0;
    if($exists){
        $timeout = time() - $exists['insert_time'];
    }
    $emotions = json_from_file('./emotion.json');
    $checkTime = time() - 6*3600;
    $logger->info('Summary recently news generate tweet ...');
    $query = db_select('dt_news_list', 'n')->fields('n', array('id','twitter_title','twitter_tweet'));
    $query->condition('publish_time', $checkTime, '>=')->condition('twitter_flag', 'n')->condition('twitter_tweet', null, 'is not');
    $result = $query->execute();
    $index = 1;
    $news = array();
    $ids = array();
    while($row = $result->fetchAssoc()){
        //$news[] = $index++ . '. ' . $emotions['bell'] . $row['twitter_tweet'];
        $news[] = array(
            'title'=>  $index++ . '. ' . $emotions['bell'] . $row['twitter_title'] . "\n",
            'content'=> $row['twitter_tweet'] . "\n\n"
        );
        $ids[] = $row['id'];
        if($index > 5){
            break;
        }
    }
    if(!$news){
        return;
    }
    if($timeout < 1800 && count($news) < 5){
        return;
    }
    $newsStr = to_json($news);
    $prompt = <<<here
        贴文内容: ${newsStr}
here;
    $system = <<<here
        你是资深的媒体运营专家，专注于在X平台发布区块链相关资讯。提供一篇文字，列出2-4个相关话题标签
        要求：
            1.直接输出相关话题，空格分隔。
            2.每个话题带着 #。
            3.话题需要简短。
here;
    $text = generateTextByChatGPT($system, $prompt);
    $news[count($news)-1]['content'] = $news[count($news)-1]['content'] . $text;
    $newsStr = to_json($news);
    $logger->info(to_json($newsStr));
    $title = date("m月d日H点i分") . " #Web3 要闻";
    $content = "\n\n" . $newsStr;
    $item = array(
        'screen_name'=> $screenName,
        'twitter_title'=> $title,
        'twitter_tweet'=> $content,
        'summary_timestamp'=> strtotime(date('Y-m-d H:i')),
        'insert_time'=> time(),
        'update_time'=> time()
    );
    $logger->info($item);
    //db_insert('tb_twitter_tweet_post_task')->fields($item)->execute();
    db_update('dt_news_list')->fields(array('twitter_flag'=>'y'))->condition('id', $ids)->execute();
}
// 根据文本获取 tag
function get_x_tags_by_text($tweetText){
    global $logger;
    $prompt = <<<here
        文字内容: ${tweetText}
here;
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'MATCH_X_TOPICS')->execute()->fetchField();
    //$logger->info('system:' . $system);
    $text = generateTextByChatGPT($system, $prompt);
    $hashTags = json_from_string($text);
    $logger->info($hashTags);
    $topicsArr = array();
    if($hashTags){
        print_r($hashTags);
        if(is_string($hashTags['coin'])){
            $hashTags['coin'] = json_from_string($hashTags['coin']);
        }
        foreach($hashTags['coin'] as $coin){
            if(strpos($tweetText, $coin) === false){
                $topicsArr[] = $coin;
            }
        }
        if(is_string($hashTags['topics'])){
            $hashTags['topics'] = json_from_string($hashTags['topics']);
        }
        foreach($hashTags['topics'] as $topic){
            if(strpos($tweetText, $topic) === false){
                $topicsArr[] = $topic;
                if(count($topicsArr) > 5){
                    break;
                }
            }
        }
    }
    return $topicsArr;
}
// 根据指定条件、过滤 生成推文内容
function process_tweet_generate_tweet_by_flag(){
    global $logger, $mainScreenName;
    $screenName = $mainScreenName;
    $emotions = json_from_file('./emotion.json');
    $checkTime = time() - 6*3600;
    //$logger->info('Summary recently news generate tweet ...');
    $query = db_select('dt_news_list', 'n')->fields('n', array('id','twitter_title','twitter_tweet'));
    $query->condition('push_flag', 'y');
    $query->condition('description', '%欧易OKX行情显示，BTC%', 'not like');
    $query->condition('description', '%欧易OKX行情显示，ETH%', 'not like');
    $query->condition('publish_time', $checkTime, '>=')->condition('twitter_flag', 'n')->condition('twitter_tweet', null, 'is not');
    $query->range(0, 1);
    $result = $query->execute();
    $news = array();
    $ids = array();
    while($row = $result->fetchAssoc()){
        //$news[] = $index++ . '. ' . $emotions['bell'] . $row['twitter_tweet'];
        $news[] = array(
            //'title'=>  $emotions['bell'] . $row['twitter_title'] . "\n\n",
            'title'=>  $row['twitter_title'] . "\n\n",
            'content'=> $row['twitter_tweet'] . "\n\n"
        );
        $ids[] = $row['id'];
    }
    if(!$news){
        return;
    }
    $newsStr = to_json($news);
    $topicsArr = get_x_tags_by_text($newsStr);
    $tagStr = implode(' ', $topicsArr);
    $news[count($news)-1]['content'] = $news[count($news)-1]['content'] . $tagStr;
    $newsStr = to_json($news);
    $logger->info(to_json($newsStr));
    $title = "";
    $content = "\n\n" . $newsStr;
    $item = array(
        'screen_name'=> $screenName,
        'twitter_title'=> $title,
        'twitter_tweet'=> $content,
        'twitter_tags'=> to_json($topicsArr),
        'summary_timestamp'=> strtotime(date('Y-m-d H:i')),
        'insert_time'=> time(),
        'update_time'=> time()
    );
    $logger->info($item);
    db_insert('tb_twitter_tweet_post_task')->fields($item)->execute();
    db_update('dt_news_list')->fields(array('twitter_flag'=>'y'))->condition('id', $ids)->execute();
    // 生成英文版推文
    $enScreenName = 'HashNews01';
    $title = $news[0]['title'];
    $content = $news[0]['content'];
    $promptInfo = array(
        'title'=> $title,
        'content'=> $content
    );
    $prompt = to_json($promptInfo);
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'SEND_X_TWEET_TRANSLATE_EN')->execute()->fetchField();
    if(!$system){
        $logger->info('发推生成英文版内容, not found prompt');
        return;
    }
    $text = generateTextByChatGPT($system, $prompt);
    $logger->info($text);
    $info = json_from_string($text);
    if($info && isset($info['title']) && isset($info['content'])){
        $newsEn = array();
        $newsEn[] = array(
            'title'=>  $info['title'] . "\n\n",
            'content'=> $info['content'] . "\n\n"
        );
        $newsStr = to_json($newsEn);
        $logger->info(to_json($newsStr));
        $title = "";
        $content = "\n\n" . $newsStr;
        $item = array(
            'screen_name'=> $enScreenName,
            'twitter_title'=> $title,
            'twitter_tweet'=> $content,
            'twitter_tags'=> to_json($topicsArr),
            'summary_timestamp'=> strtotime(date('Y-m-d H:i')),
            'insert_time'=> time(),
            'update_time'=> time()
        );
        $logger->info($item);
        db_insert('tb_twitter_tweet_post_task')->fields($item)->execute();
    }
}
// 生成 twitter 评论内容
function process_tweet_generate_reply(){
    global $logger, $accountIndex, $mainScreenName;
    $screenNames = array($mainScreenName);
    // update reply task
    db_update('tb_twitter_tweet_reply_task')->fields(array('reply_status'=>'i'))->condition('reply_status', 'r')->condition('reply_tweet_text', '', '!=')->condition('retry_count', 5, '<')->condition('reply_fetch_time', time()-1200, '<')->execute();
    db_update('tb_twitter_tweet_reply_task')->fields(array('reply_status'=>'c'))->condition('reply_status', 'r')->condition('reply_tweet_text', '', '!=')->condition('retry_count', 5, '>=')->condition('reply_fetch_time', time()-1200, '<')->execute();
    db_update('tb_twitter_tweet_reply_task')->fields(array('reply_status'=>'c'))->condition('reply_status', 'r')->condition('reply_tweet_text', '', '=')->condition('retry_count', 1, '>')->condition('reply_fetch_time', time()-1200, '<')->execute();
    // get account
    if(!$accountIndex){
        $accountIndex = 0;
    }
    $accounts = array();
    $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('screen_name', 'character_setting'));
    $query->condition('available', 'y')->condition('loc', array('machine_hwy_001'), 'not in');
    //$query->condition('screen_name', 'onciputraracing');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $accounts[] = $row;
    }
    $accountCount = count($accounts);
    $logger->info('accountCount: ' . $accountCount);
    if(!$accounts){
        return;
    }
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'screen_name', 'tweet_id', 'full_text'));
    $query->leftJoin('tb_twitter_monitor_account', 'm', 'm.screen_name=t.screen_name');
    $query->condition('m.id', null, 'is not')->condition('m.screen_name', $screenNames);
    $query->condition('t.in_reply_to_status_id', null, 'is');
    $query->condition('t.full_text', null, 'is not')->condition('t.full_text', '', '!=');
    $query->condition('gen_reply_flag ', 'n');
    //$query->condition('t.reply_status', 'i')->condition('t.reply_tweet_text', null, 'is');
    $query->condition('t.created_at', time()-24*3600, '>');
    $query->orderBy('t.created_at', 'desc');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info($row);
        $id = $row['id'];
        $screenName = $row['screen_name'];
        $tweetId = $row['tweet_id'];
        $fullText = $row['full_text'];

        $len = mt_rand(20, $accountCount);
        $len = min($len, $accountCount);
        $flag = false;
        $existsComments = array();
        //for($i=0; $i<$accountCount; $i++){
        for($i=0; $i<$len; $i++){
            $account = $accounts[$accountIndex];
            $accountIndex = ($accountIndex + 1) % $accountCount;
            if ($i<0){
                // 进行 评论 和 点赞
                $existsCommentsJson = to_json($existsComments);
                $system = $account['character_setting'];
                $promptInfo = array(
                    'text'=> $fullText,
                    'existsComments'=> $existsCommentsJson
                );
                $prompt = to_json($promptInfo);
                $text = generateTextByChatGPT($system, $prompt);
                $info = json_from_string($text);
                if($info){
                    $existsComments[] = $info['reply'];
                    $flag = true;
                    $reply = array(
                        'screen_name'=> $screenName,
                        'tweet_id'=> $tweetId,
                        'reply_screen_name'=> $account['screen_name'],
                        'reply_tweet_text'=> $info['reply'],
                        'insert_time'=> time()
                    );
                    $logger->info('generate twitter reply for tweet ...' . $id);
                    $logger->info($reply);
                    db_insert('tb_twitter_tweet_reply_task')->fields($reply)->execute();
                }
            }else{
                $flag = true;
                // 只进行点赞不进行评论
                $reply = array(
                    'screen_name'=> $screenName,
                    'tweet_id'=> $tweetId,
                    'reply_screen_name'=> $account['screen_name'],
                    'reply_tweet_text'=> '',
                    'insert_time'=> time()
                );
                db_insert('tb_twitter_tweet_reply_task')->fields($reply)->execute();
            }
        }
        if($flag){
            $update = array(
                'gen_reply_flag'=> 'y'
            );
            db_update('dt_twitter_crawler_tweet')->fields($update)->condition('id', $id)->execute();
        }
    }
}

// 主号与其他X账号评论交互
function process_tweet_generate_main_reply(){
    global $logger, $mainScreenName;
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'X_MAIN_ACCOUNT_COMMENT_PROMT')->execute()->fetchField();
    if(!$system){
        $logger->info('process_tweet_generate_main_reply, not found prompt');
        return;
    }
    $existsReplyTask = db_select('tb_twitter_tweet_reply_task', 't')->fields('t', array('id'))->condition('reply_screen_name', $mainScreenName)->condition('reply_status', 'i')->execute()->rowCount();
    $logger->info('current exists main reply task count: ' . $existsReplyTask);
    if($existsReplyTask >= 30){
        return;
    }
    $filterWords = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'X_REPLY_TWEET_EXCLUDE_WORDS')->execute()->fetchField();
    $filterWords = explode(' ', $filterWords);
    $query = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('screen_name', 'name', 'description', 'ai_summary_intro'));
    $query->fields('t', array('id', 'tweet_id', 'full_text', 'created_at'));
    $query->leftJoin('dt_twitter_crawler_tweet', 't', 't.screen_name=a.screen_name');
    $query->condition('t.id', 4300000, '>');
    $query->condition('t.in_reply_to_status_id', null, 'is');
    $query->condition('a.reply_flag', 'y');
    $query->condition('t.gen_reply_flag', 'n');
    $query->condition('t.created_at', time()-24*3600, '>');
    $query->orderBy('t.created_at', 'desc');
    $result = $query->execute();
    $taskCount = 0;
    while($row = $result->fetchAssoc()){
        $screenName = $row['screen_name'];
        // 每个目标，近24小时，最多评论1条
        $checkTime = time() - 6*3600;
        if(time() - $row['created_at'] < 600){
            $checkTime = time() - 3600;
        }
        $count = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id'))->condition('screen_name', $screenName)->condition('insert_time', $checkTime, '>')->execute()->rowCount();
        if($count >= 1){
            continue;
        }
        // 检查转发贴
        if(substr($row['full_text'], 0, 4) == 'RT @'){
            continue;
        }
        // 检查推文 文本内容， 是否过滤， 抽奖等
        $flag = false;
        foreach($filterWords as $word){
            if(strpos($row['full_text'], $word) > -1){
                $flag = true;
                $logger->info($word);
                break;
            }
        }
        if($flag){
            continue;
        }
        $logger->info($row);
//        $logger->info($filterWords);
//        $queryTweet = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('full_text'));
//        $queryTweet->condition('screen_name', $row['screen_name']);
//        $queryTweet->orderBy('created_at', 'desc')->range(0, 10);
//        $resultTweet = $queryTweet->execute();
//        $tweets = array();
//        while($tweet = $resultTweet->fetchAssoc()){
//            $tweets[] = $tweet['full_text'];
//        }
        $promptInfo = array(
            //'name'=> $row['name'],
            //'description'=> $row['description'],
            //'summary_intro'=> $row['ai_summary_intro'],
            //'history_tweets'=> to_json($tweets),
            'tweet'=> $row['full_text']
        );
        $prompt = to_json($promptInfo);
        $text = generateTextByChatGPT($system, $prompt);
        $logger->info($text);
        $info = json_from_string($text);
        if($info){
            $reply = array(
                'screen_name'=> $row['screen_name'],
                'tweet_id'=> $row['tweet_id'],
                'reply_screen_name'=> $mainScreenName,
                'reply_tweet_text'=> $info['reply'],
                'insert_time'=> time()
            );
            $logger->info('generate main twitter reply for tweet ...' . $row['id']);
            $logger->info($reply);
            db_insert('tb_twitter_tweet_reply_task')->fields($reply)->execute();
            $update = array(
                'gen_reply_flag'=> 'y'
            );
            db_update('dt_twitter_crawler_tweet')->fields($update)->condition('id', $row['id'])->execute();
            $taskCount++;
            if($taskCount > 30){
                return;
            }
        }
    }
}

function get_available_tweet_for_reply($screenName, $filterWords){
    global $logger;
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'screen_name', 'tweet_id', 'full_text', 'created_at'));
    $query->condition('t.in_reply_to_status_id', null, 'is');
    $query->condition('t.gen_reply_flag', 'n');
    $query->condition('t.screen_name', $screenName);
    $query->orderBy('t.created_at', 'desc');
    //$query->range(0, 50);
    $result = $query->execute();
    // select id,screen_name,is_blue_verified,tweet_id,full_text,from_unixtime(created_at) from dt_twitter_crawler_tweet t where tweet_show_type is not null order by created_at desc limit 20;
    while ($row = $result->fetchAssoc()) {
        // 检查转发贴
        if (substr($row['full_text'], 0, 4) == 'RT @') {
            continue;
        }
        // 检查推文 文本内容， 过滤抽奖等
        $flag = false;
        foreach ($filterWords as $word) {
            if (strpos($row['full_text'], $word) > -1) {
                $flag = true;
                //$logger->info($word);
                break;
            }
        }
        if ($flag) {
            continue;
        }
        //$logger->info($row);
        return $row;
    }
}

function create_tweet_reply_task($system, $tweet){
    global $logger, $mainScreenName;
    $promptInfo = array(
        'tweet' => $tweet['full_text']
    );
    $prompt = to_json($promptInfo);
    $text = generateTextByChatGPT($system, $prompt);
    //$logger->info($text);
    $info = json_from_string($text);
    if ($info) {
        $reply = array(
            'reply_status' => 'i',
            'screen_name' => $tweet['screen_name'],
            'tweet_id' => $tweet['tweet_id'],
            'reply_screen_name' => $mainScreenName,
            'reply_tweet_text' => $info['reply'],
            'insert_time' => time()
        );
        $logger->info('generate main twitter reply for tweet ...' . $tweet['id']);
        $logger->info($reply);
        db_insert('tb_twitter_tweet_reply_task')->fields($reply)->execute();
        $update = array(
            'gen_reply_flag' => 'y'
        );
        db_update('dt_twitter_crawler_tweet')->fields($update)->condition('id', $tweet['id'])->execute();
        return true;
    }
}

// 对home页采集到的推文进行评论
function process_tweet_generate_main_home_reply(){
    global $logger, $mainScreenName, $lastCheckTime;
    if(!$lastCheckTime){
        $lastCheckTime = 0;
    }
    if(time() - $lastCheckTime < 600){
        return;
    }
    $lastCheckTime = time();
    // 近1小时成功评论数
    $replyCount = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id'))->condition('reply_screen_name', 'hashnewsHK')->condition('reply_status', 's')->condition('reply_finish_time', time()-3600, '>')->execute()->rowCount();
    $logger->info('latest 1 hour home reply count: ' . $replyCount);
    if($replyCount > 30){
        //return;
    }
    // 待评论数
    $waitingCount = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id'))->condition('reply_screen_name', 'hashnewsHK')->condition('reply_status', 'i')->execute()->rowCount();
    $logger->info('waiting reply count: ' . $waitingCount);
    if($waitingCount > 20){
        //return;
    }
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'X_MAIN_ACCOUNT_COMMENT_PROMT')->execute()->fetchField();
    if(!$system){
        $logger->info('process_tweet_generate_main_reply, not found prompt');
        return;
    }
    $filterWords = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'X_REPLY_TWEET_EXCLUDE_WORDS')->execute()->fetchField();
    $filterWords = explode(' ', $filterWords);

    // is_blue_verified follower
    //$followers = db_select('tb_twitter_followers_account', 'f')->fields('f', array('screen_name'))->condition('belongs_screen_name', 'HashNewsHK')->condition('is_blue_verified', '1')->execute()->fetchCol();
    //$targets = db_select('tb_twitter_processing_account', 'a')->fields('a', array('screen_name'))->condition('following', '1')->condition('followed_by', null, 'is')->condition('status', 'y')->execute()->fetchCol();
    //$logger->info($targets);
    $taskCount = 0;
    for($i=0; $i<3; $i++){
        $replyCount = $i;
        $sql = "select p.screen_name,t.task_num from tb_twitter_processing_account p left join (select screen_name,count(*) task_num from tb_twitter_tweet_reply_task where reply_screen_name='hashnewsHK' group by screen_name) t on p.screen_name=t.screen_name where status='y' and dm_flag='n' and following='1' and followed_by is null order by task_num";
        //$sql = "select p.screen_name,t.task_num from tb_twitter_processing_account p left join (select screen_name,count(*) task_num from tb_twitter_tweet_reply_task where reply_screen_name='hashnewsHK' group by screen_name) t on p.screen_name=t.screen_name where status='y' and dm_flag='n' and following='1' and followed_by is null and screen_name='jimohuoshan' order by task_num";
        $result = db_query($sql, array());
        $targets = array();
        while($row = $result->fetchAssoc()){
            if($row['task_num'] == $replyCount){
                $targets[] = $row['screen_name'];
            }
        }
        $logger->info($i . ' target count: ' . count($targets));
        if(!$targets){
            continue;
        }
        if($replyCount >= 4){
            foreach($targets as $target) {
                $logger->info('can dm, reply count >= ' . $replyCount . ' ...');
                db_update('tb_twitter_processing_account')->fields(array('dm_flag'=>'y'))->condition('screen_name', $target)->execute();
                continue;
            }
            continue;
        }
        if($replyCount < 2) {
            $targets = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('screen_name'))->condition('screen_name', $targets)->condition('a.last_update_time', time() - 3 * 24 * 3600, '>')->execute()->fetchCol();
            $logger->info($i . ' target count crawl in 3*24hour : ' . count($targets));
        }
        if(!$targets){
            continue;
        }
        /**
         当前 X 账号目标 关注评论逻辑
            账号目前评论数是 0
                有可评论的帖子  进行评论
                无可评论的帖子， 进行发私信
            当前评论数是1，
                有帖子， 检测上次评论时间， 超过24小时  再次评论
                 没有帖子，等待
             当前评论数大于等于2
                最新评论时间超过24小时， 可以发私信
             取关时间大于一周以上， 再次进行关注
             二次关注的再进行一次评论
             私信三天以上可以取关
        **/
        foreach($targets as $target) {
            //$logger->info('reply check screen_name:   ' . $target);
            if($replyCount == 0){
                $tweet = get_available_tweet_for_reply($target, $filterWords);
                if($tweet){
                    $replyResult = create_tweet_reply_task($system, $tweet);
                    if($replyResult){
                        $taskCount++;
                    }
                }else{
                    $logger->info('can dm, not found available tweet ...');
                    db_update('tb_twitter_processing_account')->fields(array('dm_flag'=>'y'))->condition('screen_name', $target)->execute();
                }
            }elseif($replyCount == 1){
                $logger->info('reply check screen_name:   ' . $target);
                $lastReplyTime = db_select('tb_twitter_tweet_reply_task', 't')->fields('t', array('insert_time'))->condition('reply_screen_name', 'hashnewsHK')->condition('screen_name', $target)->orderBy('insert_time', 'desc')->execute()->fetchField();
                if(time() - $lastReplyTime < 24*3600){
                    $logger->info('replyCount:' . $replyCount. ', last reply less 24 hours, ' . date('Y-m-d H:i;s', $lastReplyTime));
                    continue;
                }
                $tweet = get_available_tweet_for_reply($target, $filterWords);
                if($tweet){
                    $replyResult = create_tweet_reply_task($system, $tweet);
                    if($replyResult){
                        $taskCount++;
                    }
                }else{
                    $logger->info('can dm, not found available tweet ...');
                    db_update('tb_twitter_processing_account')->fields(array('dm_flag'=>'y'))->condition('screen_name', $target)->execute();
                }
            }elseif($replyCount >= 2){
                $lastReplyTime = db_select('tb_twitter_tweet_reply_task', 't')->fields('t', array('insert_time'))->condition('reply_screen_name', 'hashnewsHK')->condition('screen_name', $target)->orderBy('insert_time', 'desc')->execute()->fetchField();
                if(time() - $lastReplyTime > 36*3600){
                    $logger->info('can dm,  ...');
                    db_update('tb_twitter_processing_account')->fields(array('dm_flag'=>'y'))->condition('screen_name', $target)->execute();
                    //$logger->info('reply check screen_name:   ' . $target);
                    //$logger->info('set flag cancel follow ...' . date('Y-m-d H:i:s', $lastReplyTime));
                    //db_update('tb_twitter_processing_account')->fields(array('cancel_follow_flag'=>'y'))->condition('screen_name', $target)->execute();
                }
            }
            if ($taskCount > 50) {
                return;
            }
        }
    }
}

// 对 币圈 蓝V 未关注的账号推文进行评论
function process_tweet_generate_coin_reply(){
    global $logger, $mainScreenName;
    $excludeNames = array('HashNewsHK', 'WhaleRadar_', 'whalesignals_');
    // 近1小时成功评论数
    $replyCount = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id'))->condition('reply_screen_name', 'hashnewsHK')->condition('reply_status', 's')->condition('reply_finish_time', time()-3600, '>')->execute()->rowCount();
    $logger->info('coin latest 1 hour home reply count: ' . $replyCount);
    if($replyCount > 30){
        return;
    }
    // 待评论数
    $waitingCount = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id'))->condition('reply_screen_name', 'hashnewsHK')->condition('reply_status', 'i')->execute()->rowCount();
    $logger->info('waiting reply count: ' . $waitingCount);
    if($waitingCount > 10){
        return;
    }
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'X_MAIN_ACCOUNT_COMMENT_PROMT')->execute()->fetchField();
    if(!$system){
        $logger->info('process_tweet_generate_main_reply, not found prompt');
        return;
    }
    $filterWords = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'X_REPLY_TWEET_EXCLUDE_WORDS')->execute()->fetchField();
    $filterWords = explode(' ', $filterWords);

    // is_blue_verified follower
    $followers = db_select('tb_twitter_followers_account', 'f')->fields('f', array('screen_name'))->condition('belongs_screen_name', 'HashNewsHK')->condition('is_blue_verified', '1')->execute()->fetchCol();

    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'screen_name', 'tweet_id', 'full_text', 'created_at'));
    $query->leftJoin('tb_twitter_monitor_account', 'a', 'a.screen_name=t.screen_name');
    $query->condition('t.screen_name', $followers, 'not in');
    $query->condition('a.ai_judge_industry', array('加密货币', '金融'));
    $query->condition('t.in_reply_to_status_id', null, 'is');
    $query->condition('t.gen_reply_flag', 'n');
    $query->condition('t.is_blue_verified', '1');
    $query->condition('t.screen_name', $excludeNames, 'not in');
    $query->condition('t.created_at', time()-12*3600, '>');
    $query->orderBy('t.created_at', 'desc');
    $query->range(0, 100);
    $result = $query->execute();
    $taskCount = 0;
    while($row = $result->fetchAssoc()){
        $screenName = $row['screen_name'];
        // 每个目标，近24小时，最多评论1条
        $checkTime = time() - 24*3600;
        if(time() - $row['created_at'] < 600){
            $checkTime = time() - 3600;
        }
        $count = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id'))->condition('screen_name', $screenName)->condition('insert_time', $checkTime, '>')->execute()->rowCount();
        if($count >= 1){
            continue;
        }
        // 检查转发贴
        if(substr($row['full_text'], 0, 4) == 'RT @'){
            continue;
        }
        // 检查推文 文本内容， 是否过滤， 抽奖等
        $flag = false;
        foreach($filterWords as $word){
            if(strpos($row['full_text'], $word) > -1){
                $flag = true;
                $logger->info($word);
                break;
            }
        }
        if(!preg_match('/[\x{4e00}-\x{9fff}]/u', $row['full_text'])){
            continue;
        }
        if($flag){
            continue;
        }
        $logger->info($row);
        //$logger->info($filterWords);
        $promptInfo = array(
            'tweet'=> $row['full_text']
        );
        $prompt = to_json($promptInfo);
        $text = generateTextByChatGPT($system, $prompt);
        $logger->info($text);
        $info = json_from_string($text);
        if($info){
            $reply = array(
                'reply_status'=> 'i',
                'screen_name'=> $row['screen_name'],
                'tweet_id'=> $row['tweet_id'],
                'reply_screen_name'=> $mainScreenName,
                'reply_tweet_text'=> $info['reply'],
                'insert_time'=> time()
            );
            $logger->info('generate main twitter reply for tweet ...' . $row['id']);
            $logger->info($reply);
            db_insert('tb_twitter_tweet_reply_task')->fields($reply)->execute();
            $update = array(
                'gen_reply_flag'=> 'y'
            );
            db_update('dt_twitter_crawler_tweet')->fields($update)->condition('id', $row['id'])->execute();
            $taskCount++;
            if($taskCount > 3){
                return;
            }
        }
    }
}

// 主账号推文获得的评论，进行评论
function process_mian_tweet_generate_reply_to_reply(){
    global $logger, $mainScreenName;
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'X_MAIN_ACCOUNT_COMMENT_PROMT')->execute()->fetchField();
    if(!$system){
        $logger->info('process_tweet_generate_main_reply, not found prompt');
        return;
    }
    // 主账号可评论推文
    // select id,screen_name,tweet_id,retweet_count,reply_count,favorite_count,views,from_unixtime(created_at),
    // f'rom_unixtime(last_crawl_time) from dt_twitter_crawler_tweet where id>4000000 and screen_name='HashNewsHK' and created_at > unix_timestamp()-3*24*3600 and in_reply_to_status_id is null order by reply_count;
    $tweetIds = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('tweet_id'))->condition('id', 4100000, '>')->condition('screen_name', 'HashNewsHK')->condition('created_at', time()-3*24*3500, '>')->condition('in_reply_to_status_id', null)->condition('reply_count', 0, '>')->execute()->fetchCol();
    $logger->info('主账号近3天，有评论推文：' . count($tweetIds));
    if(!$tweetIds){
        return;
    }
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'screen_name', 'tweet_id', 'in_reply_to_status_id', 'full_text', 'created_at'));
    $query->condition('t.id', 4100000, '>');
    $query->condition('t.created_at', time()-3*24*3500, '>');
    $query->condition('t.in_reply_to_status_id', $tweetIds, 'in');
    $query->condition('t.gen_reply_flag', 'n');
    $query->orderBy('t.created_at', 'desc');
    //$query->range(0, 100);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $screenName = $row['screen_name'];
        /*
        // 每个目标，近24小时，最多评论1条
        $checkTime = time() - 24*3600;
        if(time() - $row['created_at'] < 600){
            $checkTime = time() - 3600;
        }
        $count = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id'))->condition('screen_name', $screenName)->condition('insert_time', $checkTime, '>')->execute()->rowCount();
        if($count >= 1){
            continue;
        }
        **/
        $logger->info($row);
        $promptInfo = array(
            'tweet'=> $row['full_text']
        );
        $prompt = to_json($promptInfo);
        $text = generateTextByChatGPT($system, $prompt);
        $logger->info($text);
        $info = json_from_string($text);
        if($info){
            $reply = array(
                'reply_status'=> 'i',
                'screen_name'=> $row['screen_name'],
                'tweet_id'=> $row['tweet_id'],
                'in_reply_to_status_id'=> $row['in_reply_to_status_id'],
                'reply_screen_name'=> $mainScreenName,
                'reply_tweet_text'=> $info['reply'],
                'insert_time'=> time()
            );
            $logger->info('主账号评论盖楼, twitter reply for tweet ...' . $row['id']);
            $logger->info($reply);
            db_insert('tb_twitter_tweet_reply_task')->fields($reply)->execute();
            $update = array(
                'gen_reply_flag'=> 'y'
            );
            db_update('dt_twitter_crawler_tweet')->fields($update)->condition('id', $row['id'])->execute();
        }
    }
}

// 代币投研报告评论
function process_token_research_main_reply(){
    global $logger, $mainScreenName;
    $excludeNames = array('HashNewsHK', 'WhaleRadar_', 'whalesignals_');
    $followers = db_select('tb_twitter_followers_account', 'f')->fields('f', array('screen_name'))->condition('belongs_screen_name', 'HashNewsHK')->condition('is_blue_verified', '1')->execute()->fetchCol();

    $queryToken = db_select('tb_token_research', 't')->fields('t', array('id', 'address', 'symbol', 'tweet_url'));
    $queryToken->condition('del_flag', 0);
    $resultToken = $queryToken->execute();
    while($rowToken = $resultToken->fetchAssoc()){
        $token = $rowToken['symbol'];
        $ca = $rowToken['address'];
        $tweetURL = $rowToken['tweet_url'];

        // check task count
        $query = db_select('tb_twitter_tweet_reply_task', 't')->fields('t', array('id', 'insert_time'));
        $query->condition('insert_time', time()-24*3600, '>');
        $query->condition('reply_tweet_text', $tweetURL);
        $query->orderBy('insert_time', 'desc');
        $result = $query->execute();
        $taskCount = $result->rowCount();
        if($taskCount >= 5){
            continue;
        }
        $task = $result->fetchAssoc();
        if($task || time()-$task['insert_time']<3600){
            continue;
        }
        $logger->info($token . ', 24 hours reply count: ' . $taskCount);
        $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'screen_name', 'tweet_id', 'full_text', 'created_at'));
        $query->condition('t.in_reply_to_status_id', null, 'is');
        $query->condition('t.gen_reply_flag', 'n');
        $query->condition('t.screen_name', $excludeNames, 'not in');
        $query->condition('t.is_blue_verified', '1');
        //$query->condition('t.screen_name', $followers, 'not in');
        $query->condition('t.created_at', time()-24*3600, '>');
        $db_or = db_or()->condition('full_text', '%'.$ca.'%', 'like')->condition('full_text', '%$'.$token.'%', 'like');
        $query->condition($db_or);
        $query->orderBy('t.created_at', 'desc');
        $result = $query->execute();
        while($row = $result->fetchAssoc()){
            $logger->info($row);
            $reply = array(
                'reply_status'=> 'i',
                'screen_name'=> $row['screen_name'],
                'tweet_id'=> $row['tweet_id'],
                'reply_screen_name'=> $mainScreenName,
                'reply_tweet_text'=> $tweetURL,
                'insert_time'=> time()
            );
            $logger->info('generate Token Research reply for tweet ...' . $row['id']);
            $logger->info($reply);
            db_insert('tb_twitter_tweet_reply_task')->fields($reply)->execute();
            $update = array(
                'gen_reply_flag'=> 'y'
            );
            db_update('dt_twitter_crawler_tweet')->fields($update)->condition('id', $row['id'])->execute();
            //break;
        }
    }
}

// 使用二级账号进行评论， MEME榜单
function process_tweet_generate_meme_reply(){
    global $logger, $mainScreenName, $accountIndex;
    // check
    // 近1小时成功评论数
    $replyCount = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id'))->condition('reply_screen_name', 'hashnewsHK', '!=')->condition('reply_status', 's')->condition('reply_finish_time', time()-3600, '>')->execute()->rowCount();
    $logger->info('second layer latest 1 hour home reply count: ' . $replyCount);
    if($replyCount > 3){
        return;
    }
    $taskCount = db_select('tb_twitter_tweet_reply_task', 'r')->fields('r', array('id'))->condition('reply_status', array('i'))->condition('screen_name', 'HashNewsHK', '!=')->condition('reply_screen_name', 'HashNewsHK', '!=')->execute()->rowCount();
    // get account
    if(!$accountIndex){
        $accountIndex = 0;
    }
    $accounts = array();
    $query = db_select('tb_twitter_guid_account', 'a')->fields('a', array('screen_name', 'character_setting'));
    $query->condition('available', 'y');
    //$query->condition('loc', array('machine_bjb_hsx'), 'in');
    $query->condition('loc', array('machine_hwy_001'), 'not in');
    //$query->condition('screen_name', 'onciputraracing');
    $query->orderRandom();
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $accounts[] = $row;
    }
    $accountCount = count($accounts);
    $logger->info('accountCount: ' . $accountCount);
    if(!$accounts){
        return;
    }
    //$followers = db_select('tb_twitter_followers_account', 'f')->fields('f', array('screen_name'))->condition('belongs_screen_name', 'HashNewsHK')->condition('is_blue_verified', '1')->execute()->fetchCol();
    // get prompt reply
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'X_MAIN_ACCOUNT_COMMENT_PROMT')->execute()->fetchField();
    if(!$system){
        $logger->info('process_tweet_generate_main_reply, not found prompt');
        return;
    }
    // 账号 cct_ai  屏蔽了我方二级账号
    // PANewsCN
    $filterScreenNames = array('HashNewsHK', 'web3_laohan', 'lookonchain', 'arkham', 'elonmusk', 'cct_ai', 'Cointelegraph', 'PANewsCN');
    // get meme config, reply width tweet
    $queryConfig = db_select('tb_twitter_reply_tweet_config', 'c')->fields('c', array('id', 'name', 'url', 'words', 'tweet_count'));
    $queryConfig->condition('del_flag', 0);
    $queryConfig->orderBy('tweet_count');
    $resultConfig = $queryConfig->execute();
    while($rowConfig = $resultConfig->fetchAssoc()){
        //$logger->info($rowConfig);
        if($rowConfig['tweet_count'] > 1 && $taskCount>100){
            //break;
        }
        if($rowConfig['id']<=20 && $rowConfig['tweet_count'] > 80){
            continue;
        }
        if($rowConfig['id']>20 && $rowConfig['tweet_count'] > 30){
            continue;
        }
        $chain = $rowConfig['name'];
        $tweetUrl = $rowConfig['url'];
        $words = explode(' ', $rowConfig['words']);

        $symbols = array();
        $dbOR = db_or();
        foreach($words as $symbol){
            if(!$symbol){
                continue;
            }
            $symbols[] = $symbol;
            $dbOR->condition('t.full_text', '%' . $symbol . ' %', 'like');
            if(strpos($symbol, '$') !== false){
                $symbol2 = str_replace('$', '', $symbol);
                $dbAnd = db_and()->condition('t.full_text', '%' . $symbol2 . ' %', 'like')->condition('t.full_text', '%币%', 'like');
                $dbOR->condition($dbAnd);
            }
        }
        if(!$symbols){
            continue;
        }
        ///////////////////////////////
        if($chain == 'base-coin'){
            $dbAnd = db_and()->condition('t.full_text', '%base%', 'like')->condition('t.full_text', '%发币%', 'like');
            $dbOR->condition($dbAnd);
        }
        ////////////////////
        if($chain == 'alpha'){
            $dbAnd = db_and()->condition('t.full_text', '%bsc%', 'like')->condition('t.full_text', '%alpha%', 'like');
            $dbOR->condition($dbAnd);
        }
        if(!in_array($chain, array('bsc', 'alpha'))){
            $dbOR = db_and()->condition($dbOR)->condition('t.full_text', '%币安%', 'not like')->condition('t.full_text', '%binance%', 'not like')->condition('t.full_text', '%bsc%', 'not like');
        }
        if($chain != 'sol'){
            $dbOR = db_and()->condition($dbOR)->condition('t.full_text', '%sol%', 'not like');
        }
        if($chain != 'tron'){
            $dbOR = db_and()->condition($dbOR)->condition('t.full_text', '%tron%', 'not like');
        }
        //select * from dt_twitter_crawler_tweet where in_reply_to_status_id is null and screen_name not in ('HashNewsHK', 'web3_laohan', 'lookonchain', 'arkham', 'elonmusk') and () order by created_at desc limit 3\G;
        $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'screen_name', 'tweet_id', 'full_text'));
        $query->condition('t.in_reply_to_status_id', null, 'is');
        $query->condition('screen_name', $filterScreenNames, 'not in');
        $query->condition('t.is_blue_verified', '1');
        //$query->condition('t.screen_name', $followers, 'not in');
        $query->condition('t.created_at', time()-12*3600, '>');
        $query->condition($dbOR);
        $query->condition('gen_reply_flag ', 'n');
        //$query->condition('t.reply_status', 'i')->condition('t.reply_tweet_text', null, 'is');
        $query->orderBy('t.created_at', 'desc');
        $query->range(0, 30);
        $result = $query->execute();
        //$logger->info('chain: ' . $chain);
        //$logger->info($result->getQueryString());
        while($row = $result->fetchAssoc()){
            //$logger->info($row);
            if(!preg_match('/[\x{4e00}-\x{9fff}]/u', $row['full_text'])){
                //$logger->info("不包含中文 ...");
                continue;
            }
            $id = $row['id'];
            $screenName = $row['screen_name'];
            $tweetId = $row['tweet_id'];
            $account = $accounts[$accountIndex];
            $accountIndex = ($accountIndex + 1) % $accountCount;
            $promptInfo = array(
                'tweet'=> $row['full_text']
            );
            $prompt = to_json($promptInfo);
            $text = generateTextByChatGPT($system, $prompt);
            $logger->info($text);
            $info = json_from_string($text);
            if($info){
                $reply = array(
                    'screen_name'=> $screenName,
                    'tweet_id'=> $tweetId,
                    'reply_screen_name'=> $account['screen_name'],
                    'reply_tweet_text'=> $info['reply'] ."\n" . $tweetUrl,
                    'insert_time'=> time()
                );
                $logger->info('generate twitter reply for tweet ...' . $id);
                $logger->info($reply);
                db_insert('tb_twitter_tweet_reply_task')->fields($reply)->execute();
                $update = array(
                    'gen_reply_flag'=> 'y'
                );
                db_update('dt_twitter_crawler_tweet')->fields($update)->condition('id', $id)->execute();
                db_update('tb_twitter_reply_tweet_config')->fields(array('tweet_count'=> $rowConfig['tweet_count']+1))->condition('id', $rowConfig['id'])->execute();
            }
            break;
        }
    }
}

/**
 * 指定一条新闻 查重 逻辑
 * 查重范围：
 *     非本平台的新闻
 *     新闻发布时间往前推6小时发布时间到现在
 *     生成了推文内容的新闻
 *
 */
function checkDuplicationNews($info){
    global $logger;
    $id = $info['id'];
    $site = $info['site'];
    $title = $info['title'];
    $description = $info['description'];
    $content = strip_tags($info['content']);
    $publishTime = $info['publish_time'];
    $news = array();
    $query = db_select('dt_news_list', 'n')->fields('n', array('id','site','new_type','title','description','content','img','publish_time'));
    $query->condition('twitter_status', 'c', '!=')->condition('twitter_tweet', null, 'is not');
    if($site == 'panews'){
        $query->condition('publish_time', $publishTime-1*3600, '>');
    }else{
        $query->condition('site', $site, '!=');
        $query->condition('publish_time', $publishTime-6*3600, '>');
    }
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $news[] = array(
            'id'=> $row['id'],
            'title'=> $row['title'],
            'description'=> $row['description'],
            'content'=> strip_tags($row['content'])
        );
    }
    if(!$news){
        return;
    }
    $newsListStr = to_json($news);
    $new = array(
        'title'=> $title,
        'description'=> $description,
        'content'=> $content
    );
    $newStr = to_json($new);
    $prompt = <<<here
        新闻列表: ${newsListStr}
        新闻报道: ${newStr}
here;
    // 1.第一行为标题内容，告知读者消息是币安交易所公告信息，不要输出文字标题且标题与内容间隔一行；
    $system = <<<here
        你是资深的媒体运营专家，给你提供一份JSON格式的新闻列表，和单独一篇新闻报道，判断这篇新闻报道是否在新闻列表中已经存在。
        要求：
            1. 直接返回数据JSON字符串格式，不需要markdown格式，键值包含：result，id。说明result为结果取值为true/false，id为重复的新闻id；
            2. 存在中文与英文的报道，统一处理为中文分析;
            3. 要根据新闻内容中的主体,以及报道中相关数据是否一致来作为判断的依据。
here;
    // ChatGPT 判重 API key
    $apiKey = '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';
    $text = generateTextByChatGPT($system, $prompt, $apiKey);
    $logger->info($text);
    $result = json_from_string($text);
    if($result && $result['id']){
        $url = db_select('dt_news_list', 'n')->fields('n', array('new_url'))->condition('id', $result['id'])->execute()->fetchField();
        if($url){
            $update = array(
                'twitter_status'=> 'c',
                'duplicate_id'=> $result['id'],
                'duplidate_new_url'=> $url
            );
            db_update('dt_news_list')->fields($update)->condition('id', $id)->execute();
            return true;
        }
    }
    return false;
}

function process_new_format(){
    global $logger;
    $fields = array('id', 'title', 'tags', 'content', 'img', 'twitter_tweet_id', 'twitter_screen_name', 'twitter_tweet_post_time');
    $query = db_select('dt_news_list', 'n')->fields('n', $fields);
    $query->condition('twitter_tweet_id', null, 'is not')->condition('img', '', '!=');
    $query->condition('new_format', null, 'is');
    $query->orderBy('id', 'desc');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $content = strip_tags($row['content']);
        $prompt = <<<here
        报道: ${content}
here;
        $system = <<<here
        我有一篇报道文字，想将它按照以下格式整理，并以 JSON 格式输出。
        要求：
            1.应用在网页新闻报道中，文字内容不要少于原内容，可做适当扩充；
            2.将报道分为三部分，每部分都有对应的标题和正文；
            3.输出格式要求符合 JSON 结构：每部分包含 title 和 content 字段；
            4.输出格式: [{"title":"","content":""},{"title":"","content":""},{"title":"","content":""}]；
            5.直接输出json格式，不需要markdown。
here;
        $text = generateTextByChatGPT($system, $prompt);
        if($text){
            $update = array('new_format'=> $text);
            db_update('dt_news_list')->fields($update)->condition('id', $row['id'])->execute();
        }
    }
}

function process_X_crazysmm_api(){
    global $logger, $mainScreenName;
    $query = db_select('tb_twitter_tweet_post_task', 't')->fields('t', array('id', 'screen_name', 'tweet_id'));
    $query->condition('screen_name', 'hashnewsHK');
    $query->condition('tweet_id', null, 'is not')->condition('crazysmm_order', null, 'is');
    $query->condition('id', 5992, '>=');
    $result = $query->execute();
    $count = $result->rowCount();
    //$logger->info('process_X_crazysmm_api count: ' . $count);
    $api = new CrazysmmApi();
    $services = $api->services(); # Return all services
    $balance = $api->balance(); # Return user balance
    //$logger->info($services);
    //$logger->info($balance);
    while($row = $result->fetchAssoc()){
        $order = $api->order([
            'service' => 1713,
            'link' => 'https://x.com/' . $row['screen_name'] . '/status/' . $row['tweet_id'],
            'quantity' => 0 * mt_rand(100, 130)
            //'runs' => mt_rand(5, 10),
            //'interval' => 20
        ]);
        $logger->info($row);
        $logger->info('X crazysmm order:' . to_json($order));
        if($order && $order['order']){
            $update = array(
                'crazysmm_order'=> $order['order']
            );
            db_update('tb_twitter_tweet_post_task')->fields($update)->condition('id', $row['id'])->execute();
        }
    }
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'screen_name', 'tweet_id'));
    $query->leftJoin('tb_twitter_tweet_post_task', 'p', 'p.tweet_id=t.tweet_id');
    $query->condition('t.screen_name', $mainScreenName)->condition('t.crazysmm_order', null, 'is');
    $query->condition('t.in_reply_to_status_id', null, 'is');
    $query->condition('t.created_at', strtotime('2025-06-18'), '>');
    $query->condition('p.id', null, 'is');
    $result = $query->execute();
    $count = $result->rowCount();
    //$logger->info('process_X_crazysmm_api count2: ' . $count);
    while($row = $result->fetchAssoc()){
        $order = $api->order([
            'service' => 1713,
            'link' => 'https://x.com/' . $row['screen_name'] . '/status/' . $row['tweet_id'],
            'quantity' => 0 * mt_rand(100, 130)
            //'runs' => mt_rand(5, 10),
            //'interval' => 20
        ]);
        $logger->info($row);
        $logger->info('X crazysmm order:' . to_json($order));
        if($order && $order['order']){
            $update = array(
                'crazysmm_order'=> $order['order']
            );
            db_update('dt_twitter_crawler_tweet')->fields($update)->condition('id', $row['id'])->execute();
        }
    }
}

function sendDingTalkMessage($message, $type='whale') {
    $title = '⚠巨鲸推文！\n采集到巨鲸推文，请尽快处理！';
    if($type == 'alarm'){
        $title = '⚠⚠⚠告警信息⚠⚠⚠';
    }elseif($type == 'info'){
        $title = '❤❤❤统计信息❤❤❤';
    }
    $access_token = "4f173a97b1ea672fb51294e32b9771419d67330a93d966c428c595280a1e7b12";
    $secret = "SEC7c3afa11bee6484bb2bff297c02ad17a978fcaf555b6f7cc5459420a859d6381";
    // 计算时间戳（毫秒）
    $timestamp = round(microtime(true) * 1000);
    // 计算签名
    $string_to_sign = $timestamp . "\n" . $secret;
    $sign = base64_encode(hash_hmac('sha256', $string_to_sign, $secret, true));
    $sign = urlencode($sign); // URL 编码
    // 构造 Webhook URL
    $webhook_url = "https://oapi.dingtalk.com/robot/send?access_token={$access_token}&timestamp={$timestamp}&sign={$sign}";
    // 发送的 JSON 数据
    $data = array(
        'msgtype'=> 'text',
        'text'=> array(
            'content'=> "${title}\n\n${message}"
        ),
        "at" => [
            "atMobiles" => ["18310998039"],
            "isAtAll" => false
        ]
    );
    // 发送请求
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $webhook_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

function polish_x_whale_tweet($text){
    global $logger;
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'POLISH_X_WHALE_TWEET')->execute()->fetchField();
    $prompt = array(
        'text'=> $text
    );
    $prompt = to_json($prompt);
    $text = generateTextByChatGPT($system, $prompt);
    $result = json_from_string($text);
    if($result && $result['text']){
        return $result['title'] . '<->' . $result['text'];
    }
    $logger->info($result);
}

function modify_whale_tweet(){
    global $logger;
    $query = $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'screen_name', 'full_text', 'created_at'));
    $query->condition('tag', 'whale');
    $query->condition('origin_full_text', null, 'is');
    $query->range(0, 50);
    $query->orderBy('created_at', 'desc');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        //$logger->info($row);
        // 过滤指定字符
        $fullText = $row['full_text'];
        $pattern = '/本文由 .*? 赞助/';
        $fullText = preg_replace($pattern, '', $fullText);
        $newText = polish_x_whale_tweet($fullText);
        $logger->info("原文：\n" . $fullText . "\n现推文：\n" . $newText . "\n\n\n");
        if($newText){
            $item = array(
                'full_text'=> $newText,
                'origin_full_text'=> $fullText
            );
            db_update('dt_twitter_crawler_tweet')->fields($item)->condition('id', $row['id'])->execute();
        }
    }
}

function process_x_tweet(){
    global $logger, $mainScreenName;
    $updateSql = "update dt_twitter_crawler_tweet set hot_flag='y' where screen_name in (select screen_name from tb_twitter_kol_account) and hot_flag='n' and in_reply_to_status_id is null";
    db_query($updateSql)->execute();
    $updateSql = "update dt_twitter_crawler_tweet set tag='kol' where screen_name in (select screen_name from tb_twitter_kol_account where tag='kol') and tag is null and in_reply_to_status_id is null";
    db_query($updateSql)->execute();
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'PROCESS_X_TWEET_PROMPT')->execute()->fetchField();

    $apiKey = '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';
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'screen_name', 'full_text', 'created_at', 'media_url_https'));
    $query->leftJoin('tb_twitter_kol_account', 'k', 'k.screen_name=t.screen_name');
    $query->condition('k.tag', 'whale')->condition('t.del_flag', '0');
    $query->condition('t.in_reply_to_status_id', null, 'is');
    $query->condition('t.tag', null, 'is');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info($row);
        $prompt = 'X推文: ' . $row['full_text'];
        $text = generateTextByChatGPT($system, $prompt, $apiKey);
        $logger->info($text);
        $info = processMardownJSON($text);
        if($info && isset($info['type'])){
            $tag = $info['type'];
            $item = array(
                'tag'=> $tag
            );
            if($info['lang'] != 'zh'){
                $item['full_text'] = $info['chinese'];
                $item['origin_full_text'] = $row['full_text'];
            }else{
                $item['full_text'] =  $row['full_text'];
            }
            if($tag == 'whale'){
                $check = checkDuplicationTweet($row);
                if($check !== false){
                    $item['tag'] = 'whale_duplicate_' . $check;
                    db_update('dt_twitter_crawler_tweet')->fields($item)->condition('id', $row['id'])->execute();
                    continue;
                }
            }
            db_update('dt_twitter_crawler_tweet')->fields($item)->condition('id', $row['id'])->execute();
            $timeout = time() - $row['created_at'];
            if($tag == 'whale' && $timeout < 3*3600){
                // 过滤指定字符
                $fullText = $item['full_text'];
                $pattern = '/本文由 .*? 赞助/';
                $fullText = preg_replace($pattern, '', $fullText);
                /**
                $delimiter = '本文由 #Gateio | @Gateio_zh 赞助';
                $position = strpos($fullText, $delimiter);
                if ($position !== false) {
                    $fullText = substr($fullText, 0, $position);
                }
                **/
                $newText = polish_x_whale_tweet($fullText);
                $logger->info("原文：\n" . $fullText . "\n现推文：\n" . $newText . "\n\n\n");
                if($newText){
                    $item = array(
                        'full_text'=> $newText,
                        'origin_full_text'=> $fullText
                    );
                    db_update('dt_twitter_crawler_tweet')->fields($item)->condition('id', $row['id'])->execute();
                    $fullText = $newText;
                }
                $topicsArr = get_x_tags_by_text($fullText);
                $fullText = $fullText . "\n" . implode(' ', $topicsArr);
                $tweets = array(
                    array(
                        'title'=> "巨鲸操作（Whale Movements Alert）\n",
                        'content'=> "\n" . $fullText
                    )
                );
                $post = array(
                    'screen_name'=> $mainScreenName,
                    'twitter_title'=> '',
                    'twitter_tweet'=> to_json($tweets),
                    'twitter_tags'=> to_json($topicsArr),
                    'twitter_img'=> to_json(array($row['media_url_https'])),
                    'summary_timestamp'=> strtotime(date('Y-m-d H:i')),
                    'insert_time'=> time(),
                    'update_time'=> time()
                );
                $logger->info($post);
                db_insert('tb_twitter_tweet_post_task')->fields($post)->execute();
                sendDingTalkMessage($row['full_text']);
            }
        }
    }
}

function checkDuplicationTweet($info){
    global $logger;
    $screenName = $info['screen_name'];
    $fullText = $info['full_text'];
    $tweets = array();
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('id', 'full_text'));
    $query->condition('screen_name', $screenName, '!=')->condition('tag', 'whale');
    $query->condition('created_at', time()-12*3600, '>');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $tweets[] = array(
            'id'=> $row['id'],
            'full_text'=> $fullText
        );
    }
    if(!$tweets){
        return false;
    }
    $tweetListStr = to_json($tweets);
    $prompt = <<<here
        推文列表: ${tweetListStr}
        指定推文: ${fullText}
here;
    // 1.第一行为标题内容，告知读者消息是币安交易所公告信息，不要输出文字标题且标题与内容间隔一行；
    $system = <<<here
        你是资深的媒体运营专家，给你提供一份JSON格式的推文列表，和单独一篇推文，判断这篇推文是否在推文列表中已经存在。
        要求：
            1. 直接返回数据JSON字符串格式，不需要markdown格式，键值包含：result，id。说明result为结果取值为true/false，id为重复的推文id；
            2. 存在中文与英文的报道，统一处理为中文分析;
            3. 要根据推文内容中的主体,以及推文中相关数据是否一致来作为判断的依据。
here;
    $text = generateTextByChatGPT($system, $prompt);
    $logger->info($text);
    $result = json_from_string($text);
    if($result && $result['id']){
        return $result['id'];
    }
    return false;
}

function process_x_retweet_config(){
    global $logger, $mainScreenName;
    db_update('tb_twitter_reply_tweet_config')->fields(array('del_flag'=>1))->condition('tweet_post_time', null, 'is not')->condition('tweet_post_time', time()-12*3600, '<')->condition('del_flag', 0)->execute();
    $query = db_select('tb_twitter_tweet_post_task', 't')->fields('t', array('id', 'twitter_tags', 'tweet_id', 'tweet_post_time'));
    $query->leftJoin('tb_twitter_reply_tweet_config', 'c', 'c.tweet_id=t.tweet_id');
    $query->condition('screen_name', $mainScreenName)->condition('c.id', null, 'is');
    $query->condition('status', 's');
    $query->condition('t.tweet_post_time', time() - 3600, '>');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info('X twitter reply tweet config');
        $logger->info($row);
        $item = array(
            'name'=> $row['tweet_id'],
            'tweet_id'=> $row['tweet_id'],
            'tweet_post_time'=> $row['tweet_post_time'],
            'url'=> 'https://x.com/HashNewsHK/status/' . $row['tweet_id'],
            'remark'=> '自动发帖',
            'del_flag'=> 0,
            'insert_time'=> time(),
            'last_update_time'=> time()
        );
        if($row['twitter_tags']){
            $tags = json_from_string($row['twitter_tags']);
            $item['words'] = implode(' ', $tags);
        }
        $logger->info($item);
        db_insert('tb_twitter_reply_tweet_config')->fields($item)->execute();
    }
}

function process_hash_news_audio_text(){
    global $logger;
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'FORMAT_TEXT_AUDIO_PROMPT')->execute()->fetchField();
    if(!$system){
        $logger->info('转换为语音文本, not found prompt');
        return;
    }
    $query = db_select('dt_hash_news_list', 'n')->fields('n', array('id', 'detail_content'));
    $query->condition('audio_text', null , 'is');
    $query->condition('create_time', '2025-05-09', '>');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info($row);
        $prompt = to_json(array('text'=> $row['detail_content']));
        $text = generateTextByChatGPT($system, $prompt);
        $info = json_from_string($text);
        $logger->info($info);
        if($info && isset($info['text'])){
            $update = array(
                'audio_text'=> $info['text']
            );
            db_update('dt_hash_news_list')->fields($update)->condition('id', $row['id'])->execute();
        }
    }
}

function process_alarm(){
    global $logger, $dingMsgInfo;
    // X发推检测
    $query = db_select('tb_twitter_tweet_post_task', 't')->fields('t', array('id', 'insert_time'));
    $query->condition('screen_name', 'hashnewsHK');
    $query->condition('status', 'i');
    $query->orderBy('insert_time');
    $result = $query->execute();
    $tweetTaskCount = $result->rowCount();
    $tweet = $result->fetchAssoc();
    if($tweet){
        $timeout = time() - $tweet['insert_time'];
        if($tweetTaskCount > 4 || $timeout > 1*3600){
            $msg = 'X 发推有问题，请排查，当前累计任务：' . $tweetTaskCount . ', 延迟 ' . intval($timeout/60) . ' 分钟 ！！！';
            sendDingTalkMessage($msg, 'alarm');
        }
    }
    /**
    // weibo发帖检测
    $query = db_select('tb_twitter_tweet_post_task', 't')->fields('t', array('insert_time'));
    $query->condition('screen_name', 'hashnewsHK');
    $query->condition('weibo_status', 'i');
    $query->condition('id', 7000, '>');
    $query->orderBy('insert_time');
    $result = $query->execute();
    $tweetTaskCount = $result->rowCount();
    $tweet = $result->fetchAssoc();
    if($tweet){
        $timeout = time() - $tweet['insert_time'];
        if($tweetTaskCount > 4 || $timeout > 1*3600){
            $msg = '微博 发推有问题，请排查，当前累计任务：' . $tweetTaskCount . ', 延迟 ' . intval($timeout/60) . ' 分钟 ！！！';
            sendDingTalkMessage($msg, 'alarm');
        }
    }
    **/
    
    $query = db_select('dt_hash_news_list', 'n')->fields('n', array('id', 'tg_status'));
    $query->condition('id', 8850, '>')->condition('tg_status', 'i');
    $result = $query->execute();
    $tgTaskCount = $result->rowCount();
    if($tgTaskCount > 2){
        $msg = 'Telegram 发消息有问题，请排查，当前累计任务：' . $tgTaskCount;
        sendDingTalkMessage($msg, 'alarm');
    }
    // 检测 panews 快讯列表采集
    $lastUpdateTime = db_select('dt_news_list', 'n')->fields('n', array('last_update_time'))->condition('site', 'panews')->orderBy('last_update_time', 'desc')->execute()->fetchField();
    if($lastUpdateTime && time()-$lastUpdateTime>15*60){
        $msg = 'Panews快讯采集延迟，请排查，超过 ' . (time()-$lastUpdateTime)/60 . ' 分钟，未更新';
        sendDingTalkMessage($msg, 'alarm');
    }
    // 平台采集监控
    // select id,site,url,status,del_flag,from_unixtime(crawler_finish_time) cft,remark from tb_monitor_crawler_target where del_flag = 0 order by crawler_finish_time;
    $crawlCheckMsgs = '';
    $query = db_select('tb_monitor_crawler_target', 't')->fields('t', array('id', 'site', 'crawler_finish_time', 'remark'));
    $query->condition('del_flag', 0);
    $query->condition('crawler_finish_time', time()-3*3600, '<');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $crawlCheckMsgs .= '采集监控，' . $row['site'] . ',' . $row['remark'] . ', 采集超时 ' . date('Y-m-d H:i:s', $row['crawler_finish_time']) . "\n";
    }
    if($crawlCheckMsgs){
        sendDingTalkMessage($crawlCheckMsgs, 'alarm');
    }
    // CMC 数据采集监控
    $cmcCoinUpdateTime = db_select('dt_crawl_cmc_coin_list', 'c')->fields('c', array('update_time'))->orderBy('update_time', 'desc')->execute()->fetchField();
    $timeout = time() - strtotime($cmcCoinUpdateTime);
    if($timeout > 15*60){
        $msg = 'CMC，代币列表采集，超过 ' . $timeout/60 . ' 分钟，未更新';
        sendDingTalkMessage($msg, 'alarm');
    }
    $cmcExchangeUpdateTime = db_select('dt_crawl_exchange_list', 'e')->fields('e', array('update_time'))->orderBy('update_time', 'desc')->execute()->fetchField();
    $timeout = time() - strtotime($cmcExchangeUpdateTime);
    if($timeout > 15*60){
        $msg = 'CMC，交易所列表采集，超过 ' . $timeout/60 . ' 分钟，未更新';
        sendDingTalkMessage($msg, 'alarm');
    }
    $cmcPairsUpdateTime = db_select('dt_crawl_market_pairs_list', 'p')->fields('p', array('update_time'))->orderBy('update_time', 'desc')->execute()->fetchField();
    $timeout = time() - strtotime($cmcPairsUpdateTime);
    if($timeout > 15*60){
        $msg = 'CMC，交易对，超过 ' . $timeout/60 . ' 分钟，未更新';
        sendDingTalkMessage($msg, 'alarm');
    }
    $cmcPairsUpdateTime = db_select('dt_crawl_market_pairs_list_dex_spot', 'p')->fields('p', array('update_time'))->orderBy('update_time', 'desc')->execute()->fetchField();
    $timeout = time() - strtotime($cmcPairsUpdateTime);
    if($timeout > 15*60){
        $msg = 'CMC，DEX现货交易对，超过 ' . $timeout/60 . ' 分钟，未更新';
        sendDingTalkMessage($msg, 'alarm');
    }
    // 消息推送报警
    $latestNewsInfo = db_select('dt_hash_news_list', 'n')->fields('n', array('id', 'push_status', 'publish_time'))->condition('push_flag', 'y')->orderBy('publish_time', 'desc')->execute()->fetchAssoc();
    if($latestNewsInfo){
        if($latestNewsInfo['push_status']!='s' && time()-$latestNewsInfo['publish_time']>300){
            $msg = '消息推送延迟，请排查，超过 ' . (time()-$latestNewsInfo['publish_time'])/60 . ' 分钟，未更新';
            sendDingTalkMessage($msg, 'alarm');
        }
    }
    // X相关 资源/任务 统计
    if(!$dingMsgInfo || $dingMsgInfo!=date('Y-m-dH')){
        // 主账号可关注账号目标数量
        // select count(*) from tb_twitter_processing_account where following is null and followed_by is null and status='y' and last_following_time=0 and cancel_following_time=0;
        $count = db_select('tb_twitter_processing_account', 'a')->fields('a', array('id'))->condition('following', null, 'is')->condition('followed_by', null, 'is')->condition('status', 'y')->condition('last_following_time', 0)->condition('cancel_following_time', 0)->execute()->rowCount();
        $msg = "主账号可关注目标数量： ${count}\n";
        $todayTimestamp = strtotime(date('Y-m-d 08:00:00'));
        $hour = date('H');
        if($hour < 9){
            $todayTimestamp = strtotime(date('Y-m-d 08:00:00', strtotime('-1 day')));
        }
        // 近1小时关注目标数
        // select count(*) from tb_twitter_processing_account where last_following_time > unix_timestamp()-3600;
        $followingCountHour = db_select('tb_twitter_processing_account', 'a')->fields('a', array('id'))->condition('last_following_time', time()-3600, '>')->execute()->rowCount();
        $followingCountToday = db_select('tb_twitter_processing_account', 'a')->fields('a', array('id'))->condition('last_following_time', $todayTimestamp, '>')->execute()->rowCount();
        $msg .= "近1小时关注数： ${followingCountHour}\n";
        $msg .= "今  日 关 注 数： ${followingCountToday}  （北京时间08:00开始）\n";
        // 近1小时取消关注目标数
        //select id,screen_name from tb_twitter_processing_account where followed_by is null and cancel_follow_flag = 'y' and cancel_following_time=0
        $cancelFollowingTotalCount = db_select('tb_twitter_processing_account', 'a')->fields('a', array('id'))->condition('followed_by', null, 'is')->condition('cancel_follow_flag', 'y')->condition('cancel_following_time', 0)->execute()->rowCount();
        $cancelFollowingCountHour = db_select('tb_twitter_processing_account', 'a')->fields('a', array('id'))->condition('cancel_following_time', time()-3600, '>')->execute()->rowCount();
        $cancelFollowingCountToday = db_select('tb_twitter_processing_account', 'a')->fields('a', array('id'))->condition('cancel_following_time', $todayTimestamp, '>')->execute()->rowCount();
        $msg .= "主账号可取消关注数： ${cancelFollowingTotalCount}\n";
        $msg .= "近1小时取消关注数： ${cancelFollowingCountHour}\n";
        $msg .= "今  日 取 消 关注数： ${cancelFollowingCountToday}  （北京时间08:00开始）\n";
        // 主账号评论数
        // select count(*) from tb_twitter_tweet_reply_task where reply_screen_name='hashnewsHK' and reply_status='s' and reply_finish_time>unix_timestamp()-3600;
        $replyCountHour = db_select('tb_twitter_tweet_reply_task', 't')->fields('t', array('id'))->condition('reply_screen_name', 'hashnewsHK')->condition('reply_status', 's')->condition('reply_finish_time', time()-3600, '>')->execute()->rowCount();
        $replyCountToday = db_select('tb_twitter_tweet_reply_task', 't')->fields('t', array('id'))->condition('reply_screen_name', 'hashnewsHK')->condition('reply_status', 's')->condition('reply_finish_time',$todayTimestamp, '>')->execute()->rowCount();
        $msg .= "近1小时评论数： ${replyCountHour}\n";
        $msg .= "今  日 评 论 数： ${replyCountToday}   （北京时间08:00开始）\n";
        // 可发私信目标数
        $dmCount = db_select('tb_twitter_processing_account', 'p')->fields('p', array('id'))->condition('dm_flag', 'y')->condition('dm_time', 0)->execute()->rowCount();
        $msg .= "主账号可私信目标数量： ${dmCount}\n";

        sendDingTalkMessage($msg, 'info');
        $dingMsgInfo = date('Y-m-dH');
    }
}

function process_judge_twitter_target(){
    global $logger;
    // select * from tb_twitter_monitor_account where name is not null and ai_judge_lang is null and is_blue_verified='1';
    $query = db_select('tb_twitter_monitor_account', 't')->fields('t', array('id', 'screen_name', 'name', 'created_at', 'description'));
    $query->condition('name', null, 'is not');
    $query->condition('screen_name', null, 'is not');
    $query->condition('description', null, 'is not');
    $query->condition('ai_judge_lang', null, 'is');
    $query->condition('is_blue_verified', 1);
    $query->orderBy('followers_count', 'desc');
    $query->range(0, 1000);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        //$logger->info($row);
        $logger->info('screen_name: '. $row['screen_name']);
        $screenName = $row['screen_name'];
        $tweets = array();
        $tweetQuery = db_select('dt_twitter_crawler_tweet', 'p')->fields('p', array('created_at', 'full_text'));
        $tweetQuery->condition('screen_name', $screenName);
        $tweetQuery->orderBy('created_at', 'desc');
        $tweetQuery->range(0, 3);
        $tweetResult = $tweetQuery->execute();
        while($tweet = $tweetResult->fetchAssoc()){
            $tweets[] = array(
                'created_at'=> $tweet['created_at'],
                'description'=> $tweet['full_text']
            );
        }
        $tweetsStr = to_json($tweets);

        // 2. 关注点：总结 3-5 个该账号最关注的话题
        // 4. 总结账号的语言风格
        // "focus_points": ["话题1", "话题2", "话题3"],
        // "style": "语言风格"

        $prompt = <<<here
        你是一个社交媒体数据分析专家。我将提供一个 Twitter 账号的简介和部分历史推文，请你分析该账号的所属行业，总结它的核心关注点，一句话简短介绍本账号，概括账号的语言风格。请以 JSON 格式输出结果。
        账号名：${row['name']}
        账号简介：${row['description']}
        部分推文：${tweetsStr}
        要求：
            1. 所属行业：从 加密货币、科技、金融、娱乐、教育、医疗、体育、游戏、电商、新闻、政治、艺术、环境、其他 中选择一个最符合的行业。
            2. 一句话介绍本账号，让人快速知道这个账号的角色，如：币安CEO, 足球明星
            3. 判断账号发推语言： 中文 英文 韩语 等， 优先判断为中文
            4. 以 JSON 格式输出，格式如下：
            {
                "industry": "行业名称",
                "intro": "介绍本账号",
                "lang": "发推语言"
            }
            请直接输出 JSON，不使用markdown格式，不要添加额外的文字或解释。
here;
        /**
         * 2.尽量分条目输出内容，且插入恰当的小图标；
         */
        $system = <<<here
        你是一个社交媒体分析专家
here;
        //$logger->info($prompt);
        $text = generateTextByChatGPT($system, $prompt);
        if($text){
            $info = json_from_string($text);
            $logger->info($info);
            $industry = $info['industry'];
            $intro = $info['intro'];
            $lang = $info['lang'];
            //$logger->info('industry: ' . $industry);
            if($industry){
                $updateItem = array(
                    'ai_judge_industry'=> $industry,
                    'ai_summary_intro'=> $intro,
                    'ai_judge_lang'=> $lang
                );
                db_update('tb_twitter_monitor_account')->fields($updateItem)->condition('id', $row['id'])->execute();
            }
        }
    }
}

function process_x_key_account(){
    global $logger;
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('screen_name', 'name', 'is_blue_verified'));
    $query->leftJoin('tb_twitter_processing_account', 'a', 'a.screen_name=t.screen_name');
    $query->condition('t.in_reply_to_status_id', null, 'is');
    $query->condition('t.tweet_show_type', 'for_you');
    $query->condition('t.following', '');
    $query->condition('t.is_blue_verified', '1');
    $query->condition('a.id', null, 'is');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        //$logger->info($row);
        $item = array(
            'status'=> 'i',
            'screen_name'=> $row['screen_name'],
            'name'=> $row['name'],
            'is_blue_verified'=> $row['is_blue_verified']
        );
        $exists = db_select('tb_twitter_processing_account', 'a')->fields('a', array('id'))->condition('screen_name', $row['screen_name'])->execute()->fetchAssoc();
        if(!$exists){
            $logger->info('insert .... ' . $row['screen_name']);
            db_insert('tb_twitter_processing_account')->fields($item)->execute();

            $account = array(
                'screen_name'=> $row['screen_name']
            );
            $existA = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id'))->condition('screen_name',  $row['screen_name'])->execute()->fetchAssoc();
            if(!$existA){
                $account['insert_time'] = time();
                db_insert('tb_twitter_monitor_account')->fields($account)->execute();
            }
        }
    }
    // 更新 主账号关注信息
    // 1624286098737483778  HashNewsHK
    // select id,screen_name,from_unixtime(last_update_time) from tb_twitter_followings_account where belongs_user_id='1624286098737483778';
    $followings = db_select('tb_twitter_followings_account', 'f')->fields('f', array('screen_name'))->condition('belongs_user_id', '1624286098737483778')->condition('last_update_time', strtotime('2025-07-10 08:00:00'), '>')->execute()->fetchCol();
    $logger->info('following count: ' . count($followings));
    $followings_update = db_update('tb_twitter_processing_account')->fields(array('following'=>true))->condition('screen_name', $followings)->condition('cancel_follow_flag', 'n')->execute();
    $logger->info('followings_update: ' . $followings_update);
    $followings_cancel_update = db_update('tb_twitter_processing_account')->fields(array('following'=>true))->condition('screen_name', $followings)->condition('cancel_follow_flag', 'y')->condition('cancel_following_time', 0, '>')->execute();
    $logger->info('followings_cancel_update: ' . $followings_cancel_update);

    $followers = db_select('tb_twitter_followers_account', 'f')->fields('f', array('screen_name'))->condition('belongs_user_id', '1624286098737483778')->condition('is_blue_verified', '1')->execute()->fetchCol();
    $follower_update = db_update('tb_twitter_processing_account')->fields(array('followed_by'=>true))->condition('screen_name', $followers)->execute();
    $logger->info('follower_update: ' . $follower_update);

    // select * from tb_twitter_tweet_reply_task where reply_screen_name='hashnewsHK' and reply_status in ('i', 'r') order by id desc limit 1\G;
    //$reply_update = db_update('tb_twitter_tweet_reply_task')->fields(array('reply_status'=> 'f'))->condition('reply_screen_name', 'hashnewsHK')->condition('reply_status', array('i', 'r'))->condition('screen_name', $followers)->execute();
    //$logger->info('reply_update: ' . $reply_update);

    // 主账号评论任务信息
    //select screen_name,count(*) task_num from tb_twitter_tweet_reply_task where reply_screen_name='hashnewsHK' group by screen_name
    $queryTask = db_select('tb_twitter_tweet_reply_task', 't')->fields('t', array('screen_name'));
    $queryTask->addExpression('count(*)', 'task_num');
    $queryTask->condition('reply_screen_name', 'hashnewsHK');
    $queryTask->condition('reply_status', 's');
    $queryTask->groupBy('screen_name');
    $query = db_select('tb_twitter_processing_account', 'a')->fields('a', array('screen_name', 'reply_task_num'));
    $query->fields('t', array('task_num'));
    $query->leftJoin($queryTask, 't', 't.screen_name=a.screen_name');
    $query->condition('a.reply_task_num', 0);
    $query->condition('a.status', 'y');
    $query->condition('t.task_num', 0, '>');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info('update task_num: ' . to_json($row));
        db_update('tb_twitter_processing_account')->fields(array('reply_task_num'=> $row['task_num']))->condition('screen_name', $row['screen_name'])->execute();
    }

    // 通过AI 判断账号基本信息
    process_judge_twitter_target();
    // 自动设置判断结果
    $query = db_select('tb_twitter_processing_account', 'p')->fields('p', array('id', 'screen_name'));
    $query->fields('a', array('ai_judge_industry', 'ai_judge_lang'));
    $query->leftJoin('tb_twitter_monitor_account', 'a', 'a.screen_name=p.screen_name');
    $query->condition('p.status', 'i');
    $query->condition('ai_judge_lang', null, 'is not');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        if($row['ai_judge_lang'] != '中文'){
            db_update('tb_twitter_processing_account')->fields(array('status'=> 'n', 'remark'=>'非中文'))->condition('id', $row['id'])->execute();
            continue;
        }
        if($row['ai_judge_industry'] == '政治'){
            db_update('tb_twitter_processing_account')->fields(array('status'=> 'n', 'remark'=>'非币圈'))->condition('id', $row['id'])->execute();
            continue;
        }
        if($row['ai_judge_industry'] == '加密货币'){
            db_update('tb_twitter_processing_account')->fields(array('status'=> 'y'))->condition('id', $row['id'])->execute();
            continue;
        }
    }

    // 仅通过 为你推荐 收集账号，不及时， 额外补充
    $query = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('screen_name', 'name', 'is_blue_verified', 'statuses_count'));
    $query->leftJoin('tb_twitter_processing_account', 'p', 'p.screen_name=a.screen_name');
    $query->condition('p.id', null, 'is');
    $query->condition('a.is_blue_verified', '1');
    //$query->condition('statuses_count', 100, '>');
    $query->condition('a.ai_judge_industry', '加密货币');
    $query->condition('a.ai_judge_lang', '中文');
    $result = $query->execute();
    $logger->info('加密 中文 total account： ' . $result->rowCount());
    $count = 0;
    while($row = $result->fetchAssoc()){
        //$latestPostTime = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('created_at'))->condition('screen_name', $row['screen_name'])->condition('in_reply_to_status_id', null, 'is')->orderBy('created_at', 'desc')->execute()->fetchField();
        //if($latestPostTime && time()-$latestPostTime<7*24*3600){
            //$logger->info($row['screen_name'] . '   , add');
            $item = array(
                'status'=> 'y',
                'screen_name'=> $row['screen_name'],
                'name'=> $row['name'],
                'is_blue_verified'=> $row['is_blue_verified'],
                'remark'=> 'ai'
            );
            $exists = db_select('tb_twitter_processing_account', 'a')->fields('a', array('id'))->condition('screen_name', $row['screen_name'])->execute()->fetchAssoc();
            if(!$exists){
                $logger->info('insert .... ' . $row['screen_name']);
                db_insert('tb_twitter_processing_account')->fields($item)->execute();
            }
            $count++;
            if($count > 1000){
                return;
            }
        //}
    }

}

function run_system(){
    global $logger;
    while(true){
        //process_PANews_generate_tweet();
        //process_TheBlock_generate_tweet();
        //process_Cointelegraph_generate_article();
        //process_Biance_generate_tweet();
        process_tweet_re_generate_tweet();
        //process_tweet_generate_tweet_by_num();
        process_tweet_generate_tweet_by_flag();
        //process_tweet_generate_reply();
    //    process_X_crazysmm_api();
        //process_mian_tweet_generate_reply_to_reply();
        //process_tweet_generate_main_home_reply();
        //process_tweet_generate_main_reply();
        //process_tweet_generate_coin_reply();
        //process_token_research_main_reply();
        ////process_tweet_generate_meme_reply();
        //process_new_format();
        process_x_tweet();
        process_x_retweet_config();
        //process_hash_news_audio_text();
        process_alarm();
        //modify_whale_tweet();
        ////process_x_key_account();
        //die;
        sleep(10);
    }
}

function test_system(){

}
