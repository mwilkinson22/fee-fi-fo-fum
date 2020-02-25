//Modules
import _ from "lodash";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import * as Yup from "yup";

//Actions
import { updateGame } from "../../../actions/gamesActions";

//Components
import BasicForm from "../BasicForm";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminGameImages extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, fullGames } = nextProps;

		const newState = {};
		const { _id } = match.params;

		//Get Game
		newState.game = fullGames[_id];

		//Validation Schema
		newState.validationSchema = Yup.object().shape({
			header: Yup.string().label("Header"),
			midpage: Yup.string().label("Midpage"),
			customLogo: Yup.string().label("Custom Logo")
		});

		return newState;
	}

	getInitialValues() {
		const { game } = this.state;

		const defaultValues = {
			header: "",
			midpage: "",
			customLogo: ""
		};

		return _.mapValues(defaultValues, (defaultValue, key) => game.images[key] || defaultValue);
	}

	getFieldGroups() {
		const { game } = this.state;

		return [
			{
				fields: [
					{
						name: "header",
						type: fieldTypes.image,
						path: "images/games/header/",
						defaultUploadName: game.slug
					},
					{
						name: "midpage",
						type: fieldTypes.image,
						path: "images/games/midpage/",
						defaultUploadName: game.slug
					},
					{
						name: "customLogo",
						type: fieldTypes.image,
						path: "images/games/logo/",
						acceptSVG: true,
						defaultUploadName: game.slug
					}
				]
			}
		];
	}

	render() {
		const { game, validationSchema } = this.state;
		const { updateGame } = this.props;

		return (
			<BasicForm
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={false}
				itemType="Images"
				onSubmit={images => updateGame(game._id, { images })}
				validationSchema={validationSchema}
			/>
		);
	}
}

//Add Redux Support
function mapStateToProps({ games }) {
	const { fullGames } = games;

	return { fullGames };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, {
		updateGame
	})(AdminGameImages)
);
