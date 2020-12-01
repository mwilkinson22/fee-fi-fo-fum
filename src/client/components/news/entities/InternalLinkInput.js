//Modules
import React, { Component } from "react";
import icons from "megadraft/lib/icons";

class InternalLinkInput extends Component {
	constructor(props) {
		super(props);
		this.state = {
			url: (props && props.url) || ""
		};
	}

	setLink(event) {
		const { url } = this.state;

		this.props.setEntity({ url });

		this.reset();

		// Force blur to work around Firefox's NS_ERROR_FAILURE
		event.target.blur();
	}

	reset() {
		this.setState({
			url: ""
		});

		this.props.cancelEntity();
	}

	onLinkChange(event) {
		event.stopPropagation();
		const url = event.target.value;

		if (url === "") {
			this.props.cancelError();
		}

		this.setState({ url: url });
	}

	onLinkKeyDown(event) {
		if (event.key == "Enter") {
			event.preventDefault();
			this.setLink(event);
		} else if (event.key == "Escape") {
			event.preventDefault();
			this.reset();
		}
	}

	componentDidMount() {
		this.textInput.focus();
	}

	render() {
		return (
			<div style={{ whiteSpace: "nowrap" }} title="Internal Link">
				<input
					ref={el => {
						this.textInput = el;
					}}
					type="text"
					className="toolbar__input"
					onChange={ev => this.onLinkChange(ev)}
					value={this.state.url}
					onKeyDown={ev => this.onLinkKeyDown(ev)}
					placeholder={"Type the path and press enter"}
				/>
				<span className="toolbar__item" style={{ verticalAlign: "bottom" }}>
					<button
						onClick={this.props.removeEntity}
						type="button"
						className="toolbar__button toolbar__input-button"
					>
						{this.props.entity ? <icons.UnlinkIcon /> : <icons.CloseIcon />}
					</button>
				</span>
			</div>
		);
	}
}

export default InternalLinkInput;
