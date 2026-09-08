<?php
ini_set('max_execution_time',9600);
ini_set('display_errors', 1);
require_once('bootstrap.php');
require_once('common.php');
//require_once(PP_INC_ROOT . '/phpmailer/class.phpmailer.php');
require_once(PP_INC_ROOT . '/PHPMailer-master/PHPMailer.php');
require_once(PP_INC_ROOT . '/PHPMailer-master/SMTP.php');
require_once(PP_INC_ROOT . '/PHPMailer-master/Exception.php');
require_once(PP_COMMON_ROOT . '/common.php');
require_once(PP_INC_ROOT . '/db.php');
require_once(PP_INC_ROOT . '/request.php');
require_once(PP_INC_ROOT . '/webCrawler/CrawlerStorage.class.php');
require_once('./process_instagram_data.php');
require_once('./process_facebook.php');
require_once('./process_uwants.php');
require_once('./process_discuss.php');
require_once('./process_mewe.php');
require_once('./process_telegram.php');
require_once('./process_panews.php');
require_once('./process_theblock.php');
require_once('./process_binance.php');
require_once('./process_twitter.php');
require_once('./process_coinglass.php');
require_once('./process_coinank.php');
require_once('./process_tender.php');
require_once('./process_weibo.php');

function crawler_reject_request($status_code, $message){
    http_response_code($status_code);
    echo_json(array('success'=>false, 'message'=>$message));
    exit;
}

function crawler_authorization_header(){
    if(isset($_SERVER['HTTP_AUTHORIZATION'])){
        return trim($_SERVER['HTTP_AUTHORIZATION']);
    }
    if(isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])){
        return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }
    if(function_exists('getallheaders')){
        $headers = getallheaders();
        if(is_array($headers)){
            foreach($headers as $name=>$value){
                if(strcasecmp($name, 'Authorization') === 0 && is_string($value)){
                    return trim($value);
                }
            }
        }
    }
    return '';
}

function require_crawler_api_token(){
    $expected_token = getenv('CRAWLER_API_TOKEN');
    if(!function_exists('hash_equals') || !is_string($expected_token)
        || !preg_match('/\A[\x21-\x7E]{32,512}\z/D', $expected_token)){
        crawler_reject_request(503, 'service unavailable');
    }

    $authorization = crawler_authorization_header();
    $matches = array();
    if(!preg_match('/\ABearer[ \t]+([!-~]{32,512})\z/iD', $authorization, $matches)
        || !hash_equals($expected_token, $matches[1])){
        crawler_reject_request(401, 'unauthorized');
    }
}

require_crawler_api_token();
db_query('set names utf8mb4');

//$task_table = 'search_accounts_info_extra';
$task_table = 'search_accounts_info';
$op = P('op');
$request_start_time = time();
$response = array();
$op_allows = array(
    'test',
    'test_connect',
    'proxies_ip',
    //twitter
    'check_out_get_tw_phone_gd',
    'check_out_get_tw_phone',
    'check_out_tw_result',
    'check_out_fb_result',
    'check_out_get_tw_name',
    'check_out_get_tw_name_result',
    'twitter_check_out',
    'twitter_check_out_py',
    'twitter_account_info',
    'twitter_single_post',
    'twitter_post_list',
    'twitter_account_info_by_api',
    'twitter_post_list_by_api',
    'twitter_post_list_by_search',
    'twitter_followers',
    //facebook
    'facebook_check_out',
    'facebook_check_out_fid',
    'facebook_check_out_proxy',
    'facebook_get_account_and_friends_count',
    'facebook_group',
    'facebook_account_basic',
    'facebook_account_info',
    'facebook_account_info_by_api',
    'facebook_page_info_by_api',
    'facebook_page_info_add',
    'facebook_single_post',
    'facebook_post_interactive',
    'facebook_single_post_by_url',
    'facebook_post_list',
    'facebook_group_user_post',
    'facebook_post_list_nologin',
    'facebook_event_post_list',
    'facebook_post_reply',
    'facebook_post_reply_by_api',
    'facebook_post_forward',
    'facebook_post_forward_by_api',
    'facebook_post_praise',
    'facebook_group_members',
    'facebook_group_newest_member',
    'facebook_user_friends',
    'facebook_user_friends_by_api',
    'facebook_user_followers',
    'facebook_user_following',
    'facebook_keyword_stories',
    'facebook_keyword_search',
    'facebook_search_group',
    'facebook_search_group_post',
    'facebook_search_members_in_group',
    'facebook_group_by_page',
    'facebook_likes_page',
    'facebook_groups_list',
    'facebook_page_members',
    'facebook_insights_data',
    'facebook_login',
    'facebook_auth',
    'facebook_groups_list_by_api',
    'facebook_post_list_by_api',
    'facebook_event_info_by_api',
    'facebook_fid_by_url',
    'fb_group_share_post_by_api',
    'facebook_task_post_by_api',
    'facebook_vote_by_post',
    'fb_admin_insights_data',
    'facebook_admin_insights_api',
    'fb_admin_post_insights_data',
    'fb_poll_post_info',
    'fb_user_friends_by_hovercard',
    'fb_page_role_search_email',
    //facebook API token2
    'facebook_account_basic_api2',
    'facebook_account_info_api2',
    'facebook_account_friend_num_api2',
    'facebook_post_list_api2',
    'facebook_post_reply_api2',
    'facebook_comment_reply_api2',
    'facebook_post_forward_api2',
    'facebook_post_praise_api2',
    'facebook_user_friends_by_api2',
    'facebook_likes_page_by_api2',
    'facebook_event_info_api2',
    'facebook_reply_praise_api2',
    'facebook_photo_by_api2',
    'facebook_single_post_api2',
    'facebook_location_info_api2',
    'facebook_post_attachments_by_api2',
    'facebook_manage_page_list_api2',
    'facebook_page_role_list_api2',
    'facebook_search_members_in_group_v2',
    //client to center
    'facebook_post_lists_storage',
    //news
    'sina_news',
    '163_news',
    'qq_news',
    'sohu_news',
    'ifeng_news',
    'toutiao_news',
    'thepaper_news',
    'xinhuanet_news',
    'huanqiu_news',
    'yidianzixun_news',
    'wechat_subscription',
    'app_sohu_news',
    //other
    'phone_location',
    'facebook_page',
    'facebook_follow_user',
    'crawler_image_by_url',
    //SZ Crawler
    'sz_crawl_fb_account',
    'sz_crawl_fb_group_member',
    'sz_crawl_fb_post',
    'sz_crawl_fb_newest_post',
    'sz_crawl_fb_single_post',
    'cp_crawl_fb_account_target',
    'cp_crawler_target',
    'cp_save_crawl_result',
    'cp_fb_join_group_detect',
    'cp_fb_group_post_detect',
    'cp_fb_group_post_info_collect',
    'cp_fb_group_permeation_batch',
    'cp_fb_guid_task_detect',
    //Browser engine check
    'engine_version'
);

$nologin_ops_arr = array(
    'phone_location',
    'proxies_ip',
    'facebook_user_friends_by_api',
    'facebook_event_info_by_api',
    'crawler_image_by_url',
    'facebook_page_info_add',
    'twitter_account_info',
    'twitter_post_list_by_api',
    'facebook_manage_page_list_api2',
    'facebook_page_role_list_api2',
    'facebook_post_list_nologin'
);

$machines_maps = array(
    '43.129.10.105'=> 'g111_vcman_198',
    '150.109.122.158'=> 'g111_vcman_81',
    '43.154.12.82'=> 'vcman_t74'
);

$machine_ips_feeds = array(
    '13.250.31.170', //vcman_aws_05
    '54.151.149.214', //vcman_aws_06
    '18.142.180.54', //vcman_aws_07
    '13.229.231.119' //vcman_aws_08
);

if(!is_string($op) || !in_array($op, $op_allows, true)){
    crawler_reject_request(404, 'operation not found');
}
$fun = 'f_'.$op;
if(function_exists($fun)){
    $response = $fun();
}elseif(preg_match('/_api2$/', $op)){
    $response = facebook_crawler_api2();
}elseif($op === 'facebook_keyword_search'){
    $response = f_facebook_keyword_search();
}else{
    $response = array('success'=>false, 'message'=>'not found operation function');
}

echo_json($response);

function update_sql_deadlock($update_sql){
    global $crawler_db_options;
    $count = 0;
    $msg = '';
    while(true){
        try{
            db_query($update_sql, array(), $crawler_db_options);
            return true;
        }catch(Exception $e){
            return false;
            //$msg = "db error:".$e->getMessage()."   ,code:".$e->getCode();
            //usleep(500000);
        }
        //$count++;
        //if($count>10){
        //    break;
        //}
    }
    saveDebugLog($msg);
    return false;
}

function get_crawler_account_type_b($site_id, $account_id=null, $params=array()){
    global $crawler_db_options, $combat_db_options, $op;
    $use_type = isset($params['use_type'])? $params['use_type'] : null;
    $fields = array('id', 'cookie_str');
    /**
    if ($use_type == 'A1218') {
        $query = db_select('tb_guid_fb_account', 'a', $combat_db_options)->fields('a', $fields);
        $query->condition('id', array(5))->condition('available', 'y')->orderRandom();
    } elseif($use_type == 'CMT'){
        $query = db_select('tb_guid_fb_account', 'a', $combat_db_options)->fields('a', $fields);
        $query->condition('id', array(2,5,11))->condition('available', 'y')->orderRandom();
    } else {
        $query = db_select('tb_guid_fb_account', 'a', $combat_db_options)->fields('a', $fields);
        $query->condition('id', array(10))->condition('available', 'y')->orderRandom();
    }
    **/
    $query = db_select('tb_guid_fb_account_screenshot', 'a')->fields('a', $fields);
    if($use_type){
        $query->condition('use_type', $use_type);
    }else{
        $query->condition('use_type', null, 'is');
    }
    $query->condition('available', 'y')->orderRandom();
    $account_info = $query->execute()->fetchAssoc();
    if(!$account_info){
        return false;
    }
    $account_info['tor_switch'] = 'n';
    $account_info['tor_port'] = '';
    $account_info['bind_ip_str'] = '';
    $account_info['access_token'] = '';
    $account_id = $account_info['id'];
//    $cookie = $account_info['cookie_str_bak'];
//    if(!$cookie && $account_info['cookie_str']){
//        $cookie = $account_info['cookie_str'];
//    }
    $cookie = $account_info['cookie_str'];
    $cookie_file_format = '';
    //$cookie = format_cookie_from_base64($account_info['oock']);
    //$cookie_file_format = $account_info['oock_file_format'];
    return array(
        'account_id'=> $account_id,
        'cookie'=> $cookie,
        'cookie_file_format'=> $cookie_file_format,
        'tor_browser_switch'=> $account_info['tor_switch']=='y'? true : false,
        'tor_port'=> $account_info['tor_port'],
        'bind_ip_str'=> $account_info['bind_ip_str'],
        'token'=> $account_info['access_token']
    );
    /**
    $current_time = time();
    $account_id = intval($account_id);
    $crawler_type = isset($params['crawler_type'])? $params['crawler_type'] : null;
    $fields = array('id','tor_switch','tor_port','oock', 'oock_file_format', 'bind_ip_str','access_token');
    $crawler_type_arr = array('2_account','2_post','facebook_check_out_fid','1_forward','1_praise');
    if($account_id){
        $query = db_select('tb_crawler_account', 'a', $crawler_db_options)->fields('a', $fields)->condition('id', $account_id);
        $account_info = $query->execute()->fetchAssoc();
    }else{
        $token_op_arr = array(
            'facebook_post_list_by_api',
            'facebook_groups_list_by_api',
            'facebook_account_info_by_api',
            'facebook_page_info_by_api',
            'fb_group_share_post_by_api',
            'facebook_task_post_by_api',
            'facebook_post_reply_by_api',
            'facebook_post_forward_by_api',
            'facebook_single_post_by_api'
        );
        $single_process_account_type = array(
            'account_friends_count',
            '201_post',
            '201_post_reply_count'
        );
        if(in_array($op, $token_op_arr)){
            $account_type= 't';
            $query = db_select('tb_crawler_account', 'a', $crawler_db_options)->fields('a', $fields);
            $query->condition('access_token', null, 'is not');
            $query->condition('account_type', $account_type)->condition('is_active', 1)->condition('belong_website', $site_id);
            $query->orderBy('operation_time', 'asc')->range(0, 1);
            $account_info = $query->execute()->fetchAssoc();
        }elseif(false && preg_match('/_api2$/', $op) && !in_array($crawler_type, $single_process_account_type)){
            $account_type= $crawler_type? $crawler_type : 't2';
            $query = db_select('tb_crawler_account', 'a', $crawler_db_options)->fields('a', $fields);
            $query->condition('access_token', null, 'is not');
            $query->condition('account_type', $account_type)->condition('belong_website', $site_id);
            if(in_array($op, array('facebook_single_post_api2'))){
                $query->condition('is_active', 1);
            }else{
                $query->condition('is_active', array(1,121));
            }
            $query->orderBy('operation_time', 'asc')->range(0, 1);
            $account_info = $query->execute()->fetchAssoc();
        }else{
            if($site_id == 9){
                if(in_array($op, array('facebook_account_basic')) && !$crawler_type){
                    return false;
                }

                if(preg_match('/_api2$/', $op)){
                    $crawler_type = $crawler_type? $crawler_type : 't2';
                }

                $sign_complicate = time() . '_' . uniqid();
                $update_sql = "update tb_crawler_account set operation_time=" . $current_time . ",nature=0,sign_complicate='{$sign_complicate}' ";
                $update_sql .= " where belong_website={$site_id} and is_active=1 ";
                if($crawler_type){
                    $update_sql .= " and account_type='".$crawler_type."' ";
                }else{
                    $update_sql .= " and account_type='b' ";
                }
                switch($crawler_type){
                    case '201_post':
                    case 'post_reply_cookie':
                    case 'account_friends_count':
                        $update_sql .= " and operation_time < " . ($current_time-30);
                        break;
                    case 't2':
                        $update_sql .= " and operation_time < " . ($current_time-5);
                        break;
                    default:
                        $update_sql .= " and operation_time < " . ($current_time-10);
                }
                $update_sql .= " order by rand() limit 1 ";
                $flag = update_sql_deadlock($update_sql);
                if(!$flag){
                    return false;
                }
                $query = db_select('tb_crawler_account', 'a', $crawler_db_options)->fields('a', $fields)->condition('sign_complicate', $sign_complicate);
                $account_info = $query->execute()->fetchAssoc();
            }else{
                $query = db_select('tb_crawler_account', 'a', $crawler_db_options)->fields('a', $fields)->condition('belong_website', $site_id)->condition('is_active', 1);
                $query->condition('oock', null, 'is not')->condition('oock', '', '!=')->orderBy('operation_time', 'asc')->range(0, 1);
                $account_info = $query->execute()->fetchAssoc();
            }
        }
    }
    **/
}

function crawler_machine_map(){
    static $loaded = false;
    static $machine_map = null;
    if($loaded){
        return $machine_map;
    }
    $loaded = true;

    $raw_map = getenv('CRAWLER_MACHINE_MAP');
    if($raw_map === false || $raw_map === ''){
        $configured_map = array('default'=>'http://127.0.0.1:8011');
    }else{
        $configured_map = json_decode($raw_map, true);
        if(!is_array($configured_map) || !$configured_map){
            return null;
        }
    }

    $machine_map = array();
    foreach($configured_map as $machine_id=>$origin){
        if(!is_string($machine_id)
            || !preg_match('/\A[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}\z/D', $machine_id)){
            $machine_map = null;
            return null;
        }
        $normalized_origin = normalize_crawler_origin($origin);
        if($normalized_origin === false){
            $machine_map = null;
            return null;
        }
        $machine_map[$machine_id] = $normalized_origin;
    }
    return $machine_map;
}

function normalize_crawler_origin($origin){
    if(!is_string($origin) || strlen($origin) > 2048){
        return false;
    }
    $parts = parse_url($origin);
    if($parts === false || !isset($parts['scheme']) || !isset($parts['host'])
        || isset($parts['user']) || isset($parts['pass']) || isset($parts['query'])
        || isset($parts['fragment'])
        || (isset($parts['path']) && $parts['path'] !== '' && $parts['path'] !== '/')){
        return false;
    }

    $scheme = strtolower($parts['scheme']);
    if($scheme !== 'http' && $scheme !== 'https'){
        return false;
    }
    $host = strtolower($parts['host']);
    $valid_ip = filter_var($host, FILTER_VALIDATE_IP) !== false;
    $valid_hostname = preg_match('/\A(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)*[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\z/D', $host);
    if(!$valid_ip && !$valid_hostname){
        return false;
    }
    if(isset($parts['port']) && ($parts['port'] < 1 || $parts['port'] > 65535)){
        return false;
    }

    $url_host = strpos($host, ':') !== false ? '['.$host.']' : $host;
    $normalized = $scheme.'://'.$url_host;
    if(isset($parts['port'])){
        $normalized .= ':'.$parts['port'];
    }
    return $normalized;
}

function resolve_crawler_machine($request_params){
    $machine_id = 'default';
    if(isset($request_params['machine_id'])){
        $machine_id = $request_params['machine_id'];
    }elseif(isset($request_params['machine_ip'])){
        // Legacy field name is accepted only as a logical map key, never as a network address.
        $machine_id = $request_params['machine_ip'];
    }
    if(!is_string($machine_id)
        || !preg_match('/\A[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}\z/D', $machine_id)){
        return false;
    }

    $machine_map = crawler_machine_map();
    if(!is_array($machine_map) || !isset($machine_map[$machine_id])){
        return false;
    }
    return array('id'=>$machine_id, 'origin'=>$machine_map[$machine_id]);
}

function has_crawler_machine_selector($request_params){
    return (isset($request_params['machine_id']) && $request_params['machine_id'] !== '')
        || (isset($request_params['machine_ip']) && $request_params['machine_ip'] !== '');
}

function crawler_http_post($url, $post_fields, $include_headers=false){
    if(!function_exists('curl_init')){
        return false;
    }
    $encoded_fields = http_build_query($post_fields, '', '&');
    $ca_bundle = getenv('CRAWLER_CA_BUNDLE');
    if($ca_bundle !== false && $ca_bundle !== '' && !is_readable($ca_bundle)){
        return false;
    }

    for($attempt=0; $attempt<3; $attempt++){
        $curl = curl_init($url);
        if($curl === false){
            return false;
        }
        $options = array(
            CURLOPT_POST=>true,
            CURLOPT_POSTFIELDS=>$encoded_fields,
            CURLOPT_RETURNTRANSFER=>true,
            CURLOPT_HEADER=>$include_headers,
            CURLOPT_CONNECTTIMEOUT=>10,
            CURLOPT_TIMEOUT=>5400,
            CURLOPT_FOLLOWLOCATION=>false,
            CURLOPT_SSL_VERIFYPEER=>true,
            CURLOPT_SSL_VERIFYHOST=>2,
            CURLOPT_HTTPHEADER=>array('Content-Type: application/x-www-form-urlencoded')
        );
        if($ca_bundle !== false && $ca_bundle !== ''){
            $options[CURLOPT_CAINFO] = $ca_bundle;
        }
        curl_setopt_array($curl, $options);
        $content = curl_exec($curl);
        curl_close($curl);
        if($content !== false){
            return $content;
        }
    }
    return false;
}

function redact_sensitive_crawler_params($value){
    if(!is_array($value)){
        return $value;
    }
    $redacted = array();
    foreach($value as $key=>$item){
        if(is_string($key)
            && preg_match('/authorization|cookie|passwd|password|token|secret|api_?key|private_?key/i', $key)){
            $redacted[$key] = '[redacted]';
        }else{
            $redacted[$key] = redact_sensitive_crawler_params($item);
        }
    }
    return $redacted;
}

function request_and_data_save($request_params, $account_id=0){
    global $op, $request_start_time;
    $machine = resolve_crawler_machine($request_params);
    if($machine === false){
        return array('success'=>false, 'message'=>'invalid crawler machine');
    }

    unset($request_params['machine_id'], $request_params['machine_ip']);
    $request_params['op'] = $op;
    $identity = isset($request_params['fid'])? $request_params['fid'] : null;
    $url = $machine['origin'].'/crawler_service/'.rawurlencode($op);
    $content = crawler_http_post(
        $url,
        array('params'=>base64_encode(to_json($request_params))),
        true
    );
    if($content === false){
        return array('success'=>false, 'message'=>'crawler request failed');
    }

    $storage_params = redact_sensitive_crawler_params($request_params);
    $storage = new CrawlerStorage(
        $account_id,
        $op,
        $url,
        $storage_params,
        $machine['id'],
        $request_start_time,
        $identity
    );
    return $storage->processCrawlerResponse($content);
}


function request_crawler_machine($request_params, $params, $site_id=9){
    global $op, $nologin_ops_arr;
    $account_id = isset($params['account_id'])? $params['account_id'] : 0;
    if(!in_array($op, $nologin_ops_arr) && !isset($params['reply_no_login'])){
        if(isset($params['cookie_encode'])){
            $cookie = format_cookie_from_base64($params['cookie_encode']);
            //$request_params['tor_port'] = '9050';
            $request_params['tor_browser_switch'] = false;
        }elseif(isset($params['cookie']) && !empty($params['cookie'])){
            $cookie = $params['cookie'];
        }else{
            $account_id = 0;
            if(isset($params['account_id'])){
                $account_id = $params['account_id'];
            }
            $account_info = get_crawler_account_type_b($site_id, $account_id, $params);
            if(!$account_info){
                $log = "\n\nop:" . $op . "\n\nreturn: not enough crawler account";
                saveDebugLog($log);
                $response = array('success'=> false, 'message'=>'not enough crawler account');
                return $response;
            }else{
                if($account_info['bind_ip_str']
                    && (!isset($params['machine_ip']) || $params['machine_ip']!=$account_info['bind_ip_str'])){
                    $log = "\n\nop:" . $op . "\n\nreturn: account is bound to another machine";
                    saveDebugLog($log);
                    //$response = array('success'=> false, 'message'=>'the account bind machine');
                    //return $response;
                    $params['machine_ip'] = $account_info['bind_ip_str'];
                }
                $account_id = $account_info['account_id'];
                $cookie = $account_info['cookie'];
                $cookie_file_format = $account_info['cookie_file_format'];
                $tor_port = $account_info['tor_port'];
                if($account_info['token'] && !isset($params['token'])){
                    $params['token'] = $account_info['token'];
                }
                $params['account_id'] = $account_id;
            }
        }
        $request_params['cookie'] = $cookie;
        if(isset($cookie_file_format) && $cookie_file_format){
            $request_params['cookie_file_format'] = $cookie_file_format;
        }
        if(isset($tor_port) && $tor_port){
            $request_params['tor_browser_switch'] = true;
            $request_params['tor_port'] = $tor_port;
        }
    }
    $request_params = array_merge($request_params, $params);
    // The authenticated endpoint operation is authoritative; caller data cannot override it.
    $request_params['op'] = $op;
    return request_and_data_save($request_params, $account_id);
}

function facebook_crawler_api2(){
    global $op;
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    return request_crawler_machine(array(), $params);
}

function f_test_connect(){
    echo "success";die;
}

function f_test(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!is_array($params)){
        $params = array();
    }
    return request_and_data_save($params);
}

function f_check_out_tw_result(){
    global $task_table;
    if(!isset($_REQUEST['phone']) || !isset($_REQUEST['has'])){
        return array('success'=>false, 'error'=>'phone or has is empty');
    }
    $time = date('Y-m-d H:i:s');
    $phone = trim(urlencode($_REQUEST['phone']));
    $params = array(
        'task_id' => 0,
        'site_id' => 10,
        'keyword' => $phone,
        'has_fb' => trim($_REQUEST['has']),
        'name' => isset($_REQUEST['name']) ? trim($_REQUEST['name']) : '',
        'url' => isset($_REQUEST['url']) ? base64_decode($_REQUEST['url']) : '',
        'img_url' => isset($_REQUEST['img_url']) ? base64_decode($_REQUEST['img_url']) : '',
        'update_time' => $time,
        'exec_status' => 's',
    );
    try{
        db_update($task_table)->fields(array('is_check_tw'=>'y','update_time' => $time,))->condition('site_id',9)->condition('is_check_tw','n')->condition('keyword',$phone)->execute();
        $res = db_select($task_table, 's')->fields('s',array('id'))->condition('site_id',10)->condition('keyword',$phone)->execute()->fetchAssoc();
        if($res){
            $id = db_update($task_table)->fields($params)->condition('site_id',10)->condition('keyword',$phone)->execute();
            if(isset($id) && !empty($id)){
                file_put_contents('/tmp/f_check_out_tw_result.log', 'update:'.$res['id']."\n\n", FILE_APPEND);
            }
        }else{
            $id = db_insert($task_table)->fields($params)->execute();
            if(isset($id) && !empty($id) && $task_table == 'search_accounts_info'){
                $insertConfig = array(
                    'user_id' => 1,
                    'search_id' => $id,
                    'is_complete' => 'p',
                    'add_time' => $time,
                );
                db_insert('tb_search_accounts_config')->fields($insertConfig)->execute();
                file_put_contents('/tmp/f_check_out_tw_result.log', 'success:'.$id."\n\n", FILE_APPEND);
            }
        }
        return array('success'=>true);
    }catch (Exception $e){
        $log = "params:" . to_json($_REQUEST).'---> error:'.to_json($e);
        file_put_contents('/tmp/f_check_out_tw_result.log', $log."\n\n", FILE_APPEND);
        return array('success'=>false);
    }
}

function f_check_out_fb_result(){
    global $task_table;
    if(!isset($_REQUEST['phone'])){
        return array('success'=>false, 'error'=>'phone or has is empty');
    }
    $time = date('Y-m-d H:i:s');
    $phone = trim(urlencode($_REQUEST['phone']));
    $fb_id = isset($_REQUEST['fid']) ? $_REQUEST['fid'] : null;
    $fb_id = trim($fb_id);
    $url = $fb_id ? 'https://www.facebook.com/' . $fb_id : null;
    $name = '';
    if(isset($_REQUEST['name']) && $_REQUEST['name']){
        $name = filterEmoji($_REQUEST['name']);
        $name = mb_substr($name, 0, 100);
    }
    $params = array(
        'keyword'=> $phone,
        'fb_id'=> $fb_id,
        'url'=> $url,
        'name'=> $name,
        'img_url'=> isset($_REQUEST['img_url']) ? base64_decode($_REQUEST['img_url']) : '',
        'update_time' => $time,
        'fb_id_exec_status'=> 's',
    );
    if(isset($_REQUEST['current_city']) && $_REQUEST['current_city']){
        $params['city'] = trim($_REQUEST['current_city']);
    }
    try{
        $res = db_select($task_table, 's')->fields('s',array('id'))->condition('site_id',9)->condition('keyword',$phone)->execute()->fetchAssoc();
        if($res){
            db_update($task_table)->fields($params)->condition('site_id',9)->condition('keyword',$phone)->execute();
        }else{
            $params['task_id'] = 0;
            $params['site_id'] = 9;
            $id = db_insert($task_table)->fields($params)->execute();
            if(isset($id) && !empty($id) && $task_table == 'search_accounts_info'){
                $insertConfig = array(
                    'user_id' => 1,
                    'search_id' => $id,
                    'is_complete' => 'p',
                    'add_time' => $time,
                );
                db_insert('tb_search_accounts_config')->fields($insertConfig)->execute();
                file_put_contents('/tmp/f_check_out_tw_result.log', 'success:'.$id."\n\n", FILE_APPEND);
            }
        }
        return array('success'=>true);
    }catch (Exception $e){
        $log = date('Y-m-d H:i:s', time())."\r\n params:" . to_json($_REQUEST).'---> error:'.to_json($e);
        file_put_contents('/tmp/f_check_out_tw_result.log', $log."\n\n", FILE_APPEND);
        return array('success'=>false);
    }
}

