

//________________- Keyboard Input -__________________________

function keyTyped() {
    if (key === 'a') {
      change_alignment();
    }
    if (key === 's') {
      delete_alignment();
    }
    if (key === 't' && playing) {
      add_line();
    } 
    if (key === 'r' && !playing) {
      remove_line();
    } 
    if (key === 'z') {
      if (playing){
        //console.log("stop", playing)
        stop_loop();
      }
      else {
      //console.log("start", playing)
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
      canvabuffer_draw();
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
  if (mouseX > canvaBuffer_offsets[0] && mouseX < canva.width-canvaBuffer_offsets[1] ){
      if (mouseButton === LEFT) {
          connect_line = null;
          note_one_div.html('no note clicked');
          clicked_note=null;
        for(var i = 0; i < notes.length; i++){
          notes[i].rebase();
          }
        for(var i = 0; i < notes.length; i++){
          notes[i].clicked(position.offsets());
        
          }
        }
        if (mouseButton === RIGHT) {
          right_clicked_note=null;
          note_two_div.html('no note right clicked');
          for(var i = 0; i < notes.length; i++){
            notes[i].right_rebase();
          }
          for(var i = 0; i < notes.length; i++){
            notes[i].right_clicked(position.offsets());
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
            alert("both notes are from the same piano roll");
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
            connect_line.col = default_colors.connectline;
      
          }
        }
        for(key in lines){
          lines[key].clicked();
        }
        canvabuffer_draw()
        redraw();
  }
  else {
      for(var i = 0; i < arrows.length; i++){
          arrows[i].clicked();
      }
      canvabuffer_draw()
      redraw();
  }
  
}

//________________- Mouse Wheel -__________________________

function mouseWheel(event) {
  if (mouseX > canvaBuffer_offsets[0] && 
      mouseX < canva.width-canvaBuffer_offsets[1] &&
      mouseY < (canvaHeight)){

    //console.log(event)
    // -- zoom ---
    if (event.ctrlKey) {
      event.preventDefault()

      let mouse_from_left = mouseX - canvaBuffer_offsets[0];
      let current_pixel_per_sec = position.pixel_per_sec;
      let current_pixel_offset = position.offset_performance;
      position.pixel_per_sec += event.delta/2040*position.pixel_per_sec; // change by 10 percent
      position.pixel_per_sec = min(max(position.pixel_per_sec, 5), 5000)
      position.offset_performance = (mouse_from_left + current_pixel_offset)*
                                    (position.pixel_per_sec/current_pixel_per_sec)
                                    - mouse_from_left;
      position.previous_offset_performance = position.offset_performance
      position.starthead = (position.offset_performance+100)/position.pixel_per_sec + start;
      position.increment(0, false, false, false, true);
      //let current_pixel_per_beat = position.pixel_per_beat;
      let current_pixel_offset_score = position.offset_score;
      //position.pixel_per_beat *= position.pixel_per_sec/current_pixel_per_sec;
      position.offset_score = (mouse_from_left + current_pixel_offset_score)*
                                    (position.pixel_per_sec/current_pixel_per_sec)
                                    - mouse_from_left;
      position.previous_offset_score = position.offset_score 
      setup_score_and_performance();
      
    } else if (event.shiftKey) {
      event.preventDefault()

      // shift
      let y = mouseY;
      let d = event.delta;
      if (y <= (canvaHeight-100)/2) {
        position.increment(d, false, true, true, false) 
        
      }
      if (y >= (canvaHeight-100)/2 && y <= (canvaHeight-100)/2+100) {
        position.increment(d, true, true, true, false) 
      }
      if (y >= (canvaHeight-100)/2+100 && y <= (canvaHeight)) {
        position.increment(d, true, false, true, false) 
      }
      canvabuffer_draw()
      redraw();
    }
  }
}

//________________- Input Utils -__________________________

function checkbox_update() {
  canvabuffer_draw();
  redraw();
}

function checkbox_update_key() {
  generate_keyblocks();
  for(var i = 0; i < notes.length; i++){
    pitch_spelling(notes[i]);
  }
  checkbox_update();
}

function note_slider_update() {
  for(var i = 0; i < notes.length; i++){
    notes[i].feature_vis = feature_slider.value();
    notes[i].color_code_alignments( color_slider.value());
    pitch_spelling(notes[i]);
  }
  checkbox_update();
}

function align_slider_update() {
  stop_loop();
  beat_start = parseFloat(slider_beat_start.value());
  beat_interval = parseFloat(slider_beat_interval.value());
  playhead = position.starthead;
  //redraw();
  //console.log("update tapping parameters", beat_start, beat_interval, position.starthead);
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
  note_slider_update();
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
  if (checkbox_many2many.checked()) {
    change_alignment_many();
  }
  else {
    change_alignment_one();
  }
}

function change_alignment_many() {  
  if (clicked_note && right_clicked_note) {
    let perf_still, score_still;

    if (clicked_note.type == "perf") {
      perf_still = clicked_note.name;
      score_still = right_clicked_note.name;
    } else {
      perf_still = right_clicked_note.name;
      score_still = clicked_note.name;
    }

    // Link the notes
    score[score_still].link(perf_still);
    perf[perf_still].link(score_still);
    let line_key = `${score_still}_${perf_still}`;
    lines[line_key] = new NoteLine(score[score_still].x, score[score_still].y,
                                   perf[perf_still].x, perf[perf_still].y, perf_still, score_still, false);

    // Add new alignment to the table
    customAddRowAlignment(perf_still, score_still, "0");
    click_cleanup();
  } else {
    alert("mark two notes for alignment...");
  }
}

function change_alignment_one() {
  if (clicked_note && right_clicked_note){
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

  // reset the notes
  score[score_still].reset();
  perf[perf_still].reset();
  score[score_still].link(perf_still);
  perf[perf_still].link(score_still);
  let line_key_ssps = `${score_still}_${perf_still}`;
  lines[line_key_ssps] = new NoteLine(score[score_still].x,score[score_still].y,
                                              perf[perf_still].x,perf[perf_still].y, perf_still, score_still, false);
  
  customRemoveRow(perf_still, "ppartid",alignment);
  customRemoveRow(score_still, "partid",alignment);
  customAddRowAlignment(perf_still, score_still, "0");
  if (perf_nomore != "") {
    // reset the note
    perf[perf_nomore].reset();
    // delete the line
    let line_key_sspn = `${score_still}_${perf_nomore}`;
    delete lines[line_key_sspn] ;
    // add insertion
    customAddRowAlignment(perf_nomore, "undefined", "2");
  } else if (score_nomore != ""){
    // reset the note
    score[score_nomore].reset();
    // delete the line
    let line_key_snps = `${score_nomore}_${perf_still}`;
    delete lines[line_key_snps] ;
    // add deletion
    customAddRowAlignment("undefined", score_nomore, "1");
  } 
  click_cleanup();
}
else {
  alert("mark two notes for alignment.");
}
}

function customFindRow (value, column, table) {
  // try the Object 
  for (let i = 0; i < table.rows.length; i++) {
    if (table.rows[i].obj[column] === value) {
      return [table.rows[i], i];
    }
  }
}

function customAddRowAlignment (ppid, pid, mt){
  console.log(ppid, pid, mt);
  const newRow = alignment.addRow();
  newRow.setString('ppartid',ppid);
  newRow.setString('partid', pid);
  newRow.setString('matchtype', mt);
  let last_line_idx  = -1;
  if (alignment.rows.length > 1) {
    last_line_idx  = parseInt(alignment.get(alignment.rows.length-2, "idx"));
  } 
  console.log(last_line_idx);
  newRow.setString('idx', (last_line_idx + 1).toString());
}

function customRemoveRow (value, column, table){
  const rowvalues = customFindRow(value, column, table)
  if (typeof rowvalues != "undefined" ){
    const row2idx = rowvalues[1]
    table.removeRow(row2idx);
  }
}

function erase_alignment() {
  alignment.clearRows();
  lines = {};
  zlines = {};
  for(var i = 0; i < notes.length; i++){
    notes[i].reset();
    notes[i].rebase();
    notes[i].right_rebase();
  }
  canvabuffer_draw();
  redraw();
}

function erase_alignment() {
  alignment.clearRows();
  lines = {};
  zlines = {};
  for(var i = 0; i < notes.length; i++){
    notes[i].reset();
    notes[i].rebase();
    notes[i].right_rebase();
  }
  canvabuffer_draw();
  redraw();
}


function erase_alignment_indel() {
  alignment.clearRows();
  lines = {};
  zlines = {};
  for(var i = 0; i < notes.length; i++){
    notes[i].reset();
    notes[i].rebase();
    notes[i].right_rebase();
  }
  canvabuffer_draw();
  redraw();

  Object.keys(score).forEach(k => {
    customAddRowAlignment("undefined", score[k].name, "1");
  })
  Object.keys(perf).forEach(k => {
    customAddRowAlignment(perf[k].name, "undefined", "2");
  })
}



function delete_alignment() {
  // check if something is clicked
  if (clicked_note || right_clicked_note){
    // check if only one is clicked
    if (clicked_note && right_clicked_note) {
      alert("click only one note to delete its alignment");
    }
    else {
      let clicked_note_neutral = null;
      if (clicked_note) {
        clicked_note_neutral = clicked_note;
      }
      else {
        clicked_note_neutral = right_clicked_note
      }
      
      // check if there is an alignment
      if (clicked_note_neutral.linked_note =="") {
        alert("click a note with existing alignment to delete the alignment")
      }



      else {
        // now do the deleting
        let score_nomore;
        let perf_nomore;
        if (clicked_note_neutral.type == "perf")
        {
            score_nomore =  clicked_note_neutral.linked_note;
            perf_nomore =  clicked_note_neutral.name;
        }
        else{
            score_nomore =  clicked_note_neutral.name;
            perf_nomore =  clicked_note_neutral.linked_note;
        }
          // remove row
          customRemoveRow(perf_nomore,"ppartid",alignment);
          // reset the notes
          score[score_nomore].reset();
          perf[perf_nomore].reset();
          // delete the line
          let line_key_snpn = `${score_nomore}_${perf_nomore}`;
          delete lines[line_key_snpn] ;
          // add deletion
          customAddRowAlignment("undefined", score_nomore, "1");
          // add insertion
          customAddRowAlignment(perf_nomore, "undefined", "2");
        

        click_cleanup();

      }
    }
  }
}