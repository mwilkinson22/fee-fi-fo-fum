//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

//Components
import PersonImage from "~/client/components/people/PersonImage";

class PlayerLeaderboard extends Component {
	renderList() {
		const { higherValueIsBetter, list, placeCount, players, renderValue } = this.props;

		//Limit to everyone better than (or equal to) the placeCount prop
		let filteredList = list;
		if (list.length > placeCount) {
			const threshold = list[placeCount - 1].value;
			filteredList = list.filter(p =>
				higherValueIsBetter ? p.value >= threshold : p.value <= threshold
			);
		}

		//Create Grouped Array
		let position = 1;
		return (
			_.chain(filteredList)
				//Group players on equal values
				.groupBy("value")
				//Convert Back to an array
				.orderBy(arr => arr[0].value, higherValueIsBetter ? "desc" : "asc")
				//Format
				.map(arr => {
					let positionText = position.toString();
					if (arr.length > 1) {
						positionText += "=";
					}

					//Update the position int for the next iteration
					position += arr.length;

					//Loop through values
					const names = arr.map(({ _player, title }, i) => {
						const { name, slug } = players[_player]._player;

						return (
							<span key={slug}>
								<Link to={`/players/${slug}`} title={title}>
									{name.full}
								</Link>
								{i < arr.length - 1 ? ",\u00A0" : ""}
							</span>
						);
					});

					return [
						<div className="position" key={position}>
							{positionText}
						</div>,
						<div className="name" key="name">
							{names}
						</div>,
						<div className="value" key="value">
							{renderValue(arr[0].value)}
						</div>
					];
				})
				.value()
		);
	}

	renderImage() {
		const { list, players } = this.props;
		const leader = players[list[0]._player]._player;

		return (
			<div className="leader">
				<Link to={`/players/${leader.slug}`}>
					<PersonImage person={leader} variant="player" size="medium" />
				</Link>
			</div>
		);
	}

	renderTitle() {
		const { title, titleCondition } = this.props;

		if (title) {
			return (
				<h6 className={titleCondition ? "with-condition" : ""}>
					{title}
					<span>{titleCondition}</span>
				</h6>
			);
		}
	}

	render() {
		const list = this.renderList();

		if (list.length) {
			return (
				<div className="leaderboard">
					{this.renderImage()}
					<div className="list">
						{list}
						{this.renderTitle()}
					</div>
				</div>
			);
		} else {
			return null;
		}
	}
}

PlayerLeaderboard.propTypes = {
	higherValueIsBetter: PropTypes.bool,
	list: PropTypes.arrayOf(
		PropTypes.shape({
			_player: PropTypes.string.isRequired,
			value: PropTypes.number.isRequired,
			title: PropTypes.string
		})
	).isRequired,
	players: PropTypes.object.isRequired,
	placeCount: PropTypes.number,
	renderValue: PropTypes.func,
	title: PropTypes.string,
	titleCondition: PropTypes.string
};

PlayerLeaderboard.defaultProps = {
	higherValueIsBetter: true,
	placeCount: 5,
	renderValue: value => value
};

export default PlayerLeaderboard;