function f_check_out_get_tw_name_result(){
    global $task_table;
    if(!isset($_REQUEST['name']) || !isset($_REQUEST['has'])){
        return array('success'=>false, 'error'=>'name or has is empty');
    }
    $time = date('Y-m-d H:i:s');
    $name = $_REQUEST['name'];
    $params = array(
        'task_id' => 0,
        'site_id' => 10,
        'keyword' => $name,
        'has_fb' => $_REQUEST['has'],
        'name' => $name,
        'update_time' => $time,
        'exec_status' => 's',
    );
    if(isset($_REQUEST['search_phone']) && $_REQUEST['search_phone']){
        $params['search_phone'] = $_REQUEST['search_phone'];
    }
    if(isset($_REQUEST['search_email']) && $_REQUEST['search_email']){
        $params['search_email'] = $_REQUEST['search_email'];
    }
    try{
        $res = db_select($task_table, 's')->fields('s',array('id'))->condition('site_id',10)->condition('keyword',$name)->execute()->fetchAssoc();
        if($res){
            $id = db_update($task_table)->fields($params)->condition('site_id',10)->condition('keyword',$name)->execute();
            if(isset($id) && !empty($id)){
                file_put_contents('/tmp/f_check_out_tw_result.log', 'update:'.$res['id']."\n\n", FILE_APPEND);
            }
        }else{
            $id = db_insert($task_table)->fields($params)->execute();
            if(isset($id) && !empty($id) && $task_table == 'search_accounts_info'){
                $insertConfig = array(
                    'user_id' => 1,
                    'search_id' => $id,
                    'is_complete' => 'p',
                    'add_time' => $time,
                );
                db_insert('tb_search_accounts_config')->fields($insertConfig)->execute();
                file_put_contents('/tmp/f_check_out_tw_result.log', 'success:'.$id."\n\n", FILE_APPEND);
            }
        }
        return array('success'=>true);
    }catch (Exception $e){
        $log = "params:" . to_json($_REQUEST).'---> error:'.to_json($e);
        file_put_contents('/tmp/f_check_out_tw_result.log', $log."\n\n", FILE_APPEND);
        return array('success'=>false);
    }
}

function f_check_out_get_tw_name(){
    global $task_table;
    $from_id = 0;
    $size = 10;
    if(isset($_REQUEST['max_id'])){
        $from_id = intval(trim($_REQUEST['max_id']));
    }
    if(isset($_REQUEST['size'])){
        $size = intval(trim($_REQUEST['size']));
    }
    if(!$from_id){
        $from_id = 0;
    }
    if(!$size){
        $size = 10;
    }
    $names = array();
    $max_id = 0;
    $query = db_select($task_table, 's')->fields('s', array('id', 'keyword'));
    $query->condition('site_id', 10)->condition('exec_status', 'n');
    $query->condition('id', $from_id, '>')->condition('keyword_type', 'name');
    $query->orderBy('id', 'asc')->range(0, $size);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $names[] = $row['keyword'];
        $max_id = $row['id'];
    }
    return array('success'=>true, 'data'=>array('names'=>$names, 'max_id'=>$max_id, 'from_id'=>$from_id));
}

function f_check_out_get_tw_phone(){
    global $task_table;
    $from_id = 0;
    $size = 10;
    if(isset($_REQUEST['max_id'])){
        $from_id = intval(trim($_REQUEST['max_id']));
    }
    if(isset($_REQUEST['size'])){
        $size = intval(trim($_REQUEST['size']));
    }
    if(!$from_id){
        $from_id = 8498116;
    }
    if(!$size){
        $size = 10;
    }
    $phones = array();
    $max_id = 0;
    $query = db_select('search_accounts_info', 's')->fields('s', array('id', 'keyword'));
    $query->condition('id', $from_id, '>');
    $query->condition('site_id', 9)->condition('is_check_tw', 'n')->condition('province', '香港');
    //$query_and_10 = db_and()->condition('site_id', 10)->condition('exec_status', 'n')->condition('province', '香港');
    //$query_or = db_or()->condition($query_and_9)->condition($query_and_10);
    //$query->condition($query_or);
    //$query = db_select($task_table, 's')->fields('s', array('id', 'keyword'));
    //$query_and_9 = db_and()->condition('site_id', 9)->condition('has_fb', 'y')->condition('is_check_tw', 'n');
    //$query_and_9 = db_and()->condition('site_id', 9)->condition('province', '广东')->condition('is_check_tw', 'n');
    //$query_and_10 = db_and()->condition('site_id', 10)->condition('exec_status', 'n');
    //$query_or = db_or()->condition($query_and_9)->condition($query_and_10);
    //$query->condition($query_or);
    /**
    $query->condition('site_id', 10)->condition('exec_status', 'n')->condition('keyword', '60%', 'like');
    $query->condition('id', $from_id, '>')->condition('keyword', '^(\\+)?[0-9]{5,}$', 'REGEXP');
    **/
    $query->orderBy('id', 'asc')->range(0, $size);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $phones[] = $row['keyword'];
        $max_id = $row['id'];
    }
    return array('success'=>true, 'data'=>array('phones'=>$phones, 'max_id'=>$max_id, 'from_id'=>$from_id));
}
function f_check_out_get_tw_phone_gd(){
    $from_id = 0;
    $size = 10;
    if(isset($_REQUEST['max_id'])){
        $from_id = intval(trim($_REQUEST['max_id']));
    }
    if(isset($_REQUEST['size'])){
        $size = intval(trim($_REQUEST['size']));
    }
    if(!$from_id){
        $from_id = 0;
    }
    if(!$size){
        $size = 10;
    }
    $phones = array();
    $max_id = 0;
    $query = db_select('search_accounts_info', 's')->fields('s', array('id', 'keyword'));
    $query->condition('site_id', 9)->condition('id', $from_id, '>')->condition('has_fb', 'y')->condition('province', 'guangdong');
    $query->orderBy('id', 'asc')->range(0, $size);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $phones[] = $row['keyword'];
        $max_id = $row['id'];
    }
    return array('success'=>true, 'data'=>array('phones'=>$phones, 'max_id'=>$max_id, 'from_id'=>$from_id));
}

function parse_checkout_request_params(){
    if(!isset($_REQUEST['params']) || !is_string($_REQUEST['params'])){
        return false;
    }
    $decoded = base64_decode($_REQUEST['params'], true);
    $params = $decoded === false? false : json_from_string($decoded);
    if(!is_array($params)){
        $params = json_from_string($_REQUEST['params']);
    }
    return is_array($params)? $params : false;
}

function f_twitter_check_out(){
    $params = parse_checkout_request_params();
    if(!$params || !isset($params['keyword']) || !$params['keyword']){
        return array('success'=>false, 'message'=>'invalid request parameters');
    }
    if(!has_crawler_machine_selector($params)){
        return array('success'=>false, 'message'=>'invalid crawler machine');
    }
    return request_and_data_save($params);
}

function f_twitter_check_out_py(){
    $params = parse_checkout_request_params();
    if(!$params || !isset($params['keyword']) || !$params['keyword']){
        return array('success'=>false, 'message'=>'invalid request parameters');
    }
    if(!has_crawler_machine_selector($params)){
        return array('success'=>false, 'message'=>'invalid crawler machine');
    }
    return request_and_data_save($params);
}

function f_facebook_check_out(){
    $params = parse_checkout_request_params();
    if(!$params
        || !isset($params['keyword'])
        || !isset($params['test_keyword'])){
        return array('success'=>false, 'message'=>'invalid request parameters');
    }
    if(!has_crawler_machine_selector($params)){
        return array('success'=>false, 'message'=>'invalid crawler machine');
    }
    return request_and_data_save($params);
}

function f_facebook_check_out_proxy(){
    $params = parse_checkout_request_params();
    if(!$params
        || !isset($params['keyword'])
        || !isset($params['test_keyword'])
        || !isset($params['proxy_ip'])
        || !$params['proxy_ip']
        || !isset($params['proxy_port'])
        || !$params['proxy_port']){
        return array('success'=>false, 'message'=>'invalid request parameters');
    }
    if(!has_crawler_machine_selector($params)){
        return array('success'=>false, 'message'=>'invalid crawler machine');
    }
    return request_and_data_save($params);
}

function f_facebook_check_out_fid(){
    global $op;
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['phone']) || !isset($params['token'])){
        return array('success'=>false, 'message'=>'the params not found phone or token');
    }
    $request_params = array('phone'=> $params['phone']);
    return request_crawler_machine($request_params, $params, 9);
}

function f_fb_group_share_post_by_api(){
    global $op;
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['group_id'])  || !isset($params['post_id'])){
        return array('success'=>false, 'message'=>'the params not found group_id or post_id');
    }
    $request_params = array('group_id'=> $params['group_id'],'post_id'=> $params['post_id']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_task_post_by_api(){
    global $op;
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid'])  || !isset($params['start_time'])){
        return array('success'=>false, 'message'=>'the params not found fid or start_time');
    }
    $request_params = array('fid'=> $params['fid'],'start_time'=> $params['start_time']);
    return request_crawler_machine($request_params, $params);
}

function f_twitter_account_info(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=>false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    return request_crawler_machine($request_params, $params, 10);
}

function f_twitter_single_post(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url, center');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    return request_crawler_machine($request_params, $params, 10);
}

function f_twitter_post_list(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=>false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    return request_crawler_machine($request_params, $params, 10);
}

function f_twitter_account_info_by_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if (!isset($params['screen_name']) || !$params['screen_name']) {
        $response = array('success' => false, 'message' => 'the params not found screen_name');
        return $response;
    }
    $request_params = array('screen_name' => $params['screen_name']);
    return request_crawler_machine($request_params, $params, 10);
}

function f_twitter_post_list_by_api()
{
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if (!isset($params['screen_name']) || !$params['screen_name']) {
        $response = array('success' => false, 'message' => 'the params not found screen_name');
        return $response;
    }
    $request_params = array('screen_name' => $params['screen_name']);
    return request_crawler_machine($request_params, $params, 10);
}

function f_twitter_post_list_by_search()
{
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if (!isset($params['screen_name']) || !$params['screen_name']) {
        $response = array('success' => false, 'message' => 'the params not found screen_name');
        return $response;
    }
    $request_params = array('screen_name' => $params['screen_name']);
    return request_crawler_machine($request_params, $params, 10);
}

function f_twitter_followers(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if (!isset($params['url']) || !$params['url']) {
        $response = array('success' => false, 'message' => 'the params not found url');
        return $response;
    }
    $request_params = array('url' => $params['url']);
    return request_crawler_machine($request_params, $params, 10);
}

function f_facebook_login(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['regist_account']) || !$params['password'] || !$params['account_id']){
        $response = array('success'=> false, 'message'=>'the params not found regist_account or password or account id');
        return $response;
    }
    return request_and_data_save($params, $params['account_id']);
}

function f_facebook_account_basic(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_account_info(){
    return;
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_fid_by_url(){
    $params = json_from_string(urldecode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        return array('success'=>false, 'message'=>'the params not found url');
    }

    $request_params = array('url'=>$params['url'], 'op'=>'facebook_fid_by_url');
    if(isset($params['machine_id'])){
        $request_params['machine_id'] = $params['machine_id'];
    }elseif(isset($params['machine_ip'])){
        $request_params['machine_ip'] = $params['machine_ip'];
    }
    return request_and_data_save($request_params);
}

function f_facebook_account_info_by_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found fid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_page_info_by_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found fid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_page_info_add(){
    // add  followers_count create_time
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) && !isset($params['url'])){
        $response = array('success'=> false, 'message'=>'the params not found fid or url');
        return $response;
    }
    if(isset($params['fid']) && $params['fid'] && !isset($params['url'])){
        $params['url'] = null;
    }elseif(isset($params['url']) && $params['url'] && !isset($params['fid'])){
        $params['fid'] = null;
    }
    return request_and_data_save($params);
}

function f_facebook_single_post(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found fid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_post_interactive(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    $data = request_crawler_machine($request_params, $params);
    if(isset($data['data']) && isset($data['data']['post']) && isset($data['data']['post'][0]['iid'])){
        $iid = (string)$data['data']['post'][0]['iid'];
        if(!preg_match('/\A[0-9]{1,32}\z/D', $iid)){
            return array('success'=>false, 'message'=>'invalid post identifier');
        }
        $output = shell_exec('sudo python3 /root/hsx/python/post_page_screenshot.py ' . escapeshellarg($iid));
        $output = trim($output);
        $data['data']['post'][0]['screenshot'] = $output;
        $cmd = "sudo rsync -vzrtopgu /apps/robot/data/post_analysis_images/ root@172.16.1.3:/apps/robot/data/post_analysis_images/";
        shell_exec($cmd);
    }
    return $data;
}

function f_facebook_single_post_by_url(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url, center');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_single_post_by_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found iid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_get_account_and_friends_count(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_post_list(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url center');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_group_user_post(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['group_fid']) || !isset($params['user_fid'])){
        $response = array('success'=> false, 'message'=>'the params not found group_fid or user_fid center');
        return $response;
    }
    $request_params = array();
    return request_crawler_machine($request_params, $params);
}

function f_facebook_post_list_nologin(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url center');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_event_post_list(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found fid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_group(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array('url'=> $params['url']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_post_reply(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found iid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_post_forward(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found iid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_post_praise(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found fid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_vote_by_post(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if ((!isset($params['fid']) || !$params['fid']) && ((!isset($params['url']) || !$params['url']))){
        return array('success'=>false, 'message'=>'the params not found fid or url');
    }
    if(isset($params['url']) && $params['url']){
        $params['vote_status'] =true;
        $params['fid'] =null;
    }else{
        $params['url'] ="https://www.facebook.com/" . $params['fid'];
        $params['vote_status'] =false;
    }
    $request_params = array('fid'=> $params['fid'],'url'=> $params['url'],$params['vote_status']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_post_lists_storage()
{
    //echo to_json($_FILES)."\n";die("die");
    $content=file_get_contents($_FILES['params']['tmp_name']);
    $params = json_from_string(base64_decode($content));var_dump(array_keys($params));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if (!isset($params['params']) || !isset($params['info']) || !isset($params['identity'])) {
        return array('success' => false, 'message' => 'the params not found params or info or identity');
    }
    $arr_content = json_decode($params['info'],true);
    //print_r("post_count>>>" . count($arr_content['data']['post']));
    //return $params;
    $storage = new CrawlerStorage(0, 'facebook_post_lists_storage', null, $params['params'], $params['machine_ip'], $params['request_start_time'], $params['identity']);
    return $storage->processCrawlerResponse($params['info']);
}

function f_facebook_group_members(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=>false, 'message'=>'the params not found fid');
        return $response;
    }

    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_group_newest_member(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=>false, 'message'=>'the params not found fid center');
        return $response;
    }

    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}


function f_facebook_user_friends(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found iid');
        return $response;
    }

    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}
function f_facebook_user_friends_by_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found iid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_user_followers(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found iid');
        return $response;
    }

    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_user_following(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $request_params = array();
    return request_crawler_machine($request_params, $params);
}

function f_facebook_keyword_stories(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['keyword']) || !$params['keyword']){
        $response = array('success'=> false, 'message'=>'the params not found keyword');
        return $response;
    }
    $request_params = array('keyword'=> $params['keyword']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_search_group(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['keyword']) || !$params['keyword']){
        $response = array('success'=> false, 'message'=>'the params not found keyword');
        return $response;
    }
    //$account_info= get_one_account_token();
    //$params['token'] = $account_info['token'];
    //$params['account_id'] = $account_info['account_id'];
    //$request_params = array('keyword'=> $params['keyword'],'token'=>$params['token']);
    $request_params = array('keyword'=> $params['keyword']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_search_members_in_group(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['keyword']) || !$params['keyword']){
        $response = array('success'=> false, 'message'=>'the params not found keyword');
        return $response;
    }
    foreach ($params['keyword'] as $value ){
        if (!$value['group_id'] && !$value['account_name']){
            $response = array('success'=> false, 'message'=>'the keyword not found group_id or account_name');
            return $response;
        }
    }
    $request_params = array('keyword'=> $params['keyword']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_search_members_in_group_v2(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['keyword']) || !$params['keyword']){
        $response = array('success'=> false, 'message'=>'the params not found keyword');
        return $response;
    }
    foreach ($params['keyword'] as $value ){
        if (!$value['group_id'] && !$value['account_name']){
            $response = array('success'=> false, 'message'=>'the keyword not found group_id or account_name');
            return $response;
        }
    }
    $request_params = array('keyword'=> $params['keyword']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_group_by_page(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array();
    return request_crawler_machine($request_params, $params);
}

function get_one_account_token(){
    $account_info =array();
    $fields = array('id','operation_time','operation_interval','operation_count_24h','access_token');
    $query = db_select('tb_crawler_account','a') ->fields('a',$fields);
    $res=$query->condition('account_type','token')->condition('is_active', 1)->orderBy('operation_time', 'desc')->range(0,1)->execute()->fetchAssoc();
    $account_info['account_id']  = $res['id'];
    $account_info['token']  = $res['access_token'];
    return $account_info;
}

function f_facebook_likes_page_by_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found fid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_groups_list(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found fid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_keyword_search(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['keyword']) || !$params['keyword']){
        $response = array('success'=> false, 'message'=>'the params not found keyword, center');
        return $response;
    }
    $request_params = array('keyword'=> $params['keyword']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_search_group_post(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['keyword']) || !$params['keyword'] || !isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found keyword or fid');
        return $response;
    }
    $request_params = array('keyword'=> $params['keyword'],'fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_page(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    return request_crawler_machine(array(), $params);
}

function f_facebook_follow_user(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success'=> false, 'message'=>'the params not found fid');
        return $response;
    }
    $request_params = array('fid'=> $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_page_members(){
    /** Get public homepage members */
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) && !isset($params['cookie'])){
        $response = array('success'=> false, 'message'=>'the params not found fid and cookie');
        return $response;
    }
    $request_params = array(
        'fid'=> $params['fid'],
        'cookie'=> $params['cookie']
    );
    return request_crawler_machine($request_params, $params);
}

function f_facebook_insights_data(){
    /** Get public homepage insights data  */
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    $params['db_page_iid_list'] = array();
    if (!isset($params['cookie'])) {
        $response = array('success' => false, 'message' => 'the params not found cookie');
        return $response;
    }
    $request_params = array(
        'db_page_iid_list' => $params['db_page_iid_list'],
        'cookie' => $params['cookie'],
    );
    return request_crawler_machine($request_params, $params);
}

function f_fb_admin_insights_data(){
    /** Get public homepage insights data  */
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || (!isset($params['cookie']) && !isset($params['cookie_encode']))){
        return array('success'=>false, 'message'=>'center the params not found fid and cookie');
    }
    if(isset($params['cookie_encode']) && !isset($params['cookie'])){
        $params['cookie'] = format_cookie_from_base64($params['cookie_encode']);
    }
    $account_id = 0;
    if(isset($params['account_id'])){
        $account_id = $params['account_id'];
    }
    return request_and_data_save($params,$account_id);
}

function f_fb_admin_post_insights_data(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || (!isset($params['cookie']) && !isset($params['cookie_encode']))){
        return array('success'=>false, 'message'=>'center the params not found fid or cookie');
    }
    if(isset($params['cookie_encode']) && !isset($params['cookie'])){
        $params['cookie'] = format_cookie_from_base64($params['cookie_encode']);
    }
    $account_id = 0;
    if(isset($params['account_id'])){
        $account_id = $params['account_id'];
    }
    return request_and_data_save($params,$account_id);
}

function f_facebook_admin_insights_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if (!isset($params['fid']) && !isset($params['token'])) {
        return array('success'=>false, 'message'=>'the params not found fid or token');
    }
    return request_and_data_save($params);
}

function f_facebook_auth(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['regist_account']) || !isset($params['password'])){
        $response = array('success'=>false, 'message'=>'the params not found account or password');
        return $response;
    }
    $account_id = 0;
    if(isset($params['account_id'])){
        $account_id = $params['account_id'];
    }
    return request_and_data_save($params, $account_id);
}

function f_facebook_groups_list_by_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if (!isset($params['fid']) || !$params['fid']) {
        $response = array('success' => false, 'message' => 'the params not found fid');
        return $response;
    }
    $request_params = array('fid' => $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_post_list_by_api()
{
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    //$params['machine_ip'] ="150.109.48.131";
    if (!isset($params['fid']) || !$params['fid']) {
        $response = array('success' => false, 'message' => 'the params not found fid');
        return $response;
    }
    $request_params = array('fid' => $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_event_info_by_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if (!isset($params['fid']) || !$params['fid']) {
        $response = array('success' => false, 'message' => 'the params not found fid');
        return $response;
    }
    $request_params = array('fid' => $params['fid'], 'token' => $params['token']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_post_reply_by_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if (!isset($params['fid']) || !$params['fid']) {
        $response = array('success' => false, 'message' => 'the params not found fid center');
        return $response;
    }
    if(!isset($params['user_id']) || !$params['user_id']){
        $params['user_id'] = '';
    }
    $request_params = array('user_id' => $params['user_id'], 'fid' => $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_facebook_post_forward_by_api(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fid']) || !$params['fid']){
        $response = array('success' => false, 'message' => 'the params not found fid center');
        return $response;
    }
    if(!isset($params['user_id']) || !$params['user_id']){
        $params['user_id'] = '';
    }
    $request_params = array('user_id' => $params['user_id'], 'fid' => $params['fid']);
    return request_crawler_machine($request_params, $params);
}

function f_fb_poll_post_info(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if (!$params) {
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['url']) || !$params['url']){
        $response = array('success' => false, 'message' => 'the params not found poll post url center');
        return $response;
    }
    $request_params = array();
    return request_crawler_machine($request_params, $params);
}

function f_fb_user_friends_by_hovercard(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['fids']) || !$params['fids']){
        $response = array('success'=> false, 'message'=> 'the params not found fids');
        return $response;
    }
    $request_params = array();
    return request_crawler_machine($request_params, $params);
}

function f_fb_check_emails(){
    return array('success'=>false, 'message'=>'operation disabled');
}

function f_fb_page_role_search_email(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['emails']) || !$params['emails']){
        $response = array('success'=> false, 'message'=> 'the params not found emails');
        return $response;
    }
    if(!isset($params['page_url']) || !$params['page_url']){
        $response = array('success'=> false, 'message'=> 'the params not found page_url');
        return $response;
    }
    $request_params = array();
    return request_crawler_machine($request_params, $params);
}

function f_proxies_ip()
{
    $params=array('machine_ip' => "150.109.48.131");
    $request_params = array();
    return request_crawler_machine($request_params, $params);
}


//news
function f_sina_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "sina_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
    /*if(isset($info['data'])){
        if(!isset($info['data']['post_info'])){
            return array('success'=>false, 'error'=>'not crawler news info');
        }
        $post_info = $info['data']['post_info'];
        $storage = new NewsStorage();
        $storage->saveSinaNews($post_info);
        if(isset($info['data']['reply'])){
            $storage->saveSinaNewsReply($info['data']['reply'], $post_info['iid']);
        }
    }else{
        return $info;
    }
    return array('success'=>true, 'debug'=>array('url'=>$url));*/
}

function f_163_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "163_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
    /*if(isset($info['data'])){
        if(!isset($info['data']['post_info'])){
            return array('success'=>false, 'error'=>'not crawler news info');
        }
        $post_info = $info['data']['post_info'];
        $storage = new NewsStorage();
        $storage->save163News($post_info);
        if(isset($info['data']['reply'])){
            $storage->save163NewsReply($info['data']['reply'], $post_info['iid']);
        }
    }else{
        return $info;
    }
    return array('success'=>true, 'debug'=>array('url'=>$url));*/
}

function f_qq_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "qq_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
    /*if(isset($info['data'])){
        if(!isset($info['data']['post_info'])){
            return array('success'=>false, 'error'=>'not crawler news info');
        }
        $post_info = $info['data']['post_info'];
        $storage = new NewsStorage();
        $storage->saveQQNews($post_info);
        if(isset($info['data']['reply'])){
            $storage->saveQQNewsReply($info['data']['reply'], $post_info['iid']);
        }
    }else{
        return $info;
    }
    return array('success'=>true, 'debug'=>array('url'=>$url));*/
}

function f_sohu_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "sohu_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
    /*if(isset($info['data'])){
        if(!isset($info['data']['post_info'])){
            return array('success'=>false, 'error'=>'not crawler news info');
        }
        $post_info = $info['data']['post_info'];
        $storage = new NewsStorage();
        $storage->saveSohuNews($post_info);
        if(isset($info['data']['reply'])){
            $storage->saveSohuNewsReply($info['data']['reply'], $post_info['iid']);
        }
    }else{
        return $info;
    }
    return array('success'=>true, 'debug'=>array('url'=>$url));*/
}

function f_ifeng_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "ifeng_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
    /*if(isset($info['data'])){
        if(!isset($info['data']['post_info'])){
            return array('success'=>false, 'error'=>'not crawler news info');
        }
        $post_info = $info['data']['post_info'];
        $storage = new NewsStorage();
        $storage->saveIfengNews($post_info);
        if(isset($info['data']['reply'])){
            $storage->saveIfengNewsReply($info['data']['reply'], $post_info['iid']);
        }
    }else{
        return $info;
    }
    return array('success'=>true, 'debug'=>array('url'=>$url));*/
}

function f_toutiao_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "toutiao_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
    /*if(isset($info['data'])){
        if(!isset($info['data']['post_info'])){
            return array('success'=>false, 'error'=>'not crawler news info');
        }
        $post_info = $info['data']['post_info'];
        $storage = new NewsStorage();
        $storage->saveTouTiaoNews($post_info);
        if(isset($info['data']['reply'])){
            $storage->saveTouTiaoNewsReply($info['data']['reply'], $post_info['iid']);
        }
    }else{
        return $info;
    }
    return array('success'=>true, 'debug'=>array('url'=>$url));*/
}

function f_thepaper_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "thepaper_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
    /*if(isset($info['data'])){
        if(!isset($info['data']['post_info'])){
            return array('success'=>false, 'error'=>'not crawler news info');
        }
        $post_info = $info['data']['post_info'];
        $storage = new NewsStorage();
        $storage->saveTouThepaperNews($post_info);
        if(isset($info['data']['reply'])){
            $storage->saveThepaperNewsReply($info['data']['reply'], $post_info['iid']);
        }
    }else{
        return $info;
    }
    return array('success'=>true, 'debug'=>array('url'=>$url));*/
}

function f_xinhuanet_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "xinhuanet_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
}

function f_huanqiu_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "huanqiu_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
}

function f_yidianzixun_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "yidianzixun_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
}

function f_wechat_subscription(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "wechat_subscription?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
   /*
   if(isset($info['data'])){
        if(!isset($info['data']['post_info'])){
            return array('success'=>false, 'error'=>'not crawler news info');
        }
        $post_info = $info['data']['post_info'];
        $storage = new NewsStorage();
        $storage->saveWechatSubscriptionNews($post_info);
    }else{
        return $info;
    }
    return array('success'=>true, 'debug'=>array('url'=>$url));
   */
}

