import React, { SyntheticEvent, useState } from "react";
// @ts-ignore
import VTTConverter from "srt-webvtt";

function FileInput(props: React.ComponentProps<"input"> & { icon: string }) {
	return (
		<>
			<label
				className={`hover:bg-gray-800 hover:cursor-pointer
							 bg-gray-700 px-3 py-2 rounded leading-normal ${props.checked ?
					"hover:bg-green-400 bg-green-300 text-green-800" : ""}`}
				htmlFor={props.name?.toLowerCase()}
			>
				{`${props.checked ? "✅ " : props.icon}${props.name}`}
			</label>
			<input
				id={props.name?.toLowerCase()}
				name={props.name?.toLowerCase()}
				className="hidden"
				type="file"
				{...props}
			/>
		</>
	);
}

function App() {
	const [videoName, setVideoName] = useState<string | null>(null);
	const [videoSrc, setVideoSrc] = useState("");
	const [subtitlesSrc, setSubtitlesSrc] = useState("");

	const [speed, setSpeed] = useState(1.5);
	const [dialogueSpeed, setDialogueSpeed] = useState(1);

	const [isDialogue, setIsDialogue] = useState(false);

	const onPlay = (e: SyntheticEvent<HTMLVideoElement, Event>) => {
		const video = e.target as HTMLVideoElement;
		if (video.textTracks.length > 0) {
			const tracks = video.textTracks;
			const currentTrack = tracks[0];
			currentTrack.oncuechange = _ => {
				const cues = currentTrack.activeCues;
				if (cues.length > 0) {
					setIsDialogue(true);
				} else {
					setIsDialogue(false);
				}
			};
		}
	};

	return (
		<div className="h-screen flex flex-col justify-between">
			<nav className="text-gray-200 flex items-center justify-between p-5">
				<h1 className="text-gray-100 text-2xl overflow-hidden w-1/3">
					{videoName ?? "Timesaver"}
				</h1>
				<div className="w-1/3 flex justify-center items-center">
					<span className="mr-5">
						<FileInput
							name={"Media"}
							icon={"▶ "}
							checked={Boolean(videoName)}
							accept={"video/*"}
							onChange={e => {
								if (e.target.files) {
									setVideoName(e.target.files[0].name);
									setVideoSrc(URL.createObjectURL(e.target.files[0]));
								}
							}}
						/>
					</span>
					<FileInput
						name={"Subtitles"}
						icon={"📄 "}
						checked={Boolean(subtitlesSrc)}
						accept={"text/srt"}
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
					/>
				</div>
				<div className="flex items-center w-1/3 justify-end">
					<span className="mr-2">Speed inside dialogue: {dialogueSpeed}</span>
					<input type="range" value={dialogueSpeed} step={0.1} min={1} max={5} onChange={(e) => {
						setDialogueSpeed(Number(e.target.value));
					}} />
					<span className="mr-2">Speed oustide of dialogue: {speed}</span>
					<input type="range" value={speed} step={0.1} min={1} max={5} onChange={(e) => {
						setSpeed(Number(e.target.value));
					}} />
				</div>
			</nav>
			<main className="text-gray-100 flex flex-col justify-center items-center">
				{videoSrc ? (
					<div className="rounded p-5 overflow-hidden">
						<video
							controls
							src={videoSrc}
							onTimeUpdate={(e) => {
								e.currentTarget.playbackRate = isDialogue ? dialogueSpeed : speed;
							}}
							onPlay={onPlay}
						>
							{Boolean(subtitlesSrc) && (
								<track
									label={"Subtitles"}
									kind={"subtitles"}
									srcLang={"en"}
									src={subtitlesSrc}
									default
								/>
							)}
						</video>
					</div>
				) : (
					<span className="my-5">Add your media using the button above</span>
				)}
			</main>
			<div className="text-center text-gray-600 text-sm py-2">© Josef Vacek</div>
		</div>
	);
}

export default App;
