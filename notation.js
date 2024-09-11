import {
  add,
  lerp,
  normalize,
  rotateQuarterXY,
  sub,
  mul,
  distance,
} from "./vec.js";

const c = document.getElementById("c");
const ctx = c.getContext("2d");

function drawLine(l) {
  if (l.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(...l[0]);
  for (const p of l) {
    ctx.lineTo(...p);
  }
  ctx.stroke();
}

function drawCircle(p, r) {
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], r, r, 0, 0, Math.PI * 2);
  ctx.stroke();
}

class Handle {
  static all = [];
  constructor(x, y) {
    this.p = [x, y];
    Handle.all.push(this);
  }

  set(x, y) {
    this.p[0] = x;
    this.p[1] = y;
  }

  get x() {
    return this.p[0];
  }
  set x(n) {
    this.p[0] = n;
  }
  get y() {
    return this.p[1];
  }
  set y(n) {
    this.p[1] = n;
  }

  distanceTo(p) {
    return Math.hypot(this.x - p[0], this.y - p[1]);
  }
}

class Op {
  static all = [];
  constructor(start, end) {
    this.start = start;
    this.end = end;
    Op.all.push(this);
  }

  getPrevOp() {
    return Op.all.find((op) => {
      return op.end === this.start;
    });
  }
  getNextOp() {
    return Op.all.find((op) => {
      return op.start === this.end;
    });
  }
}

class CreateOp extends Op {
  draw() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";

    drawLine([this.start.p, this.end.p]);

    drawCircle(this.start.p, 30);
    ctx.fill();

    ctx.fillStyle = "black";
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

class ScaleOp extends Op {
  draw() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";

    drawLine([this.start.p, this.end.p]);

    this.length = distance(this.start.p, this.end.p);

    const scaleFactor = this.length * 0.2;

    const normalised = normalize(sub(this.start.p, this.end.p));
    const left = add(this.end.p, mul(scaleFactor, rotateQuarterXY(normalised)));
    const right = sub(
      this.end.p,
      mul(scaleFactor, rotateQuarterXY(normalised))
    );

    drawLine([this.start.p, left]);
    drawLine([this.start.p, right]);

    ctx.fillStyle = "black";
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

class Value {
  op = null;
  time = null;
  p = null;

  value = 0;
  constructor(op, time, p = null) {
    this.op = op;
    this.time = time;
    this.p = p;
  }

  go(t = 0.005) {
    const newTime = this.time + t;
    if (newTime > 1) {
      // go to next op
      const nextOp = this.op.getNextOp();
      if (!nextOp) return false;
      this.op = nextOp;
      this.time = newTime - 1;
      this.p = lerp([this.op.start.p, this.op.end.p])(this.time);
    } else if (newTime < 0) {
      // go to prev op
      const prevOp = this.op.getPrevOp();
      if (!prevOp) return false;
      this.op = prevOp;
      this.time = 1 + newTime;
      this.p = lerp([this.op.start.p, this.op.end.p])(this.time);
    } else {
      this.time = newTime;
      this.p = lerp([this.op.start.p, this.op.end.p])(this.time);
    }
  }
}

let co = new CreateOp(new Handle(200, 200), new Handle(200, 100));
let so = new ScaleOp(co.end, new Handle(300, 100));

const myFirstValue = new Value(co, 0);
// console.log(co.getNextOp());

let dragging = null;
window.addEventListener("mousedown", (e) => {
  // find handles
  for (const h of Handle.all) {
    if (h.distanceTo([e.clientX, e.clientY]) < 30) {
      dragging = h;
      break;
    }
  }
});

window.addEventListener("mousemove", (e) => {
  if (dragging) {
    dragging.set(e.offsetX, e.offsetY);
  }
});

window.addEventListener("mouseup", (e) => {
  if (dragging) {
    dragging = null;
  }
});

function tick() {
  ctx.clearRect(0, 0, c.width, c.height);
  Op.all.forEach((op) => op.draw());
  myFirstValue.go();
  console.log("myFirstValue", myFirstValue.p);
  drawCircle(myFirstValue.p, 10);
  requestAnimationFrame(tick);
}

tick();
