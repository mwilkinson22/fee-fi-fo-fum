//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Actions
import {
	createCompetitionInstance,
	updateCompetitionInstance,
	deleteCompetitionInstance
} from "~/client/actions/competitionActions";
import { fetchTeamList } from "~/client/actions/teamsActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminCompetitionInstanceOverview extends Component {
	constructor(props) {
		super(props);

		const { teamList, fetchTeamList } = props;
		if (!teamList) {
			fetchTeamList();
		}

		this.state = {};
	}
	static getDerivedStateFromProps(nextProps, prevState) {
		const { competitionSegmentList, localTeam, match, teamList } = nextProps;
		const newState = { isLoading: false };

		//Check teams have loaded
		if (!teamList) {
			newState.isLoading = true;
			return newState;
		}

		//Create Or Edit
		newState.isNew = !match.params.instanceId;

		//Get Segment
		newState.segment = competitionSegmentList[match.params.segmentId] || false;

		//Get Instance
		if (!newState.isNew) {
			newState.instance =
				newState.segment.instances.find(({ _id }) => _id === match.params.instanceId) ||
				false;
		}

		//Create Validation Schema
		const validationSchema = {
			teams: Yup.array().label("Teams"),
			sponsor: Yup.string().label("Sponsor"),
			image: Yup.string().label("Image"),
			manOfSteelPoints: Yup.bool().label("Man of Steel Points"),
			scoreOnly: Yup.bool().label("Score Only"),
			usesPregameSquads: Yup.bool().label("Uses Pregame Squads")
		};

		//Add year check where multiple instances are required
		if (newState.segment.multipleInstances) {
			validationSchema.year = Yup.number()
				.min(1895)
				.max(new Date().getFullYear() + 1)
				.test("is-taken", "An instance for this year is already in place", year => {
					return (
						(newState.instance && newState.instance.year == year) ||
						!_.find(newState.segment.instances, i => i.year == year)
					);
				})
				.required()
				.label("Year");
		}

		newState.validationSchema = Yup.object().shape(validationSchema);

		//Convert teamlist to dropdown options
		if (!prevState.teams) {
			newState.teams = _.chain(teamList)
				.reject(({ _id }) => _id === localTeam)
				.map(({ _id, name }) => ({ value: _id, label: name.long }))
				.sortBy("label")
				.value();
		}

		return newState;
	}
	getInitialValues() {
		const { instance, segment, teams, isNew } = this.state;

		const defaultValues = {
			teams: [],
			sponsor: "",
			manOfSteelPoints: false,
			scoreOnly: true,
			usesPregameSquads: false,
			image: ""
		};

		if (segment.multipleInstances) {
			defaultValues.year = "";
		}

		if (isNew) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, key) => {
				let value;
				switch (key) {
					case "teams":
						if (instance.teams) {
							value = _.chain(teams)
								.filter(({ value }) => instance.teams.find(id => id == value))
								.sortBy("label")
								.value();
						} else {
							value = [];
						}
						break;
					default:
						value = instance[key];
				}
				return value != null ? value : defaultValue;
			});
		}
	}

	getFieldGroups() {
		const { segment, teams } = this.state;

		const fields = [];

		if (segment.multipleInstances) {
			fields.push({ name: "year", type: fieldTypes.number });
		}

		fields.push(
			{ name: "sponsor", type: fieldTypes.text },
			{ name: "usesPregameSquads", type: fieldTypes.boolean },
			{ name: "manOfSteelPoints", type: fieldTypes.boolean },
			{ name: "scoreOnly", type: fieldTypes.boolean },
			{
				name: "teams",
				type: fieldTypes.select,
				closeMenuOnSelect: false,
				isMulti: true,
				options: teams
			},
			{
				name: "image",
				type: fieldTypes.image,
				path: "images/competitions/",
				acceptSVG: true
			}
		);

		return [{ fields }];
	}

	render() {
		const {
			createCompetitionInstance,
			updateCompetitionInstance,
			deleteCompetitionInstance
		} = this.props;
		const { instance, segment, isLoading, isNew, validationSchema } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createCompetitionInstance(segment._id, values),
				redirectOnSubmit: id =>
					`/admin/competitions/segments/${segment._id}/instances/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteCompetitionInstance(segment._id, instance._id),
				onSubmit: values => updateCompetitionInstance(segment._id, instance._id, values),
				redirectOnDelete: `/admin/competitions/segments/${segment._id}/${
					segment.multipleInstances ? "instances" : ""
				}`
			};
			if (segment.multipleInstances) {
				formProps.onDelete = () => deleteCompetitionInstance(segment._id, instance._id);
			}
		}
		return (
			<section className="form">
				<div className="container">
					<BasicForm
						fieldGroups={this.getFieldGroups()}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType="Instance"
						validationSchema={validationSchema}
						{...formProps}
					/>
				</div>
			</section>
		);
	}
}

function mapStateToProps({ competitions, config, teams }) {
	const { localTeam } = config;
	const { competitionList, competitionSegmentList } = competitions;
	const { teamList, teamTypes } = teams;
	return { localTeam, competitionList, competitionSegmentList, teamList, teamTypes };
}

export default connect(mapStateToProps, {
	createCompetitionInstance,
	updateCompetitionInstance,
	deleteCompetitionInstance,
	fetchTeamList
})(AdminCompetitionInstanceOverview);
