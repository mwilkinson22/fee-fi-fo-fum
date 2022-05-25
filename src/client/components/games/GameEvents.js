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
		this.events = ["T", "CN", "PK", "DG", "YC", "RC"];
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
		const { localTeam, includeDetails } = this.props;
		const { game } = this.state;

		const elements = [];

		//Add Events
		events.forEach(({ event, stats }) => {
			elements.push(
				<div key={event} className="event-label">
					<h6>{playerStatTypes[event].plural}</h6>
				</div>
			);
			elements.push(
				_.map(game.teams, team => {
					const players = stats[team._id] || [];
					const playerElements = _.chain(players)
						.map(({ _player, total }) => {
							const { name, slug, number } = _.find(
								game.eligiblePlayers[team._id],
								p => p._id == _player
							);
							return {
								id: _player,
								name: name.full,
								slug: slug,
								number: number,
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

		// Add Details
		if (includeDetails) {
			const details = {};
			if (game.attendance) {
				details.Attendance = game.attendance.toLocaleString();
			}
			if (game._referee) {
				details.Referee = game._referee.name.full;
			}
			if (game._video_referee) {
				details.Referee = game._video_referee.name.full;
			}
			if (game._potm) {
				let potm = _.flatten(Object.values(game.eligiblePlayers)).find(p => p._id == game._potm);
				if (potm) {
					const potmLabel = game.customPotmTitle
						? game.customPotmTitle.label
						: `${game.genderedString} of the Match`;
					details[potmLabel] = potm.name.full;
				}
			}
			if (Object.values(details).length) {
				const detailRows = [];
				for (const key in details) {
					detailRows.push(
						<div key={key}>
							<h6>{key}</h6>
							{details[key]}
						</div>
					);
				}
				elements.push(
					<div key="details" className="details">
						{detailRows}
					</div>
				);
			}
		}

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
	game: PropTypes.object.isRequired,
	includeDetails: PropTypes.bool
};

GameEvents.defaultProps = {
	includeDetails: false
};

function mapStateToProps({ config }) {
	const { localTeam } = config;
	return { localTeam };
}

export default connect(mapStateToProps)(GameEvents);