function f_app_sohu_news(){
    require_once(PP_INC_ROOT . '/storageCrawler/NewsStorage.class.php');
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!isset($params['url']) || !$params['url']){
        $response = array('success'=> false, 'message'=>'the params not found url');
        return $response;
    }
    $request_params = array(
        'url'=> $params['url']
    );
    $base_url = "http://150.109.120.225/crawler_service/";
    $url = $base_url . "app_sohu_news?params=".base64_encode(to_json($request_params));
    $cookie = '';
    $base_path = null;
    $content = curl_request_with_cookie($url, $cookie, '', $base_path);
    $info = json_from_string($content);
    return $info;
    /*if(isset($info['data'])){
        if(!isset($info['data']['post_info'])){
            return array('success'=>false, 'error'=>'not crawler news info');
        }
        $post_info = $info['data']['post_info'];
        $storage = new NewsStorage();
        $storage->saveAppSohuNews($post_info);
    }else{
        return $info;
    }
    return array('success'=>true, 'debug'=>array('url'=>$url));*/
}

//other
function f_phone_location(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['phone']) || !$params['phone']){
        $response = array('success'=> false, 'message'=>'the params not found phone');
        return $response;
    }
    $request_params = array('phone'=> $params['phone']);
    return request_crawler_machine($request_params, $params);
}

function f_crawler_image_by_url(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    if(!isset($params['image_url']) || !$params['image_url']){
        $response = array('success'=> false, 'message'=>'the params not found image_url');
        return $response;
    }
    return request_crawler_machine($params, $params);
}
function get_ip(){
    if(!empty($_SERVER["HTTP_CLIENT_IP"])){
        $cip = $_SERVER["HTTP_CLIENT_IP"];
    }elseif(!empty($_SERVER["HTTP_X_FORWARDED_FOR"])){
        $cip = $_SERVER["HTTP_X_FORWARDED_FOR"];
    }elseif(!empty($_SERVER["REMOTE_ADDR"])){
        $cip = $_SERVER["REMOTE_ADDR"];
    }else{
        $cip = 'unknow';
    }
    return $cip;
}
//SZ Crawler
function f_sz_crawl_fb_account(){
    global $es_hosts_params, $es_index_config;
    $es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_hosts_params)->build();
    $check_update_time = time() - 7*24*3600;
    $crawled_fids = array();
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $fids = $params['fids'];
    $es_params = array(
        'size'=> 1000000,
        'index'=> $es_index_config['mass_audience']['index'],
        'type'=> $es_index_config['mass_audience']['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('terms'=> array('user_iid'=> $fids)),
                        array('range'=> array('last_update_time'=> array('gte'=>$check_update_time)))
                    )
                )
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    foreach($results['data'] as $item){
        $crawled_fids[] = $item['user_iid'];
    }
    $data = $results['data'];
    $fids = array_diff($fids, $crawled_fids);
    foreach($fids as $fid){
        $account_info = db_select('tb_fb_account_crawler_task', 'c')->fields('c', array('id','status','update_time'))->condition('account_fid', $fid)->execute()->fetchAssoc();
        if($account_info){
            $item = array(
                'source_ip'=> get_ip(),
                'update_time'=> time()
            );
            if(($account_info['status'] == 's' && time()-$account_info['update_time']>30*24*3600) ||
                ($account_info['status']=='p' && time()-$account_info['update_time']>7*24*3600)){
                $item['status'] = 'r';
                db_update('tb_fb_account_crawler_task')->fields($item)->condition('account_fid', $fid)->execute();
            }
            //db_update('tb_fb_account_crawler_task')->fields($item)->condition('account_fid', $fid)->execute();
        }else{
            $item = array(
                'account_fid'=> $fid,
                'account_type'=> 'user',
                'project_name'=> get_value_from_array($params, 'project_name', null),
                'source_ip'=> get_ip(),
                'status'=> 'r',
                'insert_time'=> time(),
                'update_time'=> time()
            );
            db_insert('tb_fb_account_crawler_task')->fields($item)->execute();
        }
    }
    return $data;
}

function f_cp_crawler_target(){
    global $machine_ips_feeds;
    $ip = get_remote_client_address();
    $response = array('success'=>false, 'data'=>array());
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $site = isset($params['site'])? $params['site'] : '';
    $loc = isset($params['loc'])? $params['loc'] : '';
    $type = isset($params['type'])? $params['type'] : '';
    $check = isset($params['check'])? $params['check'] : false;
    $count = 1;
    $exec_id = isset($params['exec_id'])? $params['exec_id'] : '';
    if('blockchain' == $site){
        switch($type){
            case 'twitterBlock':
                $screenName = isset($params['fid'])? $params['fid'] : '';
                return process_twitter_account($screenName, $loc);
            break;
            case 'monitor':
                return process_monitor_single();
            break;
        }
        if($ip=='154.219.101.126'){
            $response = process_weibo($loc);
            if(!$response['success']){
                $response = process_twitter($loc, $ip);
            }
        }else{
            $response = process_twitter($loc, $ip);
        }
        if(!$response['success']){
            $response = crawl_panews($loc);
        }
    }elseif('monitor' == $site){
        $response = crawl_monitor($loc);
    }elseif('telegram' == $site){
        switch($type){
            case 'twitterBlock':
                $loc = isset($params['fid'])? $params['fid'] : '';
                return process_telegram_account($loc);
                break;
        }
        $response = process_telegram($loc);
    }
    $response['ip'] = $ip;
    return $response;
    /*
    if($site == 'facebook'){
        //crawler fb feeds post list
        $fid = isset($params['fid'])? $params['fid'] : '';
        switch($type){
            case 'feeds':
                if(!$fid){
                    return array('success'=>false, 'msg'=>'the params not found crawlerAccountFid');
                }
                $response = crawler_account_follow_target($fid, $ip);
                if(!$response['success'] || !$response['data']) {
                    $response = crawler_account_feeds($fid);
                }
                return $response;
            break;
            case 'fbGroup':
                return crawl_facebook_group_yy($check);
            break;
            case 'fbGroupDebug':
                return crawl_facebook_group_yy_debug();
            break;
            case 'twitter':
                return crawl_twitter_yy();
            break;

        }
        if($ip == '13.212.105.84'){ //vcman_aws_01
            //hb guid facebook single post
            $response = crawl_facebook_single_post($exec_id);
        }
        if(!$response['success'] || !$response['data']) {
            $response = crawl_group_permeation($count, $exec_id);
        }
        if(!$response['success'] || !$response['data']){
            //$response = crawl_monitor_target($count, $exec_id);
        }
        if(!$response['success'] || !$response['data']){
            $response = crawl_guid_account($count, $exec_id);
        }
    }elseif($site == 'instagram'){
        $response = crawl_monitor_ins_target($count, $exec_id);
    }elseif($site == 'uwants'){
        $loc = isset($params['loc'])? $params['loc'] : '';
        $response = process_uwants($loc, $check);
        if(!$response['success']){
            $response = process_discuss($loc, $check);
        }
        if(!$response['success']){
            $response = process_mewe($loc, $check);
        }
        if(!$response['success']){
            $response = process_telegram($loc, $check);
        }
        if(!$response['success']){
            $response = process_facebook($loc, $check);
        }
    }
    **/
}

function crawl_facebook_group_yy_debug(){
    //yjg friends list
    $account = db_select('tb_fb_account_yjg', 'a')->fields('a', array('id','fid', 'url'))
        ->condition('fid', '100026929080622')
        //->condition('crawl_available', 'y')->condition('last_update_time', 0)
        ->condition('last_crawl_time', time()-600, '<')
        ->orderBy('last_crawl_time')->execute()->fetchAssoc();
    if($account){
        db_update('tb_fb_account_yjg')->fields(array('last_crawl_time'=>time()))->condition('id', $account['id'])->execute();
        if($account['fid']){
            $data = array($account['fid']);
        }else{
            $data = array($account['url']);
        }
        return array('success'=>true, 'type'=>'fb_guid_account', 'data'=>$data);
    }
    return array('success'=>false);
}

function crawl_twitter_yy(){
    $check_time = time() - 12*3600;
    //tweet
    $tweet = db_select('tb_tw_tweet_crawler_list', 't')->fields('t', array('tweet_url', 'tweet_id'))->condition('last_crawl_time', $check_time, '<')->execute()->fetchAssoc();
    if($tweet){
        $data = array(
            'tweet_url'=> $tweet['tweet_url'],
            'tweet_id'=> $tweet['tweet_id']
        );
        return array('success'=>true, 'type'=>'tweet_info', 'data'=>$data);
    }
    return array('success'=>false);
}

function f_cp_crawl_fb_account_target(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $type = isset($params['type'])? $params['type'] : '';
    //$count = isset($params['count'])? $params['count'] : 1;
    $count = 1;
    $exec_id = isset($params['exec_id'])? $params['exec_id'] : '';
    switch($type){
        case 'monitor_target':
            return crawl_monitor_target($count, $exec_id);
            break;
        case 'group_permeation':
            return crawl_group_permeation($count, $exec_id);
            break;
        case 'crawl_account':
            return crawl_account($params);
            break;
        case 'crawl_page':
            return crawl_page($params);
            break;
        case 'check_post_insights':
            return check_post_insights($params);
            break;
        case 'post_insights_screenshot':
            return post_insights_screenshot($params);
            break;
        case 'monitor_ins':
            return crawl_monitor_ins_target($count, $exec_id);
            break;
        default:
            return crawl_guid_account($count, $exec_id);
    }
}

function f_cp_crawl_fb_account_target_debug(){

    $data[] = array(
        'postURL'=> 'https://www.facebook.com/KBankPhnomPenhBranch/posts/pfbid0MGdDPmh2cYCeKapn5QE7sYeQtLeo3ev9kyngiEKHmMBTLMfDxybfV6JSN8D6gNT5l?comment_id=1382348929301492',
        'skipCrawlerShares'=> 'y',
        'skipCrawlerComments'=> 'y',
        'skipCrawlerPraises'=> 'y'
    );
    return array('success'=>true, 'type'=>'fb_single_post', 'data'=>$data);

    $ip = get_remote_client_address();
    $flag = uniqid();
    $update_item = array(
        'flag'=> $flag,
        'crawl_get_time'=> time(),
        'status'=> 'p',
        'source_ip'=> $ip
    );
    $query = db_select('tb_fb_account_urls_map', 'a')->fields('a', array('id', 'account_url'));
    $query->condition('status', 'p')->condition('available', 'y')->condition('account_fid', null, 'is');
    $query->orderRandom();
    $query->range(0, 20);
    $data = array();
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        try{
            $id = db_update('tb_fb_account_urls_map')->fields($update_item)->condition('id', $row['id'])->condition('status', 'p')->execute();
            if($id){
                $data[] = array(
                    'crawlerUrl'=> $row['account_url']
                );
                return array('success'=>true, 'type'=>'fb_account_url_map', 'data'=>$data);
            }
        }catch(Exception $e){}
    }
    return array();

    $data = array();
    $fids = array('110179609682471');
    foreach($fids as $fid){
        $data[$fid] = array(
            'ip'=> $ip,
            'skipCrawlGuidFb'=>'y',
            'skipCrawlMonitorFb'=>'n',
            'skipSearchKeyword'=> 'y',
            'skipCrawlMonitorFbFriends'=> 'y',
            'skipCrawlMonitorFbFollowing'=> 'y',
            'skipCrawlAlbum'=> 'y',
            'skipCrawlActivity'=> 'n',
            'skipTopFans'=> 'y',
            'monitorFbUrl'=>'https://www.facebook.com/'.$fid,
            'monitorFbPostsLoopCount'=> 1,
            'monitorFbFriendsLoopCount'=> 10,
            'monitorFbFollowingLoopCount'=> 10,
            'skipCrawlAbout'=> 'n'
            //'searchKeyword'=> '新冠 疫情'
        );
    }

    return array('success'=>true, 'data'=>array('100063689675446'));
    $data = array_values($data);
    $data = array(
        array('id'=> 90805, 'group_fid'=> '6044292845667286', 'account_fid'=> '100072957401678')
    );
    return array('success'=>true, 'type'=>'join_detect', 'data'=> $data);
    return array('success'=>true, 'data'=>$data);
}

function crawler_account_follow_target($fid, $machine_ip){
    global $machines_maps, $machine_ips_feeds;
    //return array('success'=>false);
    $restraint_configs = array(
        'post_count_avg'=> 300,
        'follow_count_limit_hour'=> 1,
        'follow_count_limit_day'=> 3,
        'max_follow_count'=> 50
    );
    $account_exists = db_select('tb_fb_crawler_accounts', 'a')->fields('a', array('id'))->condition('account_fid', $fid)->execute()->fetchAssoc();
    if(!$account_exists){
        $machine_loc = '';
        if(isset($machines_maps[$machine_ip])){
            $machine_loc = $machines_maps[$machine_ip];
        }
        $item = array(
            'account_fid'=> $fid,
            'source_ip'=> $machine_ip,
            'loc'=> $machine_loc,
            'insert_time'=> time(),
            'update_time'=> time()
        );
        db_insert('tb_fb_crawler_accounts')->fields($item)->execute();
    }
    $post_nums_arr = db_select('tb_fb_crawler_feeds_logs', 'l')->fields('l', array('crawl_feeds_post_num'))->condition('account_fid', $fid)->condition('crawl_feeds_post_num', 100, '>')->orderBy('id', 'desc')->range(0, 3)->execute()->fetchCol();
    if($post_nums_arr){
        $avg_num = ceil(array_sum($post_nums_arr) / count($post_nums_arr));
        if($avg_num > $restraint_configs['post_count_avg']){
            return array('success'=>false, 'data'=>array(), 'msg'=>'the average post num reach ' . $avg_num);
        }
    }
    $hour_count = db_select('tb_fb_crawler_follow_target_history', 'h')->fields('h', array('id'))->condition('account_fid', $fid)->condition('insert_time', time()-1*3600, '>')->execute()->rowCount();
    if($hour_count >= $restraint_configs['follow_count_limit_hour']){
        return array('success'=>false, 'data'=>array(), 'msg'=>'the account follow target reach ' . $restraint_configs['follow_count_limit_hour'] . ' count 24 h');
    }
    $count = db_select('tb_fb_crawler_follow_target_history', 'h')->fields('h', array('id'))->condition('account_fid', $fid)->condition('insert_time', time()-24*3600, '>')->execute()->rowCount();
    if($count >= $restraint_configs['follow_count_limit_day']){
        return array('success'=>false, 'data'=>array(), 'msg'=>'the account follow target reach ' .  $restraint_configs['follow_count_limit_day'] . ' count 24 h');
    }

    $follow_nums = db_select('tb_fb_crawler_account_follow_target_list', 'f')->fields('f', array('id'))->condition('account_fid', $fid)->execute()->rowCount();
    if($follow_nums >= $restraint_configs['max_follow_count']){
        return array('success'=>false, 'data'=>array(), 'msg'=>'the account all follow target reach ' . $restraint_configs['max_follow_count']);
    }
    $available_account_fids = db_select('tb_fb_crawler_accounts', 'a')->fields('a', array('account_fid'))->condition('available', 'y')->execute()->fetchCol();
    $exclude_target_fids = db_select('tb_fb_crawler_follow_target_history', 'h')->fields('h', array('target_fid'))->condition('account_fid', $fid)->execute()->fetchCol();
    $sub_query = db_select('tb_fb_crawler_follow_target_history', 'h')->fields('h', array('target_fid'));
    $sub_query->condition('account_fid', $available_account_fids);
    $sub_query->addExpression('count(*)', 'num');
    $sub_query->groupBy('target_fid');
    $query = db_select('tb_fb_crawler_targets', 't')->fields('t', array('account_fid','name'))->fields('s', array('num'));
    $query->condition('t.available', 'y');
    $query->leftJoin($sub_query, 's', 's.target_fid=t.account_fid');
    if($exclude_target_fids){
        $query->condition('t.account_fid', $exclude_target_fids, 'not in');
    }
    if(in_array($machine_ip, $machine_ips_feeds)){
        //$query->condition('t.name', '');
    }else{
        //$query->condition('t.name', '', '!=');
    }
    $query->orderBy('num');
    $target = $query->execute()->fetchAssoc();
    $data = array();
    if($target && (!$target['num'] || $target['num']<1)){
        $item = array(
            'account_fid'=> $fid,
            'target_fid'=> $target['account_fid'],
            'insert_time'=> time()
        );
        db_insert('tb_fb_crawler_follow_target_history')->fields($item)->execute();
        $data[] = array('target_fid'=>$target['account_fid'], 'target_name'=>urlencode($target['name']));
        return array('success'=>true, 'type'=>'fb_follow_target','data'=>$data);
    }
    return array('success'=>false);
}

function crawler_account_feeds($fid){
    $last_time = db_select('tb_fb_crawler_accounts', 'a')->fields('a', array('crawl_feeds_start_time'))->condition('account_fid', $fid)->execute()->fetchField();
    if($last_time && time()-$last_time<3*3600){
        return array('success'=>false, 'msg'=>'last crawl get time :' . date('Y-m-d H:i:s', $last_time));
    }
    db_update('tb_fb_crawler_accounts')->fields(array('crawl_feeds_start_time'=>time()))->condition('account_fid', $fid)->execute();
    $count = rand(10, 20);
    return array('success'=>true, 'type'=>'fb_crawler_feeds', 'data'=>array('scrollFeedsCount'=>$count));
}

function crawl_monitor_target($count, $exec_id){
    //return array('success'=>false, 'data'=>array());
    $ip = get_remote_client_address();
    /*
    $crawler_machine_ips = array(
        '43.155.64.168',    // vcman_hkvps_48
        '43.155.62.160',    // vcman_hkvps_49
        '13.212.105.84',    // vcman_aws_01
        '13.250.31.170'     // vcman_aws_05
    );
    **/
    //$pc_ip = array('27.203.29.19', '13.250.31.170');
    $pc_ip = array();
    $crawler_machine_ips = array();
    $flag = uniqid();
    $account = array();
    $project_names = array('foster', 'monitor', 'hk01', 'hk01,hk02', 'szj', 'hb_guid');
    //$project_names = array('hwp_0822');
    $query = db_select('tb_fb_account_crawler_task', 't')->fields('t', array('id'));
    $query->condition('available', 'y');
    if(in_array($ip, $pc_ip)){
        $query->condition('account_type', 'search');
    }else{
        $query->condition('project_name', $project_names);
    }
    $query->condition('status', 'r');
    $query->orderBy('priority', 'desc')->orderBy('crawl_get_time');
    $ids = $query->range(0, 100)->execute()->fetchCol(0);
    $update_item = array(
        'flag'=> $flag,
        'crawl_get_time'=> time(),
        'status'=> 'p',
        'exec_id'=> $exec_id
    );
    $fields = array(
        'account_fid',
        'account_type',
        'crawler_option_friends',
        'crawler_option_following',
        'crawler_option_page_liked',
        'crawler_option_album',
        'crawler_option_fans',
        'crawler_option_events',
        'crawl_count',
        'project_name'
    );
    foreach($ids as $id){
        try{
            db_update('tb_fb_account_crawler_task')->fields($update_item)->condition('id', $id)->condition('status', 'r')->execute();
            $account = db_select('tb_fb_account_crawler_task', 't')->fields('t', $fields)->condition('flag', $flag)->execute()->fetchAssoc();
            if($account){
                break;
            }
        }catch(Exception $e){}
    }
    if(!$account && in_array($ip, $crawler_machine_ips)){
        //return array('success'=>true, 'data'=>array(), 'msg'=>'not found available task');
        $query = db_select('tb_fb_account_crawler_task', 't')->fields('t', array('id'));
        $query->condition('project_name', $project_names)->condition('available', 'y');
        $query->orderBy('crawl_get_time');
        $ids = $query->range(0, 100)->execute()->fetchCol(0);
        $update_item = array(
            'flag'=> $flag,
            'crawl_get_time'=> time(),
            'status'=> 'p',
            'exec_id'=> $exec_id
        );
        foreach($ids as $id){
            try{
                db_update('tb_fb_account_crawler_task')->fields($update_item)->condition('id', $id)->execute();
                $account = db_select('tb_fb_account_crawler_task', 't')->fields('t', $fields)->condition('flag', $flag)->execute()->fetchAssoc();
                if($account){
                    break;
                }
            }catch(Exception $e){}
        }
    }
    $data = array();
    //$fids = array('100050819591308');
    if($account){
        $fid = $account['account_fid'];
        $info = array(
            'skipCrawlGuidFb'=> 'y',
            'skipCrawlMonitorFb'=> 'n',
            'skipSearchKeyword'=> 'y',
            'skipSearchKeywordPost'=> 'y',
            'skipSearchKeywordPage'=> 'y',
            'skipSearchKeywordGroup'=> 'y',
            'skipSearchKeywordPeople'=> 'y',
            'skipSearchKeywordPlace'=> 'y',
            'skipCrawlMonitorFbFriends'=> $account['crawler_option_friends']=='n'? 'y' : 'n',
            'skipCrawlMonitorFbFollowing'=> $account['crawler_option_following']=='n'? 'y' : 'n',
            'skipCrawlAlbum'=> $account['crawler_option_album']=='n'? 'y' : 'n',
            'skipCrawlActivity'=> $account['crawler_option_events']=='n'? 'y' : 'n',
            'skipTopFans'=> $account['crawler_option_fans']=='n'? 'y' : 'n',
            'monitorFbUrl'=> 'https://www.facebook.com/'.$fid,
            'monitorFbPostsLoopCount'=> 10,
            'monitorFbFriendsLoopCount'=> 10,
            'monitorFbFollowingLoopCount'=> 10
        );
        if($account['account_type'] == 'search'){
            $info['searchKeyword'] = $fid;
            $info['skipCrawlMonitorFb'] = 'y';
            $info['skipSearchKeyword'] = 'n';
            $info['skipSearchKeywordGroup'] = 'n';
            $info['monitorFbPostsLoopCount'] = 50;
        }
        if(in_array($ip, array('13.212.149.110'))){
            $info['skipCrawlAlbum'] = 'n';
            $info['skipCrawlActivity'] = 'n';
            $info['skipTopFans'] = 'n';
        }
        if($account['crawl_count']==0 || $info['skipCrawlMonitorFbFriends']=='n' || $info['skipCrawlMonitorFbFollowing']=='n' || $info['skipCrawlAlbum']=='n' || $info['skipCrawlActivity']=='n' || $info['skipTopFans']=='n'){
            $info['skipCrawlAbout'] = 'n';
        }else{
            $info['skipCrawlAbout'] = 'n';
        }
        if($account['project_name'] == 'hb_guid'){
            $info['skipCrawlAbout'] = 'y';
            $info['skipCrawlActivity'] = 'y';
        }
        $data[$fid] = $info;
    }
    $data = array_values($data);
    return array('success'=>true, 'type'=>'monitor_target', 'data'=>$data);
}

function crawl_monitor_ins_target($count, $exec_id){
    $flag = uniqid();
    $account = array();
    $project_names = array('monitor');
    $query = db_select('tb_ins_account_crawler_task', 't')->fields('t', array('id'));
    //$query->condition('project_name', $project_names);
    $query->condition('available', 'y')->condition('status', 'r');
    $query->orderBy('priority', 'desc')->orderBy('crawl_get_time');
    $ids = $query->range(0, 100)->execute()->fetchCol(0);
    $update_item = array(
        'flag'=> $flag,
        'crawl_get_time'=> time(),
        'status'=> 'p',
        'exec_id'=> $exec_id
    );
    $fields = array(
        'id',
        'ins_username',
        'seed_type',
        'crawl_count',
        'crawler_option_info',
        'crawler_option_posts',
        'crawler_option_comment',
        'crawler_option_liked',
        'crawler_option_follower',
        'crawler_option_following',
        'crawler_option_hashtag',
        'crawler_option_search'
    );
    foreach($ids as $id){
        try{
            db_update('tb_ins_account_crawler_task')->fields($update_item)->condition('id', $id)->condition('status', 'r')->execute();
            $account = db_select('tb_ins_account_crawler_task', 't')->fields('t', $fields)->condition('flag', $flag)->execute()->fetchAssoc();
            break;
        }catch(Exception $e){}
    }
    $data = array();
    if($account){
        $ins_username = $account['ins_username'];
        $skip_userinfo = 'n';
        if($account['seed_type'] == 'user'){
            $url = 'https://www.instagram.com/' . $ins_username . '/';
        }else{
            $url = 'https://www.instagram.com/explore/tags/' . urlencode($ins_username) . '/';
            $skip_userinfo = 'y';
        }
        $info = array(
            'insID'=> $account['id'],
            'insUsername'=> $ins_username,
            'monitorInsUrl'=> $url,
            'skipUserInfo'=> $skip_userinfo,
            'skipUserFollower'=> $account['crawler_option_follower']=='n'? 'y' : 'n',
            'skipUserFollowing'=> $account['crawler_option_following']=='n'? 'y' : 'n',
            'skipUserHashtag'=> $account['crawler_option_hashtag']=='n'? 'y' : 'n',
            'skipComments'=> 'y',
            'skipLikes'=> 'y',
            'monitorPostLoopCount'=> 10,
            'monitorLoopCount'=> 20
        );
        //debug
        $info['skipUserFollower'] = 'y';
        $info['skipUserFollowing'] = 'y';
        $info['skipUserHashtag'] = 'y';

        $data[$ins_username] = $info;
    }
    $data = array_values($data);
    return array('success'=>true, 'type'=>'monitor_ins', 'data'=>$data);
}

function crawl_guid_account($count, $exec_id){
    $flag = uniqid();
    $fids = array('100050572025932','110583557234945','107607667603622','100066644737543','105345581090643','100083399655964','100072467461374','100052074908059','100063361711135','111881443770385','101347138141519');
    //$update_sql = "update tb_fb_account_crawler_task set flag='" . $flag .  "',crawl_get_time=" . time() . ",status='p',exec_id='" .$exec_id . "' where available='y' and project_name in ('hbv5', 'G111', 'J719', 'A1218') and status='r' order by crawl_get_time limit ". $count;
    //db_query($update_sql);
    $project_names = array('hbv5_ipv6', 'J719-V5', 'foster', 'hbv5', 'G111', 'J719', 'A1218');
    //$project_names = array('0804_01');
    $query = db_select('tb_fb_account_crawler_task', 't')->fields('t', array('id'));
    $query->condition('project_name', $project_names)->condition('available', 'y')->condition('status', 'r');
    $query->condition('account_fid', $fids, 'not in');
    //$query->orderBy('crawl_get_time');
    $ids = $query->range(0, 100)->execute()->fetchCol(0);
    $update_item = array(
        'flag'=> $flag,
        'crawl_get_time'=> time(),
        'status'=> 'p',
        'exec_id'=> $exec_id
    );
    $cursor = 0;
    foreach($ids as $id){
        try{
            $id = db_update('tb_fb_account_crawler_task')->fields($update_item)->condition('id', $id)->condition('status', 'r')->execute();
            if($id){
                $cursor++;
                if($cursor >= $count){
                    break;
                }
            }
        }catch(Exception $e){}
    }
    $query = db_select('tb_fb_account_crawler_task', 't')->fields('t', array('account_fid', 'account_type'));
    $query->condition('flag', $flag);
    $fids = array();
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $fids[] = $row['account_fid'];
    }
    if(!$fids){
        return array('success'=>false, 'data'=>array(), 'msg'=>'not found available task');
    }
    return array('success'=>true, 'type'=>'fb_guid_account', 'data'=>$fids);
}

