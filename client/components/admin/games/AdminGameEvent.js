//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Actions
import { fetchPeopleList } from "~/client/actions/peopleActions";
import { fetchTeamList } from "~/client/actions/teamsActions";

//Components
import LoadingPage from "../../LoadingPage";

//Helpers
import { processFormFields } from "~/helpers/adminHelper";

class AdminGameEvent extends Component {
	constructor(props) {
		super(props);
		const { peopleList, fetchPeopleList, teamList, fetchTeamList } = props;
		if (!peopleList) {
			fetchPeopleList();
		}
		if (!teamList) {
			fetchTeamList();
		}
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		return nextProps;
	}

	getValidationSchema(getPlayer) {
		const shape = {
			event: Yup.mixed()
				.required()
				.label("Event"),
			player: Yup.mixed()
				.test("getPlayer", "Please select a player", function(player) {
					const { event } = this.parent;
					return !event.getPlayer || (player && player.value);
				})
				.label("Player")
		};
		return Yup.object().shape(shape);
	}

	getDefaults() {
		return {
			event: {
				label: "None",
				value: "none"
			},
			player: ""
		};
	}

	onSubmit(values) {
		console.log(values);
	}

	getEventTypes() {
		return [
			{ label: "None", value: "none", getPlayer: false },
			{
				label: "Player Events",
				options: [
					{ label: "Try", value: "T", getPlayer: true },
					{ label: "Conversion", value: "CN", getPlayer: true },
					{ label: "Penalty Goal", value: "PK", getPlayer: true },
					{ label: "Drop Goal", value: "DG", getPlayer: true },
					{ label: "Yellow Card", value: "YC", getPlayer: true },
					{ label: "Red Card", value: "RC", getPlayer: true },
					{ label: "Man of the Match", value: "motm", getPlayer: true },
					{ label: "Fans' Man of the Match", value: "fan_motm", getPlayer: true }
				]
			},
			{
				label: "Game Events",
				getPlayer: false,
				options: [
					{ label: "Kick Off", value: "kickOff", getPlayer: false },
					{ label: "Half Time", value: "halfTime", getPlayer: false },
					{ label: "Full Time", value: "fullTime", getPlayer: false },
					{ label: "Attendance", value: "attendance", getPlayer: false }
				]
			}
		];
	}

	renderFields(formikProps) {
		const { game, peopleList, teamList } = this.state;
		const eventTypes = this.getEventTypes();
		const fields = [{ name: "event", type: "Select", options: eventTypes }];

		const { getPlayer } = formikProps.values.event;
		const validationSchema = this.getValidationSchema(getPlayer);
		if (getPlayer) {
			const players = _.chain(game.playerStats)
				.groupBy("_team")
				.map((squad, team) => {
					const options = _.chain(squad)
						.sortBy("position")
						.map(({ _player }) => {
							const { name } = peopleList[_player];
							return { label: `${name.first} ${name.last}`, value: _player };
						})
						.value();
					return { label: teamList[team].name.short, options };
				})
				.value();
			fields.push({ name: "player", type: "Select", options: players });
		}

		return (
			<Form>
				<div className="form-card">
					<h6>Add Game Event</h6>
					{processFormFields(fields, validationSchema)}
					<div className="buttons">
						<button type="clear">Clear</button>
						<button type="submit">Submit</button>
					</div>
				</div>
			</Form>
		);
	}

	render() {
		const { peopleList, teamList } = this.state;
		if (!peopleList || !teamList) {
			return <LoadingPage />;
		}
		return (
			<div className="container">
				<Formik
					validationSchema={() => this.getValidationSchema()}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					render={formikProps => this.renderFields(formikProps)}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ people, teams }) {
	const { peopleList } = people;
	const { teamList } = teams;
	return { peopleList, teamList };
}

// export default form;
export default connect(
	mapStateToProps,
	{ fetchPeopleList, fetchTeamList }
)(AdminGameEvent);
