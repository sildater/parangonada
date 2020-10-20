let table;
let tablep;
let alignment; 
let canva;

let perf = {};
let score = {};
let notes = [];
let lines = [];

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
  canva = createCanvas(1000,700);
  canva.mousePressed(checknoteclicked);
  //slider_start= createSlider(0,max(table.getColumn('p_onset')), min(table.getColumn('p_onset')));
  start = min(table.getColumn('p_onset'));
  end = max(table.getColumn('p_onset'));
  dur = end-start;  
  let widthinit = 10000/80*dur;
  let widthmax = widthinit * 3;

  slider_len = createSlider(1000,widthmax,widthinit);

  pitchmin = min(table.getColumn("pitch"));
  pitchmax = max(table.getColumn("pitch"));
  incrementy = floor(300/(pitchmax- pitchmin+1));

  pitchminpart = min(tablepart.getColumn("pitch"));
  pitchmaxpart = max(tablepart.getColumn("pitch"));
  incrementypart = floor(300/(pitchmaxpart- pitchminpart+1));
 

  slider_update();
  //slider_start.mousePressed(slider_update);
  slider_len.mousePressed(slider_update);

}

function slider_update(){
  resizeCanvas(slider_len.value(),700)
  background(255);
  fill(0);
  rect(0,300,slider_len.value(),100);



  notearray= onset_offset_in_limits (table, start, end);
  lastonset= notearray[notearray.length-1][1]-start;
  matchl = alignment_ids (notearray, alignment, tablepart)
  notearraypart= onset_offset_in_limits_p (tablepart, startpart, endpart);

  notes = [];
  perf = {};
  score = {};

  for (let r = 0; r < notearray.length; r++){
    let xx = (notearray[r][1]-start)/dur*slider_len.value();
    let yy = 300-(notearray[r][2]-pitchmin+1)*incrementy;
    let xe = notearray[r][0]/dur*slider_len.value();
    let ye = incrementy;

    perf[notearray[r][3]] = new NoteRectangle(xx,yy,xe,ye, notearray[r][3], "perf");
    notes.push(perf[notearray[r][3]]);    
  }

  
  for (let r = 0; r < notearraypart.length; r++){
    let xxp = (notearraypart[r][1]-startpart)/durpart*slider_len.value();
    let yyp = 700-(notearraypart[r][2]-pitchminpart+1)*incrementypart;
    let xep = notearraypart[r][0]/durpart*slider_len.value();
    let yep = incrementypart;
    score[notearraypart[r][3]] = new NoteRectangle(xxp,yyp,xep,yep, notearraypart[r][3], "score");
    notes.push(score[notearraypart[r][3]]);
  }
  
  for (let r = 0; r < matchl.length; r++){
    ppartid =  matchl[r][0];
    partid =  matchl[r][1];
    partnote = score[partid];
    ppartnote = perf[ppartid];
    //print(partnote, partid,  ppartnote, ppartid)
    partnote.linked_note = ppartid;
    partnote.col = color(0,0,255);
    partnote.col_original = color(0,0,255);
    ppartnote.linked_note = partid;
    ppartnote.col = color(0,0,255);
    ppartnote.col_original = color(0,0,255);
    lines.push(new NoteLine(partnote.x,partnote.y,ppartnote.x,ppartnote.y, ppartid, partid));
  }
  
}







function draw() {
    background(255);
    fill(0);
    rect(0,300,slider_len.value(),100);

  for(var i = 0; i < notes.length; i++){
    notes[i].display();
  }
  for(var i = 0; i < lines.length; i++){
    lines[i].display();
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

function NoteRectangle(x, y, xl, yl, name, type) {
  this.x = x;
  this.y = y;
  this.xl = xl;
  this.yl = yl;
  this.col = color(255, 0, 0);
  this.col_original = color(255, 0, 0);
  this.name = name;
  this.linked_note = "";
  this.textSIZ = 14;
  this.type = type;
  this.clik = false;
  
  
  this.display = function() {
    stroke(255);
    textSize(this.textSIZ);
    fill(this.col);
    rect(this.x, this.y, this.xl, this.yl);
    text(this.name, this.x,this.y);
  };

  this.clicked = function() {
    if(mouseX>=this.x && mouseX<this.x+this.xl && mouseY>=this.y && mouseY<this.y+this.yl){
    this.col = color(0, 255, 255);
    this.textSIZ = 24;
    this.clik = true;
        if (this.linked_note != "" && this.type == "score") {
            perf[this.linked_note].col=color(0, 255, 255);
            perf[this.linked_note].textSIZ = 24;
            
        }
        else if (this.linked_note != "" && this.type == "perf") {
            print("got here", this.linked_note);
            score[this.linked_note].col=color(0, 255, 255);
            score[this.linked_note].textSIZ = 24;
            print(score[this.linked_note].textSIZ);
            
        }
    
    }

    else {
        this.col = this.col_original;
        this.textSIZ = 14;
        this.clik = false;
    }
  };
}

function checknoteclicked() {
  
  for(var i = 0; i < notes.length; i++){
    notes[i].clicked();
  }
  for(var i = 0; i < lines.length; i++){
    lines[i].clicked();
  }
}

function NoteLine(x1, y1, x2, y2, perfnote, scorenote) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.col = color(255, 0, 0);
    this.col_original = color(255, 0, 0);
    this.perfnote = perfnote;
    this.scorenote = scorenote;
    this.col = color(0,200,250);
    this.col_original = color(0,200,250);
    this.wei = 1;
    
    
    this.display = function() {
        stroke(this.col);
        strokeWeight(this.wei);
        line(this.x1,this.y1,this.x2,this.y2);
    };
  
    this.clicked = function() {
        if (score[this.scorenote].clik || perf[this.perfnote].clik){
            this.col = color(255,0,255);
            this.wei = 4;
        } 
        else {
            this.col = this.col_original
            this.wei = 1;
        }
          
    };
  }