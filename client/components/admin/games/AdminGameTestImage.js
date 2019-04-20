//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import "datejs";

//Actions
import { getPregameImage } from "../../../actions/gamesActions";

//Components
import LoadingPage from "../../LoadingPage";

class AdminGameTestImage extends Component {
	constructor(props) {
		super(props);
		const { images, game, getPregameImage } = props;
		const id = game._id;
		if (!images[id]) {
			getPregameImage(id);
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { images, game } = nextProps;
		return { image: images[game._id] };
	}

	render() {
		const { image } = this.state;
		if (!image) {
			return <LoadingPage />;
		} else {
			return (
				<div
					style={{
						background: "green",
						width: "100vw",
						position: "relative",
						height: "70vh"
					}}
				>
					<img
						src={image}
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							top: 0,
							bottom: 0,
							maxWidth: "90%",
							maxHeight: "90%",
							margin: "auto"
						}}
					/>
				</div>
			);
		}
	}
}

//Add Redux Support
function mapStateToProps({ games }) {
	const { pregame: images } = games.images;
	return { images };
}
// export default form;
export default connect(
	mapStateToProps,
	{ getPregameImage }
)(AdminGameTestImage);
