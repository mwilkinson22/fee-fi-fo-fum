//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import Colour from "color";

//Components
import TeamImage from "~/client/components/teams/TeamImage";
import { Link } from "react-router-dom";
import PersonImage from "~/client/components/people/PersonImage";

//Helpers
import { getGameStarStats } from "~/helpers/gameHelper";

//Constants
import coachTypes from "~/constants/coachTypes";

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
					const player = {
						_player,
						number,
						position
					};

					//Create Component
					row.push(this.renderPlayer(player, team));

					//Handle Rows
					const rowIndex = newRowPositions.indexOf(position);
					if (rowIndex > -1 || position == squad.length) {
						const order = position == squad.length ? 999 : rowIndex + 1;
						rows.push(
							<div
								className={`row ${position < 13 ? "main" : "extra"}`}
								key={order}
								style={{ order }}
							>
								{row}
							</div>
						);
						row = [];
						if (position == 13) {
							row.push(
								<div
									className="header"
									key="ih"
									style={{ color: team.colours.text }}
								>
									Interchanges
								</div>
							);
						}
					}
				});

				if (!squad.length) {
					return null;
				} else {
					let backgroundColor = team.colours.main;
					if (team._id == localTeam) {
						backgroundColor = Colour(backgroundColor).darken(0.3);
					}
					return (
						<div className="team-block" key={team._id} style={{ backgroundColor }}>
							<TeamImage team={team} />
							{rows}
							{this.renderCoaches(team)}
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

	renderPlayer(player, team) {
		const { _player, position } = player;
		const { _id, slug } = _player;
		const { localTeam } = this.props;
		const { game } = this.state;

		//Get Image
		let image;
		if (position > 13) {
			image = null;
		} else if (team._id != localTeam) {
			image = (
				<div className="image" key={_id}>
					<TeamImage team={team} size="medium" />
				</div>
			);
		} else {
			image = (
				<div className="image" key={_id}>
					<PersonImage person={_player} variant="player" size="small" />
				</div>
			);
		}

		//Render Item
		const props = {
			key: _id,
			className: `person-wrapper player ${position <= 13 ? "starting" : "interchange"}`,
			style: {
				background: "transparent",
				color: team.colours.text
			}
		};

		const content = [image, this.renderNameBar(_player.name.last, player.number, team)];

		//Add GameStar stats
		if (!game._competition.instance.scoreOnly && game.status === 3) {
			const gameStarStats = getGameStarStats(game, _player, {
				T: 1,
				G: 1,
				DG: 1,
				TA: 1,
				TK: 25
			});
			if (gameStarStats.length) {
				const statList = gameStarStats.map(({ key, label, value }) => {
					return [
						<span className="value" key={`${key}-value`}>
							{value}&nbsp;
						</span>,
						<span className="label" key={`${key}-label`}>
							{label}
						</span>
					];
				});
				content.push(
					<div key="stats" className="stats-box">
						{statList}
					</div>
				);
			}
		}

		if (team._id == localTeam && slug) {
			return (
				<Link {...props} to={`/players/${slug}`}>
					{content}
				</Link>
			);
		} else {
			return <div {...props}>{content}</div>;
		}
	}

	renderCoaches(team) {
		const { localTeam } = this.props;
		const { coaches } = this.state.game;

		if (coaches[team._id].length) {
			const list = coaches[team._id].map(c => {
				const { name } = c._person;
				const role = coachTypes.find(({ key }) => key == c.role).name;
				const content = (
					<div className="person-wrapper">
						{this.renderNameBar(`${name.first} ${name.last}`, role, team)}
					</div>
				);
				const props = {
					key: c._person._id,
					className: `person-wrapper coach`,
					style: {
						background: "transparent",
						color: team.colours.text
					}
				};
				if (team._id == localTeam) {
					return (
						<Link to={`/coaches/${c._person.slug}`} {...props}>
							{content}
						</Link>
					);
				} else {
					return <div {...props}>{content}</div>;
				}
			});

			return (
				<div className="row extra" style={{ order: 1000 }}>
					<div className="header" style={{ color: team.colours.text }}>
						Coaches
					</div>
					{list}
				</div>
			);
		}
	}

	renderNameBar(name, role, team) {
		const { localTeam } = this.props;

		//Styling
		const border = team._id != localTeam && `1pt ${team.colours.text} solid`;
		let nameStyle, numberStyle;
		if (team._id == localTeam) {
			nameStyle = {
				background: team.colours.text,
				border: `solid 1pt ${team.colours.text}`,
				color: team.colours.main
			};
			numberStyle = {
				background: team.colours.main,
				border: `solid 1pt ${team.colours.main}`,
				color: team.colours.trim1
			};
		} else {
			nameStyle = {
				background: team.colours.main,
				color: team.colours.text
			};
			numberStyle = {
				background: team.colours.text,
				color: team.colours.main
			};
		}

		return (
			<div
				className={`name-bar ${border ? "with-border" : "no-border"}`}
				key="name-bar"
				style={{ border }}
			>
				<div className="number" style={numberStyle}>
					{role || ""}
				</div>
				<div className="name" style={nameStyle}>
					{name}
				</div>
			</div>
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
