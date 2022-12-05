//________________- Size the global elements with data constraints -__________________________

function compute_global_sizing() {
  if (position.starthead == 0){
    position.starthead = max(0, start)
  }
  widthinit = 125*dur;//125 pixel / sec
  width = dur*position.pixel_per_sec;
  position.pixel_per_beat = width/durpart;
  // (re)size of canvases
  //console.log("(FULL WIDTH) width, start, end, dur", width, start, end, dur);
  resizeCanvas(windowWidth-70,canvaHeight);
  canvaBuffer.resizeCanvas(windowWidth-70-canvaBuffer_offsets[2], canvaHeight);
}


//________________- Setup The Piano Rolls -__________________________

function setup_the_pianorolls(){
  console.log("setup the pianorolls");
  // find maximal start and end in performance
  startmax = min(table.getColumn('onset_sec'));
  endmax = max(table.getColumn('onset_sec'))+max(table.getColumn('duration_sec'));
  durmax = endmax-startmax; 
  //console.log(startmax, endmax, durmax, "PERFORMANCE: startmax, endmax, durmax")
  startmaxpart = min(tablepart.getColumn('onset_beat'));
  endmaxpart = max(tablepart.getColumn('onset_beat'))+max(tablepart.getColumn('duration_beat'));
  durmaxpart = endmaxpart-startmaxpart; 
  //console.log(startmaxpart, endmaxpart, durmaxpart, "SCORE: startmax, endmax, durmax")

  // set pitch of selection in performance
  pitchmin = min(min(table.getColumn("pitch"))-1,36);
  pitchmax = max(max(table.getColumn("pitch"))+1,84);
  incrementy = floor((canvaHeight-100)/2/(pitchmax- pitchmin+1));

  pitchminpart = min(min(tablepart.getColumn("pitch"))-1,36);
  pitchmaxpart = max(max(tablepart.getColumn("pitch"))+1,84);
  incrementypart = floor((canvaHeight-100)/2/(pitchmaxpart- pitchminpart+1));

  // full arrays
  start = startmax;
  dur = durmax;
  end = endmax;
  startpart = startmaxpart;
  endpart = endmaxpart;
  durpart= durmaxpart;

  compute_global_sizing();
}

//________________- Setup The Piano Roll Elements -__________________________

function compute_piano_roll_display_elements() {

    
        // compute notearrays and match array within the given (start-end)
        //console.log("computing performance notes within limits");
        notearray= onset_offset_in_limits (table, start, end);
        lastonset= notearray[notearray.length-1][1]-start;
        //console.log("computing matches within limits");
        matchl = alignment_ids(notearray, alignment, tablepart, false);
        //console.log("computing secondary matches within limits");
        zmatchl = alignment_ids(notearray, zalignment, tablepart, false);
        //console.log("computing score notes within limits");
        notearraypart= onset_offset_in_limits_p (tablepart, startpart, endpart);

      notes = [];
      perf = {};
      score = {};
      
      //console.log("creating Note Rectangles for performance");
      // generate new NoteRectangles for the performance
      for (let r = 0; r < notearray.length; r++){
        let xx = (notearray[r][1]-start)/dur*width;
        let yy = (canvaHeight-100)/2-(notearray[r][2]-pitchmin+1)*incrementy;
        let xe = notearray[r][0]/dur*width;
        let ye = incrementy;
    
        perf[notearray[r][3]] = new NoteRectangle(xx,yy,xe,ye, notearray[r][3], "perf", notearray[r][2]);
        notes.push(perf[notearray[r][3]]);    
      }
      //console.log("creating Note Rectangles for score");
      // generate new NoteRectangles for the score
      for (let r = 0; r < notearraypart.length; r++){
        let xxp = (notearraypart[r][1]-startpart)/durpart*width;
        let yyp = canvaHeight-(notearraypart[r][2]-pitchminpart+1)*incrementypart;
        let xep = notearraypart[r][0]/durpart*width;
        let yep = incrementypart;
        score[notearraypart[r][3]] = new NoteRectangle(xxp,yyp,xep,yep, notearraypart[r][3], "score", parseInt(notearraypart[r][2]));
        notes.push(score[notearraypart[r][3]]);
      }


        // generate lines
        //console.log("creating Match lines ");
        lines_from_matchl();
        //console.log("creating Match lines original");
        zlines_from_zmatchl();

          //__________________________________________________________________________________________
    // add articulation to score notes
    //console.log("creating performance features");
    for (let r = 0; r < feature.getRowCount(); r++){
    if (feature.getColumn("id")[r] in score) {
        
        score[feature.getColumn("id")[r]].vel = feature.getColumn("velocity")[r];
        score[feature.getColumn("id")[r]].art = feature.getColumn("articulation")[r];
        score[feature.getColumn("id")[r]].tim = feature.getColumn("timing")[r];
    }

    }

    

}