function crawl_facebook_single_post($exec_id){
    $ip = get_remote_client_address();
    $flag = uniqid();
    $update_item = array(
        'flag'=> $flag,
        'crawl_get_time'=> time(),
        'status'=> 'p',
        'source_ip'=> $ip,
        'exec_id'=> $exec_id
    );
    $fields = array('id', 'post_url');
    $query = db_select('tb_fb_post_crawler_task', 't')->fields('t', $fields);
    $query->condition('status', array('r','p'))->condition('available', 'y');
    $query->orderBy('crawl_get_time');
    $query->range(0, 10);
    $data = array();
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        try{
            $id = db_update('tb_fb_post_crawler_task')->fields($update_item)->condition('id', $row['id'])->execute();
            if($id){
                $data[] = array(
                    'postURL'=> $row['post_url'],
                    'skipCrawlerShares'=> 'y',
                    'skipCrawlerComments'=> 'y',
                    'skipCrawlerPraises'=> 'y'
                );
                return array('success'=>true, 'type'=>'fb_single_post', 'data'=>$data);
            }
        }catch(Exception $e){}
    }
    return array('success'=>false, 'data'=>array(), 'ip'=>$ip);
}

function crawl_group_permeation($count, $exec_id){
    $ip = get_remote_client_address();
    $permeation_machines = array(
        '43.134.198.149'  //vcman_hkvps_21
    );
    $flag = uniqid();
    $update_item = array(
        'flag'=> $flag,
        'crawl_get_time'=> time(),
        'status'=> 'p',
        'source_ip'=> $ip,
        'exec_id'=> $exec_id
    );
    //facebook single post
    $fields = array('id', 'post_url');
    $query = db_select('tb_fb_post_crawler_task', 't')->fields('t', $fields);
    $query->condition('status', 'r')->condition('available', 'y');
    $query->orderRandom();
    $query->range(0, 20);
    $data = array();
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        try{
            $id = db_update('tb_fb_post_crawler_task')->fields($update_item)->condition('id', $row['id'])->condition('status', 'r')->execute();
            if($id){
                $data[] = array(
                    'postURL'=> $row['post_url'],
                    'skipCrawlerShares'=> 'y',
                    'skipCrawlerComments'=> 'y',
                    'skipCrawlerPraises'=> 'y'
                );
                return array('success'=>true, 'type'=>'fb_single_post', 'data'=>$data);
            }
        }catch(Exception $e){}
    }
    //group post detect
    $fields = array('id', 'group_fid', 'account_fid', 'guid_es_id', 'task_time', 'effective_time_duration');
    $query = db_select('tb_fb_group_permeation_post_detect', 't')->fields('t', $fields);
    $query->condition('post_fid', null, 'is')->condition('guid_es_id', '', '!=');
    $db_and = db_and()->condition('status', 'p')->condition('crawl_get_time', time()-1800, '<');
    $db_or = db_or()->condition('status', 'r')->condition($db_and);
    $query->condition($db_or);
    $query->orderRandom();
    $query->range(0, 20);
    $data = array();
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        try{
            $id = db_update('tb_fb_group_permeation_post_detect')->fields($update_item)->condition('id', $row['id'])->execute();
            if($id){
                $data[] = $row;
                return array('success'=>true, 'type'=>'post_detect', 'data'=>$data);
            }
        }catch(Exception $e){}
    }
    //post info
    $query = db_select('tb_fb_group_permeation_post_info', 't')->fields('t', array('id','post_fid'));
    $query->condition('status', 'r');
    //$query->condition('crawl_content', null, 'is');
    $query->condition('crawl_count', 3, '<');
    $query->orderRandom();
    $query->range(0, 20);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        try{
            $id = db_update('tb_fb_group_permeation_post_info')->fields($update_item)->condition('id', $row['id'])->condition('status', 'r')->execute();
            if($id){
                $data[] = $row;
                return array('success'=>true, 'type'=>'post_info', 'data'=>$data);
            }
        }catch(Exception $e){}
    }
    //group join
    $query = db_select('tb_fb_group_permeation_join_group', 'p')->fields('p', array('id', 'group_fid', 'account_fid'));
    $query->condition('status', 'r');
    $query->condition('crawl_count', 5, '<');
    $query->orderBy('crawl_finish_time');
    $query->range(0, 20);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        try{
            $id = db_update('tb_fb_group_permeation_join_group')->fields($update_item)->condition('id', $row['id'])->condition('status', 'r')->execute();
            if($id){
                $data[] = $row;
                return array('success'=>true, 'type'=>'join_detect', 'data'=> $data);
            }
        }catch(Exception $e){}
    }
    if(in_array($ip, $permeation_machines)) {
        $update_sql = "update tb_fb_group_permeation_post_detect set flag='" . $flag . "',crawl_get_time=" . time() . ",status='p',exec_id='" . $exec_id . "' where status='s' and post_fid is null and guid_es_id!='' and crawl_finish_time<unix_timestamp()-24*3600 and crawl_finish_time>unix_timestamp()-7*24*3600  order by crawl_finish_time limit 1";
        db_query($update_sql);
        $query = db_select('tb_fb_group_permeation_post_detect', 't')->fields('t', $fields);
        $query->condition('flag', $flag);
        $data = array();
        $result = $query->execute();
        if ($result->rowCount() > 0) {
            $row = $result->fetchAssoc();
            $data[] = $row;
            return array('success'=>true, 'type'=>'post_detect', 'data'=>$data);
        }
        $update_sql = "update tb_fb_group_permeation_post_info set crawl_count=crawl_count+1, flag='" . $flag . "',crawl_get_time=" . time() . ",status='s',exec_id='" . $exec_id . "' where status='s' and crawl_finish_time<unix_timestamp()-24*3600 and crawl_finish_time>unix_timestamp()-30*24*3600 order by crawl_count limit 1";
        db_query($update_sql);
        $query = db_select('tb_fb_group_permeation_post_info', 't')->fields('t', array('post_fid'));
        $query->condition('flag', $flag);
        $result = $query->execute();
        if ($result->rowCount() > 0) {
            $row = $result->fetchAssoc();
            $data[] = $row;
            return array('success'=>true, 'type'=>'post_info', 'data'=>$data);
        }
    }
    //account url map get fid
    $query = db_select('tb_fb_account_urls_map', 'a')->fields('a', array('id', 'account_url'));
    $query->condition('status', 'r')->condition('available', 'y')->condition('account_fid', null, 'is');
    $query->orderRandom();
    $query->range(0, 20);
    $data = array();
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        try{
            $id = db_update('tb_fb_account_urls_map')->fields($update_item)->condition('id', $row['id'])->condition('status', 'r')->execute();
            if($id){
                $data[] = array(
                    'crawlerUrl'=> $row['account_url']
                );
                return array('success'=>true, 'type'=>'fb_account_url_map', 'data'=>$data);
            }
        }catch(Exception $e){}
    }
    return array('success'=>false, 'data'=>array(), 'ip'=>$ip);
}

function crawl_account($params){
    global $combat_db_options;
    //select p.id,p.page_fid,p.page_type,name,last_crawl_roles_time from dt_fb_manage_pages p left join dt_fb_account_manage_page_relation r on r.page_fid=p.page_fid where r.account_fid='100047718051956' order by last_crawl_roles_time;
    $data = array();
    $account_fid = $params['account_fid'];
    $copy_account = $params['copy_account'];
    if($copy_account == 'account'){
        $fields = array('account_id', 'account_fid', 'account', 'ins_id', 'post_interval', 'post_interval', 'last_crawl_time');
        $query = db_select('tb_account_crawler_info', 'a', $combat_db_options)->fields('a', $fields);
        $query->condition('a.account_fid', $account_fid);
        $query->condition('a.ins_id', null, 'is not');
        $query->range(0, 1);
        $result = $query->execute();
        $row = $result->fetchAssoc();
        if($row && time()-$row['last_crawl_time']>3*86400){
            $data['crawl_page_roles_fid'] = '';
            $data['page_name'] = '';
            $data['page_type'] = '';
            $data['account_name'] = $row['account'];
            $data['last_crawl_manage_pages'] = time();
            $data['last_crawl_roles_time'] = time();
            $data['crawl_post_insights_switch'] = 'n';
            $query = db_select('dt_ins_images', 'i', $combat_db_options)->fields('i', array('id', 'ins_post_id', 'text'));
            $query->addExpression('group_concat(ins_image_id)', 'image_ids');
            $query->condition('ins_id', $row['ins_id'])->condition('down_flag', 'y')->condition('fb_post_flag', 'n');
            $query->groupBy('ins_post_id')->orderBy('taken_at', 'desc');
            $ins = $query->execute()->fetchAssoc();
            if($ins){
                $data['ins_text'] = $ins['text'];
                $data['ins_images_urls'] = array();
                $image_ids = explode(',', $ins['image_ids']);
                foreach($image_ids as $image_id){
                    $data['ins_images_urls'][] = array(
                        'url'=> 'https://47.74.153.74/materials/instagram/' . $row['ins_id'] . '/' . $image_id . '.jpg',
                        'name'=> $image_id . '.jpg'
                    );
                }
                db_update('dt_ins_images', $combat_db_options)->fields(array('fb_post_flag'=>'p'))->condition('ins_post_id', $ins['ins_post_id'])->execute();
            }
        }else{
            if($row){
                $data['last_crawl_time'] = date('Y-m-d H:i:s', $row['last_crawl_time']);
            }
        }
    }else{
        $fields = array('id', 'page_fid', 'page_type', 'name', 'last_crawl_roles_time', 'bili_aid', 'youtube_channel_id', 'post_interval', 'crawl_post_insights_switch');
        $query = db_select('dt_fb_manage_pages', 'p', $combat_db_options)->fields('p', $fields);
        $query->fields('r', array('account_name'))->fields('a', array('account', 'last_crawl_manage_pages'));
        $query->leftJoin('dt_fb_account_manage_page_relation', 'r', 'r.page_fid=p.page_fid');
        $query->leftJoin('tb_guid_fb_account', 'a', 'a.identity=r.account_fid');
        $query->condition('p.page_type', array('classic', 'new'));
        $query->condition('p.page_available', 'y');
        $query->condition('r.account_fid', $account_fid);
        //$db_or = db_or()->condition('p.bili_aid', null, 'is not')->condition('p.youtube_channel_id', null, 'is not')->condition('p.crawl_post_insights_switch', 'y');
        //$db_and = db_and()->condition($db_or)->condition('p.last_crawl_roles_time', time()-20*3600, '<');
        //$query->condition($db_and);
        $query->condition('p.last_crawl_roles_time', time()-7*24*3600, '<');
        $query->orderBy('last_crawl_roles_time');
        $query->range(0, 1);
        $result = $query->execute();
        $row = $result->fetchAssoc();
        //select p.id,p.page_type,p.page_available from dt_fb_manage_pages p left join dt_fb_account_manage_page_relation r on r.page_fid=p.page_fid left join tb_guid_fb_account a on a.identity=r.account_fid where r.account_fid='100044547241513';
        if($row){
            if(strpos($row['name'], "'") !== false){
                $row['name'] = substr($row['name'], strpos($row['name'], "'")+1);
            }
            $data['crawl_page_roles_fid'] = $row['page_fid'];
            $data['page_name'] = $row['name'];
            $data['page_type'] = $row['page_type'];
            $data['account_name'] = $row['account_name'];
            $data['last_crawl_manage_pages'] = $row['last_crawl_manage_pages'];
            $data['last_crawl_roles_time'] = $row['last_crawl_roles_time'];
            $data['crawl_post_insights_switch'] = $row['crawl_post_insights_switch'];
            if($row['youtube_channel_id'] || $row['bili_aid']){
                $post_flag = true;
                $post = db_select('dt_fb_page_post_insights', 'p', $combat_db_options)->fields('p', array('post_time'))->condition('page_fid', $row['page_fid'])->orderBy('post_time', 'desc')->execute()->fetchAssoc();
                if($post){
                    if(time()-$post['post_time'] < $row['post_interval']){
                        $post_flag = false;
                    }
                }
                if($post_flag){
                    if($row['youtube_channel_id']){
                        $video = db_select('dt_youtube_videos', 'v', $combat_db_options)->fields('v', array('id', 'video_id', 'title'))->condition('channel_id', $row['youtube_channel_id'])->condition('down_flag', 'y')->condition('fb_post_flag', 'n')->orderBy('id', 'desc')->execute()->fetchAssoc();
                        if($video){
                            $data['video_url'] = 'https://47.74.153.74/materials/youtube/' . $row['youtube_channel_id'] . '/v-' . $video['video_id'] . '.mp4';
                            $data['video_name'] = $video['video_id'] . '.mp4';
                            $data['vidoe_text'] = $video['title'];
                            db_update('dt_youtube_videos', $combat_db_options)->fields(array('fb_post_flag'=>'p'))->condition('id', $video['id'])->execute();
                        }
                    }else{
                        $video = db_select('dt_bili_videos', 'v', $combat_db_options)->fields('v', array('id', 'bvid', 'title'))->condition('mid', $row['bili_aid'])->condition('down_flag', 'y')->condition('fb_post_flag', 'n')->orderBy('created', 'desc')->execute()->fetchAssoc();
                        if($video){
                            $data['video_url'] = 'https://47.74.153.74/materials/bilibili/' . $row['bili_aid'] . '/' . $video['bvid'] . '.mp4';
                            $data['video_name'] = $video['bvid'] . '.mp4';
                            $data['vidoe_text'] = $video['title'];
                            db_update('dt_bili_videos', $combat_db_options)->fields(array('fb_post_flag'=>'p'))->condition('id', $video['id'])->execute();
                        }
                    }
                }
            }
        }
    }
    return array('success'=>true, 'data'=>$data);
}

function check_post_insights($params){
    global $combat_db_options;
    $screenshot_flag = true;
    $post_fid = $params['post_fid'];
    $post_reach = $params['post_reach'];
    $post_engagement = $params['post_engagement'];
    $query = db_select('dt_fb_page_post_insights', 'p', $combat_db_options)->fields('p', array('id','post_fid','post_reach','post_engagement','post_impression','screenshot_image'));
    $query->condition('post_fid', $post_fid);
    $post = $query->execute()->fetchAssoc();
    if($post && $post['screenshot_image'] && $post['post_reach']==$post_reach && $post['post_engagement']==$post_engagement && $post['post_impression']>=$post['post_reach']){
        $screenshot_flag = false;
    }
    return array('success'=>true, 'screenshot_flag'=>$screenshot_flag);
}

function post_insights_screenshot($params){
    global $combat_db_options;
    $params = $params['post'];
    $dir = '/data/post_insights_images';
    $dst = join_paths($dir, $_FILES['image']['name']);
    if(move_uploaded_file($_FILES['image']['tmp_name'], $dst)){
        $post = array(
            'page_fid'=> $params['page_fid'],
            'post_fid'=> $params['post_fid'],
            'post_time'=> $params['post_time'],
            'message'=> filterEmoji($params['message']),
            'type'=> $params['type'],
            'screenshot_image'=> $_FILES['image']['name'],
            'screenshot_time'=> time(),
            'last_update_time'=> time()
        );
        if(isset($params['post_impression'])){
            $post['post_impression'] = $params['post_impression'];
        }
        if(isset($params['post_reach'])){
            $post['post_reach'] = $params['post_reach'];
        }
        if(isset($params['post_engagement'])){
            $post['post_engagement'] = $params['post_engagement'];
        }
        if(isset($params['picture'])){
            $post['picture'] = $params['picture'];
        }
        $existRow = db_select('dt_fb_page_post_insights', 'p', $combat_db_options)->fields('p', array('id'))->condition('post_fid', $params['post_fid'])->execute()->fetchAssoc();
        if(!$existRow){
            $item['insert_time'] = time();
            db_insert('dt_fb_page_post_insights', $combat_db_options)->fields($post)->execute();
        }else{
            db_update('dt_fb_page_post_insights', $combat_db_options)->fields($post)->condition('post_fid', $params['post_fid'])->execute();
        }
    }
    return array('success'=>true);
}

function crawl_page($params){
    global $combat_db_options;
    $count = isset($params['count'])? intval($params['count']) : 100;
    $page_fid = isset($params['page_fid'])? $params['page_fid'] : null;
    $data = array();
    //$excludeFids = array('100042221241261', '100042497196292', '100050376862076', '100049994806180', '100072831797572', '100071680785621');

    $query = db_select('dt_fb_manage_pages', 'p', $combat_db_options)->fields('p', array('id', 'page_fid', 'page_type', 'name', 'last_crawl_roles_time'));
    $query->addExpression('group_concat(account_fid)', 'account_fids');
    $query->leftJoin('dt_fb_account_manage_page_relation', 'r', 'r.page_fid=p.page_fid');
    $query->condition('r.loc', null, 'is not');
    $query->condition('p.page_type', array('classic', 'new'));
    $query->condition('p.page_available', 'y');
    $query->condition('p.last_crawl_roles_time', time()-1*24*3600, '<');
    //$db_or = db_or()->condition('p.bili_aid', null, 'is not')->condition('p.youtube_channel_id', null, 'is not')->condition('crawl_post_insights_switch', 'y');
    //$query->condition($db_or);
    //$query->condition('r.account_fid', $excludeFids, 'not in');
    if($page_fid){
        $query->condition('p.page_fid', $page_fid);
    }
    $query->groupBy('p.page_fid');
    //$query->orderBy('last_crawl_roles_time');
    $query->range(0, 100);
    $result = $query->execute();
    /*
    select p.id,p.page_fid ,p.page_type,p.name,p.last_crawl_roles_time,group_concat(account_fid) from dt_fb_manage_pages p left join dt_fb_account_manage_page_relation r on r.page_fid=p.page_fid where r.loc is not null and p.page_type in ('classic', 'new') and p.page_available = 'y' and p.last_crawl_roles_time < '1683189428' and (p.bili_aid is not null or p.youtube_channel_id is not null or p.crawl_post_insights_switch='y') and r.account_fid not in ('100042221241261', '100042497196292', '100050376862076', '100049994806180', '100072831797572', '100071680785621') group by p.page_fid order by last_crawl_roles_time limit 0,100;
    */
    while($row = $result->fetchAssoc()){
        //$data[] = $row;
    }

    //select p.page_fid,r.account_fid,loc,from_unixtime(p.last_crawl_roles_time) from dt_fb_manage_pages p left join dt_fb_account_manage_page_relation r on p.page_fid=r.page_fid where loc is not null order by p.last_crawl_roles_time limit 100;
    $query = db_select('dt_fb_manage_pages', 'p', $combat_db_options)->fields('p', array('id', 'page_fid', 'page_type', 'name', 'last_crawl_roles_time'));
    $query->addExpression('group_concat(account_fid)', 'account_fids');
    $query->leftJoin('dt_fb_account_manage_page_relation', 'r', 'r.page_fid=p.page_fid');
    $query->condition('r.loc', null, 'is not');
    $query->condition('p.page_type', array('classic', 'new'));
    $query->condition('p.page_available', 'y');
    $query->condition('p.last_crawl_roles_time', time()-7*24*3600, '<');
    //$query->condition('p.bili_aid', null, 'is');
    //$query->condition('r.account_fid', $excludeFids, 'not in');
    if($page_fid){
        $query->condition('p.page_fid', $page_fid);
    }
    $query->groupBy('p.page_fid');
    //$query->orderBy('last_crawl_roles_time');
    $query->range(0, $count);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $data[] = $row;
    }
    return array('success'=>true, 'data'=>$data);
}

function f_cp_save_crawl_result(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $task_type = get_value_from_array($params, 'task_type', null);
    $machine_ip = get_value_from_array($params, 'machine_ip', null);
    $machine_loc = get_value_from_array($params, 'machine_loc', null);
    $content = get_value_from_array($params, 'content', '');
    if(is_array($content)){
        $data = $content;
    }else{
        $data = json_from_string($content);
    }
    if(isset($data['dataEx']) && isset($data['dataEx']['network_crawler'])){
        foreach($data['dataEx']['network_crawler'] as $key=>$item){
            echo $key;
            switch($key){
                case 'paNewsList':
                case 'pasqNewsList':
                    panews_save_news_list($item);
                    break;
                case 'paNewDetail':
                    panews_save_new_detail($item);
                    break;
                case 'theBlockNewsList':
                case 'theBlockResearchNewsList':
                    theblock_save_news_list($item);
                    break;
                case 'binanceAnnouncementList':
                    binance_save_announcement_list($item);
                    break;
                case 'binanceAnnouncementDetail':
                    binance_save_announcement_detail($item);
                    break;
                case 'binanceFearAndGreedIndex':
                    binance_save_binanceFearAndGreedIndex($item);
                    break;
                case 'tw_create_tweet':
                    twitter_save_create_tweet($item);
                    break;
                case 'twitter_list_add_member':
                    twitter_save_list_add_member($item);
                    break;
                case 'twitter_locked':
                    twitter_save_locked_user($item);
                    break;
                case 'twitter_user':
                    process_save_twitter_user($item);
                    break;
                case 'twitter_search_user':
                    process_save_twitter_search_user($item);
                    break;
                case 'twitter_main_account_relationship':
                    process_twitter_main_account_relationship($item);
                    break;
                case 'twitter_tweet':
                    process_save_twitter_tweet($item, $data);
                    break;
                case 'twitter_edit_tweet_ids':
                    process_save_twitter_edit_tweet_ids($item);
                    break;
                case 'twitter_followings':
                    if(isset($data['dataEx']['network_crawler']['twitter_user'])){
                        process_save_twitter_followings($item, $data['dataEx']['network_crawler']['twitter_user'][0]);
                    }
                    break;
                case 'twitter_followers':
                    if(isset($data['dataEx']['network_crawler']['twitter_user'])){
                        process_save_twitter_followers($item, $data['dataEx']['network_crawler']['twitter_user'][0]);
                    }
                    break;
                case 'twitter_community_list':
                    process_tb_twitter_community_list($item);
                    break;
                case 'twitter_community_members':
                    process_save_twitter_community_members($item);
                    break;
                case 'tw_dm_msgs':
                    process_save_tw_dm_msgs($item);
                    break;
                case 'hyperliquidTopPosition':
                    process_save_hyperliquidTopPosition($item);
                    break;
                case 'hyperliquidTopPositionAction':
                    process_save_hyperliquidTopPositionAction($item);
                    break;
                case 'hyperliquidUserFills':
                    process_save_hyperliquidUserFills($item);
                    break;
                // coinAnk
                case 'coinrank_longshort_ratio':
                    porcess_coinrank_longshort_ratio($item);
                    break;
                case 'coinrank_statistic_all':
                    process_coinrank_statistic_all($item);
                    break;
                case 'coinrank_turnover_data':
                    process_coinrank_turnover_data($item);
                    break;
                case 'coinrank_altcoin_season':
                    process_coinrank_altcoin_season($item);
                    break;
                case 'funding_rate_data':
                    process_funding_rate_data($item);
                    break;
                // tender 招投数据采集
                case 'tender_data_list':
                    process_tender_data_list($item);
                    break;
                // weibo 数据
                case 'weibo_create_post':
                    process_weibo_create_post($item);
                    break;
            }
        }
    }
}

