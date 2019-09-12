//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Actions
import { fetchAllGrounds } from "../../../actions/groundActions";
import { updateTeam, createTeam } from "../../../actions/teamsActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminTeamOverview extends BasicForm {
	constructor(props) {
		super(props);
		const { groundList, fetchAllGrounds, team, teamTypes } = props;
		if (!groundList) {
			fetchAllGrounds();
		}

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
		const { fullTeams, match, groundList } = nextProps;
		const newState = {};

		if (match && match.params._id) {
			newState.team = fullTeams[match.params._id];
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

	getDefaults() {
		const { team, groundList } = this.state;
		const { teamTypes } = this.props;

		//Set basics for new teams:
		let defaults = {
			name: {
				short: "",
				long: ""
			},
			nickname: "",
			hashtagPrefix: "",
			_defaultGround: "",
			_grounds: "",
			images: {
				main: "",
				light: "",
				dark: ""
			},
			colours: {
				main: "#BB0000",
				text: "#FFFFFF",
				trim1: "#FFFFFF",
				trim2: "#000000",
				pitchColour: "#BB0000",
				statBarColour: "#BB0000",
				customPitchColour: false,
				customStatBarColour: false
			}
		};

		if (team) {
			defaults = _.mapValues(defaults, (val, key) => {
				if (team[key] != null) {
					switch (key) {
						case "_defaultGround":
							return (
								_.find(groundList, ground => ground.value == team._defaultGround) ||
								""
							);
						case "_grounds":
							return _.chain(teamTypes)
								.sortBy("sortOrder")
								.map(({ _id }) => {
									let result = "";
									const currentValue = team._grounds.find(
										({ _teamType }) => _teamType == _id
									);
									if (currentValue) {
										result = _.find(
											groundList,
											ground => ground.value == currentValue._ground
										);
									}
									return [_id, result];
								})
								.fromPairs()
								.value();
						case "name":
						case "colours":
						case "images":
							return _.mapValues(team[key], (v, subkey) => v || val[subkey]);
						default:
							return team[key];
					}
				} else {
					return val;
				}
			});
		}

		return defaults;
	}

	async onSubmit(values) {
		const { updateTeam, createTeam } = this.props;
		const { team } = this.state;

		if (team) {
			updateTeam(team._id, values);
		} else {
			await createTeam(values);
			await this.setState({ redirect: `/admin/teams/` });
		}
	}

	renderFields() {
		const { groundList, team } = this.state;
		const { teamTypes } = this.props;
		const teamFields = [
			{ name: "name.long", type: fieldTypes.text },
			{ name: "name.short", type: fieldTypes.text },
			{ name: "nickname", type: fieldTypes.text },
			{ name: "hashtagPrefix", type: fieldTypes.text }
		];

		const groundFields = [
			{ name: "_defaultGround", type: fieldTypes.select, options: groundList }
		];
		_.chain(teamTypes)
			.sortBy("sortOrder")
			.each(({ _id }) => {
				groundFields.push({
					name: `_grounds.${_id}`,
					type: fieldTypes.select,
					options: groundList,
					isClearable: true
				});
			})
			.value();

		const colourFields = [
			{ name: "colours.main", type: fieldTypes.colour },
			{ name: "colours.text", type: fieldTypes.colour },
			{ name: "colours.trim1", type: fieldTypes.colour },
			{ name: "colours.trim2", type: fieldTypes.colour },
			{
				name: "colours.customStatBarColour",
				type: fieldTypes.boolean,
				controls: { name: "colours.statBarColour", type: fieldTypes.colour }
			},
			{
				name: "colours.customPitchColour",
				type: fieldTypes.boolean,
				controls: { name: "colours.pitchColour", type: fieldTypes.colour }
			}
		];

		const imageField = {
			type: fieldTypes.image,
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
						<button type="submit">{team ? "Update" : "Add"} Team</button>
					</div>
				</div>
			</Form>
		);
	}

	render() {
		const { groundList, redirect } = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

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
	const { fullTeams, teamTypes } = teams;
	return { fullTeams, groundList, teamTypes };
}
// export default form;
export default connect(
	mapStateToProps,
	{ fetchAllGrounds, updateTeam, createTeam }
)(AdminTeamOverview);
