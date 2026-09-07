/**
 * Robust WebM EBML Duration Injector
 * 
 * Accurately updates or injects duration metadata (0x489) into a WebM Blob
 * even if Chromium generated a placeholder duration (e.g. 1000ms).
 * This ensures Android Gallery, WhatsApp, and browsers recognize the full video duration.
 */

interface EbmlSectionInfo {
  name: string;
  type: 'Container' | 'Uint' | 'Float' | 'Binary' | 'String';
}

const SECTIONS: Record<number, EbmlSectionInfo> = {
  0xa45dfa3: { name: 'EBML', type: 'Container' },
  0x8538067: { name: 'Segment', type: 'Container' },
  0x549a966: { name: 'Info', type: 'Container' },
  0xad7b1: { name: 'TimecodeScale', type: 'Uint' },
  0x489: { name: 'Duration', type: 'Float' },
};

function padHex(hex: string): string {
  return hex.length % 2 === 1 ? '0' + hex : hex;
}

class WebmBase {
  name: string;
  type: string;
  source: Uint8Array = new Uint8Array(0);
  data: any = null;

  constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
  }

  setSource(source: Uint8Array) {
    this.source = source;
    this.updateBySource();
  }

  setData(data: any) {
    this.data = data;
    this.updateByData();
  }

  updateBySource() {}
  updateByData() {}
}

class WebmUint extends WebmBase {
  constructor(name: string = 'Uint') {
    super(name, 'Uint');
  }

  updateBySource() {
    let hex = '';
    for (let i = 0; i < this.source.length; i++) {
      hex += padHex(this.source[i].toString(16));
    }
    this.data = hex;
  }

  updateByData() {
    const length = this.data.length / 2;
    this.source = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      this.source[i] = parseInt(this.data.substring(i * 2, i * 2 + 2), 16);
    }
  }

  getValue(): number {
    return parseInt(this.data, 16);
  }

  setValue(value: number) {
    this.setData(padHex(value.toString(16)));
  }
}

class WebmFloat extends WebmBase {
  constructor(name: string = 'Float') {
    super(name, 'Float');
  }

  private isFloat32(): boolean {
    return this.source.length === 4;
  }

  updateBySource() {
    const reversed = new Uint8Array(this.source).reverse();
    const view = new DataView(reversed.buffer, reversed.byteOffset, reversed.byteLength);
    this.data = this.isFloat32() ? view.getFloat32(0, true) : view.getFloat64(0, true);
  }

  updateByData() {
    const is32 = this.isFloat32();
    const buffer = new ArrayBuffer(is32 ? 4 : 8);
    const view = new DataView(buffer);
    if (is32) {
      view.setFloat32(0, this.data, true);
    } else {
      view.setFloat64(0, this.data, true);
    }
    this.source = new Uint8Array(buffer).reverse();
  }

  getValue(): number {
    return this.data;
  }

  setValue(value: number) {
    this.setData(value);
  }
}

interface ContainerChild {
  id: number;
  data: WebmBase;
}

class WebmContainer extends WebmBase {
  offset: number = 0;
  children: ContainerChild[] = [];

  constructor(name: string = 'Container') {
    super(name, 'Container');
  }

  readByte(): number {
    return this.source[this.offset++];
  }

  readUint(): number {
    const firstByte = this.readByte();
    const bytes = 8 - firstByte.toString(2).length;
    let value = firstByte - (1 << (7 - bytes));
    for (let i = 0; i < bytes; i++) {
      value = value * 256 + this.readByte();
    }
    return value;
  }

  updateBySource() {
    this.children = [];
    this.offset = 0;
    while (this.offset < this.source.length) {
      const id = this.readUint();
      const len = this.readUint();
      const end = Math.min(this.offset + len, this.source.length);
      const childData = this.source.slice(this.offset, end);

      const info = SECTIONS[id] || { name: 'Unknown', type: 'Binary' };
      let child: WebmBase;
      switch (info.type) {
        case 'Container':
          child = new WebmContainer(info.name);
          break;
        case 'Uint':
          child = new WebmUint(info.name);
          break;
        case 'Float':
          child = new WebmFloat(info.name);
          break;
        default:
          child = new WebmBase(info.name, info.type);
          break;
      }
      child.setSource(childData);
      this.children.push({ id, data: child });
      this.offset = end;
    }
  }

  writeUint(x: number, draft: boolean): number {
    let bytes = 1;
    let flag = 0x80;
    while (x >= flag && bytes < 8) {
      bytes++;
      flag *= 0x80;
    }
    if (!draft) {
      let value = flag + x;
      for (let i = bytes - 1; i >= 0; i--) {
        const c = value % 256;
        this.source[this.offset + i] = c;
        value = Math.floor((value - c) / 256);
      }
    }
    this.offset += bytes;
    return bytes;
  }

  writeSections(draft: boolean) {
    this.offset = 0;
    for (let i = 0; i < this.children.length; i++) {
      const item = this.children[i];
      const content = item.data.source;
      this.writeUint(item.id, draft);
      this.writeUint(content.length, draft);
      if (!draft) {
        this.source.set(content, this.offset);
      }
      this.offset += content.length;
    }
  }

  updateByData() {
    this.writeSections(true);
    const totalLength = this.offset;
    this.source = new Uint8Array(totalLength);
    this.writeSections(false);
  }

  getSectionById(id: number): WebmBase | null {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].id === id) {
        return this.children[i].data;
      }
    }
    return null;
  }
}

/**
 * Injects durationMs (in milliseconds) into a WebM Blob
 * Guaranteed to overwrite any existing duration value.
 */
export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const file = new WebmContainer('File');
    file.setSource(new Uint8Array(arrayBuffer));

    const segment = file.getSectionById(0x8538067) as WebmContainer;
    if (!segment) return blob;

    const info = segment.getSectionById(0x549a966) as WebmContainer;
    if (!info) return blob;

    // TimecodeScale: set to 1,000,000 nanoseconds = 1 millisecond
    const timeScale = info.getSectionById(0xad7b1) as WebmUint;
    if (timeScale) {
      timeScale.setValue(1000000);
    }

    // Duration: in milliseconds
    let duration = info.getSectionById(0x489) as WebmFloat;
    if (duration) {
      // Force overwrite existing duration (even if > 0)
      duration.setValue(durationMs);
    } else {
      // Create new Duration Float64 section
      duration = new WebmFloat('Duration');
      duration.source = new Uint8Array(8);
      duration.setValue(durationMs);
      info.children.push({ id: 0x489, data: duration });
    }

    info.updateByData();
    segment.updateByData();
    file.updateByData();

    return new Blob([file.source.buffer as ArrayBuffer], { type: blob.type || 'video/webm' });
  } catch (err) {
    console.warn('[fixWebmDuration] Error patching WebM duration:', err);
    return blob;
  }
}
