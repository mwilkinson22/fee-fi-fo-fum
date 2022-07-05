const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");
const isProduction = process.env.NODE_ENV === "production";

module.exports = {
	devtool: isProduction ? "source-map" : "eval-source-map",
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					"style-loader",
					{
						loader: "postcss-loader",
						options: {
							ident: "postcss",
							sourceMap: true,
							plugins: [require("autoprefixer")()]
						}
					},
					"css-loader"
				]
			},
			{
				test: /\.m?js$/,
				loader: "babel-loader",
				exclude: /node_modules\/(?!(kareem|he|node-html-parser)\/).*/,
				options: {
					plugins: [
						"@babel/plugin-proposal-optional-chaining",
						"@babel/plugin-proposal-nullish-coalescing-operator",
						"@babel/plugin-transform-arrow-functions",
						"@loadable/babel-plugin"
					],
					presets: [
						"@babel/preset-react",
						[
							"@babel/preset-env",
							{
								targets: { browsers: ["last 2 versions", "ie >= 11"] }
							}
						]
					]
				}
			},
			{
				test: /\.scss$/,
				use: [
					//Saves to styles.css
					MiniCssExtractPlugin.loader,
					//Handles imports
					{
						loader: "css-loader",
						options: {
							sourceMap: true
						}
					},
					//Processes css through autoprefixer
					{
						loader: "postcss-loader",
						options: {
							ident: "postcss",
							sourceMap: true,
							plugins: [require("autoprefixer")()]
						}
					},
					//Converts sass to css
					{
						loader: "fast-sass-loader",
						options: {
							sourceMap: true
						}
					},
					//Maps environment variables into scss variables
					{
						loader: "./src/config/sassEnvLoader"
					}
				]
			}
		]
	},
	plugins: [new MiniCssExtractPlugin({ filename: "styles.css" })],
	performance: {
		hints: false
	},
	resolve: {
		alias: {
			"~": path.resolve(".", "src")
		}
	},

	optimization: {
		minimizer: [
			new TerserJSPlugin({
				terserOptions: {
					safari10: true,
					output: {
						comments: false
					}
				}
			}),
			new CssMinimizerPlugin()
		]
	}
};
