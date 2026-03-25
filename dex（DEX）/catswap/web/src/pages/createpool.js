import React, { useState } from 'react';
import { Button, Input, Steps, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './swap.scss';
import './limit.scss';
import './pool.scss';
import './box.scss';
import './createpool.scss';
const PageTwo = () => {
  const [currentStep, setCurrentStep] = useState(0); // 当前步骤
  const [formData, setFormData] = useState({
    a: '',
    b: '',
    c: '',
    d: '',
    e: '',
    f: '',
  }); // 表单数据
  const handleInputChange = (field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };
  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1); // 前进到下一步
    } else {
      // 最后一部，显示所有数据
      alert(`输入的值：\nA: ${formData.a}\nB: ${formData.b}\nC: ${formData.c}\nD: ${formData.d}\nE: ${formData.e}\nF: ${formData.f}`);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1); // 返回上一步
    }
  };

  return (
    <div className="swap limit pool createpool">
      <div className="page1-container">
        <div className="backgroundPer">
          CAT-20
          <br />
          SWAP
        </div>
        <div className="mBuild setBox " style={{ position: 'relative' }}>
          <div className="orderBuild flex1">
            <span className="poolTitle">
              添加流动性
              <input className="tokenSearch" placeholder="搜索资金池" />
              <Button
                className="tokenSearchBtn"
                type="primary"
                shape="circle"
                icon={<SearchOutlined />}
              />
            </span>
            <div className="cpanal setBox">
              <div style={{ width: '350px' }}>
                <Steps
                  direction="vertical"
                  current={currentStep}
                  onChange={(step) => setCurrentStep(step)} // 点击步骤直接跳转
                  items={[
                    {
                      title: '步骤1',
                      description: '输入A和B',
                    },
                    {
                      title: '步骤2',
                      description: '输入C和D',
                    },
                    {
                      title: '步骤3',
                      description: '输入E和F',
                    },
                  ]}
                />
              </div>
              <div className="flex1 getBorder">
                {currentStep === 0 && (
                  <div>
                    <div>
                      <label>A:</label>
                      <Input
                        value={formData.a}
                        onChange={(e) => handleInputChange('a', e.target.value)}
                        placeholder="请输入A"
                      />
                    </div>
                    <div>
                      <label>B:</label>
                      <Input
                        value={formData.b}
                        onChange={(e) => handleInputChange('b', e.target.value)}
                        placeholder="请输入B"
                      />
                    </div>
                  </div>
                )}
                {currentStep === 1 && (
                  <div>
                    <div>
                      <label>C:</label>
                      <Input
                        value={formData.c}
                        onChange={(e) => handleInputChange('c', e.target.value)}
                        placeholder="请输入C"
                      />
                    </div>
                    <div>
                      <label>D:</label>
                      <Input
                        value={formData.d}
                        onChange={(e) => handleInputChange('d', e.target.value)}
                        placeholder="请输入D"
                      />
                    </div>
                  </div>
                )}
                {currentStep === 2 && (
                  <div>
                    <div>
                      <label>E:</label>
                      <Input
                        value={formData.e}
                        onChange={(e) => handleInputChange('e', e.target.value)}
                        placeholder="请输入E"
                      />
                    </div>
                    <div>
                      <label>F:</label>
                      <Input
                        value={formData.f}
                        onChange={(e) => handleInputChange('f', e.target.value)}
                        placeholder="请输入F"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* <div style={{ marginTop: '20px', textAlign: 'right' }}>
                {currentStep > 0 && (
                  <Button style={{ marginRight: '10px' }} onClick={handlePrev}>
                    上一步
                  </Button>
                )}
                <Button type="primary" onClick={handleNext}>
                  {currentStep < 2 ? '下一步' : '提交'}
                </Button>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageTwo;
