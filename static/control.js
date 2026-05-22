

//________________- Zoom Throttle State -__________________________
// Throttles setup_score_and_performance() during Ctrl+wheel zoom to at most once every 500 ms.
// Position values are still updated on every wheel event so the zoom math stays responsive;
// only the heavy redraw (setup_the_pianorolls + compute_piano_roll_display_elements + …)
// is rate-limited.
var _zoom_last_update_ms = 0;
const ZOOM_UPDATE_INTERVAL_MS = 50;

//________________- AlignmentManager - Centralized Alignment CRUD -__________________________

const AlignmentManager = {
    // --- Read ---
    get_partners: function(note_id, note_type) {
        // Returns array of partner IDs for a given note from the primary alignment
        // note_type: "perf" or "score"
        const partners = [];
        for (let i = 0; i < alignment.rows.length; i++) {
            const row = alignment.rows[i];
            if (row.arr[1] === "0") { // matchtype === "0"
                if (note_type === "perf" && row.arr[3] === note_id) {
                    partners.push(row.arr[2]); // partid
                } else if (note_type === "score" && row.arr[2] === note_id) {
                    partners.push(row.arr[3]); // ppartid
                }
            }
        }
        return partners;
    },
    
    get_zpartners: function(note_id, note_type) {
        // Same for the reference (z) alignment
        const partners = [];
        for (let i = 0; i < zalignment.rows.length; i++) {
            const row = zalignment.rows[i];
            if (row.arr[1] === "0") { // matchtype === "0"
                if (note_type === "perf" && row.arr[3] === note_id) {
                    partners.push(row.arr[2]); // partid
                } else if (note_type === "score" && row.arr[2] === note_id) {
                    partners.push(row.arr[3]); // ppartid
                }
            }
        }
        return partners;
    },
    
    get_all_matches: function() {
        // Returns all (ppartid, partid) pairs where matchtype === "0"
        const matches = [];
        for (let i = 0; i < alignment.rows.length; i++) {
            const row = alignment.rows[i];
            if (row.arr[1] === "0") {
                matches.push([row.arr[3], row.arr[2]]); // [ppartid, partid]
            }
        }
        return matches;
    },

    // --- Create (idempotent) ---
    add_match: function(ppartid, partid) {
        // If (ppartid, partid) already exists with matchtype "0", do nothing.
        // Otherwise add a row with matchtype "0".
        // Remove any existing indel rows for ppartid or partid.
        
        // Check if match already exists
        for (let i = 0; i < alignment.rows.length; i++) {
            const row = alignment.rows[i];
            if (row.arr[1] === "0" && row.arr[3] === ppartid && row.arr[2] === partid) {
                return; // Already exists, idempotent no-op
            }
        }
        
        // Remove any indel rows for these notes
        this._remove_indels_for_notes(ppartid, partid);
        
        // Add the match row
        const newRow = alignment.addRow();
        newRow.setString('ppartid', ppartid);
        newRow.setString('partid', partid);
        newRow.setString('matchtype', "0");
        let last_idx = -1;
        if (alignment.rows.length > 1) {
            last_idx = parseInt(alignment.get(alignment.rows.length-2, "idx"));
        }
        newRow.setString('idx', (last_idx + 1).toString());
    },

    // --- Delete ---
    remove_match: function(ppartid, partid) {
        // Remove the match row if it exists.
        // Add indel rows only if notes have no other matches remaining.
        let found = false;
        for (let i = alignment.rows.length - 1; i >= 0; i--) {
            const row = alignment.rows[i];
            if (row.arr[1] === "0" && row.arr[3] === ppartid && row.arr[2] === partid) {
                alignment.removeRow(i);
                found = true;
            }
        }
        
        if (found) {
            // Check if perf note has other matches
            const perfHasOtherMatches = this._has_other_matches(ppartid, "perf");
            // Check if score note has other matches
            const scoreHasOtherMatches = this._has_other_matches(partid, "score");
            
            // Add indel rows only for notes with no remaining matches
            if (!perfHasOtherMatches) {
                this._add_insertion_indel(ppartid);
            }
            if (!scoreHasOtherMatches) {
                this._add_deletion_indel(partid);
            }
        }
    },
    
    remove_all_for_note: function(note_id, note_type) {
        // Remove every match row involving this note.
        // Add indel rows only for notes that end up with no matches.
        const matches_to_remove = [];
        
        for (let i = alignment.rows.length - 1; i >= 0; i--) {
            const row = alignment.rows[i];
            if (row.arr[1] === "0") {
                if ((note_type === "perf" && row.arr[3] === note_id) ||
                    (note_type === "score" && row.arr[2] === note_id)) {
                    matches_to_remove.push([row.arr[3], row.arr[2]]);
                    alignment.removeRow(i);
                }
            }
        }
        
        const pp_inserted = [];
        const score_deleted = [];
        // Add indel rows only for notes that have no other matches
        for (const [pp, pt] of matches_to_remove) {
            const perfHasOtherMatches = this._has_other_matches(pp, "perf");
            const scoreHasOtherMatches = this._has_other_matches(pt, "score");
            
            if (!perfHasOtherMatches) {
                if (!pp_inserted.includes(pp)) {
                    this._add_insertion_indel(pp);
                    pp_inserted.push(pp);
                }
            }
            if (!scoreHasOtherMatches) {
                if (!score_deleted.includes(pt)) {
                    this._add_deletion_indel(pt);
                    score_deleted.push(pt);
                }
            }
        }
    },

    // --- Rebuild views ---
    rebuild_lines: function() {
        // Clear and rebuild `lines` from the current alignment table.
        // Also updates `linked_notes` on all NoteRectangle instances.
        lines = {};
        
        // Clear all links on notes
        for (var i = 0; i < notes.length; i++) {
            notes[i].clear_links();
        }
        
        // Rebuild from alignment table
        for (let i = 0; i < alignment.rows.length; i++) {
            const row = alignment.rows[i];
            if (row.arr[1] === "0") { // matchtype === "0"
                const ppartid = row.arr[3];
                const partid = row.arr[2];
                
                if (ppartid in perf && partid in score) {
                    const ppartnote = perf[ppartid];
                    const partnote = score[partid];
                    
                    ppartnote.add_link(partid);
                    partnote.add_link(ppartid);
                    
                    const line_key = `${partid}_${ppartid}`;
                    lines[line_key] = new NoteLine(
                        partnote.x, partnote.y,
                        ppartnote.x, ppartnote.y,
                        ppartid, partid, false
                    );
                }
            }
        }
    },
    
    rebuild_zlines: function() {
        // Same for `zlines` and `zlinked_notes`.
        zlines = {};
        
        // Clear all z-links on notes
        for (var i = 0; i < notes.length; i++) {
            notes[i].clear_zlinks();
        }
        
        // Rebuild from zalignment table
        for (let i = 0; i < zalignment.rows.length; i++) {
            const row = zalignment.rows[i];
            if (row.arr[1] === "0") { // matchtype === "0"
                const ppartid = row.arr[3];
                const partid = row.arr[2];
                
                if (ppartid in perf && partid in score) {
                    const ppartnote = perf[ppartid];
                    const partnote = score[partid];
                    
                    ppartnote.add_zlink(partid);
                    partnote.add_zlink(ppartid);
                    
                    const line_key = `${partid}_${ppartid}`;
                    zlines[line_key] = new NoteLine(
                        partnote.x, partnote.y,
                        ppartnote.x, ppartnote.y,
                        ppartid, partid, true
                    );
                }
            }
        }
    },

    // --- Table utilities ---
    find_rows: function(note_id, column_name) {
        // Returns ALL matching rows (not just the first).
        const results = [];
        for (let i = 0; i < alignment.rows.length; i++) {
            if (alignment.rows[i].obj[column_name] === note_id) {
                results.push([alignment.rows[i], i]);
            }
        }
        return results;
    },
    
    remove_all_rows: function(note_id, column_name) {
        // Removes every row matching note_id in column_name.
        for (let i = alignment.rows.length - 1; i >= 0; i--) {
            if (alignment.rows[i].obj[column_name] === note_id) {
                alignment.removeRow(i);
            }
        }
    },
    
    // --- Private helpers ---
    _remove_indels_for_notes: function(ppartid, partid) {
        // Remove any indel rows for these notes
        console.log("remove indel lines for", ppartid, partid)
        for (let i = alignment.rows.length - 1; i >= 0; i--) {
            const row = alignment.rows[i];
            if (row.arr[1] === "1" || row.arr[1] === "2") {
                if (row.arr[2] === partid || row.arr[3] === ppartid) {
                    alignment.removeRow(i);
                }
            }
        }
    },
    
    _has_other_matches: function(note_id, note_type) {
        // Check if a note has any other matches remaining
        for (let i = 0; i < alignment.rows.length; i++) {
            const row = alignment.rows[i];
            if (row.arr[1] === "0") {
                if (note_type === "perf" && row.arr[3] === note_id) {
                    return true;
                }
                if (note_type === "score" && row.arr[2] === note_id) {
                    return true;
                }
            }
        }
        return false;
    },
    
    _add_insertion_indel: function(ppartid) {
        // Add insertion indel (perf note not in score)
        const row = alignment.addRow();
        row.setString('ppartid', ppartid);
        row.setString('partid', "undefined");
        row.setString('matchtype', "2");
        let last_idx = -1;
        if (alignment.rows.length > 1) {
            last_idx = parseInt(alignment.get(alignment.rows.length-2, "idx"));
        }
        row.setString('idx', (last_idx + 1).toString());
    },
    
    _add_deletion_indel: function(partid) {
        // Add deletion indel (score note not in performance)
        const row = alignment.addRow();
        row.setString('ppartid', "undefined");
        row.setString('partid', partid);
        row.setString('matchtype', "1");
        let last_idx = -1;
        if (alignment.rows.length > 1) {
            last_idx = parseInt(alignment.get(alignment.rows.length-2, "idx"));
        }
        row.setString('idx', (last_idx + 1).toString());
    }
};

