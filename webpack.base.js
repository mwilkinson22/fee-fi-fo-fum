const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
	module: {
		rules: [
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
	plugins: [new ExtractTextPlugin("styles.css")]
};
