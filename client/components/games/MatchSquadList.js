//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import TeamImage from "~/client/components/teams/TeamImage";
import { Link } from "react-router-dom";

class MatchSquadList extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { game } = nextProps;
		return { game };
	}

	renderTeamBlocks() {
		const { game } = this.state;
		const { localTeam, fullTeams } = this.props;
		let teams = [fullTeams[localTeam], game._opposition];
		if (game.isAway) {
			teams = teams.reverse();
		}
		const newRowPositions = [1, 5, 7, 13, 12, 10];
		const content = _.chain(teams)
			.map(team => {
				//Get Team Squad Object
				const squad = _.chain(game.playerStats)
					.filter(({ _team }) => _team == team._id)
					.sortBy("position")
					.value();

				//Create rows
				const rows = [];
				let row = [];
				squad.forEach(p => {
					//Get Player Data
					const { _player, number } = _.find(
						game.eligiblePlayers[team._id],
						({ _player }) => _player._id == p._player
					);
					const { position } = p;
					const { id, name, image, slug } = _player;
					const player = {
						id,
						name,
						number,
						image,
						position,
						slug
					};

					//Create Component
					row.push(this.renderPlayer(player));

					//Handle Rows
					const rowIndex = newRowPositions.indexOf(position);
					if (rowIndex > -1 || position == squad.length) {
						const order = position == squad.length ? 999 : rowIndex + 1;
						rows.push(
							<div className="row" key={order} style={{ order }}>
								{row}
							</div>
						);
						row = [];
					}
				});

				if (!squad.length) {
					return null;
				} else {
					return (
						<div
							className="team-block"
							key={team._id}
							style={{
								backgroundColor: team.colours.main,
								textShadow: `0 0 2pt ${team.colours.main},-2px 2px 2pt ${
									team.colours.main
								}, 2px 2px 2pt ${team.colours.main},2px -2px 2pt ${
									team.colours.main
								},-2px -2px 2pt ${team.colours.main}`
							}}
						>
							<TeamImage team={team} />
							{rows}
						</div>
					);
				}
			})
			.filter(_.identity)
			.value();

		if (content.length == 0) {
			return null;
		}

		return <div className="team-blocks">{content}</div>;
	}

	renderPlayer(player) {
		const { name, id, position } = player;
		return (
			<span key={id} className={player`${position <= 13 ? "starting" : "interchange"}`}>
				{name.full}
			</span>
		);
	}

	render() {
		const teamBlocks = this.renderTeamBlocks();
		if (!teamBlocks) {
			return null;
		} else {
			return <section className="match-squads">{teamBlocks}</section>;
		}
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(mapStateToProps)(MatchSquadList);