function f_cp_save_crawl_result_bak(){
    global $es_hosts_params, $es_client, $machine_ips_feeds;
    $ip = get_remote_client_address();
    //$es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_hosts_params)->build();
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $task_type = get_value_from_array($params, 'task_type', null);
    $last_crawl_operation_id = get_value_from_array($params, 'last_crawl_operation_id', null);
    $exec_id = get_value_from_array($params, 'exec_id', null);
    $task_exec_status = get_value_from_array($params, 'task_exec_status', 's');
    $task_exec_status = $task_exec_status? $task_exec_status : 's';
    $user_id = get_value_from_array($params, 'user_id', 0);
    $crawl_fids = get_value_from_array($params, 'crawl_fids', array());
    $machine_ip = get_value_from_array($params, 'machine_ip', null);
    $machine_loc = get_value_from_array($params, 'machine_loc', null);
    $content = get_value_from_array($params, 'content', '');

    if($task_type && function_exists('process_task_' . $task_type)){
        call_user_func_array('process_task_' . $task_type, array($params));
    }

    if(is_array($content)){
        $data = $content;
    }else{
        $data = json_from_string($content);
    }

    $messages = array();
    if(isset($data['crawler_group_post_check'])){
        $messages[] = process_crawler_group_post_check($data['crawler_group_post_check'], $exec_id, $task_exec_status);
    }
    if(isset($data['crawler_post_info'])){
        $messages[] = process_crawler_post_info($data['crawler_post_info'], $exec_id, $task_exec_status);
    }
    if(isset($data['crawler_tweet_info'])){
        $messages[] = process_crawler_tweet_info($data['crawler_tweet_info'], $exec_id, $task_exec_status);
    }
    if(isset($data['dataEx']) && isset($data['dataEx']['ins_title']) && $data['dataEx']['ins_title']['desc']){
        process_ins_name_available($data['dataEx']['ins_title']['desc']);
    }
    if(isset($data['dataEx']) && isset($data['dataEx']['network_crawler'])){
        foreach($data['dataEx']['network_crawler'] as $key=>$item){
            if($key == 'guid_account_info'){
                $account_fid = $item['account_fid'];
                $account_item = array(
                    'account_fid'=> $account_fid,
                    'name'=> $item['name'],
                    'user_id'=> $user_id,
                    'last_update_time'=> time()
                );
                $exists = db_select('dt_fb_guid_account_list', 'a')->fields('a', array('id'))->condition('account_fid', $account_fid)->execute()->fetchAssoc();
                if($exists){
                    db_update('dt_fb_guid_account_list')->fields($account_item)->condition('account_fid', $account_fid)->execute();
                }else{
                    $account_item['insert_time'] = time();
                    db_insert('dt_fb_guid_account_list')->fields($account_item)->execute();
                }
                $messages[] = 'guid account: ' . $account_fid;
            }elseif($key == 'requests_list'){
                foreach($item as $info){
                    $update_item = array(
                        'account_fid'=> $info['account_fid'],
                        'user_fid'=> $info['user_fid'],
                        'name'=> $info['name'],
                        'profile_picture'=> $info['profile_picture'],
                        'friendship_status'=> get_value_from_array($info, 'friendship_status', ''),
                        'social_context'=> $info['social_context'],
                        'last_update_time'=> time()
                    );
                    if(isset($info['request_time'])){
                        $update_item['request_time'] = $info['request_time'];
                    }
                    $exists = db_select('dt_fb_account_friend_requests_list', 'r')->fields('r', array('id'))->condition('account_fid', $info['account_fid'])->condition('user_fid', $info['user_fid'])->execute()->fetchAssoc();
                    if($exists){
                        db_update('dt_fb_account_friend_requests_list')->fields($update_item)->condition('id', $exists['id'])->execute();
                    }else{
                        $update_item['insert_time'] = time();
                        db_insert('dt_fb_account_friend_requests_list')->fields($update_item)->execute();
                    }
                }
            }elseif($key == 'suggestions_list'){
                foreach($item as $info){
                    $update_item = array(
                        'account_fid'=> $info['account_fid'],
                        'user_fid'=> $info['user_fid'],
                        'name'=> $info['name'],
                        'profile_picture'=> $info['profile_picture'],
                        'friendship_status'=> get_value_from_array($info, 'friendship_status', ''),
                        'social_context'=> $info['social_context'],
                        'last_update_time'=> time()
                    );
                    $exists = db_select('dt_fb_account_friend_pyml_list', 'r')->fields('r', array('id'))->condition('account_fid', $info['account_fid'])->condition('user_fid', $info['user_fid'])->execute()->fetchAssoc();
                    if($exists){
                        db_update('dt_fb_account_friend_pyml_list')->fields($update_item)->condition('id', $exists['id'])->execute();
                    }else{
                        $update_item['insert_time'] = time();
                        db_insert('dt_fb_account_friend_pyml_list')->fields($update_item)->execute();
                    }
                }
            }elseif($key == 'profiles_list'){
                foreach($item as $info){
                    $fid = $info['id'];
                    $user_info = array(
                        'id'=> 'facebook_' . $fid,
                        'site'=> 'facebook',
                        'user_iid'=> $fid,
                        'available'=> 'y',
                        'user_name'=> $info['name'],
                        'profile_url'=> $info['url'],
                        'user_image_url'=> $info['profile_picture'],
                        'page_type'=> 2,
                        'source_iid'=> array('fb_profiles'),
                        'insert_time'=> time(),
                        'last_update_time'=> time()
                    );
                    if(isset($info['friends'])){
                        $user_info['friends_count'] = intval($info['friends']);
                    }
                    if(isset($info['relationship'])){
                        $user_info['relationship'] = $info['relationship'];
                    }
                    if(isset($info['work'])){
                        $user_info['work'] = $info['work'];
                    }
                    if(isset($info['education'])){
                        $user_info['education'] = $info['education'];
                    }
                    if(isset($info['home_town'])){
                        $user_info['home_town'] = $info['home_town'];
                    }
                    if(isset($info['city'])){
                        $user_info['city'] = $info['city'];
                    }
                    //dataBulkUpdateEs('mass_audience', array($user_info));
                }
            }elseif($key == 'friend_request_confirm'){
                foreach($item as $info){
                    $update_item = array(
                        'friendship_status'=> $info['friendship_status'],
                        'last_update_time'=> time()
                    );
                    db_update('dt_fb_account_friend_requests_list')->fields($update_item)->condition('account_fid', $info['account_fid'])->condition('user_fid', $info['user_fid'])->execute();
                }
            }elseif($key == 'friend_request_send'){
                foreach($item as $info){
                    $update_item = array(
                        'friendship_status'=> $info['friendship_status'],
                        'last_update_time'=> time()
                    );
                    db_update('dt_fb_account_friend_pyml_list')->fields($update_item)->condition('account_fid', $info['account_fid'])->condition('user_fid', $info['user_fid'])->execute();
                }
            }elseif($key == 'post_comments_list'){

            }elseif($key == 'post_like_list'){

            }elseif($key == 'post_share_list') {

            }elseif($key == 'group_user_posts'){
                process_group_user_posts($item);
            }elseif($key == 'feed_post_list'){
                process_feed_post_list($item);
            }elseif($key == 'search_post_list'){
                foreach($item as $info){
                    if(isset($info['group_fid'])){
                        $group_info = array(
                            'id'=> $info['group_fid'],
                            'identity'=> $info['group_fid'],
                            'insert_time'=> time(),
                            'last_update_time'=> time()
                        );
                        //dataBulkUpdateEs('group_info', array($group_info));
                    }
                }
            }elseif($key == 'search_profile_list'){
                foreach($item as $info){
                    if(isset($info['iid'])){
                        if(!isset($info['__typename']) || !in_array($info['__typename'], array('ENTITY_GROUPS', 'Group'))){
                            continue;
                        }
                        $group_info = array(
                            'id'=> $info['iid'],
                            'identity'=> $info['iid'],
                            'name'=> $info['name'],
                            'group_url'=> $info['url'],
                            'insert_time'=> time(),
                            'last_update_time'=> time()
                        );
                        if(isset($info['privacy'])){
                            $group_info['privacy'] = $info['privacy'];
                        }
                        if(isset($info['member_count'])){
                            $group_info['member_count'] = $info['member_count'];
                        }
                        //dataBulkUpdateEs('group_info', array($group_info));
                    }
                }
            }elseif($key == 'admined_pages'){
                $account = array();
                $guid_account = $data['dataEx']['network_crawler']['guid_account_info'];
                if($guid_account['account_fid'] && isset($data['dataEx']['network_crawler']['account_'.$guid_account['account_fid']])){
                    $account = $data['dataEx']['network_crawler']['account_'.$guid_account['account_fid']];
                }
                process_admined_pages_save($item, $data['dataEx']['network_crawler']['guid_account_info'], $account);
            }elseif($key == 'page_roles'){
                process_page_roles_save($item);
            }elseif($key == 'page_insights_post'){
                process_page_insights_post($item);
            }elseif($key == 'insights_post_statistic'){
                process_insights_post_statistic($item);
            }elseif($key == 'page_insights_info'){
                process_page_insights_info($item);
            }elseif($key == 'page_insights_audience'){
                process_page_insights_audience($item);
            }elseif($key == 'like_lists'){
                process_fb_like_lists($item);
            }elseif($key == 'following_list'){
                process_fb_following_lists($item);
            }elseif($key=='followers_list'){
                process_fb_followers_list($item);
            }elseif($key=='friends_list'){
                process_fb_friends_list($item);
            }elseif($key=='group_join_detect'){
                process_group_join_detect($item, $last_crawl_operation_id, $data, $machine_ip, $machine_loc);
            }elseif($key == 'fb_create_story'){
                process_fb_create_story($item);
            }elseif($key == 'account_checkpoint'){
                save_fb_account_checkpoint($item);
            }elseif($key == 'instagram_user'){
                foreach($item as $info){
                    process_crawler_ins_account($info, $last_crawl_operation_id, $data, $machine_ip, $machine_loc);
                }
                process_crawler_ins_account_yy($item);
            }elseif($key == 'instagram_tags_post'){
                process_crawler_ins_tag($item, $last_crawl_operation_id, $data, $machine_ip, $machine_loc);
            }elseif($key == 'seach_user'){
                //instagram search user
                instagram_seach_user($item);
            }elseif($key == 'uwants_thread_list'){ //Uwants
                uwants_save_thread_list($item);
            }elseif($key == 'uwants_post_list'){
                uwants_save_post_list($item, $data);
            }elseif($key == 'uwants_profile_list'){
                uwants_save_profile_list($item);
            }elseif($key == 'discuss_thread_list'){ //Discuss
                discuss_save_thread_list($item, $data);
            }elseif($key == 'discuss_post_list'){
                discuss_save_post_list($item, $data);
            }elseif($key == 'discuss_profile_list'){
                discuss_save_profile_list($item);
            }elseif($key == 'mewe_create_post'){
                mewe_save_create_post($item, $data);
            }elseif(strpos($key, 'account_') === 0){
                process_crawler_account_info($item, $last_crawl_operation_id, $data, $machine_ip, $machine_loc);
                if(isset($item['identity'])){
                    $crawl_fids = array_diff($crawl_fids, array($item['identity']));
                }
            }elseif(strpos($key, 'not_available_') === 0){
                process_crawler_not_available($item, $last_crawl_operation_id, $data, $machine_ip, $machine_loc);
            }elseif(strpos($key, 'post_not_available_') === 0){
                process_crawler_post_not_available($item, $last_crawl_operation_id, $machine_ip, $machine_loc);
            }elseif(strpos($key, 'single_post_') === 0){
                process_crawler_single_post($item[0], $last_crawl_operation_id, $data, $machine_ip, $machine_loc);
            }elseif(strpos($key, 'post_') === 0){
                process_post_data_save($item);
            }
        }
    }
    if($crawl_fids){
        $update_time = array(
            'status'=>'r',
            'last_crawl_operation_id'=> $last_crawl_operation_id,
            'last_crawl_operation_status'=> 'f'
        );
        db_update('tb_fb_account_crawler_task')->fields($update_time)->condition('account_fid', $crawl_fids)->execute();
    }
    $message = 'not found crawler account info';
    if($messages){
        $message = to_json($messages);
    }
    //tb_fb_account_crawler_task crawl_get_time status
    $exists = db_select('tb_fb_account_crawler_task', 'a')->fields('a', array('id','account_fid','project_name','status','crawl_get_time','crawl_finish_time','last_crawl_loc','last_crawl_machine_ip'))->condition('exec_id', $exec_id)->execute()->fetchAssoc();
    if($exists){
        if($exists['status']=='p'){
            db_update('tb_fb_account_crawler_task')->fields(array('status'=>'r'))->condition('exec_id', $exec_id)->execute();
        }
        //history status
        $history = array(
            'account_fid'=> $exists['account_fid'],
            'project_name'=> $exists['project_name'],
            'exec_id'=> $exec_id,
            'status'=> $exists['status'],
            'crawl_get_time'=> $exists['crawl_get_time'],
            'crawl_finish_time'=> $exists['crawl_finish_time'],
            'last_crawl_loc'=> $exists['last_crawl_loc'],
            'last_crawl_machine_ip'=> $exists['last_crawl_machine_ip'],
            'insert_time'=> time()
        );
        db_insert('tb_fb_account_crawler_history')->fields($history)->execute();
    }
    return array('success'=>true, 'msg'=>$message);
}

function process_crawler_account_info($item, $last_crawl_operation_id, $data, $machine_ip, $machine_loc){
    global $combat_db_options, $machines_maps;
    $page_type_map = array('Page'=>1, 'User'=>2, 'Group'=>3);
    if(!isset($item['identity'])){
        return;
    }
    if(!$machine_ip){
        $machine_ip = get_ip();
    }
    if(!$machine_loc && isset($machines_maps[$machine_ip])){
        $machine_loc = $machines_maps[$machine_ip];
    }
    $fid = $item['identity'];
    $user_info = array(
        'id'=> 'facebook_' . $fid,
        'site'=> 'facebook',
        'user_iid'=> $fid,
        'available'=> 'y',
        'user_name'=> $item['account'],
        'profile_url'=> $item['home_url'],
        'user_image_url'=> $item['ui_image_url'],
        'page_type'=> 1,
        'source_iid'=> array('hb_account'),
        'insert_time'=> time(),
        'last_update_time'=> time()
    );
    $update_item = array(
        'account'=> filterEmoji($item['account']),
        'profile_picture'=> $item['ui_image_url'],
        'last_crawl_operation_id'=> $last_crawl_operation_id,
        'last_crawl_operation_status'=> 's',
        //'crawl_content'=> to_json($data),
        'last_crawl_loc'=> $machine_loc,
        'last_crawl_machine_ip'=> $machine_ip
    );
    if(isset($page_type_map[$item['page_type']])){
        $user_info['page_type'] = $page_type_map[$item['page_type']];
    }
    if(isset( $item['friends'])){
        $user_info['friends_count'] = intval($item['friends']);
        $update_item['friends_count'] = intval($item['friends']);
    }
    if(isset($item['member_count'])){
        $user_info['member_count'] = intval($item['member_count']);
        $update_item['member_count'] = intval($item['member_count']);
    }
    if(isset($item['following_count'])){
        $update_item['following_count'] = intval($item['following_count']);
    }
    if(isset($item['followers_count'])){
        $update_item['followers_count'] = intval($item['followers_count']);
    }
    if(isset($item['likes_count'])){
        $update_item['likes_count'] = intval($item['likes_count']);
    }
    if(isset($item['privacy'])){
        $update_item['privacy'] = $item['privacy'];
    }
    if(isset($item['gender'])){
        $update_item['gender'] = $item['gender'];
    }
    if(isset($item['about'])){
        $update_item['description'] = $item['about'];
    }
    $hometown = '';
    $current_city = '';
    $moved_city = '';
    $education = '';
    $work = '';
    if(isset($item['hometown']) && isset($item['hometown']['name']) && $item['hometown']['name']){
        $update_item['hometown'] = $item['hometown']['name'];
        $hometown = $item['hometown']['name'];
    }
    if(isset($item['current_city']) && isset($item['current_city']['name']) && $item['current_city']['name']){
        $update_item['current_city'] = $item['current_city']['name'];
        $current_city = $item['current_city']['name'];
    }
    if(isset($item['moved_city']) && isset($item['moved_city']['name']) && $item['moved_city']['name']){
        $update_item['moved_city'] = $item['moved_city']['name'];
        $moved_city = $item['moved_city']['name'];
    }
    if(isset($item['cover_image_url']) && $item['cover_image_url']){
        $update_item['cover_picture'] = $item['cover_image_url'];
    }
    if(isset($item['education']) && $item['education']){
        $educations = array();
        foreach($item['education'] as $edu_info){
            if($edu_info['type'] && $edu_info['school']['name']){
                $educations[] = $edu_info['type'] .' ' . $edu_info['school']['name'];
            }
        }
        if($educations){
            $update_item['education'] = to_json($educations);
            $education = to_json($educations);
        }
    }
    if(isset($item['work']) && $item['work']){
        $works = array();
        foreach($item['work'] as $work_info){
            if($work_info['position']['name'] == 'No workplaces to show'){
                continue;
            }
            $works[] = to_json($work_info);
        }
        if($works){
            $update_item['work'] = to_json($works);
            $work = to_json($works);
        }
    }

    try{
        //dataBulkUpdateEs('mass_audience', array($user_info));
        $messages[] = 'save account info success';
    }catch(Exception $e){
        return array('success'=>false, 'msg'=>$e->getMessage());
    }
    if(isset($item['brand_fid']) && $item['brand_fid']){
        $brand_fid = $item['brand_fid'];
        $task = db_select('tb_fb_account_crawler_task', 't')->fields('t', array('id','brand_fid'))->condition('account_fid', $brand_fid)->execute()->fetchAssoc();
        if($task){
            try{
                $task_info = array(
                    'account_fid'=> $fid,
                    'brand_fid'=> $brand_fid
                );
                db_update('tb_fb_account_crawler_task')->fields($task_info)->condition('id', $task['id'])->execute();
            }catch(Exception $e){}
        }
    }
    $project_name = db_select('tb_fb_account_crawler_task', 'a')->fields('a', array('project_name'))->condition('account_fid', $fid)->execute()->fetchField();
    if(!$project_name && isset($item['origin_fid']) && $item['origin_fid'] && $item['origin_fid']!=$fid){
        $project_name = db_select('tb_fb_account_crawler_task', 'a')->fields('a', array('project_name'))->condition('account_fid', $item['origin_fid'])->execute()->fetchField();
    }
    /**
    if(!in_array($project_name, array('hk01','hwp_0822')) && $user_info['page_type']==2 && !isset($item['likes_count'])){
        if(isset($item['work'])){
            $update_item['status'] = 's';
            $update_item['crawl_finish_time'] = time();
        }
    }else{
        $update_item['status'] = 's';
        $update_item['crawl_finish_time'] = time();
    }
    **/
    $update_item['status'] = 's';
    $update_item['crawl_finish_time'] = time();
    if(!$project_name) {
        $update_item['account_fid'] = $fid;
        $update_item['project_name'] = 'crawler_return';
        if(isset($item['origin_fid'])){
            $update_item['origin_fid'] = $item['origin_fid'];
        }
        db_insert('tb_fb_account_crawler_task')->fields($update_item)->execute();
    }else{
        $ret = db_update('tb_fb_account_crawler_task')->fields($update_item)->condition('account_fid', $fid)->execute();
        if(isset($item['origin_fid']) && $item['origin_fid'] && $item['origin_fid']!=$fid){
            if(!$ret){
                $update_item['account_fid'] = $fid;
                $update_item['origin_fid'] = $item['origin_fid'];
                db_update('tb_fb_account_crawler_task')->fields($update_item)->condition('account_fid', $item['origin_fid'])->execute();
            }else{
                db_update('tb_fb_account_crawler_task')->fields(array('origin_fid'=>$item['origin_fid']))->condition('account_fid', $fid)->execute();
                db_delete('tb_fb_account_crawler_task')->condition('account_fid', $item['origin_fid'])->execute();
            }
        }
        $update_sql = "update tb_fb_account_crawler_task set crawl_count=crawl_count+1 where account_fid='" . $fid . "'";
        db_query($update_sql, array());
    }
    // yy monitor
    if($item['page_type'] == 'User'){
        $info = array(
            'crawl_available'=> 'y',
            'account'=> $item['account'],
            'profile_url'=> $item['home_url'],
            'photo_image_url'=> get_value_from_array($item, 'ui_image_url', ''),
            'cover_image_url'=> get_value_from_array($item, 'cover_image_url', ''),
            'last_update_time'=> time()
        );
        if(isset( $item['friends'])){
            $info['friends_count'] = intval($item['friends']);
        }
        if(isset($item['followers_count'])){
            $info['followers_count'] = intval($item['followers_count']);
        }
        if(isset($item['gender'])){
            $info['gender'] = $item['gender'];
        }
        db_update('tb_guid_account_fb_yy')->fields($info)->condition('account_fid', $fid)->execute();
    }
    $family = '';
    if(isset($item['family']) && $item['family']){
        $family = to_json($item['family']);
    }
    $left_events = '';
    if(isset($item['left_events']) && $item['left_events']){
        $left_events = to_json($item['left_events']);
    }
    //yjg account
    $info = array(
        'fid'=> $fid,
        'origin_fid'=> get_value_from_array($item, 'origin_fid', ''),
        'account_type'=> $item['page_type'],
        'profile_url'=> $item['home_url'],
        'account'=> $item['account'],
        'nick'=> get_value_from_array($item, 'nick', ''),
        'gender'=> get_value_from_array($item, 'gender', ''),
        'photo_image_url'=> $item['ui_image_url'],
        'cover_image_url'=> get_value_from_array($item, 'cover_image_url', ''),
        'verification_status'=> get_value_from_array($item, 'verification_status', ''),
        'friends_count'=> get_value_from_array($item, 'friends', 0),
        'likes_count'=> get_value_from_array($item, 'likes_count', 0),
        'followers_count'=> get_value_from_array($item, 'followers_count', 0),
        'following_count'=> get_value_from_array($item, 'following_count', 0),
        'bio'=> get_value_from_array($item, 'bio', ''),
        'about_me'=> get_value_from_array($item, 'about_me', ''),
        'quotes'=> get_value_from_array($item, 'quotes', ''),
        'category'=> get_value_from_array($item, 'category', ''),
        'address'=> get_value_from_array($item, 'address', ''),
        'profile_phone'=> get_value_from_array($item, 'profile_phone', ''),
        'profile_email'=> get_value_from_array($item, 'profile_email', ''),
        'website'=> get_value_from_array($item, 'website', ''),
        'instagram'=> get_value_from_array($item, 'instagram', ''),
        'business_hours'=> get_value_from_array($item, 'business_hours', ''),
        'page_id'=> get_value_from_array($item, 'page_id', ''),
        'creation_date'=> get_value_from_array($item, 'creation_date', ''),
        'ad_status'=> get_value_from_array($item, 'ad_status', ''),
        'confirmed_owner'=> get_value_from_array($item, 'confirmed_owner', ''),
        'birthday'=> get_value_from_array($item, 'birthday', ''),
        'hometown'=> $hometown,
        'current_city'=> $current_city,
        'moved_city'=> $moved_city,
        'education'=> $education,
        'work'=> $work,
        'family'=> $family,
        'left_events'=> $left_events,
        'crawl_available'=> 'y',
        'last_update_time'=> time()
    );
    remove_empty_in_map($info);
    $exists = db_select('tb_fb_account_yjg', 'a')->fields('a', array('id'))->condition('fid', $fid)->execute()->fetchAssoc();
    if(!$exists){
        $url_md5 = md5($item['home_url']);
        $exists = db_select('tb_fb_account_yjg', 'a')->fields('a', array('id'))->condition('url_md5', $url_md5)->execute()->fetchAssoc();
    }
    if($exists){
        db_update('tb_fb_account_yjg')->fields($info)->condition('id', $exists['id'])->execute();
    }else{
        db_insert('tb_fb_account_yjg')->fields($info)->execute();
    }

    if($item['page_type'] == 'Group'){
        $info = array(
            'group_fid'=> $fid,
            'name'=> $item['account'],
            'group_picture'=> $item['ui_image_url'],
            'description'=> get_value_from_array($item, 'about'),
            'group_type'=> get_value_from_array($item, 'group_type'),
            'privacy'=> get_value_from_array($item, 'privacy'),
            'member_count'=> get_value_from_array($item, 'member_count'),
            'post_last_day'=> get_value_from_array($item, 'number_of_posts_in_last_day', 0),
            'posts_30_day'=> get_value_from_array($item, 'number_of_posts_in_last_month', 0),
            'location'=> get_value_from_array($item, 'location'),
            'group_create_time'=> get_value_from_array($item, 'create_time'),
            'group_available'=> 'y',
            'update_time'=> time()
        );
        remove_empty_in_map($info);
        $exist = db_select('tb_fb_group_info_yy', 'g')->fields('g', array('id'))->condition('group_fid', $fid)->execute()->fetchAssoc();
        if($exist){
            db_update('tb_fb_group_info_yy')->fields($info)->condition('group_fid', $fid)->execute();
        }else{
            db_insert('tb_fb_group_info_yy')->fields($info)->execute();
        }
    }else{
        $info = array(
            'page_fid'=> $fid,
            'update_time'=> time()
        );
        $check_fields = array(
            'origin_fid','page_type','category','creation_date','profile_url','account','nick','gender','address',
            'photo_image_url','cover_image_url','likes_count','followers_count','bio','about_me'
        );
        foreach($check_fields as $field){
            if(isset($item[$field])){
                $info[$field] = $item[$field];
            }
        }
        $exists = db_select('tb_fb_page_info_yy', 'p')->fields('p', array('id'))->condition('page_fid', $fid)->execute()->fetchAssoc();
        if(!$exists){
            $exists = db_select('tb_fb_page_info_yy', 'p')->fields('p', array('id'))->condition('origin_fid', $fid)->execute()->fetchAssoc();
        }
        if(!$exists && isset($item['origin_fid'])){
            $exists = db_select('tb_fb_page_info_yy', 'p')->fields('p', array('id'))->condition('page_fid', $item['origin_fid'])->execute()->fetchAssoc();
        }
        if(!$exists){
            $exists = db_select('tb_fb_page_info_yy', 'p')->fields('p', array('id'))->condition('page_url', $item['home_url'].'%', 'like')->execute()->fetchAssoc();
        }
        if($exists){
            db_update('tb_fb_page_info_yy')->fields($info)->condition('id', $exists['id'])->execute();
        }
    }

    //guid account
    if(isset($item['loc'])){
        $account = array(
            'account_id'=> $item['account_id'],
            'account_fid'=> $item['identity'],
            'loc'=> $item['loc'],
            'account'=> $item['account'],
            'gender'=> $item['gender'],
            'profile_image_url'=> $item['ui_image_url'],
            'update_time'=> time(),
            'last_crawl_time'=> time()
        );
        if(isset($item['friends'])){
            $account['friends_count'] = $item['friends'];
        }
        $exists = db_select('tb_account_crawler_info', 'a', $combat_db_options)->fields('a', array('account_id'))->condition('account_fid', $account['account_fid'])->execute()->fetchAssoc();
        if($exists){
            db_update('tb_account_crawler_info', $combat_db_options)->fields($account)->condition('account_id', $item['account_id'])->execute();
        }else{
            $account['insert_time'] = time();
            db_insert('tb_account_crawler_info', $combat_db_options)->fields($account)->execute();
        }
    }
    //manage page
    $page = db_select('dt_fb_manage_pages', 'p', $combat_db_options)->fields('p', array('id'))->condition('page_fid', $fid)->execute()->fetchAssoc();
    if($page){
        $update_page = array(
            'name'=> $item['account'],
            'origin_fid'=> get_value_from_array($item, 'origin_fid', null),
            'page_likers'=> get_value_from_array($item, 'likes_count', null),
            'followers_count'=> get_value_from_array($item, 'followers_count', null),
            'profile_picture'=> get_value_from_array($item, 'ui_image_url', null),
            'cover_picture'=> get_value_from_array($item, 'cover_image_url', null),
            'category'=> get_value_from_array($item, 'category', null),
            'creation_date'=> get_value_from_array($item, 'creation_date', null),
            'last_update_time'=> time()
        );
        remove_empty_in_map($update_page);
        if($update_page){
            db_update('dt_fb_manage_pages', $combat_db_options)->fields($update_page)->condition('page_fid', $fid)->execute();
        }
    }
    if(isset($data['dataEx']['network_crawler']['page_roles'])){

    }
    //tb_fb_account_urls_map
    if(isset($data['dataEx']['network_crawler']['crawlGroupPermeation']) && isset($data['dataEx']['network_crawler']['crawlGroupPermeation']['params']['crawlerUrl'])){
        $url = $data['dataEx']['network_crawler']['crawlGroupPermeation']['params']['crawlerUrl'];
        $url_md5 = md5($url);
        $info = array(
            'account_fid'=> $fid,
            'status'=> 's',
            'crawl_finish_time'=> time()
        );
        $crawl_account_count = 0;
        foreach($data['dataEx']['network_crawler'] as $key=>$data_item){
            if(strpos($key, 'account_') === 0){
                $crawl_account_count++;
            }
        }
        if($crawl_account_count==1 || $item['home_url']==$url){
            db_update('tb_fb_account_urls_map')->fields($info)->condition('account_url_md5', $url_md5)->execute();
        }
    }
    //tb_fb_crawler_accounts, crawl feed
    $exists = db_select('tb_fb_crawler_accounts', 'a')->fields('a', array('id'))->condition('account_fid', $fid)->execute()->fetchAssoc();
    if($exists){
        $info = array(
            'name'=> $item['account'],
            'profile_url'=> $item['home_url'],
            'profile_image_url'=> $item['ui_image_url'],
            'update_time'=> time()
        );
        db_update('tb_fb_crawler_accounts')->fields($info)->condition('account_fid', $fid)->execute();
    }
}

function process_crawler_ins_account($item, $last_crawl_operation_id, $data, $machine_ip, $machine_loc){
    global $combat_db_options, $machines_maps;
    if(!isset($item['username'])){
        return;
    }
    if(!$machine_ip){
        $machine_ip = get_ip();
    }
    if(!$machine_loc && isset($machines_maps[$machine_ip])){
        $machine_loc = $machines_maps[$machine_ip];
    }
    $username = $item['username'];
    $update_item = array(
        'name'=> $item['name'],
        'posts_count'=> $item['posts_count'],
        'followed_count'=> $item['followed_count'],
        'edge_follow_count'=> $item['edge_follow_count'],
        'status'=>'s',
        'crawl_finish_time'=> time(),
        'last_crawl_operation_id'=> $last_crawl_operation_id,
        'last_crawl_operation_status'=> 's',
        'crawl_content'=> to_json($data),
        'last_crawl_loc'=> $machine_loc,
        'last_crawl_machine_ip'=> $machine_ip
    );
    db_update('tb_ins_account_crawler_task')->fields($update_item)->condition('ins_username', $username)->execute();
    $update_sql = "update tb_ins_account_crawler_task set crawl_count=crawl_count+1 where ins_username='" . $username . "'";
    db_query($update_sql, array());
}

