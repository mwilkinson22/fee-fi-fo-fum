//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import TeamImage from "~/client/components/teams/TeamImage";
import { Link } from "react-router-dom";

//Helpers
import { getDateString } from "~/helpers/gameHelper";

class PregameSquadList extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { game, previousGame } = nextProps;
		return { game, previousGame };
	}

	setDueDate() {
		const { game } = this.state;

		//Create due date - 2 days before kick off
		const dueDate = new Date(game.date).addDays(-2);

		//Get string
		const dateStringObject = getDateString(dueDate);
		const dateString = dateStringObject.status === "past" ? "soon" : dateStringObject.string;

		return (
			<div className="container">
				<h2 className="squads-due-message">Squads due {dateString}</h2>
			</div>
		);
	}

	renderSquads() {
		const { game, previousGame } = this.state;
		const { localTeam, fullTeams } = this.props;
		let teams = [fullTeams[localTeam], game._opposition];
		if (game.isAway) {
			teams = teams.reverse();
		}
		const content = _.chain(teams)
			.map(team => {
				//Get Team Squad Object
				const squadObject = game.pregameSquads.find(({ _team }) => _team == team._id);
				if (!squadObject || !squadObject.squad || !squadObject.squad.length) {
					return null;
				}

				//Get Previous Games squad
				let previousSquad;
				if (team._id == localTeam && previousGame) {
					const previousSquadObject = previousGame.pregameSquads.find(
						({ _team }) => _team == team._id
					);
					if (
						previousSquadObject &&
						previousSquadObject.squad &&
						previousSquadObject.squad.length
					) {
						previousSquad = previousSquadObject.squad;
					}
				}

				//If at least one player has a squad number, we set this to true
				let includeNumbers = false;

				//Get Players
				const squad = _.chain(squadObject.squad)
					.map(p => {
						const { _player, number } = _.find(
							game.eligiblePlayers[team._id],
							({ _player }) => _player._id == p
						);

						if (number) {
							includeNumbers = true;
						}

						return {
							id: _player._id,
							name: `${_player.name.first} ${_player.name.last}`,
							number,
							slug: _player.slug,
							isNew: previousSquad && !previousSquad.find(id => id == _player._id)
						};
					})
					.sortBy(p => p.number || 99999 + p.name)
					.map(p => {
						const content = [];
						if (includeNumbers) {
							content.push(
								<span
									key="number"
									className="number"
									style={{ color: team.colours.trim1 }}
								>
									{p.number || ""}
								</span>
							);
						}
						content.push(
							<span
								key="name"
								className="name"
								style={{
									color: p.isNew ? team.colours.trim1 : team.colours.text
								}}
							>
								{p.name}
							</span>
						);

						const props = { key: p.id, className: "player" };
						if (team._id == localTeam && p.slug) {
							return (
								<Link {...props} to={`/players/${p.slug}`}>
									{content}
								</Link>
							);
						} else {
							return <div {...props}>{content}</div>;
						}
					})
					.value();

				return (
					<div
						className="team-block"
						key={team._id}
						style={{
							backgroundColor: team.colours.main,
							textShadow: `0 0 2pt ${team.colours.main},-2px 2px 2pt ${team.colours.main}, 2px 2px 2pt ${team.colours.main},2px -2px 2pt ${team.colours.main},-2px -2px 2pt ${team.colours.main}`
						}}
					>
						<TeamImage team={team} />
						{squad}
					</div>
				);
			})
			.filter(_.identity)
			.value();

		if (content.length == 0) {
			return null;
		}

		return <div className="team-blocks">{content}</div>;
	}

	render() {
		const { pregameSquads } = this.state.game;
		let content;
		let squadsFound = false;

		if (pregameSquads.length) {
			content = this.renderSquads();
			squadsFound = true;
		}

		if (!content) {
			content = this.setDueDate();
		}

		return (
			<section className={`pregame-squads ${squadsFound ? "with-squads" : ""}`}>
				{content}
			</section>
		);
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(mapStateToProps)(PregameSquadList);
