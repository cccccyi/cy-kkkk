import React, { useState, useEffect } from 'react';
import { Modal, message, Button, Checkbox, Form, Input, Upload } from 'antd';
import { HEIGHT } from '@cat-protocol/cat-sdk';
import { SunOutlined, MoonOutlined, RightOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { _URL } from "../../api/url";
import './tokenList.scss';
import {  useSelector } from 'react-redux';
const TokenListModal = ({ isModalOpen, setShowTokenList, handleOk, onSuccess }) => {
  const [pageNum, setPageNum] = useState(1);  // 起始页
  const [loading, setLoading] = useState(false);  // 定义loading状态
  const deploy_token_addr = useSelector((state) => state.user.deploy_token_addr); // 读取 Redux 状态中的地址
  // 内部定义取消方法
  const handleCancel = () => {
    setFileList([]);
    setShowTokenList(false);
  };
  //表单方法
  const onFinish = (values) => {
    console.log('Success:', values);
    setLoading(true);  // 开始请求前设置 loading 为 true
    message.open({
      key:'sell',
      type: 'loading',
      content: '正在计算发射gas费...',
      duration: 0,
    })
    axios.get(_URL.getFee)
      .then(async response => {
        let gas = response.data.fastestFee
        let feeFb = gas*2000
        message.open({
          key:'sell',
          type: 'loading',
          content: '请支付发射gas费...',
          duration: 0,
        })
        try {
          let txid = await window.unisat.sendBitcoin(deploy_token_addr,feeFb);
      
          message.open({
            key:'sell',
            type: 'loading',
            content: '请稍候...',
            duration: 0,
          })
          //提交表单
          let data = {
            "tokenImage": fileList[0].response.data.url,
            "tokenName": values.name,
            "tokenTicker": values.ticker,
            "description": values.Description,
            "website": values.Website,
            "telegram": values.Telegram,
            "twitter": values.Twitter,
            "initialBy": 0,
            "feeTxid": txid
          }
          // 使用 axios 提交表单数据
            axios.post(_URL.launch, data, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`  // 动态传递 Authorization 头
              }
            })
            .then((response) => {
              console.log('Token launched successfully:', response);
              message.success({
                key: 'sell',
                content: 'Token launched successfully!',
                duration: 2,
              });
              setLoading(false);  // 请求成功，关闭loading
              onSuccess()  //成功了回调一下，刷新父页面
              handleCancel();  // 关闭模态框
            })
            .catch((error) => {
              handleCancel();  // 关闭模态框
              setLoading(false);  // 请求成功，关闭loading
              if (error.response) {
                // 后端返回的错误信息
                const { statusCode, error: errorMsg, msg } = error.response.data;
                message.error({
                  key: 'sell',
                  content: error.response.data.error,
                  duration: 2,
                });
              } else {
                // 其他错误（如网络错误等）
                console.error('Error launching token:', error);
                message.error('Failed to launch token!');
              }
            });
        } catch (e) {
          setLoading(false); 
          message.error({
            key: 'sell',
            content: '您已取消发射',
            duration: 2,
          });
          console.log(e);
        }
      })
      .catch(error => {
        message.error('get gas error');
      });







   
  };
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };
  //代币图片
  const [fileList, setFileList] = useState([

  ]);
  const handleChange = ({ fileList: newFileList }) => {
    console.log('啊啊啊啊' + JSON.stringify(newFileList));
    setFileList(newFileList);
  };
  return (
    <Modal
      className='tokenList'
      centered="true"
      zIndex="9999"
      width='700px'
      footer=''
      title="launch your token"
      open={isModalOpen}
      onOk={handleOk}
      destroyOnClose={true}
      maskClosable={false}
      onCancel={handleCancel} // 使用内部的 handleCancel 方法
    >
      <div style={{ minHeight: '580px' }}>
        <center>
          {/* <pre>{JSON.stringify(fileList)}</pre> */}
          <Form
            className='tokenForms'
            name="basic"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              label="Image"
              name="upload"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                return Array.isArray(e) ? e : e?.fileList;
              }}
              rules={[
                {
                  required: true,
                  message: 'Please upload an image!',
                }
              ]}
            >
              <Upload
                accept="image/*"
                maxCount={10}
                action={_URL.upload}
                listType="picture-card"
                name='tokenImage'
                headers={{
                  Authorization: `Bearer ${localStorage.getItem('token')}`,  // 动态传递 Authorization 头
                }}
                fileList={fileList}
                onChange={handleChange}
                onPreview={(file) => {
                  window.open(file.url);
                }}
                showUploadList={{
                  showPreviewIcon: false, // 隐藏预览图标
                  showRemoveIcon: true,    // 允许显示删除图标
                }}
              >
                {fileList.length == 0 && (
                  <button
                    style={{
                      border: 0,
                      background: 'none',
                    }}
                    type="button"
                  >
                    <PlusOutlined />
                    <div
                      style={{
                        marginTop: 8,
                      }}
                    >
                      Upload
                    </div>
                  </button>
                )}
              </Upload>

            </Form.Item>
            <Form.Item
              className='fitem'
              label="name"
              name="name"
              style={{ marginTop: '30px' }}
              rules={[
                {
                  required: true,
                  message: 'Please input token name!',
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              className='fitem'
              label="ticker"
              name="ticker"
              rules={[
                {
                  required: true,
                  message: 'Please input token ticker!',
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              className='fitem'
              label="Description"
              name="Description"
              rules={[
                {
                  required: true,
                  message: 'Please input token Description!',
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              className='fitem'
              label="Website"
              name="Website"
            >
              <Input />
            </Form.Item>
            <Form.Item
              className='fitem'
              label="Telegram"
              name="Telegram"
            >
              <Input />
            </Form.Item>
            <Form.Item
              className='fitem'
              label="Twitter"
              name="Twitter"
            >
              <Input />
            </Form.Item>

            <Form.Item className='fitem' label={null}>
              {/* <Button className='selfSubBtn' htmlType="submit">
                Submit
              </Button> */}
              <center>
                <button
                 type="primary" 
                  className='selfSubBtn usn'
                  onClick={() => {
                    document.forms["basic"].dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                  }}
                  loading={loading}  // 绑定loading
                  disabled={loading} // 请求时禁用按钮，防止重复提交
                >
                  {loading ? (
                    <>
                      Launching... <span className="rocket-icon"><font>🚀</font></span>
                    </>
                  ) : 'Launch Now 🚀'}
                </button>
              </center>
            </Form.Item>
          </Form>
        </center>
      </div>
    </Modal>
  );
};

export default TokenListModal;
