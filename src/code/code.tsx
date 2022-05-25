var _ = require('lodash');
const { widget } = figma
const { Frame, Text, Ellipse, Rectangle, SVG, useSyncedState, useSyncedMap, usePropertyMenu, AutoLayout, useWidgetId, useEffect, waitForTask } = widget

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



function LetterRow({ children }) {
	return (
		<AutoLayout name="LetterRow"
			blendMode="pass-through"
			fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0.9624999761581421, "g": 0.9624999761581421, "b": 0.9624999761581421, "a": 1 } }}
			cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
			padding={{ "top": 0, "right": 0, "bottom": 0, "left": 0 }}
			effect={[{ "type": "inner-shadow", "color": { "r": 0.8999999761581421, "g": 0.8999999761581421, "b": 0.8999999761581421, "a": 1 }, "offset": { "x": 0, "y": -1 }, "spread": 0, "visible": true, "blendMode": "normal", "blur": 0 }]}
			overflow="hidden">
			{children}
		</AutoLayout>
	)
}





function Row({children, rowIndex}) {
	return (
		<AutoLayout name="Row"
			y={71}
			blendMode="pass-through"
			fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 1, "g": 1, "b": 1, "a": 1 } }}
			cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
			padding={{ "top": 0, "right": 0, "bottom": 1, "left": 0 }}
			effect={[{ "type": "inner-shadow", "color": { "r": 0.8999999761581421, "g": 0.8999999761581421, "b": 0.8999999761581421, "a": 1 }, "offset": { "x": 0, "y": -1 }, "spread": 0, "visible": true, "blendMode": "normal", "blur": 0 }]}
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

	var height = 8
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
			fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 1, "g": 1, "b": 1, "a": 1 } }}
			stroke={{ "type": "solid", "visible": true, "opacity": 0.10000000149011612, "blendMode": "normal", "color": { "r": 0, "g": 0, "b": 0, "a": 0.10000000149011612 } }}
			strokeWidth={0.5}
			cornerRadius={{ "topLeft": 8, "topRight": 8, "bottomLeft": 8, "bottomRight": 8 }}
			effect={[{ "type": "drop-shadow", "color": { "r": 0, "g": 0, "b": 0, "a": 0.15000000596046448 }, "offset": { "x": 0, "y": 2 }, "spread": 0, "visible": true, "blendMode": "normal", "showShadowBehindNode": true, "blur": 4 }]}
			direction="vertical"
			overflow="hidden">
			{children}
		</AutoLayout>
	)
}

