let table;
let tablep;
let alignment; 
let zalignment;
let feature;
let annotations; 

let canva;
let canvaBuffer;

let perf = {};
let score = {};
let notes = [];
let keyblocks = [];
let lines = {};
let zlines = {};
let matchl, zmatchl;
let system_lines;

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
let start_time_div;
let end_time_div;

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
let startpart;
let durpart;
let endpart;
let startmaxpart;
let durmaxpart;
let endmaxpart;
let lastonset;

let pitchminpart;
let pitchmaxpart;
let incrementypart;
let notearraypart;

let clicked_note = null;
let right_clicked_note = null;
let connect_line = null;
let err;
let polySynth;

function preload() {
  table = loadTable("static/ppart.csv", 'csv', 'header');
  tablepart = loadTable("static/part.csv", 'csv', 'header');
  alignment = loadTable("static/align.csv", 'csv', 'header');
  zalignment = loadTable("static/align.csv", 'csv', 'header');
  //__________________________________________________________________________________________
  feature = loadTable("static/feature.csv", 'csv', 'header');
  annotations = loadTable("static/annotations.csv", 'csv', 'header');
}

//________________- upload files -__________________________
//________________TODO: deal with missing files__________________________
function redraw_with_new_files() {
  console.log("get here before loading");

  let file_names = {"align.csv":0, "feature.csv":1, "part.csv":2, "ppart.csv":3, "zalign.csv":4};
  for (let i = 0; i< document.getElementById('csv_input').files.length; i++) {
    file_names[document.getElementById('csv_input').files[i].name] = i;
    console.log(document.getElementById('csv_input').files[i].name, i);
  }
  Promise.allSettled([
    new Promise((res) => {loadTable(URL.createObjectURL(document.getElementById('csv_input').files[0]), 'csv', 'header', callback = res)}),
    new Promise((res) => {loadTable(URL.createObjectURL(document.getElementById('csv_input').files[1]), 'csv', 'header', callback = res)}),
    new Promise((res) => {loadTable(URL.createObjectURL(document.getElementById('csv_input').files[2]), 'csv', 'header', callback = res)}),
    new Promise((res) => {loadTable(URL.createObjectURL(document.getElementById('csv_input').files[3]), 'csv', 'header', callback = res)}),
    new Promise((res) => {loadTable(URL.createObjectURL(document.getElementById('csv_input').files[4]), 'csv', 'header', callback = res)})
  ])
  .then(values =>
    { table = values[file_names["ppart.csv"]]["value"];
      tablepart = values[file_names["part.csv"]]["value"];
      alignment = values[file_names["align.csv"]]["value"];
      zalignment = values[file_names["zalign.csv"]]["value"];
      feature = values[file_names["feature.csv"]]["value"];
      console.log("starting the drawing now!", values); 
      setup_the_pianorolls();
    })
  .catch(errors => {err = errors; alert("error loading one of the uploaded files");})


  
}



//________________- SETUP -__________________________

function setup() {
  //setup the canvas
  canva = createCanvas(1000,700);
  canvaBuffer = createGraphics(1000, 700);
  canva.mousePressed(checknoteclicked);
  polySynth = new p5.PolySynth();
  polySynth.setADSR(0.05,0.05,1.0, 0.05);
  setup_controls()
  setup_the_pianorolls();
  //__________________________________________________________________________________________
  frameRate(30);
  noLoop();
}

//________________- Setup the text and controls -__________________________

