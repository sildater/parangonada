let table;
let tablep;
let alignment; 
let feature
let canva;

let perf = {};
let score = {};
let notes = [];
let keyblocks = [];
let lines = {};

let slider_start;
let slider_len;
let slider_dur;
let slider_key;

let checkbox_key;
let checkbox_writing;







let button_save;
let button_change;
//let input_idx;
let note_one_div;
let note_two_div;

let width;
let widthinit;

let pitchmin;
let pitchmax;
let incrementy;
let notearray;

let start;
let dur;
let end;
let startmax;
let durmax;
let endmax;
let lastonset;

let pitchminpart;
let pitchmaxpart;
let incrementypart;
let notearraypart;

let startpart;
let durpart;
let endpart;



let clicked_note = null;
let right_clicked_note = null;
let connect_line = null;

function preload() {
  table = loadTable("static/ppart.csv", 'csv', 'header');
  tablepart = loadTable("static/part.csv", 'csv', 'header');
  alignment = loadTable("static/align.csv", 'csv', 'header');
  //__________________________________________________________________________________________
  feature = loadTable("static/feature.csv", 'csv', 'header');
}

function keyTyped() {
  if (key === 'a') {
    change_alignment();
  } 
}

function setup() {
  //setup the canvas
  canva = createCanvas(1000,700);
  canva.mousePressed(checknoteclicked);
  
  setup_the_pianorolls();
  //__________________________________________________________________________________________
  frameRate(10);
  

}
function setup_the_pianorolls(){
// find maximal start and end in performance
startmax = min(table.getColumn('onset_sec'));
endmax = max(table.getColumn('onset_sec'))+max(table.getColumn('duration_sec'));
durmax = endmax-startmax; 

// set start and end of selection in performance
start = min(table.getColumn('onset_sec'));
end = start+5;
dur = 5; 
// buttons and divs on the page
button_change = createButton('change alignment');
//button.position(19, 19);
button_change.mousePressed(change_alignment);
button_save = createButton('save alignment');
//button.position(19, 19);
button_save.mousePressed(save_alignment);
createDiv("left click on a note to see its alignment");
createDiv("right click another note to temporarily align them");
createDiv("middle click to unmark any notes");
createDiv("press key 'a' or button 'change alignment' to fix the alignment");
createDiv("press button 'save alignment' to download a csv file of note alignments");
note_one_div = createDiv('no note clicked');
note_two_div = createDiv('no note right clicked');

// set pitch of selection in performance
pitchmin = min(table.getColumn("pitch"));
pitchmax = max(table.getColumn("pitch"));
incrementy = floor(300/(pitchmax- pitchmin+1));

pitchminpart = min(tablepart.getColumn("pitch"));
pitchmaxpart = max(tablepart.getColumn("pitch"));
incrementypart = floor(300/(pitchmaxpart- pitchminpart+1));


// magnification number
width = 10000/80*dur; // 125 pixel / second
widthinit = 10000/80*dur; // 125 pixel / second

createDiv("set the magnification of the performance piano roll: default 1 = 125 pixel / sec");
slider_len = createInput("1");
createDiv("set the beginning of the performance piano roll: default "+startmax+" sec, min "+startmax+" max "+endmax+" sec");
slider_start = createInput("0");
createDiv("set the duration of the performance piano roll: default 10 sec, min 1, max "+durmax+" sec");
slider_dur = createInput("10");
checkbox_key = createCheckbox('show key tonic and fifth', false);
createDiv("set the key for tonic and fifth highlighting, 0=C, 2=D, 4=E, 5=F, 7=G, 9=A, 11=B");
slider_key = createInput("0");
checkbox_writing = createCheckbox('show performance / score background test', true);
//inp.input(myInputEvent);

//slider_start.mousePressed(slider_update);
slider_len.input(slider_update);
slider_start.input(slider_update);
slider_dur.input(slider_update);
slider_key.input(slider_update);

slider_update();

}


