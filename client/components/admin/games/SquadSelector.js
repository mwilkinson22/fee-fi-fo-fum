//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { Formik, Form } from "formik";

//Components
import SquadSelectorCard from "./SquadSelectorCard";

//Constants
import playerPositions from "~/constants/playerPositions";

class SquadSelector extends Component {
	constructor(props) {
		super(props);

		const { currentSquad, players, team } = props;

		//Get default styling
		const { colours } = team;
		const cardStyling = {
			backgroundColor: colours.main,
			color: colours.text,
			borderColor: colours.trim1
		};

		//Set initial active position
		const activePosition = this.setNextActivePosition(currentSquad, false);

		//Get a string representation of each position by number
		//I.e. { 1: { key: "FB", name: "Fullback"} }
		const positionsByNumber = _.chain(playerPositions)
			//Create an array of [number, positionObject]
			.map(({ numbers, ...position }, key) => numbers.map(num => [num, { key, ...position }]))
			.flatten()
			//Order by squad number
			.sortBy(0)
			//Convert to object
			.fromPairs()
			.value();

		//Determine which positions need to be followed by a gap in the list
		const followWithAGap = [1, 5, 7, 10, 13];

		this.state = {
			activePosition,
			cardStyling,
			followWithAGap,
			players,
			positionsByNumber
		};
	}

	getSelectedRowCount(values) {
		const { maxInterchanges } = this.props;

		//We work out how many rows to render
		//by picking the highest of a series of values
		const potentialRowCount = [];

		//Sets a defined limit based on maxInterchanges
		if (maxInterchanges != null) {
			//If maxInterchanges is defined, then we simply add that + 13
			potentialRowCount.push(maxInterchanges + 13);
		} else {
			//When we have unlimited interchanges, we show at least 17
			potentialRowCount.push(17);

			//When we have a full squad and no interchange limit, we add an extra row
			potentialRowCount.push(_.filter(values, _.identity).length + 1);
		}

		//Ensure we have the biggest current value
		const highestCurrentPosition = _.chain(values)
			.map((player, position) => ({ player, position }))
			.filter("player")
			.map("position")
			.map(Number)
			.max()
			.value();
		potentialRowCount.push(highestCurrentPosition);

		//Return the biggest value
		return _.chain(potentialRowCount)
			.map(Number)
			.filter(_.identity)
			.max()
			.value();
	}

	setNextActivePosition(values, hasMounted = true) {
		let activePosition = false;

		//Row Count
		const rowCount = this.getSelectedRowCount(values);

		//Get Currently Active Position
		for (let i = 1; i <= rowCount; i++) {
			if (!values[i]) {
				activePosition = i;
				break;
			}
		}

		if (hasMounted) {
			this.setState({ activePosition });
		} else {
			return activePosition;
		}
	}

	assignPlayerToPosition(formik, _id, destination, source = null) {
		//First, check for an existing player in the destination.
		//If one is found, we hold onto the value to move later
		const playerToReplace = formik.values[destination];

		//Move the player in question
		formik.setFieldValue(destination, _id);

		//In cases of a "move" rather than an "add", handle source field
		if (source) {
			//If there was a player in the destination, move them to
			//the source, i.e. the second half of a "swap"
			if (playerToReplace) {
				formik.setFieldValue(source, playerToReplace);
			}
			//Otherwise simply clear the source
			else {
				formik.setFieldValue(source, "");
			}
		} else {
			//Otherwise, when it's an add, update active position
			//formik.values doesn't update on setFieldValue, so we manually pass in
			//the destination key as 'true'
			this.setNextActivePosition({ ...formik.values, [destination]: true });
		}
	}

	renderSelectedPlayers(formik) {
		const { players } = this.props;
		const { activePosition, cardStyling, positionsByNumber, followWithAGap } = this.state;
		const { values } = formik;

		const rowCount = this.getSelectedRowCount(values);

		//Render cards
		const cards = [];
		for (let i = 1; i <= rowCount; i++) {
			//Get position string. If it's not listed, it's an interchange
			const positionString = positionsByNumber[i] ? positionsByNumber[i].key : "I";

			//Get the player object
			const currentPlayerId = values[i];
			let player;
			if (currentPlayerId) {
				player = players.find(({ _player }) => _player._id == currentPlayerId);
			}

			//Get actions
			let actions;
			if (currentPlayerId) {
				actions = [
					{
						//Move Up
						onClick: () =>
							this.assignPlayerToPosition(formik, currentPlayerId, i - 1, i),
						disabled: i === 1,
						icon: "\u25B2"
					},
					{
						//Move Down
						onClick: () =>
							this.assignPlayerToPosition(formik, currentPlayerId, i + 1, i),
						disabled: i === rowCount,
						icon: "\u25BC"
					},
					{
						onClick: () => {
							formik.setFieldValue(i, "");
							this.setNextActivePosition({ ...values, [i]: "" });
						},
						icon: "\u2716"
					}
				];
			}

			cards.push(
				<SquadSelectorCard
					actions={actions}
					includePositions={false}
					isActivePosition={activePosition === i}
					key={i}
					onClick={() => this.setState({ activePosition: i })}
					player={player}
					positionString={positionString}
					style={cardStyling}
					withGap={followWithAGap.indexOf(i) > -1}
				/>
			);
		}
		return (
			<div className="selected">
				<h6>Current Squad</h6>
				{cards}
			</div>
		);
	}

