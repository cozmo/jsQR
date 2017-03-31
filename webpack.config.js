module.exports = {
  entry: './src/main.ts',
  output: {
    filename: './dist/jsQR.js',
    libraryTarget: 'umd',
    library: 'jsQR'
  },
  resolve: {
    extensions: ['', '.ts']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  }
}
