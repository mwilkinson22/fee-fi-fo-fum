//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";

//Components
import ThreeDots from "../ThreeDots";

//Constants
import playerPositions from "~/constants/playerPositions";

class SquadSelectorCard extends Component {
	constructor(props) {
		super(props);
		this.state = { showActionsInMobile: false };
	}

	static getDerivedStateFromProps(nextProps) {
		return _.pick(nextProps, ["isActivePosition", "onClick", "withGap"]);
	}

	handleMainBarClick() {
		const { onClick, showActionsInMobile } = this.state;
		if (showActionsInMobile) {
			this.setState({ showActionsInMobile: false });
		} else {
			onClick();
		}
	}

	renderPosition() {
		const { isActivePosition } = this.state;
		const { positionString, style } = this.props;

		if (positionString) {
			return (
				<div
					className={`position ${isActivePosition ? "active" : ""}`}
					onClick={() => this.handleMainBarClick()}
					style={{ borderColor: style.backgroundColor }} //Overwritten in css for active/hover
				>
					{positionString}
				</div>
			);
		}
	}

	renderName() {
		const { player, includePositions } = this.props;

		let name, positions;
		if (player) {
			const { number, _player } = this.props.player;

			let nameString = "";
			//Add Number, where necessary
			if (number) {
				nameString += `${number}. `;
			}

			//Add player name
			nameString += _player.name.full;

			name = <div className="name">{nameString}</div>;

			//Add positions
			const { playingPositions } = _player;
			if (includePositions && playingPositions && playingPositions.length) {
				positions = (
					<div className="positions">
						{playingPositions.map(key => playerPositions[key].name).join(", ")}
					</div>
				);
			}
		}

		return (
			<div className="main" onClick={() => this.handleMainBarClick()}>
				{name}
				{positions}
			</div>
		);
	}

	renderActions() {
		const { actions, readOnly, style } = this.props;

		if (!readOnly && actions && actions.length) {
			//We invert the styling here, but this only applies on
			//hover, as per css
			const actionStyle = { color: style.backgroundColor, backgroundColor: style.color };

			const renderedActions = actions.map((action, i) => {
				const classNames = ["action"];

				if (action.disabled) {
					classNames.push("disabled");
				}
				return (
					<div
						className={classNames.join(" ")}
						key={i}
						onClick={() => {
							this.setState({ showActionsInMobile: false });
							action.onClick();
						}}
						style={actionStyle}
					>
						{action.icon}
					</div>
				);
			});
			return <div className="actions">{renderedActions}</div>;
		}
	}

	renderMobileActionDots() {
		const { actions, readOnly, style } = this.props;

		if (!readOnly && actions && actions.length) {
			return (
				<ThreeDots
					colour={style.color}
					onClick={() => this.setState({ showActionsInMobile: true })}
				/>
			);
		}
	}

	render() {
		const { readOnly, style } = this.props;
		const { onClick, showActionsInMobile, withGap } = this.state;

		const classNames = ["card", "squad-selector-card"];

		if (withGap) {
			classNames.push("with-gap");
		}

		if (showActionsInMobile) {
			classNames.push("show-mobile-actions");
		}

		if (onClick) {
			classNames.push("clickable");
		}

		if (readOnly) {
			classNames.push("read-only");
		}

		return (
			<div className={classNames.join(" ")} style={style}>
				{this.renderPosition()}
				{this.renderName()}
				{this.renderMobileActionDots()}
				{this.renderActions()}
			</div>
		);
	}
}

SquadSelectorCard.propTypes = {
	actions: PropTypes.array,
	includePositions: PropTypes.bool,
	onClick: PropTypes.func,
	player: PropTypes.object,
	positionString: PropTypes.string,
	readOnly: PropTypes.bool,
	style: PropTypes.object.isRequired,
	withGap: PropTypes.bool
};

SquadSelectorCard.defaultProps = {
	outOfPosition: false,
	readOnly: false,
	withGap: false
};

export default SquadSelectorCard;
