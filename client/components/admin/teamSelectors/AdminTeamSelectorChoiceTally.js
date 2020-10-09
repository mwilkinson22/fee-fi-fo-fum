//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import Table from "../../Table";

//Constants
import playerPositions from "~/constants/playerPositions";

class AdminTeamSelectorChoiceTally extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { match, selectors } = nextProps;
		const newState = { isLoading: false };

		//Get Current Selector
		newState.selector = selectors[match.params._id];

		return newState;
	}

	renderSummaryTable(positions) {
		const { choices, players } = this.state.selector;

		//Get simple { id: total } object
		const totals = _.chain(choices)
			.map("squad")
			.map(squad => {
				if (positions) {
					return squad.filter((id, pos) => positions.indexOf(pos + 1) > -1);
				} else {
					return squad;
				}
			})
			.flatten()
			.groupBy()
			.mapValues("length")
			.value();

		//Get Table Columns
		const columns = [
			{ key: "total", label: "Total Votes" },
			{ key: "player", label: "Player " }
		];

		//Loop through players
		const rows = players
			.map(({ _id, name }) => ({ _id, name, total: totals[_id] || 0 }))
			//If a position is defined, only show those with at least one vote
			.filter(p => !positions || p.total)
			//Convert to row format
			.map(({ _id, name, total }) => ({
				key: _id,
				data: {
					total,
					player: name.full
				}
			}));

		return (
			<Table
				columns={columns}
				defaultSortable={false}
				rows={rows}
				sortBy={{ key: "total", asc: false }}
			/>
		);
	}

	renderTotalVotes() {
		const total = this.state.selector.choices.length;
		return (
			<div className="form-card">
				<h6>
					Total Votes (out of {total} {total == 1 ? "entry" : "entries"})
				</h6>
				{this.renderSummaryTable()}
			</div>
		);
	}

	renderVotesByPosition() {
		return _.map(playerPositions, (position, key) => {
			if (!this.state.selector.interchanges && key == "I") {
				return null;
			}

			return (
				<div className="form-card" key={key}>
					<h6>{position.name}</h6>
					{this.renderSummaryTable(position.numbers)}
				</div>
			);
		});
	}

	render() {
		const { choices } = this.state.selector;

		let content;
		if (choices.length) {
			content = (
				<div className="container">
					{this.renderTotalVotes()}
					{this.renderVotesByPosition()}
				</div>
			);
		} else {
			content = (
				<div className="container">
					<div className="form-card">
						<h6>No votes collected</h6>
					</div>
				</div>
			);
		}

		return <div className="admin-team-selector-votes-page">{content}</div>;
	}
}

//Add Redux Support
function mapStateToProps({ teamSelectors }) {
	const { selectors } = teamSelectors;
	return { selectors };
}
// export default form;
export default connect(mapStateToProps)(AdminTeamSelectorChoiceTally);
