//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Components
import PopUpDialog from "~/client/components/PopUpDialog";

//Constants
import gameEvents from "~/constants/gameEvents";

//Actions
import { deleteGameEvent } from "~/client/actions/gamesActions";

class AdminGameEventList extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { events, eligiblePlayers } = nextProps.game;
		const newState = {};

		newState.playerList = _.chain(eligiblePlayers)
			.map((players, team) => {
				return _.map(players, p => ({ team, ...p }));
			})
			.flatten()
			.value();

		if (events && events.length) {
			newState.events = _.orderBy(events, ["date"], ["desc"]);
		} else {
			newState.events = [];
		}

		return newState;
	}

	renderRow({ _id, event, _player, tweet_text, tweet_image, tweet_id, date }) {
		const { playerList } = this.state;
		const { onReply } = this.props;

		//Get Player
		let player;
		if (_player) {
			player = _.find(playerList, p => p._player._id == _player)._player.name.full;
		}

		//Get Tweet Image
		let image;
		if (tweet_image) {
			image = (
				<div
					key="image"
					className={`image ${this.state.visibleEventImage === _id ? "visible" : ""}`}
				>
					<img src={tweet_image} />
				</div>
			);
		}
		let replySection;
		if (tweet_id) {
			replySection = (
				<div key="reply" className="action reply" onClick={() => onReply(tweet_id)}>
					↩
				</div>
			);
		} else {
			replySection = <div className="action empty" key="no-reply" />;
		}
		return [
			replySection,
			<div
				key="delete"
				className="action delete"
				onClick={() => this.setState({ deleteEvent: _id })}
			>
				🛇
			</div>,
			<div
				key="date"
				className="date"
				onClick={() => this.setState({ visibleEventImage: _id })}
			>
				{new Date(date).toString("HH:mm:ss")}
			</div>,
			<div
				key="event-type"
				className="event-type"
				onClick={() => this.setState({ visibleEventImage: _id })}
			>
				{gameEvents[event].label}
				{player ? ` (${player})` : ""}
			</div>,
			<div
				key="tweet-text"
				className="tweet-text"
				onClick={() => this.setState({ visibleEventImage: _id })}
			>
				{tweet_text}
			</div>,
			image
		];
	}

	renderDeleteEventDialog() {
		const { events, deleteEvent } = this.state;
		const eventObject = _.find(events, e => e._id == deleteEvent);
		if (eventObject) {
			const { event, tweet_id, tweet_text, inDatabase } = eventObject;
			const header = event === "none" ? `Remove Tweet` : `Undo ${gameEvents[event].label}`;
			let subHeader;
			if (tweet_text) {
				subHeader = (
					<p>
						<em>{tweet_text}</em>
					</p>
				);
			}
			const buttons = [];

			if (inDatabase) {
				buttons.push(
					<button
						type="button"
						onClick={() => this.handleDelete(false, true)}
						className="delete"
						key="stat"
					>
						Delete Stat
					</button>
				);
			}

			if (tweet_id) {
				buttons.push(
					<button
						type="button"
						onClick={() => this.handleDelete(true, false)}
						className="delete"
						key="tweet"
					>
						Delete Tweet
					</button>
				);
			}

			if (inDatabase && tweet_id) {
				buttons.push(
					<button
						type="button"
						onClick={() => this.handleDelete(true, true)}
						className="delete"
						key="both"
					>
						Delete Both
					</button>
				);
			}

			buttons.push(
				<button
					type="button"
					key="cancel"
					onClick={() => this.setState({ deleteEvent: undefined })}
				>
					Cancel
				</button>
			);

			return (
				<PopUpDialog
					className="event-delete-dialog"
					onDestroy={() => this.setState({ deleteEvent: undefined })}
				>
					<h6>{header}</h6>
					{subHeader}
					{buttons}
				</PopUpDialog>
			);
		}
	}

	async handleDelete(deleteTweet, removeFromDb) {
		const { game, deleteGameEvent } = this.props;
		const { deleteEvent } = this.state;

		await deleteGameEvent(game._id, deleteEvent, { deleteTweet, removeFromDb });

		await this.setState({ deleteEvent: undefined });
	}

	render() {
		const { events } = this.state;

		if (events && events.length) {
			const renderedList = _.chain(events)
				.orderBy(["date"], ["desc"])
				.map(e => this.renderRow(e))
				.value();
			return (
				<div className="form-card event-list">
					{renderedList}
					{this.renderDeleteEventDialog()}
				</div>
			);
		} else {
			return null;
		}
	}
}

AdminGameEventList.propTypes = {
	game: PropTypes.object.isRequired,
	onReply: PropTypes.func.isRequired
};

AdminGameEventList.defaultProps = {};

function mapStateToProps(props) {
	return {};
}

export default connect(
	mapStateToProps,
	{ deleteGameEvent }
)(AdminGameEventList);
