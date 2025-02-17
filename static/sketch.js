//________________- declare global variables -__________________________

let table;
let tablep;
let alignment; 
let zalignment;
let feature;
let annotations; 
let treble_clef;
let bass_clef

let canva;
let canvaHeight;
let canvaBuffer;
//let offsets;
let position;
let canvaBuffer_offsets;
let default_colors;

let perf = {};
let score = {};
let notes = [];
let keyblocks = [];
let arrows = [];
let lines = {};
let zlines = {};
let matchl, zmatchl;
let system_lines;

let slider_start;
// let slider_len;
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


let playhead ;
let start_time;
//let pixel_offset_starthead ;
let sampler_loaded = false;
let count_offset ;
let playing ;

let future_notes;
let next_notes;

let beat_start;
let beat_interval;

let annotation_lines;
let last_beats;

//________________- preload files -__________________________

function preload() {
  table = loadTable("static/default_data/ppart.csv", 'csv', 'header');
  tablepart = loadTable("static/default_data/part.csv", 'csv', 'header');
  alignment = loadTable("static/default_data/align.csv", 'csv', 'header');
  zalignment = loadTable("static/default_data/align.csv", 'csv', 'header');
  //__________________________________________________________________________________________
  feature = loadTable("static/default_data/feature.csv", 'csv', 'header');
  annotations = loadTable("static/default_data/annotations.csv", 'csv', 'header');
  treble_clef = loadImage("static/images/treble_clef.png");
  bass_clef = loadImage("static/images/bass_clef.png");


}

function alpha_clefs(img) {
  img.loadPixels();
  for (let i = 0; i < img.width; i++) {
    for (let j = 0; j < img.height; j++) {
      let k = 4*(j*img.width +i)+3;
      if (img.pixels[k]>0) {
        img.pixels[k] = 230;
      }  
  }
}
img.updatePixels();
}

//________________- upload files -__________________________

function redraw_with_new_files() {
  //console.log("get here before loading");

  let file_names = {"align.csv":0, "feature.csv":1, "part.csv":2, "ppart.csv":3, "zalign.csv":4};
  for (let i = 0; i< document.getElementById('csv_input').files.length; i++) {
    file_names[document.getElementById('csv_input').files[i].name] = i;
    //console.log(document.getElementById('csv_input').files[i].name, i);
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
      reset_position();
      reset_player();
      setup_score_and_performance();
      align_slider_update();
    })
  .catch(errors => {err = errors; alert("error loading one of the uploaded files");})


  
}

//________________- SETUP -__________________________

function setup() {
  window.onresize = setup_score_and_performance;
  //offsets = [-100,-100];
  canvaBuffer_offsets = [50,50,100];
  canvaHeight = max(900,windowHeight-200);
  reset_position();
  reset_player();  

  polySynth = new Tone.Sampler(sampler_kwargs).toDestination();
  //polySynth.setADSR(0.05,0.05,1.0, 0.05);

  //setup the canvas
  canva = createCanvas(windowWidth-70,canvaHeight);
  canvaBuffer = createGraphics(windowWidth-70-canvaBuffer_offsets[2], canvaHeight);
  canva.mousePressed(checknoteclicked);

  default_colors = {match:color(0, 0, 0, 160),
                    indel:color(183, 172, 68, 230),
                    clicked_note: color(255,170,0,230),
                    rclicked_note: color(255,130,0,230),
                    mismatch:color(255, 100, 0, 230),
                    match1indel2:color(255, 69, 0,230),
                    match2indel1:color(223, 54, 45, 230),
                    

                    
                    noteline_rclicked: color(255,130,0,230),
                    noteline_clicked: color(255,170,0,230),
                    connectline: color(255,255,0,230),
                    noteline: color(0, 150,174),


                    system_lines:color(20),
                    znoteline: color(200,0,0),
                    
                    
                    articulation: color(120,3,204),
                    velocity: color(134,56,167),
                    timing: color(67,124,198),

                    arrow_background: color(150,150,150,150),
                    arrow: color(0,0,0,160), // like match note
                    background_text: color(150, 150,174, 71),//color(0, 150,174, 71), // like noteline
                    timepoints:color(0,0,0,160),
                    timepoints_text:color(255,255,255,255),
                    keyblock_tonic: color(100,0,0,50),
                    keyblock_fifth: color(50,50,50,50),
                    tapping_line:color(240,240,0)
  };



  alpha_clefs(treble_clef);
  alpha_clefs(bass_clef);
  setup_controls();
  
  setup_score_and_performance();
  align_slider_update(); 
  //__________________________________________________________________________________________
  frameRate(30);
  noLoop();
}


