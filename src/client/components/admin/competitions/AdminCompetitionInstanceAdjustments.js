//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";
import NotFoundPage from "~/client/pages/NotFoundPage";

//Actions
import { updateCompetitionInstance } from "~/client/actions/competitionActions";
import { fetchTeamList } from "~/client/actions/teamsActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminCompetitionInstanceAdjustments extends Component {
	constructor(props) {
		super(props);

		const { teamList, fetchTeamList } = props;
		if (!teamList) {
			fetchTeamList();
		}

		this.state = {
			columns: { W: "Wins", D: "Draws", L: "Losses", F: "For", A: "Against", Pts: "Points" }
		};
	}
	static getDerivedStateFromProps(nextProps, prevState) {
		const { competitionSegmentList, match, teamList } = nextProps;
		const newState = { isLoading: false };

		//Get Segment
		newState.segment = competitionSegmentList[match.params.segmentId] || false;

		//Get Instance
		newState.instance = newState.segment.instances.find(({ _id }) => _id === match.params.instanceId) || false;

		//If the instance has no teams assigned, throw an error
		if (!newState.instance.teams || !newState.instance.teams.length) {
			newState.noTeams = true;
			return newState;
		}

		//Check teams have loaded
		if (!teamList) {
			newState.isLoading = true;
			return newState;
		}

		//Get Teams
		newState.teams = _.sortBy(newState.instance.teams, id => teamList[id].name.long);

		//Create Validation Schema
		const adjustmentFields = _.mapValues(prevState.columns, label =>
			Yup.number()
				.required()
				.label(label)
		);

		newState.validationSchema = Yup.object().shape({
			adjustments: Yup.array().of(
				Yup.object().shape({
					_team: Yup.string().required(),
					...adjustmentFields
				})
			)
		});

		return newState;
	}

	getInitialValues() {
		let { columns, instance, teams } = this.state;

		const defaultAdjustments = _.mapValues(columns, () => 0);

		const adjustments = teams.map(id => {
			let adjustmentValues;

			//Get the current adjustment entry for this team, if any
			const currentAdjustments = instance.adjustments && instance.adjustments.find(({ _team }) => _team == id);

			if (!currentAdjustments) {
				//If none exist, we use the defaults
				adjustmentValues = defaultAdjustments;
			} else {
				//Otherwise we pull the corresponding values
				adjustmentValues = _.mapValues(
					defaultAdjustments,
					(defaultValue, key) => currentAdjustments[key] || defaultValue
				);
			}

			return {
				_team: id,
				...adjustmentValues
			};
		});

		return { adjustments };
	}

	getFieldGroups() {
		const { teamList } = this.props;
		const { columns, teams } = this.state;

		return teams.map((id, i) => ({
			label: teamList[id].name.long,
			fields: _.map(columns, (label, key) => ({
				name: `adjustments.${i}.${key}`,
				type: fieldTypes.number
			}))
		}));
	}

	alterValuesBeforeSubmit(values) {
		//Clear out entries where all adjustments are zero
		values.adjustments = values.adjustments.filter(
			a => _.filter(a, (val, key) => key !== "_team" && val !== 0).length
		);
	}

	render() {
		const { updateCompetitionInstance } = this.props;
		const { instance, segment, isLoading, noTeams, validationSchema } = this.state;

		if (noTeams) {
			return <NotFoundPage />;
		}

		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<section className="form">
				<div className="container">
					<BasicForm
						alterValuesBeforeSubmit={values => this.alterValuesBeforeSubmit(values)}
						fieldGroups={this.getFieldGroups()}
						initialValues={this.getInitialValues()}
						isNew={false}
						itemType="Instance"
						onSubmit={values => updateCompetitionInstance(segment._id, instance._id, values)}
						validationSchema={validationSchema}
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
	updateCompetitionInstance,
	fetchTeamList
})(AdminCompetitionInstanceAdjustments);