function process_crawler_ins_tag($item, $last_crawl_operation_id, $data, $machine_ip, $machine_loc){
    global $combat_db_options, $machines_maps;
    if(!isset($item['tag'])){
        return;
    }
    if(!$machine_ip){
        $machine_ip = get_ip();
    }
    if(!$machine_loc && isset($machines_maps[$machine_ip])){
        $machine_loc = $machines_maps[$machine_ip];
    }
    $tag = $item['tag'];
    $update_item = array(
        'status'=>'s',
        'crawl_finish_time'=> time(),
        'last_crawl_operation_id'=> $last_crawl_operation_id,
        'last_crawl_operation_status'=> 's',
        'crawl_content'=> to_json($data),
        'last_crawl_loc'=> $machine_loc,
        'last_crawl_machine_ip'=> $machine_ip
    );
    db_update('tb_ins_account_crawler_task')->fields($update_item)->condition('ins_username', $tag)->execute();
    $update_sql = "update tb_ins_account_crawler_task set crawl_count=crawl_count+1 where ins_username='" . $tag . "'";
    db_query($update_sql, array());
}

function process_ins_name_available($info){
    if($info['ins_id'] && $info['ins_title']){
        $title = $info['ins_title'];
        if(strpos($title, '找不到页面')!==false || strpos($title, 'Page not found')!==false){
            $update_item = array(
                'available'=> 'n',
                'status'=> 's'
            );
            db_update('tb_ins_account_crawler_task')->fields($update_item)->condition('id', $info['ins_id'])->execute();
        }
    }
}

function process_crawler_not_available($item, $last_crawl_operation_id, $data, $machine_ip, $machine_loc){
    global $machines_maps;
    if(!$machine_ip){
        $machine_ip = get_ip();
    }
    if(!$machine_loc && isset($machines_maps[$machine_ip])){
        $machine_loc = $machines_maps[$machine_ip];
    }
    $url = $item['url'];
    $fid = str_replace('https://www.facebook.com/', '', $url);
    if($fid){
        $account = db_select('tb_fb_account_crawler_task', 'a')->fields('a', array('id'))->condition('account_fid', $fid)->execute()->fetchAssoc();
        if($account){
            $update_item = array(
                'status'=>'s',
                'available'=> 'n',
                'crawl_finish_time'=> time(),
                'last_crawl_operation_id'=> $last_crawl_operation_id,
                'last_crawl_operation_status'=> 's',
                'last_crawl_loc'=> $machine_loc,
                'last_crawl_machine_ip'=> $machine_ip
            );
            db_update('tb_fb_account_crawler_task')->fields($update_item)->condition('account_fid', $fid)->execute();
        }else{
            $insert_item = array(
                'account_fid'=> $fid,
                'status'=>'s',
                'available'=> 'n',
                'crawl_finish_time'=> time(),
                'last_crawl_operation_id'=> $last_crawl_operation_id,
                'last_crawl_operation_status'=> 's',
                'last_crawl_loc'=> $machine_loc,
                'last_crawl_machine_ip'=> $machine_ip
            );
            db_insert('tb_fb_account_crawler_task')->fields($insert_item)->execute();
        }

        //yy crawler guid fb account
        $account = db_select('tb_guid_account_fb_yy', 'a')->fields('a', array('id'))->condition('account_fid', $fid)->execute()->fetchAssoc();
        if($account){
            $update_item = array(
                'crawl_available'=> 'n',
                'last_update_time'=> time()
            );
            db_update('tb_guid_account_fb_yy')->fields($update_item)->condition('id', $account['id'])->execute();
        }
        $page = db_select('tb_fb_page_info_yy', 'p')->fields('p', array('id'))->condition('page_fid', $fid)->execute()->fetchAssoc();
        if($page){
            $update_item = array(
                'page_available'=> 'n',
                'update_time'=> time()
            );
            db_update('tb_fb_page_info_yy')->fields($update_item)->condition('id', $page['id'])->execute();
        }
        //yjg
        $account = db_select('tb_fb_account_yjg', 'a')->fields('a', array('id'))->condition('fid', $fid)->execute()->fetchAssoc();
        if($account){
            $update_item = array(
                'crawl_available'=> 'n',
                'last_update_time'=> time()
            );
            db_update('tb_fb_account_yjg')->fields($update_item)->condition('id', $account['id'])->execute();
        }
    }
    //tb_fb_account_urls_map
    if(isset($data['dataEx']['network_crawler']['crawlGroupPermeation']) && isset($data['dataEx']['network_crawler']['crawlGroupPermeation']['params']['crawlerUrl'])) {
        $url_md5 = md5($url);
        $item = array(
            'available'=> 'n',
            'status'=> 's',
            'crawl_finish_time'=> time()
        );
        db_update('tb_fb_account_urls_map')->fields($item)->condition('account_url_md5', $url_md5)->execute();
    }
}

function process_crawler_post_not_available($item, $last_crawl_operation_id, $machine_ip, $machine_loc){
    global $machines_maps;
    if(!$machine_ip){
        $machine_ip = get_ip();
    }
    if(!$machine_loc && isset($machines_maps[$machine_ip])){
        $machine_loc = $machines_maps[$machine_ip];
    }
    $url = $item['url'];
    $post_url_md5 = md5($url);
    $exist = db_select('tb_fb_post_crawler_task', 't')->fields('t', array('id'))->condition('post_url_md5', $post_url_md5)->execute()->fetchAssoc();
    if($exist){
        $item = array(
            'status'=> 's',
            'available'=> 'n',
            'crawl_finish_time'=> time()
        );
        db_update('tb_fb_post_crawler_task')->fields($item)->condition('id', $exist['id'])->execute();
    }
}

function process_crawler_single_post($item, $last_crawl_operation_id, $data, $machine_ip, $machine_loc){
    global $machines_maps;
    if(!$machine_ip){
        $machine_ip = get_ip();
    }
    if(!$machine_loc && isset($machines_maps[$machine_ip])){
        $machine_loc = $machines_maps[$machine_ip];
    }
    if(isset($data['dataEx']['network_crawler']['crawlGroupPermeation']) && isset($data['dataEx']['network_crawler']['crawlGroupPermeation']['params']['postURL'])){
        $url = $data['dataEx']['network_crawler']['crawlGroupPermeation']['params']['postURL'];
    }else{
        $url = $item['url'];
    }
    $url = $url;
    $post_url_md5 = md5($url);
    $exist = db_select('tb_fb_post_crawler_task', 't')->fields('t', array('id'))->condition('post_url_md5', $post_url_md5)->execute()->fetchAssoc();
    if($exist){
        $item = array(
            'status'=> 's',
            'available'=> 'y',
            'crawl_finish_time'=> time(),
            'last_crawl_operation_id'=> $last_crawl_operation_id,
            'last_crawl_operation_status'=> 's',
            'crawl_content'=> to_json($data),
            'last_crawl_loc'=> $machine_loc,
            'last_crawl_machine_ip'=> $machine_ip
        );
        db_update('tb_fb_post_crawler_task')->fields($item)->condition('id', $exist['id'])->execute();
    }
}

function process_crawler_group_post_check($data, $exec_id, $task_exec_status){
    if(!isset($data['guid_es_id']) || !$data['guid_es_id']){
        return;
    }
    $guid_es_id = $data['guid_es_id'];
    $crawl_count = db_select('tb_fb_group_permeation_post_detect', 'p')->fields('p', array('crawl_count'))->condition('guid_es_id', $guid_es_id)->execute()->fetchField();
    if($crawl_count){
        $crawl_count += 1;
    }else{
        $crawl_count = 1;
    }
    $update_time = array(
        'status'=> 's',
        'crawl_content'=> to_json($data),
        'crawl_count'=> $crawl_count,
        'crawl_finish_time'=> time(),
        'last_crawl_operation_status'=> $task_exec_status
    );
    db_update('tb_fb_group_permeation_post_detect')->fields($update_time)->condition('guid_es_id', $guid_es_id)->execute();
    /*
    if(!$exec_id){
        return;
    }
    $update_time = array(
        'status'=> 's',
        'crawl_content'=> to_json($data),
        'crawl_finish_time'=> time(),
        'last_crawl_operation_status'=> $task_exec_status
    );
    db_update('tb_fb_group_permeation_post_detect')->fields($update_time)->condition('exec_id', $exec_id)->execute();
    **/
}

function process_crawler_post_info($data, $exec_id, $task_exec_status){
    if(!$exec_id){
        //return;
    }
    // tb_fb_group_post_crawler_list
    $available = 'y';
    if(isset($data['operator_available']) && $data['operator_available']=='n'){
        $post_fid = $data['post_fid'];
        $available = 'n';
        $post = array(
            'post_available'=> 'n'
        );
    }else{
        $post = array(
            'group_fid'=> $data['group_fid'],
            'user_fid'=> $data['user_iid'],
            'post_time'=> $data['post_time'],
            'user_name'=> $data['user_name'],
            'post_content'=> $data['content'],
            'share_content'=> $data['share_content'],
            'forward_count'=> $data['forward_count'],
            'reply_count'=> $data['reply_count'],
            'emotion_count'=> $data['total_action_count'],
            'praise_count'=> $data['praise_count'],
            'love_count'=> $data['love_count'],
            'laugh_count'=> $data['laugh_count'],
            'wow_count'=> $data['wow_count'],
            'sad_count'=> $data['sad_count'],
            'angry_count'=> $data['angry_count'],
            'care_count'=> $data['care_count'],
            'post_share_link'=> $data['share_link'],
            'share_user_fid'=> $data['share_user_iid'],
            'share_user_name'=> $data['share_user_name'],
            'share_post_fid'=> $data['share_post_iid'],
            'external_url'=> $data['external_url'],
            'post_available'=> 'y',
            'crawl_flag'=> 'n',
            'last_update_time'=> time()
        );

        $post_fid = $data['iid'];
        if(isset($data['screenshot'])){
            $image_content = str_replace('data:image/jpg;base64,', '', $data['screenshot']);
            $image_content = base64_decode($image_content);
            file_put_contents('/data/group_post_images/'.$post_fid.'.jpg', $image_content);
            unset($data['screenshot']);
            $post['screenshot_image'] = $post_fid.'.jpg';
        }
    }

    db_update('tb_fb_group_post_crawler_list')->fields($post)->condition('post_fid', $post_fid)->execute();

    //old HB
    $crawl_count = db_select('tb_fb_group_permeation_post_info', 'p')->fields('p', array('crawl_count'))->condition('post_fid', $post_fid)->execute()->fetchField();
    if($crawl_count){
        $crawl_count += 1;
    }else{
        $crawl_count = 1;
    }
    $update_item = array(
        'post_available'=> $available,
        'status'=> 's',
        'crawl_content'=> to_json($data),
        'crawl_count'=> $crawl_count,
        'crawl_finish_time'=> time(),
        'last_crawl_operation_status'=> $task_exec_status
    );
    db_update('tb_fb_group_permeation_post_info')->fields($update_item)->condition('post_fid', $post_fid)->execute();
}

function process_crawler_tweet_info($info, $exec_id, $task_exec_status){
    $tweet_id = $info['id_str'];
    $tweet_time = strtotime($info['created_at']);
    $media_url_https = '';
    if(isset($info['entities']) && isset($info['entities']['media']) && isset($info['entities']['media'][0])){
        $media_url_https = $info['entities']['media'][0]['media_url_https'];
    }
    $tweet = array(
        'created_at'=> date('Y-m-d H:i:s', $tweet_time),
        'full_text'=> $info['full_text'],
        'in_reply_to_status_id'=> $info['in_reply_to_status_id'],
        'in_reply_to_user_id'=> $info['in_reply_to_user_id'],
        'user_id'=> $info['user_id_str'],
        'screen_name'=> $info['user']['screen_name'],
        'retweet_count'=> $info['retweet_count'],
        'favorite_count'=> $info['favorite_count'],
        'reply_count'=> $info['reply_count'],
        'views_count'=> $info['views'],
        'media_url_https'=> $media_url_https,
        'last_crawl_time'=> time()
    );
    if(isset($info['screenshot'])){
        $image_content = str_replace('data:image/jpg;base64,', '', $info['screenshot']);
        $image_content = base64_decode($image_content);
        file_put_contents('/data/twitter_tweet_images/' . $tweet_id . '.jpg', $image_content);
        unset($info['screenshot']);
        $tweet['screenshot_image'] = $tweet_id.'.jpg';
    }
    db_update('tb_tw_tweet_crawler_list')->fields($tweet)->condition('tweet_id', $tweet_id)->execute();
}

function process_group_join_detect($item, $last_crawl_operation_id, $data, $machine_ip, $machine_loc){
    foreach($item as $info){
        if($info['group_fid'] && $info['account_fid']){
            $group_fid = $info['group_fid'];
            $user_fid = $info['account_fid'];
            $update = array(
                'is_permeation'=> $info['is_permetion'],
                'last_update_time'=> time()
            );
            db_update('tb_fb_group_user_post_monitor')->fields($update)->condition('group_fid', $group_fid)->condition('user_fid', $user_fid)->execute();
        }

        $task = db_select('tb_fb_group_permeation_join_group', 'p')->fields('p', array('id','crawl_count'))->condition('group_fid', $info['group_fid'])->condition('account_fid', $info['account_fid'])->execute()->fetchAssoc();
        if($task){
            $update_item = array(
                'is_permeation'=> $info['is_permetion'],
                'status'=>'s',
                'crawl_count'=> $task['crawl_count'] + 1,
                'crawl_finish_time'=> time(),
                'last_crawl_operation_id'=> $last_crawl_operation_id,
                'last_crawl_operation_status'=> 's'
            );
            db_update('tb_fb_group_permeation_join_group')->fields($update_item)->condition('id', $task['id'])->execute();
        }
    }
}

function is_cn_traditional($str){
    //筛选出所有中文字符
    $str = preg_replace('/[^\x{4e00}-\x{9fa5}]/u','', $str);
    if(!$str){
        return false;
    }
    return @iconv('UTF-8', 'GB2312', $str) === false ? true : false;
}

function process_group_user_posts($infos){
    if($infos){
        $first = $infos[0];
        $group_fid = $first['group_fid'];
        $user_fid = $first['user_iid'];
        $update = array(
            'user_name'=> $first['user_name'],
            'last_update_time'=> time()
        );
        db_update('tb_fb_group_user_post_monitor')->fields($update)->condition('group_fid', $group_fid)->condition('user_fid', $user_fid)->execute();
    }
    foreach($infos as $post){
        $info = array(
            'group_fid'=> $post['group_fid'],
            'user_fid'=> $post['user_iid'],
            'post_fid'=> $post['iid'],
            'post_time'=> $post['post_time'],
            'user_name'=> $post['user_name'],
            'post_content'=> $post['content'],
            'share_content'=> $post['share_content'],
            'share_image_in_content_url'=> $post['share_image_in_content_url'],
            'post_share_link'=> $post['share_link'],
            'share_user_fid'=> $post['share_user_iid'],
            'share_user_name'=> $post['share_user_name'],
            'share_post_fid'=> $post['share_post_iid'],
            'external_url'=> $post['external_url'],
            'forward_count'=> $post['forward_count'],
            'reply_count'=> $post['reply_count'],
            'emotion_count'=> $post['total_action_count'],
            'praise_count'=> $post['praise_count'],
            'love_count'=> $post['love_count'],
            'laugh_count'=> $post['laugh_count'],
            'wow_count'=> $post['wow_count'],
            'sad_count'=> $post['sad_count'],
            'angry_count'=> $post['angry_count'],
            'care_count'=> $post['care_count'],
            'update_time'=> time()
        );
        if(isset($post['image_in_content'])){
            $info['image_in_content'] = $post['image_in_content'];
        }
        $exists = db_select('tb_fb_group_post_crawler_list', 'p')->fields('p', array('id'))->condition('post_fid', $post['iid'])->execute()->fetchAssoc();
        if($exists){
            db_update('tb_fb_group_post_crawler_list')->fields($info)->condition('post_fid', $post['iid'])->execute();
        }else{
            $info['insert_time'] = time();
            db_insert('tb_fb_group_post_crawler_list')->fields($info)->execute();
        }
    }
    // old process by HB
    foreach($infos as $post){
        $info = array(
            'group_fid'=> $post['group_fid'],
            'account_fid'=> $post['user_iid'],
            'post_fid'=> $post['iid'],
            'post_time'=> $post['post_time'],
            'post_content'=> $post['content'],
            'post_share_link'=> $post['share_link'],
            'share_user_fid'=> $post['share_user_iid'],
            'share_user_name'=> $post['share_user_name'],
            'share_post_fid'=> $post['share_post_iid'],
            'crawl_content'=> to_json(array('post_info'=>$post)),
            'update_time'=> time()
        );
        $exists = db_select('tb_fb_group_post_list', 'p')->fields('p', array('id'))->condition('post_fid', $post['iid'])->execute()->fetchAssoc();
        if($exists){
            db_update('tb_fb_group_post_list')->fields($info)->condition('post_fid', $post['iid'])->execute();
        }else{
            $info['insert_time'] = time();
            db_insert('tb_fb_group_post_list')->fields($info)->execute();
        }
    }
}

function process_post_data_save($infos){
    $post_list = array();
    foreach($infos as $post){
        $content = $post['content'];
        $post_info = array(
            //'id'=> $post['user_iid'] . '_' . $post['iid'],
            'url'=> $post['url'],
            'iid'=> $post['iid'],
            'post_time'=> $post['post_time'],
            'content'=> $content,
            'image_in_content_url'=> $post['image_in_content_url'],
            'video'=> get_value_from_array($post, 'video', ''),
            'share_video'=> get_value_from_array($post, 'share_video', ''),
            'video'=> get_value_from_array($post, 'video', ''),
            'forward_count'=> $post['forward_count'],
            'reply_count'=> $post['reply_count'],
            'praise_count'=> $post['praise_count'],
            'love_count'=> $post['love_count'],
            'laugh_count'=> $post['laugh_count'],
            'wow_count'=> $post['wow_count'],
            'sad_count'=> $post['sad_count'],
            'angry_count'=> $post['angry_count'],
            'total_action_count'=> $post['total_action_count'],
            'is_share'=> $post['is_share'],
            'share_link'=> get_value_from_array($post, 'share_link', ''),
            'share_user_name'=> get_value_from_array($post, 'share_user_name', ''),
            'share_user_iid'=> get_value_from_array($post, 'share_user_iid', ''),
            'share_user_profile_image_url'=> get_value_from_array($post, 'share_user_profile_image_url', ''),
            'share_post_id'=> get_value_from_array($post, 'share_post_iid', ''),
            'share_content'=> get_value_from_array($post, 'share_content', ''),
            'share_image_in_content_url'=> get_value_from_array($post, 'share_image_in_content_url', ''),
            'share_video'=> get_value_from_array($post, 'share_video', ''),
            'user_name'=> $post['user_name'],
            'user_iid'=> $post['user_iid'],
            'user_image_url'=> $post['user_image_url'],
            'owner_user_id'=> $post['user_iid'],
            'can_viewer_comment'=> isset($post['can_viewer_comment']) && $post['can_viewer_comment']? 'y' : 'n',
            'can_viewer_like'=> isset($post['can_viewer_like']) && $post['can_viewer_like']? 'y' : 'n',
            'can_viewer_react'=> isset($post['can_viewer_react']) && $post['can_viewer_react']? 'y' : 'n',
            'insert_time'=> time(),
            'last_update_time'=> time()
        );
        if(isset($post['group_fid'])){
            $post_info['owner_group_id'] = $post['group_fid'];
        }
        if($content){
            if(is_cn_traditional($content)){
                $post_info['content_language'] = 'cn_traditional';
            }
        }

        $exists = db_select('tb_fb_post_list_yy', 'p')->fields('p', array('id'))->condition('iid', $post['iid'])->execute()->fetchAssoc();
        if($exists){
            db_update('tb_fb_post_list_yy')->fields($post_info)->condition('iid', $post['iid'])->execute();
        }else{
            $post_info['insert_time'] = time();
            db_insert('tb_fb_post_list_yy')->fields($post_info)->execute();
        }

        $post_list[] = $post_info;
        if(count($post_list) > 100){
            //dataBulkUpdateEs('post', $post_list);
            $post_list = array();
        }
    }
    if(count($post_list) > 0){
        //dataBulkUpdateEs('post', $post_list);
    }
}

function process_feed_post_list($infos){
    $update_time = time();
    $account_infos = array();
    foreach($infos as $post){
        get_value_from_array($post, 'viewer_account_fid', '');
        $viewer_account_fid = '';
        if(isset($post['viewer_account_fid']) && $post['viewer_account_fid']){
            $viewer_account_fid = $post['viewer_account_fid'];
            if(!isset($account_infos[$viewer_account_fid])){
                $account_infos[$viewer_account_fid] = array();
            }
            $account_infos[$viewer_account_fid][] = $post['post_time'];
        }
        $content = $post['content'];
        $post_info = array(
            'url'=> $post['url'],
            'iid'=> $post['iid'],
            'post_time'=> $post['post_time'],
            'content'=> filterEmoji($content),
            'image_in_content_url'=> $post['image_in_content_url'],
            'video'=> get_value_from_array($post, 'video', ''),
            'share_video'=> get_value_from_array($post, 'share_video', ''),
            'video'=> get_value_from_array($post, 'video', ''),
            'forward_count'=> $post['forward_count'],
            'reply_count'=> $post['reply_count'],
            'praise_count'=> $post['praise_count'],
            'love_count'=> $post['love_count'],
            'laugh_count'=> $post['laugh_count'],
            'wow_count'=> $post['wow_count'],
            'sad_count'=> $post['sad_count'],
            'angry_count'=> $post['angry_count'],
            'total_action_count'=> $post['total_action_count'],
            'is_share'=> $post['is_share'],
            'share_link'=> get_value_from_array($post, 'share_link', ''),
            'share_user_name'=> get_value_from_array($post, 'share_user_name', ''),
            'share_user_iid'=> get_value_from_array($post, 'share_user_iid', ''),
            'share_user_profile_image_url'=> get_value_from_array($post, 'share_user_profile_image_url', ''),
            'share_post_id'=> get_value_from_array($post, 'share_post_iid', ''),
            'share_content'=> get_value_from_array($post, 'share_content', ''),
            'share_image_in_content_url'=> get_value_from_array($post, 'share_image_in_content_url', ''),
            'share_video'=> get_value_from_array($post, 'share_video', ''),
            'user_name'=> $post['user_name'],
            'user_iid'=> $post['user_iid'],
            'user_image_url'=> $post['user_image_url'],
            'owner_user_id'=> $post['user_iid'],
            'can_viewer_comment'=> isset($post['can_viewer_comment']) && $post['can_viewer_comment']? 'y' : 'n',
            'can_viewer_like'=> isset($post['can_viewer_like']) && $post['can_viewer_like']? 'y' : 'n',
            'can_viewer_react'=> isset($post['can_viewer_react']) && $post['can_viewer_react']? 'y' : 'n',
            'viewer_account_fid'=> $viewer_account_fid,
            'last_update_time'=> $update_time
        );
        if(isset($post['group_fid'])){
            $post_info['owner_group_id'] = $post['group_fid'];
        }
        if($content){
            if(is_cn_traditional($content)){
                $post_info['content_language'] = 'cn_traditional';
            }
        }
        $exists = db_select('tb_fb_feeds_post_list', 'p')->fields('p', array('id'))->condition('iid', $post['iid'])->execute()->fetchAssoc();
        if($exists){
            db_update('tb_fb_feeds_post_list')->fields($post_info)->condition('iid', $post['iid'])->execute();
        }else{
            $post_info['insert_time'] = time();
            db_insert('tb_fb_feeds_post_list')->fields($post_info)->execute();
        }
    }
    foreach($account_infos as $fid=>$timeArr){
        sort($timeArr);
        $min_time = $timeArr[0];
        $max_time = end($timeArr);
        $account_item = array(
            'crawl_feeds_time'=> $update_time,
            'min_post_time'=> $min_time,
            'max_post_time'=> $max_time,
            'crawl_feeds_post_num'=> count($timeArr)
        );
        db_update('tb_fb_crawler_accounts')->fields($account_item)->condition('account_fid', $fid)->execute();
        $account_item['account_fid'] = $fid;
        db_insert('tb_fb_crawler_feeds_logs')->fields($account_item)->execute();
    }
}

function process_admined_pages_save($pages, $guid_account, $account){
    global $combat_db_options;
    $now_time = time();
    if(!isset($guid_account['account_fid'])){
        return;
    }
    $account_fid = $guid_account['account_fid'];
    foreach($pages as $page){
        $page_fid = $page['page_fid'];
        if($account_fid == $page_fid){
            continue;
        }
        $item = array(
            'page_fid'=> $page_fid,
            'name'=> $page['name'],
            'page_type'=> $page['type'],
            'profile_picture'=> $page['profile_picture']
        );
        if(isset($page['delegate_page_id'])){
            $item['origin_fid'] = $page['delegate_page_id'];
        }
        if(isset($page['page_likers'])){
            $item['page_likers'] = $page['page_likers'];
        }
        if(isset($page['follower_count'])){
            $item['follower_count'] = $page['follower_count'];
        }
        if(isset($page['category'])){
            $item['category'] = $page['category'];
        }
        $existPage = db_select('dt_fb_manage_pages', 'p', $combat_db_options)->fields('p', array('id'))->condition('page_fid', $page_fid)->execute()->fetchAssoc();
        if(!$existPage && isset($page['delegate_page_id'])){
            $existPage = db_select('dt_fb_manage_pages', 'p', $combat_db_options)->fields('p', array('id'))->condition('page_fid', $page['delegate_page_id'])->execute()->fetchAssoc();
        }
        if($existPage){
            $item['last_update_time'] = time();
            db_update('dt_fb_manage_pages', $combat_db_options)->fields($item)->condition('id', $existPage['id'])->execute();
        }else{
            $item['insert_time'] = time();
            db_insert('dt_fb_manage_pages', $combat_db_options)->fields($item)->execute();
        }
        $exist_relation = db_select('dt_fb_account_manage_page_relation', 'r', $combat_db_options)->fields('r', array('id'))->condition('account_fid', $account_fid)->condition('page_fid', $page_fid)->execute()->fetchAssoc();
        if(!$exist_relation){
            $item = array(
                'account_fid'=> $account_fid,
                'page_fid'=> $page_fid,
                'last_update_time'=> $now_time,
                'insert_time'=> $now_time
            );
            if($account){
                $update_item['account_name'] = $account['account'];
                $update_item['gender'] = $account['gender'];
                $update_item['profile_pic_url'] = $account['ui_image_url'];
            }
            db_insert('dt_fb_account_manage_page_relation', $combat_db_options)->fields($item)->execute();
        }else{
            $update_item = array(
                'available'=> 'y',
                'last_update_time'=> $now_time
            );
            if($account){
                $update_item['account_name'] = $account['account'];
                $update_item['gender'] = $account['gender'];
                $update_item['profile_pic_url'] = $account['ui_image_url'];
            }
            db_update('dt_fb_account_manage_page_relation', $combat_db_options)->fields($update_item)->condition('id', $exist_relation['id'])->execute();
        }
    }
    $update_item = array(
        'available'=> 'n',
        'last_update_time'=> $now_time
    );
    db_update('dt_fb_account_manage_page_relation', $combat_db_options)->fields($update_item)->condition('available', 'y')->condition('account_fid', $account_fid)->condition('last_update_time', $now_time, '<')->execute();
    //account info
    if($account){
        $exist_account_yy = db_select('tb_facebook_account_yy', 'a', $combat_db_options)->fields('a', array('id'))->condition('account_fid', $account_fid)->execute()->fetchAssoc();
        if($exist_account_yy){
            $update_item = array(
                'photo_image_url'=> get_value_from_array($account, 'ui_image_url', ''),
                'last_crawl_manage_pages'=> time()
            );
            db_update('tb_facebook_account_yy', $combat_db_options)->fields($update_item)->condition('account_fid', $account_fid)->execute();
        }
        $exist_account = db_select('tb_guid_fb_account', 'a', $combat_db_options)->fields('a', array('id'))->condition('identity', $account_fid)->execute()->fetchAssoc();
        if(!$exist_account){
            $insert_item = array(
                'account'=> $account['account'],
                'identity'=> $account['identity'],
                'browser_dir'=> $account['identity'],
                'gender'=> get_value_from_array($account, 'gender', ''),
                'friends_count'=> get_value_from_array($account, 'friends', 0),
                'profile_photo'=> get_value_from_array($account, 'ui_image_url', ''),
                'last_crawl_manage_pages'=> time(),
                'last_update_time'=> time()
            );
            db_insert('tb_guid_fb_account', $combat_db_options)->fields($insert_item)->execute();
        }else{
            $update_item = array(
                'friends_count'=> get_value_from_array($account, 'friends', 0),
                'profile_photo'=> get_value_from_array($account, 'ui_image_url', ''),
                'last_crawl_manage_pages'=> time(),
                'last_update_time'=> time()
            );
            db_update('tb_guid_fb_account', $combat_db_options)->fields($update_item)->condition('identity', $account_fid)->execute();
        }
    }else{
        $update_item = array(
            'last_crawl_manage_pages'=> time(),
            'last_update_time'=> time()
        );
        db_update('tb_guid_fb_account', $combat_db_options)->fields($update_item)->condition('identity', $account_fid)->execute();
    }
}

