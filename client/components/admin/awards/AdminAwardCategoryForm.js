//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Formik, Form, FieldArray } from "formik";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Actions
import { addCategory, updateCategory, deleteCategory } from "~/client/actions/awardActions";

//Components
import BasicForm from "../BasicForm";
import DeleteButtons from "../fields/DeleteButtons";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminAwardCategories extends BasicForm {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { award, category } = nextProps;
		const newState = { award, category };

		const validationSchema = {
			name: Yup.string()
				.required()
				.label("Name"),
			awardType: Yup.string()
				.required()
				.label("Type"),
			description: Yup.string().label("Description"),
			nominees: Yup.array()
				.of(
					Yup.object().shape({
						description: Yup.string().label("Description"),
						nominee: Yup.string()
							.required()
							.label("Nominee"),
						stats: Yup.array()
							.of(Yup.string())
							.label("Stats")
					})
				)
				.min("2", "Please provide at least two nominees")
		};

		newState.validationSchema = Yup.object().shape(validationSchema);
		return newState;
	}

	getDefaults() {
		const { category } = this.state;
		const { options } = this.props;

		if (category) {
			//Normalise Nominee Options
			let nomineeOptions;
			switch (category.awardType) {
				case "player":
					nomineeOptions = options.player;
					break;
				case "game":
					nomineeOptions = _.chain(options.game)
						.map("options")
						.flatten()
						.value();
			}

			//Flatten Stat Options
			const statOptions = _.chain(options.stats)
				.map("options")
				.flatten()
				.value();

			const nominees = category.nominees.map(n => {
				//Get Nominee Option
				let { nominee, stats } = n;
				switch (category.awardType) {
					case "player":
					case "game":
						nominee = nomineeOptions.find(({ value }) => value == nominee);
						break;
				}

				//Get Stats
				if (stats && stats.length) {
					stats = stats.map(s => statOptions.find(({ value }) => value == s));
				}

				return { ...n, nominee, stats };
			});
			return {
				name: category.name,
				awardType: category.awardType,
				description: category.description,
				nominees
			};
		} else {
			return {
				name: "",
				awardType: "",
				description: "",
				nominees: [
					{ description: "", nominee: "", stats: [] },
					{ description: "", nominee: "", stats: [] }
				]
			};
		}
	}

	async onSubmit(fValues) {
		const { award, category, addCategory, updateCategory, history } = this.props;
		const values = _.cloneDeep(fValues);

		//Fix Nominees
		values.nominees = values.nominees.map(n => {
			n.nominee = n.nominee.value || n.nominee;
			if (n.stats && n.stats.length) {
				n.stats = n.stats.map(s => s.value);
			}
			return n;
		});

		if (category) {
			updateCategory(award._id, category._id, values);
		} else {
			const newId = await addCategory(award._id, values);
			history.push(`/admin/awards/${award._id}/categories/${newId}`);
		}
	}

	async onDelete() {
		const { award, category, deleteCategory, history } = this.props;

		const success = await deleteCategory(award._id, category._id);
		if (success) {
			history.replace(`/admin/awards/${award._id}/categories`);
		}
	}

	renderMainForm({ values }) {
		const { awardType } = values;
		const { category } = this.state;
		const { options } = this.props;

		const nomineeField = {};

		if (awardType == "custom") {
			nomineeField.type = fieldTypes.text;
		} else {
			nomineeField.type = fieldTypes.select;
			nomineeField.options = options[awardType];
		}

		const fields = values.nominees.map((nominee, i) => {
			const baseName = `nominees.${i}`;
			///nominee, stats, description;
			const fields = [
				{ name: `${baseName}.nominee`, ...nomineeField },
				{ name: `${baseName}.description`, type: fieldTypes.textarea, rows: 3 }
			];

			if (awardType !== "custom") {
				fields.push({
					name: `${baseName}.stats`,
					type: fieldTypes.select,
					options: options.stats,
					isMulti: true
				});
			}
			return (
				<div className="form-card grid" key={i}>
					{this.renderFieldGroup(fields)}
					<FieldArray
						key={`remove ${i}`}
						name="nominees"
						render={({ move, remove }) => [
							<div key="move" className="move-buttons">
								<button
									type="button"
									className="down"
									disabled={i == values.nominees.length - 1}
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
							</div>,
							<DeleteButtons
								key="delete"
								onDelete={() => remove(i)}
								deleteText="Remove Nominee"
							/>
						]}
					/>
				</div>
			);
		});

		return [
			<div className="form-card grid" key="head">
				{this.renderFieldGroup([
					{ name: "name", type: fieldTypes.text },
					{ name: "description", type: fieldTypes.textarea }
				])}
			</div>,
			...fields,
			<div className="form-card grid" key="add">
				<FieldArray
					name="nominees"
					render={({ push }) => (
						<div className="buttons">
							<button
								type="button"
								onClick={() => push({ description: "", nominee: "" })}
							>
								Add Nominee
							</button>
						</div>
					)}
				/>
			</div>,
			<div className="form-card grid" key="footer">
				<div className="buttons">
					<button type="reset">Reset</button>
					<button type="submit" disabled={values.nominees.length < 2}>
						{category ? "Update" : "Add"} Category
					</button>
				</div>
			</div>
		];
	}

	renderDeleteButtons() {
		const { category } = this.props;
		if (category) {
			return (
				<div className="form-card grid">
					<DeleteButtons deleteText="Remove Category" onDelete={() => this.onDelete()} />
				</div>
			);
		}
	}

	render() {
		return (
			<div className="container">
				<Formik
					validationSchema={this.state.validationSchema}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					enableReinitialize={true}
					render={formikProps => {
						let content;

						//First of all we need an award type, which cannot be changed
						if (!formikProps.values.awardType) {
							const field = this.renderFieldGroup([
								{
									name: "awardType",
									type: fieldTypes.radio,
									options: [
										{ label: "Game", value: "game" },
										{ label: "Player", value: "player" },
										{ label: "Custom", value: "custom" }
									]
								}
							]);
							content = <div className="form-card grid">{field}</div>;
						} else {
							//Otherwise, render the full form
							content = this.renderMainForm(formikProps);
						}

						return (
							<Form>
								{content}
								{this.renderDeleteButtons()}
							</Form>
						);
					}}
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
	connect(
		mapStateToProps,
		{ addCategory, updateCategory, deleteCategory }
	)(AdminAwardCategories)
);
