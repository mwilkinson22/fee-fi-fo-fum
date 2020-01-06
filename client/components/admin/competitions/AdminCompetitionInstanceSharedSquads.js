//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";

//Actions
import { updateCompetitionInstance } from "~/client/actions/competitionActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminCompetitionSharedSquads extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}
	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList, match, teamList } = nextProps;
		const newState = {};

		//Get Segment
		newState.segment = competitionSegmentList[match.params.segmentId] || false;

		//Get Instance
		newState.instance =
			newState.segment.instances.find(({ _id }) => _id === match.params.instanceId) || false;

		//Determine teams to show
		newState.teams = newState.instance.teams;
		if (!newState.teams || !newState.teams.length) {
			newState.teams = Object.keys(teamList);
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape(
			_.fromPairs(newState.teams.map(id => [id, Yup.array().label(teamList[id].name.long)]))
		);

		return newState;
	}
	getInitialValues() {
		const { instance, teams } = this.state;

		return _.chain(teams)
			.map(id => {
				//Set empty array as default
				let sharedWith = [];

				if (instance.sharedSquads) {
					//Try and find an entry for this team
					const sharedSquad = instance.sharedSquads.find(({ _team }) => _team == id);

					//If found, set it to sharedWith
					sharedWith = sharedSquad ? sharedSquad.sharedWith : [];
				}

				return [id, sharedWith];
			})
			.fromPairs()
			.value();
	}

	getFieldGroups() {
		const { teamList } = this.props;
		const { teams } = this.state;
		const options = _.chain(teamList)
			.map(({ name, _id }) => ({ label: name.long, value: _id }))
			.sortBy("label")
			.value();

		const fields = _.chain(teams)
			.sortBy(id => teamList[id].name.long)
			.map(id => ({
				name: id,
				type: fieldTypes.select,
				isMulti: true,
				options: options.filter(({ value }) => value != id)
			}))
			.value();

		return [
			{
				fields
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		return _.chain(values)
			.map((sharedWith, _team) => ({ sharedWith, _team }))
			.filter("sharedWith")
			.value();
	}

	render() {
		const { updateCompetitionInstance } = this.props;
		const { instance, segment, validationSchema } = this.state;

		return (
			<section className="form">
				<div className="container">
					<BasicForm
						alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
						fieldGroups={values => this.getFieldGroups(values)}
						initialValues={this.getInitialValues()}
						isNew={false}
						itemType="Shared Squads"
						onSubmit={sharedSquads =>
							updateCompetitionInstance(segment._id, instance._id, { sharedSquads })
						}
						validationSchema={validationSchema}
					/>
				</div>
			</section>
		);
	}
}

function mapStateToProps({ competitions, teams }) {
	const { competitionSegmentList } = competitions;
	const { teamList } = teams;
	return { competitionSegmentList, teamList };
}

export default connect(mapStateToProps, {
	updateCompetitionInstance
})(AdminCompetitionSharedSquads);
