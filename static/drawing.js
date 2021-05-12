function compute_piano_roll_display_elements() {
    // full arrays
        start = startmax;
        dur = durmax;
        end = endmax;
        startpart = startmaxpart;
        endpart = endmaxpart;
        durpart= durmaxpart;
        widthinit = 10000/80*dur;
        // (re)size of canvas
        width = widthinit*max(min(Number(slider_len.value()),10),0.1);
        offsets[0] *= max(min(Number(slider_len.value()),10),0.1);
        offsets[1] *= max(min(Number(slider_len.value()),10),0.1);
        console.log("(FULL WIDTH) width, start, end, dur",width, start, end, dur);
        resizeCanvas(windowWidth,700);
        canvaBuffer = createGraphics(windowWidth-canvaBuffer_offsets[2], 700);
    
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
    
        perf[notearray[r][3]] = new NoteRectangle(xx,yy,xe,ye, notearray[r][3], "perf", notearray[r][2]);
        notes.push(perf[notearray[r][3]]);    
      }
      console.log("creating Note Rectangles for score");
      // generate new NoteRectangles for the score
      for (let r = 0; r < notearraypart.length; r++){
        let xxp = (notearraypart[r][1]-startpart)/durpart*width;
        let yyp = 700-(notearraypart[r][2]-pitchminpart+1)*incrementypart;
        let xep = notearraypart[r][0]/durpart*width;
        let yep = incrementypart;
        score[notearraypart[r][3]] = new NoteRectangle(xxp,yyp,xep,yep, notearraypart[r][3], "score", int(notearraypart[r][2]));
        notes.push(score[notearraypart[r][3]]);
      }


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
  

  //________________- Create Keyblocks -__________________________

function generate_keyblocks() {
    keyblocks = [];
    // compute reference key blocks in performance
    let key = max(min(Number(slider_key.value()),11),0);
    for (let p = pitchmin; p < pitchmax; p++){
      if (p%12==key) {
        let xx = 0;
        let yy = 300-(p-pitchmin+1)*incrementy;
        let xe = canvaBuffer.width;
        let ye = incrementy;
        let keyblock = new NoteRectangle(xx,yy,xe,ye, "tonic", "perf");
        keyblock.col = default_colors.keyblock_tonic;
        keyblocks.push(keyblock);
      }
      if (p%12==(key+7)%12) {
        let xx = 0;
        let yy = 300-(p-pitchmin+1)*incrementy;
        let xe = canvaBuffer.width;
        let ye = incrementy;
        let keyblock = new NoteRectangle(xx,yy,xe,ye, "fifth", "perf");
        keyblock.col = default_colors.keyblock_fifth;
        keyblocks.push(keyblock);
      } 
    }
    // compute reference key blocks in score
    for (let p = pitchminpart; p < pitchmaxpart; p++){
      if (p%12==key) {
        let xx = 0;
        let yy = 700-(p-pitchminpart+1)*incrementypart;
        let xe = canvaBuffer.width;
        let ye = incrementypart;
        let keyblock = new NoteRectangle(xx,yy,xe,ye, "tonic", "score");
        keyblock.col = default_colors.keyblock_tonic;
        keyblocks.push(keyblock);
      }
      if (p%12==(key+7)%12) {
        let xx = 0;
        let yy = 700-(p-pitchminpart+1)*incrementypart;
        let xe = canvaBuffer.width;
        let ye = incrementypart;
        let keyblock = new NoteRectangle(xx,yy,xe,ye, "fifth", "score");
        keyblock.col = default_colors.keyblock_fifth;
        keyblocks.push(keyblock);
      } 
    }
  }


// generate arrows

function generate_arrows() {
    
    arrows.push(new Arrow(canvaBuffer_offsets[0]/2, 0*200+150, 20,false, ()=>{offsets[0] -= 100;}));
    arrows.push(new Arrow(canvaBuffer_offsets[0]/2, 1*200+150, 20,false, ()=>{offsets[0] -= 100; offsets[1] -= 100;}));
    arrows.push(new Arrow(canvaBuffer_offsets[0]/2, 2*200+150, 20,false, ()=>{offsets[1] -= 100;}));
    
    arrows.push(new Arrow(canvaBuffer.width+canvaBuffer_offsets[0]*3/2, 0*200+150, 20,true, ()=>{offsets[0] += 100;}));
    arrows.push(new Arrow(canvaBuffer.width+canvaBuffer_offsets[0]*3/2, 1*200+150, 20,true, ()=>{offsets[0] += 100; offsets[1] += 100;}));
    arrows.push(new Arrow(canvaBuffer.width+canvaBuffer_offsets[0]*3/2, 2*200+150, 20,true, ()=>{offsets[1] += 100;}));
    
}

// collectively initialize display elements
function compute_other_display_elements(){
    console.log("computing display elements");
    
    // generate staff lines
    system_lines = new SystemLines (windowWidth);
    // gemerate arrows
    generate_arrows();
        // generate keyblocks
        console.log("computing reference keyblocks and staff lines");
        generate_keyblocks();
    
    
    }
  

    function pitch_spelling(note) {
      //let key = max(min(Number(slider_key.value()),11),0);
      let note_names = ["C","C#", "D","D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

      let offset = int(note.pitch%12)
      let octave = str(int((note.pitch-note.pitch%12)/12)-1);
      note.spelled_pitch = note_names[offset]+octave;
    }