//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Colour from "color";

//Actions
import { fetchAllGrounds } from "../../../actions/groundActions";
import { updateTeam } from "../../../actions/teamsActions";

//Components
import LoadingPage from "../../LoadingPage";
import { processFormFields } from "~/helpers/adminHelper";

class AdminTeamOverview extends Component {
	constructor(props) {
		super(props);
		const { groundList, fetchAllGrounds, team } = props;
		if (!groundList) {
			fetchAllGrounds();
		}

		this.colourTypes = {
			main: "#BB0000",
			text: "#FFFFFF",
			trim1: "#FFFFFF",
			trim2: "#000000",
			pitchColour: "#BB0000",
			statBarColour: "#BB0000"
		};

		this.state = { groundList, team };
	}

	static getDerivedStateFromProps(nextProps) {
		const { team, groundList } = nextProps;
		const newState = {};

		if (team) {
			newState.team = team;
		}

		if (groundList) {
			newState.groundList = _.chain(groundList)
				.map(ground => ({
					value: ground._id,
					label: `${ground.name}, ${ground.address._city.name}`
				}))
				.sortBy("label")
				.value();
		}
		return newState;
	}

	getValidationSchema() {
		return Yup.object().shape({
			name: Yup.object().shape({
				long: Yup.string()
					.required()
					.label("Full Name"),
				short: Yup.string()
					.required()
					.label("Short Name")
			}),
			nickname: Yup.string()
				.required()
				.label("Nickname"),
			hashtagPrefix: Yup.string()
				.required()
				.length(3)
				.label("Hashtag Prefix"),
			_ground: Yup.string()
				.required()
				.label("Homeground"),
			colours: Yup.object().shape({
				main: Yup.string()
					.required()
					.label("Main"),
				text: Yup.string()
					.required()
					.label("Text"),
				trim1: Yup.string()
					.required()
					.label("Trim 1"),
				trim2: Yup.string()
					.required()
					.label("Trim 2"),
				customPitchColour: Yup.boolean().label("Custom Pitch Colour?"),
				customStatBarColour: Yup.boolean().label("Custom Stat Bar Colour?"),
				pitchColour: Yup.string().label("Pitch"),
				statBarColour: Yup.string().label("Stat Bar")
			})
		});
	}

	getDefaults() {
		const { team, groundList } = this.state;
		const { colourTypes } = this;
		const colours = _.mapValues(colourTypes, (defaultValue, type) => {
			if (team && team.colours[type]) {
				return Colour(team.colours[type]).hex();
			} else {
				return defaultValue;
			}
		});
		const ground = _.filter(groundList, ground => ground.value === team._ground);
		return {
			name: {
				long: team.name ? team.name.long : "",
				short: team.name ? team.name.short : ""
			},
			nickname: team.nickname || "",
			hashtagPrefix: team.hashtagPrefix || "",
			_ground: ground[0] ? ground[0] : "",
			colours: {
				...colours,
				customPitchColour: team && team.colours.pitchColour !== null,
				customStatBarColour: team && team.colours.statBarColour !== null
			}
		};
	}

	onSubmit(values) {
		const { updateTeam } = this.props;
		const { team } = this.state;
		updateTeam(team._id, values);
	}

	renderFields() {
		const { groundList } = this.state;
		const validationSchema = this.getValidationSchema();
		const teamFields = [
			{ name: "name.long", type: "text" },
			{ name: "name.short", type: "text" },
			{ name: "nickname", type: "text" },
			{ name: "hashtagPrefix", type: "text" },
			{ name: "_ground", type: "Select", options: groundList }
		];

		const colourFields = [
			{ name: "colours.main", type: "color" },
			{ name: "colours.text", type: "color" },
			{ name: "colours.trim1", type: "color" },
			{ name: "colours.trim2", type: "color" },
			{
				name: "colours.customStatBarColour",
				type: "Boolean",
				controls: { name: "colours.statBarColour", type: "color" }
			},
			{
				name: "colours.customPitchColour",
				type: "Boolean",
				controls: { name: "colours.pitchColour", type: "color" }
			}
		];

		return (
			<Form>
				<div className="form-card">
					<h6>Team</h6>
					{processFormFields(teamFields, validationSchema)}
					<h6>Colours</h6>
					{processFormFields(colourFields, validationSchema)}
					<div className="buttons">
						<button type="clear">Clear</button>
						<button type="submit">Submit</button>
					</div>
				</div>
			</Form>
		);
	}

	render() {
		const { team, groundList } = this.state;
		if (!team || !groundList) {
			return <LoadingPage />;
		}

		return (
			<div className="container">
				<Formik
					validationSchema={() => this.getValidationSchema()}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					render={formikProps => this.renderFields(formikProps.values)}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ grounds, teams }, ownProps) {
	const { slug } = ownProps.match.params;
	const team = teams.teamList[slug];
	const { groundList } = grounds;
	return { team, groundList, ...ownProps };
}
// export default form;
export default connect(
	mapStateToProps,
	{ fetchAllGrounds, updateTeam }
)(AdminTeamOverview);
