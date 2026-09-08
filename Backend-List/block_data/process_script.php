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

function sendChatGPTCurl($url, $data){
    $apiKey = requireEnv('OPENAI_API_KEY');
    $ch = curl_init();
    $headers = array(
        'Content-Type: application/json',
        'Authorization: Bearer '. $apiKey
    );
    // 设置代理（HTTP 代理示例）
    // curl_setopt($ch, CURLOPT_PROXY, "http://179.61.111.209:999");

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
    $info = $info['data'][0];
    $logger->info($info);
    if(isset($info['url'])){
        $imageURL = $info['url'];
        //$image_content = file_get_contents($imageURL);
        //file_put_contents($new_pic, $image_content);
        $destination = '/data/block_chain/twitter/corpus/' . time() . '_' . uniqid() . '.png';
        $maxWidth = 256;
        $maxHeight = 256;
        shrinkImage($imageURL, $destination, $maxWidth, $maxHeight);
        return $imageURL;
    }
    return false;
}

function process_judge_twitter_target(){
    global $logger;
    $query = db_select('tb_twitter_monitor_account', 't')->fields('t', array('id', 'screen_name', 'created_at', 'description'));
    $query->condition('name', null, 'is not');
    $query->condition('ai_judge_lang', null, 'is');
    $query->condition('is_blue_verified', 1);
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
        $tweetQuery->range(0, 10);
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

function hasChineseExcludeJapanese($str) {
    // 匹配中文（CJK 统一汉字），但排除日文平假名和片假名
    if (preg_match('/[\x{4e00}-\x{9fff}]/u', $str) && // 包含中文
        !preg_match('/[\x{3040}-\x{309f}\x{30a0}-\x{30ff}]/u', $str)) { // 不含平假名、片假名
        return true;
    }
    return false;
}

function process_collect_monitor_account(){
    global $logger;
    //$names = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('screen_name'))->condition('a.is_blue_verified', '1')->condition('a.ai_judge_industry', '加密货币')->condition('a.ai_judge_lang', '中文')->condition('crawl_interval_time', 11111)->execute()->fetchCol();
    //$logger->info('names count: ' . count($names));

    /**
    // 更新
    $query = db_select('tb_twitter_followings_account', 'f')->fields('f', array('screen_name'));
    $query->condition('is_blue_verified', '1');
    $query->groupBy('screen_name');
    $result = $query->execute();
    $names = array();
    while($row = $result->fetchAssoc()){
        $names[] = $row['screen_name'];
    }
    $logger->info('names len: ' . count($names));
    $names_arr = array_chunk($names, 1000);
    foreach($names_arr as $arr){
        $ns = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('screen_name'))->condition('screen_name', $arr)->condition('is_blue_verified', '')->execute()->fetchCol();
        if($ns){
            $logger->info(count($ns) . ', update is_blue_verified');
            db_update('tb_twitter_monitor_account')->fields(array('is_blue_verified'=> '1'))->condition('screen_name', $ns, 'in')->execute();
        }
    }
    die;
    **/


    // 从历史累计收集到的帖子中， 将蓝V 中文号收集
    $sql = "select distinct t.screen_name,t.name,t.description from dt_twitter_crawler_tweet t left join tb_twitter_monitor_account a on t.screen_name=a.screen_name where t.id>4430000 and t.is_blue_verified='1' and a.id is null order by t.id limit 200000";
    $result = db_query($sql);
    while($row = $result->fetchAssoc()){
        $screen_name = $row['screen_name'];
        $existA = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id'))->condition('screen_name',  $row['screen_name'])->execute()->fetchAssoc();
        if($existA){
            continue;
        }
        $str = $row['name'] . $row['description'];
        $tweets = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('full_text'))->condition('screen_name', $screen_name)->execute()->fetchCol();
        $str .= implode($tweets);
        if(!hasChineseExcludeJapanese($str)){
            //$logger->info("不包含中文 ...");
            continue;
        }
        $account = array(
            'screen_name'=> $row['screen_name'],
            'is_blue_verified'=> '1'
        );
        if(!$existA){
            $logger->info($row);
            $account['insert_time'] = time();
            db_insert('tb_twitter_monitor_account')->fields($account)->execute();
        }
    }

    // 通过 账号 描述 推文信息， 包含字符判断是否是 中文 币圈
    $words = array(
        '加密',
        '区块链',
        '區塊鏈',
        '去中心',
        '币圈',
        '炒币',
        '链上',
        '链游',
        '空投',
        '撸毛',
        '薅羊毛',
        '韭菜',
        '数字货币',
        '币安',
        '欧易',
        '芝麻',
        '幣安',
        '歐易',
        '土狗',
        '金狗',
        '冲狗',
        '打狗',
        '比特',
        '以太',
        '现货',
        '合约',
        '代币',
        '铭文',
        '符文',
        '持币',
        '投研',
        '返佣',
        'P小将',
        'E卫士',
        '套利',
        '赌狗',
        '治理',
        '流动性',
        '质押',
        '挂单',
        '上币',
        '新币',
        '发射',
        '交易',
        '滑点',
        '挖矿',
        '撮合',
        '费率',
        '巨鲸'
    );
    $en_words = array(
        'web3',
        'crypto',
        'Crypto',
        'BTC',
        'ETH',
        'SOL',
        'defi',
        'meme',
        'NFT',
        'bitcoin',
        'binance',
        'OKX',
        'Gate',
        'Bybit',
        'DYOR',
        'GMGN',
        'WEEX',
        'KYC'
    );
    $query = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id', 'name', 'description', 'screen_name', 'ai_judge_lang', 'ai_judge_industry'));
    $db_or = db_or()->condition('ai_judge_lang', '中文', '!=')->condition('ai_judge_industry', '加密货币', '!=');
    $query->condition($db_or)->condition('ai_judge_lang', null, 'is not');
    $query->condition('ai_judge_industry', '政治', '!=');
    $query->orderBy('id');
    //$query->range(0, 10000);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        //$logger->info($row);
        $screen_name = $row['screen_name'];
        $name = $row['name'];
        $description = $row['description'];
        $str = $name . ' ' . $description;
        $tweets = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('full_text'))->condition('screen_name', $screen_name)->execute()->fetchCol();
        $str .= implode($tweets);
        $flag = false;
        foreach($words as $word){
            if(strpos($str, $word) !== false){
                $flag = true;
                break;
            }
        }
        if($row['ai_judge_lang'] == '中文'){
            foreach($en_words as $word){
                if(strpos($str, $word) !== false){
                    $flag = true;
                    break;
                }
            }
        }
	$logger->info($row);
        if($flag){
            echo $row['id'] . " , " . $row['screen_name'] . " , " . $row['ai_judge_lang'] . " , " . $row['ai_judge_industry'] . "\n";
            $logger->info("\n\n ====================================");
            $logger->info($str);
            $fields = array(
                'ai_judge_lang'=>'中文',
                'ai_judge_industry'=>'加密货币',
                'ai_judge_industry_origin'=>$row['ai_judge_lang'] . '-' . $row['ai_judge_industry']
            );
            db_update('tb_twitter_monitor_account')->fields($fields)->condition('id', $row['id'])->execute();
        }
    }


    $query = db_select('tb_twitter_followings_account', 'f')->fields('f', array('screen_name','name','description', 'is_blue_verified'));
    $query->leftJoin('tb_twitter_monitor_account', 'a', 'a.screen_name=f.screen_name');
    //$query->condition('f.belongs_screen_name', $names);
    $query->condition('f.is_blue_verified', '1');
    $query->condition('a.id', null, 'is');
    $query->condition('f.id', 900000, '>=');
    //->condition('f.id', 900000, '<');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $str = $row['name'] . $row['description'];
        if(!hasChineseExcludeJapanese($str)){
            //$logger->info("不包含中文 ...");
            continue;
        }
        $logger->info($row);
        $account = array(
            'name'=> $row['name'],
            'screen_name'=> $row['screen_name'],
            'is_blue_verified'=> $row['is_blue_verified'],
            'description'=> $row['description']
        );
        $existA = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id'))->condition('screen_name',  $row['screen_name'])->execute()->fetchAssoc();
        if(!$existA){
            $account['insert_time'] = time();
            db_insert('tb_twitter_monitor_account')->fields($account)->execute();
        }
    }

    $query = db_select('tb_twitter_followers_account', 'f')->fields('f', array('screen_name', 'name', 'description','is_blue_verified'));
    $query->leftJoin('tb_twitter_monitor_account', 'a', 'a.screen_name=f.screen_name');
    //$query->condition('f.belongs_screen_name', $names);
    $query->condition('f.is_blue_verified', '1');
    $query->condition('a.id', null, 'is');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $str = $row['name'] . $row['description'];
        if(!hasChineseExcludeJapanese($str)){
            //$logger->info("不包含中文 ...");
            continue;
        }
        $logger->info($row);
        $account = array(
            'name'=> $row['name'],
            'screen_name'=> $row['screen_name'],
            'is_blue_verified'=> $row['is_blue_verified'],
            'description'=> $row['description']
        );
        $existA = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id'))->condition('screen_name',  $row['screen_name'])->execute()->fetchAssoc();
        if(!$existA){
            $account['insert_time'] = time();
            db_insert('tb_twitter_monitor_account')->fields($account)->execute();
        }
    }
    // 通过关键字收集到的账号
    $query = db_select('tb_twitter_search_collect_account', 's')->fields('s', array('id', 'screen_name', 'name', 'description','is_blue_verified'));
    $query->leftJoin('tb_twitter_monitor_account', 'a', 'a.screen_name=s.screen_name');
    $query->condition('s.is_blue_verified', '1');
    $query->condition('a.id', null, 'is');
    $result = $query->execute();
    $logger->info('通过关键词收集账号： ' . $result->rowCount());
    while($row = $result->fetchAssoc()){
        $str = $row['name'] . $row['description'];
        if(!hasChineseExcludeJapanese($str)){
            //$logger->info("不包含中文 ...");
            continue;
        }
        $logger->info($row);
        $account = array(
            'name'=> $row['name'],
            'screen_name'=> $row['screen_name'],
            'is_blue_verified'=> $row['is_blue_verified'],
            'description'=> $row['description']
        );
        $existA = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id'))->condition('screen_name',  $row['screen_name'])->execute()->fetchAssoc();
        if(!$existA){
            $account['insert_time'] = time();
            db_insert('tb_twitter_monitor_account')->fields($account)->execute();
        }
    }
    die;

    // 根据关键字收集账号
    $words = array(
        '加密', '币', '链', '撸毛', '空投', 'web3', 'crypto', '以太'
    );
    $db_or = db_or();
    foreach($words as $word){
        $db_or->condition('t.name', '%' . $word . '%', 'like');
    }
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', array('name', 'screen_name'));
    $query->leftJoin('tb_twitter_monitor_account', 'a', 'a.screen_name=t.screen_name');
    $query->condition('t.is_blue_verified', '1');
    $query->condition($db_or);
    $query->condition('a.id', null, 'is');
    $result = $query->execute();
    $logger->info('tweet match word count: ' . $result->rowCount());
    while($row = $result->fetchAssoc()){
        $account = array(
            'screen_name'=> $row['screen_name'],
            'is_blue_verified'=> '1'
        );
        $existA = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id'))->condition('screen_name',  $row['screen_name'])->execute()->fetchAssoc();
        if(!$existA){
            $logger->info($row);
            $account['insert_time'] = time();
            db_insert('tb_twitter_monitor_account')->fields($account)->execute();
        }
    }
    $query = db_select('tb_twitter_followings_account', 't')->fields('t', array('name', 'screen_name'));
    $query->leftJoin('tb_twitter_monitor_account', 'a', 'a.screen_name=t.screen_name');
    $query->condition('t.is_blue_verified', '1');
    $query->condition($db_or);
    $query->condition('a.id', null, 'is');
    $result = $query->execute();
    $logger->info('followings match word count: ' . $result->rowCount());
    while($row = $result->fetchAssoc()){
        $account = array(
            'screen_name'=> $row['screen_name'],
            'is_blue_verified'=> '1'
        );
        $existA = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id'))->condition('screen_name',  $row['screen_name'])->execute()->fetchAssoc();
        if(!$existA){
            $logger->info($row);
            $account['insert_time'] = time();
            db_insert('tb_twitter_monitor_account')->fields($account)->execute();
        }
    }
    $query = db_select('tb_twitter_followers_account', 't')->fields('t', array('name', 'screen_name'));
    $query->leftJoin('tb_twitter_monitor_account', 'a', 'a.screen_name=t.screen_name');
    $query->condition('t.is_blue_verified', '1');
    $query->condition($db_or);
    $query->condition('a.id', null, 'is');
    $result = $query->execute();
    $logger->info('followers match word count: ' . $result->rowCount());
    while($row = $result->fetchAssoc()){
        $account = array(
            'screen_name'=> $row['screen_name'],
            'is_blue_verified'=> '1'
        );
        $existA = db_select('tb_twitter_monitor_account', 'a')->fields('a', array('id'))->condition('screen_name',  $row['screen_name'])->execute()->fetchAssoc();
        if(!$existA){
            $logger->info($row);
            $account['insert_time'] = time();
            db_insert('tb_twitter_monitor_account')->fields($account)->execute();
        }
    }
}

