


function cleanup_table(){
	let table = document.getElementById('scoreboard')
	let bod = document.getElementById('tb')
	bod.remove()
	
	tb = document.createElement('tbody')
	tb.id = "tb"
	table.appendChild(tb)
}


function create_row(id,name,score, parent_el){

	let vals = [id,name,score]

	let tr = document.createElement('tr')
	tr.id = 'tr' + id
	parent_el.appendChild(tr)

	tr = document.getElementById('tr' + id)	

	vals.forEach((e) => {

		let td = document.createElement('td')
		td.innerHTML = e
		tr.appendChild(td)
	})	

}

function update_scoreboard(ul){

	cleanup_table()
	var  tb = document.getElementById('tb')
		
	ul.forEach((e,i) =>{
		create_row(i+1, e.name, e.score, tb)	
	})
}
