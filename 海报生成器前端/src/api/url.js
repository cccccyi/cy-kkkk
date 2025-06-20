const _BASE = 'https://hashnews.pro';
const _URL = {
    news_list                  :  `${_BASE}/api/media/news/list`,                   //快讯列表
    news                       :  `${_BASE}/api/media/news`,                        //指定快讯
    news_category_statistic    :  `${_BASE}/api/media/news/category/statistic`,     //快讯的分类
    sounds                     : `${_BASE}/tts_output/`,                             //语音播报目录
};
export { _URL };