<?php
function process_facebook($loc, $check){
    global $combat_db_options;
    $pageResponse = process_page_task($loc);
    if($pageResponse['success']){
        return $pageResponse;
    }
    $checkResponse = crawl_facebook_group_yy(true);
    $check_time = time() - 4 * 3600;
    $query = db_select('tb_facebook_account_yy', 'a', $combat_db_options)->fields('a', array('id','account_fid','password','account'));
    $query->condition('available', 'y')->condition('loc', $loc);
    $query->condition('last_use_time', $check_time, '<');
    $query->condition('tag', '');
    //$query->condition('account_fid', '100088033051769');
    $account = $query->orderBy('last_use_time')->execute()->fetchAssoc();
    if(!$account){
        return array('success'=> false, 'msg'=>'not available account');
    }
    if($check){
        db_update('tb_facebook_account_yy', $combat_db_options)->fields(array('last_use_time'=>time()))->condition('id', $account['id'])->execute();
        return array(
            'success'=> true,
            'site'=> 'facebook',
            'account_cache'=> md5($account['account_fid'].'_1')
        );
    }
    //crawler
    if($checkResponse['success']){
        db_update('tb_facebook_account_yy', $combat_db_options)->fields(array('last_use_time'=>time()))->condition('id', $account['id'])->execute();
        $script_content = file_get_contents('./scripts/fb_script_crawler.js');
        $params = array(
            'userName'=> $account['account_fid'],
            'passWord'=> $account['password']
        );
        foreach($params as $key=>$value){
            $script_content = str_replace('{{'.$key.'}}', $value, $script_content);
        }
        return array(
            'success'=> true,
            'site'=> 'facebook',
            'account_cache'=> md5($account['account_fid'].'_1'),
            'script_content'=> $script_content
        );
    }
    return $checkResponse;
}

