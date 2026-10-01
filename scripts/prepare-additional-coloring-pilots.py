"""Prepare two read-and-selected pages per new collection; generation is separate."""
import importlib.util
import os
from pathlib import Path

pilots = {
    'hori-life': {'01. 골고루 먹으면 무지개 힘!': [2, 7]},
    'hori-kindergarten': {'01. 다들 어디 가?': [6, 9]},
    'hori-vehicles': {'01. 삐뽀삐뽀 불자동차': [3, 8]},
    'nature': {'강아지': [11, 13]},
}
os.environ['SCENE_COLORING_PARTIAL_SELECTION'] = '1'
for collection, selection in pilots.items():
    os.environ['SCENE_COLORING_ROOT'] = 'D:/ComfyUI-output/classic-scene-coloring/' + collection
    os.environ['SCENE_COLORING_COLLECTION'] = collection
    specification = importlib.util.spec_from_file_location('production', Path(__file__).with_name('classic-scene-coloring.py'))
    production = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(production)
    production.SELECTION = selection
    production.prepare()
