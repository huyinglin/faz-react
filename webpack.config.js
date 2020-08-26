const path = require('path');

module.exports = {
  // entry: './faz-react.jsx',
  entry: './index.jsx',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            // plugins: [['@babel/plugin-transform-react-jsx', { pragma: 'FazReact.createElement' }]],
            plugins: [['@babel/plugin-transform-react-jsx', { pragma: 'Didact.createElement' }]],
          }
        }
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
  }
};
