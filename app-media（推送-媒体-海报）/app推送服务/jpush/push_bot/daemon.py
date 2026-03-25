# -*- coding: utf-8 -*-
import subprocess
import time
import logging
import os
import sys

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('daemon.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def run_script(script_path, max_restarts=10, restart_delay=5):
    restart_count = 0
    while restart_count < max_restarts:
        logger.info(f"启动脚本: {script_path} (第 {restart_count + 1} 次)")
        process = subprocess.Popen(
            [sys.executable, script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True  # Python 3.6 使用 universal_newlines
        )

        # 等待脚本执行并捕获输出
        stdout, stderr = process.communicate()
        return_code = process.returncode

        if return_code == 0:
            logger.info("脚本正常退出")
            break
        else:
            logger.error(f"脚本异常退出，退出码: {return_code}")
            if stdout:
                logger.info(f"标准输出: {stdout}")
            if stderr:
                logger.error(f"错误输出: {stderr}")

            restart_count += 1
            if restart_count < max_restarts:
                logger.info(f"等待 {restart_delay} 秒后重启...")
                time.sleep(restart_delay)
            else:
                logger.error("达到最大重启次数，停止尝试")
                break

if __name__ == "__main__":
    script_path = "push_bot.py"
    if not os.path.exists(script_path):
        logger.error(f"脚本 {script_path} 不存在")
        sys.exit(1)
    run_script(script_path, max_restarts=100, restart_delay=5)