function reset_position() {
  position = {
    offset_score: -100,
    offset_performance: -100,
    previous_offset_score: -100,
    previous_offset_performance: -100,
    pixel_per_sec: 125,
    pixel_per_beat: 125,
    starthead: 0,
    pixel_offset_starthead: 0,
    move_starthead_with_performance: true,
    offsets: function() {
      return [this.offset_performance, this.offset_score]
    },
    increment: function(inc, score, perf, prev, starth) {
      if (score && prev) {
        this.offset_score += inc;
        this.previous_offset_score += inc;
      } else if (score && !prev) {
        this.offset_score += inc;
      }
      if (perf && prev) {  
        this.offset_performance += inc;
        this.previous_offset_performance += inc;
      } else if (perf && !prev) {
        this.offset_performance += inc;
      }
      if ((starth) || (this.move_starthead_with_performance && perf)) {
        this.starthead += inc/this.pixel_per_sec;
        //print(inc, (this.starthead-start))
        this.pixel_offset_starthead = (this.starthead-start)*this.pixel_per_sec;
        //print(this.pixel_offset_starthead)
        playhead = this.starthead;
      }
    }
  }
}

function reset_player() {
    //player variable values
    playhead = 0;
    start_time = 0;
    //pixel_offset_starthead = 0;
    count_offset = 1;
    playing = false;
    future_notes = [];
    next_notes = [];
    beat_start = 0.0;
    beat_interval = 0.5;
    annotation_lines = [];
    last_beats = 0;
}

//________________- Setup the text and controls -__________________________

