<?php
require_once(PP_ES_ROOT . '/vendor/autoload.php');
require_once(PP_ES_ROOT . '/Elasticsearch/ClientBuilder.php');

define('RB_TASK_STOP_STATUS', '5');
define('RB_TASK_RUNNING_STATUS', '1');
define('RB_TASK_FINISH_STATUS', '3');

define('RB_WARNING_NORMAL', '1');
define('RB_WARNING_ERROR', '2');
define('RB_WARNING_CRITICAL', '3');

function get_es_client(){
    global $es_params;
    $es_client = Elasticsearch\ClientBuilder::create()->setHosts($es_params)->build();
    return $es_client;
}
function  get_all_es_results($es_client, $params){
    $data = array();
    $size = 5000;
    $page = 1;
    $params['size'] = $size;
    do{
        $params['from'] = ($page -1) * $size;
        $es_results = $es_client->search($params);
        $results = get_es_results($es_results);
        if($results['total'] > 0){
            $data = array_merge($data, $results['data']);
        }
        $page++;
    }while($results['total'] == $size);
    return $data;
}

function load_site_ids()
{
    global $site_ids, $site_id_names;

    $result = db_select('tb_social_website', 'a')->fields('a', array('id', 'site_name'))->execute();
    while (($r = $result->fetchAssoc()))
    {
        $site_ids[$r['site_name']] = $r['id'];
    }
    $site_id_names = array_flip($site_ids);
}
function set_available_account_condition(&$query)
{
    $query->condition('is_verified', 'y', '=');
    $query->where('is_active=1');
}
function set_task_error_message($task_table_name, $id, $err)
{
    db_update($task_table_name)
        ->fields(array(
            'error_message' => $err,
        ))->condition('id', $id)
        ->execute();
}
function stop_task($task_table_name, $operation_table_name, $id, $err, $operation_id = 0)
{
    $now = time();
    $up = array(
        'status' => RB_TASK_STOP_STATUS,
        'stop_time' => get_datetime($now),
    );
    // if no $operation_table_name, just update the task table status
    if ($operation_table_name)
    {
        db_update('tb_task_effect_operation')->fields(array(
            'exec_status' => 'z',
        ))->condition('parent_id', $id)->condition('exec_status', array('n', 'r', 'p'), 'in')->execute();
        $table_names = array();
        if ($task_table_name == 'tb_forum_send_task')
        {
            $up['error_message'] = 'Task is stopped because of related forum sending task is failed';
            $table_names[] = 'tb_forum_reply_task';
        }
        else if ($task_table_name == 'tb_tieba_send_task')
        {
            $up['error_message'] = 'Task is stopped because of related tieba sending task is failed';
            $table_names[] = 'tb_tieba_reply_task';
        }
        else if ($task_table_name == 'tb_twitter_send_task')
        {
            $up['error_message'] = 'Task is stopped because of related twitter sending task is failed';
            $table_names[] = 'tb_twitter_reply_task';
            $table_names[] = 'tb_twitter_praise_task';
            $table_names[] = 'tb_twitter_forward_task';
        }
        foreach ($table_names as $related_table)
        {
            db_update($related_table)->fields($up)->condition('relate_task', $id)->condition('status', array('1', '2'), 'in')->execute();
        }
        $query = db_update($operation_table_name);
        if ($operation_id && $operation_id !== true)
        {
            $query->condition('id', $operation_id, '<>');
        }
        $query->condition('parent_id', $id)
            ->condition('exec_status', array('n', 'r', 'a'), 'in')
            ->fields(array(
                'exec_status' => 'z',
                'finish_time' => $now,
            ));
        $query->execute();
    }
    if (!empty($err))
    {
        $up['error_message'] = $err;
    }
    else if (isset($up['error_message']))
    {
        unset($up['error_message']);
    }
    if (!$operation_id)
    {
        db_update($task_table_name)
            ->fields($up)
            ->condition('status', array('1', '2'), 'in')
            ->condition('id', $id)
            ->execute();
    }
    return $operation_id ? $up : '';
}
function set_task_exec_status($task_table_name, $id, $status, $effect_time = false)
{
    $op = '=';
    if (is_array($id))
    {
        $op = 'in';
    }
    $up = array(
        'exec_status' => $status,
    );
    if ($effect_time)
    {
        $up['effect_time'] = $effect_time;
    }
    db_update($task_table_name)->fields($up)->condition('id', $id, $op)->execute();
}
function set_task_finished($task_table_name, $operation_table_name, $id, $operation_id = 0)
{
    $up_task = array();
    $up_task['status'] = RB_TASK_FINISH_STATUS;
    $up_task['complete_time'] = get_datetime();
    if (!$operation_id)
    {
        db_update($task_table_name)->fields($up_task)->condition('id', $id)
            ->condition('status', array('1', '2'), 'in')->execute();
    }
    $query = db_update($operation_table_name);
    if ($operation_id && $operation_id !== true)
    {
        $query->condition('id', $operation_id, '<>');
    }
    $query->condition('parent_id', $id)
        ->condition('exec_status', array('n','r'), 'in')
        ->fields(array(
            'exec_status' => 'z',
            'finish_time' => time(),
        ));
    $query->execute();
    return $operation_id ? $up_task : '';
}
function stop_one_operation(&$r, $operation_table_name, $task_table_name, $err)
{
    db_update($operation_table_name)->fields(array(
        'exec_status' => 'f',
        'exec_error' => $err,
    ))->condition('id', $r['id'])->execute();
    if (isset($r['parent_id']) && $r['parent_id'])
    {
        db_update($task_table_name)
            ->expression('failed_operation_num', 'failed_operation_num + :failed_operation_num', array(':failed_operation_num' => 1))
            ->expression('total_failed_operation_num', 'total_failed_operation_num + :total_failed_operation_num', array(':total_failed_operation_num' => 1))
            ->condition('id', $r['parent_id'])
            ->execute();
        add_new_check_stop_task($r['parent_id'], $task_table_name);
    }
}
function is_task_still_running($status)
{
    return in_array($status, array('1', '2'));
}
function get_task_info($table_name, $id)
{
    $result = db_select($table_name, 't')->fields('t')->condition('id', $id)->execute();
    if ($result->rowCount() > 0)
    {
        return $result->fetchAssoc();
    }
    return false;
}
function get_operation_info($table_name, $id)
{
    $result = db_select($table_name, 't')->fields('t')->condition('id', $id)->execute();
    if ($result->rowCount() > 0)
    {
        return $result->fetchAssoc();
    }
    return false;
}
function get_operation_failed_times($table_name, $operation_id)
{
    $result = db_select($table_name, 't')->fields('t', array('failed_times'))->condition('id', $operation_id)->execute();
    if ($result->rowCount() > 0)
    {
        $r = $result->fetchAssoc();
        return $r['failed_times'] ? intval($r['failed_times']) : 0;
    }
    return false;
}
function create_warning($task_id, $operation_id, $task_type, $level, $message, $notes = null)
{
    $r = array(
        'task_id' => $task_id,
        'operation_id' => $operation_id,
        'task_type' => $task_type,
        'level' => $level,
        'error_message' => $message,
        'insert_time' => time(),
    );
    if ($notes)
    {
        $r['notes'] = $notes;
    }
    db_insert('tb_ops_warning')->fields($r)->execute();
}
function enable_next_building($table_name, $task_id, $sequence)
{
    db_update($table_name)->fields(array(
        'exec_status' => 'r',
    ))->condition('parent_id', $task_id)->condition('sequence', $sequence)->condition('exec_status', 'n')->execute();
}
function insert_wrong_account($account_id, $task_type, $operation_id, $task_id)
{
    db_insert('tb_wrong_account')->fields(array(
        'account_id' => $account_id,
        'insert_time' => time(),
        'task_type' => $task_type,
        'operation_id' => $operation_id,
        'task_id' => $task_id,
    ))->execute();
}
function reschedule($task_id, $task_type, $total)
{
    $f = array(
        'task_id' => $task_id,
        'task_type' => $task_type,
        'total' => $total,
    );
    db_insert('tb_reschedule')->fields($f)->execute();
}
function get_ops_count_from_params(&$params, $task_type, &$r, $success_num)
{
    $delta = intval($params['delta_ops']);
    if (isset($r['current_reply_num']))
    {
        $total_reply_num = intval($r['current_reply_num']);
        if (in_array($task_type, array('news_reply', 'app_reply')))
        {
            if ($total_reply_num <= 0 || ($total_reply_num > 0 && $total_reply_num <= 3))
            {
                if ($r['total_operation_num'])
                {
                    return 0;
                }
                else
                {
                    $less_reply_min = intval(CFG('less_reply_min', 2));
                    $less_reply_max = intval(CFG('less_reply_max', 29));
                    if (!$less_reply_min || $less_reply_min < 0)
                    {
                        $less_reply_min = 2;
                    }
                    if (!$less_reply_max || $less_reply_max < 0)
                    {
                        $less_reply_max = 29;
                    }
                    return rand($less_reply_min, $less_reply_max);
                }
            }
        }
        else if ($total_reply_num <= 0)
        {
            return 0;
        }
        $reply_num = $total_reply_num - $success_num;
        $current_ops_num = $r['total_operation_num'] ? intval($r['total_operation_num']) : 0;
        $min_ops = ceil($reply_num * 0.3);
        if ($current_ops_num >= $min_ops)
        {
            return 0;
        }
        return $min_ops - $current_ops_num;
    }
    return  $delta ? $delta : 3;
}
function get_script($site_id, $action, $device = 'pc', $engine = 'casper')
{
    global $all_scripts;
    $k = $site_id . '_' . $action . '_' . $device . '_' . $engine;
    if (isset($all_scripts[$k]))
    {
        return $all_scripts[$k];
    }
    return false;
}
function get_all_scripts()
{
    global $all_scripts, $logger, $last_get_script_time;

    $now = time();
    if (count($all_scripts) > 0 && isset($last_get_script_time) && ($last_get_script_time + 5 * 60) > $now)
    {
        return;
    }
    $last_get_script_time = $now;
    $result = db_select('tb_command_file_path', 'c')->fields('c')->execute();
    $all_scripts = array();
    while (($r = $result->fetchAssoc()))
    {
        $k = $r['site_id'] . '_' . $r['action'] . '_' . $r['device'] . '_' . $r['engine'];
        if (!isset($all_scripts[$k]))
        {
            $r['need_login'] = $r['need_login'] == 'y';
            $all_scripts[$k] = $r;
        }
        else
        {
            $logger->warn('Duplicated script: ' . $k);
        }
    }
}
function formalize_url(&$url)
{
    $pos = strpos($url, '#');
    if ($pos !== false)
    {
        $url = substr($url, 0, $pos);
    }
}
function get_mobile_imei()
{
    $pre8 = '86698002';
    $mid6 = '';
    $dig = '0123456789';

    for($i = 0; $i < 6; $i++)
    {
        $t = rand(0, strlen($dig) - 1);
        $mid6 = $mid6.$dig[$t];
    }
    $pre14 = $pre8.$mid6;
    $tmpSum = 0;
    for($i = 0; $i < 14; $i++)
    {
        if($i%2 == 1)
        {
            $tmpSum += intval($pre14[$i])*2/10 + intval($pre14[$i])*2%10;
        }
        else
        {
            $tmpSum += intval($pre14[$i]);
        }
    }
    if($tmpSum%10 == 0)
    {
        $last1 = '0';
    }
    else
    {
        $last1 = 10 - $tmpSum%10;
    }
    return $pre8.$mid6.$last1;
}

