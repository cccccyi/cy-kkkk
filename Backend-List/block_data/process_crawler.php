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
    db_query('set names utf8mb4');
    return true;
}

function sendCurl($url, $post=false, $data=array()){
    $ch = curl_init();
    $headers = array(
        'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
    );

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_URL, $url);
    if($post){
        curl_setopt($ch, CURLOPT_POST, 1);
    }
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); // return don't print
    curl_setopt($ch, CURLOPT_TIMEOUT, 1200);
    if($data){
        curl_setopt($ch, CURLOPT_POSTFIELDS, to_json($data));
    }
    $content = curl_exec($ch);
    curl_close($ch);
    return $content;
}

function process_panews_news(){
    global $logger;
    $url = 'https://www.panewslab.com/zh/news/index.html';
    $lastTime = db_select('dt_news_list', 'n')->fields('n', array('last_update_time'))->condition('site', 'panews')->condition('new_type', '2')->orderBy('last_update_time', 'desc')->execute()->fetchField();
    $timeout = time() - $lastTime;
    $logger->info('last crawl panews news time: ' . date('Y-m-d H:i:s', $lastTime) . ', timeout: ' . $timeout);
    if($timeout < 30) {
        return;
    }
    $htmlStr = sendCurl($url);
    preg_match('/<script>window\.__NUXT__=\((.*?)\)<\/script>/', $htmlStr, $matches);
    print_r($matches);
    $logger->info($htmlStr);
    die;
    $query = db_select('tb_twitter_monitor_account', 't')->fields('t', array('id', 'screen_name', 'created_at', 'description'));
    $query->condition('name', null, 'is not');
    //$query->condition('ai_summary_intro', null, 'is');
    $query->orderBy('followers_count', 'desc');
    $query->range(0, 100);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        //$logger->info($row);
        $screenName = $row['screen_name'];
        $tweets = array();
        $tweetQuery = db_select('dt_twitter_crawler_tweet', 'p')->fields('p', array('created_at', 'full_text'));
        $tweetQuery->condition('screen_name', $screenName);
        $tweetQuery->orderBy('created_at', 'desc');
        //$tweetQuery->range(0, 30);
        $tweetResult = $tweetQuery->execute();
        while($tweet = $tweetResult->fetchAssoc()){
            $tweets[] = array(
                'created_at'=> $tweet['created_at'],
                'description'=> $tweet['full_text']
            );
        }
        $tweetsStr = to_json($tweets);
        $prompt = <<<here
        你是一个社交媒体数据分析专家。我将提供一个 Twitter 账号的简介和部分历史推文，请你分析该账号的所属行业，总结它的核心关注点，一句话简短介绍本账号，概括账号的语言风格。请以 JSON 格式输出结果。
        账号简介：${row['description']}
        部分推文：${tweetsStr}
        要求：
            1. 所属行业：从 加密货币、科技、金融、娱乐、教育、医疗、体育、游戏、电商、新闻、政治、艺术、环境、其他 中选择一个最符合的行业。
            2. 关注点：总结 3-5 个该账号最关注的话题
            3. 一句话介绍本账号，让人快速知道这个账号的角色，如：币安CEO, 足球明星
            4. 总结账号的语言风格
            4. 以 JSON 格式输出，格式如下：
            {
                "industry": "行业名称",
                "focus_points": ["话题1", "话题2", "话题3"],
                "intro": "介绍本账号",
                "style": "语言风格"
            }
            请直接输出 JSON，不使用markdown格式，不要添加额外的文字或解释。
here;
        /**
         * 2.尽量分条目输出内容，且插入恰当的小图标；
         */
        $system = <<<here
        你是一个社交媒体分析专家
here;
        $logger->info($prompt);
        $text = generateTextByChatGPT($system, $prompt);
        if($text){
            $info = json_from_string($text);
            $logger->info($info['style']);
            $industry = $info['industry'];
            $intro = $info['intro'];
            //$logger->info('industry: ' . $industry);
            if($industry){
                $updateItem = array(
                    'ai_judge_industry'=> $industry,
                    'ai_summary_intro'=> $intro
                );
                db_update('tb_twitter_monitor_account')->fields($updateItem)->condition('id', $row['id'])->execute();
            }
        }
    }
}

function run_system(){
    while(true){
        process_panews_news();
        die;
        sleep(2);
    }
}

function test_system(){

}
