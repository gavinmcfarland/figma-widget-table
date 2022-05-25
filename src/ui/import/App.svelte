<script>
	// const googleSheetsInput = document.getElementById('googleSheetsInput')
	// const detachApiButton = document.getElementById('detachApiButton')
	let message;
	let googleSheetsInput;
	let detachApiButton;
	let button;
	let upload;
	let googleSheetsButton;
	let googleSheetsSheetNameInput;

	async function onLoad(event) {

		message = event.data.pluginMessage

		detachApiButton.style = "display: none"

		if (message.dataEndpoint?.api === "googleSheets") {
			detachApiButton.style = "display: block"
			googleSheetsInput.value = message.dataEndpoint.url ? message.dataEndpoint.url : null
			if (message.dataEndpoint.sheetName) {
				googleSheetsSheetNameInput.value = message.dataEndpoint.sheetName
			}
			googleSheetsButton.innerHTML = "Refresh"
		}
		else {
			detachApiButton.style = "display: none"
			googleSheetsButton.innerHTML = "Import"
			googleSheetsSheetNameInput.value = ""
		}
		googleSheetsButton.addEventListener("click", () => {

			var url = getUrlId(googleSheetsInput.value)
			var sheetName = googleSheetsSheetNameInput.value

			if (!sheetName.replace(/\s/g, '').length) {
				googleSheetsSheetNameInput.value = ""
			}

			console.log(sheetName)
			if (googleSheetsInput.value && url) {
				gsheetsAPI({
					apiKey: __apiKey__,
					sheetId: url,
					sheetName
				}).then((result) => {
					parent.postMessage({ pluginMessage: { type: "file-received", data: result.values, api: 'googleSheets', url: googleSheetsInput.value, sheetName: googleSheetsSheetNameInput.value } }, '*');
				}).catch(() => {
					parent.postMessage({ pluginMessage: { type: "api-error" } }, '*');
				})
			}
			else {
				console.log("invalid link")
				parent.postMessage({ pluginMessage: { type: "invalid-link" } }, '*');
			}


		})

		if (button) {
			button.addEventListener("click", noFile)
		}

		if (upload) {
			upload.addEventListener('change', readFileAsString)
		}

		if (detachApiButton) {
			detachApiButton.addEventListener("click", () => {
				googleSheetsInput.value = ""
				parent.postMessage({ pluginMessage: { type: "detach-api" } }, '*');
			})
		}


	}



	const gsheetsAPI = async function ({ apiKey, sheetId, sheetName, sheetNumber = 1 }) {
		try {
			const sheetNameStr = sheetName && sheetName !== '' ? encodeURIComponent(sheetName) : `Sheet${sheetNumber}`
			const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetNameStr}?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&key=${apiKey}`;


			let res = await fetch(sheetsUrl)

			const bookUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`;

			const bookRes = await fetch(bookUrl)

			// If the response comes back negative
			if (!res.ok) {

				// If the name hasn't been provided then check the first sheet in the spreadsheet
				if (!sheetName.replace(/\s/g, '').length) {
					let bookJson = await bookRes.json()
					let sheetName = bookJson.sheets[0].properties.title

					const backupSheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&key=${apiKey}`;

					res = await fetch(backupSheetsUrl)

					if (!res.ok) {
						throw new Error('Error fetching GSheet');
					}
				}
				else {
					throw new Error('Error fetching GSheet');
				}

			}





			return res.json();


			// return fetch(sheetsUrl)
			// 	.then(response => {
			// 		if (!response.ok) {
			// 			console.log('there is an error in the gsheets response');
			// 			throw new Error('Error fetching GSheet');
			// 		}

			// 		return response.json();
			// 	})
			// 	.then(data => data)
			// 	.catch(err => {
			// 		throw new Error(
			// 			'Failed to fetch from GSheets API. Check your Sheet Id and the public availability of your GSheet.'
			// 		);
			// 	});
		} catch (err) {

			// const bookUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`;


			// const bookRes = await fetch(bookUrl)

			// // if (!res.ok) {
			// // 	console.log('there is an error in the gsheets response');
			// 	let bookJson = await bookRes.json()
			// 	let sheetName = json.sheets[0].properties.title
			// 	const backupSheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&key=${apiKey}`;

			// 	let res = await fetch(backupSheetsUrl)

			// 	console.log("res", res)

			// 	return res.json()

			// throw new Error('Error fetching GSheet');
			// }
			// throw new Error(`General error when fetching GSheet: ${err}`);
		}
	};

	function noFile() {
		console.log("no file")
		parent.postMessage({ pluginMessage: { type: "no-file" } }, '*');
	}



	function readFileAsString() {
		var files = this.files;
		if (files.length === 0) {
			console.log('No file is selected');
			return;
		}

		var reader = new FileReader();
		reader.onload = function (event) {
			button.removeEventListener("click", noFile)
			button.addEventListener("click", () => {
				parent.postMessage({ pluginMessage: { type: "file-received", data: event.target.result, api: 'file' } }, '*');
			})
		};
		reader.readAsText(files[0]);
	}

	function getUrlId(url) {

		// use a regex to extract the ID
		var expression = url.match(/[-\w]{25,}/);

		if (expression) {
			return expression[0]
		}

	}







</script>

<svelte:window on:message={onLoad} />

<div class="m-xsmall type--small">
	<!-- <div class="input">
  								<textarea id="editor" class="textarea" rows="5"></textarea>
							</div> -->

	<p class="type--bold">Google Sheets</p>
	<div class="input" style="display: flex; gap: 16px">
		<div style="flex-grow: 1">
			<label>Link
				<input style="margin-top: 8px" id="googleSheetsInput" bind:this="{googleSheetsInput}" type="input" class="input__field" /></label>
		</div>
		<div style="width: 80px; flex-grow: 1">
			<label>Sheet Name
				<input style="margin-top: 8px" id="googleSheetsSheetNameInput" bind:this="{googleSheetsSheetNameInput}"type="input" class="input__field"
					placeholder="optional" /></label>
		</div>
	</div>
	<div style="display: flex; gap: 16px"><button class="button button--primary mt-xsmall"
			id="googleSheetsButton"  bind:this="{googleSheetsButton}">Import</button>
		<button class="button button--secondary mt-xsmall" id="detachApiButton" bind:this="{detachApiButton}">Unlink</button>
	</div>

	<br />
	<p class="type--bold">CSV File</p>
	<div class="input" id="drop-area">
		<input id="upload"  bind:this="{upload}" class="upload-file" type="file" accept="csv" />
	</div>
	<button class="button button--primary mt-xsmall" id="button" bind:this="{button}">Import</button>

</div>
