module.exports = {
  entry: './src/Main.ts',
  output: {
    filename: './dist/jsQR.js',
    libraryTarget: 'umd',
    library: 'jsQR'
  },
  resolve: {
    extensions: [".js", ".json", ".ts"]
  },
  module: {
    rules: [
      { test: /\.ts$/, use: [{ loader: "awesome-typescript-loader" }] }
    ]
  }
}
