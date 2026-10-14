// Core Collision and Motion Mechanics for Arrows!
// Handles exact 2D grid raycast and swept-segment collision detection.

/**
 * Checks if segment A swept along `dir` (t > 0) collides with fixed segment B.
 * All segments are grid-aligned (horizontal or vertical).
 * Movement direction dir is one of: {dx: 1, dy: 0}, {-1, 0}, {0, 1}, {0, -1}.
 */
export function segmentSweptHitsSegment(ap1, ap2, dir, bp1, bp2) {
  // Transform to (u, v) space where movement is always along +u
  let uA1, vA1, uA2, vA2;
  let uB1, vB1, uB2, vB2;

  if (dir.dx === 1 && dir.dy === 0) {
    uA1 = ap1.x; vA1 = ap1.y; uA2 = ap2.x; vA2 = ap2.y;
    uB1 = bp1.x; vB1 = bp1.y; uB2 = bp2.x; vB2 = bp2.y;
  } else if (dir.dx === -1 && dir.dy === 0) {
    uA1 = -ap1.x; vA1 = ap1.y; uA2 = -ap2.x; vA2 = ap2.y;
    uB1 = -bp1.x; vB1 = bp1.y; uB2 = -bp2.x; vB2 = bp2.y;
  } else if (dir.dx === 0 && dir.dy === 1) {
    uA1 = ap1.y; vA1 = ap1.x; uA2 = ap2.y; vA2 = ap2.x;
    uB1 = bp1.y; vB1 = bp1.x; uB2 = bp2.y; vB2 = bp2.x;
  } else { // dir.dx === 0 && dir.dy === -1
    uA1 = -ap1.y; vA1 = ap1.x; uA2 = -ap2.y; vA2 = ap2.x;
    uB1 = -bp1.y; vB1 = bp1.x; uB2 = -bp2.y; vB2 = bp2.x;
  }

  const uAmin = Math.min(uA1, uA2);
  const uAmax = Math.max(uA1, uA2);
  const vAmin = Math.min(vA1, vA2);
  const vAmax = Math.max(vA1, vA2);

  const uBmin = Math.min(uB1, uB2);
  const uBmax = Math.max(uB1, uB2);
  const vBmin = Math.min(vB1, vB2);
  const vBmax = Math.max(vB1, vB2);

  const isAHorizontalInU = Math.abs(vA1 - vA2) < 0.05;
  const isBHorizontalInU = Math.abs(vB1 - vB2) < 0.05;

  const EPS = 0.05;

  // Case 1: A is horizontal in (u, v) [sweeps along line v = vA for u >= uAmax]
  if (isAHorizontalInU) {
    const vA = vA1;
    if (isBHorizontalInU) {
      // B is also horizontal: collinear collision if on same line v and B is in front of A
      if (Math.abs(vA - vB1) < 0.35) {
        if (uBmax > uAmax + EPS) {
          return true;
        }
      }
    } else {
      // B is vertical (u = uB, v in [vBmin, vBmax])
      // A hits B if vA lies strictly within v range of B, and uB is ahead of uAmax
      if (vA >= vBmin - 0.15 && vA <= vBmax + 0.15) {
        if (uB1 > uAmax + EPS) {
          return true;
        }
      }
    }
  } else {
    // Case 2: A is vertical in (u, v) [sweeps across strip v in [vAmin, vAmax] for u >= uA]
    const uA = uA1;
    if (isBHorizontalInU) {
      // B is horizontal (v = vB, u in [uBmin, uBmax])
      if (vB1 >= vAmin - 0.15 && vB1 <= vAmax + 0.15) {
        if (uBmax > uA + EPS) {
          return true;
        }
      }
    } else {
      // B is vertical (u = uB, v in [vBmin, vBmax])
      // Overlap in v range
      const vOverlap = Math.max(vAmin, vBmin) <= Math.min(vAmax, vBmax) - 0.05;
      if (vOverlap) {
        if (uB1 > uA + EPS) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Checks if arrow moving rigidly in its arrow.direction will collide with other.
 */
export function doesArrowCollide(arrow, other) {
  const dir = arrow.direction;
  for (let i = 0; i < arrow.points.length - 1; i++) {
    const ap1 = arrow.points[i];
    const ap2 = arrow.points[i + 1];

    for (let j = 0; j < other.points.length - 1; j++) {
      const bp1 = other.points[j];
      const bp2 = other.points[j + 1];

      if (segmentSweptHitsSegment(ap1, ap2, dir, bp1, bp2)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if arrow can cleanly exit the board without colliding with any active arrows.
 */
export function canArrowEscape(arrow, activeArrows) {
  for (const other of activeArrows) {
    if (other.id === arrow.id || other.solved) continue;
    if (doesArrowCollide(arrow, other)) {
      return false;
    }
  }
  return true;
}