function process_meme_rank_data_json(){
    $json = file_get_contents('0324-bsc.json');
    $data = json_from_string($json);
    $rank = $data['data']['rank'];
    foreach($rank as $info){
        $items[] = array(
            'symbol'=> $info['symbol'],
            'icon'=> $info['logo'],
            'price'=> $info['price'],
            'market_cap'=> $info['market_cap'],
            'liquidity'=> $info['liquidity'],
            'holder_count'=> $info['holder_count'],
            'volume'=> $info['volume'],
            'change'=> $info['price_change_percent']
        );
    }
    $fields = array('symbol', 'icon', 'price', 'market_cap', 'liquidity', 'holder_count', 'volume', 'change');
    array_unshift($items, $fields);
    $tables = array(
        array(
            'title'=> 'page_list',
            'data'=> $items,
            'width'=> array(
                'A'=> 15,  //page_fid
                'B'=> 25,  //name
                'C'=> 10,  //page_type
                'D'=> 10,  //page_available
                'E'=> 10,  //page_likers
                'F'=> 10,  //followers_count
                'G'=> 10,   //belong_project
                'H'=> 10
            )
        )
    );
    $fileName = 'icon_rank_list';
    $type = "string";
    $titleColor = "FFFFFF";
    $version = '2007';
    data_to_excel_file($fileName, $tables, $type, $titleColor, $version);
}