function process_page_task($loc){
    global $combat_db_options;
    $check_time = time() - 4 * 3600;
    $query = db_select('tb_facebook_account_yy', 'a', $combat_db_options)->fields('a', array('id','account_fid','password','account'));
    $query->condition('available', 'y')->condition('loc', $loc);
    $query->condition('last_use_time', $check_time, '<');
    $query->condition('tag', 'page');
    $result = $query->execute();
    $account_fids = array();
    $accounts = array();
    while($row = $result->fetchAssoc()){
        $fid = $row['account_fid'];
        $accounts[$fid] = $row;
        $account_fids[] = $fid;
    }
    if(!$accounts){
        return array('success'=> false, 'msg'=>'not available account, for fb page');
    }
    $fields = array(
        'id', 'page_fid', 'page_type', 'name', 'last_crawl_roles_time', 'bili_aid', 'youtube_channel_id',
        'post_flag', 'post_interval', 'crawl_post_insights_switch'
    );
    $query = db_select('dt_fb_manage_pages', 'p', $combat_db_options)->fields('p', $fields);
    $query->fields('r', array('account_name', 'account_fid'));
    $query->leftJoin('dt_fb_account_manage_page_relation', 'r', 'r.page_fid=p.page_fid');
    $query->condition('p.page_type', array('classic', 'new'));
    $query->condition('p.page_available', 'y');
    $query->condition('r.account_fid', $account_fids);
    //$db_or = db_or()->condition('p.bili_aid', null, 'is not')->condition('p.youtube_channel_id', null, 'is not')->condition('p.crawl_post_insights_switch', 'y');
    //$db_and = db_and()->condition($db_or)->condition('p.last_crawl_roles_time', time()-20*3600, '<');
    //$query->condition($db_and);
    $query->condition('p.last_crawl_roles_time', time()-20*3600, '<');
    $query->orderBy('last_crawl_roles_time');
    $result = $query->execute();
    //echo $result->getQueryString();
    //slect id,page_fid,page_type,p.name,p.last_crawl_roles_time,p.bili_aidd,p.youtube_channel_id,p.post_interval,p.crawl_post_insights_switch,r.account_name,r.account_fid from dt_fb_manage_pages p left join dt_fb_account_manage_page_relation r on r.page_fid=p.page_fid where p.page_type in ('new', 'classic') and p.page_available='y' AND r.account_fid in () order by  last_crawl_roles_time;
    while($row = $result->fetchAssoc()){
        $pageFid = $row['page_fid'];
        $taskFlag = false;
        $skipPageSendPost = 'y';
        $videoURL = '';
        $videoName = '';
        $videoText = '';
        $skip_crawl_page = 'n';
        $skip_crawl_page_new = 'n';
        if($row['post_flag'] == 'y'){
            $post = db_select('dt_fb_page_post_insights', 'p', $combat_db_options)->fields('p', array('post_time'))->condition('page_fid', $row['page_fid'])->orderBy('post_time', 'desc')->execute()->fetchAssoc();
            if(!$post || (time() - $post['post_time'] > $row['post_interval'])){
                $video = db_select('dt_material_page_post', 'm', $combat_db_options)->fields('m', array('id', 'youtube_channel_id', 'youtube_video_id', 'text'))->condition('page_fid', $pageFid)->condition('down_flag', 'y')->condition('fb_post_flag', 'n')->orderBy('id', 'desc')->execute()->fetchAssoc();
                if($video){
                    $skipPageSendPost = 'n';
                    $videoURL = 'http://221.120.163.66:38011/materials/youtube/' . $video['youtube_channel_id'] . '/v-' . $video['youtube_video_id'] . '.mp4';
                    $videoName = $video['youtube_video_id'] . '.mp4';
                    $videoText = $video['text'];
                    $materialUpdate = array(
                        'fb_post_flag'=> 'p',
                        'last_use_time'=> time()
                    );
                    db_update('dt_material_page_post', $combat_db_options)->fields($materialUpdate)->condition('id', $video['id'])->execute();
                    $taskFlag = true;
                }
            }
        }
        if(time() - $row['last_crawl_roles_time'] > 7*24*3600){
            if(isset($row['page_type']) && $row['page_type']=='new'){
                $skip_crawl_page = 'y';
                $skip_crawl_page_new = 'n';
            }else{
                $skip_crawl_page = 'n';
                $skip_crawl_page_new = 'y';
            }
            $taskFlag = true;
        }
        if(!$taskFlag){
            continue;
        }
        $account = $accounts[$row['account_fid']];
        db_update('tb_facebook_account_yy', $combat_db_options)->fields(array('last_use_time'=>time()))->condition('id', $account['id'])->execute();
        $script_content = file_get_contents('./scripts/fb_crawl_account.js');
        $account_name = $row['account_name'];
        if(!$account_name){
            $account_name = $account['account'];
        }
        $params = array(
            'userName'=> $account['account_fid'],
            'passWord'=> $account['password'],
            'accountName'=> $account_name,
            'skipAcceptPageInvite'=> 'y',
            'invitedPageFid'=> '',
            'skipCrawlYourPages'=> 'n',         //采集账号，主页列表
            'skipCrawlPageData'=> $skip_crawl_page,
            'skipCrawlPageDataNew'=> $skip_crawl_page_new,
            'crawlPageFid'=> $row['page_fid'],
            'skipPageSendPost'=> $skipPageSendPost,
            'videoURL'=> $videoURL,
            'videoName'=> $videoName,
            'videoText'=> $videoText,
            'skipScreenshotPost'=> 'y',
            'skipAccountSendPost'=> 'y',
            'skipCrawlJoinedGroups'=> 'y',
            'skipCrawlFriendsList'=> 'y'
        );
        foreach($params as $key=>$value){
            $script_content = str_replace('{{'.$key.'}}', $value, $script_content);
        }
        return array(
            'success'=> true,
            'site'=> 'facebook',
            'account_cache'=> md5($account['account_fid'].'_1'),
            'script_content'=> $script_content
        );
    }
    return array('success'=> false, 'msg'=>'not need run task page ...');
}

function save_fb_account_checkpoint($item){
    global $combat_db_options;
    $account_fid = $item['account_fid'];
    $update_item = array(
        'available'=> 'n',
        'disable_date'=> $item['disable_date'],
        'disable_info_title'=> get_value_from_array($item, 'days_remaining_title'),
        'account'=> get_value_from_array($item, 'user_name')
    );
    db_update('tb_facebook_account_yy', $combat_db_options)->fields($update_item)->condition('account_fid', $account_fid)->execute();
}