function setup_controls() {
  // buttons and divs on the page
  button_change = createButton('change alignment').parent("info_buttons_alignment");
  button_change.mousePressed(change_alignment)
  button_save = createButton('save alignment').parent("info_buttons_alignment");
  button_save.mousePressed(save_alignment);
  checkbox_many2many = createCheckbox('enable many-to-many alignment (experimental, deletion may not work)', false).parent("info_buttons_alignment");
  button_erase = createButton('erase alignment + empty table (no undo)').parent("info_buttons_alignment");
  button_erase.mousePressed(erase_alignment);
  button_erase = createButton('erase alignment + add indels (no undo)').parent("info_buttons_alignment");
  button_erase.mousePressed(erase_alignment_indel);


  
  button_upload = createButton('visualise uploaded files').parent("info_buttons");
  button_upload.mousePressed(redraw_with_new_files);

  createDiv("_PARANGONADA_").style('font-size', "28px").parent("info_title")
  //createDiv("PARANGONADA").style('font-size', "28px").parent("info")
  createDiv("PARANGONADA visualizes one or two possibly different alignments of a score and a performance. " +
  "The first alignment is colored in light blue and it can be changed using the commands below. " +
  'The second alignment is colored in red (not shown by default, toggle  or press key "2") and can be used as reference. ').parent("info")
  
  
  // alignment controls
  createDiv("ALIGNMENT CONTROLS:").style("font-weight", "bold").style("padding-top", "7px").parent("info")
  createDiv("Left click on a note to see its alignment").parent("info");
  createDiv("Right click another note to temporarily align them").parent("info");
  createDiv("Middle click to unmark any notes").parent("info");
  createDiv("Press key 'a' or button 'change alignment' to fix the alignment").parent("info");
  createDiv("Press key 's' to delete an alignment").parent("info");
  createDiv("Press button 'save alignment' to download a csv file of note alignments").parent("info");

  // Zoom and shift controls
  createDiv("ZOOM / SHIFT CONTROLS:").style("font-weight", "bold").style("padding-top", "7px").parent("info2")
  createDiv("Use the arrows to the left and right to shift the window").parent("info2");
  createDiv("Use the mouse wheel while pressing 'shift' over score, performance, or center to shift the window").parent("info2");
  createDiv("Use the mouse wheel while pressing 'ctrl' to zoom towards or from the mouse cursor").parent("info2");



  createDiv("_LEGEND_").style('font-size', "28px").parent("legend")
  note_one_div = createDiv('no note clicked').parent("legend");
  note_two_div = createDiv('no note right clicked').parent("legend");
  createDiv("the note colors whether a note is aligned and whether the first and second alignment agree: ").parent("legend")
  createDiv("matched notes with MATCHING alignments in the first and second alignment. ").style('color',default_colors.match).parent("legend"); 
  createDiv("insertion / deletion notes with MATCHING non-alignments in the first and second alignment. ").style('color',default_colors.indel).parent("legend"); 
  createDiv("matched notes with MISMATCHING alignments in the first and second alignment. ").style('color',default_colors.mismatch).parent("legend"); 
  createDiv("matched notes in the first alignment, non-aligned in the second (reference). ").style('color',default_colors.match1indel2).parent("legend"); 
  createDiv("matched notes in the second (reference) alignment, non-aligned in the first. ").style('color',default_colors.match2indel1).parent("legend"); 
  

  createDiv("_VISUALIZATION_").style('font-size', "28px").parent("control");
  createDiv("SCORE / PERFORMANCE METADATA:").style("font-weight", "bold").style("padding-top", "7px").parent("control")
  //createDiv("____ score and performance metadata _____").parent("control")
  createDiv("set the key for tonic and fifth highlighting, 0=C - 11=B").parent("control");
  slider_key = createSlider(0, 11, 0, 1).parent("control");
  slider_key.changed(checkbox_update_key);
  checkbox_key = createCheckbox('show key tonic and fifth', false).parent("control");
  checkbox_key.changed(checkbox_update_key);
  checkbox_pitch = createCheckbox('show pitch / note IDs', true).parent("control");
  checkbox_pitch.changed(checkbox_update);
  checkbox_system = createCheckbox('show staff lines', true).parent("control");
  checkbox_system.changed(checkbox_update);
  checkbox_times = createCheckbox('show seconds in performance', true).parent("control");
  checkbox_times.changed(checkbox_update);
  checkbox_beat_times = createCheckbox('show beats in score', true).parent("control");
  checkbox_beat_times.changed(checkbox_update);
  checkbox_writing = createCheckbox('show performance / score background text', true).parent("control");
  checkbox_writing.changed(checkbox_update);
  createDiv("ALIGNMENT LINES AND EXPRESSIVE FEATURES:").style("font-weight", "bold").style("padding-top", "7px").parent("control")
  //createDiv("____ alignment lines and expressive features _____").parent("control")
  checkbox_alignment = createCheckbox('show alignment lines, press key "1" or check', true).parent("control");
  checkbox_alignment.changed(checkbox_update);
  checkbox_zalignment = createCheckbox('show second alignment lines, press key "2" or check', false).parent("control");
  checkbox_zalignment.changed(checkbox_update);
  checkbox_art = createCheckbox('show articulation values in score', false).parent("control");
  checkbox_art.changed(checkbox_update);
  checkbox_tim = createCheckbox('show timing values in score', false).parent("control");
  checkbox_tim.changed(checkbox_update);
  checkbox_vel = createCheckbox('show velocity values in score', false).parent("control");
  checkbox_vel.changed(checkbox_update);
  createDiv("set the magnification of expressive features in the score").parent("control");
  feature_slider = createSlider(0.1, 5, 2, 0.01).parent("control");
  feature_slider.changed(note_slider_update).parent("control");
  createDiv("set the opacity of aligned notes").parent("control");
  color_slider = createSlider(0, 255, 160,1).parent("control");
  color_slider.changed(note_slider_update);
  //createDiv("set the magnification of the performance piano roll: default 1 = 125 pixel / sec").parent("control");
  //slider_len = createInput("1").parent("control");
  //piano_roll_draw = createButton('redraw piano rolls').parent("control");
  //piano_roll_draw.mousePressed(setup_score_and_performance);

  createDiv("_BEAT TAPPING_").style('font-size', "28px").parent("play")
  createDiv("PARANGONDA can also annotate your tapping to the score").parent("play")
  createDiv('Press "z" to start and stop the playback, press "t" to add an annotation at the current playhead while playing.').parent("play")
  createDiv('While no playback is running you can delete the annotations one by one using "r".').parent("play")
  //createDiv("set the start time of the playback in the performance in seconds:").parent("play");
  //slider_start_align = 0.0;//createInput("1").parent("play");
  //slider_start_align.changed(align_slider_update);
  createDiv('When stopping the playback the playhead will move back to its start position. Change the start position by shifting the performance window left or right.').parent("play");
  createDiv("Set the first beat to align:").parent("play");
  slider_beat_start = createInput("0").parent("play");
  slider_beat_start.changed(align_slider_update);
  createDiv("Set the beat interval to align:").parent("play");
  slider_beat_interval = createInput("1").parent("play");
  slider_beat_interval.changed(align_slider_update);
  createDiv('Export tapping annotations as csv:').parent("play");
  button_export_annotations = createButton('export tapping annotations').parent("play");
  button_export_annotations.mousePressed(export_annotations);
}