function process_meme_rank_data(){
    $chain = 'eth';
    $items = array();
    $fields = array('id','symbol','chain','market_cap','volume','liquidity','holder_count','price','price_change','icon');
    $query = db_select('dt_gmgn', 'g')->fields('g', $fields);
    if($chain){
        $query->condition('chain', $chain);
    }
    $query->orderBy('volume', 'desc');
    $query->range(0, 30);
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $items[] = array(
            'symbol'=> $row['symbol'],
            'icon'=> $row['icon'],
            'price'=> $row['price'],
            'market_cap'=> $row['market_cap'],
            'liquidity'=> $row['liquidity'],
            'holder_count'=> $row['holder_count'],
            'volume'=> $row['volume'],
            'change'=> $row['price_change']
        );
    }
    $fields = array('symbol', 'icon', 'price', 'market_cap', 'liquidity', 'holder_count', 'volume', 'change');
    array_unshift($items, $fields);
    $tables = array(
        array(
            'title'=> 'page_list',
            'data'=> $items,
            'width'=> array(
                'A'=> 15,  //page_fid
                'B'=> 25,  //name
                'C'=> 10,  //page_type
                'D'=> 10,  //page_available
                'E'=> 10,  //page_likers
                'F'=> 10,  //followers_count
                'G'=> 10,   //belong_project
                'H'=> 10
            )
        )
    );
    $fileName = $chain . '_icon_rank_list';
    $type = "string";
    $titleColor = "FFFFFF";
    $version = '2007';
    data_to_excel_file($fileName, $tables, $type, $titleColor, $version);
}

