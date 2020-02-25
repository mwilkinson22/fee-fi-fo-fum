//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { FieldArray } from "formik";
import * as Yup from "yup";

//Actions
import { createAward, updateAward, deleteAward } from "~/client/actions/awardActions";

//Components
import BasicForm from "../BasicForm";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminAwardOverview extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { awardsList, match } = nextProps;

		//Get current award object
		const award = awardsList[match.params._id];
		const newState = { award };

		//Set Validation Schema
		newState.validationSchema = Yup.object().shape({
			year: Yup.number()
				.min(1895)
				.max(Number(new Date().getFullYear()))
				.test(
					"is-taken",
					"Awards for this year are already in place",
					year =>
						(award && award.year == year) || !_.find(awardsList, a => a.year == year)
				)
				.required()
				.label("Year"),
			socialCard: Yup.string().label("Social Media Card"),
			votingBeginsDate: Yup.date()
				.required()
				.label("Voting Begins (Date)"),
			votingBeginsTime: Yup.date()
				.required()
				.label("Voting Begins (Time)"),
			votingEndsDate: Yup.date()
				.required()
				.label("Voting Ends (Date)"),
			votingEndsTime: Yup.date()
				.required()
				.label("Voting Ends (Time)"),
			categories: Yup.array().of(Yup.string().required())
		});

		return newState;
	}

	getInitialValues() {
		const { award } = this.state;

		//First we declare the defaults, for new items or those without certain fields
		const defaultValues = {
			year: "",
			socialCard: "",
			votingBeginsDate: "",
			votingBeginsTime: "",
			votingEndsDate: "",
			votingEndsTime: ""
		};

		if (award) {
			//First, get the current values (fall back to defaults)
			const values = _.mapValues(defaultValues, (defaultValue, key) => {
				switch (key) {
					//Split Date field into date and time
					case "votingBeginsDate":
					case "votingEndsDate": {
						//Get root votingBegins/Ends property
						const date = award[key.replace("Date", "")];
						return date ? date.toString("yyyy-MM-dd") : defaultValue;
					}
					case "votingBeginsTime":
					case "votingEndsTime": {
						//Get root votingBegins/Ends property
						const time = award[key.replace("Time", "")];
						return time ? time.toString("HH:mm") : defaultValue;
					}
					default: {
						//Otherwise, return either the current value or the default
						const value = award.hasOwnProperty(key) ? award[key] : defaultValue;
						return value != null ? value : "";
					}
				}
			});

			//Get an array of category IDs, for reordering
			if (award.categories && award.categories.length) {
				values.categories = award.categories.map(({ _id }) => _id);
			}

			return values;
		} else {
			//"New" page, just return defaults
			return defaultValues;
		}
	}

	getFieldGroups() {
		return [
			{
				fields: [
					{ name: "year", type: fieldTypes.number },
					{ name: "votingBeginsDate", type: fieldTypes.date },
					{ name: "votingBeginsTime", type: fieldTypes.time },
					{ name: "votingEndsDate", type: fieldTypes.date },
					{ name: "votingEndsTime", type: fieldTypes.time },
					{
						name: "socialCard",
						type: fieldTypes.image,
						path: "images/awards/socialCards/",
						allowSVG: false,
						convertToWebP: false
					}
				]
			},
			{
				render: values => {
					if (values.categories && values.categories.length) {
						return this.renderCategorySorter(values);
					}
				}
			}
		];
	}

	renderCategorySorter(values) {
		const { award } = this.state;
		if (values.categories) {
			return (
				<div className="full-span" key="category-sorter-wrapper">
					<h6>Categories</h6>
					<ul className="plain-list">
						<FieldArray
							name="categories"
							render={({ move }) => {
								return values.categories.map((id, i) => (
									<li key={id} className="award-category-sorter-row">
										<button
											type="button"
											className="down"
											disabled={i == values.categories.length - 1}
											onClick={() => move(i, i + 1)}
										>
											&#9660;
										</button>
										<button
											type="button"
											className="up"
											disabled={i == 0}
											onClick={() => move(i, i - 1)}
										>
											&#9650;
										</button>
										<div className="name">
											{award.categories.find(c => c._id == id).name}
										</div>
									</li>
								));
							}}
						/>
					</ul>
				</div>
			);
		}
	}

	alterValuesBeforeSubmit(values) {
		//Convert date/time fields back to one value
		values.votingBegins = `${values.votingBeginsDate} ${values.votingBeginsTime}`;
		values.votingEnds = `${values.votingEndsDate} ${values.votingEndsTime}`;
		delete values.votingBeginsDate;
		delete values.votingBeginsTime;
		delete values.votingEndsDate;
		delete values.votingEndsTime;
	}

	render() {
		const { createAward, updateAward, deleteAward } = this.props;
		const { award, validationSchema } = this.state;

		//Handle props specifically for create/update
		let formProps;
		if (award) {
			formProps = {
				onDelete: () => deleteAward(award._id),
				onSubmit: values => updateAward(award._id, values),
				redirectOnDelete: "/admin/awards/"
			};
		} else {
			formProps = {
				onSubmit: values => createAward(values),
				redirectOnSubmit: id => `/admin/awards/${id}`
			};
		}

		return (
			<div className="container">
				<BasicForm
					alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isNew={!award}
					itemType={"Awards"}
					validationSchema={validationSchema}
					{...formProps}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ awards }) {
	const { awardsList } = awards;
	return { awardsList };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, { createAward, updateAward, deleteAward })(AdminAwardOverview)
);
