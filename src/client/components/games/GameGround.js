//Modules
import React from "react";
import { connect } from "react-redux";

//Components
import EmbeddedMap from "../EmbeddedMap";

function GameGround({ bucketPaths, ground, webp }) {
	//Render Background Image
	let backgroundUrl = bucketPaths.images.grounds + (ground.image || "pitch.jpg");
	if (webp) {
		backgroundUrl = backgroundUrl.replace(/\.\w+$/, ".webp");
	}

	//Render Address
	const addressElements = [
		ground.name,
		ground.address.street1,
		ground.address.street2,
		ground.address._city.name,
		ground.address._city._country.name
	]
		.filter(a => a != null && a != "")
		.map((a, i) => <li key={i}>{a}</li>);

	return (
		<section className="game-ground">
			<div className="container">
				<h2>Getting to the Game</h2>
				<div className="wrapper">
					<div className="ground-info" style={{ backgroundImage: `url('${backgroundUrl}')` }}>
						<div className="text-wrapper">
							<ul className="address">{addressElements}</ul>
						</div>
					</div>
					<EmbeddedMap name={ground.name} placeId={ground.address.googlePlaceId} />
				</div>
			</div>
		</section>
	);
}

function mapStateToProps({ config }) {
	const { bucketPaths, webp } = config;
	return { bucketPaths, webp };
}

export default connect(mapStateToProps)(GameGround);
