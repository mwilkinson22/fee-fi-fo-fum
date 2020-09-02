const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const isProduction = process.env.NODE_ENV === "production";

module.exports = {
	devtool: isProduction ? "source-map" : "eval-source-map",
	module: {
		rules: [
			{
				test: /\.css$/,
				loaders: [
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
				exclude: /node_modules\/(?!(kareem|he)\/).*/,
				options: {
					plugins: ["@babel/plugin-transform-arrow-functions", "@loadable/babel-plugin"],
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
						loader: "./config/sassEnvLoader"
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
			"~": path.resolve(".")
		}
	},

	optimization: {
		minimizer: [
			new TerserJSPlugin({
				terserOptions: {
					output: {
						comments: false
					}
				}
			}),
			new OptimizeCSSAssetsPlugin({})
		]
	}
};
