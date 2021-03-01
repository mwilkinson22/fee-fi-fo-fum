//Modules
import _ from "lodash";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import Select from "react-select/async";

//Actions
import { mergePerson } from "~/client/actions/peopleActions";

//Components
import NotFoundPage from "~/client/pages/NotFoundPage";
import DeleteButtons from "~/client/components/fields/DeleteButtons";

//Constants
import selectStyling from "~/constants/selectStyling";

class AdminPersonMerge extends Component {
	constructor(props) {
		super(props);

		const { match, peopleList, fullPeople } = props;

		//Get main person
		const { _id } = match.params;
		const source = fullPeople[_id];

		//Create formatted option list
		const options = _.chain(peopleList)
			.filter(p => p.gender === source.gender && p._id !== source._id)
			.map(p => {
				const fullName = `${p.name.first} ${p.name.last}`;
				return {
					label: `${fullName} (${p._id})`,
					value: p._id,
					searchTerm: this.formatName(`${fullName}${p._id}`)
				};
			})
			.sortBy("label")
			.value();

		this.state = { source, options, destination: null };
	}

	formatName(str) {
		return str.toLowerCase().replace(/[^a-z0-9]/g, "");
	}

	handleSearch(input, callback) {
		const { options } = this.state;
		let result;
		if (!input || input.length < 3) {
			result = [{ label: "Please enter 3 or more characters", isDisabled: true }];
		} else {
			result = options.filter(p => p.searchTerm.includes(this.formatName(input)));
		}

		callback(result);
	}

	async handleMerge() {
		const { history, mergePerson } = this.props;
		const { destination, source } = this.state;
		const result = await mergePerson(source._id, destination);
		if (result) {
			history.replace(`/admin/people/${destination}`);
		}
	}

	renderConfirmation() {
		const { peopleList } = this.props;
		const { destination, source } = this.state;
		if (destination) {
			const destinationPerson = peopleList[destination];

			return (
				<div>
					<h6>WARNING</h6>
					<p>The person you are currently viewing:</p>
					<p>
						<strong>
							{source.name.full} - id: {source._id}
						</strong>
					</p>
					<p>
						will be <strong>permanently</strong> deleted, and any references to them will instead point to:
					</p>
					<p>
						<strong>
							{destinationPerson.name.first} {destinationPerson.name.last} - id: {destination}
						</strong>
					</p>
					<p>Are you sure you wish to proceed?</p>
					<DeleteButtons onDelete={() => this.handleMerge()} deleteText={`Merge ${source.name.first}`} />
				</div>
			);
		}
	}

	render() {
		const { authUser } = this.props;
		const { source } = this.state;

		//Admins only
		if (!authUser || !authUser.isAdmin) {
			return <NotFoundPage />;
		}

		return (
			<div>
				<div className="form-card">
					<p>This functionality can be used to resolve accidental duplicate Person entries.</p>
					<p>
						If you proceed, this user (ID: {source._id}) will be permanently deleted and all existing
						references will instead point to the person selected in the dropdown below
					</p>
					<p>
						This process is <strong>permanent</strong> and cannot be undone. Proceed with caution
					</p>
				</div>
				<div className="form-card">
					<h6>Select Person</h6>
					<Select
						loadOptions={(input, cb) => this.handleSearch(input, cb)}
						onChange={({ value }) => this.setState({ destination: value })}
						styles={selectStyling}
					/>
					{this.renderConfirmation()}
				</div>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ config, people }) {
	const { authUser } = config;
	const { fullPeople, peopleList } = people;
	return { authUser, fullPeople, peopleList };
}
// export default form;
export default withRouter(connect(mapStateToProps, { mergePerson })(AdminPersonMerge));
