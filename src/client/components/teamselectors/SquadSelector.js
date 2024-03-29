//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { Formik, Form } from "formik";
import Select from "react-select";

//Components
import SquadSelectorCard from "./SquadSelectorCard";
import PopUpDialog from "../PopUpDialog";

//Constants
import playerPositions from "~/constants/playerPositions";
import selectStyling from "~/constants/selectStyling";
import { getOrdinalNumber } from "~/helpers/genericHelper";

class SquadSelector extends Component {
	constructor(props) {
		super(props);

		const { currentSquad, players, team } = props;

		//Create ref for card wrapper
		this.cardWrapper = React.createRef();

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

		if (props.maxInterchanges && props.usesExtraInterchange) {
			followWithAGap.push(13 + props.maxInterchanges);
		}

		this.state = {
			activePosition,
			cardStyling,
			followWithAGap,
			players,
			positionsByNumber,
			nameFilter: "",
			highlightedAvailablePlayerIndex: -1
		};
	}

	getSelectedRowCount(values) {
		const { maxInterchanges, usesExtraInterchange } = this.props;

		//We work out how many rows to render
		//by picking the highest of a series of values
		const potentialRowCount = [];

		//Sets a defined limit based on maxInterchanges
		if (maxInterchanges != null) {
			//If maxInterchanges is defined, then we simply add that + 13
			let numToAdd = maxInterchanges + 13;
			if (usesExtraInterchange) {
				numToAdd++;
			}
			potentialRowCount.push(numToAdd);
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
		let currentActivePosition = false;
		if (hasMounted && this.state) {
			currentActivePosition = this.state.activePosition;
		}

		let activePosition = false;

		//Row Count
		const rowCount = this.getSelectedRowCount(values);

		if (currentActivePosition != false) {
			// Start a loop after the current position
			for (let i = currentActivePosition; i <= rowCount; i++) {
				if (!values[i]) {
					activePosition = i;
					break;
				}
			}
		}

		// If we don't find anything, go back to the start
		if (activePosition === false) {
			for (let i = 1; i <= rowCount; i++) {
				if (!values[i]) {
					activePosition = i;
					break;
				}
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

		//Clear out the name filter
		this.setState({ nameFilter: "", highlightedAvailablePlayerIndex: -1 });

		//Scroll card wrapper to top
		this.cardWrapper.current.scrollTop = 0;
	}

	renderSelectedPlayers(formik) {
		const { players, readOnly } = this.props;
		const { activePosition, cardStyling, positionsByNumber, followWithAGap } = this.state;
		const { values } = formik;

		const rowCount = this.getSelectedRowCount(values);

		//Render cards
		const cards = [];
		for (let i = 1; i <= rowCount; i++) {
			//Get position string. If it's not listed, it's an interchange
			let positionString = positionsByNumber[i] ? positionsByNumber[i].key : "I";

			if (this.numberIsExtraInterchange(i)) {
				positionString = (
					<span>
						{i}
						<sup>{getOrdinalNumber(i, true).toUpperCase()}</sup>
					</span>
				);
			}

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
						onClick: () => this.assignPlayerToPosition(formik, currentPlayerId, i - 1, i),
						disabled: i === 1,
						icon: "\u25B2"
					},
					{
						//Move Down
						onClick: () => this.assignPlayerToPosition(formik, currentPlayerId, i + 1, i),
						disabled: i === rowCount,
						icon: "\u25BC"
					},
					{
						//Move
						onClick: () => this.setState({ playerToMove: i }),
						icon: "\u2B0D"
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
					readOnly={readOnly}
					style={cardStyling}
					withGap={followWithAGap.indexOf(i) > -1}
				/>
			);
		}

		let title;
		if (!readOnly) {
			title = <h6>Current squad</h6>;
		}

		return (
			<div className="selected">
				{title}
				{cards}
			</div>
		);
	}

	renderSecondColumn(formik) {
		const { customSecondColumn, readOnly } = this.props;

		if (customSecondColumn) {
			return customSecondColumn;
		} else if (!readOnly) {
			return this.renderAvailablePlayers(formik);
		}
	}

	renderAvailablePlayers(formik) {
		const {
			activePosition,
			cardStyling,
			highlightedAvailablePlayerIndex,
			interchangeFilter,
			players,
			positionsByNumber,
			nameFilter
		} = this.state;
		const { values } = formik;

		//Render available players as cards
		let cards, dropdown, instructionString, searchInput;
		if (activePosition) {
			//Get an array of selected player ids
			const selectedPlayers = _.filter(values, _.identity);

			//Use that list of IDs to get all unselected players
			let unselectedPlayers = players.filter(({ _player }) => {
				return !selectedPlayers.find(selected => {
					return selected == _player._id;
				});
			});

			//If we have a name filter, add that here
			if (nameFilter.length) {
				const processName = str => str.toLowerCase().replace(/[^a-z]/gi, "");
				unselectedPlayers = unselectedPlayers.filter(({ _player }) =>
					processName(_player.name.full).includes(processName(nameFilter))
				);
			}

			let unselectedAndNotInDropdown = unselectedPlayers.filter(p => !p.showInDropdown);

			//Work out if there are any unselected players in this position
			let forActivePosition = [];
			if (activePosition) {
				const positionKey =
					activePosition <= 13 ? positionsByNumber[activePosition].key : interchangeFilter || "I";

				forActivePosition = unselectedAndNotInDropdown
					//Check for any players who play this position
					.filter(({ _player }) => {
						return _player.playingPositions && _player.playingPositions.indexOf(positionKey) > -1;
					})
					//Map to ID
					.map(({ _player }) => _player._id);
			}

			//Move forActivePosition players to the top
			//Otherwise, sort by name & number
			unselectedAndNotInDropdown = _.sortBy(unselectedAndNotInDropdown, [
				p => (forActivePosition.indexOf(p._player._id) > -1 ? 0 : 1),
				p => p.number || p._player.name.full
			]);

			//Create a name filter
			searchInput = (
				<input
					onChange={ev => {
						const nameFilter = ev.target.value;
						this.setState({ nameFilter, highlightedAvailablePlayerIndex: nameFilter ? 0 : -1 });
					}}
					onKeyDown={ev => {
						switch (ev.key) {
							case "ArrowUp": {
								if (highlightedAvailablePlayerIndex) {
									this.setState({
										highlightedAvailablePlayerIndex: highlightedAvailablePlayerIndex - 1
									});
								}
								ev.preventDefault();
								break;
							}
							case "ArrowDown": {
								if (highlightedAvailablePlayerIndex < unselectedAndNotInDropdown.length - 1) {
									this.setState({
										highlightedAvailablePlayerIndex: highlightedAvailablePlayerIndex + 1
									});
								}
								ev.preventDefault();
								break;
							}
							case "Enter": {
								if (highlightedAvailablePlayerIndex > -1) {
									this.assignPlayerToPosition(
										formik,
										unselectedAndNotInDropdown[highlightedAvailablePlayerIndex]._player._id,
										activePosition
									);
								}
								ev.preventDefault();
							}
						}
					}}
					placeholder="Search"
					value={nameFilter}
				/>
			);

			//Convert to cards
			cards = unselectedAndNotInDropdown.map((p, i) => {
				const { _id } = p._player;
				//Only show a gap if the player is the last in
				//the forActivePosition list
				const withGap = forActivePosition.length > 0 && i === forActivePosition.length - 1;

				return (
					<SquadSelectorCard
						isHighlighted={i === highlightedAvailablePlayerIndex}
						includePositions={true}
						key={_id}
						onClick={() => this.assignPlayerToPosition(formik, _id, activePosition)}
						player={p}
						style={cardStyling}
						withGap={withGap}
					/>
				);
			});

			//Create a dropdown of remaining players
			dropdown = this.renderDropdown(unselectedPlayers);

			//Give an instruction based on the active position and
			//available players
			if (!unselectedPlayers.length) {
				instructionString = "";
			} else {
				let activePositionString = positionsByNumber[activePosition]
					? positionsByNumber[activePosition].name
					: "Interchange";
				if (this.numberIsExtraInterchange(activePosition)) {
					activePositionString = `Extra Interchange (${getOrdinalNumber(activePosition)} Player)`;
				}
				//Conditionally add left/right
				if ([2, 3, 8, 11].includes(activePosition)) {
					activePositionString = "Right " + activePositionString;
				} else if ([4, 5, 10, 12].includes(activePosition)) {
					activePositionString = "Left " + activePositionString;
				}
				instructionString = `Add #${activePosition} - ${activePositionString}`;
			}
		} else {
			instructionString = "Select a position to add a player";
		}

		//Add positional filter for interchanges
		let interchangeFilterDropdown;
		if (activePosition > 13) {
			const options = _.map(playerPositions, ({ name }, value) => ({
				label: name,
				value
			})).filter(({ value }) => value !== "I");

			interchangeFilterDropdown = (
				<Select
					onChange={opt => this.setState({ interchangeFilter: opt && opt.value })}
					isClearable={true}
					isSearchable={false}
					options={options}
					placeholder="Filter By..."
					styles={selectStyling}
					value={options.find(({ value }) => value == interchangeFilter)}
				/>
			);
		}

		return (
			<div className="available">
				<h6>Available Players</h6>
				<div className="active-position-instruction">
					{instructionString}
					{searchInput}
					{interchangeFilterDropdown}
				</div>
				<div className="cards-wrapper" ref={this.cardWrapper}>
					<div className={`cards ${highlightedAvailablePlayerIndex > -1 ? "with-highlight" : ""}`}>
						{cards}
					</div>
				</div>
				{dropdown}
			</div>
		);
	}

	numberIsExtraInterchange(num) {
		const { maxInterchanges, usesExtraInterchange } = this.props;
		return maxInterchanges && usesExtraInterchange && num === 13 + maxInterchanges + 1;
	}

	renderDropdown(unselectedPlayers) {
		const { players } = this.state;
		const dropdownPlayers = _.chain(unselectedPlayers)
			.filter(p => p.showInDropdown)
			.sortBy(({ _player, number }) => number || _player.name.full)
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
		const { maxInterchanges, requireFullTeam, usesExtraInterchange } = this.props;
		let errors = {};

		if (requireFullTeam) {
			let requiredPlayerCount = 13 + maxInterchanges;
			if (maxInterchanges && usesExtraInterchange) {
				requiredPlayerCount++;
			}
			for (let i = 1; i <= requiredPlayerCount; i++) {
				if (!values[i]) {
					errors[i] = `Position #${i} is required`;
				}
			}
		}
		return errors;
	}

	renderMoveDialog(formik) {
		const { cardStyling, players, playerToMove, positionsByNumber } = this.state;
		if (playerToMove) {
			//Get Player's Name
			const { _player } = players.find(({ _player }) => _player._id == formik.values[playerToMove]);

			//Render List
			const rowCount = this.getSelectedRowCount(formik.values);
			const list = [];
			for (let i = 1; i <= rowCount; i++) {
				if (i !== playerToMove) {
					list.push(
						<SquadSelectorCard
							includePositions={false}
							key={i}
							onClick={() => {
								this.assignPlayerToPosition(formik, _player._id, i, playerToMove);
								onDestroy();
							}}
							player={players.find(({ _player }) => _player._id == formik.values[i])}
							positionString={positionsByNumber[i] ? positionsByNumber[i].key : "I"}
							style={cardStyling}
						/>
					);
				}
			}

			//Get Destroy Callback
			const onDestroy = () => this.setState({ playerToMove: undefined, playerMoveDestination: undefined });

			return (
				<PopUpDialog className="player-move-dialog" closeButtonText="Cancel" onDestroy={onDestroy}>
					<h6>Move {_player.name.full} to:</h6>
					{list}
				</PopUpDialog>
			);
		}
	}

	renderButtons(disableButtons) {
		const { readOnly, submitText } = this.props;
		if (!readOnly) {
			return (
				<div className="buttons">
					<button type="reset">Reset Squad</button>
					<button type="submit" className="confirm" disabled={disableButtons}>
						{submitText}
					</button>
				</div>
			);
		}
	}

	render() {
		const { customValidation, onSubmit } = this.props;

		return (
			<Formik
				initialValues={this.props.currentSquad}
				onSubmit={onSubmit}
				validate={values => this.validate(values)}
			>
				{formik => {
					let disableButtons;
					if (customValidation) {
						disableButtons = Object.keys(this.validate(formik.values)).length > 0;
					} else {
						disableButtons = !formik.isValid;
					}
					return (
						<Form>
							<div className={`squad-selector`}>
								{this.renderMoveDialog(formik)}
								{this.renderSelectedPlayers(formik)}
								{this.renderSecondColumn(formik)}
							</div>
							{this.renderButtons(disableButtons)}
						</Form>
					);
				}}
			</Formik>
		);
	}
}

SquadSelector.propTypes = {
	currentSquad: PropTypes.object.isRequired,
	customSecondColumn: PropTypes.node,
	customValidation: PropTypes.bool,
	onSubmit: PropTypes.func.isRequired,
	maxInterchanges: PropTypes.number,
	players: PropTypes.arrayOf(
		PropTypes.shape({
			_player: PropTypes.object.isRequired,
			number: PropTypes.number,
			showInDropdown: PropTypes.bool.isRequired
		})
	).isRequired,
	readOnly: PropTypes.bool,
	requireFullTeam: PropTypes.bool,
	submitText: PropTypes.string,
	team: PropTypes.object.isRequired,
	usesExtraInterchange: PropTypes.bool
};

SquadSelector.defaultProps = {
	customValidation: false,
	maxInterchanges: 4,
	readOnly: false,
	submitText: "Update Squad",
	usesExtraInterchange: false
};

export default SquadSelector;
