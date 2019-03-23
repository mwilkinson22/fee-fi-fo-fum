//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { NavLink } from "react-router-dom";

//Actions
import { fetchYearsWithSquads, fetchSquad, fetchAllTeamTypes } from "../../../actions/teamsActions";

//Components
import LoadingPage from "~/client/components/LoadingPage";

//Helpers
import processFormFields from "~/helpers/adminHelper";

class AdminTeamSquads extends Component {
	constructor(props) {
		super(props);

		const { team, squads, teamTypes, fetchYearsWithSquads, fetchAllTeamTypes } = props;

		if (!squads) {
			fetchYearsWithSquads(team._id);
		}

		if (!teamTypes) {
			fetchAllTeamTypes();
		}

		this.state = { team, squads };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { team, squads, teamTypes } = nextProps;
		return { team, squads, teamTypes };
	}

	getValidationSchema() {
		return Yup.object().shape({});
	}

	getDefaults() {
		return {};
	}

	onSubmit(values) {
		console.log(values);
	}

	renderFields() {
		const { year } = this.props.match.params;
		const validationSchema = this.getValidationSchema();
		const fields = [];

		return (
			<Form>
				<div className="form-card">
					<h6>Fields</h6>
					{processFormFields(fields, validationSchema)}
					<div className="buttons">
						<button type="clear">Clear</button>
						<button type="submit">Submit</button>
					</div>
				</div>
			</Form>
		);
	}

	renderSubMenu() {
		const { team, squads, teamTypes } = this.state;
		const { slug } = this.props.match.params;

		if (!squads["2019"]["first"]) {
			this.props.fetchSquad(2019, team._id, "first");
			return <LoadingPage />;
		}

		const submenuItems = _.chain(squads)
			.map((teamtypes, year) => {
				return _.map(teamtypes, (squad, teamType) => {
					const teamTypeObj = _.filter(teamTypes, { slug: teamType })[0];
					return {
						year,
						teamType,
						teamTypeObj,
						sortValue: `${year}${1000 - teamTypeObj.sortOrder}`
					};
				});
			})
			.flatten()
			.orderBy("sortValue", "desc")
			.map(s => ({
				url: `${s.year}/${s.teamType}`,
				label: `${s.year} - ${s.teamTypeObj.name}`
			}))
			.value();
		submenuItems.unshift({ url: "new", label: "New" });

		return _.map(submenuItems, item => {
			const { url, label } = item;
			return (
				<NavLink
					key={url}
					exact
					to={`/admin/teams/${slug}/squads/${url}`}
					activeClassName="active"
				>
					{label}
				</NavLink>
			);
		});
	}

	render() {
		const { year } = this.props.match.params;
		const { squads, teamTypes } = this.state;
		return (
			<div className="container">
				<Formik
					validationSchema={() => this.getValidationSchema()}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					render={formikProps => {
						if (!squads || !teamTypes) {
							return <LoadingPage />;
						}

						return (
							<div>
								<div className="block-card">
									<div className="sub-menu">{this.renderSubMenu()}</div>
								</div>
								{year ? this.renderFields(formikProps.values) : null}
							</div>
						);
					}}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ teams }, ownProps) {
	const { slug } = ownProps.match.params;
	const { teamList, squads, teamTypes } = teams;
	const team = teamList[slug];
	return { team, squads: squads[team._id], teamTypes, ...ownProps };
}

// export default form;
export default connect(
	mapStateToProps,
	{ fetchYearsWithSquads, fetchSquad, fetchAllTeamTypes }
)(AdminTeamSquads);
