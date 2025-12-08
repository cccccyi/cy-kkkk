<?php
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
load_config();
$databases['default']['default'] = array (
    'database' => 'block_chain',
    'username' => 'root',
    'password' => 'HSXpwd@123',
    'host' => '82.157.161.88',
    'port' => '',
    'driver' => 'mysql',
    'prefix' => '',
);

$databases['default']['v5'] = array (
    'database' => 'flood_ex_v5_ct',
    'username' => 'root',
    'password' => 'HbRzx1218@8888',
    'host' => '172.16.1.51',
    'port' => '',
    'driver' => 'mysql',
    'prefix' => '',
);

$databases['default']['combat'] = array (
    'database' => 'flood_ex_promote',
    'username' => 'root',
    'password' => 'rzx@1218.com',
    'host' => '172.16.1.3', //localhost
    'port' => '3306',
    'driver' => 'mysql',
    'prefix' => '',
);

$databases['default']['his'] = array (
    'database' => 'WISHISV6',
    'username' => 'root',
    'password' => 'HSXpwd@123',
    'host' => '127.0.0.1', //localhost
    'port' => '3306',
    'driver' => 'mysql',
    'prefix' => ''
);

$es_hosts_params = array(
    array(
        'host' => '172.16.1.3',
        'port' => '9200',
        'user' => 'elastic',
        'pass' => 'HbRzx1218@8888',
    )
);

$es_hosts_params_v5 = array(
    array(
        'host' => '172.16.1.53',
        'port' => '9200',
        'user' => 'elastic',
        'pass' => 'HbRzx1218@8888',
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
    'group_info'=> array('index'=>'dt_group_info_v1', 'type'=>'dt_group_info'),
    'group_member'=> array('index'=>'dt_group_member_v1', 'type'=>'dt_group_member'),
    'dt_likes_post'=> array('index'=>'dt_likes_post_v1', 'type'=>'dt_likes_post'),
    'dt_likes_page'=> array('index'=>'dt_likes_page_v1', 'type'=>'dt_likes_page'),
    'user_group'=> array('index'=>'dt_user_group_v1', 'type'=>'dt_user_group'),
    'event_info' => array('index' => 'dt_event_info_v1', 'type' => 'dt_event_info'),
    'page_likes'=> array('index'=>'dt_page_likes_v1', 'type'=>'dt_page_likes'),
    'account_trend'=> array('index'=>'fb_account_crawl_trend', 'type'=>'account_info'),
    'fb_friends'=> array('index'=>'fb_friends_crawl', 'type'=>'friend_info'),
    'page_trend'=> array('index'=>'fb_page_crawl_trend', 'type'=>'page_info'),
    'group_trend'=> array('index'=>'fb_group_crawl_trend', 'type'=>'group_info'),
    'fb_post'=> array('index'=>'fb_post_crawl', 'type'=>'post_info'),
    'account_influence'=> array('index'=>'account_influence', 'type'=>'account_influence'),
    'account_interactive'=> array('index'=>'account_interactive', 'type'=>'account_interactive'),
    //twitter
    'twitter_user'=> array('index'=>'dt_twitter_account_v1', 'type'=>'dt_account'),
    'twitter_tweet'=> array('index'=>'dt_twitter_tweet_v1', 'type'=>'dt_tweet'),
    'twitter_follower'=> array('index'=>'dt_twitter_follower_v1', 'type'=>'dt_account_follower'),
    'tw_account_trend'=> array('index'=>'tw_account_crawl_trend', 'type'=>'account_info'),
    'tw_followers'=> array('index'=>'tw_followers_crawl', 'type'=>'follower_info'),
    //check out
    'check'=> array('index'=>'tb_virtual', 'type'=>'tb_virtual'),
    'virtual'=>array('index'=>'tb_virtual', 'type'=>'tb_virtual'),
    'fb_app_info'=> array('index'=>'facebook_appinfo', 'type'=>'appinfo'),
    'tw_app_info'=> array('index'=>'twitter_appinfo', 'type'=>'appinfo'),
    //guid task
    'guid_fb_page'=> array('index'=>'dt_guid_page_info_v1', 'type'=>'dt_guid_page_info'),
    'guid_fb_page_memebr'=> array('index'=>'dt_guid_page_member_v1', 'type'=>'dt_guid_page_member'),
    'guid_fb_group'=> array('index'=>'dt_guid_group_info', 'type'=>'dt_guid_group_info'),
    'guid_fb_group_memebr'=> array('index'=>'dt_guid_group_member_v1', 'type'=>'dt_guid_group_member'),
    'guid_task'=> array('index'=>'guid_task_crawler_v1', 'type'=>'guid_task_crawler'),
    'small_account'=> array('index'=>'tb_small_account', 'type'=>'tb_small_account'),
    'guid_operation'=> array('index'=>'operation', 'type'=>'operation'),
    //other
    'reply_word_split'=> array('index'=>'dt_reply_split_word_v1', 'type'=>'dt_reply_split_word'),
    'account_trends'=> array('index'=>'dt_account_crawl_trend_v1', 'type'=>'dt_account_crawl_trend'),
    'crawler_history'=> array('index'=>'dt_crawler_request_history', 'type'=>'dt_crawler_request_history'),
    'mass_audience'=> array('index'=>'dt_mass_audience', 'type'=>'audience_info'),
    'operation_detail' => array('index'=>'operation_detail_info'),
);
$combat_db_options = array('target'=>'combat');
$his_db_options = array('target'=> 'his');

copy_from($databases['default']['default'], CFG('database', array()));
