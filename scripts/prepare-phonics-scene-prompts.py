"""Concrete scene instructions for the eleven missing approved Korean pages.

Teaching glyphs are typeset after generation rather than trusting model spelling.
"""
import json
from pathlib import Path

root=Path(__file__).resolve().parents[1]/'generated-images/phonics-missing-20261012'
jobs={j['id']:j for j in json.loads((root/'plan.json').read_text(encoding='utf8'))['jobs']}
scenes={
 'kr-h4-u01-p07':('hoya','Two tigers stand side by side under a broad leafy felt tree, Hori left and baby Hoya right. Both raise a paw and trace magic strokes in the air. Hori joyfully opens his mouth and Hoya concentrates. Leave clear empty space above their paws for two teaching vowel glyphs, with a few small golden sparkles.'),
 'kr-h4-u01-p08':('hoya','Wide low angle of a broad leafy felt tree at pink-orange sunset. Hori and baby Hoya are small at the bottom, looking UP into the branches. Hori smiles with arms spread, Hoya leans against him and reaches upward. Two large smooth round pale cream fruit hang side by side clearly at the middle branches. One smaller unripe light green fruit hangs higher.'),
 'kr-h4-u02-p08':('dubu','Wide low angle of a broad leafy felt tree at pink-orange sunset. Hori and Dubu the puppy sit together small at the bottom looking UP. Hori smiles with arms spread and Dubu leans beside him, wagging his tail. Two large smooth round pale cream fruit hang side by side clearly at the middle branches. One smaller unripe light green fruit hangs higher.'),
 'kr-h4-u03-p02':('kongi','Close view of Hori on the left and Kongi the squirrel on the right under a leafy felt tree. Hori holds one large smooth round pale cream fruit at chest height and opens his mouth joyfully. Kongi cups a second large smooth round pale cream fruit in both paws, making a small round mouth. Both fruit faces are clearly visible, separated, facing the viewer, with tiny golden sparkles.'),
 'kr-h4-u04-p02':('toto','Close view of Hori the tiger holding two large smooth round pale cream fruit side by side at chest height. Their blank faces face the viewer clearly. Toto the bunny is on the right, leaning excitedly toward these fruit with upright long ears and open mouth. Hori opens his mouth happily. Soft leafy woodland background and tiny golden sparkles.'),
 'kr-h4-u04-p07':('toto','Hori the tiger left and Toto the bunny right stand side by side under a broad felt tree. Each raises one paw in front of them, tracing magic strokes in the air, with excited open mouths. Toto has upright long ears. Leave clear empty space above their paws for two teaching vowel glyphs, with a few small golden sparkles.'),
 'kr-h4-u04-p08':('toto','Wide low angle of a broad leafy felt tree at pink-orange sunset. Hori and Toto the bunny sit close together small at the bottom looking UP into the branches. Hori spreads his arms happily and Toto tilts his long ears. Two large smooth round pale cream fruit hang side by side clearly at the middle branches. One smaller unripe light green fruit hangs higher.'),
 'kr-h4-u05-p01':('bori','A sunny morning under a broad leafy felt tree. Hori stands on the left, raising his right paw to point UP in surprise. Bori the bear stands on the right with both paws on his cheeks, tilting his head UP in wonder. Exactly THREE smooth round pale yellow fruit glow side by side on one branch high above them. Little flowers at the trunk.'),
 'kr-h4-u05-p02':('bori','Close view under a leafy felt tree. Hori on the left cups one large round pale cream fruit in both paws. Bori the bear on the right holds two more large round pale cream fruit, one in each paw. Exactly three fruit in all, well separated with blank faces clearly facing the viewer. Both characters have excited open mouths and wide eyes. Small golden sparkles around the fruit.'),
 'kr-h4-u05-p07':('bori','Hori left and Bori the bear right stand side by side under a broad felt tree. Each reaches one paw forward and upward, tracing magic strokes in the air. Hori smiles with open mouth, Bori concentrates with a tiny tongue peeking out. Leave clear empty space across the upper half for THREE teaching vowel glyphs, with a few golden sparkles.'),
 'kr-h4-u05-p08':('bori','Wide low angle of a lush broad leafy felt tree at pink-orange sunset. Hori and Bori the bear are small at the bottom looking UP into the branches. Hori spreads his arms happily, Bori drapes one arm around Hori. Exactly three larger round pale cream fruit glow side by side clearly in the middle branches, with many smaller pale fruit scattered through the canopy. Warm celebratory golden sparkles.'),
}
prompt={}
identity={
 'hoya':'Hori is the bigger orange tiger with NO clothes or bib. Hoya is his smaller baby tiger brother wearing ONLY a yellow baby bib, never blue overalls.',
 'dubu':'Hori is the orange tiger with NO clothes or bib. Dubu is the cream white puppy with one brown ear and a red collar with a golden round tag. Neither wears overalls.',
 'kongi':'Hori is the orange tiger with NO clothes or bib. Kongi is the little brown squirrel with a broad striped fluffy tail, cream cheeks and belly, no clothes or bow. No mouse or third character.',
 'toto':'Hori is the orange tiger with NO clothes or bib. Toto is the white bunny with long ears and a red neck bow. Neither wears overalls.',
 'bori':'Hori is the orange tiger with NO clothes, sweater or bib. Bori is the larger light brown bear wearing blue denim overalls. No sweater or third character.'}
for key,(friend,scene) in scenes.items():
 prompt[key]={
  'references':['../'+jobs[key]['bookId']+'-p06.webp'],
  'prompt':('Create one completely NEW full landscape 16:9 photographed handmade needle-felt wool story scene, with the exact two named characters from the approved same-book reference illustration. Preserve their faces, species, wool colours, markings, proportions and rainbow tails if present. '+identity[friend]+' Change their poses completely: '+scene+
   ' Fill the whole background with lush soft green wool woodland trees and grass, not a studio. Warm soft daylight, clear expressive friendly faces. The fruit have completely BLANK smooth surfaces: educational letters will be typeset separately. No letters, symbols, words, writing, labels, numbers, speech bubbles, thought bubbles, character-sheet panels or borders. No bread, whales, lemons, food dishes or unrelated objects.')}
(root/'prompt-overrides.json').write_text(json.dumps(prompt,ensure_ascii=False,indent=2),encoding='utf8')
print('Prepared 11 source-specific scenes; exact teaching glyphs require final composition/review')
