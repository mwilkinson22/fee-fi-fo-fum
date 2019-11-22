//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Actions
import { fetchAllGrounds } from "../../../actions/groundActions";
import { updateTeam } from "../../../actions/teamsActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminTeamGrounds extends Component {
	constructor(props) {
		super(props);
		const { groundList, fetchAllGrounds, teamTypes } = props;

		if (!groundList) {
			fetchAllGrounds();
		}

		//Create Validation Schema
		const validationSchema = Yup.object().shape({
			_defaultGround: Yup.string()
				.required()
				.label("Default Ground"),
			_grounds: Yup.object().shape(
				_.mapValues(teamTypes, ({ name }) => Yup.string().label(name))
			)
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullTeams, match, groundList } = nextProps;
		const newState = { isLoading: false };

		//Wait for everything to load
		if (!groundList) {
			return { isLoading: true };
		}

		//Get Current Team
		newState.team = fullTeams[match.params._id] || false;

		//Create Ground Options
		newState.groundOptions = _.chain(groundList)
			.map(ground => ({
				value: ground._id,
				label: `${ground.name}, ${ground.address._city.name}`
			}))
			.sortBy("label")
			.value();

		return newState;
	}

	getInitialValues() {
		const { team, groundOptions } = this.state;
		const { teamTypes } = this.props;

		return {
			_defaultGround: groundOptions.find(({ value }) => value == team._defaultGround) || "",
			_grounds: _.mapValues(teamTypes, ({ _id }) => {
				const currentGround = team._grounds.find(({ _teamType }) => _teamType == _id);
				if (currentGround) {
					return groundOptions.find(({ value }) => value == currentGround._ground);
				} else {
					return "";
				}
			})
		};
	}

	getFieldGroups() {
		const { teamTypes } = this.props;
		const { groundOptions } = this.state;

		const fields = [
			{ name: "_defaultGround", type: fieldTypes.select, options: groundOptions }
		];

		_.chain(teamTypes)
			.sortBy("sortOrder")
			.each(({ _id }) => {
				fields.push({
					name: `_grounds.${_id}`,
					type: fieldTypes.select,
					options: groundOptions,
					isClearable: true
				});
			})
			.value();

		return [
			{
				fields
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		values._grounds = _.chain(values._grounds)
			.map((_ground, _teamType) => ({ _ground, _teamType }))
			.filter("_ground")
			.value();
	}

	render() {
		const { updateTeam } = this.props;
		const { isLoading, team, validationSchema } = this.state;

		//Wait for the ground list
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<section className="form">
				<div className="container">
					<BasicForm
						alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
						fieldGroups={this.getFieldGroups()}
						initialValues={this.getInitialValues()}
						isNew={false}
						itemType="Grounds"
						onSubmit={values => updateTeam(team._id, values)}
						validationSchema={validationSchema}
					/>
				</div>
			</section>
		);
	}
}

//Add Redux Support
function mapStateToProps({ grounds, teams }) {
	const { groundList } = grounds;
	const { fullTeams, teamTypes } = teams;
	return { fullTeams, groundList, teamTypes };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, { fetchAllGrounds, updateTeam })(AdminTeamGrounds)
);