function setup_controls() {
  // buttons and divs on the page
  button_change = createButton('change alignment');
  //button.position(19, 19);
  button_change.mousePressed(change_alignment);
  button_save = createButton('save alignment');
  //button.position(19, 19);
  button_save.mousePressed(save_alignment);
  button_upload = createButton('visualise uploaded files');
  button_upload.mousePressed(redraw_with_new_files);

  createDiv("_______________HOWTO________________").style('font-size', "28px")
  createDiv("PARANGONADA visualizes two different alignments. " +
  "The first alignment is colored in light blue and it can be changed using the commands below. " +
  'The second alignment is colored in red (not shown by default, toggle  or press key "2") and can be used as reference. ')
  createDiv("left click on a note to see its alignment");
  createDiv("right click another note to temporarily align them");
  createDiv("middle click to unmark any notes");
  createDiv("press key 'a' or button 'change alignment' to fix the alignment");
  createDiv("press button 'save alignment' to download a csv file of note alignments");

  createDiv("_______________LEGEND________________").style('font-size', "28px")
  note_one_div = createDiv('no note clicked');
  note_two_div = createDiv('no note right clicked');
  createDiv("the note colors whether a note is aligned and whether the first and second alignment agree: ")
  createDiv("matched notes with MATCHING alignments in the first and second alignment. ").style('color',color(0,0,255)); 
  createDiv("insertion / deletion notes with MATCHING non-alignments in the first and second alignment. ").style('color',color(255, 0, 0)); 
  createDiv("matched notes with MISMATCHING alignments in the first and second alignment. ").style('color',color(255,217,25)); 
  createDiv("matched notes in the first alignment, non-aligned in the second (reference). ").style('color',color(130,130,0)); 
  createDiv("matched notes in the second (reference) alignment, non-aligned in the first. ").style('color',color(0,102,17)); 
  
  createDiv("_______________SEGMENT PARAMETERS________________").style('font-size', "28px")
  createDiv("set the magnification of the performance piano roll: default 1 = 125 pixel / sec");
  slider_len = createInput("1");
  start_time_div = createDiv("set the beginning of the performance piano roll: default *loading* sec, min *loading* max *loading* sec");
  slider_start = createInput("0");
  button_jump5 = createButton('jump forwards by 5 seconds');
  button_jump5.mousePressed(()=>{
    let val = Number(slider_start.value())+5;
    slider_start.elt.value = str(val);
    //console.log(val);
    slider_update();});
  button_jump5b = createButton('jump backwards by 5 seconds');
  button_jump5b.mousePressed(()=>{
      let val = Number(slider_start.value())-5;
      slider_start.elt.value = str(val);
      //console.log(val);
      slider_update();});
  end_time_div = createDiv("set the duration of the performance piano roll: default *loading* sec, min *loading*, max *loading* sec");
  slider_dur = createInput("30");
  createDiv("set the key for tonic and fifth highlighting, 0=C, 2=D, 4=E, 5=F, 7=G, 9=A, 11=B");
  slider_key = createInput("0");

  /*slider_len.input(slider_update);
  slider_start.input(slider_update);
  slider_dur.input(slider_update);
  slider_key.input(slider_update);*/
  button_update = createButton('update visualization with the values set above');
  button_update.mousePressed(slider_update);
  checkbox_fullsegment = createCheckbox('show full performance and score (segment times above have no influence)', false);
  checkbox_fullsegment.changed(slider_update);

  createDiv("_______________VISUALIZATION TOGGLES________________").style('font-size', "28px")
  createDiv("____ score and performance metadata _____")
  checkbox_key = createCheckbox('show key tonic and fifth', false);
  checkbox_key.changed(checkbox_update);
  checkbox_system = createCheckbox('show staff lines', false);
  checkbox_system.changed(checkbox_update);
  checkbox_times = createCheckbox('show seconds in performance', true);
  checkbox_times.changed(checkbox_update);
  checkbox_beat_times = createCheckbox('show beats in score', true);
  checkbox_beat_times.changed(checkbox_update);
  checkbox_writing = createCheckbox('show performance / score background text', true);
  checkbox_writing.changed(checkbox_update);
  createDiv("____ alignment lines and expressive features _____")
  checkbox_alignment = createCheckbox('show alignment lines, press key "1" or check:', true);
  checkbox_alignment.changed(checkbox_update);
  checkbox_zalignment = createCheckbox('show second alignment lines, press key "2" or check:', false);
  checkbox_zalignment.changed(checkbox_update);
  checkbox_art = createCheckbox('show articulation values in score', false);
  checkbox_art.changed(checkbox_update);
  checkbox_tim = createCheckbox('show timing values in score', false);
  checkbox_tim.changed(checkbox_update);
  checkbox_vel = createCheckbox('show velocity values in score', false);
  checkbox_vel.changed(checkbox_update);
  createDiv("set the magnification of expressive features in the score");
  feature_slider = createSlider(0.1, 5, 2, 0.01);
  feature_slider.changed(note_slider_update);
  createDiv("set the opacity of aligned notes");
  color_slider = createSlider(0, 255, 200,1);
  color_slider.changed(note_slider_update);

  createDiv("_______________TAPPING PARAMETERS________________").style('font-size', "28px")
  createDiv("PARANGONDA can also annotate your tapping to the score")
  createDiv('Press "z" to start and stop the playback, press "t" to add an annotation at the current playhead while playing.')
  createDiv('While no playback is running you can delete the annotations one by one using "r".')
  createDiv("set the start time of the playback in the performance in seconds:");
  slider_start_align = createInput("1");
  slider_start_align.changed(align_slider_update);
  createDiv("set the first beat to align:");
  slider_beat_start = createInput("0");
  slider_beat_start.changed(align_slider_update);
  createDiv("set the beat interval to align:");
  slider_beat_interval = createInput("1");
  slider_beat_interval.changed(align_slider_update);
  button_export_annotations = createButton('export tapping annotations as csv:');
  button_export_annotations.mousePressed(export_annotations);
  
}


