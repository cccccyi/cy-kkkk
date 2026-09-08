<?php
if (!function_exists('requireEnv')) {
    function requireEnv($name) {
        $value = getenv($name);
        if ($value === false || $value === '') {
            throw new RuntimeException('Missing required environment variable: ' . $name);
        }
        return $value;
    }
}
define('PP_ROOT', dirname(__FILE__));
global $is_windows;
if (!isset($is_windows))
{
    $is_windows = 'WINNT' == PHP_OS || 'WIN32' == PHP_OS;
}
if ($is_windows)
{
    define('PP_MAIN_ROOT', PP_ROOT . '/..');
}
else
{
    define('PP_MAIN_ROOT', '/apps/robot');
}
require_once(PP_MAIN_ROOT. '/bootstrap.php');

function saveDebugLog($log){
    $logFile = "crawler_log/" . date('YmdH');
    $log = date('Y-m-d H:i:s')." ".$log."\n";
    file_put_contents($logFile, $log, FILE_APPEND);
}

function saveDebugLogChecOutFid($log){
    $logFile = "crawler_log/check_out_fid_" . date('YmdH');
    $log = date('Y-m-d H:i:s')." ".$log."\n";
    file_put_contents($logFile, $log, FILE_APPEND);
}

//$active_db = 'test';
$active_db = 'default';

$databases['test']['default'] = array (
    'database' => 'flood_in_use',
    'username' => 'root',
    'password' => '',
    'host' => 'localhost',
    'port' => '',
    'driver' => 'mysql',
    'prefix' => '',
);

$databases['default']['default'] = array (
    'database' => 'flood_ex_promote',
    'username' => 'root',
    'password' => requireEnv('CRAWLER_CENTER_DB_PASSWORD'),
    'host' => '172.16.1.3', //localhost
    'port' => '3306',
    'driver' => 'mysql',
    'prefix' => '',
);

$databases['default']['crawler'] = array (
    'database' => 'flood_ex_promote',
    'username' => 'root',
    'password' => requireEnv('CRAWLER_CENTER_CRAWLER_DB_PASSWORD'),
    'host' => '172.16.1.3', //localhost
    'port' => '3306',
    'driver' => 'mysql',
    'prefix' => '',
);

$databases['default']['combat'] = array (
    'database' => 'flood_ex_promote',
    'username' => 'root',
    'password' => requireEnv('CRAWLER_CENTER_COMBAT_DB_PASSWORD'),
    'host' => '172.16.1.3', //localhost
    'port' => '3306',
    'driver' => 'mysql',
    'prefix' => '',
);

$es_hosts_params = array(
    array(
        'host' => '172.16.1.14',
        'port' => '9200',
        'user' => 'elastic',
        'pass' => requireEnv('CRAWLER_CENTER_ES_PASSWORD'),
    ),
    array(
        'host' => '172.16.1.15',
        'port' => '9200',
        'user' => 'elastic',
        'pass' => requireEnv('CRAWLER_CENTER_ES_PASSWORD'),
    ),
    array(
        'host' => '172.16.1.16',
        'port' => '9200',
        'user' => 'elastic',
        'pass' => requireEnv('CRAWLER_CENTER_ES_PASSWORD'),
    )
);

$es_index_config = array(
    //facebook
    'user'=> array('index'=>'dt_account_v1', 'type'=>'dt_account'),
    'post'=> array('index'=>'dt_post_v1', 'type'=>'dt_post'),
    'reply'=> array('index'=>'dt_reply_v1', 'type'=>'dt_reply'),
    'praise'=> array('index'=>'dt_praise_v1', 'type'=>'dt_praise'),
    'forward'=> array('index'=>'dt_forward_v1', 'type'=>'dt_forward'),
    'friends'=> array('index'=>'dt_friends_v1', 'type'=>'dt_friends'),
    'dt_likes_post'=> array('index'=>'dt_likes_post_v1', 'type'=>'dt_likes_post'),
    'dt_likes_page'=> array('index'=>'dt_likes_page_v1', 'type'=>'dt_likes_page'),
    'user_group'=> array('index'=>'dt_user_group_v1', 'type'=>'dt_user_group'),
    'group_info'=> array('index'=>'dt_group_info_v1', 'type'=>'dt_group_info'),
    'group_member'=> array('index'=>'dt_group_member_v1', 'type'=>'dt_group_member'),
    'event_info' => array('index' => 'dt_event_info_v1', 'type' => 'dt_event_info'),
    'vote' => array('index' => 'dt_vote_v1', 'type' => 'dt_vote'),
    'account_trends'=> array('index'=>'dt_account_crawl_trend_v1', 'type'=>'dt_account_crawl_trend'),
    'page_likes'=> array('index'=>'dt_page_likes_v1', 'type'=>'dt_page_likes'),
    //twitter
    'twitter_user'=> array('index'=>'dt_twitter_account_v1', 'type'=>'dt_account'),
    'twitter_tweet'=> array('index'=>'dt_twitter_tweet_v1', 'type'=>'dt_tweet'),
    'twitter_follower'=> array('index'=>'dt_twitter_follower_v1', 'type'=>'dt_account_follower'),
    //news
    'sina'=> array('index'=>'dt_news_sina_v1', 'type'=>'dt_news_sina'),
    'news_sina_reply'=> array('index'=>'dt_news_sina_reply_v1', 'type'=>'dt_news_sina_reply'),
    '163'=> array('index'=>'dt_news_163_v1', 'type'=>'dt_news_163'),
    'news_163_reply'=> array('index'=>'dt_news_163_reply_v1', 'type'=>'dt_news_163_reply'),
    'qq'=> array('index'=>'dt_news_qq_v1', 'type'=>'dt_news_qq'),
    'news_qq_reply'=> array('index'=>'dt_news_qq_reply_v1', 'type'=>'dt_news_qq_reply'),
    'sohu'=> array('index'=>'dt_news_sohu_v1', 'type'=>'dt_news_sohu'),
    'news_sohu_reply'=> array('index'=>'dt_news_sohu_reply_v1', 'type'=>'dt_news_sohu_reply'),
    'ifeng'=> array('index'=>'dt_news_ifeng_v1', 'type'=>'dt_news_ifeng'),
    'news_ifeng_reply'=> array('index'=>'dt_news_ifeng_reply_v1', 'type'=>'dt_news_ifeng_reply'),
    'toutiao'=> array('index'=>'dt_news_toutiao_v1', 'type'=>'dt_news_toutiao'),
    'news_toutiao_reply'=> array('index'=>'dt_news_toutiao_reply_v1', 'type'=>'dt_news_toutiao_reply'),
    'wechat'=> array('index'=>'dt_wechat_subscription_v1', 'type'=>'dt_wechat_subscription'),
    'app_sohu'=> array('index'=>'dt_app_sohu_news_v1', 'type'=>'dt_app_sohu_news'),
    'crawler_history'=> array('index'=>'dt_crawler_request_history', 'type'=>'dt_crawler_request_history'),
    //other
    'mass_audience'=> array('index'=>'dt_mass_audience', 'type'=>'audience_info')
);

$crawler_db_options = array('target'=>'crawler');
$combat_db_options = array('target'=>'combat');

load_config();
copy_from($databases['default']['default'], CFG('database', array()));