function slider_update(){
  // startpoint of performance pr; min firstnote max len-5
  start = max(min(Number(slider_start.value()),endmax-1),startmax);
  // duration of performance pr; min 1, max len-start
  dur = max(min(Number(slider_dur.value()),endmax-start),1);
  // update end accordingly
  end = start+dur;
  widthinit = 10000/80*dur;
  // (re)size of canvas
  width = widthinit*max(min(Number(slider_len.value()),10),0.1);
  console.log(width, start, end, dur);
  resizeCanvas(width,700);
  background(255);
  fill(0);
  rect(0,300,width,100);

  keyblocks = [];
  // compute reference key blocks in performance
  let key = max(min(Number(slider_key.value()),11),0);
  for (let p = pitchmin; p < pitchmax; p++){
    if (p%12==key) {
      let xx = 0;
      let yy = 300-(p-pitchmin+1)*incrementy;
      let xe = width;
      let ye = incrementy;
      let keyblock = new NoteRectangle(xx,yy,xe,ye, "tonic", "keyblock");
      keyblock.col = color(100,0,0,50);
      keyblocks.push(keyblock);
    }
    if (p%12==(key+7)%12) {
      let xx = 0;
      let yy = 300-(p-pitchmin+1)*incrementy;
      let xe = width;
      let ye = incrementy;
      let keyblock = new NoteRectangle(xx,yy,xe,ye, "fifth", "keyblock");
      keyblock.col = color(50,50,50,50);
      keyblocks.push(keyblock);
    } 
  }
  // compute reference key blocks in score
  for (let p = pitchminpart; p < pitchmaxpart; p++){
    if (p%12==key) {
      let xx = 0;
      let yy = 700-(p-pitchminpart+1)*incrementypart;
      let xe = width;
      let ye = incrementypart;
      let keyblock = new NoteRectangle(xx,yy,xe,ye, "tonic", "keyblock");
      keyblock.col = color(100,0,0,50);
      keyblocks.push(keyblock);
    }
    if (p%12==(key+7)%12) {
      let xx = 0;
      let yy = 700-(p-pitchminpart+1)*incrementypart;
      let xe = width;
      let ye = incrementypart;
      let keyblock = new NoteRectangle(xx,yy,xe,ye, "fifth", "keyblock");
      keyblock.col = color(50,50,50,50);
      keyblocks.push(keyblock);
    } 
  }


  // compute notearrays and match array within the given (start-end)
  notearray= onset_offset_in_limits (table, start, end);
  lastonset= notearray[notearray.length-1][1]-start;
  matchl = alignment_ids(notearray, alignment, tablepart);
  notearraypart= onset_offset_in_limits_p (tablepart, startpart, endpart);

  notes = [];
  perf = {};
  score = {};

  // generate new NoteRectangles for the performance
  for (let r = 0; r < notearray.length; r++){
    let xx = (notearray[r][1]-start)/dur*width;
    let yy = 300-(notearray[r][2]-pitchmin+1)*incrementy;
    let xe = notearray[r][0]/dur*width;
    let ye = incrementy;

    perf[notearray[r][3]] = new NoteRectangle(xx,yy,xe,ye, notearray[r][3], "perf");
    notes.push(perf[notearray[r][3]]);    
  }

  // generate new NoteRectangles for the score
  for (let r = 0; r < notearraypart.length; r++){
    let xxp = (notearraypart[r][1]-startpart)/durpart*width;
    let yyp = 700-(notearraypart[r][2]-pitchminpart+1)*incrementypart;
    let xep = notearraypart[r][0]/durpart*width;
    let yep = incrementypart;
    score[notearraypart[r][3]] = new NoteRectangle(xxp,yyp,xep,yep, notearraypart[r][3], "score");
    notes.push(score[notearraypart[r][3]]);
  }
  
  // generate lines
  lines_from_matchl();

  //__________________________________________________________________________________________
  // add articulation to score notes
  for (let r = 0; r < feature.getRowCount(); r++){
  if (feature.getColumn("id")[r] in score) {
    console
    score[feature.getColumn("id")[r]].vel = feature.getColumn("velocity")[r]*2;
    score[feature.getColumn("id")[r]].art = feature.getColumn("articulation")[r]*2;
    score[feature.getColumn("id")[r]].tim = feature.getColumn("timing")[r]*2;
  }
  }
  
}