function crawl_facebook_target_yy($check){
    //page
    $page = db_select('tb_fb_page_info_yy', 'p')->fields('p', array('id','page_fid','page_url'))
        ->condition('page_available', 'y')->condition('update_time', 0)->orderBy('last_crawl_time')->execute()->fetchAssoc();
    if($page){
        if($check){
            return array('success'=>true);
        }
        db_update('tb_fb_page_info_yy')->fields(array('last_crawl_time'=>time()))->condition('id', $page['id'])->execute();
        $url = 'https://www.facebook.com/' . $page['page_fid'];
        if(!$page['page_fid']){
            $url = $page['page_url'];
        }
        $info = array(
            'skipCrawlGuidFb'=> 'y',
            'skipCrawlMonitorFb'=> 'n',
            'skipSearchKeyword'=> 'y',
            'skipSearchKeywordPost'=> 'y',
            'skipSearchKeywordPage'=> 'y',
            'skipSearchKeywordGroup'=> 'y',
            'skipSearchKeywordPeople'=> 'y',
            'skipSearchKeywordPlace'=> 'y',
            'skipCrawlMonitorFbFriends'=> 'y',
            'skipCrawlMonitorFbFollowing'=> 'y',
            'skipCrawlAlbum'=> 'y',
            'skipCrawlActivity'=> 'y',
            'skipTopFans'=> 'y',
            'monitorFbUrl'=> $url,
            'monitorFbPostsLoopCount'=> 2,
            'monitorFbFriendsLoopCount'=> 0,
            'monitorFbFollowingLoopCount'=> 0,
            'skipCrawlAbout'=> 'n'
        );
        $data = array($info);
        return array('success'=>true, 'type'=>'monitor_target', 'data'=>$data);
    }
    //group
    $group = db_select('tb_fb_group_info_yy', 'g')->fields('g', array('id','group_fid'))
        ->condition('group_available', 'y')->condition('update_time', 0)->orderBy('last_crawl_time')->execute()->fetchAssoc();
    if($group){
        if($check){
            return array('success'=>true);
        }
        db_update('tb_fb_group_info_yy')->fields(array('last_crawl_time'=>time()))->condition('id', $group['id'])->execute();
        $info = array(
            'skipCrawlGuidFb'=> 'y',
            'skipCrawlMonitorFb'=> 'n',
            'skipSearchKeyword'=> 'y',
            'skipSearchKeywordPost'=> 'y',
            'skipSearchKeywordPage'=> 'y',
            'skipSearchKeywordGroup'=> 'y',
            'skipSearchKeywordPeople'=> 'y',
            'skipSearchKeywordPlace'=> 'y',
            'skipCrawlMonitorFbFriends'=> 'y',
            'skipCrawlMonitorFbFollowing'=> 'y',
            'skipCrawlAlbum'=> 'y',
            'skipCrawlActivity'=> 'y',
            'skipTopFans'=> 'y',
            'monitorFbUrl'=> 'https://www.facebook.com/' . $group['group_fid'],
            'monitorFbPostsLoopCount'=> 2,
            'monitorFbFriendsLoopCount'=> 0,
            'monitorFbFollowingLoopCount'=> 0,
            'skipCrawlAbout'=> 'n'
        );
        $data = array($info);
        return array('success'=>true, 'type'=>'monitor_target', 'data'=>$data);
    }
    return array('success'=> false);
}

