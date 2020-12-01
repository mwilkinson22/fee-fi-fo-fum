//Modules
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import HelmetBuilder from "~/client/components/HelmetBuilder";
import NotFoundPage from "../NotFoundPage";
import ErrorList from "../../components/ErrorList";

class AdminErrorPage extends Component {
	render() {
		const { authUser } = this.props;

		//Admin Only
		if (!authUser || !authUser.isAdmin) {
			return <NotFoundPage />;
		}

		return (
			<div className="admin-error-list">
				<HelmetBuilder title="Errors" />
				<section className="page-header">
					<div className="container">
						<h1>Errors</h1>
					</div>
				</section>
				<section className="list">
					<div className="container">
						<ErrorList showAllColumns={true} />
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ config }) {
	const { authUser } = config;
	return { authUser };
}

export default connect(mapStateToProps)(AdminErrorPage);
