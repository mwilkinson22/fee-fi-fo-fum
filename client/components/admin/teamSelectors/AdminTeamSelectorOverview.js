//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Actions
import { fetchTeam } from "../../../actions/teamsActions";
import {
	createTeamSelector,
	updateTeamSelector,
	deleteTeamSelector
} from "../../../actions/teamSelectorActions";

//Components
import BasicForm from "../BasicForm";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { getSquadsAsDropdown } from "~/helpers/teamHelper";
import { validateSlug } from "~/helpers/adminHelper";

class AdminTeamSelectorOverview extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fetchTeam, fullTeams, match, selectors, teamList, teamTypes } = nextProps;
		const newState = {};

		//Create or Edit
		newState.isNew = !match.params._id;

		//Get Team for squad number selector
		let { team } = prevState;

		//Get Current Selector
		if (!newState.isNew) {
			newState.selector = selectors[match.params._id] || false;

			//Upon selector change, update the squad number
			//team back
			if (!prevState.selector || prevState.selector._id != match.params._id) {
				team = newState.selector.numberFromTeam;
				newState.team = team;
			}
		}

		//Get full team, if necessary
		if (team && (!fullTeams[team] || !fullTeams[team].fullData) && !prevState.isLoadingTeam) {
			fetchTeam(team, "full");
			newState.isLoadingTeam = true;
		} else if (fullTeams[team] && fullTeams[team].fullData) {
			newState.isLoadingTeam = false;
		}

		//Get Dropdown Options
		newState.options = {};

		//Teams
		newState.options.teams = _.chain(teamList)
			.map(({ _id, name }) => ({ label: name.long, value: _id }))
			.sortBy("label")
			.value();

		//Squads
		if (fullTeams[team]) {
			newState.options.squads = getSquadsAsDropdown(fullTeams[team].squads, teamTypes);
		} else {
			newState.options.squads = [];
		}

		//Validation Schema
		const validationSchema = {
			title: Yup.string()
				.required()
				.label("Title"),
			interchanges: Yup.number()
				.min(0)
				.required()
				.label("Interchanges"),
			slug: validateSlug(),
			numberFromTeam: Yup.mixed().label("Team"),
			numberFromSquad: Yup.mixed().label("Squad"),
			defaultSocialText: Yup.string().label("Default Post Text"),
			socialCard: Yup.string().label("Social Media Card"),
			canvasText1: Yup.string().label("Canvas First Line"),
			canvasText2: Yup.string().label("Canvas Second Line")
		};

		newState.validationSchema = Yup.object().shape(validationSchema);
		return newState;
	}

	getInitialValues() {
		const { isNew, selector } = this.state;

		const defaultValues = {
			title: "",
			interchanges: "",
			slug: "",
			numberFromTeam: "",
			numberFromSquad: "",
			defaultSocialText: "",
			socialCard: "",
			canvasText1: "",
			canvasText2: ""
		};

		if (isNew) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, key) => {
				let value;
				switch (key) {
					default:
						value = selector[key];
						break;
				}

				return value != null ? value : defaultValue;
			});
		}
	}

	getFieldGroups() {
		const { isLoadingTeam, options, team } = this.state;

		return [
			{
				fields: [
					{ name: "title", type: fieldTypes.text },
					{ name: "interchanges", type: fieldTypes.number },
					{ name: "slug", type: fieldTypes.text }
				]
			},
			{
				label: "Squad Numbers",
				fields: [
					{
						name: "numberFromTeam",
						type: fieldTypes.select,
						options: options.teams,
						customOnChange: (option, { form }) => {
							let value = option ? option.value : null;

							if (value != team) {
								//Update the team in state, so we can load
								//the squad options
								this.setState({ team: value });

								//Clear squad as the value will now be invalid
								form.setFieldValue("numberFromSquad", "");
							}
						},
						isDisabled: isLoadingTeam,
						isClearable: true
					},
					{
						name: "numberFromSquad",
						type: fieldTypes.select,
						options: options.squads,
						isNested: true,
						isDisabled: !team || isLoadingTeam,
						isClearable: true
					}
				]
			},
			{
				label: "Sharing",
				fields: [
					{
						name: "socialCard",
						type: fieldTypes.image,
						path: "images/team-selectors/",
						allowSVG: false,
						convertToWebP: false
					},
					{ name: "defaultSocialText", type: fieldTypes.textarea },
					{
						name: "canvasText1",
						type: fieldTypes.text,
						placeholder: "Defaults to title"
					},
					{
						name: "canvasText2",
						type: fieldTypes.text,
						placeholder: "Defaults to twitter handle"
					}
				]
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		if (!values.numberFromSquad) {
			values.numberFromTeam = null;
		}
	}

	render() {
		const { createTeamSelector, updateTeamSelector, deleteTeamSelector } = this.props;
		const { isNew, selector, validationSchema } = this.state;

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createTeamSelector(values),
				redirectOnSubmit: id => `/admin/team-selectors/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteTeamSelector(selector._id),
				onSubmit: values => updateTeamSelector(selector._id, values),
				redirectOnDelete: `/admin/team-selectors/`
			};
		}

		return (
			<section className="form">
				<div className="container">
					<BasicForm
						alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
						fastFieldByDefault={false}
						fieldGroups={this.getFieldGroups()}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType="Selector"
						onReset={() => {
							this.setState({ team: selector && selector.numberFromTeam });
						}}
						validationSchema={validationSchema}
						{...formProps}
					/>
				</div>
			</section>
		);
	}
}

//Add Redux Support
function mapStateToProps({ teamSelectors, teams }) {
	const { selectors } = teamSelectors;
	const { teamList, fullTeams, teamTypes } = teams;
	return { fullTeams, selectors, teamList, teamTypes };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, {
		fetchTeam,
		updateTeamSelector,
		createTeamSelector,
		deleteTeamSelector
	})(AdminTeamSelectorOverview)
);
