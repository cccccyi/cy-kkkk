<?php
ini_set('display_errors', 1);
define('IN_DEBUG', false);
require_once('bootstrap.php');
require_once('common.php');
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
    global $appId, $appKey, $masterSecret, $token;
    db_query('set names utf8mb4');
    // 配置参数（请替换为你的实际值）
    $appId = 'osZGq3x95O7Uro6fgZbkP9'; // 替换为你的AppID
    $appKey = 'DhZ1gLghOi5mjwphvLsfh1'; // 替换为你的AppKey
    $masterSecret = 'TQmX15Xu9M6DYoZ2Xmnkx6'; // 替换为你的MasterSecret
    return true;
}

function curl_request($url, $post=false, $data=array(), $cookie='', $retry_times=2, $headers=array()){
    for($i=0; $i<$retry_times; $i++){
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);

        if($headers){
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }

        if($post){
            curl_setopt($ch, CURLOPT_POST, 1);
        }
        if($cookie){
            curl_setopt($ch, CURLOPT_COOKIE, $cookie);
        }
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); // return don't print
        curl_setopt($ch,  CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 1200);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);

        if($data){
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        }
        $content = curl_exec($ch);
        curl_close($ch);
        if($content){
            break;
        }
    }
    return $content;
}

function process_getui_token(){
    global $logger, $appId, $appKey, $masterSecret, $token;

    $baseUrl = "https://restapi.getui.com/v2/{$appId}/auth";
    // 生成鉴权所需的参数
    $timestamp = round(microtime(true) * 1000); // 当前时间戳（毫秒）
    $sign = hash('sha256', $appKey . $timestamp . $masterSecret); // 生成签名

    // 构造请求数据
    $requestData = [
        'sign' => $sign,
        'timestamp' => $timestamp,
        'appkey' => $appKey
    ];
    $headers = array(
        'Content-Type: application/json'
    );
    $response = curl_request($baseUrl, true, to_json($requestData), '', 2, $headers);
    $logger->info($response);
    $result = json_from_string($response);
    if (isset($result['code']) && $result['code'] == 0) {
        $logger->info('鉴权成功');
        $logger->info('Token: ' . $result['data']['token']);
        $token = $result['data']['token'];
        $logger->info('过期时间: ' . date('Y-m-d H:i:s', $result['data']['expire_time'] / 1000));
    } else {
        $logger->info('鉴权失败: ' . $result['msg']);
    }
}

/**
 * 实现个推toApp推送
 * @param string $appId 应用ID
 * @param string $token 鉴权Token
 * @param string $title 通知标题
 * @param string $body 通知内容
 * @param string $requestId 请求唯一标识（可选，默认为随机UUID）
 * @return array 返回结果，包含status（true/false）、data（成功时为推送结果，失败时为错误信息）
 */
function pushToApp($title, $body, $requestId = null) {
    global $logger, $appId, $token;
    if(empty($appId) || empty($token) || empty($title) || empty($body)){
        $logger->info('pushToApp 缺少必要参数');
        return array(
            'status' => false,
            'data' => '缺少必要参数：appId, token, title 或 body 不能为空'
        );
    }
    // 生成请求ID（如果未提供）
    $requestId = $requestId ?: uniqid('push_', true);
    // 构造推送请求数据
    $payload = array(
        'id'=> 'HJlzd1RqrQ'
    );
    $requestData = array(
        'request_id' => $requestId,
        'audience' => 'all', // toApp推送目标为全体用户
        'push_message' => array(
            'notification' => array(
                'title' => $title,
                'body' => $body,
                'click_type' => 'intent', // 点击通知启动应用
                'intent'=> $payload['id'],
                'payload'=> to_json($payload)
            )
        ),
        'settings' => [
            'ttl' => 3600000 // 消息存活时间1小时（毫秒）
        ]
    );

    // 接口地址
    $baseUrl = "https://restapi.getui.com/v2/{$appId}/push/all";

    // 初始化cURL
    $ch = curl_init($baseUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'token: ' . $token
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));

    // 执行请求
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    // 检查请求是否成功
    if ($response === false || $httpCode != 200) {
        $error = curl_error($ch);
        curl_close($ch);
        return [
            'status' => false,
            'data' => "请求失败: HTTP状态码: {$httpCode}, 错误: {$error}"
        ];
    }

    // 解析响应
    $result = json_decode($response, true);
    curl_close($ch);

    if (isset($result['code']) && $result['code'] == 0) {
        return [
            'status' => true,
            'data' => $result['data'] // 返回任务ID等信息
        ];
    } else {
        return [
            'status' => false,
            'data' => $result['msg']? $result['msg'] : '未知错误'
        ];
    }
}

function process_getui(){
    global $logger, $token;
    if(!$token){
        process_getui_token();
    }
    if(!$token){
        $logger->info('未获取到 Token');
        return;
    }
    // 2. 执行toApp推送
    $title = "哈世链闻最新消息";
    $body = "Amber Group、Spartan Group等机构参与Plasma本轮存款活动";
    $customId = time(); // 自定义消息ID
    $pushResult = pushToApp($title, $body, $customId);
    if ($pushResult['status']) {
        $logger->info('推送成功');
        $logger->info($pushResult['data']);
    } else {
        $logger->info('推送失败: ' . $pushResult['data']);
    }
}


function run_system(){
    while(true){
        process_getui();
        die;
        sleep(2);
    }
}

function test_system(){

}