function process_page_roles_save($roles){
    global $combat_db_options;
    $page_fid = $roles[0]['page_fid'];
    $now_time = time();
    foreach($roles as $role){
        $role['last_update_time'] = $now_time;
        $exist_relation = db_select('dt_fb_account_manage_page_relation', 'r', $combat_db_options)->fields('r', array('id'))->condition('account_fid', $role['account_fid'])->condition('page_fid', $page_fid)->execute()->fetchAssoc();
        if(!$exist_relation){
            $role['insert_time'] = $now_time;
            db_insert('dt_fb_account_manage_page_relation', $combat_db_options)->fields($role)->execute();
        }else{
            db_update('dt_fb_account_manage_page_relation', $combat_db_options)->fields($role)->condition('id', $exist_relation['id'])->execute();
        }
    }
    $update_item = array('last_crawl_roles_time'=> $now_time);
    db_update('dt_fb_manage_pages', $combat_db_options)->fields($update_item)->condition('page_fid', $page_fid)->execute();
}

function process_page_insights_post($posts){
    global $combat_db_options;
    $now = time();
    $pageFid = null;
    foreach($posts as $post){
        $pageFid = $post['page_fid'];
        $postFid = $post['post_fid'];
        $item = array(
            'page_fid'=> $post['page_fid'],
            'post_fid'=> $postFid,
            'post_time'=> $post['post_time'],
            'message'=> filterEmoji($post['message']),
            'type'=> $post['type'],
            //'post_reach_paid'=> $post['post_reach_paid'],
            //'post_reach_organic'=> $post['post_reach_organic'],
            //'post_total_clicks'=> $post['post_total_clicks'],
            //'post_reaction_comment_share_sum'=> $post['post_reaction_comment_share_sum'],
            //'post_reactions'=> $post['post_reactions'],
            //'post_comments'=> $post['post_comments'],
            //'post_shares'=> $post['post_shares'],
            //'post_hide_hide_all_report_spam_unlike_page_click_sum'=> $post['post_hide_hide_all_report_spam_unlike_page_click_sum'],
            //'post_reach_fan'=> $post['post_reach_fan'],
            //'post_reach_non_fan'=> $post['post_reach_non_fan'],
            //'post_impressions_paid'=> $post['post_impressions_paid'],
            //'post_impressions_organic'=> $post['post_impressions_organic'],
            //'post_engagement_rate'=> $post['post_engagement_rate'],
            'last_update_time'=> $now
        );
        if(isset($post['post_reach'])){
            $post['post_reach'] = $post['post_reach'];
        }
        if(isset($post['post_engagement'])){
            $post['post_engagement'] = $post['post_engagement'];
        }
        if(isset($post['picture'])){
            $item['picture'] = $post['picture'];
        }
        $existRow = db_select('dt_fb_page_post_insights', 'p', $combat_db_options)->fields('p', array('id'))->condition('post_fid', $postFid)->execute()->fetchAssoc();
        if(!$existRow){
            $item['insert_time'] = $now;
            db_insert('dt_fb_page_post_insights', $combat_db_options)->fields($item)->execute();
        }else{
            db_update('dt_fb_page_post_insights', $combat_db_options)->fields($item)->condition('post_fid', $postFid)->execute();
        }
    }
    $updateItem = array('crawl_post_insights_flag'=>'n', 'last_crawl_post_insights_time'=>$now);
    db_update('dt_fb_manage_pages', $combat_db_options)->fields($updateItem)->condition('page_fid', $pageFid)->execute();
    return array('success'=> true);
}

function process_insights_post_statistic($posts){
    global $combat_db_options;
    foreach($posts as $post){
        $postFid = $post['post_fid'];
        $existRow = db_select('dt_fb_page_post_insights', 'p', $combat_db_options)->fields('p', array('id'))->condition('post_fid', $postFid)->execute()->fetchAssoc();
        if(!$existRow){
            $post['insert_time'] = time();
            db_insert('dt_fb_page_post_insights', $combat_db_options)->fields($post)->execute();
        }else{
            db_update('dt_fb_page_post_insights', $combat_db_options)->fields($post)->condition('post_fid', $postFid)->execute();
        }
    }
    return array('success'=> true);
}

function process_page_insights_info($info){
    global $combat_db_options;
    if(isset($info['page_fid']) && isset($info['followers_count_accurate'])){
        $fid = $info['page_fid'];
        $followers = $info['followers_count_accurate'];
        db_update('tb_fb_account_crawler_task')->fields(array('followers_count'=> $followers))->condition('account_fid', $fid)->execute();
        db_update('dt_fb_manage_pages', $combat_db_options)->fields(array('followers_count_accurate'=> $followers))->condition('page_fid', $fid)->execute();
    }
}

function process_fb_like_lists($infos){
    $crawl_account_fids = db_select('tb_fb_crawler_accounts', 'a')->fields('a', array('account_fid'))->execute()->fetchCol();
    foreach($infos as $info){
        $account_fid = $info['account_fid'];
        if(!in_array($account_fid, $crawl_account_fids)){
            continue;
        }
        $target_fid = $info['id'];
        $item = array(
            'account_fid'=> $account_fid,
            'target_fid'=> $target_fid,
            'name'=> $info['name'],
            'profile_url'=> $info['profile_url'],
            'profile_image_url'=> $info['user_image_url'],
            'update_time'=> time()
        );
        $exists = db_select('tb_fb_crawler_account_follow_target_list', 'l')->fields('l', array('id'))->condition('account_fid', $account_fid)->condition('target_fid', $target_fid)->execute()->fetchAssoc();
        if($exists){
            db_update('tb_fb_crawler_account_follow_target_list')->fields($item)->condition('id', $exists['id'])->execute();
        }else{
            $item['insert_time'] = time();
            db_insert('tb_fb_crawler_account_follow_target_list')->fields($item)->execute();
        }
        $history_exists = db_select('tb_fb_crawler_follow_target_history', 'h')->fields('h', array('id'))->condition('account_fid', $account_fid)->condition('target_fid', $target_fid)->execute()->fetchAssoc();
        if($history_exists){
            $history_item = array(
                'status'=> 's',
                'last_confirm_time'=> time()
            );
            db_update('tb_fb_crawler_follow_target_history')->fields($history_item)->condition('id', $history_exists['id'])->execute();
        }
    }
}

function process_fb_following_lists($infos){
    $crawl_account_fids = db_select('tb_fb_crawler_accounts', 'a')->fields('a', array('account_fid'))->execute()->fetchCol();
    foreach($infos as $info){
        $account_fid = isset($info['account_fid'])? $info['account_fid'] : '';
        if(!in_array($account_fid, $crawl_account_fids)){
            continue;
        }
        $target_fid = $info['id'];
        $item = array(
            'account_fid'=> $account_fid,
            'target_fid'=> $target_fid,
            'name'=> $info['name'],
            'profile_url'=> $info['url'],
            'profile_image_url'=> $info['user_image_url'],
            'update_time'=> time()
        );
        $exists = db_select('tb_fb_crawler_account_follow_target_list', 'l')->fields('l', array('id'))->condition('account_fid', $account_fid)->condition('target_fid', $target_fid)->execute()->fetchAssoc();
        if($exists){
            db_update('tb_fb_crawler_account_follow_target_list')->fields($item)->condition('id', $exists['id'])->execute();
        }else{
            $item['insert_time'] = time();
            db_insert('tb_fb_crawler_account_follow_target_list')->fields($item)->execute();
        }
        $history_exists = db_select('tb_fb_crawler_follow_target_history', 'h')->fields('h', array('id'))->condition('account_fid', $account_fid)->condition('target_fid', $target_fid)->execute()->fetchAssoc();
        if($history_exists){
            $history_item = array(
                'status'=> 's',
                'last_confirm_time'=> time()
            );
            db_update('tb_fb_crawler_follow_target_history')->fields($history_item)->condition('id', $history_exists['id'])->execute();
        }
    }

    //yjg
    $belong_account_fid = '';
    $crawl_account_fids = db_select('tb_fb_account_yjg', 'a')->fields('a', array('fid'))->execute()->fetchCol();
    foreach($infos as $info) {
        $account_fid = isset($info['account_fid']) ? $info['account_fid'] : '';
        if (!in_array($account_fid, $crawl_account_fids)) {
            continue;
        }
        $target_fid = $info['id'];
        $belong_account_fid = $account_fid;
        $item = array(
            'account_fid'=> $account_fid,
            'target_fid'=> $target_fid,
            'account'=> $info['name'],
            'category'=> $info['category'],
            'profile_url'=> $info['url'],
            'photo_image_url'=> $info['user_image_url'],
            'last_update_time'=> time()
        );
        $exists = db_select('tb_fb_account_following_yjg', 'f')->fields('f', array('id'))->condition('account_fid', $account_fid)->condition('target_fid', $target_fid)->execute()->fetchAssoc();
        if($exists){
            db_update('tb_fb_account_following_yjg')->fields($item)->condition('id', $exists['id'])->execute();
        }else{
            $item['insert_time'] = time();
            db_insert('tb_fb_account_following_yjg')->fields($item)->execute();
        }
    }
    if($belong_account_fid){
        db_update('tb_fb_account_yjg')->fields(array('last_following_update_time'=>time()))->condition('fid', $belong_account_fid)->execute();
    }
}

function process_fb_followers_list($infos){
    $belong_account_fid = '';
    $crawl_account_fids = db_select('tb_fb_account_yjg', 'a')->fields('a', array('fid'))->execute()->fetchCol();
    foreach($infos as $info) {
        $account_fid = isset($info['account_fid']) ? $info['account_fid'] : '';
        if (!in_array($account_fid, $crawl_account_fids)) {
            continue;
        }
        $belong_account_fid = $account_fid;
        $target_fid = $info['id'];
        $item = array(
            'account_fid'=> $account_fid,
            'target_fid'=> $target_fid,
            'account'=> $info['name'],
            'category'=> $info['category'],
            'profile_url'=> $info['url'],
            'photo_image_url'=> $info['user_image_url'],
            'last_update_time'=> time()
        );
        $exists = db_select('tb_fb_account_follower_yjg', 'f')->fields('f', array('id'))->condition('account_fid', $account_fid)->condition('target_fid', $target_fid)->execute()->fetchAssoc();
        if($exists){
            db_update('tb_fb_account_follower_yjg')->fields($item)->condition('id', $exists['id'])->execute();
        }else{
            $item['insert_time'] = time();
            db_insert('tb_fb_account_follower_yjg')->fields($item)->execute();
        }
    }
    if($belong_account_fid){
        db_update('tb_fb_account_yjg')->fields(array('last_follower_update_time'=>time()))->condition('fid', $belong_account_fid)->execute();
    }
}

function process_fb_friends_list($infos){
    $belong_account_fid = '';
    $crawl_account_fids = db_select('tb_fb_account_yjg', 'a')->fields('a', array('fid'))->execute()->fetchCol();
    foreach($infos as $info) {
        $account_fid = isset($info['account_fid']) ? $info['account_fid'] : '';
        if (!in_array($account_fid, $crawl_account_fids)) {
            continue;
        }
        $belong_account_fid = $account_fid;
        $target_fid = $info['id'];
        $item = array(
            'account_fid'=> $account_fid,
            'target_fid'=> $target_fid,
            'account'=> $info['name'],
            'category'=> $info['category'],
            'profile_url'=> $info['url'],
            'photo_image_url'=> $info['user_image_url'],
            'last_update_time'=> time()
        );
        $exists = db_select('tb_fb_account_friend_yjg', 'f')->fields('f', array('id'))->condition('account_fid', $account_fid)->condition('target_fid', $target_fid)->execute()->fetchAssoc();
        if($exists){
            db_update('tb_fb_account_friend_yjg')->fields($item)->condition('id', $exists['id'])->execute();
        }else{
            $item['insert_time'] = time();
            db_insert('tb_fb_account_friend_yjg')->fields($item)->execute();
        }
    }
    if($belong_account_fid){
        db_update('tb_fb_account_yjg')->fields(array('last_friend_update_time'=>time()))->condition('fid', $belong_account_fid)->execute();
    }
}

//采集监控目标管理
function f_cp_crawler_monitor_target(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $project_name = get_value_from_array($params, 'project_name', 'S201_Monitor');
    $action = get_value_from_array($params, 'action', 'add');
    $site = get_value_from_array($params, 'site', 'facebook');
    $seed_type = get_value_from_array($params, 'seed_type', 'user');
    $priority = get_value_from_array($params, 'priority', 1);
    if(!in_array($action, array('add', 'delete', 'check'))){
        return array('success'=>false, 'msg'=>'not found valid action, ' . $action);
    }
    if(!in_array($site, array('facebook', 'twitter'))){
        return array('success'=>false, 'msg'=>'not found valid site, ' . $site);
    }
    $seed = get_value_from_array($params, 'seed', array());
    if(!$seed || !is_array($seed)){
        return array('success'=>false, 'msg'=>'params seed is not valid, ' . to_json($seed));
    }
    $status_map = array('r'=>'waiting', 'p'=>'running', 'z'=>'delete', 's'=>'normal');
    $fields = array('id', 'account_fid', 'available', 'account', 'friends_count', 'profile_picture', 'status', 'crawl_get_time', 'crawl_finish_time');
    if($action=='add'){
        if($site=='facebook'){
            return add_facebook_crawl_targets($seed, $project_name, $seed_type, $priority);
        }elseif($site=='twitter'){
            return add_twitter_crawl_targets($seed, $project_name, $priority);
        }

    }elseif($action=='delete' && $site=='facebook'){
        $ret = db_update('tb_fb_account_crawler_task')->fields(array('status'=>'z'))->condition('account_fid', $seed)->execute();
        return array('success'=>true, 'msg'=>'delete success, count: ' . $ret);
    }elseif($action=='check' && $site=='facebook'){
        $infos = array();
        $query = db_select('tb_fb_account_crawler_task', 't')->fields('t', $fields)->condition('account_fid', $seed);
        $result = $query->execute();
        while($row = $result->fetchAssoc()){
            $infos[] = array(
                'seed_fid'=> $row['account_fid'],
                'status'=> $status_map[$row['status']],
                'last_crawl_get_time'=> date('Y-m-d H:i:s', $row['crawl_get_time']),
                'last_crawl_finish_time'=> date('Y-m-d H:i:s', $row['crawl_finish_time'])
            );
        }
        return array('success'=>true, 'info'=>$infos);
    }
    return array('success'=>false);
}

function add_facebook_crawl_targets($seed, $project_name, $seed_type, $priority){
    $status_map = array('r'=>'waiting', 'p'=>'running', 'z'=>'delete', 's'=>'normal', 'f'=>'failed');
    $fields = array('id', 'account_fid', 'available', 'account_type', 'account', 'friends_count', 'gender', 'birth', 'profile_picture', 'cover_picture', 'likes_count', 'followers_count', 'member_count', 'privacy', 'status', 'crawl_get_time', 'crawl_finish_time', 'frozen_message', 'crawl_content', 'hometown', 'current_city', 'moved_city', 'education', 'work');
    $account_infos = array();
    foreach($seed as $fid){
        $infos = array();
        $row = null;
        $fid = trim($fid);
        if(strpos($fid, 'facebook.com') > -1){
            $account_url = strtolower($fid);
            $account_url_md5 = md5($account_url);
            $exist = db_select('tb_fb_account_urls_map', 'u')->fields('u', array('id','account_fid','available'))->condition('account_url_md5', $account_url_md5)->execute()->fetchAssoc();
            if($exist){
                if($exist['account_fid']){
                    $fid = $exist['account_fid'];
                }else{
                    continue;
                }
            }else{
                $item_url = array(
                    'account_url'=> $account_url,
                    'account_url_md5'=> $account_url_md5,
                    'insert_time'=> time(),
                    'update_time'=> time()
                );
                db_insert('tb_fb_account_urls_map')->fields($item_url)->execute();
                continue;
            }
        }
        $row = db_select('tb_fb_account_crawler_task', 't')->fields('t', $fields)->condition('account_fid', $fid)->execute()->fetchAssoc();
        if(!$row){
            $row = db_select('tb_fb_account_crawler_task', 't')->fields('t', $fields)->condition('origin_fid', $fid)->execute()->fetchAssoc();
        }
        if($row){
            $crawl_content = json_from_string($row['crawl_content']);
            $key = 'account_' . $fid;
            if(isset($crawl_content['dataEx']) && isset($crawl_content['dataEx']['network_crawler']) && isset($crawl_content['dataEx']['network_crawler'][$key])){
                $crawl_account_info = $crawl_content['dataEx']['network_crawler'][$key];
                $row['account_type'] = strtolower($crawl_account_info['page_type']);
            }
            $update_item = array(
                'project_name'=> $project_name,
                'priority'=> $priority,
                'update_time'=> time()
            );
            if(time() - $row['crawl_finish_time'] > 24*3600 && $row['available']=='y'){
                $update_item['status'] = 'r';
            }
            db_update('tb_fb_account_crawler_task')->fields($update_item)->condition('account_fid', $fid)->execute();
            if($row['available']=='n'){
                $row['status'] = 's';
            }
            $last_crawl_finish_time = date('Y-m-d H:i:s', $row['crawl_finish_time']);
            if($row['available']=='n'){
                $last_crawl_finish_time = date('Y-m-d H:i:s');
            }
            $infos[] = array(
                'seed_fid'=> $fid,
                'status'=> $status_map[$row['status']],
                'last_crawl_get_time'=> date('Y-m-d H:i:s', $row['crawl_get_time']),
                'last_crawl_finish_time'=> $last_crawl_finish_time,
                'rank_count'=> 160,
                'estimated_time'=> '120min'
            );
            if($row['crawl_finish_time'] || $row['available']=='n'){
                $account_info = array(
                    'available'=> $row['available'],
                    'identity'=> $fid,
                    'account'=> $row['account'],
                    'account_type'=> $row['account_type'],
                    'profile_picture'=> $row['profile_picture']
                );
                switch($row['account_type']){
                    case 'user':
                        $company = '';
                        $company_arr = array();
                        if($row['work']){
                            $arr = json_from_string($row['work']);
                            foreach($arr as $work){
                                $work = json_from_string($work);
                                if(isset($work['employer']) && isset($work['employer']['name']) && $work['employer']['name']){
                                    $company_arr[] = $work['employer']['name'];
                                }
                            }
                        }
                        if($company_arr){
                            $company = implode(' ', $company_arr);
                        }
                        $college = '';
                        $high_school = '';
                        if($row['education']){
                            $arr = json_from_string($row['education']);
                            foreach($arr as $edu){
                                if(strpos($edu, 'college ') === 0){
                                    $college = preg_replace('/^college /', '', $edu);
                                }elseif(strpos($edu, 'secondary_school ') === 0){
                                    $high_school = preg_replace('/^secondary_school /', '', $edu);
                                }
                            }
                        }
                        $account_info['cover_picture'] = $row['cover_picture'];
                        $account_info['friends_count'] = intval($row['friends_count']);
                        $account_info['followers_count'] = intval($row['followers_count']);
                        $account_info['gender'] = get_value_from_array($row, 'gender', '');
                        $account_info['birth'] = get_value_from_array($row, 'birth', '');
                        $account_info['hometown'] = get_value_from_array($row, 'hometown', '');
                        $account_info['current_city'] = get_value_from_array($row, 'current_city', '');
                        $account_info['moved_city'] = get_value_from_array($row, 'moved_city', '');
                        $account_info['college'] = $college;
                        $account_info['high_school'] = $high_school;
                        $account_info['work'] = $company;
                        break;
                    case 'page':
                        $account_info['cover_picture'] = $row['cover_picture'];
                        $account_info['likes_count'] = intval($row['likes_count']);
                        $account_info['followers_count'] = intval($row['followers_count']);
                        //$newest_post_time = get_newest_post_time($fid);
                        //if($newest_post_time){
                            //$account_info['newest_post_time'] = $newest_post_time;
                        //}
                        break;
                    case 'group':
                        $account_info['privacy'] = $row['privacy'];
                        $account_info['member_count'] = intval($row['member_count']);
                        $account_info['frozen_message'] = $row['frozen_message'];
                        break;
                }
                if($project_name == 'pangu_hb'){
                    $account_info['crawl_content'] = $row['crawl_content'];
                }
                $account_infos[] = $account_info;
            }
        }else{
            $insert_item = array(
                'account_fid'=> $fid,
                'account_type'=> $seed_type,
                'project_name'=> $project_name,
                'priority'=> $priority,
                'source_ip'=> get_ip(),
                'status'=> 'r',
                'insert_time'=> time(),
                'update_time'=> time()
            );
            db_insert('tb_fb_account_crawler_task')->fields($insert_item)->execute();
        }
    }
    return array('success'=>true, 'info'=>$infos, 'account_infos'=>$account_infos);
}

function get_newest_post_time($fid){
    global $es_hosts_params, $es_index_config;
    $es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_hosts_params)->build();
    $es_params = array(
        'size'=> 1,
        'index'=> $es_index_config['post']['index'],
        'type'=> $es_index_config['post']['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('term'=> array('owner_user_id'=> $fid))
                    )
                )
            ),
            'sort'=> array(
                array('post_time'=> array('order'=> 'desc'))
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    foreach($results['data'] as $item){
        return $item['post_time'];
    }
    return false;
}

function add_twitter_crawl_targets($seed, $project_name){
    $status_map = array('r'=>'waiting', 'p'=>'running', 'z'=>'delete', 's'=>'normal');
    $fields = array('id', 'screen_name', 'available', 'followers_count', 'following_count', 'profile_picture', 'profile_banner_url', 'status', 'crawl_get_time', 'crawl_finish_time');
    $account_infos = array();
    foreach($seed as $screen_name){
        $infos = array();
        $row = db_select('tb_tw_account_crawler_task', 't')->fields('t', $fields)->condition('screen_name', $screen_name)->execute()->fetchAssoc();
        if($row){
            $update_item = array(
                'status'=> 'r'
            );
            if(time() - $row['crawl_finish_time'] > 3*24*3600){
                db_update('tb_tw_account_crawler_task')->fields($update_item)->condition('screen_name', $screen_name)->execute();
            }
            $infos[] = array(
                'seed_screen_name'=> $screen_name,
                'status'=> $status_map[$row['status']],
                'last_crawl_get_time'=> date('Y-m-d H:i:s', $row['crawl_get_time']),
                'last_crawl_finish_time'=> date('Y-m-d H:i:s', $row['crawl_finish_time']),
                'rank_count'=> 160,
                'estimated_time'=> '120min'
            );
            if($row['crawl_finish_time']){
                $account_infos[] = array(
                    'available'=> $row['available'],
                    'screen_name'=> $row['screen_name'],
                    'followers_count'=> $row['followers_count'],
                    'following_count'=> $row['following_count'],
                    'profile_picture'=> $row['profile_picture'],
                    'profile_banner_url'=> $row['profile_banner_url']
                );
            }
        }else{
            $insert_item = array(
                'screen_name'=> $screen_name,
                'project_name'=> $project_name,
                'source_ip'=> get_ip(),
                'status'=> 'r',
                'insert_time'=> time(),
                'update_time'=> time()
            );
            db_insert('tb_tw_account_crawler_task')->fields($insert_item)->execute();
        }
    }
    return array('success'=>true, 'info'=>$infos, 'account_infos'=>$account_infos);
}

function f_cp_fb_join_group_detect(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $group_fid = get_value_from_array($params, 'group_fid', '');
    $account_fid = get_value_from_array($params, 'account_fid', '');
    if(!$group_fid || !$account_fid){
        return array('success'=>false, 'msg'=>'params must has group_fid and account_fid');
    }
    $exist = db_select('tb_fb_group_permeation_join_group', 'i')->fields('i', array('id', 'is_permeation', 'crawl_finish_time'))->condition('group_fid', $group_fid)->condition('account_fid', $account_fid)->execute()->fetchAssoc();
    if($exist){
        if(time() - $exist['crawl_finish_time'] > 3*24*3600){
            $item = array(
                'status'=> 'r',
                'update_time'=> time()
            );
            db_update('tb_fb_group_permeation_join_group')->fields($item)->condition('id', $exist['id'])->execute();
        }
        $info = array(
            'is_permeation'=> $exist['is_permeation'],
            'check_time'=> $exist['crawl_finish_time']
        );
    }else{
        $item = array(
            'group_fid'=> $group_fid,
            'account_fid'=> $account_fid,
            'insert_time'=> time(),
            'update_time'=> time()
        );
        db_insert('tb_fb_group_permeation_join_group')->fields($item)->execute();
        $info = array(
            'is_permeation'=> 'n',
            'check_time'=> 0
        );
    }
    return array('success'=>true, 'info'=>$info);
}