function cellHeight(height) {
	if (height > 277) {
		height = 277+140
	} else {
		height += 141
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

	let tableCells = useSyncedMap("tableCells")
	let tableCols = useSyncedMap("tableCols")
	let tableRows = useSyncedMap("tableRows")

	let [dataEndpoint, setDataEndpoint] = useSyncedState("dataEndpoint", null)

	// useEffect(() => {
	// 	// waitForTask(
	// 	return new Promise(resolve => {
	// 		figma.clientStorage.getAsync("userPreferences").then((settings) => {
	// 			setUserPreferences(settings)
	// 			resolve()
	// 		})
	// 		resolve()
	// 	})
	// })


	// let [widgetColor, setWidgetColor] = useSyncedState("widgetColor", "#9747FF")
	let [widgetColor, setWidgetColor] = useSyncedState("widgetColor", "ukraine")

	const [isInitialized, setIsInitialized] = useSyncedState<boolean>('init', false)


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

	function manageArray(array) {
		var newArray;
		if (array.length === 0) {
			newArray = numToIndices(3).map((item, i) => {
				return 'd' + genRandomId(i)
			})
		}
		else {
			newArray = array
		}
		return newArray
	}

	useEffect(() => {
		if (!isInitialized) {
			numToIndices(3).map((item, i) => {
				tableCols.set(genRandomId(i), { order: i, size: "medium" })
			})

			numToIndices(4).map((item, i) => {
				tableRows.set(genRandomId(i), { order: i})
			})

			setIsInitialized(true)
		}
	})

	// useEffect(async () => {
	// 	waitForTask(new Promise(resolve => {
	// 		figma.on('close', () => {
	// 			if (lastActiveCell) {
	// 				tableCells.set(...lastActiveCell)
	// 			}
	// 		})
	// 		resolve()
	// 	}))
	// })

	let cols = putEntriesIntoArray(tableCols).length === 0 ? ['1', '2', '3'] : putEntriesIntoArray(tableCols)
	let rows = putEntriesIntoArray(tableRows).length === 0 ? ['1', '2', '3'] : putEntriesIntoArray(tableRows)

	// console.log(numToIndices(8))


	// useEffect(() => {
	// 	waitForTask(new Promise (resolve => {
	// 		tableData.set('1:1', '1')
	// 		tableData.set('1:2', '2')
	// 		tableData.set('2:2', '3')
	// 		resolve()
	// 	}))
	// })

	// useEffect(() => {
	// 	waitForTask(new Promise(resolve => {
	// 		tableMap.get('A1')
	// 		resolve()
	// 	}))
	// })




	// function editColumn(table, cell, rowIndex, colIndex) {
	// 	return new Promise((resolve) => {
	// 		// setStrokeWeight(2)
	// 		console.log(rowIndex, colIndex)
	// 		figma.showUI(`
	// 			<div>test</div>
	// 		`);
	// 		figma.ui.onmessage = (message) => {
	// 			table[rowIndex][colIndex] = message
	// 			updateTable(table, () => {
	// 				return table
	// 			})
	// 			// setStrokeWeight(0)
	// 			// figma.notify(message);
	// 			// figma.notify(strokeWeight.toString())
	// 			// resolve()
	// 		}
	// 	})
	// }


	// setWidgetState({
	//   selected: false
	// })

	let [sortDescending, setSort] = useSyncedState("sortDescending", false)

	function setWidth(col) {
		var base = 96
		var width = base * 2.5

		if (col?.size === "small") {
			width = base * 1.5
		}
		if (col?.size === "medium") {
			width = base * 2.5
		}
		if (col?.size === "large") {
			width = base * 5
		}

		return width
	}

	function resizeColumn(colIndex, size) {
		var colData = tableCols.get(colIndex)
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
		tableCols.set(uniqueId, { order: '' })


		// 2. Splice new entry into virtualEntries
		virtualEntries.splice(colIndex + position, 0, [uniqueId, { order: '' }])

		// 4. Reset order on entries now that new column has been created
		virtualEntries.map((entry, i) => {
			tableCols.set(entry[0], { ...entry[1], order: i })
		})

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

		let {data, active} = tableCells.get(id) || { data: '', active: false }
		let [colId, rowId] = id.split(':')

		let currentCellId = id;
		let previousCellColor = active

		const onmessage = (message) => {
			if (message.type === "next-cell") {

				({ data, colIndex, rowIndex } = message.data)

				// When we receive the data it's a string, so we need to convert any numbers to numbers
				data = convertToNumber(data)

				// Reset current cell color before moving onto next
				// tableCells.set(currentCellId, { data, active: previousCellColor })


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

					// Store the cell colour
					previousCellColor = nextCell.active
					// Set border on the next cell
					// tableCells.set(currentCellId, { data: nextCell.data, active: figma.currentUser.color })

					figma.ui.postMessage({ type: "post-data", data: {data: nextCell.data, rowIndex, colIndex} })

				}

			}

			if (message.type === "data-received") {

				data = message.data.data

				if (Number(message.data)) {
					data = Number(message.data.data)
				}

				tableCells.set(currentCellId, { data, active })
				// tableCells.set(currentCellId, { data, active: figma.currentUser.color })
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

					// Set colour of cell to be active
					// tableCells.set(id, { data, active: figma.currentUser.color })
					figma.showUI(`<style>${__uiFiles__["css"]}</style>${__uiFiles__["editCell"]}`, { width: 300, height: cellHeight(31) });
					figma.ui.postMessage({ type: "show-ui", settings })
					figma.ui.postMessage({ type: "post-data", data: {data, rowIndex, colIndex } })

				})

				figma.ui.on('message', onmessage)

					// figma.on('close', () => {
					// Reset active state
					// 	tableCells.set(currentCellId, { data, active: previousCellColor })
					// })


		})

	}

	function Cell({ children, id, cell, rowIndex, colIndex, col }) {

		var width = setWidth(col)


		var strokePaint = false;

		var strokeWidth = 0
		if (tableCells.get(id)) {
			strokeWidth = tableCells.get(id).active ? 2 : 0
		}

		if (tableCells.get(id)) {
			strokePaint = tableCells.get(id).active ? tableCells.get(id).active : false
		}



		return (
			<AutoLayout width={width}
				height="fill-parent"
				name="DefaultCell"
				x={46}
				blendMode="pass-through"
				fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 1, "g": 1, "b": 1, "a": 1 } }}
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
				padding={{ "top": 0, "right": 0, "bottom": 0, "left": 0 }}
				overflow="visible"
				onClick={(event) => editCell(id, colIndex, rowIndex, cols, rows, event)}
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
						fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0.8980392217636108, "g": 0.8980392217636108, "b": 0.8980392217636108, "a": 1 } }}
						cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
						overflow="hidden">
					</Frame>
				</Frame>
				<AutoLayout width="fill-parent"
					height="hug-contents"
					name="Content"
					x={1}
					blendMode="pass-through"
					padding={{ "top": 14, "right": 14, "bottom": 14, "left": 13 }}
					spacing={10}
					stroke={strokePaint}
					strokeWidth={strokeWidth}
					overflow="visible">
					<Text key={id} width="fill-parent"
						name="Text"
						x={13}
						y={14}
						blendMode="pass-through"
						fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0, "g": 0, "b": 0, "a": 1 } }}
						fontFamily="Inter"
						fontWeight="regular"
						verticalAlignText="center">
						{cell.data}
					</Text>
				</AutoLayout>
			</AutoLayout>
		)
	}

	function HeaderCell({ children, rowIndex, colIndex, id, cell, col }) {

		var strokePaint = false;
		var strokeWidth = 0

		var width = setWidth(col)

		if (tableCells.get(id)) {
			strokeWidth = tableCells.get(id).active ? 2 : 0
		}

		if (tableCells.get(id)) {
			strokePaint = tableCells.get(id).active ? tableCells.get(id).active : false
		}

		let [colId, rowId] = id.split(':')
		return (
			<AutoLayout width={width}
				height="fill-parent"
				name="HeaderCell"
				x={46}
				blendMode="pass-through"
				fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0.9624999761581421, "g": 0.9624999761581421, "b": 0.9624999761581421, "a": 1 } }}
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
						fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0.8980392217636108, "g": 0.8980392217636108, "b": 0.8980392217636108, "a": 1 } }}
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
					<Text width="fill-parent"
						name="Text"
						x={13}
						y={14}
						blendMode="pass-through"
						fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0, "g": 0, "b": 0, "a": 1 } }}
						fontFamily="Inter"
						fontWeight="semi-bold"
						verticalAlignText="center">
						{cell.data}
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
				fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0.9624999761581421, "g": 0.9624999761581421, "b": 0.9624999761581421, "a": 1 } }}
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
				padding={{ "top": 8, "right": 6, "bottom": 8, "left": 4 }}
				spacing={4}
				effect={[{ "type": "inner-shadow", "color": { "r": 0.8980392217636108, "g": 0.8980392217636108, "b": 0.8980392217636108, "a": 1 }, "offset": { "x": 1, "y": 0 }, "spread": 0, "visible": true, "blendMode": "normal", "showShadowBehindNode": false, "blur": 0 }]}
				overflow="hidden"
				onClick={(event) => {
					return new Promise((resolve) => {
						// setStrokeWeight(2)

						figma.showUI(`
						<style>${__uiFiles__["css"]}</style>
						<div id="actions" class="m-xsmall type--small">
							<p>Column ${alphabet[colIndex]}</p>
							<button class="button button--secondary mt-xsmall" style="width: 100%" id="insertToLeft">Insert to Left</button>
							<br/>
							<button class="button button--secondary mb-xsmall" style="width: 100%" href="#" id="insertToRight">Insert to Right</button>
							<hr/>
							<button class="button button--secondary mt-xsmall" style="width: 100%" href="#" id="sortAscending">Sort Table A-Z</button>
							<br/>
							<button class="button button--secondary mb-xsmall" style="width: 100%" href="#" id="sortDescending">Sort Table Z-A</button>
							<hr/>
							<div class="button-group size-${col.size}">
							<button class="button button--fourth mb-xsmall small" href="#" id="resizeSmall">S</button>
							<button class="button button--fourth mb-xsmall medium" href="#" id="resizeMedium">M</button>
							<button class="button button--fourth mb-xsmall large" href="#" id="resizeLarge">L</button>
							</div>
							<hr/>
							<button class="button button--secondary mt-xsmall" style="width: 100%" href="#" id="deleteColumn">Delete Column</button>
						</div>
				<script>
				const actions = document.getElementById("actions");
				const insertToLeft = document.getElementById("insertToLeft");
				const insertToRight = document.getElementById("insertToRight");
				const deleteColumn = document.getElementById("deleteColumn");
				const sortAscending = document.getElementById("sortAscending");
				const sortDescending = document.getElementById("sortDescending");

				deleteColumn.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'delete-column', rowIndex: ${rowIndex}, colIndex: ${colIndex}} }, '*');
				})
				insertToRight.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'insert-to-right'} }, '*');
				})
				insertToLeft.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'insert-to-left'} }, '*');
				})
				sortAscending.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'sort-ascending'} }, '*');
				})
				sortDescending.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'sort-descending'} }, '*');
				})
				resizeSmall.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'resize-column', size: 'small'} }, '*');
				})
				resizeMedium.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'resize-column', size: 'medium'} }, '*');
				})
				resizeLarge.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'resize-column', size: 'large'} }, '*');
				})
				</script>
			`, { width: 200, height: 386 });
			// position: {x: event.canvasX - 130, y: event.canvasY + 20}
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

							if (message.type === 'sort-ascending') {
								sortTable(colId)
							}

							if (message.type === 'sort-descending') {
								sortTable(colId, true)
							}

							if (message.type === 'resize-column') {
								resizeColumn(colId, message.size)
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
				<Text width="fill-parent"
					name="Banana"
					x={4}
					y={4}
					blendMode="pass-through"
					fill={{ "type": "solid", "visible": true, "opacity": 0.30000001192092896, "blendMode": "normal", "color": { "r": 0, "g": 0, "b": 0 } }}
					fontSize={12}
					fontFamily="Inter"
					fontWeight="bold"
					horizontalAlignText="center">
					{alphabet[colIndex]}
				</Text>
			</AutoLayout>
		)
	}

	function RowNumber({ children, rowIndex, colIndex, id }) {

		let [colId, rowId] = id.split(":")
		return (
			<AutoLayout width={46}
				height="fill-parent"
				name="RowNumber"
				blendMode="pass-through"
				fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0.9624999761581421, "g": 0.9624999761581421, "b": 0.9624999761581421, "a": 1 } }}
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
				padding={{ "top": 4, "right": 4, "bottom": 4, "left": 4 }}
				effect={[{ "type": "drop-shadow", "color": { "r": 0.8980392217636108, "g": 0.8980392217636108, "b": 0.8980392217636108, "a": 1 }, "offset": { "x": -1, "y": 0 }, "spread": 0, "visible": true, "blendMode": "normal", "showShadowBehindNode": false, "blur": 0 }]}
				verticalAlignItems="center"
				overflow="hidden"
				onClick={() => {
					console.log(id)
					return new Promise((resolve) => {
						figma.showUI(`
						<style>${__uiFiles__["css"]}</style>
						<div id="actions" class="m-xsmall type--small">
							<p>Row ${rowIndex}</p>
							<button class="button button--secondary" style="width: 100%" id="insertAbove">Insert Above</button>
							<br/>
							<button class="button button--secondary mb-xsmall" style="width: 100%" id="insertBelow">Insert Below</button>
							<hr/>
							<button class="button button--secondary mt-xsmall" style="width: 100%" id="deleteRow">Delete Row</button>
						</div>
				<script>
				const actions = document.getElementById("actions");
				const insertAbove = document.getElementById("insertAbove");
				const insertBelow = document.getElementById("insertBelow");
				const deleteRow = document.getElementById("deleteRow");

				deleteRow.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'delete-row'} }, '*');
				})
				insertAbove.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'insert-above'} }, '*');
				})
				insertBelow.addEventListener("click", () => {
					parent.postMessage({ pluginMessage: {type: 'insert-below'} }, '*');
				})
				</script>
			`, { width: 200, height: 208 });
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

							resolve()
						}
					})
				}}
			>
				<Text width="fill-parent"
					name="Text"
					x={4}
					y={16}
					blendMode="pass-through"
					fill={{ "type": "solid", "visible": true, "opacity": 0.30000001192092896, "blendMode": "normal", "color": { "r": 0, "g": 0, "b": 0} }}
					fontSize={12}
					fontFamily="Inter"
					fontWeight="bold"
					horizontalAlignText="center"
					verticalAlignText="center">
					{rowIndex}
				</Text>
			</AutoLayout>
		)
	}

	function EmptyRowNumber({ children }) {
		return (
			<AutoLayout width={46}
				height="fill-parent"
				name="RowNumber"
				blendMode="pass-through"
				fill={{ "type": "solid", "visible": true, "opacity": 1, "blendMode": "normal", "color": { "r": 0.9624999761581421, "g": 0.9624999761581421, "b": 0.9624999761581421, "a": 1 } }}
				cornerRadius={{ "topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0 }}
				padding={{ "top": 4, "right": 4, "bottom": 4, "left": 4 }}
				effect={[{ "type": "drop-shadow", "color": { "r": 0.8980392217636108, "g": 0.8980392217636108, "b": 0.8980392217636108, "a": 1 }, "offset": { "x": -1, "y": 0 }, "spread": 0, "visible": true, "blendMode": "normal", "showShadowBehindNode": false, "blur": 0 }]}
				verticalAlignItems="center"
				overflow="hidden"
			>
				<Text width="fill-parent"
					name="Text"
					x={4}
					y={16}
					blendMode="pass-through"
					fill={{ "type": "solid", "visible": true, "opacity": 0.30000001192092896, "blendMode": "normal", "color": { "r": 0, "g": 0, "b": 0 } }}
					fontSize={12}
					fontFamily="Inter"
					fontWeight="bold"
					horizontalAlignText="center"
					verticalAlignText="center">
					{children}
				</Text>
			</AutoLayout>
		)
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

	function sortTable(id, sortDescending = false) {

		// Find the entries in that column
		var colEntries = []
		for (let i = 0; i < tableCells.entries().length; i++) {
			var entry = tableCells.entries()[i]
			let [colId, rowId] = entry[0].split(":")
			if (colId === id) {
				colEntries.push(entry)
			}
		}

		var firstColEntry = colEntries.shift()

		// Sort the entries in that column
		colEntries.sort((a, b) => {
			if (a[1].data > b[1].data) return 1;
			if (b[1].data > a[1].data) return -1;

			return 0;
		})


		if (sortDescending) colEntries.reverse()

		colEntries.splice(0, 0, firstColEntry)

		// Assign a new order to the rows
		colEntries.map((entry, i) => {
			let [colId, rowId] = entry[0].split(":")
			tableRows.set(rowId, { ...entry[1], order: i })
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

	let colorItems = [
		{
			tooltip: '❤️ Ukraine',
			propertyName: 'ukraine',
			itemType: 'action',
			icon: (() => {
				if (widgetColor === 'ukraine') {
					return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M14 27C21.1797 27 27 21.1797 27 14C27 6.8203 21.1797 1 14 1C6.8203 1 1 6.8203 1 14C1 21.1797 6.8203 27 14 27Z" stroke="#9747FF" stroke-width="2"/>
					<path d="M14 24C19.5228 24 24 19.5228 24 14C24 8.47715 19.5228 4 14 4C8.47715 4 4 8.47715 4 14C4 19.5228 8.47715 24 14 24Z" fill="black"/>
					<mask id="mask0_3_6" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="4" y="4" width="20" height="20">
					<circle cx="14" cy="14" r="10" fill="#015ABA"/>
					</mask>
					<g mask="url(#mask0_3_6)">
					<rect x="2" y="14" width="24" height="12" fill="#015ABA"/>
					<rect x="2" y="14" width="24" height="12" fill="#FDD403"/>
					<rect x="2" y="2" width="24" height="12" fill="#006ADB"/>
					<circle cx="14" cy="14" r="9.5" stroke="white" stroke-opacity="0.3" style="mix-blend-mode:overlay"/>
					</g>
					</svg>

		`
				} else {
					return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M14 24C19.5228 24 24 19.5228 24 14C24 8.47715 19.5228 4 14 4C8.47715 4 4 8.47715 4 14C4 19.5228 8.47715 24 14 24Z" fill="black"/>
					<mask id="mask0_3_6" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="4" y="4" width="20" height="20">
					<circle cx="14" cy="14" r="10" fill="#015ABA"/>
					</mask>
					<g mask="url(#mask0_3_6)">
					<rect x="2" y="14" width="24" height="12" fill="#015ABA"/>
					<rect x="2" y="14" width="24" height="12" fill="#FDD403"/>
					<rect x="2" y="2" width="24" height="12" fill="#006ADB"/>
					<circle cx="14" cy="14" r="9.5" stroke="white" stroke-opacity="0.3" style="mix-blend-mode:overlay"/>
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
				icon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21.5 10.25V14V21.5H6.5V14V10.25" stroke="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M13.2246 13.2479L10.5763 10.5321L9.86035 11.2303L13.3512 14.81L13.7002 15.168L14.0582 14.8189L17.6379 11.3281L16.9397 10.6121L14.2277 13.2568C13.9563 9.5929 16.4138 6.19266 20.1069 5.38521L19.8933 4.40829C15.7353 5.3174 12.9592 9.12662 13.2246 13.2479Z" fill="white"/>
</svg>`
			},
			{
				tooltip: 'Settings',
				propertyName: 'settings',
				itemType: 'action',
				icon: `<svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.0947 22.7676C15.9745 23.2005 15.5804 23.5 15.1312 23.5H13.318C12.8688 23.5 12.4747 23.2005 12.3545 22.7676L12.0589 21.7034C11.4423 21.5304 10.8559 21.2854 10.3093 20.978L9.34684 21.522C8.95578 21.7431 8.46532 21.6762 8.14768 21.3586L6.86558 20.0765C6.54794 19.7588 6.48109 19.2684 6.70213 18.8773L7.24621 17.9147C6.939 17.3682 6.69413 16.782 6.52121 16.1657L5.45696 15.8701C5.02414 15.7499 4.72461 15.3558 4.72461 14.9066V13.0934C4.72461 12.6442 5.02414 12.2501 5.45696 12.1299L6.52121 11.8343C6.69417 11.2178 6.93912 10.6315 7.24644 10.0849L6.70259 9.12272C6.48156 8.73166 6.54841 8.2412 6.86605 7.92356L8.14815 6.64146C8.46579 6.32382 8.95625 6.25697 9.34731 6.478L10.3095 7.02185C10.8561 6.71452 11.4424 6.46956 12.0589 6.2966L12.3545 5.23236C12.4747 4.79954 12.8688 4.5 13.318 4.5H15.1312C15.5804 4.5 15.9745 4.79954 16.0947 5.23236L16.3903 6.29661C17.0069 6.46958 17.5933 6.71459 18.1399 7.02197L19.1024 6.47798C19.4934 6.25694 19.9839 6.3238 20.3015 6.64144L21.5836 7.92354C21.9013 8.24117 21.9681 8.73164 21.7471 9.1227L21.203 10.0853C21.5102 10.6318 21.7551 11.218 21.928 11.8343L22.9923 12.1299C23.4251 12.2501 23.7246 12.6442 23.7246 13.0934V14.9066C23.7246 15.3558 23.4251 15.7499 22.9923 15.8701L21.928 16.1657C21.7551 16.7822 21.5101 17.3685 21.2028 17.9151L21.7466 18.8773C21.9677 19.2683 21.9008 19.7588 21.5832 20.0764L20.3011 21.3585C19.9834 21.6762 19.493 21.743 19.1019 21.522L18.1397 20.9782C17.5931 21.2855 17.0068 21.5304 16.3903 21.7034L16.0947 22.7676Z" stroke="white" stroke-linejoin="round"/>
<circle cx="14.2246" cy="14" r="3.5" stroke="white"/>
</svg>`
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
          `, { width: 300, height: 272 });

						figma.ui.postMessage({ type: "post-settings", settings })


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
          `, { width: 340, height: 292 });

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

	return (
		<Table key="">
			<TopBorder key="" color={widgetColor} />
			<Rows key="">
				{rows.map((rowId, rowIndex) => {
					return (
						<Row key="">
							{cols.map((colId, colIndex) => {
								var cellId = `${colId}:${rowId}`
								var cellLocation = `${colId}:${rowId}`
								// console.log(`${colId}:${rowId}`)
								var cell = tableCells.get(`${colId}:${rowId}`) || { data: '' }

								var col = tableCols.get(colId[0])


								if (colIndex === 0 && rowIndex === 0) {
									return <EmptyRowNumber key={colIndex} ></EmptyRowNumber>
								}
								else if (colIndex === 0) {
									return <RowNumber key={rowIndex}  id={cellId} rowIndex={rowIndex} colIndex={colIndex}>{cell}</RowNumber>
								}
								else {
									if (rowIndex === 0) {
										return <ColumnLetter key={colIndex} id={cellId} rowIndex={rowIndex} colIndex={colIndex} col={col}>{cell}</ColumnLetter>
									}
									else if (rowIndex === 1) {
										return <HeaderCell key={cellId} cell={cell} id={cellId} rowIndex={rowIndex} colIndex={colIndex} col={col}></HeaderCell>
									}
									else {
										return <Cell key={cellId} cell={cell} id={cellId} rowIndex={rowIndex} colIndex={colIndex} col={col}></Cell>
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