function get_url_tag_for_account_selection($url, $task_type, &$task = null)
{
    global $acct_url_tag_settings;

    if (!$url)
    {
        return false;
    }
    $pos = strpos($task_type, '_');
    if ($pos !== false)
    {
        $op_type = substr($task_type, 0, $pos);
    }
    else
    {
        $op_type = $task_type;
    }
    $is_sohu_praise = false;
    if ($task)
    {
        $site_id = $task['site_id'];
        $is_sohu_praise = $site_id == '5' && $task_type == 'news_praise';
    }
    if (($op_type != 'twitter' && !$is_sohu_praise) || ($op_type == 'twitter' && in_array($task_type, CFG('account_no_tag_task_type', array()))))
    {
        return false;
    }
    $other_tag = '';
    if ($is_sohu_praise)
    {
        $other_tag = $task['comment_username'] . $task['comment_content'];
    }
    else
    {
        if (!isset($acct_url_tag_settings))
        {
            $acct_url_tag_settings = array(
                'twitter_praise' => '',
                'twitter_reply_praise' => '',
                'twitter_reply_report' => '',
                'twitter_reply_reply_report' => '',
            );
        }
        if (isset($acct_url_tag_settings[$task_type]))
        {
            if ($acct_url_tag_settings[$task_type])
            {
                $task_type = $acct_url_tag_settings[$task_type];
            }
        }
        else
        {
            $task_type = $op_type;
        }
    }
    formalize_url($url);
    return md5($url . $task_type . $other_tag);
}
function get_url_tag_for_corpus_selection(&$task)
{
    if (!isset($task['operator_url']) || !$task['operator_url'])
    {
        return '';
    }
    $url = $task['operator_url'];
    formalize_url($url);
    return md5($url);
}
function create_effect_operation(&$task, &$script, &$params, $task_type)
{
    global $logger;

    $site_id = $task['site_id'];
    $account_id = '0';
    if ($script['need_login'])
    {
        $accounts = select_accounts_by_params($site_id, 1, $task['user_id'],
            get_url_tag_for_account_selection($task['operator_url'], $task_type),
            P_from_array('is_active', $params, false));
        if (count($accounts) == 0)
        {
            create_warning($task['id'], '0', $task_type, RB_WARNING_CRITICAL, 'No special account');
            $logger->info("No special account for site id: " . $site_id);
            return;
        }
        $account_id = $accounts[0];
    }
    $item_params = array();
    if (isset($task['comment_username']))
    {
        $item_params['commentUserName'] = $task['comment_username'];
    }
    if (isset($task['comment_content']))
    {
        $item_params['commentContent'] = $task['comment_content'];
    }
    $effect_task = array(
        'site_id' => $site_id,
        'exec_status' => 'r',
        'exec_time' => time(),
        'user_id' => $task['user_id'],
        'operator_url' => $task['operator_url'],
        'task_type' => $task_type,
        'engine' => $script['engine'],
        'script' => $script['script'],
        'device' => $script['device'],
        'parent_id' => $task['id'],
        'priority' => $task['priority'],
        'account_id' => $account_id,
        'params' => to_json($item_params),
    );
    if ($script['need_login'])
    {
        update_account_operation_time($account_id, time());
    }
    db_insert('tb_task_effect_operation')->fields($effect_task)->execute();
}
function reschedule_create_effect($task_id, $task_type)
{
    $f = array(
        'task_id' => $task_id,
        'task_type' => $task_type,
    );
    db_insert('tb_reschedule_effect')->fields($f)->execute();
}
function create_effect_operations_for_one_type(&$up_task, &$r, $task_type, $params = null)
{
    $effect_task_type = $task_type  . '_effect';
    $script = get_script($r['site_id'], $effect_task_type, $r['device'], $r['engine']);
    if (!$script && ($r['engine'] == 'casper_post' || $r['engine'] == 'm'))
    {
        $script = get_script($r['site_id'], $effect_task_type, $r['device'], 'casper');
    }
    if (!$script)
    {
        return;
    }
    if ($script['need_login'])
    {
        reschedule_create_effect($r['id'], $task_type);
    }
    else
    {
        if (!$params)
        {
            $params = json_from_string($r['params']);
        }
        create_effect_operation($r, $script, $params, $effect_task_type);
    }
    $up_task['exec_status'] = 's';
    $up_task['effect_time'] = time();
}
function convert_site_to_en($site)
{
    global $_reg_en_sites;

    if (!isset($_reg_en_sites))
    {
        $_reg_en_sites = array(
            '网易' => 'wangyi',
            '新浪' => 'sina',
            '搜狐' => 'sohu',
            '腾讯' => 'tengxun',
            '凤凰' => 'fenghuangwang',
            '百度贴吧' => 'baidutieba',
            '猫扑' => 'maopu',
            '天涯' => 'tianya',
        );
    }
    return isset($_reg_en_sites[$site]) ? $_reg_en_sites[$site] : $site;
}
function create_pwd()
{
    $s = random_string();
    return substr($s, 0, 3)."7Cd".substr($s, 3, 3);
}
/**
 * @描述 导出excel报表到指定路径中
 * @创建人 changhuilong
 * @创建日期 2018/12/03 13:26
 * @修改人和其它信息
 *
 *
 * @param fileName、data、type、color、version
 * @return null
 */
