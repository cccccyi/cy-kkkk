class News {
  constructor(data = {}) {
    this.id = data.id || null;
    this.unique_code = data.unique_code || null;
    this.source_id = data.source_id || null;
    this.publish_time = data.publish_time || null;
    this.primary_category = data.primary_category || null;
    this.categories = data.categories || null;
    this.tags = data.tags || null;
    this.push_flag = data.push_flag || null;
    this.title = data.title || null;
    this.content = data.content || null;
    this.detail_content = data.detail_content || null;
    this.title_en = data.title_en || null;
    this.content_en = data.content_en || null;
    this.detail_content_en = data.detail_content_en || null;
    this.audio_text = data.audio_text || null;
    this.del_flag = data.del_flag || '0';
    this.remark = data.remark || null;
    this.status = data.status || '0';
    this.tg_status = data.tg_status || null;
    this.push_status = data.push_status || null;
    this.create_by = data.create_by || '';
    this.update_by = data.update_by || '';
    this.update_time = data.update_time || null;
    this.create_time = data.create_time || null;
    this.sounds = data.sounds || null;
  }

  toJSON() {
    return {
      id: this.id,
      unique_code: this.unique_code,
      source_id: this.source_id,
      publish_time: this.publish_time,
      primary_category: this.primary_category,
      categories: this.categories,
      tags: this.tags,
      push_flag: this.push_flag,
      title: this.title,
      content: this.content,
      detail_content: this.detail_content,
      title_en: this.title_en,
      content_en: this.content_en,
      detail_content_en: this.detail_content_en,
      audio_text: this.audio_text,
      del_flag: this.del_flag,
      remark: this.remark,
      status: this.status,
      tg_status: this.tg_status,
      push_status: this.push_status,
      create_by: this.create_by,
      update_by: this.update_by,
      update_time: this.update_time,
      create_time: this.create_time,
      sounds: this.sounds
    };
  }

  static validate(data) {
    const errors = [];
    
    if (!data.title || data.title.trim() === '') {
      errors.push('标题不能为空');
    }
    
    if (data.unique_code && !/^[a-zA-Z0-9]{1,10}$/.test(data.unique_code)) {
      errors.push('唯一编码只能是1-10位字母数字组合');
    }
    
    if (data.publish_time && isNaN(parseInt(data.publish_time))) {
      errors.push('发布时间必须是数字');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = News;