//________________- Setup The Piano Rolls -__________________________


function setup_the_pianorolls(){
  console.log("setup the pianorolls");
  // find maximal start and end in performance
  startmax = min(table.getColumn('onset_sec'));
  endmax = max(table.getColumn('onset_sec'))+max(table.getColumn('duration_sec'));
  durmax = endmax-startmax; 
  console.log(startmax, endmax, durmax, "PERFORMANCE: startmax, endmax, durmax")
  startmaxpart = min(tablepart.getColumn('onset_beat'));
  endmaxpart = max(tablepart.getColumn('onset_beat'))+max(tablepart.getColumn('duration_beat'));
  durmaxpart = endmaxpart-startmaxpart; 
  console.log(startmaxpart, endmaxpart, durmaxpart, "SCORE: startmax, endmax, durmax")

  // set start and end of selection in performance
  start = min(table.getColumn('onset_sec'));
  end = start+30;
  dur = 5; 
  
  // change the test in the description divs
  start_time_div.elt.innerHTML = "set the beginning of the performance piano roll: default max(0,start) sec, min "+startmax+" max "+endmax+" sec";
  end_time_div.elt.innerHTML = "set the duration of the performance piano roll: default min(30,duration) sec, min 1, max "+durmax+" sec";
  slider_start.elt.value = str(max(0,startmax))
  slider_start_align.elt.value = str(max(0,startmax))
  slider_dur.elt.value = str(min(30,durmax))


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


  slider_update();

}



//________________- Slider Update -__________________________


