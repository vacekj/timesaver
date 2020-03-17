import React, { useState } from "react";
// @ts-ignore
import VTTConverter from "srt-webvtt";

function App() {
	const [videoSrc, setVideoSrc] = useState("");
	const [subtitlesSrc, setSubtitlesSrc] = useState("");

	return (
		<div>
			<title>Timesaver</title>
			<main>
				<input
					type="file"
					onChange={e => {
						if (e.target.files) {
							setVideoSrc(URL.createObjectURL(e.target.files[0]));
						}
					}}
					accept={"video/*"}
				/>
				<input
					type="file"
					onChange={e => {
						if (e.target.files) {
							const converter = new VTTConverter(e.target.files[0]);
							converter
								.getURL()
								.then((url: string) => {
									setSubtitlesSrc(url);
								})
								.catch((e: Error) => {
									console.error(e);
								});
						}
					}}
					accept={"file/srt"}
				/>

				<video controls src={videoSrc}>
					{subtitlesSrc && (
						<track
							label={"Subtitles"}
							kind={"subtitles"}
							srcLang={"en"}
							src={subtitlesSrc}
							default
						/>
					)}
				</video>
			</main>
		</div>
	);
}

export default App;
