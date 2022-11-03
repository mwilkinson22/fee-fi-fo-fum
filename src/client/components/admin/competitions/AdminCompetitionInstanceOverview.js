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
		const { competitionSegmentList, match, teamList } = nextProps;
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
			newState.instance = newState.segment.instances.find(({ _id }) => _id === match.params.instanceId) || false;
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			year: Yup.number()
				.min(1895)
				.max(new Date().getFullYear() + 1)
				.test("is-taken", "An instance for this year is already in place", year => {
					return (
						(newState.instance && newState.instance.year == year) ||
						!_.find(newState.segment.instances, i => i.year == year)
					);
				})
				.required()
				.label("Year"),
			teams: Yup.array()
				.test(
					"isLeague",
					"At least two teams must be selected for a league",
					value => newState.segment.type !== "League" || value.length > 1
				)
				.label("Teams"),
			sponsor: Yup.string().label("Sponsor"),
			totalRounds: Yup.string().label("Total Rounds"),
			image: Yup.string().label("Image"),
			manOfSteelPoints: Yup.bool().label("Man of Steel Points"),
			manOfSteelPointsGoneDark: Yup.bool().label("Have Points 'Gone Dark'?"),
			scoreOnly: Yup.bool().label("Score Only"),
			usesPregameSquads: Yup.bool().label("Uses Pregame Squads"),
			usesWinPc: Yup.bool().label("Uses Win Percentage?")
		});

		//Convert teamlist to dropdown options
		if (!prevState.teams) {
			newState.teams = _.chain(teamList)
				.map(({ _id, name }) => ({ value: _id, label: name.long }))
				.sortBy("label")
				.value();
		}

		return newState;
	}
	getInitialValues() {
		let { instance, segment, teams, isNew } = this.state;
		const { match } = this.props;

		//Define default values
		const defaultValues = {
			year: "",
			teams: [],
			sponsor: "",
			totalRounds: "",
			manOfSteelPoints: false,
			manOfSteelPointsGoneDark: false,
			scoreOnly: true,
			usesPregameSquads: false,
			image: "",
			usesWinPc: false
		};

		//Check if we have an instance to copy, for new items
		const instanceToCopy = segment.instances.find(({ _id }) => _id == match.params.copyFromId);

		if (isNew && !instanceToCopy) {
			//If it's new, and there's no instance to copy, return the default values
			return defaultValues;
		} else {
			//If it's new and there's an instance to copy, we
			//pull the values from instanceToCopy. If it's not new,
			//we pull the values from the existing segment

			instance = instanceToCopy || instance;
			const values = _.mapValues(defaultValues, (defaultValue, key) => {
				let value;
				switch (key) {
					case "year":
						if (!instanceToCopy) {
							value = instance[key];
						}
						break;
					case "teams":
						if (instance.teams) {
							value = _.chain(teams)
								.filter(({ value }) => instance.teams.find(id => id == value))
								.sortBy("label")
								.map("value")
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

			//If there's an instance to copy, we also grab the additional fields not listed in the overview
			if (instanceToCopy) {
				const extraFields = _.pick(instanceToCopy, ["specialRounds", "customStyling", "leagueTableColours"]);
				if (!extraFields.specialRounds) {
					extraFields.specialRounds = [];
				}
				extraFields.specialRounds.forEach(round => {
					if (!round.hashtag) {
						round.hashtag = [];
					}
					if (!round.playerOfTheMatchTitle) {
						delete round.playerOfTheMatchTitle;
					}
					delete round._id;
				});
				Object.assign(values, extraFields);
			}

			return values;
		}
	}

	getFieldGroups(values) {
		const { segment, teams } = this.state;

		const fields = [
			{ name: "year", type: fieldTypes.number },
			{ name: "sponsor", type: fieldTypes.text },
			{ name: "totalRounds", type: fieldTypes.number },
			{ name: "usesPregameSquads", type: fieldTypes.boolean },
			{ name: "scoreOnly", type: fieldTypes.boolean },
			{ name: "manOfSteelPoints", type: fieldTypes.boolean }
		];

		if (values.manOfSteelPoints) {
			fields.push({ name: "manOfSteelPointsGoneDark", type: fieldTypes.boolean });
		}

		//Win PC
		if (segment.type == "League") {
			fields.push({ name: "usesWinPc", type: fieldTypes.boolean });
		}

		fields.push(
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
				acceptSVG: true,
				resize: { small: { height: 65 } }
			}
		);

		return [{ fields }];
	}

	render() {
		const { createCompetitionInstance, updateCompetitionInstance, deleteCompetitionInstance } = this.props;
		const { instance, segment, isLoading, isNew, validationSchema } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createCompetitionInstance(segment._id, values),
				redirectOnSubmit: id => `/admin/competitions/segments/${segment._id}/instances/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteCompetitionInstance(segment._id, instance._id),
				onSubmit: values => updateCompetitionInstance(segment._id, instance._id, values),
				redirectOnDelete: `/admin/competitions/segments/${segment._id}/instances`
			};
		}
		return (
			<section className="form">
				<div className="container">
					<BasicForm
						fieldGroups={values => this.getFieldGroups(values)}
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

function mapStateToProps({ competitions, teams }) {
	const { competitionList, competitionSegmentList } = competitions;
	const { teamList, teamTypes } = teams;
	return { competitionList, competitionSegmentList, teamList, teamTypes };
}

export default connect(mapStateToProps, {
	createCompetitionInstance,
	updateCompetitionInstance,
	deleteCompetitionInstance,
	fetchTeamList
})(AdminCompetitionInstanceOverview);
