//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { FieldArray } from "formik";
import { Link } from "react-router-dom";

//Components
import Table from "../../Table";

class AdminGamePregameSquadSelector extends Component {
	constructor(props) {
		super(props);

		//Table Columns
		const columns = [
			{
				key: "checkbox",
				label: "",
				sortable: false
			},
			{
				key: "number",
				label: "#"
			},
			{
				key: "first",
				label: "First Name"
			},
			{
				key: "last",
				label: "Last Name"
			}
		];

		//Eligible Players
		const { game, team } = this.props;
		const eligiblePlayers = (game.eligiblePlayers && game.eligiblePlayers[team._id]) || [];

		//Set Initial State
		this.state = {
			columns,
			eligiblePlayers
		};
	}

	renderButtons() {
		const { lastGame, localTeam, team } = this.props;
		const { eligiblePlayers } = this.state;

		//If there are no eligible players, there's no need to show any buttons
		if (eligiblePlayers.length) {
			return (
				<FieldArray>
					{({ form }) => {
						//Set a "Load Last squad" button
						let lastSquadButton;
						if (team._id == localTeam && lastGame) {
							//Check the last game has a squad for this team
							const lastSquad =
								lastGame.pregameSquads &&
								lastGame.pregameSquads.find(
									s => s._team == team._id && s.squad && s.squad.length
								);

							let squadMembers;
							if (lastSquad) {
								squadMembers = lastSquad.squad.filter(id =>
									eligiblePlayers.find(({ _player }) => _player._id == id)
								);
							}

							if (squadMembers && squadMembers.length) {
								lastSquadButton = (
									<button
										type="button"
										onClick={() => {
											form.setFieldValue(team._id, squadMembers);
										}}
									>
										Load Last Squad
									</button>
								);
							}
						}
						return (
							<div className="team-buttons">
								<button
									type="button"
									key="clear"
									onClick={() => form.setFieldValue(team._id, [])}
								>
									Clear
								</button>
								{lastSquadButton}
							</div>
						);
					}}
				</FieldArray>
			);
		}
	}

	renderTable() {
		const { team } = this.props;
		const { columns, eligiblePlayers } = this.state;

		//No need for a table if there are no players
		if (!eligiblePlayers.length) {
			return (
				<div className="form-card">
					<h6>No eligible players found</h6>
				</div>
			);
		}

		return (
			<FieldArray name={team._id}>
				{formik => {
					const footer = {
						checkbox: "✔", //This keeps the width consistent
						last: `Total: ${formik.form.values[team._id].length}`
					};

					return (
						<Table
							columns={columns}
							defaultAscSort={true}
							foot={footer}
							rows={this.renderRows(formik)}
							sortBy={{ key: "number", asc: true }}
							stickyFoot={true}
						/>
					);
				}}
			</FieldArray>
		);
	}

	renderRows({ form, push, remove }) {
		const { team } = this.props;
		const { eligiblePlayers } = this.state;

		return eligiblePlayers.map(squadMember => {
			const { _id, name } = squadMember._player;

			//Handle Click Event
			const currentIndex = form.values[team._id].indexOf(_id);
			let onClick;

			if (currentIndex === -1) {
				onClick = () => push(_id);
			} else {
				onClick = () => remove(currentIndex);
			}

			//Get row data
			const data = {
				checkbox: currentIndex > -1 ? "✔" : " ",
				number: {
					content: squadMember.number || " ",
					sortValue: squadMember.number || `${name.first} ${name.last}`
				},
				first: name.first,
				last: name.last
			};

			return { key: _id, data, onClick };
		});
	}

	render() {
		const { team } = this.props;
		return (
			<div className="pregame-squad-wrapper">
				<h2>{team.name.short}</h2>
				<Link className="edit-team-squads-link" to={`/admin/teams/${team._id}/squads/`}>
					Edit Squads
				</Link>
				{this.renderButtons()}
				{this.renderTable()}
			</div>
		);
	}
}

AdminGamePregameSquadSelector.propTypes = {
	game: PropTypes.object.isRequired,
	lastGame: PropTypes.object,
	team: PropTypes.object.isRequired
};

function mapStateToProps({ config }) {
	const { localTeam } = config;
	return { localTeam };
}

export default connect(mapStateToProps)(AdminGamePregameSquadSelector);
