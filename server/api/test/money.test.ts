import { describe, it, expect, beforeEach } from 'vitest';
import { DEC } from 'precise-money';
import { toUnits, fromUnits, buildPriceRatio, convertUnits } from '../src/money.js';

describe('money shim', () => {
  beforeEach(() => {
    // Set up DEC registry for each test
    DEC.set('USD', 2);
    DEC.set('USDC', 6);
    DEC.set('TOKEN', 7);
    DEC.set('BRL', 2);
  });

  it('toUnits/fromUnits roundtrip', () => {
    const m = toUnits('USDC', '1.234567'); // 6 casas
    expect(fromUnits('USDC', m)).toBe('1.234567');
  });

  it('toUnits with different symbols', () => {
    const usdc = toUnits('USDC', '12.345678'); // 6 casas
    expect(usdc).toBe(12345678n);
    
    const token = toUnits('TOKEN', '1.2345678'); // 7 casas
    expect(token).toBe(12345678n);
    
    const brl = toUnits('BRL', '10.50'); // 2 casas
    expect(brl).toBe(1050n);
  });

  it('buildPriceRatio + convertUnits 2→7', () => {
    const pr = buildPriceRatio('USD', 'TOKEN', '5.43'); // USD por 1 TOKEN
    const usdMinor = toUnits('USD', '10.50');           // 1050n
    const out = convertUnits(usdMinor, 'USD', 'TOKEN', pr);
    expect(out).toBe(570_200_000n); // 10.50 / 5.43 * 10^7 = 570200000
  });

  it('buildPriceRatio with BRL', () => {
    const pr = buildPriceRatio('BRL', 'USDC', '5.25'); // BRL por 1 USDC
    expect(pr.num).toBe(525n);
    expect(pr.den).toBe(100n);
  });

  it('convertUnits BRL to USDC', () => {
    const pr = buildPriceRatio('BRL', 'USDC', '5.25'); // BRL por 1 USDC
    const brlMinor = toUnits('BRL', '10.50'); // 1050n
    const usdcMinor = convertUnits(brlMinor, 'BRL', 'USDC', pr);
    expect(usdcMinor).toBe(55130000n); // 10.50 / 5.25 * 10^6 = 55130000 (arredondado)
  });

  it('fail fast when symbol missing', () => {
    expect(() => toUnits('UNKNOWN', '1')).toThrow(/Missing decimals for symbol: UNKNOWN/);
    expect(() => fromUnits('UNKNOWN', '1000')).toThrow(/Missing decimals for symbol: UNKNOWN/);
    expect(() => buildPriceRatio('UNKNOWN', 'USDC', '1.0')).toThrow(/Missing decimals for symbol: UNKNOWN/);
  });

  it('handles different input types for fromUnits', () => {
    const amount = 12345678n;
    expect(fromUnits('USDC', amount)).toBe('12.345678');
    expect(fromUnits('USDC', '12345678')).toBe('12.345678');
    expect(fromUnits('USDC', 12345678)).toBe('12.345678');
  });

  it('toUnits with rounding options', () => {
    // Test with floor rounding
    const floor = toUnits('USDC', '1.2345678', { mode: 'floor' });
    expect(floor).toBe(1234567n);
    
    // Test with ceil rounding  
    const ceil = toUnits('USDC', '1.2345678', { mode: 'ceil' });
    expect(ceil).toBe(1234568n);
  });
});
