//________________- NoteRectangle Class -__________________________

function NoteRectangle(x, y, xl, yl, 
                        name, type, pitch=0,
                        vel=null, art=null, tim=null, feature_vis = 2) {
    this.x = x;
    this.y = y;
    this.xl = xl;
    this.yl = yl;
    this.col = default_colors.indel;
    this.col_click = default_colors.clicked_note; // color clicked (TURQUOISE)
    this.col_clickr = default_colors.rclicked_note; // color clicked (LIGHT GREEN)
    this.col_line = default_colors.timing; // color timing
    this.col_line1 = default_colors.articulation;  // color articulation
    this.col_line2 = default_colors.velocity;  // color velocity
    this.name = name;
    this.pitch = pitch;
    this.spelled_pitch = "";
    this.linked_note = "";
    this.zlinked_note = "";
    this.textSIZ = 14;
    this.textSIZ_click = 24;
    this.type = type;
    this.offset_id = ["perf", "score"].indexOf(this.type);
    this.clik = false;
    this.rclik = false;
    this.wei = 1;
    this.vel = vel;
    this.art = art;
    this.tim = tim;
    this.feature_vis = feature_vis;
  
    this.color_code_alignments = function(alpha){
      if ((this.linked_note == "") && (this.zlinked_note == "")) {
          
        this.col = color(default_colors.indel.levels.slice(0,3).concat(alpha)); // default color no alignment (RED)
      }
      else if (this.linked_note == this.zlinked_note) {
          
        this.col = color(default_colors.match.levels.slice(0,3).concat(alpha)); // default color agreement in alignment (BLUE)
      }
      else if ((this.linked_note == "") && (this.zlinked_note != "")) {
        this.col = color(default_colors.match2indel1.levels.slice(0,3).concat(alpha)); // default color no alignment in new
      }
      else if ((this.linked_note != "") && (this.zlinked_note == "")) {
        this.col = color(default_colors.match1indel2.levels.slice(0,3).concat(alpha)); // default color no alignment in old (z)
      }
      else {
        this.col = color(default_colors.mismatch.levels.slice(0,3).concat(alpha)); // default color mismatch
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
  
    this.display = function(offsets, pitch_text) {

        let within_canvas = (this.x+this.xl-offsets[this.offset_id]>= 0) && (this.x-offsets[this.offset_id]< canvaBuffer.width);
        if (within_canvas) {
        
        canvaBuffer.push();
      if (this.clik) {
        canvaBuffer.stroke(this.col_click);
        canvaBuffer.strokeWeight(this.wei);
        canvaBuffer.textSize(this.textSIZ_click);
        canvaBuffer.fill(this.col_click);
      }
      else if ( this.rclik) {
        canvaBuffer.stroke(this.col_clickr);
        canvaBuffer.strokeWeight(this.wei);
        canvaBuffer.textSize(this.textSIZ_click);
        canvaBuffer.fill(this.col_clickr);
      }
      else {
        canvaBuffer.stroke(this.col); 
        canvaBuffer.strokeWeight(this.wei);
        canvaBuffer.textSize(this.textSIZ);
        canvaBuffer.fill(this.col);
      }
        canvaBuffer.rect(this.x-offsets[this.offset_id], this.y, this.xl, this.yl);
        if (pitch_text) {
          canvaBuffer.text(this.spelled_pitch, this.x-offsets[this.offset_id],this.y-1);
        } else {
          canvaBuffer.text(this.name, this.x-offsets[this.offset_id],this.y-1);
        }
        
        canvaBuffer.pop();
    }
    }
    this.feature_display_tim = function(offsets) {
      if (this.tim) {
        // timing: the higher the value the earlier the note (more to left)
        canvaBuffer.push();
        canvaBuffer.fill(0,0,0,0);
        canvaBuffer.strokeWeight(2);
        canvaBuffer.stroke(this.col_line)
        canvaBuffer.line(this.x-offsets[this.offset_id],this.y,this.x-offsets[this.offset_id]-this.tim*this.feature_vis, this.y)
        canvaBuffer.circle(this.x-offsets[this.offset_id]-this.tim*this.feature_vis, this.y, 10);
        canvaBuffer.pop();
      }
    };
    this.feature_display_art = function(offsets) {
      if (this.art) {
        // articulation: the higher the value the more staccato the note (= -log(ratio), more to the left)
        canvaBuffer.push();
        canvaBuffer.strokeWeight(2);
        canvaBuffer.fill(0,0,0,0);
        canvaBuffer.stroke(this.col_line1)
        canvaBuffer.line(this.x-offsets[this.offset_id]+this.xl,this.y+this.yl,
                        this.x-offsets[this.offset_id]+this.xl+this.art*this.feature_vis, this.y+this.yl)
        canvaBuffer.circle(this.x-offsets[this.offset_id]+this.xl+this.art*this.feature_vis, this.y+this.yl, 10);
        canvaBuffer.pop();
      }
    };
    this.feature_display_vel = function(offsets) {
      if (this.vel) {
        // velocity: the higher the value the louder the note (more upwards)
        canvaBuffer.push();
        canvaBuffer.strokeWeight(2);
        canvaBuffer.fill(0,0,0,0);
        canvaBuffer.stroke(this.col_line2)
        canvaBuffer.line(this.x-offsets[this.offset_id]+this.xl/2,this.y,this.x-offsets[this.offset_id]+this.xl/2, this.y-this.vel*this.feature_vis)
        canvaBuffer.circle(this.x-offsets[this.offset_id]+this.xl/2, this.y-this.vel*this.feature_vis, 10);
        canvaBuffer.pop();
      }
    };
  
    this.clicked = function(offsets) {
        let local_offset = offsets[this.offset_id]-canvaBuffer_offsets[0];
        
      if(mouseX>=this.x-local_offset && mouseX<this.x+this.xl-local_offset && mouseY>=this.y && mouseY<this.y+this.yl){
      
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


  
    this.right_clicked = function(offsets) {
        let local_offset = offsets[this.offset_id]-canvaBuffer_offsets[0];
        if(mouseX>=this.x-local_offset && mouseX<this.x+this.xl-local_offset && mouseY>=this.y && mouseY<this.y+this.yl){
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
    this.rebase = function() {
        this.clik = false;
    };
    this.right_rebase = function() {
      this.rclik = false;
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
      this.col = default_colors.znoteline;
      this.col_original = default_colors.znoteline;
    }
    else {
      this.col = default_colors.noteline;
      this.col_original = default_colors.noteline;
    }
    
    
    this.wei = 1;
    
    
    this.display = function(offsets) {
      canvaBuffer.push();
      canvaBuffer.stroke(this.col);
      canvaBuffer.strokeWeight(this.wei);
      canvaBuffer.line(score[this.scorenote].x-offsets[1],score[this.scorenote].y, perf[this.perfnote].x-offsets[0],perf[this.perfnote].y);
      canvaBuffer.pop();
    };
  
    this.clicked = function() {
        if (score[this.scorenote].clik || perf[this.perfnote].clik){
            this.col = default_colors.noteline_clicked;
            this.wei = 3;
        } 
        else if (score[this.scorenote].rclik || perf[this.perfnote].rclik){
          this.col = default_colors.noteline_rclicked;
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
    this.col = default_colors.system_lines;
  
    // G2, B2, D3, F3, A3
    this.bassclef_notes = [43,47,50,53,57];
    // E4, G4, B4, D5, F5
    this.trebleclef_notes = [64,67,71,74,77];
    this.all_notes = [43,47,50,53,57,64,67,71,74,77];
    this.ptreble_clef = [0, 700 -(77+4.4-pitchminpart+0.5)*incrementypart, 10*incrementypart,22.1*incrementypart];
    this.treble_clef = [0, 300 -(77+4.4-pitchmin+0.5)*incrementy, 10*incrementy,22.1*incrementy];
    this.pbass_clef = [0, 700 -(57-pitchminpart+0.5)*incrementypart, 8*incrementypart,12*incrementypart];
    this.bass_clef = [0, 300 -(57-pitchmin+0.5)*incrementy, 8*incrementy,12*incrementy];


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
      canvaBuffer.stroke(this.col);
      canvaBuffer.strokeWeight(this.wei);
      this.ycoord_lines.forEach(y => { 
        canvaBuffer.line(0,y,this.width,y);});
      this.ycoord_plines.forEach(y => {
        canvaBuffer.line(0,y,this.width,y);});
    
    canvaBuffer.pop();
    canvaBuffer.image(treble_clef, ...this.ptreble_clef);
    canvaBuffer.image(treble_clef, ...this.treble_clef);
    canvaBuffer.image(bass_clef, ...this.pbass_clef);
    canvaBuffer.image(bass_clef, ...this.bass_clef);
    }
  
  }

//____________________________SystemLines Class______________________________________________________________
  
  function Arrow (x,y, radius,orientation, callback) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.orientation = orientation;
    
    this.callback = callback;
    this.wei = 1;
    this.col = default_colors.arrow;
    this.colback = default_colors.arrow_background;
  
    this.compute_corners = function() {
        
        if (this.orientation) {
            //this.corners = [this.x+this.radius, this.y, this.x-0.5*this.radius, this.y+ 0.75*this.radius,this.x-0.5*this.radius, this.y- 0.75*this.radius ];
            this.corners = [this.x-this.radius*3/4, this.y+this.radius,
                            this.x-this.radius*3/4, this.y-this.radius,
                            this.x+this.radius*3/4, this.y]
        }
        else {
            this.corners = [this.x+this.radius*3/4, this.y+this.radius,
                            this.x+this.radius*3/4, this.y-this.radius,
                            this.x-this.radius*3/4, this.y]
        }
        
    }
    this.compute_corners();

    this.display = function() {
      push();
      strokeWeight(this.wei);
      fill(this.colback);
      stroke(this.colback);
      rectMode(CENTER);
      rect(this.x, this.y, this.radius*2+6, this.radius*2+6 )
      fill(this.col);
      stroke(this.col);
      triangle(...this.corners)
      pop();
    } 
    this.clicked = function () {
        if(mouseX>=this.x-this.radius&& mouseX<this.x+this.radius && mouseY>=this.y-this.radius && mouseY<this.y+this.radius){
         this.callback()
        }
    }
   
  
  }