import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

class GameLogo extends Component {
	render() {
		const { bucketPaths, className, game, size, useWebp } = this.props;

		if (game.images.logo) {
			let src = bucketPaths.root + game.images.logo;

			//Determine if it's a raster
			const isRaster =
				["png", "jpg", "jpeg"].indexOf(
					game.images.logo
						.split(".")
						.pop()
						.toLowerCase()
				) > -1;

			if (isRaster) {
				//If a size is defined, look in the corresponding folder
				if (size) {
					const splitSrc = src.split("/");
					const filename = splitSrc.pop();
					src = `${splitSrc.join("/")}/${size}/${filename}`;
				}

				//If webp is supported, change the extension
				if (useWebp) {
					src = src.replace(/\.[a-z]+$/, ".webp");
				}
			}
			return <img src={src} className={className} alt={game.title} />;
		} else {
			return null;
		}
	}
}

function mapStateToProps({ config }) {
	const { bucketPaths, webp } = config;
	return {
		bucketPaths,
		useWebp: webp
	};
}

GameLogo.propTypes = {
	className: PropTypes.string,
	game: PropTypes.object.isRequired,
	size: PropTypes.oneOf([null, "small"])
};

GameLogo.defaultProps = {
	className: "",
	size: null
};

export default connect(mapStateToProps)(GameLogo);
