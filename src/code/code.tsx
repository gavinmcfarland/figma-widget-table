var _ = require('lodash');
const { widget } = figma
const { Frame, Text, Ellipse, Rectangle, SVG, useSyncedState, useSyncedMap, usePropertyMenu, AutoLayout, useEffect, waitForTask, Input, useWidgetId } = widget


// TODO: Add ability to show/add title
// TODO: Add ability to move  columns rows
// TODO: Add ability to set alignment of text
// TODO: Add ability to lock edits when importing Google Spreadsheet
// TODO: Add ability to add links
// TODO: Add ability to insert more than one row or column at a time
// TODO: Add ability to toggle first row header
// TODO: Add ability to hide column letters and row numbers
// TODO: Add some excel forumulars
// TODO: Show currently selected cell
// TODO: Consider positioning menus using cursor coordinates
// TODO: Consider updating iframes to use names of actions

// TODO: Use array instead of string to manage highlighted state of cell DONE
// TODO: See if there's a way to enable refocusing input when UI is moved DISCARD
// TODO: Add setting to change theme of widget
// TODO: Customise border radius of last cell DONE

function evalFunction(js) {

	var value;

	var reg = /(?:[a-z$_][a-z0-9$_]*)|(?:[;={}\[\]"'!&<>^\\?:])/ig,
        valid = true;

    // Detect valid JS identifier names and replace them
    js = js.replace(reg, function ($0) {
        // If the name is a direct member of Math, allow
        if (Math.hasOwnProperty($0))
            return "Math."+$0;
        // Otherwise the expression is invalid
        else
            valid = false;
    });



	if (valid) {
		try {
			// for expressions
			// value = eval(js);
			value = Function('"use strict";return (' + js + ')')()
		} catch (e) {
			// if (e instanceof SyntaxError) {
			// 	try {
			// 		// for statements
			// 		value = (new Function('with(this) { ' + js + ' }')).call(context);
			// 	} catch (e) {}
			// }
			console.log(e)
		}
	}

	return value;
}

function evalData(data) {
	let renderedData = data
	// only run on strings
	if (typeof data === 'string' || data instanceof String) {
		if (data === "=") {
			renderedData = ""
		}
		else if (data.startsWith("=")) {
			let evalCode = evalFunction(data.substring(1))
			if (evalCode || evalCode === 0) {
				renderedData = evalCode
			}
			else {
				renderedData = "#ERROR!"
			}
		}
	}

	return renderedData
}

console.clear()

function numToIndices(num: number): number[] {
	const ret = []
	for (let i = 0; i < num; i++) {
		ret.push(i)
	}
	return ret
}

// function getNumberColumnsAndRows(entries) {
// 	function onlyUnique(value, index, self) {
// 		return self.indexOf(value) === index;
// 	}

// 	let rowIndices = []
// 	let colIndices = []

// 	entries.map((entry) => {
// 		let [colId, rowId] = entry[0].split(':')
// 		colIndices.push(colId)
// 		rowIndices.push(rowId)
// 	})

// 	return {
// 		cols: colIndices.filter(onlyUnique).length,
// 		rows: rowIndices.filter(onlyUnique).length
// 	}
// }

function convertToNumber(data) {
	if (Number(data)) {
		return Number(data)
	}
	else {
		return data
	}
}
const CSVToArray = (data, delimiter = /,|;/, omitFirstRow = false) =>
  data
    .slice(omitFirstRow ? data.indexOf('\n') + 1 : 0)
    .split('\n')
    .map(v => v.split(delimiter));

const transpose = (matrix) => {
  let [row] = matrix
  return row.map((value, column) => matrix.map(row => row[column]))
}

// const mapToArray = (map) => {
// 	console.log(map)
// 	// Array.from(map.values());
// }

const componentProps = {
	headerCell: {
		fill: { "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0.9624999761581421, "g": 0.9624999761581421, "b": 0.9624999761581421, "a": 1 } }
	},
	defaultCell: {
		fill: { "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 1, "g": 1, "b": 1, "a": 1 } }
	}
}

const alphabet = [
	'', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
]





function cellHeight(height) {
	if (height > 277) {
		height = 277+94
	} else {
		height += 94
	}

	return height
}



function Main() {

	// let [count, setCount] = useSyncedState("count", 0)

	let [increment, setIncrement] = useSyncedState("increment", 0)

	function genRandomId(index = 1, manIncrement) {

		var uniqueId
		if (manIncrement) {
			uniqueId = `${figma.currentUser.id}${figma.currentUser.sessionId}${manIncrement}-${index}`
		}
		else {
			uniqueId = `${figma.currentUser.id}${figma.currentUser.sessionId}${increment}-${index}`
			setIncrement(increment + 1)
		}

		// var uniqueId = uniqueId = `${figma.currentUser.id}${figma.currentUser.sessionId}-${index}`



		return uniqueId
	}

	const [isInitialized, setIsInitialized] = useSyncedState<boolean>('init', false)
	const [version, setVersion] = useSyncedState('version', 1)
	const widgetId = useWidgetId()

	let tableCells = useSyncedMap("tableCells")
	let tableCols = useSyncedMap("tableCols")
	let tableRows = useSyncedMap("tableRows")
	let activeCells = useSyncedMap("activeCells")

	let [widgetTheme, setWidgetTheme] = useSyncedState("widgetTheme", "light");
	let [dataEndpoint, setDataEndpoint] = useSyncedState("dataEndpoint", null)
	let [widgetSettings, setWidgetSettings] = useSyncedState("widgetSettings", null)
	let [widgetName, setWidgetName] = useSyncedState("widgetName", "")
	let [widgetFirstRowAsHeader, setWidgetFirstRowAsHeader] = useSyncedState("widgetFirstRowAsHeader", true);

	// Check activeUsers still exist
	useEffect(() => {
		// waitForTask(new Promise(resolve => {


			// figma.on('close', () => {
				// Find inactive users
				let entries = activeCells.entries()

				entries.map(entry => {
					let inactiveUsers: any = [];
					let activeUserIds = figma.activeUsers.map(a => a.id);
					let activeUserSessionIds = figma.activeUsers.map(a => a.sessionId);

					entry[1].users.map((user) => {

						if (!(activeUserIds.includes(user.id) && activeUserSessionIds.includes(user.sessionId))) {

							// Remove user from list of users
							entry[1].users.splice(entry[1].users.indexOf(user), 1)
							inactiveUsers.push(user)

						}

						if (inactiveUsers.length > 0) {

							if (entry[1].users.length > 0) {
								activeCells.set(entry[0], entry[1])
							}
							else {
								activeCells.delete(entry[0])
							}
						}

					})

				})

				// resolve()
			// })

		// }))
	})


	// let [widgetColor, setWidgetColor] = useSyncedState("widgetColor", "#9747FF")
	let [widgetColor, setWidgetColor] = useSyncedState("widgetColor", "#9747FF")

	let showCellsBeingEdited = true




	function putEntriesIntoArray(map) {
		var entries = map.entries()

		// put entries in order

		entries.sort((a, b) => {
			if (a[1].order > b[1].order) return 1;
			if (b[1].order > a[1].order) return -1;

			return 0;
		})

		// then reduce down to just an array of single items

		entries.map((item) => {
			item.pop()
			return item
		})
		return entries
	}

	function addActiveCell(id) {

		let activeCell = activeCells.get(id)
		let currentUser = {
			id: figma.currentUser.id,
			sessionId: figma.currentUser.sessionId,
			color: figma.currentUser.color
		}

		// If activeCell doesn't exist, create it
		if (!activeCell) {
			activeCells.set(id , {
				users: [currentUser]
			})

		}
		// If it does then add new user
		else {
			if (activeCell.users) {
				if (!activeCell.users.some(user => user.id === currentUser.id && user.sessionId === currentUser.sessionId)) {
					activeCell.users.unshift(currentUser)
					activeCells.set(id, {users: activeCell.users})
				}
			}


		}



	}

	function removeActiveCell(id) {

		let activeCell = activeCells.get(id)

		// filter active users
		if (activeCell) {
			// Remove user entry if id and session dones't match current user
			let users = activeCell.users.filter((user) => !(user.id === figma.currentUser.id && user.sessionId === figma.currentUser.sessionId))

			// If no users then remove active cell from map
			if (users.length === 0) {
				activeCells.delete(id)
			}
			else {
				// Otherwise set new data to entry in map
				activeCell.users = users
				activeCells.set(id, activeCell)
			}
		}

	}

	function setTheme(color) {
		/*
		From this W3C document: http://www.webmasterworld.com/r.cgi?f=88&d=9769&url=http://www.w3.org/TR/AERT#color-contrast
		Color brightness is determined by the following formula:
		((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000
		*/
		var threshold = 160; /* about half of 256. Lower threshold equals more dark text on dark background  */
		var cBrightness = ((color.r * 255 * 299) + (color.g * 255 * 587) + (color.b * 255 * 114)) / 1000;

		if (cBrightness > threshold || figma.editorType === "figjam"){
			setWidgetTheme("light")
		}
		else {
			setWidgetTheme("dark")
		}
	}

	function updateColumnSizeData() {
		// Migrate changes to data on render

		// Get cols
		let cols = tableCols.entries()

		// Loop table cols
		for (let i = 0; i < cols.length; i++) {
			let [id, data] = cols[i]

			if (data.size === "small") {
				data.size = 144;
			}
			if (data.size === "medium") {
				data.size = 240;
			}
			if (data.size === "large") {
				data.size = 480;
			}

			tableCols.set(id, data)
		}

	}



	useEffect(() => {
		if (!isInitialized) {


			setTheme(figma.currentPage.backgrounds[0].color)

			// let color = {r: 0.11764705926179886, g: 0.11764705926179886, b: 0.11764705926179886}
			// if (JSON.stringify(figma.currentPage.backgrounds[0].color) === JSON.stringify(color)) {
			// 	console.log("dark theme")
			// 	setWidgetTheme("dark")
			// }
			numToIndices(3).map((item, i) => {
				tableCols.set(genRandomId(i), { order: i, size: "medium" })
			})

			numToIndices(4).map((item, i) => {
				tableRows.set(genRandomId(i), { order: i})
			})

			setIsInitialized(true)
		}
		if (version < 2) {
			updateColumnSizeData()
			setVersion(2)
			console.log("Column size data updated")
		}
	})

	let theme : any;

	if (widgetTheme === "light") {
		theme = {
			colorBg: "#fff",
			colorBgSecondary: "#f5f5f5",
			colorBgTertiary: "#e6e6e6",
			colorBgHeaderCell: "#f5f5f5",
			colorText: "#000",
			colorTextSecondary: { "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0, "g": 0, "b": 0, "a": 0.8 } },
			colorTextTertiary: { "type": "solid", "visible": true, "blendMode": "normal", "color": { "r": 0, "g": 0, "b": 0, "a": 0.4 } },
			colorBorder: "#e6e6e6",
			colorBorderGradient: {
				type: "gradient-linear",
				gradientHandlePositions:
				  [
					{ x: 0.5, y: 0 },
					{ x: 0.5, y: 1 },
					{ x: 1, y: 0 },
				  ],
				gradientStops: [
				  {
					position: 0,
					color: {
					  r: 0.9019607901573181,
					  g: 0.9019607901573181,
					  b: 0.9019607901573181,
					  a: 0,
					},
				  },
				  {
					position: 0.7135416865348816,
					color: {
					  r: 0.9019607901573181,
					  g: 0.9019607901573181,
					  b: 0.9019607901573181,
					  a: 1,
					},
				  },
				],
			  },
			colorHover: "#FAFAFA",
			shadowBorderLeft: [{ "type": "inner-shadow", "color": { "r": 0.8980392217636108, "g": 0.8980392217636108, "b": 0.8980392217636108, "a": 1 }, "offset": { "x": 1, "y": 0 }, "spread": 0, "visible": true, "blendMode": "normal", "showShadowBehindNode": false, "blur": 0 }],
			shadowBorderBottom: [{ "type": "inner-shadow", "color": { "r": 0.8980392217636108, "g": 0.8980392217636108, "b": 0.8980392217636108, "a": 1 }, "offset": { "x": 0, "y": -1 }, "spread": 0, "visible": true, "blendMode": "normal", "showShadowBehindNode": false, "blur": 0 }]
		}
	}

	if (widgetTheme === "dark") {
		theme = {
			colorBg: "#2c2c2c",
			colorBgSecondary: "#383838",
			colorBgTertiary: "#444444",
			colorBgHeaderCell: "#383838",
			colorText: "#fff",
			colorTextSecondary: { "type": "solid", "visible": true, "blendMode": "normal", "color": { "r": 1, "g": 1, "b": 1, "a": 0.8 } },
			colorTextTertiary: { "type": "solid", "visible": true, "blendMode": "normal", "color": { "r": 1, "g": 1, "b": 1, "a": 0.4 } },
			colorBorder: "#444444",
			colorBorderGradient: {
				type: "gradient-linear",
				gradientHandlePositions:
				  [
					{ x: 0.5, y: 0 },
					{ x: 0.5, y: 1 },
					{ x: 0, y: 0 },
				  ],
				gradientStops: [
				  {
					position: 0,
					color: {
					  r: 0.2666666805744171,
					  g: 0.2666666805744171,
					  b: 0.2666666805744171,
					  a: 0,
					},
				  },
				  {
					position: 0.7135416865348816,
					color: {
					  r: 0.2666666805744171,
					  g: 0.2666666805744171,
					  b: 0.2666666805744171,
					  a: 1,
					},
				  },
				],
			  },
			colorHover: "#313131",
			shadowBorderLeft: [{ "type": "inner-shadow", "color": { "r": 75 / 255, "g": 75 / 255, "b": 75 / 255, "a": 1 }, "offset": { "x": 1, "y": 0 }, "spread": 0, "visible": true, "blendMode": "normal", "showShadowBehindNode": false, "blur": 0 }],
			shadowBorderBottom: [{ "type": "inner-shadow", "color": { "r": 75 / 255, "g": 75 / 255, "b": 75 / 255, "a": 1 }, "offset": { "x": 0, "y": -1 }, "spread": 0, "visible": true, "blendMode": "normal", "showShadowBehindNode": false, "blur": 0 }]
		}
	}


	let cols = putEntriesIntoArray(tableCols).length === 0 ? ['1', '2', '3'] : putEntriesIntoArray(tableCols)
	let rows = putEntriesIntoArray(tableRows).length === 0 ? ['1', '2', '3'] : putEntriesIntoArray(tableRows)


	// useEffect(() => {
	// 	waitForTask(new Promise (resolve => {
	// 		tableData.set('1:1', '1')
	// 		tableData.set('1:2', '2')
	// 		tableData.set('2:2', '3')
	// 		resolve()
	// 	}))
	// })


	function setWidth(col) {
		var width = col?.size

		// This is needed temporarily because widget needs to render once before recieveing updated state
		if (col?.size === "small") {
			width = 144;
		}
		if (col?.size === "medium") {
			width = 240;
		}
		if (col?.size === "large") {
			width = 480;
		}

		return width
	}

	function resizeColumn(colIndex, size) {
		var colData = tableCols.get(colIndex)
		size = convertToNumber(size)
		tableCols.set(colIndex, { ...colData, size })
	}

	function addColumn(colIndex, position = 1) {
		var uniqueId = genRandomId(colIndex + 1)


		var virtualEntries = tableCols.entries()

		// 1. Sort the entries in order
		virtualEntries.sort((a, b) => {
			if (a[1].order > b[1].order) return 1;
			if (b[1].order > a[1].order) return -1;

			return 0;
		})

		// 2. Set new col entry
		tableCols.set(uniqueId, { order: '', size: 'medium' })


		// 2. Splice new entry into virtualEntries
		virtualEntries.splice(colIndex + position, 0, [uniqueId, { order: '', size: 'medium' }])

		// 4. Reset order on entries now that new column has been created
		virtualEntries.map((entry, i) => {
			tableCols.set(entry[0], { ...entry[1], order: i, size: entry[1].size })
		})

	}

	function moveColumn(colIndex, position = 1) {

		function move(array, from, to){
			array.splice(to, 0, array.splice(from,1)[0]);
			return array;
		};

		var virtualEntries = tableCols.entries()

		if ((colIndex + position) > 0 && (colIndex + position) < virtualEntries.length) {

			// 1. Sort the entries in order
			virtualEntries.sort((a, b) => {
				if (a[1].order > b[1].order) return 1;
				if (b[1].order > a[1].order) return -1;

				return 0;
			})

			virtualEntries = move(virtualEntries, colIndex, colIndex + position)

			// 4. Reset order on entries now that new column has been created
			virtualEntries.map((entry, i) => {
				tableCols.set(entry[0], { ...entry[1], order: i, size: entry[1].size })
			})
		}

	}

	function moveRow(rowIndex, position = 1) {

		function move(array, from, to){
			array.splice(to, 0, array.splice(from,1)[0]);
			return array;
		};

		var virtualEntries = tableRows.entries()

		if ((rowIndex + position) > 0 && (rowIndex + position) < virtualEntries.length) {
			// 1. Sort the entries in order
			virtualEntries.sort((a, b) => {
				if (a[1].order > b[1].order) return 1;
				if (b[1].order > a[1].order) return -1;

				return 0;
			})

			virtualEntries = move(virtualEntries, rowIndex, rowIndex + position)

			// 4. Reset order on entries now that new column has been created
			virtualEntries.map((entry, i) => {
				tableRows.set(entry[0], { ...entry[1], order: i, size: entry[1].size })
			})
		}

	}

	function addRow(rowIndex, position = 1) {
		var uniqueId = genRandomId(rowIndex + 1)


		var virtualEntries = tableRows.entries()

		// 1. Sort the entries in order
		virtualEntries.sort((a, b) => {
			if (a[1].order > b[1].order) return 1;
			if (b[1].order > a[1].order) return -1;

			return 0;
		})

		// 2. Set new col entry

		tableRows.set(uniqueId, { order: '' })

		// 2. Splice new entry into virtualEntries
		virtualEntries.splice(rowIndex + position, 0, [uniqueId, { order: '' }])


		// 4. Reset order on entries now that new column has been created
		virtualEntries.map((entry, i) => {
			tableRows.set(entry[0], { ...entry[1], order: i })
		})

	}

	// TODO: Update do it doesn't mutate original table
	function removeColumn(colId) {
		// Delete column
		tableCols.delete(colId)

		// Delete associated entries
		for (let i = 0; i < tableCells.entries().length; i++) {
			var entry = tableCells.entries()[i]
			if (entry[0].startsWith(colId)) {
				tableCells.delete(entry[0])
			}
		}
	}


	function removeRow(rowId) {
		// Delete column
		tableRows.delete(rowId)

		// Delete associated entries
		for (let i = 0; i < tableCells.entries().length; i++) {
			var entry = tableCells.entries()[i]
			if (entry[0].endsWith(rowId)) {
				tableCells.delete(entry[0])
			}
		}
	}

	function editCell(id, colIndex, rowIndex, cols, rows, event) {

		const widgetNode = figma.getNodeById(widgetId) as WidgetNode;

		let widgetX = ((figma.viewport.bounds.x + figma.viewport.bounds.width) - (50 / figma.viewport.zoom) - (300 / figma.viewport.zoom)) , widgetY = (figma.viewport.bounds.y + (50 / figma.viewport.zoom));

		// (166 * 2) (300 * 2)

		let {data, active} = tableCells.get(id) || { data: '', active: false }
		let [colId, rowId] = id.split(':')
		let currentCellId = id;

		// Gets the colour of first cell first clicked (not previous)
		let previousCellColor = active


		const onmessage = (message) => {
			// if (message.type === "window-loaded") {
			// 	if (showCellsBeingEdited) {

			// 		// tableCells.set(id, { data, active: figma.currentUser.color })

			// 		// When plugin window is opened add active colour to cell
			// 		addActiveCell(id)
			// 	}
			// }
			if (message.type === "next-cell") {

				({ colIndex, rowIndex } = message.data)

				// // When we receive the data it's a string, so we need to convert any numbers to numbers
				// data = convertToNumber(data)

				if (showCellsBeingEdited) {
					// Reset current cell color before moving onto next
					// let liveData = tableCells.get(currentCellId).data
					// tableCells.set(currentCellId, { data: liveData, active: previousCellColor })
					removeActiveCell(currentCellId)
				}

				if (message.target) {

					if (message.target[0] === 1) {
						if ((colIndex + 1) > 0 && (colIndex + 1) < (cols.length)) {
							colIndex = colIndex + 1
						}
						colId = cols[colIndex]
					}
					else if (message.target[0] === -1) {
						if ((colIndex - 1) > 0 && (colIndex - 1) < (cols.length + 1)) {
							colIndex = colIndex - 1
						}
						colId = cols[colIndex]
					}
					else if (message.target[1] === 1) {
						if ((rowIndex + 1) > 0 && (rowIndex + 1) < (rows.length)) {
							rowIndex = rowIndex + 1
						}
						rowId = rows[rowIndex]

					}
					else if (message.target[1] === -1) {
						if ((rowIndex - 1) > 0 && (rowIndex - 1) < (rows.length + 1)) {
							rowIndex = rowIndex - 1
						}
						id = `${colId}:${rows[rowIndex]}`
						rowId = rows[rowIndex]

					}

					// Change the current cell ID to the new newly selected cell
					currentCellId = `${colId}:${rowId}`

					var nextCell = tableCells.get(currentCellId) || { data: '', active: false }

					if (showCellsBeingEdited) {
						// Store the cell colour
						// previousCellColor = nextCell.active

						// tableCells.set(currentCellId, { data: nextCell.data, active: figma.currentUser.color })

						// Add color to next cell
						addActiveCell(currentCellId)
					}

					figma.ui.postMessage({ type: "post-data", data: {data: nextCell.data, rowIndex, colIndex} })

				}

			}

			if (message.type === "data-received") {

				data = message.data.data
				let isLink = message.data.link

				if (Number(message.data)) {
					data = Number(message.data.data)
				}

				let link = ""
				if (isLink) {
					if (data.startsWith("http://") || data.startsWith("https://")) {
						link = data
					}
					else {

						// TODO: Mailto: not supported by href on Text
						// var expression = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gm
						// var regex = new RegExp(expression);
						// if (data.match(regex)) {
						// 	link = "mailto:" + data
						// 	console.log(link)
						// }
						// else {
							link = "http://" + data
						// }

					}

				}

				// if (data === "=") {
				// 	data = ""
				// }

				tableCells.set(currentCellId, { data, active, link})

				if (showCellsBeingEdited) {
					addActiveCell(currentCellId)
				}

				// figma.commitUndo();

			}

			if (message.type === "resize-ui") {
				figma.ui.resize(300, cellHeight(message.data.textareaHeight))
			}

			if (message.type === "close-plugin") {
				figma.closePlugin()
			}
		}

		return new Promise((resolve) => {

				figma.clientStorage.getAsync("userPreferences").then((settings) => {
					settings = settings || { navigateOnEnter: false }

					if (showCellsBeingEdited) {

						// tableCells.set(id, { data, active: figma.currentUser.color })

						// When plugin window is opened add active colour to cell
						addActiveCell(id)
					}

					figma.showUI(`<style>${__uiFiles__["css"]}</style>${__uiFiles__["editCell"]}`, { title: "Cell", width: 300, height: cellHeight(31), themeColors: true });
					figma.ui.postMessage({ type: "show-ui", settings })
					figma.ui.postMessage({ type: "post-data", data: {data, rowIndex, colIndex } })

					// if (showCellsBeingEdited) {

					// 	// tableCells.set(id, { data, active: figma.currentUser.color })

					// 	// When plugin window is opened add active colour to cell
					// 	addActiveCell(id)
					// }

				})

				figma.ui.on('message', onmessage)

				if (showCellsBeingEdited) {
					figma.on('close', () => {
						removeActiveCell(currentCellId)
					})
				}


		})

	}

	// function sortColumn(table, colIndex) {
	//   console.log(sortDescending)
	//   if (sortDescending)
	//     setSort(false)
	//   else {
	//     setSort(true)
	//   }

	//   var transposedTable = transpose(table)
	//   var columnData = transposedTable[colIndex]
	//   var columnHeader = columnData.shift()
	//   var sortedData = columnData.sort()

	//   if (sortDescending) {
	//     columnData.reverse()
	//   }

	//   var newColumnData = [columnHeader, ...sortedData]

	//   // Replace column in table
	//   transposedTable[colIndex] = newColumnData

	//   // Transpose table again
	//   var normalTable = transpose(transposedTable)
	//   setTable(normalTable)
	//   console.log(transposedTable)
	//   // console.log(table[0][colIndex])
	// }

	function checkTable(table) {

		var numberRows = table.length
		var numberColumns = table[0].length

		var pass = true

		if (numberColumns > 100 || numberRows > 100) {
			pass = false
		}

		return pass
	}

	function sortTable(id, rows, sortDescending = false) {

		// Find the entries in that column

		var colEntries = []

		// FIXME: Can't rely on order of map. Try finding another way to get entries because some are undefined.
		for (let i = 0; i < rows.length; i++) {
			let rowId = rows[i]
			let colId = id
			let cellId = `${colId}:${rowId}`
			var setData = tableCells.get(cellId) || { data: '', active: false };

			setData.data = convertToNumber(setData.data)

			colEntries.push([cellId, setData])

		}



		// Remove the entry which is the letterCell then the header?
		var firstColEntry = colEntries.shift()

		var secondColEntry

		if (widgetFirstRowAsHeader) {
			secondColEntry = colEntries.shift()
		}




		// Sort the entries in that column
		colEntries.sort((a, b) => {
			// // Ensures that blank entries are allways at the bottom
			if(a[1].data === '' || a[1].data === null) return 1;
			if(b[1].data === '' || b[1].data === null) return -1;

			if(a[1].data === b[1].data) return 0;

			// // Reverse the sorting
			// if (sortDescending) {
			// 	return  evalData(a[1].data) > evalData(b[1].data) ? -1 : 1;
			// }
			// else {
			// 	return evalData(a[1].data) < evalData(b[1].data) ? -1 : 1;
			// }

			// Reverse the sorting
			if (sortDescending) {
				return  a[1].data > b[1].data ? -1 : 1;
			}
			else {
				return a[1].data < b[1].data ? -1 : 1;
			}

		})

		// Add back the first entry which is the header?
		if (widgetFirstRowAsHeader) {
			colEntries.splice(0, 0, secondColEntry)
		}

		colEntries.splice(0, 0, firstColEntry)

		// Assign a new order to the rows
		colEntries.map((entry, i) => {
			if (entry) {
				let [colId, rowId] = entry[0].split(":")
				tableRows.set(rowId, { order: i })
			}

		})

	}

	// useEffect(() => {
	//   waitForTask(new Promise((resolve) => {

	//       setWidgetState({
	//         selected: false
	//       })
	//     )

	//     resolve()
	//   }));
	// });

	// addNumbersAndLetters(table)

	function colorSvg(color) {
		if (color === widgetColor) {
			return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="14" cy="14" r="13" stroke="#9747FF" stroke-width="2"/>
<circle cx="14" cy="14" r="10" fill="${color}"/>
</svg>
`
		} else {
			return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="14" cy="14" r="10" fill="${color}"/>
</svg>`
		}

	}

	function deleteAllEntries(map) {
		var entries = map.entries()
		for (let i = 0; i < entries.length; i++) {
			// if (i === 0) {

			// }
			// else {
				var entry = entries[i]
				map.delete(entry[0])
			// }
		}
	}

	let iconSize = 16;

	if (figma.editorType === "figjam") {
		iconSize = 18
	}

	let colorItems = [
		{
			tooltip: '❤️ Ukraine',
			propertyName: 'ukraine',
			itemType: 'action',
			icon: (() => {
				if (widgetColor === 'ukraine') {
					return `<svg width="${iconSize}" height="${iconSize}"  fill="none" xmlns="http://www.w3.org/2000/svg">
					<mask id="mask0_2_56" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${iconSize}" height="${iconSize}">
					<rect width="${iconSize}" height="${iconSize}" rx="${iconSize / 2}" fill="#D9D9D9"/>
					</mask>
					<g mask="url(#mask0_2_56)">
					<rect width="${iconSize}" height="${iconSize / 2}" fill="#006ADB"/>
					<rect y="${iconSize / 2}" width="${iconSize}" height="${iconSize / 2}" fill="#FDD403"/>
					<rect x="0.5" y="0.5" width="${iconSize - 1}" height="${iconSize - 1}" rx="7.5" stroke="white" stroke-opacity="0.16" style="mix-blend-mode:screen"/>
					</g>
					</svg>
					`
				} else {
					return `<svg width="${iconSize}" height="${iconSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
					<g style="mix-blend-mode:luminosity">
					<mask id="mask0_2_49" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${iconSize}" height="${iconSize}">
					<rect width="${iconSize}" height="${iconSize}" rx="${iconSize / 2}" fill="#D9D9D9"/>
					</mask>
					<g mask="url(#mask0_2_49)">
					<rect width="${iconSize}" height=" ${iconSize / 2}" fill="#575757"/>
					<rect y="${iconSize / 2}" width="${iconSize}" height="${iconSize / 2}" fill="#C9C9C9"/>
					<rect x="0.5" y="0.5" width="${iconSize - 1}" height="${iconSize - 1}" rx="7.5" stroke="white" stroke-opacity="0.16" style="mix-blend-mode:screen"/>
					</g>
					</g>
					</svg>

					`
				}
			})()
		}
	]

	usePropertyMenu(
		[
			...colorItems,
			{
				itemType: 'color-selector',
        		propertyName: 'colorSelector',
        		tooltip: 'Color',
        		selectedOption: widgetColor,
        		options: [
					{	option: "#E05A33",
						tooltip: "Red"
					},
					{	option: "#F6C944",
						tooltip: "Yellow"
					},
					{	option: "#4DA660",
						tooltip: "Green"
					},
					{	option: "#739AF0",
						tooltip: "Blue"
					},
					{
						option: "#9747FF",
						tooltip: "Purple"
					},
					{	option: "#C6803E",
						tooltip: "Brown"
					},
					{	option: "#545454",
						tooltip: "Grey"
					}
				],

			},
			{
				tooltip: 'Import',
				propertyName: 'import',
				itemType: 'action',
				icon: `<svg width="${iconSize}" height="${iconSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M7.64645 11.3534L8 11.7069L8.35355 11.3534L11.3536 8.35337L10.6464 7.64626L8.5 9.79271L8.5 1.99982H7.5L7.5 9.79271L5.35355 7.64626L4.64645 8.35337L7.64645 11.3534ZM2 11.9998H1V13.9999V14.9998V14.9999H15V14.9998V13.9999V11.9998H14V13.9999H2V11.9998Z" fill="white"/>
				</svg>`
			},
			{
				tooltip: 'Settings',
				propertyName: 'settings',
				itemType: 'action',
				icon: `<svg width="${iconSize}" height="${iconSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M4 8.05001V1H5V8.05001C6.14112 8.28164 7 9.29052 7 10.5C7 11.7095 6.14112 12.7184 5 12.95V15H4V12.95C2.85888 12.7184 2 11.7095 2 10.5C2 9.29052 2.85888 8.28164 4 8.05001ZM6 10.5C6 11.3284 5.32843 12 4.5 12C3.67157 12 3 11.3284 3 10.5C3 9.67157 3.67157 9 4.5 9C5.32843 9 6 9.67157 6 10.5ZM11 15H12V7.94999C13.1411 7.71836 14 6.70948 14 5.5C14 4.29052 13.1411 3.28164 12 3.05001V1H11V3.05001C9.85888 3.28164 9 4.29052 9 5.5C9 6.70948 9.85888 7.71836 11 7.94999V15ZM13 5.5C13 4.67157 12.3284 4 11.5 4C10.6716 4 10 4.67157 10 5.5C10 6.32843 10.6716 7 11.5 7C12.3284 7 13 6.32843 13 5.5Z" fill="white"/>
				</svg>
				`
			}
		],
		async ({ propertyName, propertyValue }) => {
			if (propertyName === "ukraine") setWidgetColor("ukraine")


			if (propertyName === "colorSelector") {
				setWidgetColor(propertyValue)
			}
			// if (propertyName === "colorGrey") setWidgetColor("#545454")
			// if (propertyName === "colorRed") setWidgetColor("#E05A33")
			// if (propertyName === "colorYellow") setWidgetColor("#F6C944")
			// if (propertyName === "colorGreen") setWidgetColor("#4DA660")
			// if (propertyName === "colorBlue") setWidgetColor("#739AF0")
			// if (propertyName === "colorBrown") setWidgetColor("#C6803E")

			// if (propertyName === 'clear') {
			// 	// console.log("reset")
			// 	// deleteAllEntries(tableCols)
			// 	// deleteAllEntries(tableRows)
			// 	// deleteAllEntries(tableCells)

			// 	// numToIndices(3).map((item, i) => {
			// 	// 	tableCols.set(genRandomId(i), { order: i })
			// 	// 	tableRows.set(genRandomId(i), { order: i })
			// 	// })

			// 	tableCells.entries().map((entry) => {
			// 		tableCells.delete(entry[0])
			// 	})
			// }
			if (propertyName === 'settings') {
				await new Promise<void>((resolve) => {

					figma.clientStorage.getAsync("userPreferences").then((settings) => {
						settings = settings || { navigateOnEnterInput: false }


						figma.showUI(`
					<style>${__uiFiles__["css"]}</style>
					${__uiFiles__["settings"]}
          `, { title: "Settings", width: 300, height: 304+16+16, themeColors: true });

						figma.ui.postMessage({ type: "post-settings", settings, widgetSettings, widgetTheme, widgetFirstRowAsHeader })


						function exportToString(rows, cols) {
							var string = ""
							for (var i = 0; i < rows.length; i++) {
								var rowId = rows[i]
								if (i > 0) {
									var rowString = ""
									for (let x = 0; x < cols.length; x++) {
										var colId = cols[x]

											if (x > 0) {
												var cellData = tableCells.get(`${colId}:${rowId}`) || { data: '' }
												if (typeof cellData.data === "undefined") {
													cellData.data = ''
												}
												if (x !== cols.length - 1) {
													cellData.data += ', '
												}
												rowString += cellData.data
											}
									}
									if (i !== rows.length - 1) {
										rowString += '\n '
									}
									string += rowString
								}
							}
							return string
						}



						figma.ui.onmessage = (message) => {

							if (message.type === "settings-saved") {
								figma.clientStorage.setAsync("userPreferences", message.settings)
							}
							if (message.type === "widget-settings-saved") {
								setWidgetSettings(message.settings)

								if (message.settings?.showCellsBeingEdited === false) {
									activeCells.entries().map((entry) => {
										activeCells.delete(entry[0])
									})
								}
							}
							if (message.type === "widget-theme-saved") {
								setWidgetTheme(message.theme)
							}
							if (message.type === "widget-first-row-as-header-saved") {
								setWidgetFirstRowAsHeader(message.firstRowAsHeader)
							}
							if (message.type === "clear-table") {
								tableCells.entries().map((entry) => {
									tableCells.delete(entry[0])
								})
							}
							if (message.type === "export-data") {
								var exportedString = exportToString(rows, cols)
								figma.ui.postMessage({ type: "export-data", exportedString })
							}
						}
					})


				})
			}
			if (propertyName === 'import') {
				// console.log("import")
				await new Promise<void>((resolve) => {


					figma.showUI(`
					<style>${__uiFiles__["css"]}</style>
					${__uiFiles__["import"]}
          `, { title: "Import", width: 340, height: 252 + 16 + 16, themeColors: true });

					// if (dataEndpoint) {
						figma.ui.postMessage({ dataEndpoint })
					// }

					figma.ui.onmessage = (message) => {
						// console.log(CSVToArray(message))
						if (message.type === "file-received") {
							const handler = figma.notify("Importing data...", {timeout: 600});

							var origDataEndpoint = dataEndpoint
							if (message.api !== "file") {
								let { api, url, sheetName } = message

								setDataEndpoint({api, url, sheetName})
								dataEndpoint = {api, url, sheetName}
							}
							else {
								setDataEndpoint({api: message.api})
								dataEndpoint = {api: message.api}
							}


							var newTable
							if (Array.isArray(message.data)) {
								newTable = message.data
							}
							else {
								newTable = CSVToArray(message.data.replace(/^\s+|\s+$/g, ''))
							}


							// Import table
							if (checkTable(newTable)) {

								// TODO: How can I wait for data to be set?

								// Create a clone of the originalTableCols so we can merge their values back into the table
								var origTableCols = _.cloneDeep(tableCols.entries())
								origTableCols.shift()


								// Delete existing data
								deleteAllEntries(tableCells)
								deleteAllEntries(tableCols)
								deleteAllEntries(tableRows)


								// This adds the table letters and numbers
								numToIndices(1).map((item, i) => {
									tableCols.set(genRandomId(i), { order: i })
									tableRows.set(genRandomId(i), { order: i })
								})


								// // Create a serries of entries
								// // Generate ids for cols

								var cols = []

								var colId;
								for (let r = 0; r < newTable.length; r++) {
									var row = newTable[r]

									var rowId = genRandomId(r + 1)
									tableRows.set(`${rowId}`, { order: r })

									for (let c = 0; c < row.length; c++) {
										var cell = row[c]
										if (r === 0) {
											colId = genRandomId(c + 1)
											cols.push(colId)
										}
										cell = convertToNumber(cell)
										tableCells.set(`${cols[c]}:${rowId}`, { data: cell })
									}
								}

								// TODO: Need to add existing size?
								for (let c = 0; c < cols.length; c++) {
									var colId = cols[c]

									// We make a clone of the original tableCols array it gets deleted, then we can merge the data back in
									// Just merge size for now as not sure if we want order to be preserved
									var entry = origTableCols[c]

									// Only keep column size if dataEndpoint as googleSheets has been set or if CSV file is being used

									var size = origDataEndpoint?.api === "googleSheets" || dataEndpoint?.api === "file" ? entry && entry[1]?.size : undefined
									// var size = entry && entry[1]?.size
									tableCols.set(`${colId}`, { size, order: c })
								}


								resolve()
							}
							else {
								figma.notify("Data must be 100 rows and columns or less");
							}

						}

						if (message.type === "detach-api") {
							setDataEndpoint(null)
							figma.ui.postMessage({ dataEndpoint: undefined })
						}

						if (message.type === "no-file") {
							figma.notify("No file selected");
						}

						if (message.type === "invalid-link") {
							figma.notify("Invalid link");
						}

						if (message.type === "api-error") {
							figma.notify("Check link is correct and publicly visable");
						}




					}
				})
			}
		},
	)

	function Title() {
		return (
		  <AutoLayout
			name="Title"
			fill={theme.colorBgSecondary}
			padding={{
			  top: 5,
			  right: 0,
			  bottom: 2,
			  left: 0,
			}}
			width="fill-parent"
			horizontalAlignItems="center"
      verticalAlignItems="center"
		  >
			<Input

			  value={widgetName}
				placeholder="Title"
				onTextEditEnd={(e) => {

						setWidgetName(e.characters);


				}}
				fontSize={12}
				horizontalAlignText="center"
				fill={theme.colorTextTertiary}
				fontWeight={600}
				lineHeight={20}
				// inputFrameProps={{
				// }}
				width={260}
				// inputBehavior="wrap"
/>
		  </AutoLayout>
		);
	  }

	function Cell({ children, id, cell, rowIndex, colIndex, col, cornerRadius }) {

		var width = setWidth(col)


		var strokePaint = [];

		var strokeWidth = 0

		let activeCell = activeCells.get(id)

		if (activeCell) {
			strokeWidth = activeCell.users[0] ? 2 : 0
			strokePaint = activeCell.users[0] ? activeCell.users[0].color : []
		}

		let href = "";
		let hrefBorder = "none";

		if (cell.link) {
			href = cell.link
			// hrefColor = "#007BFF";
			hrefBorder = "underline";
		}

		// let data = evalData(cell.data)
		let data = cell.data




		return (
			<AutoLayout width={width}

				height="fill-parent"
				name="DefaultCell"
				x={46}
				blendMode="pass-through"
				fill={theme.colorBg}

				padding={{ "top": 0, "right": 0, "bottom": 0, "left": 0 }}
				overflow="visible"
				onClick={(event) => editCell(id, colIndex, rowIndex, cols, rows, event)}
			>
				<Frame width={1}
					height="fill-parent"
					name="Border"
					blendMode="pass-through"
					cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
					overflow="visible"
					fill={theme.colorBorder}>
				</Frame>
				<AutoLayout width="fill-parent"
					height="hug-contents"
					name="Content"
					x={1}
					blendMode="pass-through"
					padding={{ "top": 14, "right": 14, "bottom": 14, "left": 13 }}
					spacing={10}
					overflow="visible">
					<Text key={id} width="fill-parent" href={href}
						name="Text"
						blendMode="pass-through"
						fill={theme.colorText}
						fontFamily="Inter"
						fontWeight={400}
						verticalAlignText="center"
						textDecoration={hrefBorder}>
						{data}
					</Text>
				</AutoLayout>
				<Rectangle
					stroke={strokePaint}
					strokeWidth={strokeWidth}
					cornerRadius={cornerRadius}
					positioning="absolute"
					x={{
						type: "left-right",
						leftOffset: 1,
						rightOffset: 0,
					  }}
					  y={{
						type: "top-bottom",
						topOffset: 0,
						bottomOffset: 0,
					  }}></Rectangle>
			</AutoLayout>
		)
	}

	function HeaderCell({ children, rowIndex, colIndex, id, cell, col }) {

		var strokePaint = [];
		var strokeWidth = 0

		var width = setWidth(col)

		let activeCell = activeCells.get(id)

		if (activeCell) {
			strokeWidth = activeCell.users[0] ? 2 : 0
			strokePaint = activeCell.users[0] ? activeCell.users[0].color : []
		}

		let href = "";
		let hrefBorder = "none";

		// let data = evalData(cell.data)
		let data = cell.data

		if (cell.link) {
			href = cell.link
			// hrefColor = "#007BFF";
			hrefBorder = "underline";
		}

		let [colId, rowId] = id.split(':')
		return (
			<AutoLayout width={width}
				height="fill-parent"
				name="HeaderCell"
				x={46}
				blendMode="pass-through"
				fill={theme.colorBgHeaderCell}
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
				padding={{ "top": 0, "right": 0, "bottom": 0, "left": 0 }}
				overflow="visible"
				onClick={() => editCell(id, colIndex, rowIndex, cols, rows)}
			>
				<Frame width={1}
					height="fill-parent"
					name="Border"
					blendMode="pass-through"
					cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
					overflow="visible">
					<Frame width={1}
						height={200}
						name="Border"
						blendMode="pass-through"
						fill={theme.colorBorder}
						cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
						overflow="hidden">
					</Frame>
				</Frame>
				<AutoLayout width="fill-parent"
					name="Content"
					x={1}
					blendMode="pass-through"
					padding={{ "top": 14, "right": 14, "bottom": 14, "left": 13 }}
					spacing={10}
					stroke={strokePaint}
					strokeWidth={strokeWidth}
					overflow="visible">
					<Text width="fill-parent" href={href}
						name="Text"
						x={13}
						y={14}
						blendMode="pass-through"
						fill={theme.colorText}
						fontFamily="Inter"
						fontWeight={600}
						verticalAlignText="center"
						textDecoration={hrefBorder}>
						{data}
					</Text>
				</AutoLayout>
			</AutoLayout>


		)

	}

	function ColumnLetter({ children, rowIndex, colIndex, id, col }) {
		let [colId, rowId] = id.split(":")

		var width = setWidth(col)

		return (
			<AutoLayout width={width}
				name="ColumnLetter"
				x={46}
				blendMode="pass-through"
				fill={theme.colorBgSecondary}
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}

				overflow="hidden"
				onClick={(event) => {
					return new Promise((resolve) => {
						// setStrokeWeight(2)
						figma.showUI(`
						<style>${__uiFiles__["css"]}</style>
						<div id="actions" class="mt-xxsmall type--small">
							<button class="customMenu__item" id="insertToLeft">Insert to Left</button>
							<button class="customMenu__item" id="insertToRight">Insert to Right</button>
							<hr/>
							<button class="customMenu__item" id="moveToLeft">Move to Left</button>
							<button class="customMenu__item" id="moveToRight">Move to Right</button>
							<hr/>
							<button class="customMenu__item" id="sortAscending">Sort Table A-Z</button>
							<button class="customMenu__item" id="sortDescending">Sort Table Z-A</button>
							<hr/>
							<label class="customMenu__item input">Column Size <input id="resize" type="number"  onkeypress="return (event.charCode == 8 || event.charCode == 0 || event.charCode == 13) ? null : event.charCode >= 48 && event.charCode <= 57" class="input__field" value="${width}"/></label>
							<hr/>
							<button class="customMenu__item" id="deleteColumn">Delete Column</button>
						</div>
				<script>

				const actions = document.getElementById("actions");
				const insertToLeft = document.getElementById("insertToLeft");
				const insertToRight = document.getElementById("insertToRight");
				const deleteColumn = document.getElementById("deleteColumn");
				const sortAscending = document.getElementById("sortAscending");
				const sortDescending = document.getElementById("sortDescending");
				const resize = document.getElementById("resize");

				window.focus()

				window.addEventListener("keydown", (event) => {
					if (event.key === "Escape") {
						parent.postMessage({ pluginMessage: {type: 'close-plugin'} }, '*');
					}
				});

				// window.focus()

				// window.addEventListener("blur", () => {
				// 	console.log("blured")
				// 	parent.postMessage({ pluginMessage: {type: 'close-plugin'} }, '*');
				// });

				deleteColumn.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'delete-column', rowIndex: ${rowIndex}, colIndex: ${colIndex}} }, '*');
				})
				insertToRight.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'insert-to-right'} }, '*');
				})
				insertToLeft.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'insert-to-left'} }, '*');
				})
				moveToLeft.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'move-to-left'} }, '*');
				})
				moveToRight.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'move-to-right'} }, '*');
				})
				sortAscending.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'sort-ascending'} }, '*');
				})
				sortDescending.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'sort-descending'} }, '*');
				})
				resize.addEventListener("focus", () => {
					resize.select();
				});
				resize.addEventListener("keydown", (e) => {

					if (e.key === 'Enter'){
						parent.postMessage({ pluginMessage: {type: 'resize-column', size: resize.value} }, '*');
					}
				})
				</script>
			`, { title: `Column ${alphabet[colIndex]}`, width: 200, height: 308+8+8, themeColors: true });
			// position: { x: event.canvasX + (10 / figma.viewport.zoom), y: event.canvasY - (48 / figma.viewport.zoom) }
						figma.ui.onmessage = (message) => {

							if (message.type === 'delete-column') {
								removeColumn(colId)
							}

							if (message.type === 'insert-to-right') {
								addColumn(colIndex)
							}

							if (message.type === 'insert-to-left') {
								addColumn(colIndex, 0)
							}

							if (message.type === 'move-to-right') {
								moveColumn(colIndex)
							}

							if (message.type === 'move-to-left') {
								moveColumn(colIndex, -1)
							}

							if (message.type === 'sort-ascending') {
								sortTable(colId, rows)
							}

							if (message.type === 'sort-descending') {
								sortTable(colId, rows, true)
							}

							if (message.type === 'resize-column') {
								resizeColumn(colId, message.size)
							}

							if (message.type === 'close-plugin') {
								figma.closePlugin()
							}
							// table[rowIndex][colIndex] = message
							// updateTable(table, () => {
							// 	return table
							// })
							// setStrokeWeight(0)
							// figma.notify(message);
							// figma.notify(strokeWeight.toString())
							resolve()
						}
					})
				 }}>
					 <Frame width={1}

					height="fill-parent"
					name="Border"
					cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
					overflow="visible"
					fill={theme.colorBorderGradient}></Frame>

				 <AutoLayout
				 width="fill-parent"
				 padding={{ "top": 3, "right": 3, "bottom": 3, "left": 3 }}
				 >
					 <AutoLayout
						name="Hover"
						cornerRadius={2}
						overflow="visible"
						hoverStyle={{
							fill: theme.colorBgTertiary,
						  }}
						width="fill-parent"
						horizontalAlignItems="center"
						verticalAlignItems="center"
						>
							<Text width="fill-parent"
							name="Column Letter"

							x={4}
							y={4}
							blendMode="pass-through"
							fill={theme.colorTextTertiary}
							fontSize={12}
							fontFamily="Inter"
							fontWeight={600}
							horizontalAlignText="center"
							lineHeight={26}>
							{alphabet[colIndex]}
						</Text>
					</AutoLayout>
				 </AutoLayout>

			</AutoLayout>
		)
	}

	function RowNumber({ children, rowIndex, colIndex, id, lastRow, event }) {

		let [colId, rowId] = id.split(":")
		let cornerRadius : any = 2

		if (lastRow) {
			cornerRadius = {
				topLeft: 2,
				topRight: 2,
				bottomLeft: 5,
				bottomRight: 2
			  }
		}

		return (
			<AutoLayout width={46}
				height="fill-parent"
				name="RowNumber"
				blendMode="pass-through"
				fill={theme.colorBgSecondary}
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
				padding={{ "top": 3, "right": 3, "bottom": 3, "left": 3 }}
				verticalAlignItems="center"
				overflow="hidden"
				onClick={(event) => {
					return new Promise((resolve) => {
						figma.showUI(`
						<style>${__uiFiles__["css"]}</style>

						<div id="actions" class="mt-xxsmall type--small">
							<button class="customMenu__item" id="insertAbove">Insert Above</button>
							<button class="customMenu__item" id="insertBelow">Insert Below</button>
							<hr/>
							<button class="customMenu__item" id="moveUp">Move Up</button>
							<button class="customMenu__item" id="moveDown">Move Down</button>
							<hr/>
							<button class="customMenu__item" id="deleteRow">Delete Row</button>
						</div>
				<script>
				const actions = document.getElementById("actions");
				const insertAbove = document.getElementById("insertAbove");
				const insertBelow = document.getElementById("insertBelow");
				const deleteRow = document.getElementById("deleteRow");

				window.focus()

				window.addEventListener("keydown", (event) => {
					if (event.key === "Escape") {
						parent.postMessage({ pluginMessage: {type: 'close-plugin'} }, '*');
					}
				});

				// window.addEventListener("blur", () => {
				// 	console.log("blured")
				// 	parent.postMessage({ pluginMessage: {type: 'close-plugin'} }, '*');
				// });

				deleteRow.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'delete-row'} }, '*');
				})
				insertAbove.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'insert-above'} }, '*');
				})
				insertBelow.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'insert-below'} }, '*');
				})
				moveDown.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'move-down'} }, '*');
				})
				moveUp.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'move-up'} }, '*');
				})
				</script>
			`, { title: `Row ${rowIndex}`, width: 200, height: 184 + 8 + 8, themeColors: true});
			// position: { x: event.canvasX + (10 / figma.viewport.zoom), y: event.canvasY - (48 / figma.viewport.zoom)}
						figma.ui.onmessage = (message) => {

							if (message.type === 'delete-row') {
								removeRow(rowId)
							}

							if (message.type === 'insert-above') {
								addRow(rowIndex, 0)
							}

							if (message.type === 'insert-below') {
								addRow(rowIndex, 1)
							}

							if (message.type === 'move-down') {
								moveRow(rowIndex)
							}

							if (message.type === 'move-up') {
								moveRow(rowIndex, -1)
							}

							if (message.type === 'close-plugin') {
								figma.closePlugin()
							}

							resolve()
						}
					})
				}}
			>
				<AutoLayout
						name="Hover"
						cornerRadius={cornerRadius}
						overflow="visible"
						hoverStyle={{
							fill: theme.colorBgTertiary,
						  }}
						width="fill-parent"
						height="fill-parent"
						horizontalAlignItems="center"
						verticalAlignItems="center"
						>
				<Text width="fill-parent"
					name="Text"
					x={4}
					y={16}
					blendMode="pass-through"
					fill={theme.colorTextTertiary}
					fontSize={12}
					fontFamily="Inter"
					fontWeight={600}
					horizontalAlignText="center"
					verticalAlignText="center">
					{rowIndex}
				</Text>
				</AutoLayout>
			</AutoLayout>
		)
	}

	function EmptyRowNumber({ children }) {
		return (
			<AutoLayout width={46}
				height="fill-parent"
				name="RowNumber"
				blendMode="pass-through"
				fill={theme.colorBgSecondary}
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
				padding={{ "top": 4, "right": 4, "bottom": 4, "left": 4 }}
				verticalAlignItems="center"
				overflow="hidden"
			>
				<Text width="fill-parent"
					name="Text"
					x={4}
					y={16}
					blendMode="pass-through"
					fill={theme.colorText}
					fontSize={12}
					fontFamily="Inter"
					fontWeight={600}
					horizontalAlignText="center"
					verticalAlignText="center">
					{children}
				</Text>
			</AutoLayout>
		)
	}

	function Row({children, rowIndex, lastRow}) {
		let effect = theme.shadowBorderBottom
		let padding = { "top": 0, "right": 0, "bottom": 1, "left": 0 }
		if (lastRow) {
			effect = []
			padding = 0
		}
		return (
			<AutoLayout name="Row"
				y={71}
				blendMode="pass-through"
				fill={theme.colorBg}
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
				padding={padding}
				effect={effect}
				overflow="hidden">
				{children}
			</AutoLayout>
		)

	}

	function Rows({children}) {
		return (
			<AutoLayout name="Rows"
				y={6}
				blendMode="pass-through"
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
				padding={{ "top": 0, "right": 0, "bottom": 0, "left": 0 }}
				direction="vertical"
				overflow="visible">
				{children}
			</AutoLayout>
		)
	}

	function TopBorder({color}) {

		var height = 6
		var fill = { "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": color }

		if (color === "ukraine") {
			fill = {
				type: "gradient-linear",
				gradientHandlePositions: [
				  { x: 0.5, y: 0 },
				  { x: 1, y: 1 },
				  { x: 0, y: 0 }
				],
				gradientStops: [
				  { position: 0, color: {"r":0,"g":0.4156862795352936,"b":0.8588235378265381,"a":1} },
				  { position: 0.499, color: {"r":0,"g":0.4156862795352936,"b":0.8588235378265381,"a":1} },
				  { position: 0.5, color: {"r":0.9921568632125854,"g":0.8313725590705872,"b":0.0117647061124444,"a":1} },
				  { position: 1, color: {"r":0.9921568632125854,"g":0.8313725590705872,"b":0.0117647061124444,"a":1} }
				]
			  }
		}
		return (
			<Frame width="fill-parent"
				height={height}
				name="Border"
				fill={fill}
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
				overflow="hidden">
			</Frame>
		)
	}

	function Table({children}) {
		return (
			<AutoLayout name="Table"
				x={11234}
				y={1555}
				blendMode="pass-through"
				fill={theme.colorBg}
				effect={{
					type: "drop-shadow",
					color: "#0000001A",
					offset: {
					  x: 0,
					  y: 2,
					},
					blur: 4,
				  }}
				  fill="#FFF"
				  stroke="#0000000A"
				  strokeAlign="outside"

				// stroke={{ "type": "solid", "visible": true, "opacity": 0.10000000149011612, "blendMode": "normal", "color": { "r": 0, "g": 0, "b": 0, "a": 0.10000000149011612 } }}
				// strokeWidth={0.5}
				cornerRadius={{ "topLeft": 8, "topRight": 8, "bottomLeft": 8, "bottomRight": 8 }}
				// effect={[{ "type": "drop-shadow", "color": { "r": 0, "g": 0, "b": 0, "a": 0.15000000596046448 }, "offset": { "x": 0, "y": 2 }, "spread": 0, "visible": true, "blendMode": "normal", "showShadowBehindNode": true, "blur": 4 }]}
				direction="vertical"
				overflow="hidden">
				{children}
			</AutoLayout>
		)
	}

	return (
		<Table>
			<TopBorder key="topBorder" color={widgetColor} />
			<Title key="title"></Title>
			<Rows key="rows">
				{rows.map((rowId, rowIndex) => {
					let lastRow = false
					if (rowIndex === rows.length - 1) {
							lastRow = true
					}

					return (
						<Row key={rowId[0]} lastRow={lastRow}>
							{cols.map((colId, colIndex) => {
								var cellId = `${colId[0]}:${rowId[0]}`
								var cell = tableCells.get(`${colId[0]}:${rowId[0]}`) || { data: '' }

								var col = tableCols.get(colId[0])

								if (colIndex === 0 && rowIndex === 0) {
									return <EmptyRowNumber key={cellId} ></EmptyRowNumber>
								}
								else if (colIndex === 0) {
									return <RowNumber key={cellId}  id={cellId} rowIndex={rowIndex} colIndex={colIndex} lastRow={lastRow}>{cell}</RowNumber>
								}
								else {
									if (rowIndex === 0) {
										return <ColumnLetter key={cellId} id={cellId} rowIndex={rowIndex} colIndex={colIndex} col={col}>{cell}</ColumnLetter>
									}
									else if (rowIndex === 1 && widgetFirstRowAsHeader) {
										return <HeaderCell key={cellId} cell={cell} id={cellId} rowIndex={rowIndex} colIndex={colIndex} col={col}></HeaderCell>
									}
									else {
										let cornerRadius : any = 0

										if (colIndex === cols.length - 1 && rowIndex === rows.length -1) {
											cornerRadius = {
												bottomRight: 8
											}
										}
										return <Cell key={cellId} cell={cell} id={cellId} rowIndex={rowIndex} colIndex={colIndex} col={col} cornerRadius={cornerRadius}></Cell>
									}

								}
							})}
						</Row>

					)
				})}
			</Rows>
		</Table>
	)
}

widget.register(Main)


