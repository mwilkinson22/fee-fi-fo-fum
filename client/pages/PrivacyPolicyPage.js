//Modules
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import LoadingPage from "../components/LoadingPage";

//Actions
import { getSettings } from "~/client/actions/configActions";

class PrivacyPolicyPage extends Component {
	constructor(props) {
		super(props);
		const { privacyPolicy, getSettings } = props;

		if (!privacyPolicy) {
			getSettings(["privacyPolicy"]);
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { privacyPolicy } = nextProps;
		return { privacyPolicy };
	}

	render() {
		const { privacyPolicy } = this.state;

		if (privacyPolicy == null) {
			return <LoadingPage />;
		}

		const formattedPolicy = privacyPolicy
			.split("\n")
			.map((paragraph, i) => <p key={i}>{paragraph}</p>);

		return (
			<div className="privacy-policy-page">
				<section className="page-header">
					<div className="container">
						<h1>Privacy Policy</h1>
					</div>
				</section>
				<section>
					<div className="container">
						<div className="form-card">{formattedPolicy}</div>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ config }) {
	const { privacyPolicy } = config;
	return { privacyPolicy };
}

function loadData(store) {
	return store.dispatch(getSettings(["privacyPolicy"]));
}

export default {
	component: connect(mapStateToProps, { getSettings })(PrivacyPolicyPage),
	loadData
};