function data_to_excel_file($fileName, &$data, $type='', $color='', $version='2007')
{
    require_once(PP_INC_ROOT . '/PHPExcel.php');
    require_once(PP_INC_ROOT . '/PHPExcel/IOFactory.php');
    require_once(PP_INC_ROOT . '/PHPExcel/Reader/Excel5.php');
    require_once(PP_INC_ROOT . '/PHPExcel/Reader/Excel2007.php');
    if(empty($data) || !is_array($data)){
        die("data must be a array");
    }
    if(empty($fileName)){
        exit;
    }
    $date = date("Y-m-d H-i-s");
    if($version == '2007') {
        $fileName .= "_{$date}.xlsx";
    } else {
        $fileName .= "_{$date}.xls";
    }
//    $objPHPExcel = new PHPExcel();
    $defaultPrecision = ini_get('precision');
    $objPHPExcel = new \PHPExcel();
    ini_set('precision', $defaultPrecision);

    $objPHPExcel->removeSheetByIndex();
    $j = 0;
    foreach($data as &$d){
        $objPHPExcel->createSheet();
        $i = 1;
        $has_width = isset($d['width']);
        $has_column_color = isset($d['headerColumnColor']);
        foreach($d['data'] as $n => $r){
            $key = ord("A");
            foreach($r as $k => $v){
                $colum = chr($key);
                $objStyle = false;
                if($type == 'string') {
                    $objPHPExcel->setActiveSheetIndex($j)->setCellValueExplicit($colum.$i, $v, PHPExcel_Cell_DataType::TYPE_STRING);
                    $objPHPExcel->getActiveSheet()->getStyle($colum.$i)->getBorders()->getAllBorders()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
                    $objPHPExcel->getActiveSheet($j)->getStyle($colum.$i)->getFont()->setName('Arial');
                    $objPHPExcel->getActiveSheet($j)->getStyle($colum.$i)->getFont()->setSize(12);
                    $objStyle = $objPHPExcel->getActiveSheet($j)->getStyle($colum."1");
                } else {
                    $objPHPExcel->setActiveSheetIndex($j)->setCellValue($colum.$i, $v);
                }
                if($colum.$i == $colum.'1' && $objStyle) {
                    $objFill = $objStyle->getFill();
                    $objAlign = $objStyle->getAlignment();
                    $objAlign->setHorizontal(PHPExcel_Style_Alignment::VERTICAL_CENTER);
                    $objAlign->setVertical(PHPExcel_Style_Alignment::VERTICAL_CENTER);
                    $objFill->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
                    if ($has_column_color && isset($d['headerColumnColor'][$colum])) {
                        $objFill->getStartColor()->setARGB("00".$d['headerColumnColor'][$colum]);
                    } else if ($color) {
                        $objFill->getStartColor()->setARGB("00".$color);
                    }
                } else {
                    if($colum == 'A') {
                        $objPHPExcel->getActiveSheet()->getStyle($colum.$i)->getAlignment()->setHorizontal(PHPExcel_Style_Alignment::HORIZONTAL_RIGHT);    //ˮƽ�����϶���
                    }
                }
                if($has_width && isset($d['width']["$colum"]) ) {
                    $cell = $objPHPExcel->setActiveSheetIndex($j)->getColumnDimension($colum);
                    $cell->setWidth($d['width']["$colum"]);
                }
                $key += 1;
            }
            $i++;
        }
        $objPHPExcel->getActiveSheet()->setTitle($d['title']);
        $objPHPExcel->setActiveSheetIndex($j);
        $j++;
    }
    //ob_end_clean();
    //set_output_file($fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true);
    if($version == '2007') {
        $objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
        //$objWriter->save('php://output');
        $objWriter->save($fileName);
    } else {
        $objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel5');
        //$objWriter->save('php://output');
        $objWriter->save($fileName);
    }
    return $fileName;
}
function get_last_update_time(){
    global $time_file, $path;
    if(file_exists(join_paths($path, $time_file))){
        return file_get_contents(join_paths($path, $time_file));
    }else{
        return 0;
    }
}
function encrypt_file($file_path){
    $path = dirname($file_path);
    $basename = basename($file_path, '.txt');
    $content = file_get_contents($file_path);
    $key = '3ebb853d3af30de54b411b842b0de58b';
    $iv = '3ebb853d3af30de5';
    $encrypt_content = openssl_encrypt($content, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    $encrypt_name = $basename . "_enc.txt";
    $encrypt_file_path = join_paths($path, $encrypt_name);
    file_put_contents($encrypt_file_path, base64_encode($encrypt_content));
    return $encrypt_file_path;
}

function decrypt_file($file_path){
    $content = file_get_contents($file_path);
    $content = base64_decode($content);
    $key = '3ebb853d3af30de54b411b842b0de58b';
    $iv = '3ebb853d3af30de5';
    return openssl_decrypt($content, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
}
function zip_enc_file($zip_options, $pwd = "3ebb853d3af30de54b411b842b0de58b"){
    global $logger, $last_update_time;
    $logger->info("begin zip enc");
    if($last_update_time){
        $now_date = date("Ymd");
    }else{
        $now_date = 'previous';
    }
    $in_debug = true;
    $zip_cmd = sprintf("zip -P %s %s -r %s &>/dev/null", $pwd, $zip_options['target_path'].'.zip', $zip_options['source_path'].'/*.txt');
    echo_line($zip_cmd);
    try{
        exec($zip_cmd);
        $logger->info("zip encode over");
        return  $now_date.".zip";
    }catch (Exception $e){
        if($in_debug){
            echo $e->getMessage().PHP_EOL;
        }
        return false;
    }
}

function ftp_upload_file($ftp_options, $zip_options, $upload_file = false){
    global $logger;
    $ftp_conn = ftp_connect($ftp_options['host']) or die('host error');
    ftp_login($ftp_conn, $ftp_options['user'], $ftp_options['pwd']) or die ("login error");
    $upload_file_name = zip_enc_file($zip_options);
    if($upload_file_name){
        $upload_file = join_paths($zip_options['target_path'], $upload_file_name);
        $logger->info("zip file ".$upload_file);
        if(is_file($upload_file)){
            $logger->info("begin ftp update..");
            $upload_cmd = sprintf("curl -u %s:%s -T %s ftp://%s/", $ftp_options['user'], $ftp_options['pwd'], $upload_file, $ftp_options['host']);
            echo_line($upload_cmd);
            exec($upload_cmd);
            $logger->info("common upload_file--over ");
        }
    }
}
function get_es_page($es_params){
    global $es_client, $size;
    $es_params['size'] = '0';
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    return ceil($results['total'] / $size);
}

function get_crawler_account_type_b(){
    global $logger, $crawler_db_options;
    $query = db_select('tb_crawler_account', 'a', $crawler_db_options)->fields('a', array('id','oock'));
    $query->condition('belong_website',9)->condition('account_type', 'b')->condition('is_active', 1);
    $query->orderBy('operation_time')->range(0, 1);
    $account_info = $query->execute()->fetchAssoc();
    if(!$account_info){
        $logger->info('get account by url failed, not enough account');
        return false;
    }
    $account_id = $account_info['id'];
    $cookie = format_cookie_from_base64($account_info['oock']);
    db_update('tb_crawler_account')->fields(array('operation_time'=>time()))->condition('id', $account_id)->execute();
    return array('account_id'=>$account_id, 'cookie'=>$cookie);
}

function update_es($type, $id, $item){
    global $es_client, $check_out_es_index_config;
    $params = array(
        'index'=> $check_out_es_index_config[$type]['index'],
        'type'=> $check_out_es_index_config[$type]['type'],
        'id'=> $id,
        'body'=> array(
            'doc'=> $item
        )
    );
    $response = $es_client->update($params);
    if(isset($response['errors']) && $response['errors']){
        echo to_json($response);die;
    }
}

function update_es_bulk($type, $items){
    global $es_client, $check_out_es_index_config;
    $len = count($items);
    if($len == 0){
        return;
    }
    $bulk = array(
        'index' => $check_out_es_index_config[$type]['index'],
        'type' => $check_out_es_index_config[$type]['type']
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
        echo to_json($response);die;
    }
}

function insert_es($type, $id, $item){
    global $es_client, $check_out_es_index_config;
    $params = array(
        'index'=> $check_out_es_index_config[$type]['index'],
        'type'=> $check_out_es_index_config[$type]['type'],
        'id'=> $id,
        'body'=> $item
    );
    $response = $es_client->index($params);
    if(isset($response['errors']) && $response['errors']){
        echo to_json($response);die;
    }
}

function insert_es_bulk($type, $items){
    global $es_client, $check_out_es_index_config;
    $len = count($items);
    if($len == 0){
        return;
    }
    $bulk = array(
        'index' => $check_out_es_index_config[$type]['index'],
        'type' => $check_out_es_index_config[$type]['type']
    );
    foreach($items as $item){
        if(!$item){
            continue;
        }
        $bulk['body'][] = array('index'=>array('_id'=>$item['id']));
        unset($item['id']);
        $bulk['body'][] = $item;
    }
    $response = $es_client->bulk($bulk);
    if(isset($response['errors']) && $response['errors']){
        echo to_json($response);die;
    }
}

function exists_es_record_by_id($es_key, $es_id, $client){
    global $es_client, $es_index_config;
    if($client){
        $es_client = $client;
    }
    $es_params = array(
        'size'=> 0,
        'index'=> $es_index_config[$es_key]['index'],
        'type'=> $es_index_config[$es_key]['type'],
        'body'=> array(
            'query'=> array(
                'bool'=> array(
                    'must'=> array(
                        'terms'=> array('_id'=>array($es_id))
                    )
                )
            )
        )
    );
    $es_results = $es_client->search($es_params);
    $results = get_es_results($es_results);
    if($results['total'] == 0){
        return false;
    }
    return true;
}

function get_process_count_by_op($op){
    $cmd = "ps aux | grep curl | grep -v grep | grep crawler_center_service | grep " . $op . " | wc -l";
    $count = trim(shell_exec($cmd));
    return intval($count);
}

function run_script_background($class, $method, $params){
    global $logger;
    $logger->info(to_json($params));
    $script = '/apps/robot/crawler_data/crawler_background.php';
    $params_str = base64_encode(to_json($params));
    $cmd = 'php ' . $script . ' -class=' . $class . ' -method=' . $method . ' -params=' . $params_str . ' >/dev/null &';
    shell_exec($cmd);
    $logger->info($cmd);
}

function crawler_send_curl_block($op, $params, $base64=true){
    global $logger, $base_url;
    $url = $base_url . $op;
    if($base64){
        $params_str = base64_encode(to_json($params));
    }else{
        $params_str = to_json($params);
        $params_str = str_replace('\"', '%%%', $params_str);
        $params_str = str_replace('"', '\"', $params_str);
        $params_str = str_replace('%%%', '\\\\\\"', $params_str);
    }
    $cmd = "curl -k -d \"params=" . $params_str . "\" " . $url;
    $logger->info($cmd);
    return shell_exec($cmd);
}

function get_group_fid_from_url($url){
    preg_match('/groups\/(\d+)/', $url, $matches);
    if(isset($matches[1]) && $matches[1]){
        return $matches[1];
    }
    return false;
}

function data_img_to_excel_file($fileName, &$data, $type='', $color='', $version='2007')
{
    require_once(PP_INC_ROOT . '/PHPExcel.php');
    require_once(PP_INC_ROOT . '/PHPExcel/IOFactory.php');
    require_once(PP_INC_ROOT . '/PHPExcel/Reader/Excel5.php');
    require_once(PP_INC_ROOT . '/PHPExcel/Reader/Excel2007.php');
    if(empty($data) || !is_array($data)){
        die("data must be a array");
    }
    if(empty($fileName)){
        exit;
    }
    $date = date("Y-m-d H-i-s");
    if($version == '2007') {
        $fileName .= "_{$date}.xlsx";
    } else {
        $fileName .= "_{$date}.xls";
    }
//    $objPHPExcel = new PHPExcel();
    $defaultPrecision = ini_get('precision');
    $objPHPExcel = new \PHPExcel();
    ini_set('precision', $defaultPrecision);

    $objPHPExcel->removeSheetByIndex();
    $j = 0;
    foreach($data as &$d){
        $objPHPExcel->createSheet();
        $objActSheet = $objPHPExcel->setActiveSheetIndex($j);
        $i = 1;
        $has_width = isset($d['width']);
        $has_column_color = isset($d['headerColumnColor']);
        foreach($d['data'] as $n => $r){
            $key = ord("A");
            foreach($r as $k => $v){
                $colum = chr($key);
                $objStyle = false;
                $cellImg = false;
                if(is_array($v) && $v['type']=='img' && $v['value']){
                    $cellImg = true;
                    $objDrawing = new PHPExcel_Worksheet_Drawing(); //必须每次重新实例化
                    $objDrawing->setPath($v['value']);//这里是相对路径
                    $objDrawing->setHeight(300);//照片高度
                    $objDrawing->setWidth(200);
                    $objDrawing->setCoordinates($colum.$i);
                    // 图片偏移距离
                    $objDrawing->setOffsetX(10);
                    $objDrawing->setOffsetY(10);
                    $objDrawing->setWorksheet($objPHPExcel->getActiveSheet());
                    $objActSheet->getRowDimension($i)->setRowHeight(225);
                }elseif(is_array($v) && isset($v['value'])){
                    $v = $v['value'];
                }
                if(!$cellImg){
                    if($type == 'string') {
                        $objPHPExcel->setActiveSheetIndex($j)->setCellValueExplicit($colum.$i, $v, PHPExcel_Cell_DataType::TYPE_STRING);
                        $objPHPExcel->getActiveSheet()->getStyle($colum.$i)->getBorders()->getAllBorders()->setBorderStyle(PHPExcel_Style_Border::BORDER_THIN);
                        $objPHPExcel->getActiveSheet($j)->getStyle($colum.$i)->getFont()->setName('Arial');
                        $objPHPExcel->getActiveSheet($j)->getStyle($colum.$i)->getFont()->setSize(12);
                        $objStyle = $objPHPExcel->getActiveSheet($j)->getStyle($colum."1");
                    } else {
                        $objPHPExcel->setActiveSheetIndex($j)->setCellValue($colum.$i, $v);
                    }
                }
                if($colum.$i == $colum.'1' && $objStyle) {
                    $objFill = $objStyle->getFill();
                    $objAlign = $objStyle->getAlignment();
                    $objAlign->setHorizontal(PHPExcel_Style_Alignment::VERTICAL_CENTER);
                    $objAlign->setVertical(PHPExcel_Style_Alignment::VERTICAL_CENTER);
                    $objFill->setFillType(PHPExcel_Style_Fill::FILL_SOLID);
                    if ($has_column_color && isset($d['headerColumnColor'][$colum])) {
                        $objFill->getStartColor()->setARGB("00".$d['headerColumnColor'][$colum]);
                    } else if ($color) {
                        $objFill->getStartColor()->setARGB("00".$color);
                    }
                } else {
                    if($colum == 'A') {
                        $objPHPExcel->getActiveSheet()->getStyle($colum.$i)->getAlignment()->setHorizontal(PHPExcel_Style_Alignment::HORIZONTAL_RIGHT);
                    }
                }
                if($has_width && isset($d['width']["$colum"]) ) {
                    $cell = $objPHPExcel->setActiveSheetIndex($j)->getColumnDimension($colum);
                    $cell->setWidth($d['width']["$colum"]);
                }
                $key += 1;
            }
            $i++;
        }
        $objPHPExcel->getActiveSheet()->setTitle($d['title']);
        $objPHPExcel->setActiveSheetIndex($j);
        $j++;
    }
    //ob_end_clean();
    //set_output_file($fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true);
    if($version == '2007') {
        $objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
        //$objWriter->save('php://output');
        $objWriter->save($fileName);
    } else {
        $objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel5');
        //$objWriter->save('php://output');
        $objWriter->save($fileName);
    }
    return $fileName;
}

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
        $logger->info(to_json($response));
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