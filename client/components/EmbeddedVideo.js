import React from "react";
import ErrorBoundary from "~/client/components/ErrorBoundary";

function EmbeddedVideo({ autoPlay, muted, src }) {
	return (
		<ErrorBoundary>
			<div className="custom-block video-wrapper">
				<video autoPlay={autoPlay} controls={!autoPlay} muted={muted} loop={true}>
					<source src={src} />
				</video>
			</div>
		</ErrorBoundary>
	);
}

export default EmbeddedVideo;
