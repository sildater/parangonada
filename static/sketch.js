let table;
let tablep;
let alignment; 
let zalignment;
let feature;
let annotations; 
let treble_clef;
let bass_clef

let canva;
let canvaBuffer;
let offsets;
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
      setup_score_and_performance();
    })
  .catch(errors => {err = errors; alert("error loading one of the uploaded files");})


  
}



//________________- SETUP -__________________________

function setup() {
  offsets = [-100,-100];
  canvaBuffer_offsets = [50,100, 150];
  //setup the canvas
  canva = createCanvas(windowWidth,700);
  canvaBuffer = createGraphics(windowWidth-canvaBuffer_offsets[2], 700);
  canva.mousePressed(checknoteclicked);

  polySynth = new Tone.Sampler(sampler_kwargs).toDestination();
  //polySynth.setADSR(0.05,0.05,1.0, 0.05);

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
                    
                    
                    articulation: color(120,03,204),
                    velocity: color(134,56,167),
                    timing: color(124,67,198),

                    arrow_background: color(150,150,150,150),
                    arrow: color(0,0,0,160), // like match note
                    background_text: color(0, 150,174, 71), // like noteline
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
  //__________________________________________________________________________________________
  frameRate(30);
  noLoop();
}

function setup_score_and_performance() {
  setup_the_pianorolls();
  compute_piano_roll_display_elements();
  compute_other_display_elements();
  click_cleanup();
  align_slider_update();
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
  createDiv("PARANGONADA visualizes two possibly different alignments. " +
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
  createDiv("matched notes with MATCHING alignments in the first and second alignment. ").style('color',default_colors.match); 
  createDiv("insertion / deletion notes with MATCHING non-alignments in the first and second alignment. ").style('color',default_colors.indel); 
  createDiv("matched notes with MISMATCHING alignments in the first and second alignment. ").style('color',default_colors.mismatch); 
  createDiv("matched notes in the first alignment, non-aligned in the second (reference). ").style('color',default_colors.match1indel2); 
  createDiv("matched notes in the second (reference) alignment, non-aligned in the first. ").style('color',default_colors.match2indel1); 
  

  createDiv("_______________VISUALIZATION PARAMETERS________________").style('font-size', "28px")
  createDiv("____ score and performance metadata _____")
  createDiv("set the key for tonic and fifth highlighting, 0=C, 2=D, 4=E, 5=F, 7=G, 9=A, 11=B");
  slider_key = createInput("0");
  checkbox_key = createCheckbox('show key tonic and fifth', false);
  checkbox_key.changed(checkbox_update_key);
  checkbox_pitch = createCheckbox('show pitch', false);
  checkbox_pitch.changed(checkbox_update);
  checkbox_system = createCheckbox('show staff lines', true);
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
  createDiv("____ note visualization _____")
  createDiv("set the opacity of aligned notes");
  color_slider = createSlider(0, 255, 160,1);
  color_slider.changed(note_slider_update);
  createDiv("set the magnification of the performance piano roll: default 1 = 125 pixel / sec");
  slider_len = createInput("1");
  piano_roll_draw = createButton('redraw piano rolls');
  piano_roll_draw.mousePressed(setup_score_and_performance);

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

  // set pitch of selection in performance
  pitchmin = min(table.getColumn("pitch"));
  pitchmax = max(table.getColumn("pitch"));
  incrementy = floor(300/(pitchmax- pitchmin+1));

  pitchminpart = min(tablepart.getColumn("pitch"));
  pitchmaxpart = max(tablepart.getColumn("pitch"));
  incrementypart = floor(300/(pitchmaxpart- pitchminpart+1));

  slider_start_align.elt.value = str(max(0,startmax))
}

//________________- Slider Update -__________________________







//________________- DRAW -__________________________

let starthead = 0;
let playhead = starthead;
let start_time=0;
let pixel_offset_starthead = 0;

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
      playhead = 0.0 + starthead;
      future_notes = notearray.filter(row => (parseFloat(row[1]) >= start))
    }
    else {
      playhead = (current_time-start_time)+starthead;
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
  let xpos = (playhead-starthead)*(width/widthinit)*125-offsets[0]+canvaBuffer_offsets[0]+pixel_offset_starthead;
  strokeWeight(2);
  stroke(240,0,0);
  line(xpos,0,xpos,300);
  strokeWeight(1);
  //text(str(Math.floor(playhead)),xpos,30 );

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
  let xpos_perf = (line_coordinates[0]-start)/dur*width-offsets[0]+canvaBuffer_offsets[0]+pixel_offset_starthead;
  let xpos_score = (line_coordinates[1]-startpart)/durpart*width-offsets[1]+canvaBuffer_offsets[0];
  push()
  strokeWeight(2);
  stroke(default_colors.tapping_line);
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
  console.log("canvabuffer_draw() ");
  canvaBuffer.background(255);
  canvaBuffer.fill(0);
  canvaBuffer.stroke(0);
  canvaBuffer.rect(0,300,canvaBuffer.width,100);



    if (checkbox_times.checked()){
      canvaBuffer.push()
      
      canvaBuffer.strokeWeight(1)
      canvaBuffer.textSize(10);
      for (let i = 1; i< widthinit/125; i++){    
        canvaBuffer.stroke(default_colors.timepoints);  
        canvaBuffer.line((i-start%1)*width/widthinit*125-offsets[0],0,(i-start%1)*width/widthinit*125-offsets[0],300);
        canvaBuffer.fill(default_colors.timepoints_text);
        canvaBuffer.stroke(default_colors.timepoints_text);
        canvaBuffer.text(str(Math.round(i+start-start%1))+" sec", (i-start%1)*width/widthinit*125-offsets[0], 310);
      }
      canvaBuffer.pop()
    }
    if (checkbox_beat_times.checked()){
      canvaBuffer.push()
      
      canvaBuffer.strokeWeight(1)
      canvaBuffer.textSize(10);
      for (let i = 0; i< durpart; i++){   
        canvaBuffer.stroke(default_colors.timepoints);   
        canvaBuffer.line((i-startpart%1)*width/durpart-offsets[1],400,(i-startpart%1)*width/durpart-offsets[1],700);
        canvaBuffer.stroke(default_colors.timepoints_text);
        canvaBuffer.fill(default_colors.timepoints_text);
        canvaBuffer.text(str(Math.round(i+startpart-startpart%1))+" beats", (i-startpart%1)*width/durpart-offsets[1], 398);
      }
      canvaBuffer.pop()
    }
    

    if (checkbox_writing.checked()){
      canvaBuffer.push()
      canvaBuffer.textSize(300);
      canvaBuffer.fill(default_colors.background_text);
      canvaBuffer.stroke(255);
      canvaBuffer.text('performance', 125, 200);
      canvaBuffer.text('score', 125, 600);
      canvaBuffer.pop();
    }
    
    if (checkbox_system.checked()){
      system_lines.display();
    }

    if (checkbox_key.checked()){
      for(var i = 0; i < keyblocks.length; i++){
        keyblocks[i].display([0,0],false);
      }
    }


  for(var i = 0; i < notes.length; i++){
    notes[i].display(offsets,checkbox_pitch.checked());
  }



  if (checkbox_vel.checked()){
    for(var i = 0; i < notes.length; i++){
      notes[i].feature_display_vel(offsets);
    }
  }
  if (checkbox_tim.checked()){
    for(var i = 0; i < notes.length; i++){
      notes[i].feature_display_tim(offsets);
    }
  }
  if (checkbox_art.checked()){
    for(var i = 0; i < notes.length; i++){
      notes[i].feature_display_art(offsets);
    }
  }
  if (checkbox_alignment.checked()){
    for (var key in lines) {
    
    lines[key].display(offsets);
    
    }
  }
  if (checkbox_zalignment.checked()){
    for (var key in zlines) {
    
    zlines[key].display(offsets);
    
    }
  }
  if (connect_line) {
    connect_line.display(offsets);
  }

}