//________________- Selection State -__________________________

const Selection = {
    mode: "single",   // "single" | "pair" | "region"
    left_note:  null,  // NoteRectangle or null
    right_note: null,  // NoteRectangle or null
    region:    null,   // { type, x_start, x_end, y_start, y_end } or null

    clear: function() {
        this.mode = "single";
        this.left_note = this.right_note = this.region = null;
    },

    has_selection: function() {
        return this.left_note !== null || this.region !== null;
    },

    has_pair: function() {
        return this.left_note !== null && this.right_note !== null;
    },
    
    set_left: function(note) {
        this.left_note = note;
        this.mode = "single";
    },
    
    set_right: function(note) {
        this.right_note = note;
        if (this.left_note) {
            this.mode = "pair";
        }
    }
};

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
          console.log(clicked_note);
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
       position.pixel_per_sec += event.delta/1020*position.pixel_per_sec; // change by 10 percent
       position.pixel_per_sec = min(max(position.pixel_per_sec, 5), 5000)
       //print(position.pixel_per_sec, mouse_from_left, position)
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

       // Update width and canvas size for normalized coordinates
       compute_global_sizing();

       // --- Throttled zoom redraw (at most once every ZOOM_UPDATE_INTERVAL_MS) ---
      var now = performance.now();
      if (now - _zoom_last_update_ms >= ZOOM_UPDATE_INTERVAL_MS) {
        _zoom_last_update_ms = now;
        canvabuffer_draw();
        redraw();
      }
      
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

    // Use AlignmentManager for idempotent add
    AlignmentManager.add_match(perf_still, score_still);
    
    // Rebuild lines to ensure consistency
    AlignmentManager.rebuild_lines();
    
    click_cleanup();
  } else {
    alert("mark two notes for alignment...");
  }
}