//________________- Main (Re) Setup-_________________

function setup_score_and_performance() {
  setup_the_pianorolls(); // size
  compute_piano_roll_display_elements(); // notes, lines
  compute_other_display_elements(); // system, key, arrows,
  click_cleanup(); // reset note state
  //(); //
}

//________________- DRAW -__________________________

function draw() {
  background(255);
  image(canvaBuffer, canvaBuffer_offsets[0], 0, canvaBuffer.width, canvaBuffer.height);

  for(var i = 0; i < arrows.length; i++){
    arrows[i].display();
  }

  if (playing) {
    let current_time = Tone.getContext().currentTime;
    //console.log("frame count", frameCount, currentTime);
    if (count_offset == 0) {
      console.log("started")
      start_time = current_time;
      playhead = 0.0 + position.starthead;
      future_notes = notearray.filter(row => (parseFloat(row[1]) >= playhead-0.1))
    }
    else {
      playhead = (current_time-start_time)+position.starthead;
    }
  

  // play notes
    next_notes = future_notes.filter(row => (parseFloat(row[1]) < playhead+0.1))
    future_notes = future_notes.filter(row => (parseFloat(row[1]) >= playhead+0.1))
    for (let note in next_notes) {next_notes[note]
      //console.log(next_notes[note][3])
      //console.log("note pitch", parseFloat(next_notes[note][2]), "vel", parseFloat(next_notes[note][4]),"when",parseFloat(next_notes[note][1])-playhead,"how long", parseFloat(next_notes[note][0]));
      polySynth.triggerAttackRelease(Tone.Frequency(next_notes[note][2], "midi").toFrequency(),
        str(next_notes[note][0]),
        "+"+str(next_notes[note][1]-playhead),
        parseFloat(next_notes[note][4])/127
        );
    }
  }
  count_offset = frameCount;
  // draw playhead
  let xpos = (playhead-position.starthead)*position.pixel_per_sec -
              position.offset_performance +
              canvaBuffer_offsets[0] +
              position.pixel_offset_starthead;
  strokeWeight(2);
  stroke(240,0,0);
  line(xpos,0,xpos,(canvaHeight-100)/2);
  strokeWeight(1);
  
  
  // draw beat alignments
  for (let line in annotation_lines){
    draw_line(annotation_lines[line]);
  }

  // move window with playhead
  if (xpos > canvaBuffer.width - 200) {
    position.offset_score += canvaBuffer.width/2;
    position.offset_performance += canvaBuffer.width/2;
    canvabuffer_draw();
    redraw();
  }
  
}


//________________- TAP -__________________________

// play
// stop
// add line
// remove line
// draw line
// change start point performance
// change start point beat
// change beat_interval
//let xpos_perf = (line_coordinates[0]-start)/position.pixel_per_sec-position.offset_performance+canvaBuffer_offsets[0]+pixel_offset_starthead;
//let xpos_score = (line_coordinates[1]-startpart)/position.pixel_per_beat-position.offset_score+canvaBuffer_offsets[0];
function draw_line(line_coordinates) {
  let xpos_perf = (line_coordinates[0]-start)*position.pixel_per_sec -
                    position.offset_performance +
                    canvaBuffer_offsets[0];
  let xpos_score = (line_coordinates[1]-startpart)*position.pixel_per_beat-
                    position.offset_score+
                    canvaBuffer_offsets[0];
  push()
  strokeWeight(2);
  stroke(default_colors.tapping_line);
  fill(0,0,0,100);
  circle(xpos_perf,(canvaHeight-100)/4,10);
  circle(xpos_score,(canvaHeight-100)/4*3+50,10);
  line(xpos_perf,(canvaHeight-100)/4,xpos_score,(canvaHeight-100)/4*3+50);
  pop()
}

function add_line() {
  let next_beat_time = beat_start + annotation_lines.length*beat_interval;
  annotation_lines.push([playhead, next_beat_time]);
}

