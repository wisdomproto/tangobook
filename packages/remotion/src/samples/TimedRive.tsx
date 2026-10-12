import React, { useCallback, useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import { RemotionRiveCanvas } from '@remotion/rive';

// The v4.0.440 integration releases its own handle after loading WASM.
// Keep a second handle until the file and its first canvas draw are ready.
export const TimedRive: React.FC = () => {
  const [handle] = useState(() => delayRender('Rive file and first draw'));
  const ready = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => continueRender(handle)));
  }, [handle]);
  useEffect(() => () => continueRender(handle), [handle]);
  return (
    <RemotionRiveCanvas
      src={staticFile('hangul-sample-20261012/meeting.riv')}
      artboard="Giyok meets A"
      animation="Meet then ga 9 seconds"
      enableRiveAssetCdn={false}
      onLoad={ready}
    />
  );
};