function process_odin_rank_data(){
    $json = file_get_contents('0326-odin.json');
    $data = json_from_string($json);
    $rank = $data['data'];
    $btcPrice = 88148;
    foreach($rank as $info){
        $items[] = array(
            'symbol'=> $info['ticker'],
            'icon'=> 'https://images.odin.fun/token/' . $info['id'],
            'price'=> $info['price'] / 100000000000 * $btcPrice,
            'market_cap'=> $info['marketcap'] / 100000000000 * $btcPrice,
            'liquidity'=> $info['btc_liquidity'],
            'holder_count'=> $info['holder_count'],
            'volume'=> $info['volume'] / 100000000000 * $btcPrice,
            'change'=> ($info['price'] - $info['price_1d']) / $info['price_1d'] * 100
        );
    }
    $fields = array('symbol', 'icon', 'price', 'market_cap', 'liquidity', 'holder_count', 'volume', 'change');
    array_unshift($items, $fields);
    $tables = array(
        array(
            'title'=> 'page_list',
            'data'=> $items,
            'width'=> array(
                'A'=> 15,  //page_fid
                'B'=> 25,  //name
                'C'=> 10,  //page_type
                'D'=> 10,  //page_available
                'E'=> 10,  //page_likers
                'F'=> 10,  //followers_count
                'G'=> 10,   //belong_project
                'H'=> 10
            )
        )
    );
    $fileName = 'odin_rank_list';
    $type = "string";
    $titleColor = "FFFFFF";
    $version = '2007';
    data_to_excel_file($fileName, $tables, $type, $titleColor, $version);
}

