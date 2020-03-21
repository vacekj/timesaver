import React, { createRef } from "react";
import _ from "lodash";
// @ts-ignore
import VTTConverter from "srt-webvtt";

function FileInput(props: React.ComponentProps<"input"> & { icon: string }) {
	return (
		<>
			<label
				className={`hover:bg-gray-800 hover:cursor-pointer
							 bg-gray-700 px-3 py-2 rounded leading-normal ${
					props.checked
						? "hover:bg-green-400 bg-green-300 text-green-800"
						: ""
				}`}
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

interface State {
	videoName: string | null;
	videoSrc: string;
	subtitlesSrc: string;
	nonDialogueSpeed: number;
	dialogueSpeed: number;
	totalLength: number;
	dialogueLength: number;
	cues: TextTrackCue[];
}

class App extends React.Component<any, State> {
	private readonly videoRef: React.RefObject<HTMLVideoElement>;

	constructor(props: any) {
		super(props);
		this.state = {
			videoName: null,
			videoSrc: "",
			subtitlesSrc: "",
			nonDialogueSpeed: 1.5,
			dialogueSpeed: 1,
			totalLength: 0,
			dialogueLength: 0,
			cues: []
		};
		this.videoRef = createRef();
		this.getSavedTime = this.getSavedTime.bind(this);
	}

	onSubtitlesAdded() {
		setTimeout(() => {
			const cues = Array.from(this.videoRef.current?.textTracks[0].cues ?? []);

			const dialogueDuration = _.sum(
				cues.map(cue => {
					return cue.endTime - cue.startTime;
				})
			);

			this.setState({
				dialogueLength: dialogueDuration,
				cues
			});
		}, 500);
	}

	onLoadedMetadata(event: React.SyntheticEvent<HTMLVideoElement>) {
		this.setState({
			totalLength: event.currentTarget.duration
		});

		event.currentTarget.textTracks.onaddtrack = this.onSubtitlesAdded.bind(this);
	}

	getSavedTime() {
		const nonDialogueLength = this.state.totalLength - this.state.dialogueLength;
		const actualNonDialogueLength = nonDialogueLength / this.state.nonDialogueSpeed;

		const actualDialogueLength = this.state.dialogueLength / this.state.dialogueSpeed;

		const actualLength = actualDialogueLength + actualNonDialogueLength;

		return this.state.totalLength - actualLength;
	}

	render() {
		return (
			<div className="h-screen flex flex-col justify-between">
				<nav className="text-gray-200 flex items-center justify-between p-5">
					<h1 className="text-gray-100 text-2xl overflow-hidden w-1/3">
						{this.state.videoName ?? "Timesaver"}
					</h1>
					<div className="w-1/3 flex justify-center items-center">
						<span className="mr-5">
							<FileInput
								name={"Media"}
								icon={"▶ "}
								checked={Boolean(this.state.videoName)}
								accept={"video/*"}
								onChange={e => {
									if (e.target.files) {
										this.setState({
											videoName: e.target.files[0].name,
											videoSrc: URL.createObjectURL(e.target.files[0])
										});
									}
								}}
							/>
						</span>
						<FileInput
							name={"Subtitles"}
							icon={"📄 "}
							checked={Boolean(this.state.subtitlesSrc)}
							accept={"text/srt .srt"}
							onChange={e => {
								if (e.target.files) {
									const converter = new VTTConverter(e.target.files[0]);
									converter
										.getURL()
										.then((url: string) => {
											this.setState({
												subtitlesSrc: url
											});
										})
										.catch((e: Error) => {
											console.error(e);
										});
								}
							}}
						/>
					</div>
					<div className="flex items-center w-1/3 justify-end">
						<div>
							Saved time:{" "}
							{((this.getSavedTime() / this.state.totalLength) * 100).toFixed(2)}% ~{" "}
							{Math.round(this.getSavedTime() / 60)} minutes
						</div>
						<div className="flex flex-col items-center justify-center mr-5">
							<div>
								<span className="text-gray-400 text-sm mr-1">Dialogue speed</span>
								<span className="text-xl font-semibold">
									{this.state.dialogueSpeed.toFixed(1)}
								</span>
							</div>
							<input
								type="range"
								value={this.state.dialogueSpeed}
								step={0.1}
								min={1}
								max={5}
								onChange={e => {
									this.setState({
										dialogueSpeed: Number(e.target.value)
									});
								}}
							/>
						</div>
						<div className="flex flex-col items-center justify-center mr-5">
							<div>
								<span className="text-gray-400 text-sm mr-1">
									Non-dialogue speed
								</span>
								<span className="text-xl font-semibold">
									{this.state.nonDialogueSpeed.toFixed(1)}
								</span>
							</div>
							<input
								type="range"
								value={this.state.nonDialogueSpeed}
								step={0.1}
								min={1}
								max={5}
								onChange={e => {
									this.setState({ nonDialogueSpeed: Number(e.target.value) });
								}}
							/>
						</div>
					</div>
				</nav>
				<main className="text-gray-100 flex flex-col justify-center items-center">
					{this.state.videoSrc ? (
						<div className="rounded p-5 overflow-hidden">
							<video
								ref={this.videoRef}
								controls
								src={this.state.videoSrc}
								onTimeUpdate={e => {
									const isInCue = this.state.cues.find(
										cue =>
											cue.startTime - 1 <= e.currentTarget.currentTime &&
											cue.endTime + 1 >= e.currentTarget.currentTime
									);
									e.currentTarget.playbackRate = isInCue
										? this.state.dialogueSpeed
										: this.state.nonDialogueSpeed;
								}}
								onLoadedMetadata={this.onLoadedMetadata.bind(this)}
							>
								{Boolean(this.state.subtitlesSrc) && (
									<track
										label={"Subtitles"}
										kind={"subtitles"}
										srcLang={"en"}
										src={this.state.subtitlesSrc}
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
}

export default App;