function slider_update(){
  console.log("slider update");
  stop_loop();
  if (!checkbox_fullsegment.checked()) { // Segment defined by sliders
    // startpoint of performance pr; min firstnote max len-5
    start = max(min(Number(slider_start.value()),endmax-1),startmax);
    // duration of performance pr; min 1, max len-start
    dur = max(min(Number(slider_dur.value()),endmax-start),1);
    // update end accordingly
    end = start+dur;
    widthinit = 10000/80*dur;
    // (re)size of canvas
    width = widthinit*max(min(Number(slider_len.value()),10),0.1);
    console.log("width, start, end, dur",width, start, end, dur);
    resizeCanvas(width,700);
    canvaBuffer = createGraphics(width, 700);
    canvaBuffer.background(255);
    canvaBuffer.fill(0);
    canvaBuffer.rect(0,300,width,100);

    // compute notearrays and match array within the given (start-end)
    console.log("computing performance notes within limits");
    notearray= onset_offset_in_limits (table, start, end);
    lastonset= notearray[notearray.length-1][1]-start;
    console.log("computing matches within limits");
    matchl = alignment_ids(notearray, alignment, tablepart, true);
    console.log("computing secondary matches within limits");
    zmatchl = alignment_ids(notearray, zalignment, tablepart, false);
    console.log("computing score notes within limits");
    notearraypart= onset_offset_in_limits_p (tablepart, startpart, endpart);
  }
  else { // full arrays
    start = startmax;
    dur = durmax;
    end = endmax;
    startpart = startmaxpart;
    endpart = endmaxpart;
    durpart= durmaxpart;
    widthinit = 10000/80*dur;
    // (re)size of canvas
    width = widthinit*max(min(Number(slider_len.value()),10),0.1);
    console.log("(FULL WIDTH) width, start, end, dur",width, start, end, dur);
    resizeCanvas(width,700);
    canvaBuffer = createGraphics(width, 700);
    canvaBuffer.background(255);
    canvaBuffer.fill(0);
    canvaBuffer.rect(0,300,width,100);

    // compute notearrays and match array within the given (start-end)
    console.log("computing performance notes within limits");
    notearray= onset_offset_in_limits (table, start, end);
    lastonset= notearray[notearray.length-1][1]-start;
    console.log("computing matches within limits");
    matchl = alignment_ids(notearray, alignment, tablepart, false);
    console.log("computing secondary matches within limits");
    zmatchl = alignment_ids(notearray, zalignment, tablepart, false);
    console.log("computing score notes within limits");
    notearraypart= onset_offset_in_limits_p (tablepart, startpart, endpart);

  }

  notes = [];
  perf = {};
  score = {};
  
  console.log("creating Note Rectangles for performance");
  // generate new NoteRectangles for the performance
  for (let r = 0; r < notearray.length; r++){
    let xx = (notearray[r][1]-start)/dur*width;
    let yy = 300-(notearray[r][2]-pitchmin+1)*incrementy;
    let xe = notearray[r][0]/dur*width;
    let ye = incrementy;

    perf[notearray[r][3]] = new NoteRectangle(xx,yy,xe,ye, notearray[r][3], "perf");
    notes.push(perf[notearray[r][3]]);    
  }
  console.log("creating Note Rectangles for score");
  // generate new NoteRectangles for the score
  for (let r = 0; r < notearraypart.length; r++){
    let xxp = (notearraypart[r][1]-startpart)/durpart*width;
    let yyp = 700-(notearraypart[r][2]-pitchminpart+1)*incrementypart;
    let xep = notearraypart[r][0]/durpart*width;
    let yep = incrementypart;
    score[notearraypart[r][3]] = new NoteRectangle(xxp,yyp,xep,yep, notearraypart[r][3], "score");
    notes.push(score[notearraypart[r][3]]);
  }

  // generate keyblocks
  console.log("computing reference keyblocks and staff lines");
  generate_keyblocks();
  // generate staff lines
  system_lines = new SystemLines (width);
  
  // generate lines
  console.log("creating Match lines ");
  lines_from_matchl();
  console.log("creating Match lines original");
  zlines_from_zmatchl();

  //__________________________________________________________________________________________
  // add articulation to score notes
  console.log("creating performance features");
  for (let r = 0; r < feature.getRowCount(); r++){
  if (feature.getColumn("id")[r] in score) {
    
    score[feature.getColumn("id")[r]].vel = feature.getColumn("velocity")[r];
    score[feature.getColumn("id")[r]].art = feature.getColumn("articulation")[r];
    score[feature.getColumn("id")[r]].tim = feature.getColumn("timing")[r];
  }
  }
  click_cleanup();
  note_slider_update();
  align_slider_update();
  //redraw();
}








//________________- DRAW -__________________________

let starthead = 0;
let playhead = starthead;
let start_time=0;

let count_offset = 1;
let playing = false;

let future_notes = [];
let next_notes = [];

let beat_start = 0.0;
let beat_interval = 0.5;

let annotation_lines = [];
let last_beats = 0;


function draw() {
  background(255);
  image(canvaBuffer, 0, 0);
  if (playing) {
    let current_time = getAudioContext().currentTime;
    //console.log("frame count", frameCount, currentTime);
    if (count_offset == 0) {
      console.log("started")
      //starthead = start;
      start_time = current_time;
      playhead = 0.0 + starthead;
      future_notes = notearray.filter(row => (parseFloat(row[1]) >= start))
    }
    else {
      playhead = (current_time-start_time)+starthead;
    }
  

  // play notes
    next_notes = future_notes.filter(row => (parseFloat(row[1]) < playhead+0.2))
    future_notes = future_notes.filter(row => (parseFloat(row[1]) >= playhead+0.2))
    for (let note in next_notes) {next_notes[note]
      //console.log(next_notes[note][3])
      //console.log("note pitch", parseFloat(next_notes[note][2]), "vel", parseFloat(next_notes[note][4]),"when",parseFloat(next_notes[note][1])-playhead,"how long", parseFloat(next_notes[note][0]));
      polySynth.play(midiToFreq(parseFloat(next_notes[note][2])),2**(7*parseFloat(next_notes[note][4])/127)/128,parseFloat(next_notes[note][1])-playhead,parseFloat(next_notes[note][0]));
    }
  }
  count_offset = frameCount;
  // draw playhead
  let xpos = (playhead-start)*(width/widthinit)*125;
  strokeWeight(2);
  stroke(240,0,0);
  line(xpos,0,xpos,300);

  // draw beat alignments
  for (let line in annotation_lines){
    draw_line(annotation_lines[line]);
  }
  
}