function process_biance_alpha(){
    global $logger;
    $items = array();
    $query = db_select('dt_bnb_alpha', 'a')->fields('a', array('symbol', 'icon', 'volume', 'price', 'price_change'));
    $query->orderBy('volume', 'desc');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $items[] = array(
            'symbol'=> $row['symbol'],
            'icon'=> $row['icon'],
            'price'=> $row['price'],
            'volume'=> $row['volume'],
            'change'=> $row['price_change']
        );
    }
    $fields = array('symbol', 'icon', 'price','volume', 'change');
    array_unshift($items, $fields);
    $tables = array(
        array(
            'title'=> 'page_list',
            'data'=> $items,
            'width'=> array(
                'A'=> 15,  //page_fid
                'B'=> 25,  //name
                'C'=> 10,  //page_type
                'D'=> 10,  //page_available
                'E'=> 10   //page_likers
            )
        )
    );
    $fileName = 'alpha_rank_list';
    $type = "string";
    $titleColor = "FFFFFF";
    $version = '2007';
    data_to_excel_file($fileName, $tables, $type, $titleColor, $version);
}

function process_tender_data(){
    global $logger;
    $items = array();
    $fields = array(
        'id', 'site', 'title', 'url', 'url_md5', 'city_code', 'uniseq', 'type', 'addr', 'tender_date', 'status', 'insert_time', 'last_update_time'
    );
    $query = db_select('dt_tender_list', 'a')->fields('a',$fields);
    $query->condition('id', array(226, 134, 243, 144, 145, 234), 'not in');
    $query->orderBy('tender_date', 'desc');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $items[] = array(
            'site'=> $row['site'],
            'uniseq'=> $row['uniseq'],
            'title'=> $row['title'],
            'addr'=> $row['addr'],
            'tender_date'=> $row['tender_date'],
            'type'=> $row['type']
        );
    }
    $fields = array('网站', '编号', '标题','地址', '时间', '类型');
    array_unshift($items, $fields);
    $tables = array(
        array(
            'title'=> 'page_list',
            'data'=> $items,
            'width'=> array(
                'A'=> 15,  //page_fid
                'B'=> 25,  //name
                'C'=> 100,  //page_type
                'D'=> 20,  //page_available
                'E'=> 20,   //page_likers
                'F'=> 20
            )
        )
    );
    $fileName = '招标数据_tender_list';
    $type = "string";
    $titleColor = "FFFFFF";
    $version = '2007';
    data_to_excel_file($fileName, $tables, $type, $titleColor, $version);
}

