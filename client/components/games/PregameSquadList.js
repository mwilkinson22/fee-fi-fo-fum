//Modules
import React, { Component } from "react";
import { connect } from "react-redux";

//Components

//Actions

class PregameSquadList extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		return {};
	}

	setDueDate() {
		const { date } = this.props.game;
		const dueDate = new Date(date).addDays(-2);
		dueDate.setHours(12, 0, 0, 0);
		const daysToGo = (dueDate - new Date()) / 1000 / 60 / 60 / 24;

		let text;
		if (daysToGo < 0) {
			text = "soon";
		} else if (daysToGo < 6.5) {
			text = `${dueDate.toString("dddd")} afternoon`;
		} else {
			text = dueDate.toString("dddd dS MMM");
		}

		return (
			<div className="container">
				<h2>Squads due {text}</h2>
			</div>
		);
	}

	render() {
		const { pregameSquads } = this.props.game;
		let content;
		if (pregameSquads.length) {
			//TODO
		} else {
			content = this.setDueDate();
		}
		return <section className="pregame-squads">{content}</section>;
	}
}

function mapStateToProps(state) {
	return {};
}

export default connect(mapStateToProps)(PregameSquadList);
