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
	getSquadList(id, previousGame = false) {
		const { game, localTeam } = this.props;

		//Only get pregame for local team
		if (previousGame && id != localTeam) {
			return false;
		}

		//Get the correct game
		if (previousGame) {
			//Don't bother with opposition
			if (id != localTeam) {
				return false;
			}

			return game.previousPregameSquad;
		} else {
			if (!game.pregameSquads) {
				return false;
			}

			//Grab squads
			const squadObject = game.pregameSquads.find(({ _team }) => _team == id);
			if (squadObject && squadObject.squad && squadObject.squad.length) {
				return squadObject.squad;
			} else {
				return false;
			}
		}
	}

	renderDueDate(singleTeam) {
		const { fullTeams, localTeam, game } = this.props;

		//Create due date - 2 days before kick off
		const dueDate = new Date(game.date).addDays(-2);

		//Get time as string
		const dateStringObject = getDateString(dueDate);
		const dateString = dateStringObject.status === "past" ? "soon" : dateStringObject.string;

		//Create full string
		let str;
		if (singleTeam) {
			const teamObject = singleTeam == localTeam ? fullTeams[localTeam] : game._opposition;
			str = `${teamObject.name.short} squad due ${dateString}`;
		} else {
			str = `Squads due ${dateString}`;
		}

		return (
			<div className="container" key="due-date">
				<h2 className="squads-due-message">{str}</h2>
			</div>
		);
	}

	renderSquads() {
		const { localTeam, fullTeams, game } = this.props;
		let teams = [fullTeams[localTeam], game._opposition];
		if (game.isAway) {
			teams = teams.reverse();
		}
		const teamsWithSquads = teams.filter(team => this.getSquadList(team._id));

		if (!teamsWithSquads.length) {
			return null;
		}

		const content = teamsWithSquads.map(team => {
			//Get Team Squad Object
			const squadObject = game.pregameSquads.find(({ _team }) => _team == team._id);

			//Get Previous Games squad
			let previousSquad = this.getSquadList(team._id, true);

			//If at least one player has a squad number, we set this to true
			let includeNumbers = false;

			//Get Players
			const squad = _.chain(squadObject.squad)
				.map(p => {
					const { _id, name, number, slug } = _.find(
						game.eligiblePlayers[team._id],
						({ _id }) => _id == p
					);

					if (number) {
						includeNumbers = true;
					}

					return {
						id: _id,
						name: `${name.first} ${name.last}`,
						number,
						slug: slug,
						isNew: previousSquad && !previousSquad.find(id => id == _id)
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
					className={`team-block ${teamsWithSquads.length === 1 ? "single-block" : ""}`}
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
		});

		return (
			<div className="team-blocks" key="team-blocks">
				{content}
			</div>
		);
	}

	render() {
		const { localTeam, game } = this.props;
		const content = [];

		//Bool to affect section classname
		let squadsFound = false;

		const teams = [localTeam, game._opposition._id];
		const teamsHavePregameSquads = _.chain(teams)
			.map(_team => {
				return { _team, hasSquad: Boolean(this.getSquadList(_team)) };
			})
			.groupBy("hasSquad")
			.mapValues(o => _.map(o, "_team"))
			.value();

		//If any teams are missing squads and we have a confirmed date,
		//render a due date section
		if (!game.dateRange && teamsHavePregameSquads.false) {
			const singleTeam =
				teamsHavePregameSquads.false.length == 1 ? teamsHavePregameSquads.false[0] : null;
			content.push(this.renderDueDate(singleTeam));
		}

		//If any teams do have squads, add them after
		if (teamsHavePregameSquads.true) {
			content.push(this.renderSquads());
			squadsFound = true;
		}

		if (content.length) {
			return (
				<section className={`pregame-squads ${squadsFound ? "with-squads" : ""}`}>
					{content}
				</section>
			);
		} else {
			return null;
		}
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(mapStateToProps)(PregameSquadList);