// generate lines from global variable matchl
function lines_from_matchl () {
  lines = {};
  let ppartid;
  let partid;
  let partnote;
  let ppartnote;
  for (let r = 0; r < matchl.length; r++){
    ppartid =  matchl[r][0];
    partid =  matchl[r][1];
    partnote = score[partid];
    ppartnote = perf[ppartid];
    //print(partnote, partid,  ppartnote, ppartid)
    partnote.link(ppartid); 
    ppartnote.link(partid);
    lines[partid+ppartid] = new NoteLine(partnote.x,partnote.y,ppartnote.x,ppartnote.y, ppartid, partid);
  };

}





function draw() {
    background(255);
    fill(0);
    stroke(0);
    rect(0,300,width,100);

    if (checkbox_writing.checked()){
      textSize(300);
      fill(0, 102, 153, 71);
      stroke(255);
      text('performance', 25, 200);
      text('score', 25, 600);
    }
    
    if (checkbox_key.checked()){
      for(var i = 0; i < keyblocks.length; i++){
        keyblocks[i].display();
      }
    }


  

  for(var i = 0; i < notes.length; i++){
    notes[i].display();
  }
  for (var key in lines) {
    
    lines[key].display();
    
}
  if (connect_line) {
    connect_line.display();
  }
}



// get an array of arrays of notes in table that lie within (start-end): performance
function onset_offset_in_limits (table, start, end) {
  let d = [];
  for (let r = 0; r < table.getRowCount(); r++){
    if ( table.getColumn("onset_sec")[r] >= start && table.getColumn("onset_sec")[r] < end) {
      d.push([table.getColumn("duration_sec")[r] ,table.getColumn("onset_sec")[r] ,table.getColumn("pitch")[r], table.getColumn("id")[r],   table.getColumn("velocity")[r]])
    }
  }
return d
}

// get an array of arrays of notes in table that lie within (start-end): score
function onset_offset_in_limits_p (table, start, end) {
  let d = [];
  for (let r = 0; r < table.getRowCount(); r++){
    if ( table.getColumn("onset_beat")[r] >= start && table.getColumn("onset_beat")[r] < end) {
      d.push([table.getColumn("duration_beat")[r] ,table.getColumn("onset_beat")[r] ,table.getColumn("pitch")[r], table.getColumn("id")[r]])
    }
  }
return d
}

// get an array of alignments from a notearray (performance), an alignment csv and a score note csv
function alignment_ids (array, alignment, table) {
  let matchl = [];
  let part_onsets = [];
  //let part_offsets = [];
  for (let r = 0; r < alignment.getRowCount(); r++){
    for (let k = 0; k < array.length; k++){
      if (alignment.getColumn("ppartid")[r] == array[k][3] && alignment.getColumn("matchtype")[r] == "0") {
        matchl.push([alignment.getColumn("ppartid")[r], alignment.getColumn("partid")[r]]);
        let note = table.findRow(alignment.getColumn("partid")[r], "id");
        part_onsets.push(parseFloat(note.obj["onset_beat"]));
        //part_offsets.push(parseFloat(note.obj["onset"])+parseFloat(note.obj["duration"]));
        
      }
  
    }

  }

  startpart = Math.min(...part_onsets);
  durpart = dur/lastonset*(Math.max(...part_onsets)-startpart);
  endpart = durpart+startpart;
  return matchl
}



