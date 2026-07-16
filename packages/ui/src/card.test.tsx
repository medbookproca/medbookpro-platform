import { describe, expect, it } from 'vitest';
import { Card } from './card';
describe('Card', () => { it('exports a reusable component', () => { expect(Card).toBeTypeOf('function'); }); });
