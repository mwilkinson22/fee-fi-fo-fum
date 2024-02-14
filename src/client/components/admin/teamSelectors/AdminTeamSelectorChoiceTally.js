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

		// Customise playerPositions
		newState.playerPositions = { ...playerPositions };
		newState.playerPositions.I.numbers = [];
		for (let i = 1; i <= newState.selector.interchanges; i++) {
			newState.playerPositions.I.numbers.push(13 + i);
		}

		if (newState.selector.usesExtraInterchange) {
			newState.playerPositions.EI = {
				name: "Extra Interchange",
				type: "Interchange",
				numbers: [13 + newState.selector.interchanges + 1]
			};
		}

		return newState;
	}

	renderSummaryTable(positions) {
		const { playerPositions, selector } = this.state;
		const { choices, players, usesExtraInterchange } = selector;

		//Get simple { id: total } object
		const totals = _.chain(choices)
			.map("squad")
			.map(squad => {
				if (positions) {
					return squad.filter((id, pos) => positions.indexOf(pos + 1) > -1);
				} else if (usesExtraInterchange) {
					// If we haven't specified certain positions, we're tracking all votes
					// If we have an extra interchange, exclude that here.
					return squad.filter((id, pos) => pos + 1 != playerPositions.EI.numbers[0]);
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
			{ key: "player", label: "Player" },
			{ key: "pc", label: "% of Votes" }
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
					pc: ((total / choices.length) * 100).toFixed(2) + "%",
					player: name.full
				}
			}));

		if (rows.length) {
			return <Table columns={columns} defaultSortable={false} rows={rows} sortBy={{ key: "total", asc: false }} />;
		}
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
		const { playerPositions } = this.state;

		return _.map(playerPositions, (position, key) => {
			return (
				<div className="form-card" key={key}>
					<h6>{position.name}</h6>
					{this.renderSummaryTable(position.numbers)}
				</div>
			);
		});
	}

	renderIndividualPicks() {
		const { selector, playerPositions } = this.state;
		const { choices, interchanges, players } = selector;
		const columns = [];
		const totalPositions = 13 + interchanges;
		for (let i = 0; i < totalPositions; i++) {
			const positionStr = Object.values(playerPositions).find(({ numbers }) => numbers.includes(i + 1)).name;
			columns.push({ key: "player" + i, label: positionStr });
		}

		const rows = [];
		choices.forEach(({ squad, ip }) => {
			const row = { key: ip, data: {} };
			squad.forEach((_player, i) => {
				const player = players.find(({ _id }) => _id == _player);
				row.data["player" + i] = player.name.full;
			});
			rows.push(row);
		});

		return (
			<div className="form-card">
				<h6>All Votes</h6>
				<div className="all-selector-votes-wrapper">
					<Table columns={columns} defaultSortable={true} rows={rows} stickyHead={true} />
				</div>
			</div>
		);
	}

	render() {
		const { choices } = this.state.selector;

		let content;
		if (choices.length) {
			content = (
				<div className="container">
					{this.renderTotalVotes()}
					{this.renderVotesByPosition()}
					{this.renderIndividualPicks()}
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
