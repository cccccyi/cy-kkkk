const webpack = require('webpack');
module.exports = {
  webpack: {
    configure: (config) => {
      // 添加 polyfill 配置
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        url: require.resolve('url'),
        assert: require.resolve('assert'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify'),
        fs: false, // 忽略 fs 模块
        path: false,
        net: false,
        tls: false,
      };
      // 添加 ProvidePlugin 配置
      config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser.js', // 注意添加 .js 扩展名
        }),
      ];
      config.module.rules.push({
        test: /\.(ts|tsx)$/,  // 处理 .ts 和 .tsx 文件
        use: 'ts-loader',     // 使用 ts-loader 编译
        exclude: /node_modules/, // 排除 node_modules
      });
      config.resolve.extensions.push('.ts', '.tsx', '.json'); // 添加 .ts 和 .tsx 扩展名
      return config;
    },
  },
};
