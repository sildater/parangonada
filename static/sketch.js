let table;
let tablep;
let alignment; 

let perf = {};
let score = {};

let slider_start;
let slider_len;

let pitchmin;
let pitchmax;
let incrementy;
let notearray;

let start;
let dur;
let end;

let pitchminpart;
let pitchmaxpart;
let incrementypart;
let notearraypart;

let startpart;
let durpart;
let endpart;

function preload() {
  table = loadTable("static/ppart.csv", 'csv', 'header');
  tablepart = loadTable("static/part.csv", 'csv', 'header');
  alignment = loadTable("static/align.csv", 'csv', 'header');
}

function setup() {
  //setup the canvas
  createCanvas(1000,700);
  fill(0);
  rect(50,300,1000,100);

  slider_start= createSlider(0,max(table.getColumn('p_onset')), min(table.getColumn('p_onset')));
  slider_len = createSlider(1,10,5);

  pitchmin = min(table.getColumn("pitch"));
  pitchmax = max(table.getColumn("pitch"));
  incrementy = floor(300/(pitchmax- pitchmin+1));

  pitchminpart = min(tablepart.getColumn("pitch"));
  pitchmaxpart = max(tablepart.getColumn("pitch"));
  incrementypart = floor(300/(pitchmaxpart- pitchminpart+1));


}

function draw() {
  background(255);
  fill(0);
  rect(0,300,1000,100);
  fill(255);


  start = slider_start.value();
  dur = slider_len.value();
  end = dur + start ;


  notearray= onset_offset_in_limits (table, start, end);
  match = alignment_ids (notearray, alignment, tablepart)
  notearraypart= onset_offset_in_limits_p (tablepart, startpart, endpart);



  for (let r = 0; r < notearray.length; r++){

    fill(0,0,notearray[r][4]*2);
    let xx = (notearray[r][1]-start)/dur*1000;
    let yy = 300-(notearray[r][2]-pitchmin+1)*incrementy;
    let xe = notearray[r][0]/dur*1000;
    let ye = incrementy;
    perf[notearray[r][3]] = rect(xx,yy,xe,ye);
    
  }

  
  for (let r = 0; r < notearraypart.length; r++){
    fill(0,0,125);
    let xxp = (notearraypart[r][1]-startpart)/durpart*1000;
    let yyp = 700-(notearraypart[r][2]-pitchminpart+1)*incrementypart;
    let xep = notearraypart[r][0]/durpart*1000;
    let yep = incrementypart;
    score[notearraypart[r][3]] = rect(xxp,yyp,xep,yep);
  }


}

function onset_offset_in_limits (table, start, end) {
  let d = [];
  for (let r = 0; r < table.getRowCount(); r++){
    if ( table.getColumn("p_onset")[r] >= start && table.getColumn("p_onset")[r] < end) {
      d.push([table.getColumn("p_duration")[r] ,table.getColumn("p_onset")[r] ,table.getColumn("pitch")[r], table.getColumn("id")[r],   table.getColumn("velocity")[r]])
    }
  }
return d
}
function onset_offset_in_limits_p (table, start, end) {
  let d = [];
  for (let r = 0; r < table.getRowCount(); r++){
    if ( table.getColumn("onset")[r] >= start && table.getColumn("onset")[r] < end) {
      d.push([table.getColumn("duration")[r] ,table.getColumn("onset")[r] ,table.getColumn("pitch")[r], table.getColumn("id")[r]])
    }
  }
return d
}


let part_onsets = [];
function alignment_ids (array, alignment, table) {
  let match = [];
  part_onsets = [];
  for (let r = 0; r < alignment.getRowCount(); r++){
    for (let k = 0; k < array.length; k++){
      if (alignment.getColumn("ppartid")[r] == array[k][3] && alignment.getColumn("matchtype")[r] == "0") {
        match.push([alignment.getColumn("ppartid")[r], alignment.getColumn("partid")[r]]);
        let note = table.findRow(alignment.getColumn("partid")[r], "id")
        part_onsets.push(parseFloat(note.obj["onset"]))
        
      }
  
    }

  }

  startpart = Math.min(...part_onsets);
  endpart = Math.max(...part_onsets);
  durpart = endpart - startpart;


  return match
}



function onset_offset_in_connection (table, array, alignment) {
  let d = [];
  for (let r = 0; r < table.getRowCount(); r++){
    if ( table.getColumn("p_onset")[r] >= start && table.getColumn("p_onset")[r] < end) {
      d.push([table.getColumn("p_duration")[r] ,table.getColumn("p_onset")[r] ,table.getColumn("pitch")[r], table.getColumn("id")[r],   table.getColumn("velocity")[r]])
    }
  }

return d
}