// play
// stop
// add line
// remove line
// draw line
// change start point performance
// change start point beat
// change beat_interval
function draw_line(line_coordinates) {
  let xpos_perf = (line_coordinates[0]-start)/dur*width;
  let xpos_score = (line_coordinates[1]-startpart)/durpart*width;
  push()
  strokeWeight(2);
  stroke(240,240,0);
  fill(0,0,0,100);
  circle(xpos_perf,150,10);
  circle(xpos_score,550,10);
  line(xpos_perf,150,xpos_score,550);
  pop()
}

function add_line() {
  let next_beat_time = beat_start + annotation_lines.length*beat_interval;
  annotation_lines.push([playhead, next_beat_time]);
}

function remove_line() {
  annotation_lines.pop();
  redraw();
}

function start_loop() {
 count_offset = 0;
 playing = true;
 loop();
}
function stop_loop() {
  playing = false;
  playhead = starthead;
  noLoop();
}





//___________________canvabuffer draw_______________________________

function canvabuffer_draw() {
  console.log("canvabuffer_draw()");
  canvaBuffer.background(255);
  canvaBuffer.fill(0);
  canvaBuffer.stroke(0);
  canvaBuffer.rect(0,300,width,100);

    if (checkbox_times.checked()){
      canvaBuffer.push()
      canvaBuffer.stroke(0,0,0,120)
      canvaBuffer.strokeWeight(1)
      canvaBuffer.textSize(10);
      for (let i = 1; i< widthinit/125; i++){      
        canvaBuffer.line((i-start%1)*width/widthinit*125,0,(i-start%1)*width/widthinit*125,300);
        canvaBuffer.text(str(Math.round(i+start-start%1))+" sec", (i-start%1)*width/widthinit*125, 290);
      }
      canvaBuffer.pop()
    }
    if (checkbox_beat_times.checked()){
      canvaBuffer.push()
      canvaBuffer.stroke(0,0,0,120)
      canvaBuffer.strokeWeight(1)
      canvaBuffer.textSize(10);
      for (let i = 0; i< durpart; i++){      
        canvaBuffer.line((i-startpart%1)*width/durpart,400,(i-startpart%1)*width/durpart,700);
        canvaBuffer.text(str(Math.round(i+startpart-startpart%1))+" beats", (i-startpart%1)*width/durpart, 690);
      }
      canvaBuffer.pop()
    }
    

    if (checkbox_writing.checked()){
      canvaBuffer.textSize(300);
      canvaBuffer.fill(0, 102, 153, 71);
      canvaBuffer.stroke(255);
      canvaBuffer.text('performance', 25, 200);
      canvaBuffer.text('score', 25, 600);
    }
    
    if (checkbox_system.checked()){
      system_lines.display();
    }

    if (checkbox_key.checked()){
      for(var i = 0; i < keyblocks.length; i++){
        keyblocks[i].display();
      }
    }


  for(var i = 0; i < notes.length; i++){
    notes[i].display();
  }

  if (checkbox_vel.checked()){
    for(var i = 0; i < notes.length; i++){
      notes[i].feature_display_vel();
    }
  }
  if (checkbox_tim.checked()){
    for(var i = 0; i < notes.length; i++){
      notes[i].feature_display_tim();
    }
  }
  if (checkbox_art.checked()){
    for(var i = 0; i < notes.length; i++){
      notes[i].feature_display_art();
    }
  }
  if (checkbox_alignment.checked()){
    for (var key in lines) {
    
    lines[key].display();
    
    }
  }
  if (checkbox_zalignment.checked()){
    for (var key in zlines) {
    
    zlines[key].display();
    
    }
  }
  if (connect_line) {
    connect_line.display();
  }

  

}


//________________- Create Keyblocks -__________________________

function generate_keyblocks() {
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
}

//________________- Segment Notes from tables -__________________________

// get an array of arrays of notes in table that lie within (start-end): performance
function onset_offset_in_limits (tablelocal, startlocal, endlocal) {

  let table_cut = tablelocal.rows.filter(row => (row.arr[0] >= startlocal) && (row.arr[0]< endlocal))
  let table_cut_transformed = table_cut.map(row => [row.arr[1], row.arr[0], row.arr[2], row.obj["id"], row.arr[3]])
  return table_cut_transformed
}

