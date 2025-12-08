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

function sendChatGPTCurl($url, $data){
    $apiKey = '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';
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

function generateTextByChatGPT($system, $prompt){
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
    $data = sendChatGPTCurl($url, $curlData);
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

function process_tg_messages_generate_reply(){
    global $logger;
    $username = 'hsx4224';
    $query = db_select('dt_telegram_messages', 'm')->fields('m', array('id', 'chat_id', 'message_id', 'user_id', 'message_type', 'content', 'reply_flag'));
    $query->condition('message_type', 'other', '!=');
    $query->condition('username', $username, '!=');
    $query->condition('content', null, 'is not');
    $query->condition('reply_flag', 'n');
    $query->orderBy('id', 'desc');
    $message = $query->execute()->fetchAssoc();
    if(!$message){
        $logger->info('Not found Reply avaialble message ...');
        return;
    }
    $system = db_select('dt_basic_config', 'c')->fields('c', array('value'))->condition('name', 'GENERATE_TG_MESSAGE_REPLY')->execute()->fetchField();
    if(!$system){
        $logger->info('生成 TG 评论回复 , not found prompt');
        return;
    }
    $promptInfo = array(
        'content'=> $message['content']
    );
    $prompt = to_json($promptInfo);
    $text = generateTextByChatGPT($system, $prompt);
    //$logger->info($text);
    $info = json_from_string($text);
    if(isset($info['content'])){
        $reply = $info['content'];
        $update = array(
            'reply_flag'=> 'y',
            'reply_text'=> $reply
        );
        $logger->info($update);
        db_update('dt_telegram_messages')->fields($update)->condition('id', $message['id'])->execute();
    }
}

function run_system(){
    global $logger;
    while(true){
        process_tg_messages_generate_reply();
        die;
        sleep(5);
    }
}

function test_system(){

}