function remove_line() {
  annotation_lines.pop();
  click_cleanup();
}

function start_loop() {
  if (sampler_loaded) {
 count_offset = 0;
 playing = true;
 loop();
  }
}

function stop_loop() {
  playing = false;
  playhead = position.starthead;
  noLoop();
  position.offset_score = position.previous_offset_score;
  position.offset_performance = position.previous_offset_performance;
  canvabuffer_draw();
  redraw();
  
}

//___________________canvabuffer draw_______________________________

function canvabuffer_draw() {
  console.log("canvabuffer_draw() ");
  canvaBuffer.background(255);
  canvaBuffer.fill(0);
  canvaBuffer.stroke(0);
  canvaBuffer.rect(0,(canvaHeight-100)/2,canvaBuffer.width,100);


  //____- Sec Times -_____
  if (checkbox_times.checked()){
    canvaBuffer.push()
    canvaBuffer.strokeWeight(1)
    canvaBuffer.textSize(10);
    for (let i = 1; i< widthinit/125; i++){    
      canvaBuffer.stroke(default_colors.timepoints);  
      canvaBuffer.line((i-start%1)*position.pixel_per_sec-
                        position.offset_performance,
                        0,
                        (i-start%1)*position.pixel_per_sec-
                        position.offset_performance,
                        (canvaHeight-100)/2);
      canvaBuffer.fill(default_colors.timepoints_text);
      canvaBuffer.stroke(default_colors.timepoints_text);
      canvaBuffer.text(str(Math.round(i+start-start%1))+" sec", 
      (i-start%1)*position.pixel_per_sec-position.offset_performance, (canvaHeight-100)/2+10);
    }
    canvaBuffer.pop()
  }
  //____- Beat Times -_____
  if (checkbox_beat_times.checked()){
    canvaBuffer.push()
    
    canvaBuffer.strokeWeight(1)
    canvaBuffer.textSize(10);
    for (let i = 0; i< durpart; i++){   
      canvaBuffer.stroke(default_colors.timepoints);   
      canvaBuffer.line((i-startpart%1)*position.pixel_per_beat-
                        position.offset_score,
                        (canvaHeight-100)/2+100,
                        (i-startpart%1)*position.pixel_per_beat-
                        position.offset_score,
                        canvaHeight);
      canvaBuffer.stroke(default_colors.timepoints_text);
      canvaBuffer.fill(default_colors.timepoints_text);
      canvaBuffer.text(str(Math.round(i+startpart-startpart%1))+" beats", 
      (i-startpart%1)*position.pixel_per_beat-position.offset_score, (canvaHeight-100)/2+98);
    }
    canvaBuffer.pop()
  }
  //____- Background Text -_____
  if (checkbox_writing.checked()){
    canvaBuffer.push()
    canvaBuffer.textSize(300);
    canvaBuffer.fill(default_colors.background_text);
    canvaBuffer.stroke(255);
    canvaBuffer.text('performance', 125, 300);
    canvaBuffer.text('score', 125, (canvaHeight-100)/2 +100+300);
    canvaBuffer.pop();
  }
  //____- System Lines -_____  
  if (checkbox_system.checked()){
    system_lines.display();
  }
  //____- Key Tonic & Dominant -_____
  if (checkbox_key.checked()){
    for(var i = 0; i < keyblocks.length; i++){
      keyblocks[i].display([0,0],false);
    }
  }

  //____- Notes -_____
  for(var i = 0; i < notes.length; i++){
    notes[i].display(position.offsets(),checkbox_pitch.checked());
  }
  //____- Expressive Features -_____
  if (checkbox_vel.checked()){
    for(var i = 0; i < notes.length; i++){
      notes[i].feature_display_vel(position.offsets());
    }
  }
  if (checkbox_tim.checked()){
    for(var i = 0; i < notes.length; i++){
      notes[i].feature_display_tim(position.offsets());
    }
  }
  if (checkbox_art.checked()){
    for(var i = 0; i < notes.length; i++){
      notes[i].feature_display_art(position.offsets());
    }
  }
  //____- Alignments -_____
  if (checkbox_alignment.checked()){
    for (var key in lines) {
    lines[key].display(position.offsets());
    }
  }
  if (checkbox_zalignment.checked()){
    for (var key in zlines) {
    zlines[key].display(position.offsets());
    }
  }
  //____- Current Line -_____
  if (connect_line) {
    connect_line.display(position.offsets());
  }

}
