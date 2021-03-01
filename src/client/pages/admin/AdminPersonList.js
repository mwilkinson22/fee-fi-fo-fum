//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";
import Searcher from "../../components/admin/Searcher";

//Actions
import { fetchPeopleList } from "~/client/actions/peopleActions";
import HelmetBuilder from "~/client/components/HelmetBuilder";

class AdminPersonList extends Component {
	constructor(props) {
		super(props);

		const { peopleList, fetchPeopleList } = props;

		if (!peopleList) {
			fetchPeopleList();
		}

		this.state = { filteredPeople: null, selectedPerson: null };
	}

	static getDerivedStateFromProps(nextProps) {
		const { peopleList } = nextProps;
		return { peopleList };
	}

	handleInputKeypress(ev) {
		const { filteredPeople, selectedPerson } = this.state;

		if (filteredPeople && filteredPeople.length) {
			switch (ev.which) {
				//Up arrow
				case 38:
					if (selectedPerson > 0) {
						this.setState({ selectedPerson: selectedPerson - 1 });
					}
					break;
				//Down arrow
				case 40:
					if (selectedPerson < filteredPeople.length - 1) {
						this.setState({ selectedPerson: selectedPerson + 1 });
					}
					break;
				//Enter
				case 13: {
					const person = filteredPeople[selectedPerson];
					this.props.history.push(`/admin/people/${person._id}`);
					break;
				}
			}
		}
	}

	renderList() {
		const { filteredPeople, searchValueEntered, selectedPerson } = this.state;
		let list;

		if (filteredPeople && filteredPeople.length) {
			list = filteredPeople.map((person, i) => (
				<li
					key={person._id}
					className={selectedPerson === i ? "selected" : ""}
					onMouseOver={() => this.setState({ selectedPerson: i })}
				>
					<Link to={`/admin/people/${person._id}`}>
						{this.renderPersonIcons(person)}
						{person.name.first} {person.name.last}
					</Link>
				</li>
			));
		} else if (searchValueEntered) {
			list = <li>No people found</li>;
		} else {
			return null;
		}

		return (
			<div className="card form-card">
				<ul className="plain-list">{list}</ul>
			</div>
		);
	}

	renderPersonIcons(person) {
		const { bucketPaths } = this.props;
		const icons = [
			person.gender == "M" ? { file: "male", title: "Male" } : { file: "female", title: "Female" },
			person.isPlayer ? { file: "ball", title: "Player" } : { file: "ball-grey", title: "Not a Player" },
			person.isCoach ? { file: "clipboard", title: "Coach" } : { file: "clipboard-grey", title: "Not a Coach" },
			person.isReferee ? { file: "whistle", title: "Referee" } : { file: "whistle-grey", title: "Not a Referee" }
		];

		return icons.map(({ file, title }) => (
			<span key={file}>
				<img src={`${bucketPaths.images.people}icons/${file}.svg`} alt={title} title={title} />
			</span>
		));
	}

	renderSearcher() {
		const { peopleList } = this.props;
		return (
			<Searcher
				data={peopleList}
				handleFilter={({ name }, searchString, convert) => {
					const fullName = convert(name.first + name.last);
					return fullName.includes(searchString);
				}}
				onChange={(filteredPeople, searchValueEntered) =>
					this.setState({
						filteredPeople: _.sortBy(filteredPeople, ["name.first", "name.last"]),
						selectedPerson: 0,
						searchValueEntered
					})
				}
				onKeyDown={ev => this.handleInputKeypress(ev)}
			/>
		);
	}

	render() {
		const { peopleList } = this.state;

		let content;
		if (!peopleList) {
			content = <LoadingPage />;
		} else {
			content = (
				<section className="list">
					<div className="container">
						<Link className="nav-card card" to={`/admin/people/new`}>
							Add a New Person
						</Link>
						{this.renderSearcher()}
						{this.renderList()}
					</div>
				</section>
			);
		}

		return (
			<div className="admin-person-list">
				<HelmetBuilder title="People" />
				<section className="page-header">
					<div className="container">
						<h1>People</h1>
					</div>
				</section>
				{content}
			</div>
		);
	}
}

function mapStateToProps({ config, people }) {
	const { bucketPaths } = config;
	const { peopleList } = people;
	return { bucketPaths, peopleList };
}

export default connect(mapStateToProps, { fetchPeopleList })(AdminPersonList);
