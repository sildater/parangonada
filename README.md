# parangonada
... is a performance to score alignment visualization and correction tool.
https://sildater.github.io/parangonada/

## how?
It works in with csv files for score, performance, expressive features (dynamics, timing, and articulation), and alignment.
It's possible to generate this file structure from any kind of alignment encoding, we use:
* [PARTITURA](https://github.com/CPJKU/partitura/tree/master)
* [BASISMIXER](https://github.com/OFAI/basismixer)

to visualize files in the match file format. Other references:
* [MATCHMAKER](https://github.com/CPJKU/partitura/tree/master)
* [MATCH DOCUMENTATION](https://github.com/CPJKU/partitura/tree/master)

## planned updates:

* match file format reference
* tutorial video

done:
* playhead for beat tapping follows the window
* *shift* + mouse wheel to zoom
* mouse wheel shift of pianorolls
* more appealing color palette for notes
* fix alignment export
* somewhat documented code
* cleaned DOM interface
* simple python API to generate alignment data files
* pitch names toggle
* black staff lines
* clefs
* default option full piece!
* scroll option (update left and right)