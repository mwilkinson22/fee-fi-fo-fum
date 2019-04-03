const ExtractTextPlugin = require("extract-text-webpack-plugin");
const path = require("path");

module.exports = {
	module: {
		rules: [
			{
				test: /\.css$/,
				loaders: ["style-loader", "css-loader"]
			},
			{
				test: /\.js?$/,
				loader: "babel-loader",
				exclude: /node_modules/,
				options: {
					presets: [
						"react",
						"stage-0",
						["env", { targets: { browsers: ["last 2 versions"] } }]
					]
				}
			},
			{
				test: /\.scss$/,
				use: ExtractTextPlugin.extract({
					fallback: "style-loader",
					use: [
						{
							loader: "css-loader",
							options: {
								sourceMap: true
							}
						},
						{
							loader: "sass-loader",
							options: {
								sourceMap: true
							}
						}
					]
				})
			}
		]
	},
	resolve: {
		alias: {
			"~": path.resolve(".")
		}
	},
	plugins: [new ExtractTextPlugin("styles.css")]
};