function NoteRectangle(x, y, xl, yl, name, type, vel=null, art=null, tim=null ) {
  this.x = x;
  this.y = y;
  this.xl = xl;
  this.yl = yl;
  this.col = color(255, 0, 0);
  this.col_click = color(0, 255, 255);
  this.col_clickr = color(0, 255, 124);
  this.col_line = color(255, 0, 124);
  this.col_line1 = color(0, 255, 0);
  this.col_line2 = color(124, 124, 0);
  this.name = name;
  this.linked_note = "";
  this.textSIZ = 14;
  this.textSIZ_click = 24;
  this.type = type;
  this.clik = false;
  this.rclik = false;
  this.vel = vel;
  this.art = art;
  this.tim = tim;
  
  this.reset = function(){
    this.col = color(255,0,0);
    this.linked_note = "";
    this.clik = false;
    this.rclik = false;
  }
  this.link = function (linked_note_id){
    this.linked_note = linked_note_id;
    this.col = color(0,0,255,100);
  }

  this.rebase = function() {
    this.clik = false;
  };
  this.display = function() {
    if (this.clik) {
      stroke(this.col_click);
      textSize(this.textSIZ_click);
      fill(this.col_click);
      rect(this.x, this.y, this.xl, this.yl);
      text(this.name, this.x,this.y);
    }
    else if ( this.rclik) {
      stroke(this.col_clickr);
      textSize(this.textSIZ_click);
      fill(this.col_clickr);
      rect(this.x, this.y, this.xl, this.yl);
      text(this.name, this.x,this.y);
    }
    else {
      stroke(255);
      textSize(this.textSIZ);
      fill(this.col);
      rect(this.x, this.y, this.xl, this.yl);
      text(this.name, this.x,this.y);
    }
    if (this.vel) {
        /* timing: the higher the value the earlier the note (more to left)
        push();
        strokeWeight(2);
        stroke(this.col_line)
        line(this.x,this.y,this.x-this.tim, this.y)
        circle(this.x-this.tim, this.y, 10);
        pop();*/
        // articulation: the higher the value the more staccato the note (= -log(ratio), more to the left)
        push();
        strokeWeight(2);
        stroke(this.col_line1)
        line(this.x+this.xl,this.y+this.yl,this.x+this.xl+this.art, this.y+this.yl)
        circle(this.x+this.xl+this.art, this.y+this.yl, 10);
        pop();
        /* velocity: the higher the value the louder the note (more upwards)
        push();
        strokeWeight(2);
        stroke(this.col_line2)
        line(this.x+this.xl/2,this.y,this.x+this.xl/2, this.y-this.vel)
        circle(this.x+this.xl/2, this.y-this.vel, 10);
        pop();*/
    }
    

  };

  this.clicked = function() {
    if(mouseX>=this.x && mouseX<this.x+this.xl && mouseY>=this.y && mouseY<this.y+this.yl){
    
    this.clik = true;
        if (this.linked_note != "" && this.type == "score") {
            perf[this.linked_note].clik = true;  
        }
        else if (this.linked_note != "" && this.type == "perf") {
            score[this.linked_note].clik = true;
        }
    clicked_note = this;
    note_one_div.html("note 1 id::: "+this.name);
    }
  };
  

  this.right_rebase = function() {
    this.rclik = false;
  };
 

  this.right_clicked = function() {
    if(mouseX>=this.x && mouseX<this.x+this.xl && mouseY>=this.y && mouseY<this.y+this.yl){
    this.rclik = true;
        if (this.linked_note != "" && this.type == "score") {
            perf[this.linked_note].rclik = true;  
        }
        else if (this.linked_note != "" && this.type == "perf") {
            score[this.linked_note].rclik = true;
        }
    right_clicked_note = this;
    note_two_div.html("note 2 id::: "+this.name);
    }
  }; 




}


function click_cleanup(){
  connect_line = null;
  note_one_div.html('no note clicked');
  clicked_note=null;
  right_clicked_note=null;
  note_two_div.html('no note right clicked');
  for(var i = 0; i < notes.length; i++){
    notes[i].rebase();
    notes[i].right_rebase();
    }
  for(key in lines){
    lines[key].clicked();
  }
  
};





