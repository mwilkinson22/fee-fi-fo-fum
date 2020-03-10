import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

class GameHeaderImage extends Component {
	render() {
		const { bucketPaths, localTeam, game, className, size, useWebp, teamList } = this.props;
		let src;
		let alt;

		//Get actual src link
		if (game.images.header) {
			const localTeamName = teamList[localTeam].name.long;
			src = bucketPaths.images.games + "header/" + game.images.header;
			alt = `${localTeamName} vs ${game._opposition.name.long} - ${game.date.toString(
				"dd/MM/yyyy"
			)}`;
		} else if (game._ground.image) {
			src = bucketPaths.images.grounds + game._ground.image;
			alt = game._ground.name;
		} else {
			src = bucketPaths.images.grounds + "pitch.jpg";
			alt = "Rugby Pitch";
		}

		//Determine if it's a raster
		const isRaster =
			["png", "jpg", "jpeg"].indexOf(
				src
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
		return <img src={src} className={`game-header-image ${className}`} alt={alt} />;
	}
}

function mapStateToProps({ config, teams }) {
	const { bucketPaths, localTeam, webp } = config;
	const { teamList } = teams;
	return {
		bucketPaths,
		localTeam,
		teamList,
		useWebp: webp
	};
}

GameHeaderImage.propTypes = {
	className: PropTypes.string,
	game: PropTypes.object.isRequired,
	size: PropTypes.oneOf([null, "medium", "small"])
};

GameHeaderImage.defaultProps = {
	className: "",
	size: null
};

export default connect(mapStateToProps)(GameHeaderImage);
