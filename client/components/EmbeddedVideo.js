import React from "react";

function EmbeddedVideo({ autoPlay, muted, src }) {
	return (
		<div className="custom-block video-wrapper">
			<video autoPlay={autoPlay} controls={!autoPlay} muted={muted} loop={true}>
				<source src={src} />
			</video>
		</div>
	);
}

export default EmbeddedVideo;
