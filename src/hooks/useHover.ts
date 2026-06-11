import { useState, useCallback, useMemo } from 'react';

/**
 * Tracks pointer hover for web. On touch devices the handlers never fire,
 * so `hovered` simply stays false. Spread `hoverProps` onto a Pressable.
 */
export function useHover() {
  const [hovered, setHovered] = useState(false);
  const onHoverIn = useCallback(() => setHovered(true), []);
  const onHoverOut = useCallback(() => setHovered(false), []);
  const hoverProps = useMemo(() => ({ onHoverIn, onHoverOut }), [onHoverIn, onHoverOut]);
  return { hovered, hoverProps };
}