	renderAvailablePlayers(formik) {
		const { activePosition, cardStyling, players, positionsByNumber } = this.state;
		const { values } = formik;

		//Render available players as cards
		let cards, dropdown, instructionString;
		if (activePosition) {
			//Get an array of selected player ids
			const selectedPlayers = _.filter(values, _.identity);

			//Use that list of IDs to get all unselected players
			const unselectedPlayers = players.filter(({ _player }) => {
				return !selectedPlayers.find(selected => {
					return selected == _player._id;
				});
			});

			//Work out if there are any unselected players in this position
			let forActivePosition = [];
			if (activePosition && activePosition < 14) {
				const positionKey = positionsByNumber[activePosition]
					? positionsByNumber[activePosition].key
					: "I";
				forActivePosition = unselectedPlayers
					//Filter by those not in dropdown
					.filter(p => !p.showInDropdown)
					//Check for any players who play this position
					.filter(({ _player }) => {
						return (
							_player.playingPositions &&
							_player.playingPositions.indexOf(positionKey) > -1
						);
					})
					//Map to ID
					.map(({ _player }) => _player._id);
			}

			//Convert to cards
			cards = _.chain(unselectedPlayers)
				.reject("showInDropdown")
				//Move forActivePosition players to the top
				//Otherwise, sort by name & number
				.sortBy([
					p => (forActivePosition.indexOf(p._player._id) > -1 ? 0 : 1),
					p => p.number || p._player.name.full
				])
				.map(p => {
					const { _id } = p._player;

					//Get click action, if there is an active position
					let onClick;
					if (activePosition) {
						onClick = () => this.assignPlayerToPosition(formik, _id, activePosition);
					}

					//Only show a gap if the player is the last in
					//the forActivePosition list
					const withGap =
						forActivePosition.length &&
						forActivePosition.indexOf(_id) === forActivePosition.length - 1;

					return (
						<SquadSelectorCard
							includePositions={true}
							key={_id}
							onClick={onClick}
							player={p}
							style={cardStyling}
							withGap={withGap}
						/>
					);
				})
				.value();

			//Create a dropdown of remaining players
			dropdown = this.renderDropdown(unselectedPlayers);

			//Give an instruction based on the active position and
			//available players
			if (!unselectedPlayers.length) {
				instructionString = "";
			} else {
				const activePositionString = positionsByNumber[activePosition]
					? positionsByNumber[activePosition].name
					: "Interchange";
				instructionString = `Add #${activePosition} - ${activePositionString}`;
			}
		} else {
			instructionString = "Select a position to add a player";
		}

		return (
			<div className="available">
				<h6>Available Players</h6>
				<div className="active-position-instruction">{instructionString}</div>
				{cards}
				{dropdown}
			</div>
		);
	}

	renderDropdown(unselectedPlayers) {
		const { players } = this.state;
		const dropdownPlayers = _.chain(unselectedPlayers)
			.filter(p => p.showInDropdown)
			.sortBy(p => p.number || p.name.full)
			.map(({ _player, number }) => {
				const name = `${number ? number + ". " : ""}${_player.name.full}`;
				return (
					<option key={_player._id} value={_player._id}>
						{name}
					</option>
				);
			})
			.value();

		if (dropdownPlayers.length) {
			const onChange = ev => {
				const playerId = ev.target.value;
				players.find(({ _player }) => _player._id == playerId).showInDropdown = false;
				this.setState({ players });
			};
			return (
				<select value="header" onChange={onChange}>
					<option value="header" disabled={true}>
						Add Extra Players
					</option>
					{dropdownPlayers}
				</select>
			);
		}
	}

	validate(values) {
		const { maxInterchanges, requireFullTeam } = this.props;
		let errors = {};

		if (requireFullTeam) {
			const requiredPlayerCount = 13 + maxInterchanges;
			for (let i = 1; i <= requiredPlayerCount; i++) {
				if (!values[i]) {
					errors[i] = `Position #${i} is required`;
				}
			}
		}
		return errors;
	}

	render() {
		const { onSubmit } = this.props;

		return (
			<Formik
				initialValues={this.props.currentSquad}
				onSubmit={onSubmit}
				validate={values => this.validate(values)}
				render={formik => (
					<Form>
						<div className="squad-selector">
							{this.renderSelectedPlayers(formik)}
							{this.renderAvailablePlayers(formik)}
						</div>
						<div className="buttons">
							<button type="reset">Reset Squad</button>
							<button type="submit" className="confirm" disabled={!formik.isValid}>
								Update Squad
							</button>
						</div>
					</Form>
				)}
			/>
		);
	}
}

SquadSelector.propTypes = {
	currentSquad: PropTypes.object.isRequired,
	onSubmit: PropTypes.func.isRequired,
	maxInterchanges: PropTypes.number,
	players: PropTypes.arrayOf(
		PropTypes.shape({
			_player: PropTypes.object.isRequired,
			number: PropTypes.number,
			showInDropdown: PropTypes.bool.isRequired
		})
	).isRequired,
	requireFullTeam: PropTypes.bool,
	team: PropTypes.object.isRequired
};

SquadSelector.defaultprops = {
	maxInterchanges: 4
};

export default SquadSelector;
