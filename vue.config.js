const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api/agent': {
        target: 'http://localhost:10010',
        changeOrigin: true
      },
      '/api/record': {
        target: 'http://localhost:10010',
        changeOrigin: true,
        pathRewrite: {
          '^/api/record': '/record'
        }
      },
      '/api/user': {
        target: 'http://localhost:10020',
        changeOrigin: true
      },
      '/api/interviewee': {
        target: 'http://localhost:10020',
        changeOrigin: true
      },
      '/api/knowledge': {
        target: 'http://localhost:10030',
        changeOrigin: true
      },
      '/knowledge-base': {
        target: 'http://localhost:10030',
        changeOrigin: true
      },
      '/api/rag': {
        target: 'http://localhost:10040',
        changeOrigin: true
      },
      '/conversations': {
        target: 'http://localhost:10040',
        changeOrigin: true
      },
      '/rag': {
        target: 'http://localhost:10040',
        changeOrigin: true
      }
    }
  }
});