// get an array of arrays of notes in table that lie within (start-end): score
function onset_offset_in_limits_p (tablelocal, startlocal, endlocal) {

  let table_cut = tablelocal.rows.filter(row => (row.arr[0] >= startlocal) && (row.arr[0]< endlocal))
  let table_cut_transformed = table_cut.map(row => [row.arr[1], row.arr[0], row.arr[6], row.arr[8]])
  return table_cut_transformed
}

// get an array of alignments from a notearray (performance), an alignment csv and a score note csv
function alignment_ids (array, alignment, table, set_part_times) {

  let ppart_ids = array.map(x => x[3]);
  let alignment_lines_to_align = alignment.rows.filter(row => (ppart_ids.includes(row.arr[3]) ) && (row.arr[1] == "0"));
  let matchlines = alignment_lines_to_align.map(row => [row.arr[3], row.arr[2]]);

  // LOGGING THE IDS AND MATCHED LINES
  //console.log("ppart_ids", ppart_ids)
  //console.log("alignment_lines_to_align", alignment_lines_to_align)
  //console.log("matchlines", matchlines)
  
  if (set_part_times) {
    let part_ids = alignment_lines_to_align.map(row => row.arr[2]);
    //console.log("part ids ", part_ids);
    let part_notes_for_onsets = table.rows.filter(row => part_ids.includes(row.arr[8]));
    //console.log("part note for onsets ", part_notes_for_onsets);
    let part_onsets = part_notes_for_onsets.map(row => parseFloat(row.arr[0]));
    startpart = Math.min(...part_onsets);
    durpart = dur/lastonset*(Math.max(...part_onsets)-startpart);
    endpart = durpart+startpart;
    //console.log("set part times: (start, end, dur)", startpart, endpart, durpart);
  }
  
  return matchlines
}


//________________- Generate match lines -__________________________

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
    lines[partid+ppartid] = new NoteLine(partnote.x,partnote.y,ppartnote.x,ppartnote.y, ppartid, partid, false);
  };

}

// generate lines from global variable zmatchl
function zlines_from_zmatchl () {
  zlines = {};
  let ppartid;
  let partid;
  let partnote;
  let ppartnote;
  for (let r = 0; r < zmatchl.length; r++){
    ppartid =  zmatchl[r][0];
    partid =  zmatchl[r][1];
    if (partid in score && ppartid in perf) {
      partnote = score[partid];
      ppartnote = perf[ppartid];
      //print(partnote, partid,  ppartnote, ppartid)
      partnote.zlink(ppartid); 
      ppartnote.zlink(partid);
      zlines[partid+ppartid] = new NoteLine(partnote.x,partnote.y,ppartnote.x,ppartnote.y, ppartid, partid, true);
    }
  };

}


















//________________- NoteRectangle Class -__________________________