//________________- Helpers for PR element setup -__________________________


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


//________________- Helpers for other element setup -__________________________

//________________- Create Keyblocks -__________________________

function generate_keyblocks() {
    keyblocks = [];
    // compute reference key blocks in performance
    let key = max(min(Number(slider_key.value()),11),0);
    for (let p = pitchmin; p < pitchmax; p++){
      if (p%12==key) {
        let xx = 0;
        let yy = (canvaHeight-100)/2-(p-pitchmin+1)*incrementy;
        let xe = canvaBuffer.width;
        let ye = incrementy;
        let keyblock = new NoteRectangle(xx,yy,xe,ye, "tonic", "perf");
        keyblock.col = default_colors.keyblock_tonic;
        keyblocks.push(keyblock);
      }
      if (p%12==(key+7)%12) {
        let xx = 0;
        let yy = (canvaHeight-100)/2-(p-pitchmin+1)*incrementy;
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
        let yy = canvaHeight-(p-pitchminpart+1)*incrementypart;
        let xe = canvaBuffer.width;
        let ye = incrementypart;
        let keyblock = new NoteRectangle(xx,yy,xe,ye, "tonic", "score");
        keyblock.col = default_colors.keyblock_tonic;
        keyblocks.push(keyblock);
      }
      if (p%12==(key+7)%12) {
        let xx = 0;
        let yy = canvaHeight-(p-pitchminpart+1)*incrementypart;
        let xe = canvaBuffer.width;
        let ye = incrementypart;
        let keyblock = new NoteRectangle(xx,yy,xe,ye, "fifth", "score");
        keyblock.col = default_colors.keyblock_fifth;
        keyblocks.push(keyblock);
      } 
    }
  }

///________________- Create Arrows -__________________________

function generate_arrows() {
    let yoff = (canvaHeight-100)/4;
    let yinc = yoff+ 50;
    arrows = Array();
    arrows.push(new Arrow(canvaBuffer_offsets[0]/2, 0*yinc+yoff, 20,false, 
      ()=>{position.increment(-100, false, true, true, false) }));
    arrows.push(new Arrow(canvaBuffer_offsets[0]/2, 1*yinc+yoff, 20,false, 
      ()=>{position.increment(-100, true, true, true, false) }));
    arrows.push(new Arrow(canvaBuffer_offsets[0]/2, 2*yinc+yoff, 20,false, 
      ()=>{position.increment(-100, true, false, true, false) }));
    
    arrows.push(new Arrow(canvaBuffer.width+canvaBuffer_offsets[0]*3/2, 0*yinc+yoff, 20,true, 
      ()=>{position.increment(100, false, true, true, false) }));
    arrows.push(new Arrow(canvaBuffer.width+canvaBuffer_offsets[0]*3/2, 1*yinc+yoff, 20,true, 
      ()=>{position.increment(100, true, true, true, false) }));
    arrows.push(new Arrow(canvaBuffer.width+canvaBuffer_offsets[0]*3/2, 2*yinc+yoff, 20,true, 
      ()=>{position.increment(100, true, false, true, false) }));
    
}

//________________- Initialize all other display elements -__________________________
function compute_other_display_elements(){
    //console.log("computing display elements: system, key blocks, arrow");
    // generate staff lines
    system_lines = new SystemLines (windowWidth);
    // gemerate arrows
    generate_arrows();
    // generate keyblocks
    generate_keyblocks();
    } 
