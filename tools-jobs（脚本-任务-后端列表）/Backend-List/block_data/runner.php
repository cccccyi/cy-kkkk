<?php
require_once('bootstrap.php');
require_once(PP_COMMON_ROOT . '/common.php');

load_config();
$targets = array(
    PP_INC_ROOT . '/monitor.php -file='.PP_ROOT.'/process_block_data.php',
    PP_INC_ROOT . '/monitor.php -file='.PP_ROOT.'/process_block_data_kuaixun.php'
);

foreach($targets as &$item)
{
    run_php_as_daemon($item);
    sleep(1);
}
