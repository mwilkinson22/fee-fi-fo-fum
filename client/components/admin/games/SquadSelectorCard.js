import React, { Component } from "react";
import PropTypes from "prop-types";

class SquadSelectorCard extends Component {
	constructor(props) {
		super(props);
		this.state = { showMoveMenu: false };
	}

	handleClick(target) {
		const { position } = this.props;
		const { showMoveMenu } = this.state;
		if (position === undefined) {
			this.handleAction("add");
		} else if (target.className.indexOf("action") === -1) {
			this.setState({ showMoveMenu: !showMoveMenu });
		}
	}

	handleAction(action, ev) {
		const { squadMember, formikProps } = this.props;
		const { _id: id } = squadMember;
		const { currentSquad } = formikProps.values;
		if (ev) {
			ev.preventDefault();
		}
		let index;
		switch (action) {
			case "add":
				index = currentSquad.indexOf(null);
				if (index === -1) {
					currentSquad.push(id);
				} else {
					currentSquad[index] = id;
				}
				break;
			case "move-up":
			case "move-down":
				index = currentSquad.indexOf(id);
				currentSquad.splice(index, 1);
				currentSquad.splice(action === "move-up" ? --index : ++index, 0, id);
				break;
			case "delete":
				index = currentSquad.indexOf(id);
				currentSquad[index] = null;
				break;
		}

		formikProps.setValues({
			currentSquad
		});
	}

	renderBottomBar() {
		const { squadMember, position, teamColours } = this.props;
		const { showMoveMenu } = this.state;

		if (position === undefined) {
			//Available menu
			const { mainPosition, otherPositions } = squadMember;
			let positions = [mainPosition];
			if (otherPositions) {
				positions.push(...otherPositions);
			}
			positions = _.filter(positions, _.identity);
			if (positions.length) {
				return <span>{positions.join(", ")}</span>;
			} else {
				return null;
			}
		} else if (showMoveMenu) {
			return (
				<div
					className="action-bar"
					style={{
						backgroundColor: teamColours.borderColor,
						color: teamColours.backgroundColor
					}}
				>
					<div
						className="action move-up"
						onClick={ev => this.handleAction("move-up", ev)}
					>
						▲
					</div>
					<div
						className="action move-down"
						onClick={ev => this.handleAction("move-down", ev)}
					>
						▼
					</div>
					<div className="action delete" onClick={ev => this.handleAction("delete", ev)}>
						✖
					</div>
				</div>
			);
		} else {
			return null;
		}
	}

	render() {
		const { squadMember, teamColours } = this.props;
		const { name } = squadMember;

		return (
			<div
				className="card squad-selector-card"
				style={teamColours}
				onClick={ev => this.handleClick(ev.target)}
			>
				<span>{name}</span>
				{this.renderBottomBar()}
			</div>
		);
	}
}

SquadSelectorCard.propTypes = {
	squadMember: PropTypes.shape({
		_id: PropTypes.string.isRequired,
		inPregame: PropTypes.bool.isRequired,
		number: PropTypes.number,
		name: PropTypes.string.isRequired,
		mainPosition: PropTypes.string,
		otherPositions: PropTypes.arrayOf(PropTypes.string)
	}).isRequired,
	teamColours: PropTypes.shape({
		main: PropTypes.array,
		text: PropTypes.array,
		trim1: PropTypes.array
	})
};

export default SquadSelectorCard;
