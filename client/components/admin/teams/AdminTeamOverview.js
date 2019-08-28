//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Actions
import { fetchAllGrounds } from "../../../actions/groundActions";
import { updateTeam } from "../../../actions/teamsActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

class AdminTeamOverview extends BasicForm {
	constructor(props) {
		super(props);
		const { groundList, fetchAllGrounds, team, teamTypes } = props;
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

		const _grounds = _.mapValues(teamTypes, ({ name }) => Yup.string().label(name));

		const validationSchema = Yup.object().shape({
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
			_defaultGround: Yup.string()
				.required()
				.label("Default Ground"),
			_grounds: Yup.object().shape(_grounds),
			images: Yup.object().shape({
				main: Yup.string()
					.required()
					.label("Main"),
				light: Yup.string().label("Light Variant"),
				dark: Yup.string().label("Dark Variant")
			}),
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

		this.state = { groundList, team, validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullTeams, slugMap, match, groundList } = nextProps;
		const newState = {};

		const { slug } = match.params;
		const { id } = slugMap[slug];
		newState.team = fullTeams[id];

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

	getDefaults() {
		const { team, groundList } = this.state;
		const { teamTypes } = this.props;
		const { colourTypes } = this;
		const colours = _.mapValues(colourTypes, (defaultValue, type) => {
			if (team && team.colours[type]) {
				return team.colours[type];
			} else {
				return defaultValue;
			}
		});
		const images = _.chain(["main", "light", "dark"])
			.map(type => {
				let value;
				if (team && team.images[type]) {
					value = team.images[type];
				} else {
					value = "";
				}
				return [type, value];
			})
			.fromPairs()
			.value();

		const defaultGround = _.find(groundList, ground => ground.value == team._defaultGround);
		const _grounds = _.chain(teamTypes)
			.sortBy("sortOrder")
			.map(({ _id }) => {
				let result = "";
				const currentValue = team._grounds.find(({ _teamType }) => _teamType == _id);
				if (currentValue) {
					result = _.find(groundList, ground => ground.value == currentValue._ground);
				}
				return [_id, result];
			})
			.fromPairs()
			.value();
		return {
			name: {
				long: team.name ? team.name.long : "",
				short: team.name ? team.name.short : ""
			},
			nickname: team.nickname || "",
			hashtagPrefix: team.hashtagPrefix || "",
			_defaultGround: defaultGround || "",
			_grounds,
			colours: {
				...colours,
				customPitchColour: team && team.colours.pitchColour !== null,
				customStatBarColour: team && team.colours.statBarColour !== null
			},
			images
		};
	}

	onSubmit(values) {
		const { updateTeam } = this.props;
		const { team } = this.state;
		updateTeam(team._id, values);
	}

	renderFields() {
		const { groundList, team } = this.state;
		const { teamTypes } = this.props;
		const teamFields = [
			{ name: "name.long", type: "text" },
			{ name: "name.short", type: "text" },
			{ name: "nickname", type: "text" },
			{ name: "hashtagPrefix", type: "text" }
		];

		const groundFields = [{ name: "_defaultGround", type: "Select", options: groundList }];
		_.chain(teamTypes)
			.sortBy("sortOrder")
			.each(({ _id }) => {
				groundFields.push({
					name: `_grounds.${_id}`,
					type: "Select",
					options: groundList,
					isClearable: true
				});
			})
			.value();

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

		const imageField = {
			type: "Image",
			path: "images/teams/",
			acceptSVG: true,
			defaultUploadName: team ? team.slug : null
		};
		const imageFields = [
			{
				...imageField,
				name: "images.main"
			},
			{
				...imageField,
				name: "images.dark",
				defaultUploadName: imageField.defaultUploadName + "-dark"
			},
			{
				...imageField,
				name: "images.light",
				defaultUploadName: imageField.defaultUploadName + "-light"
			}
		];

		return (
			<Form>
				<div className="form-card grid">
					<h6>Team</h6>
					{this.renderFieldGroup(teamFields)}
					<h6>Grounds</h6>
					{this.renderFieldGroup(groundFields)}
					<h6>Colours</h6>
					{this.renderFieldGroup(colourFields)}
					<h6>Images</h6>
					{this.renderFieldGroup(imageFields)}
					<div className="buttons">
						<button type="clear">Clear</button>
						<button type="submit">Submit</button>
					</div>
				</div>
			</Form>
		);
	}

	render() {
		const { groundList } = this.state;
		if (!groundList) {
			return <LoadingPage />;
		}

		return (
			<div className="container">
				<Formik
					validationSchema={this.state.validationSchema}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					render={formikProps => this.renderFields(formikProps.values)}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ grounds, teams }) {
	const { groundList } = grounds;
	const { fullTeams, slugMap, teamTypes } = teams;
	return { fullTeams, slugMap, groundList, teamTypes };
}
// export default form;
export default connect(
	mapStateToProps,
	{ fetchAllGrounds, updateTeam }
)(AdminTeamOverview);