function process_meme_images(){
    global $logger;
    $query = db_select('dt_gmgn', 'g')->fields('g', array('id', 'symbol', 'chain', 'icon'));
    $query->condition('icon', '%82.157.161.88%', 'not like');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info($row);
        $imagePath = '/data/meme_images/' . $row['chain'] . '_' . $row['symbol'].'.jpg';
        if(!file_exists($imagePath)){
            $imageData = file_get_contents($row['icon']);
            //$imageData = curl_request($row['icon']);
            if ($imageData !== false) {
                file_put_contents($imagePath, $imageData);
            }
        }
    }

}

function sendDingTalkMessage() {
    $access_token = requireEnv('DINGTALK_SCRIPT_ACCESS_TOKEN');
    $secret = requireEnv('DINGTALK_SCRIPT_SIGNING_SECRET');
    // 计算时间戳（毫秒）
    $timestamp = round(microtime(true) * 1000);
    // 计算签名
    $string_to_sign = $timestamp . "\n" . $secret;
    $sign = base64_encode(hash_hmac('sha256', $string_to_sign, $secret, true));
    $sign = urlencode($sign); // URL 编码

    // 构造 Webhook URL
    $webhook_url = "https://oapi.dingtalk.com/robot/send?access_token={$access_token}&timestamp={$timestamp}&sign={$sign}";

    // 发送的 JSON 数据
    $data = [
        "msgtype" => "text",
        "text" => [
            "content" => "⚠巨鲸推文！\n采集到巨鲸推文，请尽快处理！"
        ],
        "at" => [
            "atMobiles" => ["13800138000"],
            "isAtAll" => false
        ]
    ];
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
        curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 1200);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

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

function huoshanAudio(){
    global $logger;
    $appid = requireEnv('HUOSHAN_APP_ID');
    $access_token = requireEnv('HUOSHAN_ACCESS_TOKEN');
    $cluster = 'volcano_tts';

    $voice_type_arr = array(
        'zh_female_meilinvyou_moon_bigtts', // 魅力女友
        'zh_male_shenyeboke_moon_bigtts', // 深夜博客
        'zh_female_linjianvhai_moon_bigtts',    // 邻家女孩
        'zh_female_shuangkuaisisi_moon_bigtts', //爽快思思
        'ICL_zh_female_huoponvhai_tob',     // 活泼女孩
        'zh_female_kailangjiejie_moon_bigtts',      // 开朗姐姐
        'zh_female_cancan_mars_bigtts',     // Anna
        'zh_female_qingxinnvsheng_mars_bigtts'  // 清亮女声
    );

    //$voice_type = 'ICL_zh_female_huoponvhai_tob';
    $host = 'openspeech.bytedance.com';
    $api_url = 'https://' . $host . '/api/v1/tts';

    $header = array(
        "Authorization: Bearer;${access_token}"
    );
    foreach($voice_type_arr as $voice_type) {
        $request_json = array(
            'app' => array(
                'appid' => $appid,
                'token' => $access_token,
                'cluster' => $cluster
            ),
            'user' => array(
                'uid' => "388808087185088"
            ),
            'audio' => array(
                'voice_type' => $voice_type,
                'encoding' => 'mp3',
                'speed_ratio' => '1.0',
                'volume_ratio' => '1.0',
                'pitch_ratio' => '1.0'
            ),
            'request' => array(
                'reqid' => uniqid(),
                'text' => '哈世链闻消息，三上悠亚推出的个人Meme币Mikami已公布，总供应量为6900万枚，预计流通市值为845万美元。根据链上分析师余烔发布的帖子，每1枚Mikami的预售价格约为0.00169 SOL，换算为约0.245美元。该币种的总体市值为1690万美元，其中有50%将锁定至2069年，而流通市值（50%）即为845万美元。该代币的分配比例为：首次销售20%；流动性15%；社区10%；营销5%；三上悠亚个人持有50%（锁仓至2069年）。',
                'text_type' => 'plain',
                'operation' => 'query',
                'with_frontend' => 1,
                'frontend_type' => 'unitTson'
            )
        );
        $data = curl_request($api_url, true, to_json($request_json), '', $retry_times = 2, $header);
        $logger->info($data);
        $info = json_from_string($data);
        $audioDataBase64 = $info['data'];
        $audioData = base64_decode($audioDataBase64);
        file_put_contents('./mp3/Mikami_' . $voice_type . '.mp3', $audioData);
    }
}

