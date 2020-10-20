let table;
let tablep;
let alignment; 
let canva;

let perf = {};
let score = {};
let notes = [];

let slider_start;
let slider_len;

let pitchmin;
let pitchmax;
let incrementy;
let notearray;

let start;
let dur;
let end;
let lastonset;

let pitchminpart;
let pitchmaxpart;
let incrementypart;
let notearraypart;

let startpart;
let durpart;
let endpart;

let ppartid;
let partid;
let partnote;
let ppartnote;

function preload() {
  table = loadTable("static/ppart.csv", 'csv', 'header');
  tablepart = loadTable("static/part.csv", 'csv', 'header');
  alignment = loadTable("static/align.csv", 'csv', 'header');
}

function setup() {
  //setup the canvas
  canva = createCanvas(10000,700);
  canva.mousePressed(checknoteclicked);
  fill(0);
  rect(50,300,1000,100);

  slider_start= createSlider(0,max(table.getColumn('p_onset')), min(table.getColumn('p_onset')));
  slider_len = createSlider(1,100,5);

  pitchmin = min(table.getColumn("pitch"));
  pitchmax = max(table.getColumn("pitch"));
  incrementy = floor(300/(pitchmax- pitchmin+1));

  pitchminpart = min(tablepart.getColumn("pitch"));
  pitchmaxpart = max(tablepart.getColumn("pitch"));
  incrementypart = floor(300/(pitchmaxpart- pitchminpart+1));

  slider_update();
  slider_start.mousePressed(slider_update);
  slider_len.mousePressed(slider_update);

}

function slider_update(){
  background(255);
  fill(0);
  rect(0,300,1000,100);

  start = slider_start.value();
  dur = slider_len.value();
  end = dur + start ;

  notearray= onset_offset_in_limits (table, start, end);
  lastonset= notearray[notearray.length-1][1]-start;
  matchl = alignment_ids (notearray, alignment, tablepart)
  notearraypart= onset_offset_in_limits_p (tablepart, startpart, endpart);

  notes = [];
  perf = {};
  score = {};

  for (let r = 0; r < notearray.length; r++){
    let xx = (notearray[r][1]-start)/dur*1000;
    let yy = 300-(notearray[r][2]-pitchmin+1)*incrementy;
    let xe = notearray[r][0]/dur*1000;
    let ye = incrementy;

    perf[notearray[r][3]] = new NoteRectangle(xx,yy,xe,ye, notearray[r][3]);
    notes.push(perf[notearray[r][3]]);    
  }

  
  for (let r = 0; r < notearraypart.length; r++){
    let xxp = (notearraypart[r][1]-startpart)/durpart*1000;
    let yyp = 700-(notearraypart[r][2]-pitchminpart+1)*incrementypart;
    let xep = notearraypart[r][0]/durpart*1000;
    let yep = incrementypart;
    score[notearraypart[r][3]] = new NoteRectangle(xxp,yyp,xep,yep, notearraypart[r][3]);
    notes.push(score[notearraypart[r][3]]);
  }
  
  for (let r = 0; r < matchl.length; r++){
    ppartid =  matchl[r][0];
    partid =  matchl[r][1];
    partnote = score[partid];
    ppartnote = perf[ppartid];
    //print(partnote, partid,  ppartnote, ppartid)
    
    partnote.col = color(0,0,255);
    partnote.col_original = color(0,0,255);
    ppartnote.col = color(0,0,255);
    ppartnote.col_original = color(0,0,255);
    stroke(0,200,250);
    line(partnote.x,partnote.y,ppartnote.x,ppartnote.y);
  }
  
}


function draw() {
  for(var i = 0; i < notes.length; i++){
    notes[i].display();
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


function alignment_ids (array, alignment, table) {
  let matchl = [];
  let part_onsets = [];
  //let part_offsets = [];
  for (let r = 0; r < alignment.getRowCount(); r++){
    for (let k = 0; k < array.length; k++){
      if (alignment.getColumn("ppartid")[r] == array[k][3] && alignment.getColumn("matchtype")[r] == "0") {
        matchl.push([alignment.getColumn("ppartid")[r], alignment.getColumn("partid")[r]]);
        let note = table.findRow(alignment.getColumn("partid")[r], "id");
        part_onsets.push(parseFloat(note.obj["onset"]));
        //part_offsets.push(parseFloat(note.obj["onset"])+parseFloat(note.obj["duration"]));
        
      }
  
    }

  }

  startpart = Math.min(...part_onsets);
  durpart = dur/lastonset*(Math.max(...part_onsets)-startpart);
  endpart = durpart+startpart;
  return matchl
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

function NoteRectangle(x, y, xl, yl, name) {
  this.x = x;
  this.y = y;
  this.xl = xl;
  this.yl = yl;
  this.col = color(255, 0, 0);
  this.col_original = color(255, 0, 0);
  this.name = name;
  
  this.display = function() {
    stroke(255);
    textSize(14);
    fill(this.col);
    rect(this.x, this.y, this.xl, this.yl);
    text(this.name, this.x,this.y);
  };

  this.clicked = function() {
    if(mouseX>=this.x && mouseX<this.x+this.xl && mouseY>=this.y && mouseY<this.y+this.yl){
    this.col = color(random(255), random(255), random(255));
    
    //print(mouseX, mouseY, this.x, this.y);
    }
    else {
        this.col = this.col_original;
    }
  };
}

function checknoteclicked() {
  
  for(var i = 0; i < notes.length; i++){
    notes[i].clicked();
  }
}