function NoteRectangle(x, y, xl, yl, name, type, vel=null, art=null, tim=null, feature_vis = 2 ) {
  this.x = x;
  this.y = y;
  this.xl = xl;
  this.yl = yl;
  this.col = color(255, 0, 0); // default color no alignment (RED)
  this.col_click = color(0, 255, 255); // color clicked (TURQUOISE)
  this.col_clickr = color(0, 255, 124); // color clicked (LIGHT GREEN)
  this.col_line = color(255, 0, 124); // color timing
  this.col_line1 = color(0, 255, 0);  // color articulation
  this.col_line2 = color(124, 124, 0);  // color velocity
  this.name = name;
  this.linked_note = "";
  this.zlinked_note = "";
  this.textSIZ = 14;
  this.textSIZ_click = 24;
  this.type = type;
  this.clik = false;
  this.rclik = false;
  this.wei = 1;
  this.vel = vel;
  this.art = art;
  this.tim = tim;
  this.feature_vis = feature_vis;

  this.color_code_alignments = function(alpha){
    if ((this.linked_note == "") && (this.zlinked_note == "")) {
      this.col = color(255, 0, 0, alpha); // default color no alignment (RED)
    }
    else if (this.linked_note == this.zlinked_note) {
      this.col = color(0,0,255,alpha); // default color agreement in alignment (BLUE)
    }
    else if ((this.linked_note == "") && (this.zlinked_note != "")) {
      this.col = color(0,102,17, alpha); // default color no alignment in new
    }
    else if ((this.linked_note != "") && (this.zlinked_note == "")) {
      this.col = color(130,130,0,alpha); // default color no alignment in old (z)
    }
    else {
      this.col = color(255,217,25,alpha); // default color no alignment in old (z)
    }
  }
  
  this.reset = function(){
    //this.col = color(255,0,0);
    this.linked_note = "";
    this.clik = false;
    this.rclik = false;
  }
  this.link = function (linked_note_id){
    this.linked_note = linked_note_id;
    //this.col = color(0,0,255,200);
  }

  this.zlink = function (linked_note_id){
    this.zlinked_note = linked_note_id;
  }

  this.rebase = function() {
    this.clik = false;
  };
  this.display = function() {
    if (this.clik) {
      canvaBuffer.stroke(this.col_click);
      canvaBuffer.strokeWeight(this.wei);
      canvaBuffer.textSize(this.textSIZ_click);
      canvaBuffer.fill(this.col_click);
      canvaBuffer.rect(this.x, this.y, this.xl, this.yl);
      canvaBuffer.text(this.name, this.x,this.y);
    }
    else if ( this.rclik) {
      canvaBuffer.stroke(this.col_clickr);
      canvaBuffer.strokeWeight(this.wei);
      canvaBuffer.textSize(this.textSIZ_click);
      canvaBuffer.fill(this.col_clickr);
      canvaBuffer.rect(this.x, this.y, this.xl, this.yl);
      canvaBuffer.text(this.name, this.x,this.y);
    }
    else {
      
      canvaBuffer.stroke(this.col); 
      canvaBuffer.strokeWeight(this.wei);
      canvaBuffer.textSize(this.textSIZ);
      canvaBuffer.fill(this.col);
      canvaBuffer.rect(this.x, this.y, this.xl, this.yl);
      canvaBuffer.text(this.name, this.x,this.y);
    }
  }
  this.feature_display_tim = function() {
    if (this.tim) {
      // timing: the higher the value the earlier the note (more to left)
      canvaBuffer.push();
      canvaBuffer.fill(0,0,0,0);
      canvaBuffer.strokeWeight(2);
      canvaBuffer.stroke(this.col_line)
      canvaBuffer.line(this.x,this.y,this.x-this.tim*this.feature_vis, this.y)
      canvaBuffer.circle(this.x-this.tim*this.feature_vis, this.y, 10);
      canvaBuffer.pop();
    }
  };
  this.feature_display_art = function() {
    if (this.art) {
      // articulation: the higher the value the more staccato the note (= -log(ratio), more to the left)
      canvaBuffer.push();
      canvaBuffer.strokeWeight(2);
      canvaBuffer.fill(0,0,0,0);
      canvaBuffer.stroke(this.col_line1)
      canvaBuffer.line(this.x+this.xl,this.y+this.yl,this.x+this.xl+this.art*this.feature_vis, this.y+this.yl)
      canvaBuffer.circle(this.x+this.xl+this.art*this.feature_vis, this.y+this.yl, 10);
      canvaBuffer.pop();
    }
  };
  this.feature_display_vel = function() {
    if (this.vel) {
      // velocity: the higher the value the louder the note (more upwards)
      canvaBuffer.push();
      canvaBuffer.strokeWeight(2);
      canvaBuffer.fill(0,0,0,0);
      canvaBuffer.stroke(this.col_line2)
      canvaBuffer.line(this.x+this.xl/2,this.y,this.x+this.xl/2, this.y-this.vel*this.feature_vis)
      canvaBuffer.circle(this.x+this.xl/2, this.y-this.vel*this.feature_vis, 10);
      canvaBuffer.pop();
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

//________________- NoteLine Class -__________________________

function NoteLine(x1, y1, x2, y2, perfnote, scorenote, zline) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;
  this.perfnote = perfnote;
  this.scorenote = scorenote;
  if (zline){
    this.col = color(255,0,0);
    this.col_original = color(255,0,0);
  }
  else {
    this.col = color(0,200,250);
    this.col_original = color(0,200,250);
  }
  
  
  this.wei = 1;
  
  
  this.display = function() {
    canvaBuffer.stroke(this.col);
    canvaBuffer.strokeWeight(this.wei);
    canvaBuffer.line(this.x1,this.y1,this.x2,this.y2);
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

//____________________________SystemLines Class______________________________________________________________

function SystemLines (width) {
  this.width = width;
  this.wei = 1;
  this.col = color(20);

  // G2, B2, D3, F3, A3
  this.bassclef_notes = [43,47,50,53,57];
  // E4, G4, B4, D5, F5
  this.trebleclef_notes = [64,67,71,74,77];
  this.all_notes = [43,47,50,53,57,64,67,71,74,77];
  
  this.setup = function () {
  this.ycoord_plines = this.all_notes.map(x => {return 700 -(x-pitchminpart+0.5)*incrementypart});
  this.ycoord_lines = this.all_notes.map(x => {return 300 -(x-pitchmin+0.5)*incrementy});
  for (let i; i<5; i++) {
    if (this.ycoord_plines[i] > 700 || this.ycoord_plines[i] < 400) {
      delete this.ycoord_plines[i];
    }
    if (this.ycoord_lines[i] > 300 || this.ycoord_lines[i] < 0) {
      delete this.ycoord_lines[i];
    }
  }
  }
  this.setup();
  
  this.display = function() {
    canvaBuffer.push();
    this.ycoord_lines.forEach(y => {stroke(this.col); 
      canvaBuffer.strokeWeight(this.wei);
      canvaBuffer.line(0,y,this.width,y);});
    this.ycoord_plines.forEach(y => {stroke(this.col);
      canvaBuffer.strokeWeight(this.wei);
      canvaBuffer.line(0,y,this.width,y);});
      canvaBuffer.pop();
  } 
 

}









//________________- Keyboard Input -__________________________

function keyTyped() {
  if (key === 'a') {
    change_alignment();
  }
  if (key === 't' && playing) {
    add_line();
  } 
  if (key === 'r' && !playing) {
    remove_line();
  } 
  if (key === 'z') {
    if (playing){
      console.log("stop", playing)
      stop_loop();
    }
    else {
    console.log("start", playing)
    start_loop();
    }
  }
  if (key === '1') {
    let current_bool = checkbox_alignment.checked();
    if (current_bool) {
      checkbox_alignment.checked(false);
    }
    else {
      checkbox_alignment.checked(true);
    }
    canvabuffer_draw()
    redraw();
  } 
  if (key === '2') {
    let current_bool = checkbox_zalignment.checked();
    if (current_bool) {
      checkbox_zalignment.checked(false);
    }
    else {
      checkbox_zalignment.checked(true);
    }
    canvabuffer_draw()
    redraw();
  } 
}

//________________- Mouse Input -__________________________

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
        clicked_note.name, right_clicked_note.name, false);
      }
      else {// right clicked note is perf note
        connect_line = new NoteLine(clicked_note.x, clicked_note.y, right_clicked_note.x, right_clicked_note.y, 
        right_clicked_note.name, clicked_note.name, false);
      }
      
      connect_line.wei = 2;
      connect_line.col = color(205,255,50);

    }
  }
  for(key in lines){
    lines[key].clicked();
  }
  canvabuffer_draw()
  redraw();
}

