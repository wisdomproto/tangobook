import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { TimedRive } from './TimedRive';

const Probe = TimedRive;
registerRoot(() => (
  <Composition
    id="HangulRiveProbe"
    component={Probe}
    width={960}
    height={720}
    fps={30}
    durationInFrames={270}
  />
));
