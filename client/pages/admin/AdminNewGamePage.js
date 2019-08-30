import React, { Component } from "react";
import HelmetBuilder from "../../components/HelmetBuilder";
import AdminGameOverview from "../../components/admin/games/AdminGameOverview";

export default class AdminNewGamePage extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const title = "Add New Game";
		return (
			<div className="admin-game-page admin-page">
				<HelmetBuilder title={title} />
				<section className="page-header">
					<div className="container">
						<h1 key="header">{title}</h1>
					</div>
				</section>
				<section className="form">
					<AdminGameOverview />
				</section>
			</div>
		);
	}
}
