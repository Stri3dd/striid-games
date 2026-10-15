export const MAX_PULL = 160;
export const MIN_PULL = 8;

// Only movement backwards along the locked cue direction adds shot power.
// Sideways movement and movement towards the target do not charge the cue.
export function pullDistance(start,point,angle,maxPull=MAX_PULL){
  const backwards=(start.x-point.x)*Math.cos(angle)+(start.y-point.y)*Math.sin(angle);
  return Math.max(0,Math.min(maxPull,backwards));
}

export function tablePoint(clientX,clientY,rect,width,height){
  return {x:(clientX-rect.left)*width/rect.width,y:(clientY-rect.top)*height/rect.height};
}