function crawl_facebook_group_yy($check){
    $ip = get_remote_client_address();
    $check_time = time() - 24*3600;
    $range_time = date('Y-m-d H:i;s', strtotime('-2 days'));
    if(date('w') == 1){
        $range_time = date('Y-m-d H:i;s', strtotime('-8 days'));
    }
    ///**************
    //post info
    $post = db_select('tb_fb_group_post_crawler_list', 'p')->fields('p', array('id','post_fid'))
        ->condition('post_available', 'y')->condition('crawl_flag', 'y')->orderBy('last_crawl_time')->execute()->fetchAssoc();
    if($post){
        if($check){
            return array('success'=>true);
        }
        db_update('tb_fb_group_post_crawler_list')->fields(array('last_crawl_time'=>time()))->condition('id', $post['id'])->execute();
        $data = array(
            array('post_fid'=> $post['post_fid'])
        );
        return array('success'=>true, 'type'=>'post_info', 'data'=>$data);
    }else{
        $db_or = db_or()->condition('last_update_time', $check_time, '<')->condition('screenshot_image', null, 'is');
        $post = db_select('tb_fb_group_post_crawler_list', 'p')->fields('p', array('id','post_fid'))
            ->condition('post_available', 'y')->condition($db_or)
            ->condition('last_crawl_time', time()-600, '<')
            ->condition('post_time', $range_time, '>')->orderBy('last_crawl_time')->execute()->fetchAssoc();
        if($post){
            if($check){
                return array('success'=>true);
            }
            db_update('tb_fb_group_post_crawler_list')->fields(array('last_crawl_time'=>time()))->condition('id', $post['id'])->execute();
            $data = array(
                array('post_fid'=> $post['post_fid'])
            );
            return array('success'=>true, 'type'=>'post_info', 'data'=>$data);
        }
    }
    //group user post list
    //群组-账号有帖子的记录 每天8天之后采集一遍， J环境9点
    $info = null;
    $hour = date('H');
    if ($hour >= '08') {
        $today_hour_check = strtotime(date('Y-m-d') . ' 08:00:00');
        $sub_query = db_select('tb_fb_group_post_crawler_list', 'p')->fields('p', array('group_fid', 'user_fid'));
        $sub_query->addExpression('count(*)', 'post_count');
        $sub_query->groupBy('group_fid')->groupBy('user_fid');
        $query = db_select('tb_fb_group_user_post_monitor', 'm')->fields('m', array('id', 'group_fid', 'user_fid'));
        $query->leftJoin($sub_query, 's', 's.group_fid=m.group_fid and s.user_fid=m.user_fid');
        $query->condition('post_count', 0, '>')->condition('is_permeation', 'y');
        $query->condition('last_update_time', $today_hour_check, '<')->condition('last_crawl_time', time() - 1800, '<');
        $info = $query->orderBy('last_crawl_time')->execute()->fetchAssoc();
    }
    if(!$info){
        //群组-账号没有帖子记录的48小时采集一次
        $check_time = time() - 48*3600;
        $info = db_select('tb_fb_group_user_post_monitor', 'm')->fields('m', array('id','group_fid','user_fid'))
            ->condition('is_permeation', 'y')
            //->condition('last_update_time', 0)
            ->condition('last_update_time', $check_time, '<')->condition('last_crawl_time', time()-3600, '<')->orderBy('last_crawl_time')->execute()->fetchAssoc();
    }
    if($info){
        if($check){
            return array('success'=>true);
        }
        $update_time = array(
            'last_crawl_time'=>time(),
            'machine_ip'=> $ip
        );
        db_update('tb_fb_group_user_post_monitor')->fields($update_time)->condition('id', $info['id'])->execute();
        $data = array(
            array(
                'group_fid'=> $info['group_fid'],
                'account_fid'=> $info['user_fid']
            )
        );
        return array('success'=>true, 'type'=>'post_detect', 'data'=>$data);
    }
    //*******************************/
    //guid account
    $check_time = time() - 30*24*3600;
    $account = db_select('tb_guid_account_fb_yy', 'a')->fields('a', array('id','account_fid'))
        ->condition('crawl_available', 'y')->condition('last_update_time', 0)
        ->condition('last_crawl_time', time()-600, '<')->orderBy('last_crawl_time')->execute()->fetchAssoc();
    if($account){
        if($check){
            return array('success'=>true);
        }
        db_update('tb_guid_account_fb_yy')->fields(array('last_crawl_time'=>time()))->condition('id', $account['id'])->execute();
        $data = array($account['account_fid']);
        return array('success'=>true, 'type'=>'fb_guid_account', 'data'=>$data);
    }
    //group info
    $result = crawl_facebook_target_yy($check);
    if($result['success']){
        return $result;
    }
    //tb_fb_account_yjg
    $check_time = time() - 30*24*3600;
    $account = db_select('tb_fb_account_yjg', 'a')->fields('a', array('id','fid', 'url'))
        ->condition('crawl_available', 'y')->condition('insert_time', 0, '>')->condition('last_update_time', 0)
        ->condition('last_crawl_time', time()-600, '<')->orderBy('last_crawl_time')->execute()->fetchAssoc();
    if($account){
        if($check){
            return array('success'=>true);
        }
        db_update('tb_fb_account_yjg')->fields(array('last_crawl_time'=>time()))->condition('id', $account['id'])->execute();
        if($account['fid']){
            $data = array($account['fid']);
        }else{
            $data = array($account['url']);
        }
        return array('success'=>true, 'type'=>'fb_guid_account', 'data'=>$data);
    }
    //yjg friends list
    $account = db_select('tb_fb_account_yjg', 'a')->fields('a', array('id','fid', 'url'))
        ->condition('crawl_available', 'y')->condition('insert_time', 0, '>')->condition('last_crawl_time', 0, '>')->condition('last_friend_crawl_time', 0)
        ->condition('last_friend_crawl_time', time()-600, '<')->orderBy('last_friend_crawl_time')->execute()->fetchAssoc();
    if($account){
        if($check){
            return array('success'=>true);
        }
        db_update('tb_fb_account_yjg')->fields(array('last_friend_crawl_time'=>time()))->condition('id', $account['id'])->execute();
        if($account['fid']){
            $url = 'https://www.facebook.com/' . $account['fid'];
        }else{
            $url = $account['url'];
        }
        $data = array(
            'crawlerUrl'=> $url,
            'scrollCount'=> 300
        );
        return array('success'=>true, 'type'=>'fb_crawler_friends', 'data'=>$data);
    }
    $account = db_select('tb_fb_account_yjg', 'a')->fields('a', array('id','fid', 'url'))
        ->condition('crawl_available', 'y')->condition('insert_time', 0, '>')->condition('last_crawl_time', 0, '>')->condition('last_follower_crawl_time', 0)
        ->condition('last_follower_crawl_time', time()-600, '<')->orderBy('last_follower_crawl_time')->execute()->fetchAssoc();
    if($account){
        if($check){
            return array('success'=>true);
        }
        db_update('tb_fb_account_yjg')->fields(array('last_follower_crawl_time'=>time()))->condition('id', $account['id'])->execute();
        if($account['fid']){
            $url = 'https://www.facebook.com/' . $account['fid'];
        }else{
            $url = $account['url'];
        }
        $data = array(
            'crawlerUrl'=> $url,
            'scrollCount'=> 300
        );
        return array('success'=>true, 'type'=>'fb_crawler_followers', 'data'=>$data);
    }
    $account = db_select('tb_fb_account_yjg', 'a')->fields('a', array('id','fid', 'url'))
        ->condition('crawl_available', 'y')->condition('insert_time', 0, '>')->condition('last_crawl_time', 0, '>')->condition('last_following_crawl_time', 0)
        ->condition('last_following_crawl_time', time()-600, '<')->orderBy('last_following_crawl_time')->execute()->fetchAssoc();
    if($account){
        if($check){
            return array('success'=>true);
        }
        db_update('tb_fb_account_yjg')->fields(array('last_following_crawl_time'=>time()))->condition('id', $account['id'])->execute();
        if($account['fid']){
            $url = 'https://www.facebook.com/' . $account['fid'];
        }else{
            $url = $account['url'];
        }
        $data = array(
            'crawlerUrl'=> $url,
            'scrollCount'=> 300
        );
        return array('success'=>true, 'type'=>'fb_crawler_following', 'data'=>$data);
    }

    return array('success'=>false);
}

