import React, { Component } from "react";
import PropTypes from "prop-types";
import { urlRegex } from "~/constants/regex";

class TweetComposer extends Component {
	constructor(props) {
		super(props);

		//Set Refs
		this.textArea = React.createRef();
		this.formattedText = React.createRef();

		//Set Content
		const textContent = props.initialContent.replace(/\\n/gi, "\n");

		this.state = {
			textContent
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = {};

		if (nextProps.textContent) {
			newState.textContent = nextProps.textContent;
		}

		const textContent = newState.textContent || prevState.textContent;

		//Format Text
		const twitterRegex = /[#@](?=[A-Za-z0-9])[A-Za-z0-9_]*/gi;
		const highlightRegex = new RegExp("(" + urlRegex.source + "|" + twitterRegex.source + ")");

		newState.calculatedLength = 0;

		newState.formattedContent = textContent.split(highlightRegex).map((str, key) => {
			let className = "";
			if (str.match(urlRegex)) {
				newState.calculatedLength += 23;
				className = "url";
			} else if (str.match(twitterRegex)) {
				newState.calculatedLength += str.length;
				className = "hashtag";
			} else {
				newState.calculatedLength += str.length;
			}
			return (
				<span className={className} key={key}>
					{str}
				</span>
			);
		});

		if (newState.formattedContent[newState.formattedContent.length - 1].props.children.slice(-1) === "\n") {
			newState.formattedContent.push("\n");
		}

		return newState;
	}

	componentDidMount() {
		const { caretPoint, autoFocus } = this.props;
		const textArea = this.textArea.current;
		if (typeof caretPoint === "number") {
			textArea.setSelectionRange(caretPoint, caretPoint);
		}
		if (autoFocus) {
			textArea.focus();
		}
	}

	componentDidUpdate() {
		this.scrollFormatted();
	}

	updateTextContent(value, cb = () => {}) {
		const { onChange } = this.props;
		if (onChange) {
			onChange(value);
		}
		this.setState({ textContent: value }, cb);
	}

	scrollFormatted() {
		this.formattedText.current.scrollTop = this.textArea.current.scrollTop;
	}

	addVariableToTweet(string) {
		string += " ";

		const { textContent } = this.state;
		const textArea = this.textArea.current;
		const caretPoint = textArea.selectionStart + string.length;
		let newTextContent;

		//If already selected
		if (textArea.selectionStart || textArea.selectionStart == "0") {
			const start = textArea.selectionStart;
			const end = textArea.selectionEnd;
			newTextContent =
				textContent.substring(0, start) + string + textContent.substring(end, this.state.textContent.length);
		} else {
			newTextContent = textArea.value += string;
		}

		this.updateTextContent(newTextContent, () => {
			textArea.setSelectionRange(caretPoint, caretPoint);
			textArea.focus();
		});
	}

	renderTweetVariables() {
		const { variables, variableInstruction } = this.props;
		if (!variables || !variables.length) {
			return null;
		} else {
			const options = variables.map(function (obj) {
				return (
					<option key={obj.value} value={obj.value}>
						{obj.label}
					</option>
				);
			});
			return (
				<select
					className="tweet-composer-variables"
					onChange={ev => this.addVariableToTweet(ev.target.value)}
					value="null"
				>
					<option value="null" disabled>
						{variableInstruction}
					</option>
					{options}
				</select>
			);
		}
	}

	handleSubmit() {
		const { onSubmit } = this.props;
		const { textContent } = this.state;

		onSubmit(textContent);
	}

	render() {
		const { formattedContent, calculatedLength } = this.state;
		const { includeButton } = this.props;
		return (
			<div className="tweet-composer-wrapper">
				<div className="tweet-composer-textbox-wrapper">
					<textarea
						ref={this.textArea}
						className="tweet-composer-source"
						onChange={ev => this.updateTextContent(ev.target.value)}
						onScroll={() => this.scrollFormatted()}
						value={this.state.textContent}
					/>
					<div className="tweet-composer-formatted" ref={this.formattedText}>
						{formattedContent}
					</div>
				</div>
				<div className="tweet-composer-footer">
					<div
						className="tweet-composer-footer-background"
						style={{
							width: (this.state.calculatedLength / 280) * 100 + "%",
							backgroundColor: this.state.calculatedLength > 280 ? "#900" : "#19d"
						}}
					/>
					<div className="tweet-composer-counter">{280 - calculatedLength}</div>
					{this.renderTweetVariables()}
					{includeButton && (
						<button
							className="tweet-composer-submit"
							disabled={calculatedLength > 280}
							onClick={() => this.handleSubmit()}
							type="button"
						>
							Tweet
						</button>
					)}
				</div>
			</div>
		);
	}
}

TweetComposer.propTypes = {
	initialContent: PropTypes.string,
	textContent: PropTypes.string,
	caretPoint: PropTypes.number,
	variables: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, value: PropTypes.string })),
	variableInstruction: PropTypes.string,
	includeButton: PropTypes.bool,
	onChange: PropTypes.func,
	onSubmit: PropTypes.func,
	autoFocus: PropTypes.bool
};

TweetComposer.defaultProps = {
	initialContent: "",
	variables: [],
	variableInstruction: "Add Variable",
	includeButton: true,
	autoFocus: false
};

export default TweetComposer;
