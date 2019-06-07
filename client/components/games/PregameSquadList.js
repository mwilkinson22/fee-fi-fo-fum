//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import TeamImage from "~/client/components/teams/TeamImage";
import { Link } from "react-router-dom";

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
		const { date } = this.state.game;
		const dueDate = new Date(date).addDays(-2);
		dueDate.setHours(12, 0, 0, 0);
		const daysToGo = (dueDate - new Date()) / 1000 / 60 / 60 / 24;

		let text;
		if (daysToGo < 0) {
			text = "soon";
		} else if (daysToGo < 6.5) {
			text = `${dueDate.toString("dddd")} afternoon`;
		} else {
			text = dueDate.toString("dddd dS MMM");
		}

		return (
			<div className="container">
				<h2>Squads due {text}</h2>
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
				if (team._id == localTeam) {
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

				//Get Players
				const squad = _.chain(squadObject.squad)
					.map(p => {
						const { _player, number } = _.find(
							game.eligiblePlayers[team._id],
							({ _player }) => _player._id == p
						);

						return {
							id: _player._id,
							name: _player.name.full,
							number,
							slug: _player.slug,
							isNew: previousSquad && !previousSquad.find(id => id == _player._id)
						};
					})
					.sortBy(p => p.number || 99999 + p.name)
					.map(p => {
						const content = [
							<span
								key="number"
								className="number"
								style={{ color: team.colours.trim1 }}
							>
								{p.number || ""}
							</span>,
							<span
								key="name"
								className="name"
								style={{
									color: p.isNew ? team.colours.trim1 : team.colours.text
								}}
							>
								{p.name}
							</span>
						];
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
							textShadow: `0 0 2pt ${team.colours.main},-2px 2px 2pt ${
								team.colours.main
							}, 2px 2px 2pt ${team.colours.main},2px -2px 2pt ${
								team.colours.main
							},-2px -2px 2pt ${team.colours.main}`
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

		return (
			<div>
				<h2>Pregame Squads</h2>
				<div className="team-blocks">{content}</div>
			</div>
		);
	}

	render() {
		const { pregameSquads } = this.state.game;
		let content;
		if (pregameSquads.length) {
			content = this.renderSquads();
		}

		if (!content) {
			content = this.setDueDate();
		}

		return <section className="pregame-squads">{content}</section>;
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(mapStateToProps)(PregameSquadList);
