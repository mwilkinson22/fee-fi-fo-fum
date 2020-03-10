//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { connect } from "react-redux";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

class GameEvents extends Component {
	constructor(props) {
		super(props);
		this.events = ["T", "CN", "PK", "DG"];
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { game } = nextProps;
		return { game };
	}

	getEvents() {
		const { playerStats } = this.state.game;
		const results = [];

		this.events.forEach(event => {
			const players = playerStats.filter(p => p.stats[event] > 0);
			if (players.length) {
				const objects = players.map(p => {
					const { _team, _player, stats } = p;
					const total = stats[event];
					return { _team, _player, total };
				});
				results.push({ event, stats: _.groupBy(objects, "_team") });
			}
		});

		return results;
	}

	renderEvents(events) {
		const { localTeam, fullTeams } = this.props;
		const { game } = this.state;
		let teams = [fullTeams[localTeam], game._opposition];
		if (game.isAway) {
			teams = teams.reverse();
		}
		const elements = [];

		//Add Events
		events.forEach(({ event, stats }) => {
			elements.push(
				<div key={event} className="event-label">
					<h6>{playerStatTypes[event].plural}</h6>
				</div>
			);
			elements.push(
				_.map(teams, team => {
					const players = stats[team._id] || [];
					const playerElements = _.chain(players)
						.map(({ _player, total }) => {
							const p = _.find(
								game.eligiblePlayers[team._id],
								p => p._player._id == _player
							);
							return {
								id: _player,
								name: p._player.name.full,
								slug: p._player.slug,
								number: p.number,
								total
							};
						})
						.sortBy(p => p.number || 999)
						.map(({ id, name, slug, number, total }) => {
							//Create String
							let string = "";
							if (number) {
								string += `${number}. `;
							}
							string += name;
							if (total > 1) {
								string += ` (${total})`;
							}

							//Render Key
							const key = event + id;
							if (team._id == localTeam && slug) {
								return (
									<Link to={`/players/${slug}`} key={key}>
										{string}
									</Link>
								);
							} else {
								return <span key={key}>{string}</span>;
							}
						})
						.value();
					return (
						<div key={event + team._id} className="scorers">
							{playerElements}
						</div>
					);
				})
			);
		});

		return (
			<div className="game-events-wrapper">
				<div className="events">{elements}</div>
			</div>
		);
	}

	render() {
		const events = this.getEvents();
		if (events.length) {
			return this.renderEvents(events);
		} else {
			return null;
		}
	}
}

GameEvents.propTypes = {
	game: PropTypes.object.isRequired
};

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(mapStateToProps)(GameEvents);