function checknoteclicked() {
  
  if (mouseButton === LEFT) {
    connect_line = null;
    note_one_div.html('no note clicked');
    clicked_note=null;
  for(var i = 0; i < notes.length; i++){
    notes[i].rebase();
    }
  for(var i = 0; i < notes.length; i++){
    notes[i].clicked();
  
    }
  }
  if (mouseButton === RIGHT) {
    right_clicked_note=null;
    note_two_div.html('no note right clicked');
    for(var i = 0; i < notes.length; i++){
      notes[i].right_rebase();
    }
    for(var i = 0; i < notes.length; i++){
      notes[i].right_clicked();
    } 
  }
  if (mouseButton === CENTER) {
    right_clicked_note=null;
    clicked_note=null;
    connect_line = null;
    note_one_div.html('no note clicked');
    note_two_div.html('no note right clicked');
  
    for(var i = 0; i < notes.length; i++){
    notes[i].rebase();
    notes[i].right_rebase();
    }
  }


  
  if (right_clicked_note && clicked_note) {
    if (right_clicked_note.type == clicked_note.type)
    {
      alert("both notes are from the same piano roll ya plonker...");
      right_clicked_note = null;
      note_two_div.html('no note right clicked');
      for(var i = 0; i < notes.length; i++){
        notes[i].right_rebase();
      }
    }
    else {
      
      if (clicked_note.type == "perf"){// right clicked note is score note
        connect_line = new NoteLine(clicked_note.x, clicked_note.y, right_clicked_note.x, right_clicked_note.y, 
        clicked_note.name, right_clicked_note.name);
      }
      else {// right clicked note is perf note
        connect_line = new NoteLine(clicked_note.x, clicked_note.y, right_clicked_note.x, right_clicked_note.y, 
        right_clicked_note.name, clicked_note.name);
      }
      
      connect_line.wei = 2;
      connect_line.col = color(205,255,50);

    }
  }
  for(key in lines){
    lines[key].clicked();
  }
}

function NoteLine(x1, y1, x2, y2, perfnote, scorenote) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
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
            this.wei = 3;
        } 
        else if (score[this.scorenote].rclik || perf[this.perfnote].rclik){
          this.col = color(255,0,125);
          this.wei = 3;
      }
        else {
            this.col = this.col_original
            this.wei = 1;
        }
          
    };
    
  }


function save_alignment() {
  saveTable(alignment, "new_alignment.csv")
}

function change_alignment() {
  if (clicked_note && right_clicked_note){

  
  //let new_idx = input_idx.input();
  let perf_still;
  let score_nomore;
  let score_still;
  let perf_nomore;
  if (clicked_note.type == "perf")
  {
     perf_still = clicked_note.name;
     score_nomore =  clicked_note.linked_note;
     score_still = right_clicked_note.name;
     perf_nomore =  right_clicked_note.linked_note;
  }
  else{
     perf_still = right_clicked_note.name;
     score_nomore =  right_clicked_note.linked_note;
     score_still = clicked_note.name;
     perf_nomore =  clicked_note.linked_note;
  }
  // table
  let newRow = alignment.addRow();
  newRow.setString('ppartid',perf_still);
  newRow.setString('partid', score_still);
  newRow.setString('matchtype', '0');
  // reset the notes
  score[score_still].reset();
  perf[perf_still].reset();
  score[score_still].link(perf_still);
  perf[perf_still].link(score_still);
  lines[score_still+perf_still] = new NoteLine(score[score_still].x,score[score_still].y,
                                              perf[perf_still].x,perf[perf_still].y, perf_still, score_still);
  
  if (perf_nomore != "") {
    // table
    let row = alignment.findRow(perf_nomore, "ppartid");
    row.obj["partid"] = "undefined";
    row.obj["matchtype"] = "2";
    // reset the note
    perf[perf_nomore].reset();
    // delete the line
    delete lines[score_still+perf_nomore] ;
  }
 
  if (score_nomore != "") {
    // table
    let rowp = alignment.findRow(score_nomore, "partid");
    rowp.obj["ppartid"] = "undefined";
    rowp.obj["matchtype"] = "12";
    // reset the note
    score[score_nomore].reset();
    // delete the line
    delete lines[score_nomore+perf_still] ;
  }

  
  click_cleanup();
  // update match lines
  //matchl = alignment_ids(notearray, alignment, tablepart);


}
else {
  alert("mark two notes for alignment...");
}
  
}