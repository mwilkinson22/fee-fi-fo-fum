import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import SquadSelectorCard from "./SquadSelectorCard";
import Colour from "color";
import playerPositions from "~/constants/playerPositions";
import { setSquad } from "~/client/actions/gamesActions";

class SquadSelector extends Component {
	constructor(props) {
		super(props);
		const teamColours = {};
		if (props.teamColours) {
			teamColours.color = Colour(props.teamColours.text).hex();
			teamColours.backgroundColor = Colour(props.teamColours.main).hex();
			teamColours.borderColor = Colour(props.teamColours.trim1).hex();
		}

		this.state = {
			squad: _.sortBy(props.squad, s => s.number || 9999999999),
			teamColours
		};
	}

	addToPregame(val) {
		const { squad } = this.state;
		_.find(squad, p => p._id === val).inPregame = true;

		this.setState({ squad });
	}

	getInitialValues() {
		const { squad } = this.state;
		return {
			currentSquad: _.chain(squad)
				.filter("position")
				.sortBy("position")
				.map("_id")
				.value()
		};
	}

	handleSubmit(values) {
		const { game, team, setSquad } = this.props;
		setSquad(game, {
			team,
			squad: values.currentSquad
		});
	}

	renderNextPosition(currentSquad) {
		let i;
		for (i = 0; i < currentSquad.length; i++) {
			if (!currentSquad[i]) {
				break;
			}
		}
		i++;

		const position =
			_.find(playerPositions, p => p.numbers.indexOf(i) > -1) || playerPositions.I;
		return (
			<span>
				Add #{i}: {position.name}
			</span>
		);
	}

	render() {
		const { squad, teamColours } = this.state;

		return (
			<Formik
				initialValues={this.getInitialValues()}
				onSubmit={values => this.handleSubmit(values)}
				render={formikProps => {
					const { currentSquad } = formikProps.values;

					const positions = [
						"FB",
						"W",
						"C",
						"C",
						"W",
						"SO",
						"SH",
						"P",
						"H",
						"P",
						"SR",
						"SR",
						"LF"
					];

					const selectedSquadMembers = _.chain(squad)
						.filter(s => currentSquad.indexOf(s._id) > -1)
						.sortBy(s => currentSquad.indexOf(s._id))
						.value();

					const selectedSquadCount = _.max([17, selectedSquadMembers.length]);
					const selectedSquad = [];

					for (let i = 0; i < selectedSquadCount; i++) {
						//Get Position Name
						const position = positions[i] || "I";

						//Check for player
						const player = _.find(squad, s => s._id === currentSquad[i]);

						//Get Element
						selectedSquad.push(
							<div
								className="selected-squad-member card"
								key={player ? player._id : `empty-${i}`}
								style={teamColours}
							>
								<span className="position">{position}</span>
								<span>
									{player && (
										<SquadSelectorCard
											squadMember={player}
											teamColours={teamColours}
											position={i}
											formikProps={formikProps}
										/>
									)}
								</span>
							</div>
						);
					}

					const availableOptions = _.chain(squad)
						.filter("inPregame")
						.filter(s => currentSquad.indexOf(s._id) === -1)
						.map(s => (
							<SquadSelectorCard
								squadMember={s}
								key={s._id}
								teamColours={teamColours}
								formikProps={formikProps}
							/>
						))
						.value();

					const dropdownOptions = _.chain(squad)
						.reject("inPregame")
						.filter(s => currentSquad.indexOf(s._id) === -1)
						.map(p => (
							<option value={p._id} key={p._id}>
								{p.name}
							</option>
						))
						.value();

					return (
						<Form>
							<div className="squad-selector">
								<div className="selected">
									<h6>Current Squad</h6>
									{selectedSquad}
								</div>
								<div className="available">
									<h6>Available Players</h6>
									{this.renderNextPosition(currentSquad)}
									{availableOptions}
									<select
										onChange={ev => this.addToPregame(ev.target.value)}
										value={""}
									>
										<option disabled={true} value="">
											Add Extra Players
										</option>
										{dropdownOptions}
									</select>
								</div>
								<div className="buttons">
									<button
										type="button"
										onClick={() => formikProps.setValues({ currentSquad: [] })}
									>
										Clear
									</button>
									<button type="submit">Submit</button>
								</div>
							</div>
						</Form>
					);
				}}
			/>
		);
	}
}

export default connect(
	null,
	{ setSquad }
)(SquadSelector);
