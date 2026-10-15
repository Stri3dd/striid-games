import test from 'node:test';
import assert from 'node:assert/strict';
import {pullDistance,tablePoint,MAX_PULL} from '../games/pool/cue-input.js';

test('pulling opposite the shot direction charges power at any aim angle',()=>{
  const start={x:500,y:250};
  assert.equal(pullDistance(start,{x:420,y:250},0),80);
  assert.ok(Math.abs(pullDistance(start,{x:500,y:170},Math.PI/2)-80)<1e-8);
  const d=80/Math.sqrt(2);
  assert.ok(Math.abs(pullDistance(start,{x:500-d,y:250-d},Math.PI/4)-80)<1e-8);
});
test('sideways and forward gestures never create shot power, and power is capped',()=>{
  const start={x:300,y:200};
  assert.equal(pullDistance(start,{x:400,y:200},0),0);
  assert.equal(pullDistance(start,{x:300,y:100},0),0);
  assert.equal(pullDistance(start,{x:-1000,y:200},0),MAX_PULL);
});
test('touch and mouse positions use table coordinates at responsive sizes',()=>{
  assert.deepEqual(tablePoint(175,120,{left:25,top:20,width:300,height:150},1100,550),{x:550,y:550*2/3});
});