function process_page_insights_audience($info){
    global $combat_db_options;
    if(!$info['page_fid'] || !$info['insights']){
        return;
    }
    $pageFid = $info['page_fid'];
    $pageFid = db_select('dt_fb_manage_pages', 'p', $combat_db_options)->fields('p', array('page_fid'))->condition('origin_fid', $pageFid)->execute()->fetchField();
    if(!$pageFid){
        return;
    }
    $pageInfo = array();
    $insights = $info['insights'];
    foreach($insights as $key=>$insight){
        switch($key){
            case 'total_followers':
                $followers = $insight['value'];
                $pageInfo['followers_count_accurate'] = $followers;
                break;
            case 'followers_by_city':
                db_update('dt_fb_manage_page_followers_by_city', $combat_db_options)->fields(array('is_delete'=>0))->condition('page_fid', $pageFid)->execute();
                $items = isset($insight['bucket_values'])? $insight['bucket_values'] : array();
                foreach($items as $item){
                    $city = $item['bucket_names'][0];
                    $exists = db_select('dt_fb_manage_page_followers_by_city', 't', $combat_db_options)->fields('t', array('id'))->condition('page_fid', $pageFid)->condition('city', $city)->execute()->fetchAssoc();
                    if($exists){
                        $update = array(
                            'bucket_value'=> $item['bucket_value'],
                            'is_delete'=> 0,
                            'update_time'=> time()
                        );
                        db_update('dt_fb_manage_page_followers_by_city', $combat_db_options)->fields($update)->condition('id', $exists['id'])->execute();
                    }else{
                        $new = array(
                            'page_fid'=> $pageFid,
                            'city'=> $city,
                            'bucket_value'=> $item['bucket_value'],
                            'is_delete'=> 0,
                            'insert_time'=> time(),
                            'update_time'=> time()
                        );
                        db_insert('dt_fb_manage_page_followers_by_city', $combat_db_options)->fields($new)->execute();
                    }
                }
                break;
            case 'followers_by_country':
                db_update('dt_fb_manage_page_followers_by_country', $combat_db_options)->fields(array('is_delete'=>0))->condition('page_fid', $pageFid)->execute();
                $items = isset($insight['bucket_values'])? $insight['bucket_values'] : array();
                foreach($items as $item){
                    $country = $item['bucket_names'][0];
                    $exists = db_select('dt_fb_manage_page_followers_by_country', 't', $combat_db_options)->fields('t', array('id'))->condition('page_fid', $pageFid)->condition('country', $country)->execute()->fetchAssoc();
                    if($exists){
                        $update = array(
                            'bucket_value'=> $item['bucket_value'],
                            'is_delete'=> 0,
                            'update_time'=> time()
                        );
                        db_update('dt_fb_manage_page_followers_by_country', $combat_db_options)->fields($update)->condition('id', $exists['id'])->execute();
                    }else{
                        $new = array(
                            'page_fid'=> $pageFid,
                            'country'=> $country,
                            'bucket_value'=> $item['bucket_value'],
                            'is_delete'=> 0,
                            'insert_time'=> time(),
                            'update_time'=> time()
                        );
                        db_insert('dt_fb_manage_page_followers_by_country', $combat_db_options)->fields($new)->execute();
                    }
                }
                break;
            case 'followers_by_gender':
                db_update('dt_fb_manage_page_followers_by_gender', $combat_db_options)->fields(array('is_delete'=>0))->condition('page_fid', $pageFid)->execute();
                $items = isset($insight['bucket_values'])? $insight['bucket_values'] : array();
                foreach($items as $item){
                    $gender = $item['bucket_names'][0];
                    switch($gender){
                        case 'MALE':
                            $pageInfo['audience_male'] = $item['bucket_value'];
                            break;
                        case 'FEMALE':
                            $pageInfo['audience_female'] = $item['bucket_value'];
                            break;
                    }
                    $exists = db_select('dt_fb_manage_page_followers_by_gender', 't', $combat_db_options)->fields('t', array('id'))->condition('page_fid', $pageFid)->condition('gender', $gender)->execute()->fetchAssoc();
                    if($exists){
                        $update = array(
                            'bucket_value'=> $item['bucket_value'],
                            'is_delete'=> 0,
                            'update_time'=> time()
                        );
                        db_update('dt_fb_manage_page_followers_by_gender', $combat_db_options)->fields($update)->condition('id', $exists['id'])->execute();
                    }else{
                        $new = array(
                            'page_fid'=> $pageFid,
                            'gender'=> $gender,
                            'bucket_value'=> $item['bucket_value'],
                            'is_delete'=> 0,
                            'insert_time'=> time(),
                            'update_time'=> time()
                        );
                        db_insert('dt_fb_manage_page_followers_by_gender', $combat_db_options)->fields($new)->execute();
                    }
                }
                break;
            case 'followers_by_age_gender':
                db_update('dt_fb_manage_page_followers_by_age_gender', $combat_db_options)->fields(array('is_delete'=>0))->condition('page_fid', $pageFid)->execute();
                $items = isset($insight['bucket_values'])? $insight['bucket_values'] : array();
                foreach($items as $item){
                    $age = $item['bucket_names'][0];
                    $gender = $item['bucket_names'][1];
                    if ($gender == 'MALE'){
                        switch($age){
                            case '18-24':
                                $pageInfo['audience_male_18T24'] = $item['bucket_value'];
                                break;
                            case '25-34':
                                $pageInfo['audience_male_25T34'] = $item['bucket_value'];
                                break;
                            case '35-44':
                                $pageInfo['audience_male_35T44'] = $item['bucket_value'];
                                break;
                            case '45-54':
                                $pageInfo['audience_male_45T54'] = $item['bucket_value'];
                                break;
                            case '55-64':
                                $pageInfo['audience_male_55T64'] = $item['bucket_value'];
                                break;
                            case '65+':
                                $pageInfo['audience_male_65'] = $item['bucket_value'];
                                break;
                        }
                    }elseif($gender == 'FEMALE'){
                        switch($age){
                            case '18-24':
                                $pageInfo['audience_female_18T24'] = $item['bucket_value'];
                                break;
                            case '25-34':
                                $pageInfo['audience_female_25T34'] = $item['bucket_value'];
                                break;
                            case '35-44':
                                $pageInfo['audience_female_35T44'] = $item['bucket_value'];
                                break;
                            case '45-54':
                                $pageInfo['audience_female_45T54'] = $item['bucket_value'];
                                break;
                            case '55-64':
                                $pageInfo['audience_female_55T64'] = $item['bucket_value'];
                                break;
                            case '65+':
                                $pageInfo['audience_female_65'] = $item['bucket_value'];
                                break;
                        }
                    }
                    $exists = db_select('dt_fb_manage_page_followers_by_age_gender', 't', $combat_db_options)->fields('t', array('id'))->condition('page_fid', $pageFid)->condition('gender', $gender)->condition('age_range', $age)->execute()->fetchAssoc();
                    if($exists){
                        $update = array(
                            'bucket_value'=> $item['bucket_value'],
                            'is_delete'=> 0,
                            'update_time'=> time()
                        );
                        db_update('dt_fb_manage_page_followers_by_age_gender', $combat_db_options)->fields($update)->condition('id', $exists['id'])->execute();
                    }else{
                        $new = array(
                            'page_fid'=> $pageFid,
                            'gender'=> $gender,
                            'age_range'=> $age,
                            'bucket_value'=> $item['bucket_value'],
                            'is_delete'=> 0,
                            'insert_time'=> time(),
                            'update_time'=> time()
                        );
                        db_insert('dt_fb_manage_page_followers_by_age_gender', $combat_db_options)->fields($new)->execute();
                    }
                }
                break;
        }
    }
    if($pageInfo){
        db_update('dt_fb_manage_pages', $combat_db_options)->fields($pageInfo)->condition('page_fid', $pageFid)->execute();
    }
}

function process_fb_create_story($info){
    global $combat_db_options;
    if(isset($info['post_id']) && $info['post_id'] && isset($info['page_id']) && $info['page_id']){
        $pageFid = $info['page_id'];
        $update_item = array(
            'fb_post_flag'=> 'y',
            'post_fid'=> $info['post_id']
        );
        $material = db_select('dt_material_page_post', 'm', $combat_db_options)->fields('m', array('id'))->condition('page_fid', $pageFid)->condition('fb_post_flag', 'p')->orderBy('last_use_time', 'desc')->execute()->fetchAssoc();
        if($material){
            db_update('dt_material_page_post', $combat_db_options)->fields($update_item)->condition('id', $material['id'])->execute();
        }
        /*
        if(isset($info['bvid'])){
            db_update('dt_bili_videos', $combat_db_options)->fields($update_item)->condition('bvid', $info['bvid'])->execute();
            db_update('dt_youtube_videos', $combat_db_options)->fields($update_item)->condition('video_id', $info['bvid'])->execute();
        }elseif(isset($info['ins_images']) && $info['ins_images']){
            db_update('dt_ins_images', $combat_db_options)->fields($update_item)->condition('ins_image_id', $info['ins_images'], 'in')->execute();
        }
        */
    }
}

