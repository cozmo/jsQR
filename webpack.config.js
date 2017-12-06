module.exports = {
  entry: './src/index.ts',
  output: {
    filename: './dist/jsQR.js',
    libraryTarget: 'umd',
    library: 'jsQR'
  },
  resolve: {
    extensions: [".ts"]
  },
  module: {
    rules: [
      { test: /\.ts$/, use: [{ loader: "awesome-typescript-loader" }] }
    ]
  }
}