function change_alignment_one() {
  if (clicked_note && right_clicked_note){
    let perf_still;
    let score_still;
    
    if (clicked_note.type == "perf") {
      perf_still = clicked_note.name;
      score_still = right_clicked_note.name;
    } else {
      perf_still = right_clicked_note.name;
      score_still = clicked_note.name;
    }

    // Use AlignmentManager for the operation
    // First, remove all existing matches for both notes (one-to-one mode)
    AlignmentManager.remove_all_for_note(perf_still, "perf");
    AlignmentManager.remove_all_for_note(score_still, "score");
    
    // Then add the new match
    AlignmentManager.add_match(perf_still, score_still);
    
    // Rebuild lines to ensure consistency
    AlignmentManager.rebuild_lines();
    
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
    // NEW: Support pair deletion
    if (clicked_note && right_clicked_note) {
      // Delete the alignment between the two marked notes
      let perf_id, score_id;
      
      if (clicked_note.type == "perf") {
        perf_id = clicked_note.name;
        score_id = right_clicked_note.name;
      } else {
        perf_id = right_clicked_note.name;
        score_id = clicked_note.name;
      }
      
      // Use AlignmentManager to remove the specific match
      AlignmentManager.remove_match(perf_id, score_id);
      AlignmentManager.rebuild_lines();
      click_cleanup();
    }
    else {
      let clicked_note_neutral = null;
      if (clicked_note) {
        clicked_note_neutral = clicked_note;
      }
      else {
        clicked_note_neutral = right_clicked_note
      }
      
      // check if there is an alignment (fixed: use === instead of ==)
      if (clicked_note_neutral.linked_notes.length === 0) {
        alert("click a note with existing alignment to delete the alignment")
      }
      else {
        // Delete all alignments for this note
        if (clicked_note_neutral.type == "perf") {
          AlignmentManager.remove_all_for_note(clicked_note_neutral.name, "perf");
        } else {
          AlignmentManager.remove_all_for_note(clicked_note_neutral.name, "score");
        }
        AlignmentManager.rebuild_lines();
        click_cleanup();
      }
    }
  }
}