function f_cp_fb_group_post_detect(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $group_fid = get_value_from_array($params, 'group_fid', '');
    $account_fid = get_value_from_array($params, 'account_fid', '');
    $task_time = get_value_from_array($params, 'task_time', '');
    $hb_task_content = get_value_from_array($params, 'task_content', '');
    $hb_task_content = filterEmoji($hb_task_content);
    $effective_time_duration = get_value_from_array($params, 'effective_time_duration', 21600);
    $guid_es_id = get_value_from_array($params, 'guid_es_id', '');
    if(!$group_fid || !$account_fid || !$task_time){
        return array('success'=>false, 'msg'=>'params must has group_fid and account_fid and task_time');
    }
    $exist = db_select('tb_fb_group_permeation_post_detect', 'd')->fields('d', array('id','guid_es_id','post_fid','crawl_content','crawl_finish_time'))->condition('group_fid', $group_fid)->condition('account_fid', $account_fid)->condition('task_time', $task_time)->execute()->fetchAssoc();
    if($exist){
        if(!$exist['post_fid'] && time()-$exist['crawl_finish_time']>24*3600){
            $item = array(
                'status'=> 'r',
                'update_time'=> time()
            );
            if($hb_task_content){
                $item['hb_task_content'] = $hb_task_content;
            }
            db_update('tb_fb_group_permeation_post_detect')->fields($item)->condition('id', $exist['id'])->execute();
        }
        $crawl_content = array();
        if($exist['crawl_content']){
            $crawl_content = json_from_string($exist['crawl_content']);
            if(isset($crawl_content['post_info'])){
                if($crawl_content['post_info'] && !isset($crawl_content['post_info']['available'])){
                    $crawl_content['post_info']['available'] = 'y';
                }elseif(!$crawl_content['post_info']){
                    unset($crawl_content['post_info']);
                }
            }
        }
        $info = array(
            'guid_es_id'=> $exist['guid_es_id'],
            'crawl_content'=> $crawl_content,
            'check_time'=> $exist['crawl_finish_time']
        );
    }else{
        $item = array(
            'group_fid'=> $group_fid,
            'account_fid'=> $account_fid,
            'task_time'=> $task_time,
            'hb_task_content'=> $hb_task_content,
            'guid_es_id'=> $guid_es_id,
            'effective_time_duration'=> $effective_time_duration,
            'insert_time'=> time(),
            'update_time'=> time()
        );
        db_insert('tb_fb_group_permeation_post_detect')->fields($item)->execute();
        $info = array(
            'crawl_content'=> array(),
            'check_time'=> 0
        );
    }
    return array('success'=>true, 'info'=>$info);
}

function f_cp_fb_group_post_info_collect(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $post_fid = get_value_from_array($params, 'post_fid', '');
    if(!$post_fid){
        return array('success'=>false, 'msg'=>'params must has post_fid');
    }
    $exist = db_select('tb_fb_group_permeation_post_info', 'd')->fields('d', array('id','post_fid','post_available','crawl_content','crawl_finish_time'))->condition('post_fid', $post_fid)->execute()->fetchAssoc();
    if($exist){
        if(time()-$exist['crawl_finish_time']>12*3600){
            $item = array(
                'status'=> 'r',
                'update_time'=> time()
            );
            db_update('tb_fb_group_permeation_post_info')->fields($item)->condition('id', $exist['id'])->execute();
        }
        $crawl_content = array();
        if($exist['crawl_content']){
            $crawl_content = json_from_string($exist['crawl_content']);
            $crawl_content['available'] = $exist['post_available'];
            if(isset($crawl_content['screenshot'])){
                unset($crawl_content['screenshot']);
            }
        }
        $info = array(
            'post_info'=> $crawl_content,
            'check_time'=> $exist['crawl_finish_time']
        );
        $image = '/data/group_post_images/' . $exist['post_fid'] . '.jpg';
        $img_base64 = imgToBase64($image);
        if($img_base64){
            $info['screenshot'] = $img_base64;
        }
    }else{
        $item = array(
            'post_fid'=> $post_fid,
            'insert_time'=> time(),
            'update_time'=> time()
        );
        db_insert('tb_fb_group_permeation_post_info')->fields($item)->execute();
        $info = array(
            'post_info'=> array(),
            'check_time'=> 0
        );
    }
    return array('success'=>true, 'info'=>$info);
}

function f_cp_fb_group_permeation_batch(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $start_time = get_value_from_array($params, 'start_time', null);
    $end_time = get_value_from_array($params, 'end_time', null);
    if(!$start_time || !$end_time){
        return array('success'=>false, 'msg'=>'not found params start_time or end_time');
    }
    $data = array(
        'join_group_detect'=> array(),
        'group_post_detect'=> array(),
        'group_post_info_collect'=> array()
    );
    //join_group_detect
    $query = db_select('tb_fb_group_permeation_join_group', 'j')->fields('j', array('id', 'group_fid', 'account_fid', 'is_permeation', 'crawl_finish_time'));
    $query->condition('crawl_finish_time', $start_time, '>=')->condition('crawl_finish_time', $end_time, '<=');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $data['join_group_detect'][] = array(
            'group_fid'=> $row['group_fid'],
            'account_fid'=> $row['account_fid'],
            'is_permeation'=> $row['is_permeation'],
            'check_time'=> $row['crawl_finish_time']
        );
    }
    //group_post_detect
    $query = db_select('tb_fb_group_permeation_post_detect', 'd')->fields('d', array('id','group_fid','account_fid','task_time','guid_es_id','post_fid','crawl_content','crawl_finish_time'));
    $query->condition('crawl_finish_time', $start_time, '>=')->condition('crawl_finish_time', $end_time, '<=');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $crawl_content = array();
        if($row['crawl_content']){
            $crawl_content = json_from_string($row['crawl_content']);
            if(isset($crawl_content['post_info'])){
                if($crawl_content['post_info'] && !isset($crawl_content['post_info']['available'])){
                    $crawl_content['post_info']['available'] = 'y';
                }elseif(!$crawl_content['post_info']){
                    unset($crawl_content['post_info']);
                }
            }
        }
        $info = array(
            'group_fid'=> $row['group_fid'],
            'account_fid'=> $row['account_fid'],
            'task_time'=> $row['task_time'],
            'guid_es_id'=> $row['guid_es_id'],
            'crawl_content'=> $crawl_content,
            'check_time'=> $row['crawl_finish_time']
        );
        $data['group_post_detect'][] = $info;
    }
    //group_post_info_collect
    $query = db_select('tb_fb_group_permeation_post_info', 'd')->fields('d', array('id','post_fid','post_available','crawl_content','crawl_finish_time'));
    $query->condition('crawl_finish_time', $start_time, '>=')->condition('crawl_finish_time', $end_time, '<=');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $crawl_content = array();
        if($row['crawl_content']){
            $crawl_content = json_from_string($row['crawl_content']);
            $crawl_content['available'] = $row['post_available'];
            if(isset($crawl_content['screenshot'])){
                unset($crawl_content['screenshot']);
            }
        }
        $info = array(
            'post_fid'=> $row['post_fid'],
            'post_info'=> $crawl_content,
            'check_time'=> $row['crawl_finish_time']
        );
        $image = '/data/group_post_images/' . $row['post_fid'] . '.jpg';
        $img_base64 = imgToBase64($image);
        if($img_base64){
            $info['screenshot'] = $img_base64;
        }
        $data['group_post_info_collect'][] = $info;
    }
    return array('success'=>true, 'info'=>$data);
}

function f_cp_fb_guid_task_detect(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $site = get_value_from_array($params, 'site', '');
    if($site != 'twitter'){
        $site = 'facebook';
    }
    $account_fid = get_value_from_array($params, 'account_fid', '');
    $task_time = get_value_from_array($params, 'task_time', '');
    $task_type = get_value_from_array($params, 'task_type', '');
    $hb_task_id = get_value_from_array($params, 'hb_task_id', '');
    $hb_task_content = get_value_from_array($params, 'task_content', '');
    $force_crawl = get_value_from_array($params, 'force_crawl', 'n');
    $hb_task_content = filterEmoji($hb_task_content);
    $post_url = get_value_from_array($params, 'post_url', '');
    $post_url = str_replace('m.facebook', 'www.facebook', $post_url);
    if(!$account_fid || !$task_time || !$task_type || !$hb_task_id){
        return array('success'=>false, 'msg'=>'params must has account_fid and task_time and task_type and hb_task_id');
    }
    if($site == 'facebook' && strpos($post_url, 'comment_id=') !== false){
        $task_type = 'comment';
    }
    //$exist = db_select('tb_fb_guid_task_detect', 'd')->fields('d', array('id','hb_task_id','post_fid','crawl_content','crawl_finish_time'))->condition('account_fid', $account_fid)->condition('task_time', $task_time)->condition('task_type', $task_type)->execute()->fetchAssoc();
    $exist = db_select('tb_fb_guid_task_detect', 'd')->fields('d', array('id','hb_task_id','post_fid','crawl_content','crawl_finish_time'))->condition('hb_task_id', $hb_task_id)->execute()->fetchAssoc();
    if($exist){
        if($force_crawl=='y' || time()-$exist['crawl_finish_time']>1*3600){
            $item = array(
                'status'=> 'r',
                'update_time'=> time()
            );
            if($hb_task_content){
                $item['hb_task_content'] = $hb_task_content;
            }
            db_update('tb_fb_guid_task_detect')->fields($item)->condition('id', $exist['id'])->execute();
        }
        $crawl_content = array();
        if($exist['crawl_content']){
            $crawl_content = json_from_string($exist['crawl_content']);
            if(isset($crawl_content['post_info'])){
                if($crawl_content['post_info']){
                    $crawl_content['post_info']['hb_task_id'] = $exist['hb_task_id'];
                    if(!isset($crawl_content['post_info']['available'])){
                        $crawl_content['post_info']['available'] = 'y';
                    }
                }elseif(!$crawl_content['post_info']){
                    unset($crawl_content['post_info']);
                }
            }
        }
        $info = array(
            'crawl_content'=> $crawl_content,
            'check_time'=> $exist['crawl_finish_time']
        );
    }else{
        $item = array(
            'site'=> $site,
            'account_fid'=> $account_fid,
            'task_time'=> $task_time,
            'task_type'=> $task_type,
            'hb_task_id'=> $hb_task_id,
            'hb_task_content'=> $hb_task_content,
            'post_url'=> $post_url,
            'insert_time'=> time(),
            'update_time'=> time()
        );
        db_insert('tb_fb_guid_task_detect')->fields($item)->execute();
        $info = array(
            'crawl_content'=> array(),
            'check_time'=> 0
        );
    }
    return array('success'=>true, 'info'=>$info);
}

function f_cp_fb_guid_task_batch(){
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $start_time = get_value_from_array($params, 'start_time', null);
    $end_time = get_value_from_array($params, 'end_time', null);
    if(!$start_time || !$end_time){
        return array('success'=>false, 'msg'=>'not found params start_time or end_time');
    }
    $data = array();
    $query = db_select('tb_fb_guid_task_detect', 'd')->fields('d', array('id','hb_task_id','post_fid','crawl_content','crawl_finish_time'));
    $query->condition('crawl_finish_time', $start_time , '>=');
    $query->condition('crawl_finish_time', $end_time, '<=');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        if($row['crawl_content']){
            $crawl_content = json_from_string($row['crawl_content']);
            if(isset($crawl_content['post_info'])){
                if($crawl_content['post_info']){
                    $crawl_content['post_info']['hb_task_id'] = $row['hb_task_id'];
                    if(!isset($crawl_content['post_info']['available'])){
                        $crawl_content['post_info']['available'] = 'y';
                    }
                }elseif(!$crawl_content['post_info']){
                    unset($crawl_content['post_info']);
                }
            }
            $info = array(
                'crawl_content'=> $crawl_content,
                'check_time'=> $row['crawl_finish_time']
            );
            $data[] = $info;
        }
    }
    return array('success'=>true, 'info'=>$data);
}

// = = = = = = = = = = = = = = = = = =
function f_sz_crawl_fb_group(){
    global $es_hosts_params, $es_index_config;
    $es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_hosts_params)->build();
    $check_update_time = time() - 24*3600;
    $crawled_fids = array();
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $fids = $params['fids'];
    $es_params = array(
        'size'=> 1000000,
        'index'=> $es_index_config['group_info']['index'],
        'type'=> $es_index_config['group_info']['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('terms'=> array('identity'=> $fids)),
                        array('range'=> array('last_update_time'=> array('gte'=>$check_update_time)))
                    )
                )
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    foreach($results['data'] as $item){
        $crawled_fids[] = $item['identity'];
    }
    $data = $results['data'];
    $fids = array_diff($fids, $crawled_fids);
    foreach($fids as $fid){
        $account_info = db_select('tb_fb_account_crawler_task', 'c')->fields('c', array('id','status'))->condition('account_fid', $fid)->execute()->fetchAssoc();
        if($account_info){
            $item = array(
                'source_ip'=> get_ip(),
                'update_time'=> time()
            );
            if($account_info['status'] == 's'){
                $item['status'] = 'r';
            }
            db_update('tb_fb_account_crawler_task')->fields($item)->condition('account_fid', $fid)->execute();
        }else{
            $item = array(
                'account_fid'=> $fid,
                'account_type'=> 'group',
                'task_arr'=> to_json(array('group')),
                'source_ip'=> get_ip(),
                'status'=> 'r',
                'update_time'=> time()
            );
            db_insert('tb_fb_account_crawler_task')->fields($item)->execute();
        }
    }
    return $data;
}

function f_sz_crawl_fb_group_member(){
    global $es_hosts_params, $es_index_config;
    $crawled_fids = array();
    $es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_hosts_params)->build();
    $check_update_time = time() - 24*3600;
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $fids = $params['fids'];
    $es_params = array(
        'size'=> 1000000,
        'index'=> $es_index_config['group_member']['index'],
        'type'=> $es_index_config['group_member']['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('terms'=> array('group_iid'=> $fids)),
                        array('range'=> array('last_update_time'=> array('gte'=>$check_update_time)))
                    )
                )
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    foreach($results['data'] as $item){
        if(!in_array($item['group_iid'], $crawled_fids)){
            $crawled_fids[] = $item['group_iid'];
        }
    }
    $data = $results['data'];
    $fids = array_diff($fids, $crawled_fids);
    foreach($fids as $fid){
        $group_info = db_select('tb_fb_group_member_crawler_task', 'g')->fields('g', array('id','status'))->condition('group_fid', $fid)->execute()->fetchAssoc();
        if($group_info){
            $item = array(
                'source_ip'=> get_ip(),
                'update_time'=> time()
            );
            if($group_info['status'] == 's'){
                //$item['status'] = 'r';
            }
            db_update('tb_fb_group_member_crawler_task')->fields($item)->condition('group_fid', $fid)->execute();
        }else{
            $item = array(
                'group_fid'=> $fid,
                'source_ip'=> get_ip(),
                'status'=> 'r',
                'update_time'=> time()
            );
            db_insert('tb_fb_group_member_crawler_task')->fields($item)->execute();
        }
    }
    return $data;
}

function f_sz_crawl_fb_post(){
    global $es_hosts_params, $es_index_config;
    $crawled_fids = array();
    $es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_hosts_params)->build();
    $check_update_time = time() - 1*24*3600;
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $fids = $params['fids'];
    $account_type = isset($params['account_type'])? $params['account_type'] : 'user';
    if($account_type == 'page'){
        $task_arr = array('page', 'post');
    }else{
        $task_arr = array('user', 'post');
    }
    $es_params = array(
        'size'=> 1000000,
        'index'=> $es_index_config['post']['index'],
        'type'=> $es_index_config['post']['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('terms'=> array('owner_user_id'=> $fids)),
                        array('range'=> array('last_update_time'=> array('gte'=>$check_update_time)))
                    )
                )
            ),
            'sort'=> array(
                array('last_update_time'=> array('order'=> 'desc'))
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    $data = $results['data'];
    foreach($results['data'] as $item){
        $crawled_fids[] = $item['owner_user_id'];
    }
    $fids = array_diff($fids, $crawled_fids);
    foreach($fids as $fid){
        $account_info = db_select('tb_fb_post_crawler_task', 'p')->fields('p', array('id','status','update_time'))->condition('account_fid', $fid)->execute()->fetchAssoc();
        if($account_info){
            $item = array(
                'source_ip'=> get_ip()
            );
            if($account_info['status'] == 's' || (time()-$account_info['update_time'] > 36*3600)){
                $item['status'] = 'r';
                $item['update_time'] = time();
                db_update('tb_fb_post_crawler_task')->fields($item)->condition('account_fid', $fid)->execute();
            }
            //db_update('tb_fb_post_crawler_task')->fields($item)->condition('account_fid', $fid)->execute();
        }else{
            $item = array(
                'account_fid'=> $fid,
                'account_type'=> $account_type,
                'task_arr'=> to_json($task_arr),
                'source_ip'=> get_ip(),
                'status'=> 'r',
                'update_time'=> time()
            );
            db_insert('tb_fb_post_crawler_task')->fields($item)->execute();
        }
    }
    return array_values($data);
}

function f_sz_crawl_fb_newest_post(){
    global $es_hosts_params, $es_index_config;
    $crawled_fids = array();
    $es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_hosts_params)->build();
    $check_update_time = time() - 24*3600;
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $fids = $params['fids'];
    $account_type = isset($params['account_type'])? $params['account_type'] : 'user';
    if($account_type == 'page'){
        $task_arr = array('page', 'post');
    }else{
        $task_arr = array('user', 'post');
    }
    $es_params = array(
        'size'=> 1000000,
        'index'=> $es_index_config['post']['index'],
        'type'=> $es_index_config['post']['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('terms'=> array('owner_user_id'=> $fids)),
                        array('range'=> array('last_update_time'=> array('gte'=>$check_update_time)))
                    )
                )
            ),
            'sort'=> array(
                array('last_update_time'=> array('order'=> 'desc'))
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    $data = array();
    foreach($results['data'] as $item){
        $crawled_fids[] = $item['user_iid'];
        $user_fid = $item['owner_user_id'];
        if(isset($data[$user_fid]) && $data[$user_fid]['post_time']>strtotime($item['post_time'])){
            continue;
        }
        $post_info = array(
            'id'=> $item['id'],
            'owner_user_id'=> $item['owner_user_id'],
            'user_fid'=> $user_fid,
            'post_fid'=> $item['iid'],
            'post_url'=> $item['url'],
            'post_url_md5'=> md5(strtolower($item['url'])),
            'post_time'=> strtotime($item['post_time']),
            'content'=> get_value_from_array($item, 'content', ''),
            'image_in_content'=> get_value_from_array($item, 'image_in_content', ''),
            'forward_count'=> get_value_from_array($item, 'forward_count', 0),
            'reply_count'=> get_value_from_array($item, 'reply_count', 0),
            'praise_count'=> get_value_from_array($item, 'praise_count', 0),
            'love_count'=> get_value_from_array($item, 'love_count', 0),
            'laugh_count'=> get_value_from_array($item, 'laugh_count', 0),
            'wow_count'=> get_value_from_array($item, 'wow_count', 0),
            'sad_count'=> get_value_from_array($item, 'sad_count', 0),
            'angry_count'=> get_value_from_array($item, 'angry_count', 0),
            'total_action_count'=> get_value_from_array($item, 'total_action_count', 0),
            'can_comment'=> get_value_from_array($item, 'can_viewer_comment', 'y'),
            'insert_time'=> $item['insert_time'],
            'last_update_time'=> $item['last_update_time']
        );
        $data[$user_fid] = $post_info;
    }
    $fids = array_diff($fids, $crawled_fids);
    foreach($fids as $fid){
        $account_info = db_select('tb_fb_post_crawler_task', 'p')->fields('p', array('id','status'))->condition('account_fid', $fid)->execute()->fetchAssoc();
        if($account_info){
            $item = array(
                'source_ip'=> get_ip(),
                'update_time'=> time()
            );
            if($account_info['status'] == 's'){
                $item['status'] = 'r';
            }
            db_update('tb_fb_post_crawler_task')->fields($item)->condition('account_fid', $fid)->execute();
        }else{
            $item = array(
                'account_fid'=> $fid,
                'account_type'=> $account_type,
                'task_arr'=> to_json($task_arr),
                'source_ip'=> get_ip(),
                'status'=> 'r',
                'update_time'=> time()
            );
            db_insert('tb_fb_post_crawler_task')->fields($item)->execute();
        }
    }
    return array_values($data);
}

function f_sz_crawl_fb_single_post(){
    global $es_hosts_params, $es_index_config;
    $crawled_fids = array();
    $es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_hosts_params)->build();
    //$check_update_time = time() - 24*3600;
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $fids = $params['fids'];
    $es_params = array(
        'size'=> 1000000,
        'index'=> $es_index_config['post']['index'],
        'type'=> $es_index_config['post']['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('terms'=> array('_id'=> $fids))
                    )
                )
            ),
            'sort'=> array(
                array('last_update_time'=> array('order'=> 'desc'))
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    $data = array();
    foreach($results['data'] as $item){
        if(isset($item['doc'])){
            $item = $item['doc'];
        }
        $crawled_fids[] = $item['id'];
        $user_fid = isset($item['owner_user_id'])? $item['owner_user_id'] : $item['user_iid'];
        $post_info = array(
            'user_fid'=> $user_fid,
            'user_name'=> $item['user_name'],
            'post_fid'=> $item['iid'],
            'post_url'=> $item['url'],
            'post_url_md5'=> md5(strtolower($item['url'])),
            'post_time'=> strtotime($item['post_time']),
            'content'=> get_value_from_array($item, 'content', ''),
            'image_in_content'=> get_value_from_array($item, 'image_in_content', ''),
            'can_comment'=> get_value_from_array($item, 'can_viewer_comment', 'y'),
            'insert_time'=> isset($item['insert_time'])? $item['insert_time'] : time(),
            'last_update_time'=> $item['last_update_time']
        );
        $data[] = $post_info;
    }
    $fids = array_diff($fids, $crawled_fids);
    foreach($fids as $fid){
        $post_info = db_select('tb_fb_single_post_crawler_task', 'p')->fields('p', array('id','status'))->condition('post_fid', $fid)->execute()->fetchAssoc();
        if($post_info){
            $item = array(
                'source_ip'=> get_ip(),
                'update_time'=> time()
            );
            if($post_info['status'] == 's'){
                $item['status'] = 'r';
            }
            db_update('tb_fb_single_post_crawler_task')->fields($item)->condition('post_fid', $fid)->execute();
        }else{
            $item = array(
                'post_fid'=> $fid,
                'source_ip'=> get_ip(),
                'status'=> 'r',
                'update_time'=> time()
            );
            db_insert('tb_fb_single_post_crawler_task')->fields($item)->execute();
        }
    }
    return $data;
}

function dir_list($dir_path) {
    $result = array();
    if(is_dir($dir_path)) {
        $dirs = opendir($dir_path);
        if($dirs) {
            while(($file = readdir($dirs)) !== false) {
                if($file !== '.' && $file !== '..') {
                    $filePath = join_paths($dir_path, $file);
                    if(is_dir($filePath)) {
                        $infos = dir_list($filePath);
                        $result[] = array('name'=>$file, 'is_dir'=>true, 'infos'=>$infos);
                    }else{
                        $content = file_get_contents($filePath);
                        $result[] = array('name'=>$file, 'is_dir'=>false, 'content'=>$content);
                    }
                }
            }
            closedir($dirs);
        }
    }
    return $result;
}

function f_engine_version(){
    $versionFile = join_paths('browser_engine', 'engine_version');
    $content = file_get_contents($versionFile);
    $arr = explode("\n", $content);
    $version = trim($arr[0]);
    $fileInfos = dir_list('./browser_engine');
    return array('version'=>$version, 'infos'=>$fileInfos);
}

function f_ipv6_demo_group_info(){
    global $es_hosts_params, $es_index_config;
    $es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_hosts_params)->build();
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $fid = $params['fid'];
    if(!$fid){
        return array('success'=>false, 'msg'=>'not found fid');
    }
    $es_params = array(
        'size'=> 1000,
        'index'=> $es_index_config['mass_audience']['index'],
        'type'=> $es_index_config['mass_audience']['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('terms'=> array('user_iid'=> array($fid)))
                    )
                )
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    if(!$results['data'] && !$results['data'][0]){
        return array('success'=>false, 'msg'=>'not found group info');
    }
    $info = $results['data'][0];
    $data = array(
        'group_fid'=> get_value_from_array($info, 'user_iid', $fid),
        'name'=> get_value_from_array($info, 'user_name', ''),
        'profile_url'=> get_value_from_array($info, 'profile_url', ''),
        'profile_picture'=> get_value_from_array($info, 'user_image_url', ''),
        'privacy'=> get_value_from_array($info, 'privacy', ''),
        'description'=> get_value_from_array($info, 'description', ''),
        'group_type'=> get_value_from_array($info, 'group_type', 'General'),
        'member_count'=> get_value_from_array($info, 'member_count', 160500),
        'location'=> get_value_from_array($info, 'location', ''),
        'post_count'=> 0
    );

    $es_params = array(
        'size'=> 1,
        'index'=> $es_index_config['post']['index'],
        'type'=> $es_index_config['post']['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('terms'=> array('owner_group_id'=> array($fid)))
                    )
                )
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    $data['post_count'] = $results['total'];

    return array('success'=>true, 'data'=> $data);
}

function f_ipv6_demo_group_posts(){
    global $es_hosts_params, $es_index_config;
    $es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_hosts_params)->build();
    $params = json_from_string(base64_decode($_REQUEST['params']));
    if(!$params){
        $params = json_from_string($_REQUEST['params']);
    }
    $fid = $params['fid'];
    if(!$fid){
        return array('success'=>false, 'msg'=>'not found fid');
    }
    $es_params = array(
        'size'=> 100000,
        'index'=> $es_index_config['post']['index'],
        'type'=> $es_index_config['post']['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        array('terms'=> array('owner_group_id'=> array($fid)))
                    )
                )
            ),
            'sort'=> array(
                array('post_time'=> array('order'=> 'desc'))
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    if(!$results['data']){
        return array('success'=>false, 'msg'=>'not found post info');
    }
    $posts = array();
    foreach($results['data'] as $row){
        $images = array();
        if($row['image_in_content_url']){
            $images = explode("\n", $row['image_in_content_url']);
        }
        $video_url = get_value_from_array($row, 'video', '');
        if(!$video_url && isset($row['share_video']) && $row['share_video']){
            $video_url = $row['share_video'];
        }
        if(strpos($video_url, 'mp4') === false){
            $video_url = '';
        }
        $post = array(
            'url'=> get_value_from_array($row, 'url', ''),
            'iid'=> get_value_from_array($row, 'iid', ''),
            'post_time'=> get_value_from_array($row, 'post_time', ''),
            'content'=> get_value_from_array($row, 'content', ''),
            'image_in_content_url'=> $images,
            'video_url'=> $video_url,
            'forward_count'=> get_value_from_array($row, 'forward_count', ''),
            'reply_count'=> get_value_from_array($row, 'reply_count', ''),
            'praise_count'=> get_value_from_array($row, 'praise_count', ''),
            'love_count'=> get_value_from_array($row, 'love_count', ''),
            'laugh_count'=> get_value_from_array($row, 'laugh_count', ''),
            'wow_count'=> get_value_from_array($row, 'wow_count', ''),
            'sad_count'=> get_value_from_array($row, 'sad_count', ''),
            'angry_count'=> get_value_from_array($row, 'angry_count', ''),
            'total_action_count'=> get_value_from_array($row, 'total_action_count', ''),
            'is_share'=> get_value_from_array($row, 'is_share', ''),
            'share_link'=> get_value_from_array($row, 'share_link', ''),
            'share_user_name'=> get_value_from_array($row, 'share_user_name', ''),
            'share_user_iid'=> get_value_from_array($row, 'share_user_iid', ''),
            'share_user_image_url'=> get_value_from_array($row, 'share_user_profile_image_url', ''),
            'share_post_id'=> get_value_from_array($row, 'share_post_id', ''),
            'user_name'=> get_value_from_array($row, 'user_name', ''),
            'user_iid'=> get_value_from_array($row, 'user_iid', ''),
            'user_image_url'=> get_value_from_array($row, 'user_image_url', ''),
            'owner_user_id'=> get_value_from_array($row, 'owner_user_id', $fid)
        );
        $posts[] = $post;
    }
    return array('success'=>true, 'data'=> $posts);
}
