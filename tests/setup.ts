// Polyfill DeviceOrientationEvent and DeviceMotionEvent for jsdom
if (typeof globalThis.DeviceOrientationEvent === 'undefined') {
  (globalThis as any).DeviceOrientationEvent = class DeviceOrientationEvent extends Event {
    constructor(type: string, eventInitDict?: EventInit) {
      super(type, eventInitDict);
    }
  };
}

if (typeof globalThis.DeviceMotionEvent === 'undefined') {
  (globalThis as any).DeviceMotionEvent = class DeviceMotionEvent extends Event {
    constructor(type: string, eventInitDict?: EventInit) {
      super(type, eventInitDict);
    }
  };
}