function save_tweets(){
    global $logger;
    $token = 'SkyAI';
    $file = './' . $token . '_tweets.txt';
    file_put_contents($file, '');
    $fields = array('id', 'tweet_id', 'screen_name', 'in_reply_to_status_id', 'created_at', 'full_text');
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', $fields);
    //$query->condition('screen_name', 'liangxihuigui');
    $query->condition('full_text', '%'.$token.'%', 'like');
    $query->orderBy('created_at');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        preg_match_all('/\$[A-Z]+/', $row['full_text'], $matches);
        $tokens = array_unique($matches[0]);
        if(count($tokens) > 4){
            $logger->info($row);
            continue;
        }
        $type = '推文';
        if($row['in_reply_to_status_id']){
            $type = '评论';
        }
        $str = '账号：@'. $row['screen_name'] . "\n";
        $str .= '时间：' . date('Y-m-d H:i;s', $row['created_at']) . "\n";
        $str .= '类型：' . $type . "\n";
        $str .= "文本：" . $row['full_text'] . "\n\n";
        file_put_contents($file, $str, FILE_APPEND);
    }
}

function save_24hours_data(){
    global $logger;
    $file = './daily_data_tweets_' . date('YmdHis') . '.txt';
    $exclude_screen_names = array(
        'narendramodi'  // 印度总理 莫迪 Narendra Modi
    );
    $tweets = array();
    $end_time = strtotime('2025-05-17 21:00');
    $start_time = $end_time - 24 * 3600;
    $fields = array('id', 'screen_name', 'full_text', 'created_at');
    $query = db_select('dt_twitter_crawler_tweet', 't')->fields('t', $fields);
    $query->condition('screen_name', $exclude_screen_names, 'not in');
    $query->condition('in_reply_to_user_id', null, 'is');
    $query->condition('created_at', $start_time, '>=')->condition('created_at', $end_time, '<=', $end_time);
    $query->orderBy('created_at');
    $result = $query->execute();
    while($row = $result->fetchAssoc()){
        $logger->info($row);
        $screen_name = $row['screen_name'];
        if(!isset($tweets[$screen_name])){
            $tweets[$screen_name] = array(
                'screen_name'=> $screen_name,
                'tweet' => array()
            );
            $tweets[$screen_name]['tweet'][] = array(
                'created_at'=> date('Y-m-d H:i:s', $row['created_at']),
                'full_text'=> $row['full_text']
            );
        }
    }
    $data = array_values($tweets);
    file_put_contents($file, to_json($data));
}

function run_system(){
    while(true){
        process_judge_twitter_target();
        process_collect_monitor_account();
        //process_meme_rank_data();
        //process_odin_rank_data();
        //process_biance_alpha();
        //process_meme_images();
        //sendDingTalkMessage();
        //process_tender_data();
        //huoshanAudio();
        //save_tweets();
        //save_24hours_data();
        die;
        sleep(2);
    }
}

function test_system(){

}
