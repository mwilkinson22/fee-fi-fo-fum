//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Actions
import { fetchAllGrounds } from "../../../actions/groundActions";
import { updateTeam, createTeam, deleteTeam } from "../../../actions/teamsActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminTeamOverview extends Component {
	constructor(props) {
		super(props);
		const { groundList, fetchAllGrounds } = props;

		if (!groundList) {
			fetchAllGrounds();
		}

		//Create Validation Schema
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
			playerNickname: Yup.string().label("Single Player Nickname"),
			hashtagPrefix: Yup.string()
				.required()
				.length(3)
				.label("Hashtag Prefix"),
			_defaultGround: Yup.string()
				.required()
				.label("Default Ground"),
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

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullTeams, match, groundList } = nextProps;
		const newState = { isLoading: false };

		//Wait for everything to load
		if (!groundList) {
			return { isLoading: true };
		}

		//Create or Edit
		newState.isNew = !match.params._id;

		//Get Current Team
		if (!newState.isNew) {
			newState.team = fullTeams[match.params._id] || false;
		}

		//Create Ground Options
		newState.groundOptions = _.chain(groundList)
			.map(ground => ({
				value: ground._id,
				label: `${ground.name}, ${ground.address._city.name}`
			}))
			.sortBy("label")
			.value();

		return newState;
	}

	getInitialValues() {
		const { isNew, team } = this.state;

		const defaultValues = {
			name: {
				short: "",
				long: ""
			},
			nickname: "",
			playerNickname: "",
			hashtagPrefix: "",
			_defaultGround: "",
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

		if (isNew) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, key) => {
				let value;
				switch (key) {
					//Handle nested objects
					case "name":
					case "images":
					case "colours":
						value = _.mapValues(team[key], (currentValue, subkey) => {
							let value;

							switch (`${key}.${subkey}`) {
								//If null, default to main colour
								case `colours.pitchColour`:
								case `colours.statBarColour`:
									value = currentValue || team.colours.main;
									break;

								default:
									value = currentValue;
							}

							return value != null ? value : defaultValue[subkey];
						});

						//We've looped through the team properties above, not the default values,
						//so we need to add in the custom colour booleans here
						value.customPitchColour = Boolean(team.colours.pitchColour);
						value.customStatBarColour = Boolean(team.colours.statBarColour);
						break;
					default:
						value = team[key];
						break;
				}

				return value != null ? value : defaultValue;
			});
		}
	}

	getFieldGroups(values) {
		const { groundOptions, team } = this.state;

		//Get Colour Fields
		const colourFields = [
			{ name: "colours.main", type: fieldTypes.colour },
			{ name: "colours.text", type: fieldTypes.colour },
			{ name: "colours.trim1", type: fieldTypes.colour },
			{ name: "colours.trim2", type: fieldTypes.colour }
		];

		//Add Stat Bar
		colourFields.push({
			name: "colours.customStatBarColour",
			type: fieldTypes.boolean,
			fastField: false
		});
		if (values.colours.customStatBarColour) {
			colourFields.push({
				name: "colours.statBarColour",
				type: fieldTypes.colour,
				fastField: false
			});
		}

		//Add Pitch Colour
		colourFields.push({
			name: "colours.customPitchColour",
			type: fieldTypes.boolean,
			fastField: false
		});
		if (values.colours.customPitchColour) {
			colourFields.push({
				name: "colours.pitchColour",
				type: fieldTypes.colour,
				fastField: false
			});
		}

		//Get Image field template
		const imageField = {
			type: fieldTypes.image,
			path: "images/teams/",
			acceptSVG: true,
			defaultUploadName: team ? team.slug : null,
			resize: {
				medium: { width: 80 },
				small: { height: 30 }
			}
		};

		return [
			{
				fields: [
					{ name: "name.long", type: fieldTypes.text },
					{ name: "name.short", type: fieldTypes.text },
					{ name: "nickname", type: fieldTypes.text },
					{ name: "playerNickname", type: fieldTypes.text },
					{ name: "hashtagPrefix", type: fieldTypes.text },
					{ name: "_defaultGround", type: fieldTypes.select, options: groundOptions }
				]
			},
			{
				label: "Colours",
				fields: colourFields
			},
			{
				label: "Images",
				fields: [
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
				]
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		if (!values.colours.customPitchColour) {
			values.colours.pitchColour = null;
		}
		if (!values.colours.customStatBarColour) {
			values.colours.statBarColour = null;
		}

		delete values.colours.customStatBarColour;
		delete values.colours.customPitchColour;
	}

	render() {
		const { createTeam, updateTeam, deleteTeam } = this.props;
		const { isLoading, isNew, team, validationSchema } = this.state;

		//Wait for the ground list
		if (isLoading) {
			return <LoadingPage />;
		}

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createTeam(values),
				redirectOnSubmit: id => `/admin/teams/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteTeam(team._id),
				onSubmit: values => updateTeam(team._id, values),
				redirectOnDelete: `/admin/teams/`
			};
		}

		return (
			<section className="form">
				<div className="container">
					<BasicForm
						alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
						fieldGroups={values => this.getFieldGroups(values)}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType="Team"
						validationSchema={validationSchema}
						{...formProps}
					/>
				</div>
			</section>
		);
	}
}

//Add Redux Support
function mapStateToProps({ grounds, teams }) {
	const { groundList } = grounds;
	const { fullTeams } = teams;
	return { fullTeams, groundList };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, { fetchAllGrounds, updateTeam, createTeam, deleteTeam })(
		AdminTeamOverview
	)
);
