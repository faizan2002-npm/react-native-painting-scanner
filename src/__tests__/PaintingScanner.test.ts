import PaintingScanner from '../index';

describe('PaintingScanner', () => {
  it('should be defined', () => {
    expect(PaintingScanner).toBeDefined();
  });

  it('should have scanPainting method', () => {
    expect(PaintingScanner.scanPainting).toBeDefined();
    expect(typeof PaintingScanner.scanPainting).toBe('function');
  });

  it('should have getVersion method', () => {
    expect(PaintingScanner.getVersion).toBeDefined();
    expect(typeof PaintingScanner.getVersion).toBe('function');
  });

  it('should have isAvailable method', () => {
    expect(PaintingScanner.isAvailable).toBeDefined();
    expect(typeof PaintingScanner.isAvailable).toBe('function');
  });
});