//________________- Input Utils -__________________________

function checkbox_update() {
  canvabuffer_draw()
  redraw();
}

function note_slider_update() {
  for(var i = 0; i < notes.length; i++){
    notes[i].feature_vis = feature_slider.value();
    notes[i].color_code_alignments( color_slider.value());
  }
  canvabuffer_draw()
  redraw();
}

function align_slider_update() {
  stop_loop();
  beat_start = parseFloat(slider_beat_start.value());
  beat_interval = parseFloat(slider_beat_interval.value());
  starthead = parseFloat(slider_start_align.value());
  redraw();
  console.log("update tapping parameters", beat_start, beat_interval, starthead);
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
  canvabuffer_draw()
  redraw();
};


function save_alignment() {
  saveTable(alignment, "new_alignment.csv")
}

function export_annotations() {
  for (let line in annotation_lines){
    let newRow = annotations.addRow();
    newRow.setString('score_beat',str(annotation_lines[line][1]));
    newRow.setString('performance_second', str(annotation_lines[line][0]));
  }
  saveTable(annotations, "tapping_annotations.csv");
  annotations = loadTable("static/annotations.csv", 'csv', 'header');
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
                                              perf[perf_still].x,perf[perf_still].y, perf_still, score_still, false);
  
  if (perf_nomore != "") {
    // table
    console.log("perf no")
    let row = alignment.findRow(perf_nomore, "ppartid");
    console.log(row)
    row.obj["partid"] = "undefined";
    row.obj["matchtype"] = "2";
    // reset the note
    perf[perf_nomore].reset();
    // delete the line
    delete lines[score_still+perf_nomore] ;
  }
 
  if (score_nomore != "") {
    // table
    console.log("scoreno")
    let rowp = alignment.findRow(score_nomore, "partid");
    console.log(rowp)
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