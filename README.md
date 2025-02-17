# parangonada
... is a visual performance to score alignment visualization and correction tool.
https://sildater.github.io/parangonada/

## how?
It works in with csv files for score, performance, expressive features (dynamics, timing, and articulation), and alignment.
we use 
* [PARTITURA](https://github.com/CPJKU/partitura/tree/master)
to parse and process symbolic music formats and 
* [PARANGONAR](https://github.com/sildater/parangonar)
to create alignments.

There are several datasets with note alignments available:
- [(n)ASAP](https://github.com/CPJKU/asap-dataset)
- [Batik-Plays-Mozart](https://github.com/huispaty/batik_plays_mozart)
- [Vienna 4x22](https://github.com/CPJKU/vienna4x22)

There are different formats to encode matched scores and performances, among them the standalone [Match File Format](https://cpjku.github.io/docs/match/specification/). Partitura parses several of these formats:


For [Parangonada](https://sildater.github.io/parangonada/):
- partitura.io.importparangonada.load_parangonada_alignment (to load just the align.csv file: use this for edited alignments!)
- partitura.io.importparangonada.load_parangonada_csv (to load all csv files used by parangonada)
- partitura.io.exportparangonada.save_parangonada_alignment (to save just an align.csv file)
- partitura.io.exportparangonada.save_parangonada_csv (to save all csv files used by parangonada: use this for visualization!)

For [(n)ASAP alignments](https://github.com/CPJKU/asap-dataset)
- partitura.io.importparangonada.load_alignment_from_ASAP
- partitura.io.exportparangonada.save_alignment_for_ASAP

For [match files](https://cpjku.github.io/matchfile/)
- partitura.io.importmatch.load_match
- partitura.io.exportmatch.save_match

and a basic interface for saving parangonada-ready csv files is also available in parangonagar:
- parangonar.match.save_parangonada_csv

## planned updates 2025:

* fix match deletion for many-to-many alignment
* issues and bug hints are very welcome


done:

2025
* improved csv export for heavily edited files
* erasing all alignments for a fresh start
* experimental many-to-many alignment (thank you QC-Suhit)
OLDER
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